"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { loadVirtualProfiles, VirtualProfile } from '@/lib/virtualProfiles';
import { FallbackPoolManager } from '@/lib/auctionFallbackPool';
import Link from 'next/link';

interface Comment {
    id: string;
    user_id?: string;
    virtual_user_id?: string;  // 虛擬用戶 ID（可點擊連結）
    user_name: string;
    content: string;
    created_at: string;
    is_simulated?: boolean;
    is_own?: boolean; // 是否為自己的留言
}

interface AuctionCommentsProps {
    auctionId: string;
    auctionTitle?: string;
    isActive: boolean;
    currentUserName?: string | null;
}

export default function AuctionComments({
    auctionId,
    auctionTitle = '',
    isActive,
    currentUserName,
    currentPrice = 0,
    endTime = ''
}: AuctionCommentsProps & { currentPrice?: number, endTime?: string | null }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [simulatedComments, setSimulatedComments] = useState<Comment[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [user, setUser] = useState<{ id: string; name: string } | null>(null);
    const commentsEndRef = useRef<HTMLDivElement>(null);

    // 追蹤已回覆的真實用戶（每人回覆次數限制）
    const repliedUsersRef = useRef<Map<string, number>>(new Map());
    // 追蹤模擬用戶（用於相互 @）
    const activeSimUsersRef = useRef<VirtualProfile[]>([]);
    // 快取的虛擬用戶列表
    const virtualProfilesRef = useRef<VirtualProfile[]>([]);
    // 追蹤是否已初始化模擬留言（避免重複初始化）
    const simulationInitializedRef = useRef(false);
    // 用 ref 追蹤最新的 comments（避免 useEffect 依賴 comments state）
    const commentsRef = useRef<Comment[]>([]);
    // Fallback 池管理器（每條用過即刪，用完即停）
    const fallbackPoolRef = useRef<FallbackPoolManager>(new FallbackPoolManager());

    // 取得當前用戶
    useEffect(() => {
        const getUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', authUser.id)
                    .single();
                setUser({
                    id: authUser.id,
                    name: profile?.full_name || currentUserName || '匿名'
                });
            }
        };
        getUser();
    }, [currentUserName]);

    // 載入所有留言（包含真實 + DB 中的模擬留言）
    useEffect(() => {
        const loadComments = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            const { data } = await supabase
                .from('auction_comments')
                .select('*')
                .eq('auction_id', auctionId)
                .order('created_at', { ascending: true })
                .limit(50);

            if (data) {
                setComments(data.map(c => ({
                    ...c,
                    is_simulated: c.is_simulated || false,
                    is_own: authUser ? c.user_id === authUser.id : false
                })));
            }
        };
        loadComments();

        // 即時訂閱新留言（包含模擬留言寫入 DB 的情況）
        const channel = supabase
            .channel(`auction_comments_${auctionId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'auction_comments',
                filter: `auction_id=eq.${auctionId}`
            }, async (payload) => {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                const newComment = payload.new as Comment;
                // 如果是模擬留言（由 triggerSimulatedReply 寫入 DB），從 simulatedComments 移除對應的臨時項目
                if (newComment.is_simulated) {
                    setSimulatedComments(prev => prev.filter(c => c.id !== `pending-reply-${newComment.created_at}`));
                }
                setComments(prev => {
                    // 避免重複（已由樂觀更新或其他途徑加入）
                    if (prev.some(c => c.id === newComment.id)) return prev;
                    return [...prev, {
                        ...newComment,
                        is_simulated: newComment.is_simulated || false,
                        is_own: authUser ? newComment.user_id === authUser.id : false
                    }];
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [auctionId]);

    // 同步 comments 到 ref（讓 useEffect 內部讀最新值，不觸發重跑）
    useEffect(() => {
        commentsRef.current = comments;
    }, [comments]);

    // 同步 simulatedComments 到 ref
    const simulatedCommentsRef = useRef<Comment[]>([]);
    useEffect(() => {
        simulatedCommentsRef.current = simulatedComments;
    }, [simulatedComments]);

    // 初始模擬留言 + 定時新增（使用 FallbackPoolManager，每條不重複，用完即停）
    useEffect(() => {
        if (!isActive) return;

        // 避免重複初始化（例如 React StrictMode 或依賴變化重跑）
        if (simulationInitializedRef.current) return;
        simulationInitializedRef.current = true;

        const pool = fallbackPoolRef.current;

        // 載入虛擬用戶並初始化
        const initSimulation = async () => {
            const profiles = await loadVirtualProfiles();
            virtualProfilesRef.current = profiles;

            if (profiles.length === 0) return;

            // 隨機選兩位虛擬用戶作為初始發言者
            const shuffled = [...profiles].sort(() => Math.random() - 0.5);
            const user1 = shuffled[0];
            const user2 = shuffled[1] || shuffled[0];

            activeSimUsersRef.current = [user1, user2];

            // 初始留言（從 pool 取，用過即消耗）
            const c1 = pool.getComment();
            const c2 = pool.getComment();
            if (!c1 || !c2) return; // 池已空

            const initialSimulated: Comment[] = [
                {
                    id: 'sim-1',
                    user_name: user1.display_name,
                    virtual_user_id: user1.id,
                    content: c1,
                    created_at: new Date(Date.now() - 120000).toISOString(),
                    is_simulated: true
                },
                {
                    id: 'sim-2',
                    user_name: user2.display_name,
                    virtual_user_id: user2.id,
                    content: c2,
                    created_at: new Date(Date.now() - 60000).toISOString(),
                    is_simulated: true
                }
            ];
            setSimulatedComments(initialSimulated);
        };

        initSimulation();

        const getRandomVirtualUser = (): VirtualProfile | null => {
            const profiles = virtualProfilesRef.current;
            if (profiles.length === 0) return null;
            const profile = profiles[Math.floor(Math.random() * profiles.length)];
            // 追蹤活躍的模擬用戶
            if (!activeSimUsersRef.current.find(u => u.id === profile.id)) {
                activeSimUsersRef.current.push(profile);
                if (activeSimUsersRef.current.length > 5) {
                    activeSimUsersRef.current.shift();
                }
            }
            return profile;
        };

        // 每 15-35 秒新增一個模擬留言
        const interval = setInterval(async () => {
            // 先檢查 fallback 池是否枯竭（LLM 失敗時無法降級 → 停止）
            if (pool.isExhausted) {
                clearInterval(interval);
                return;
            }

            const virtualUser = getRandomVirtualUser();
            if (!virtualUser) return;

            // 隨機決定要採取哪種發言行為
            const rand = Math.random();
            let content: string | null = '';
            let simulatedName = virtualUser.display_name;

            try {
                if (rand < 0.2 && user) {
                    // 20% 機率且「有真實登入的觀看者在場」：透過 LLM 生成情境發言
                    let timeState = "熱烈進行中";
                    if (endTime) {
                        const remainingMs = new Date(endTime).getTime() - new Date().getTime();
                        if (remainingMs < 60000) timeState = "即將結標 (最後一分鐘內)";
                        else if (remainingMs > 300000) timeState = "剛開局不久";
                    }

                    const recentChatCtx = [...commentsRef.current, ...simulatedCommentsRef.current]
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .slice(-3)
                        .map(c => `${c.user_name}: ${c.content}`)
                        .join('\n');

                    const response = await fetch('/api/generate-spontaneous', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            auctionTitle,
                            recentChat: recentChatCtx,
                            currentPrice,
                            timeRemaining: timeState
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        content = data.reply;
                        if (data.simulatedName) {
                            simulatedName = data.simulatedName;
                        }
                    } else {
                        throw new Error('Spontaneous API failed');
                    }
                } else if (rand < 0.45 && activeSimUsersRef.current.length > 1) {
                    // 25% 機率：兩個模擬帳號互相 @（從 pool 取，用完即停）
                    const otherUsers = activeSimUsersRef.current.filter(u => u.id !== virtualUser.id);
                    const targetUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];
                    content = pool.getInteraction(targetUser.display_name);
                } else {
                    // 55% 機率：從 fallback 池取一條（用過即消耗）
                    content = pool.getComment();
                }
            } catch {
                // LLM 失敗 → 降級到 fallback 池
                content = pool.getComment();
            }

            if (!content) return; // 池空了，這輪跳過

            const newSimComment: Comment = {
                id: `sim-${Date.now()}`,
                user_name: simulatedName,
                virtual_user_id: virtualUser.id,
                content,
                created_at: new Date().toISOString(),
                is_simulated: true
            };
            setSimulatedComments(prev => [...prev, newSimComment].slice(-25));
        }, 15000 + Math.random() * 20000);

        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive, auctionId]);

    // 觸發模擬 @回覆（延遲 8-15 秒，每個用戶最多回覆 3 次，使用 LLM 生成）
    const triggerSimulatedReply = useCallback((userName: string, userComment: string) => {
        // 每個用戶最多被回覆 3 次
        const replyCount = repliedUsersRef.current.get(userName) || 0;
        if (replyCount >= 3) {
            return;
        }

        const pool = fallbackPoolRef.current;

        // 更新回覆計數
        repliedUsersRef.current.set(userName, replyCount + 1);

        // 延遲 8-15 秒後回覆
        setTimeout(async () => {
            const replyUser = virtualProfilesRef.current[Math.floor(Math.random() * virtualProfilesRef.current.length)];
            let replyContent: string | null;

            try {
                // 收集最近的聊天上下文（使用 ref 讀取最新值）
                const allChats = [...commentsRef.current, ...simulatedCommentsRef.current]
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    .slice(-5)
                    .map(c => `${c.user_name}: ${c.content}`)
                    .join('\n');

                // 查詢目標用戶的收藏摘要 + AI 個人化設定
                let userSummary = '';
                let customSystemPrompt = '';
                const { data: targetProfile } = await supabase
                    .from('profiles')
                    .select('full_name, bio, ai_system_prompt, ai_user_summary')
                    .eq('full_name', userName)
                    .single();
                if (targetProfile?.ai_user_summary) {
                    // 優先使用管理員手動設定的摘要
                    userSummary = targetProfile.ai_user_summary;
                } else if (targetProfile?.bio) {
                    userSummary = targetProfile.bio;
                }
                if (targetProfile?.ai_system_prompt) {
                    customSystemPrompt = targetProfile.ai_system_prompt;
                }
                // 查詢用戶的收藏數量
                const { count: collectionCount } = await supabase
                    .from('distributions')
                    .select('id', { count: 'exact', head: true })
                    .eq('owner_name', userName);

                const res = await fetch('/api/generate-reply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userComment,
                        auctionTitle: auctionTitle,
                        recentChat: allChats,
                        userSummary: userSummary || undefined,
                        userCollectionCount: collectionCount || undefined,
                        customSystemPrompt: customSystemPrompt || undefined,
                    }),
                });

                if (res.ok) {
                    const data = await res.json();
                    replyContent = `@${userName} ${data.reply}`;
                } else {
                    throw new Error('API failed');
                }
            } catch {
                // 降級：從 fallback 池取（用完即停）
                replyContent = pool.getReply(userName);
            }

            if (!replyContent) return; // 池空了，不回覆

            const replyUserName = replyUser?.display_name || '會員**';
            const replyVirtualId = replyUser?.id;
            const replyCreatedAt = new Date().toISOString();

            // 先用臨時 ID 加入 state 立即顯示
            const tempReply: Comment = {
                id: `reply-${Date.now()}`,
                user_name: replyUserName,
                virtual_user_id: replyVirtualId,
                content: replyContent,
                created_at: replyCreatedAt,
                is_simulated: true
            };
            setSimulatedComments(prev => [...prev, tempReply].slice(-25));

            // 同時寫入 DB 持久化（不等待結果）
            supabase
                .from('auction_comments')
                .insert({
                    auction_id: auctionId,
                    user_id: null,
                    user_name: replyUserName,
                    content: replyContent,
                    is_simulated: true,
                    virtual_user_id: replyVirtualId,
                })
                .select()
                .single()
                .then(({ data, error }) => {
                    if (!error && data) {
                        // 用 DB 的真實 ID 替換臨時 ID
                        setSimulatedComments(prev => prev.map(c =>
                            c.id === tempReply.id ? { ...c, id: data.id } : c
                        ));
                    } else {
                        console.warn('Failed to persist simulated reply:', error?.message);
                    }
                });
        }, 8000 + Math.random() * 7000); // 8-15 秒
    }, [auctionTitle, auctionId]);

    // 送出留言
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !user || isSubmitting) return;

        const content = inputValue.trim();
        setIsSubmitting(true);
        setInputValue('');

        // 樂觀更新：立即顯示用戶的留言
        const optimisticComment: Comment = {
            id: `temp-${Date.now()}`,
            user_id: user.id,
            user_name: user.name,
            content,
            created_at: new Date().toISOString(),
            is_simulated: false,
            is_own: true
        };
        setComments(prev => [...prev, optimisticComment]);

        try {
            const { data, error } = await supabase
                .from('auction_comments')
                .insert({
                    auction_id: auctionId,
                    user_id: user.id,
                    user_name: user.name,
                    content
                })
                .select()
                .single();

            if (!error && data) {
                // 用真實資料替換樂觀更新的留言
                setComments(prev => prev.map(c =>
                    c.id === optimisticComment.id
                        ? { ...data, is_simulated: false, is_own: true }
                        : c
                ));
                // 觸發模擬回覆（只會回一次）
                triggerSimulatedReply(user.name, content);
            } else {
                // 發生錯誤，移除樂觀更新的留言
                setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
                setInputValue(content); // 恢復輸入內容
            }
        } catch {
            // 發生錯誤，移除樂觀更新的留言
            setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
            setInputValue(content);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 合併並排序所有留言（去重：DB 中的模擬留言可能同時存在於 comments 和 simulatedComments）
    const dbCommentIds = new Set(comments.map(c => c.id));
    const uniqueSimulated = simulatedComments.filter(c => !dbCommentIds.has(c.id));
    const allComments = [...comments, ...uniqueSimulated]
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .slice(-30); // 只顯示最新 30 條

    // 自動捲動到最新
    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [allComments.length]);

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return '剛剛';
        if (diffMins < 60) return `${diffMins}分鐘前`;
        return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-white/80 mb-3">💬 即時留言</h3>

            {/* 留言列表 */}
            <div className="h-48 overflow-y-auto space-y-3 mb-3 pr-1 scrollbar-thin">
                {allComments.length === 0 ? (
                    <p className="text-xs text-white/40 text-center py-4">還沒有留言，快來說點什麼吧！</p>
                ) : (
                    allComments.map(comment => (
                        <div key={comment.id} className={`flex items-start gap-2 text-xs animate-fadeIn ${comment.is_own ? 'bg-purple-500/10 -mx-2 px-2 py-1 rounded-lg' : ''
                            }`}>
                            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] ${comment.is_own
                                ? 'bg-purple-500 text-white'
                                : comment.is_simulated
                                    ? 'bg-white/10 text-white/60'
                                    : 'bg-purple-500/30 text-purple-200'
                                }`}>
                                {comment.user_name.slice(0, 1)}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    {/* 用戶名可點擊連結 */}
                                    {(comment.virtual_user_id || comment.user_id) && !comment.is_own ? (
                                        <Link
                                            href={`/user/${comment.virtual_user_id || comment.user_id}`}
                                            className={`font-medium hover:underline ${comment.is_simulated ? 'text-white/70' : 'text-purple-300'}`}
                                        >
                                            {comment.user_name}
                                        </Link>
                                    ) : (
                                        <span className={`font-medium ${comment.is_own
                                            ? 'text-purple-300'
                                            : comment.is_simulated
                                                ? 'text-white/70'
                                                : 'text-purple-300'
                                            }`}>
                                            {comment.user_name}
                                            {comment.is_own && <span className="ml-1 text-[10px] text-purple-400">(你)</span>}
                                        </span>
                                    )}
                                    <span className="text-white/40">{formatTime(comment.created_at)}</span>
                                </div>
                                <p className="text-white/80 mt-0.5 break-words">{comment.content}</p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={commentsEndRef} />
            </div>

            {/* 輸入框 */}
            {isActive && user ? (
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="說點什麼..."
                        maxLength={100}
                        className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:ring-1 focus:ring-purple-500/50"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isSubmitting}
                        className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-600 disabled:opacity-50"
                    >
                        {isSubmitting ? '...' : '送出'}
                    </button>
                </form>
            ) : isActive && !user ? (
                <p className="text-xs text-white/50 text-center">登入後即可留言</p>
            ) : null}
        </div>
    );
}
