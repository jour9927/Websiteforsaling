"use client";

import { useState, useEffect } from "react";

// 模擬暱稱庫
const FAKE_NAMES = [
    "王**", "李**", "張**", "陳**", "林**", "黃**", "吳**", "周**",
    "L***", "T***", "K***", "M***", "S***", "A***", "J***", "W***",
    "會員#0892", "會員#1203", "會員#0567", "會員#0341", "會員#0789",
];

// 模擬出價金額增量
const BID_INCREMENTS = [100, 100, 100, 200, 500, 500, 1000];

export function SimulatedViewers({ baseViewers = 8 }: { baseViewers?: number }) {
    const [viewers, setViewers] = useState(baseViewers);

    useEffect(() => {
        // 每 5-15 秒隨機波動 ±1-3 人
        const interval = setInterval(() => {
            setViewers(prev => {
                const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
                const newValue = prev + change;
                return Math.max(3, Math.min(25, newValue)); // 保持 3-25 人範圍
            });
        }, 5000 + Math.random() * 10000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-2 text-sm text-white/70">
            <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
            <span>{viewers} 人正在觀看</span>
        </div>
    );
}

export function SimulatedBidToast() {
    const [toasts, setToasts] = useState<{ id: number; name: string; amount: number }[]>([]);
    const [lastBidAmount, setLastBidAmount] = useState(1000 + Math.floor(Math.random() * 5000));

    useEffect(() => {
        // 每 15-45 秒產生一個模擬出價通知
        const generateToast = () => {
            const name = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
            const increment = BID_INCREMENTS[Math.floor(Math.random() * BID_INCREMENTS.length)];
            const newAmount = lastBidAmount + increment;

            setLastBidAmount(newAmount);

            const id = Date.now();
            setToasts(prev => [...prev, { id, name, amount: newAmount }]);

            // 5 秒後移除 Toast
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 5000);
        };

        // 初始延遲 10-20 秒
        const initialDelay = setTimeout(() => {
            generateToast();

            // 之後每 15-45 秒產生一個
            const interval = setInterval(generateToast, 15000 + Math.random() * 30000);
            return () => clearInterval(interval);
        }, 10000 + Math.random() * 10000);

        return () => clearTimeout(initialDelay);
    }, [lastBidAmount]);

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className="animate-slide-in-right glass-card flex items-center gap-3 px-4 py-3 shadow-lg border border-yellow-500/30"
                >
                    <span className="text-xl">🔔</span>
                    <div>
                        <p className="text-sm font-medium text-white/90">
                            {toast.name} 出價了 ${toast.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-white/50">剛剛</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function SimulatedWatchers({ baseCount = 12 }: { baseCount?: number }) {
    const [count, setCount] = useState(baseCount);

    useEffect(() => {
        const interval = setInterval(() => {
            setCount(prev => {
                const change = Math.floor(Math.random() * 7) - 3; // -3 to +3
                return Math.max(5, Math.min(50, prev + change));
            });
        }, 8000 + Math.random() * 12000);

        return () => clearInterval(interval);
    }, []);

    return (
        <span className="text-sm text-white/60">
            🔥 {count} 人正在關注
        </span>
    );
}

export function SimulatedRecentActivity() {
    const [activities, setActivities] = useState<{ id: number; name: string; comment: string; time: string }[]>([]);

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

    useEffect(() => {
        // 初始化 3 個留言
        const getRandomComment = () => RANDOM_COMMENTS[Math.floor(Math.random() * RANDOM_COMMENTS.length)];

        const initialActivities = [
            { id: 1, name: FAKE_NAMES[0], comment: getRandomComment(), time: "2分鐘前" },
            { id: 2, name: FAKE_NAMES[3], comment: getRandomComment(), time: "5分鐘前" },
            { id: 3, name: FAKE_NAMES[6], comment: getRandomComment(), time: "8分鐘前" },
        ];
        setActivities(initialActivities);

        // 每 15-35 秒新增一個留言
        const interval = setInterval(() => {
            const name = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
            const comment = RANDOM_COMMENTS[Math.floor(Math.random() * RANDOM_COMMENTS.length)];

            setActivities(prev => {
                const newActivity = { id: Date.now(), name, comment, time: "剛剛" };
                return [newActivity, ...prev.slice(0, 4)]; // 保持最多 5 個
            });
        }, 15000 + Math.random() * 20000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-3">
            {activities.map(activity => (
                <div key={activity.id} className="flex items-start gap-2 text-xs">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] text-white/70">
                        {activity.name.slice(0, 1)}
                    </span>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-white/80 font-medium">{activity.name}</span>
                            <span className="text-white/40 shrink-0">{activity.time}</span>
                        </div>
                        <p className="text-white/60 mt-0.5 break-words">「{activity.comment}」</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
