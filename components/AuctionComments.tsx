"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { loadVirtualProfiles, VirtualProfile } from '@/lib/virtualProfiles';
import Link from 'next/link';

// 種子隨機數生成器（基於字串生成一致的隨機序列）
function createSeededRandom(seed: string) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    return function () {
        hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
        hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
        hash ^= hash >>> 16;
        return (hash >>> 0) / 4294967296;
    };
}

// 競標相關留言（擴充到 30+ 句）
const AUCTION_COMMENTS = [
    "這隻好難得！",
    "競標好刺激 🔥",
    "等等再來看",
    "加價了加價了",
    "最後幾分鐘了",
    "求讓給我 🙏",
    "難得看到這隻上線",
    "衝了衝了！",
    "這個價格還可以接受",
    "好猶豫要不要下手",
    "有人一起嗎",
    "太美了吧這隻",
    "是我想要的配布！",
    "關注中 👀",
    "剛剛有人出價嗎",
    "這價格很佛",
    "再觀望一下",
    "快結束了！",
    "這隻超稀有",
    "值得收藏",
    "好想要啊",
    "先卡位",
    "等結標",
    "這隻終於出現了",
    "夢寐以求的配布",
    "收藏價值很高",
    "加油加油",
    "緊張刺激",
    "最後衝刺！",
    "拜託讓我",
];

// 網站/活動相關留言（擴充到 20+ 句）
const SITE_COMMENTS = [
    "最近活動好多",
    "新功能好方便",
    "終於有留言功能了",
    "社群越來越熱鬧",
    "今天有什麼好物嗎",
    "來逛逛",
    "新手報到！",
    "剛加入這個群",
    "現在競標場超熱鬧",
    "大家晚安",
    "大家好",
    "今天運氣好嗎",
    "有推薦的嗎",
    "這平台不錯欸",
    "介面很漂亮",
    "第一次來",
    "這裡好多寶物",
    "收藏控報到",
    "每天都要來看看",
    "通知響了馬上來",
];

// 模擬用戶相互 @ 對話（讓氛圍更真實）
const SIMULATED_INTERACTIONS = [
    (targetName: string) => `@${targetName} 你也在喔`,
    (targetName: string) => `@${targetName} 這隻你有興趣嗎`,
    (targetName: string) => `@${targetName} 一起競標！`,
    (targetName: string) => `@${targetName} 加油`,
    (targetName: string) => `@${targetName} 哈哈 你也來了`,
    (targetName: string) => `@${targetName} 等下要出嗎`,
    (targetName: string) => `@${targetName} 好久不見`,
    (targetName: string) => `@${targetName} 你收了嗎`,
];

// 心理學吸引人的回覆（對真實用戶 - 只回一次，引發好奇）
const PSYCHOLOGY_REPLIES = [
    (name: string) => `@${name} 什麼意思？`,
    (name: string) => `@${name} 你說的是指...？`,
    (name: string) => `@${name} 真的嗎？`,
    (name: string) => `@${name} 有道理欸`,
    (name: string) => `@${name} 我也這樣想`,
    (name: string) => `@${name} 所以呢？`,
    (name: string) => `@${name} 認真？`,
    (name: string) => `@${name} 為什麼這樣說`,
    (name: string) => `@${name} 然後呢`,
    (name: string) => `@${name} 怎麼說？`,
    (name: string) => `@${name} 再說一次？`,
    (name: string) => `@${name} 展開講講`,
];

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
    isActive: boolean;
    currentUserName?: string | null;
}

