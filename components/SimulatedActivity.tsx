"use client";

import { useState, useEffect } from "react";

// 模擬暱稱庫（55+）
const FAKE_NAMES = [
    "王**", "李**", "張**", "陳**", "林**", "黃**", "吳**", "周**",
    "謝**", "趙**", "徐**", "馬**", "朱**", "胡**", "高**", "羅**",
    "曾**", "蔡**", "許**", "鄭**", "劉**", "楊**", "郭**", "何**",
    "L***", "T***", "K***", "M***", "S***", "A***", "J***", "W***",
    "D***", "C***", "H***", "N***", "Y***", "B***", "G***", "E***",
    "R***", "F***", "P***", "V***",
    "會員#0892", "會員#1203", "會員#0567", "會員#0341", "會員#0789",
    "會員#1456", "會員#0923", "會員#0618", "會員#1087", "會員#0255",
    "會員#0731", "會員#1342", "會員#0409", "會員#0876",
];


export function SimulatedViewers({
    baseViewers = 8,
    viewerCount  // 新增：允許外部傳入統一的數值
}: {
    baseViewers?: number;
    viewerCount?: number;
}) {
    const [viewers, setViewers] = useState(baseViewers);

    useEffect(() => {
        // 如果有外部傳入的 viewerCount，則不使用內部邏輯
        if (viewerCount !== undefined) return;

        // 每 5-15 秒隨機波動 ±1-3 人
        const interval = setInterval(() => {
            setViewers(prev => {
                const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
                const newValue = prev + change;
                return Math.max(3, Math.min(25, newValue)); // 保持 3-25 人範圍
            });
        }, 5000 + Math.random() * 10000);

        return () => clearInterval(interval);
    }, [viewerCount]);

    const displayCount = viewerCount ?? viewers;

    return (
        <div className="flex items-center gap-2 text-sm text-white/70">
            <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
            <span>{displayCount} 人正在觀看</span>
        </div>
    );
}

export function SimulatedViewerJoinToast() {
    const [toasts, setToasts] = useState<{ id: number; name: string }[]>([]);

    useEffect(() => {
        // 每 15-45 秒產生一個進入通知
        const generateToast = () => {
            const name = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];

            const id = Date.now();
            setToasts(prev => [...prev, { id, name }]);

            // 4 秒後移除 Toast
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 4000);
        };

        // 初始延遲 10-20 秒
        const initialDelay = setTimeout(() => {
            generateToast();

            // 之後每 15-45 秒產生一個
            const interval = setInterval(generateToast, 15000 + Math.random() * 30000);
            return () => clearInterval(interval);
        }, 10000 + Math.random() * 10000);

        return () => clearTimeout(initialDelay);
    }, []);

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className="animate-slide-in-right glass-card flex items-center gap-3 px-4 py-3 shadow-lg border border-green-500/30"
                >
                    <span className="text-xl">🔔</span>
                    <div>
                        <p className="text-sm font-medium text-white/90">
                            {toast.name} 加入觀看
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

    // 隨機留言庫（80+）
    const RANDOM_COMMENTS = [
        // 興奮/想要
        "好可愛！想要",
        "這隻超稀有的",
        "太讚了吧",
        "這配布很難得欸",
        "我也想要 😭",
        "這個必須搶",
        "天啊這個閃光太美了",
        "我的最愛！",
        "難得看到這隻",
        "機不可失",
        "夢寐以求的配布",
        "尖叫！！！",
        "終於等到了",
        "不搶對不起自己",
        "心跳加速中",
        "這隻我等好久了",
        "太美了吧",
        "我的天 居然有這隻",
        // 評價/稱讚
        "性價比很高",
        "價格還可以接受",
        "這隻配招很棒",
        "收藏價值很高",
        "品相不錯",
        "經典中的經典",
        "完美的配布",
        "光看就很開心",
        "值得收藏",
        "這個OT很有意義",
        "好可愛啊啊啊",
        "絕版了吧這隻",
        // 觀望/猶豫
        "等等再看看",
        "有點猶豫",
        "好猶豫要不要下手",
        "先觀望一下",
        "錢包在顫抖",
        "理智跟我說不要",
        "猶豫就會敗北",
        "內心好掙扎",
        "先看看風向",
        "還在考慮中",
        "忍住忍住",
        // 競標相關
        "衝了衝了",
        "最後一分鐘再來",
        "好緊張",
        "競標好刺激",
        "加油大家",
        "求讓 🙏",
        "已關注 ❤️",
        "這場好卷",
        "價格戰開始了",
        "穩住 不要衝動",
        "加價了加價了",
        "被搶了 😤",
        "最後衝刺！",
        "倒數計時中",
        "快結束了！",
        "拜託讓我",
        // 社群/閒聊
        "新手入坑中",
        "有人要一起買嗎",
        "這隻我收了好久",
        "大家晚安",
        "來了來了",
        "報到報到",
        "每天都要來看看",
        "又來逛了",
        "今天有什麼好物",
        "邊吃飯邊逛",
        "午休時間來看看",
        "回家第一件事就是開這個",
        "這個月預算要爆了",
        "又要剁手了",
        "收藏控報到",
        "好無聊 來看看",
        "今天運氣好嗎",
        "期待今天的場次",
        "又是美好的一天",
        "最近好多好物上架",
        "哈哈我又來了",
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
