"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

// 模擬用戶名單
const FAKE_NAMES = [
    '王**', '李**', '張**', '陳**', '林**', '黃**', '趙**', '周**',
    'L***', 'K***', 'M***', 'S***', 'T***', 'A***', 'J***', 'R***',
    '會員#0892', '會員#1234', '會員#5678', '會員#3456', '會員#7890',
    'Trainer_X', 'PKM_Fan', '神奧勇者', '卡洛斯冠軍', '關都大師'
];

// 隨機留言庫
const RANDOM_COMMENTS = [
    "好可愛！想要",
    "這隻超稀有的",
    "價格還可以接受",
    "太讚了吧",
    "這配布很難得欸",
    "我也想要 😭",
    "有人要一起買嗎",
    "性價比很高",
    "這個必須搶",
    "天啊這個閃光太美了",
    "加油大家",
    "新手入坑中",
    "競標好刺激",
    "衝了衝了",
    "等等再看看",
    "有點猶豫",
    "這隻我收了好久",
    "求讓 🙏",
    "最後一分鐘再來",
    "好緊張",
    "這隻配招很棒",
    "我的最愛！",
    "難得看到這隻",
    "機不可失",
    "已關注 ❤️"
];

// @回覆模板
const REPLY_TEMPLATES = [
    (name: string) => `@${name} 沒錯！`,
    (name: string) => `@${name} 我也這麼覺得`,
    (name: string) => `@${name} 加油 💪`,
    (name: string) => `@${name} 同感！`,
    (name: string) => `@${name} 衝啊`,
    (name: string) => `@${name} 讚`,
    (name: string) => `@${name} 真的嗎`,
    (name: string) => `@${name} 有道理`,
    (name: string) => `@${name} 我也想要`,
    (name: string) => `@${name} 一起競標！`,
    (name: string) => `@${name} 說得好`,
    (name: string) => `@${name} 哈哈哈`,
    (name: string) => `@${name} 👍`,
    (name: string) => `@${name} 你也喜歡這隻？`,
];

interface Comment {
    id: string;
    user_name: string;
    content: string;
    created_at: string;
    is_simulated?: boolean;
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
            const { data } = await supabase
                .from('auction_comments')
                .select('*')
                .eq('auction_id', auctionId)
                .order('created_at', { ascending: true })
                .limit(50);

            if (data) {
                setComments(data.map(c => ({ ...c, is_simulated: false })));
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
            }, (payload) => {
                setComments(prev => [...prev, { ...payload.new as Comment, is_simulated: false }]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [auctionId]);

    // 初始模擬留言
    useEffect(() => {
        if (!isActive) return;

        const initialSimulated: Comment[] = [
            {
                id: 'sim-1',
                user_name: FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)],
                content: RANDOM_COMMENTS[Math.floor(Math.random() * RANDOM_COMMENTS.length)],
                created_at: new Date(Date.now() - 120000).toISOString(),
                is_simulated: true
            },
            {
                id: 'sim-2',
                user_name: FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)],
                content: RANDOM_COMMENTS[Math.floor(Math.random() * RANDOM_COMMENTS.length)],
                created_at: new Date(Date.now() - 300000).toISOString(),
                is_simulated: true
            }
        ];
        setSimulatedComments(initialSimulated);

        // 每 20-40 秒新增一個模擬留言
        const interval = setInterval(() => {
            const newSimComment: Comment = {
                id: `sim-${Date.now()}`,
                user_name: FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)],
                content: RANDOM_COMMENTS[Math.floor(Math.random() * RANDOM_COMMENTS.length)],
                created_at: new Date().toISOString(),
                is_simulated: true
            };
            setSimulatedComments(prev => [...prev, newSimComment].slice(-10));
        }, 20000 + Math.random() * 20000);

        return () => clearInterval(interval);
    }, [isActive]);

    // 觸發模擬 @回覆
    const triggerSimulatedReply = useCallback((userName: string) => {
        setTimeout(() => {
            const replyTemplate = REPLY_TEMPLATES[Math.floor(Math.random() * REPLY_TEMPLATES.length)];
            const newReply: Comment = {
                id: `reply-${Date.now()}`,
                user_name: FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)],
                content: replyTemplate(userName),
                created_at: new Date().toISOString(),
                is_simulated: true
            };
            setSimulatedComments(prev => [...prev, newReply].slice(-10));
        }, 3000 + Math.random() * 5000); // 3-8 秒後回覆
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
                // 觸發模擬回覆
                triggerSimulatedReply(user.name);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // 合併並排序所有留言
    const allComments = [...comments, ...simulatedComments]
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .slice(-20); // 只顯示最新 20 條

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
                        <div key={comment.id} className="flex items-start gap-2 text-xs animate-fadeIn">
                            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] ${comment.is_simulated ? 'bg-white/10 text-white/60' : 'bg-purple-500/30 text-purple-200'
                                }`}>
                                {comment.user_name.slice(0, 1)}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={`font-medium ${comment.is_simulated ? 'text-white/70' : 'text-purple-300'
                                        }`}>
                                        {comment.user_name}
                                    </span>
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