export default function AuctionComments({
    auctionId,
    isActive,
    currentUserName
}: AuctionCommentsProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [simulatedComments, setSimulatedComments] = useState<Comment[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [user, setUser] = useState<{ id: string; name: string } | null>(null);
    const commentsEndRef = useRef<HTMLDivElement>(null);

    // 追蹤已回覆的真實用戶（每人只回一次）
    const repliedUsersRef = useRef<Set<string>>(new Set());
    // 追蹤模擬用戶（用於相互 @）
    const activeSimUsersRef = useRef<VirtualProfile[]>([]);
    // 快取的虛擬用戶列表
    const virtualProfilesRef = useRef<VirtualProfile[]>([]);

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

    // 載入真實留言
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
                    is_simulated: false,
                    is_own: authUser ? c.user_id === authUser.id : false
                })));
            }
        };
        loadComments();

        // 即時訂閱新留言
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
                setComments(prev => [...prev, {
                    ...newComment,
                    is_simulated: false,
                    is_own: authUser ? newComment.user_id === authUser.id : false
                }]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [auctionId]);

    // 初始模擬留言 + 定時新增
    useEffect(() => {
        if (!isActive) return;

        // 建立基於競標ID + 日期的種子隨機
        const today = new Date().toISOString().split('T')[0];
        const seededRandom = createSeededRandom(`${auctionId}-${today}`);

        // 使用種子隨機選擇留言（初始留言固定）
        const getSeededComment = () => {
            const useAuction = seededRandom() > 0.3;
            const pool = useAuction ? AUCTION_COMMENTS : SITE_COMMENTS;
            return pool[Math.floor(seededRandom() * pool.length)];
        };

        // 使用真隨機選擇留言（動態留言）
        const getRandomComment = () => {
            const pool = Math.random() > 0.3 ? AUCTION_COMMENTS : SITE_COMMENTS;
            return pool[Math.floor(Math.random() * pool.length)];
        };

        // 載入虛擬用戶並初始化
        const initSimulation = async () => {
            const profiles = await loadVirtualProfiles();
            virtualProfilesRef.current = profiles;

            if (profiles.length === 0) return;

            // 使用種子隨機選擇初始用戶（固定）
            const userIndex1 = Math.floor(seededRandom() * profiles.length);
            const userIndex2 = Math.floor(seededRandom() * profiles.length);
            const user1 = profiles[userIndex1];
            const user2 = profiles[userIndex2 === userIndex1 ? (userIndex2 + 1) % profiles.length : userIndex2];

            activeSimUsersRef.current = [user1, user2];

            const initialSimulated: Comment[] = [
                {
                    id: 'sim-1',
                    user_name: user1.display_name,
                    virtual_user_id: user1.id,
                    content: getSeededComment(),
                    created_at: new Date(Date.now() - 120000).toISOString(),
                    is_simulated: true
                },
                {
                    id: 'sim-2',
                    user_name: user2.display_name,
                    virtual_user_id: user2.id,
                    content: getSeededComment(),
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
        const interval = setInterval(() => {
            const virtualUser = getRandomVirtualUser();
            if (!virtualUser) return;

            // 30% 機率會 @ 其他模擬用戶
            let content: string;
            if (Math.random() < 0.3 && activeSimUsersRef.current.length > 1) {
                const otherUsers = activeSimUsersRef.current.filter(u => u.id !== virtualUser.id);
                const targetUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];
                const interaction = SIMULATED_INTERACTIONS[Math.floor(Math.random() * SIMULATED_INTERACTIONS.length)];
                content = interaction(targetUser.display_name);
            } else {
                content = getRandomComment();
            }

            const newSimComment: Comment = {
                id: `sim-${Date.now()}`,
                user_name: virtualUser.display_name,
                virtual_user_id: virtualUser.id,
                content,
                created_at: new Date().toISOString(),
                is_simulated: true
            };
            setSimulatedComments(prev => [...prev, newSimComment].slice(-12));
        }, 15000 + Math.random() * 20000);

        return () => clearInterval(interval);
    }, [isActive, auctionId]);

    // 觸發模擬 @回覆（延遲 10-15 秒，只回一次）
    const triggerSimulatedReply = useCallback((userName: string) => {
        // 檢查是否已回覆過這個用戶
        if (repliedUsersRef.current.has(userName)) {
            return; // 已回覆過，不再回覆
        }

        // 標記為已回覆
        repliedUsersRef.current.add(userName);

        // 延遲 10-15 秒後回覆
        setTimeout(() => {
            const replyUser = virtualProfilesRef.current[Math.floor(Math.random() * virtualProfilesRef.current.length)];
            const replyTemplate = PSYCHOLOGY_REPLIES[Math.floor(Math.random() * PSYCHOLOGY_REPLIES.length)];
            const newReply: Comment = {
                id: `reply-${Date.now()}`,
                user_name: replyUser?.display_name || '會員**',
                virtual_user_id: replyUser?.id,
                content: replyTemplate(userName),
                created_at: new Date().toISOString(),
                is_simulated: true
            };
            setSimulatedComments(prev => [...prev, newReply].slice(-12));
        }, 10000 + Math.random() * 5000); // 10-15 秒
    }, []);

    // 送出留言
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !user || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('auction_comments')
                .insert({
                    auction_id: auctionId,
                    user_id: user.id,
                    user_name: user.name,
                    content: inputValue.trim()
                });

            if (!error) {
                setInputValue('');
                // 觸發模擬回覆（只會回一次）
                triggerSimulatedReply(user.name);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // 合併並排序所有留言
    const allComments = [...comments, ...simulatedComments]
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .slice(-25); // 只顯示最新 25 條

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
