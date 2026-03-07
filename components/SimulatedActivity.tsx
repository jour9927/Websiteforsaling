"use client";

import { useState, useEffect, useRef } from "react";
import { HomepageFallbackPoolManager } from "@/lib/commentFallbackPool";

// 模擬暱稱庫（55+）
const FAKE_NAMES = [
    "王**", "李**", "張**", "陳**", "林**", "黃**", "吳**", "周**",
    "謝**", "趙**", "徐**", "馬**", "朱**", "胡**", "高**", "羅**",
    "曾**", "蔡**", "許**", "鄭**", "劉**", "楊**", "郭**", "何**",
    "L***", "T***", "K***", "M***", "S***", "A***", "J***", "W***",
    "D***", "C***", "H***", "N***", "Y***", "B***", "G***", "E***",
    "R***", "F***", "P***", "V***",
    "色違獵人", "孵蛋廢人", "圖鑑收集狂", "對戰塔常客", "太晶團戰大老",
    "搶標新手", "潛水路人", "小資族玩家", "非洲人日常", "收藏控",
    "深夜競標人", "剁手戒斷中", "活動控", "佛系玩家", "視金如土",
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
    const poolRef = useRef<HomepageFallbackPoolManager | null>(null);
    const activitiesRef = useRef<{ id: number; name: string; comment: string; time: string }[]>([]);

    // 同步 activities 到 ref（讓定時器內部讀最新值）
    useEffect(() => {
        activitiesRef.current = activities;
    }, [activities]);

    useEffect(() => {
        // 初始化 pool（只建一次）
        if (!poolRef.current) {
            poolRef.current = new HomepageFallbackPoolManager();
        }
        const pool = poolRef.current;

        // 初始化 3 個留言（從 pool 取，不重複）
        const c1 = pool.getComment();
        const c2 = pool.getComment();
        const c3 = pool.getComment();

        const initialActivities = [
            { id: 1, name: FAKE_NAMES[0], comment: c1 || "嗨嗨 👋", time: "2分鐘前" },
            { id: 2, name: FAKE_NAMES[3], comment: c2 || "來了來了", time: "5分鐘前" },
            { id: 3, name: FAKE_NAMES[6], comment: c3 || "又來逛了", time: "8分鐘前" },
        ];
        setActivities(initialActivities);

        // 每 15-35 秒新增一個留言
        const interval = setInterval(async () => {
            // 池枯竭則停止
            if (pool.isExhausted) {
                clearInterval(interval);
                return;
            }

            const name = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
            let comment: string | null = null;
            let displayName = name;

            // 20% 機率使用 LLM 生成
            if (Math.random() < 0.2) {
                try {
                    const recentCtx = activitiesRef.current
                        .slice(0, 3)
                        .map(a => `${a.name}: ${a.comment}`)
                        .join('\n');

                    const res = await fetch('/api/generate-homepage-comment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ recentChat: recentCtx }),
                    });

                    if (res.ok) {
                        const data = await res.json();
                        comment = data.reply;
                        if (data.simulatedName) displayName = data.simulatedName;
                    }
                } catch {
                    // LLM 失敗，降級到 fallback 池
                }
            }

            // LLM 未成功則從 pool 取（不重複）
            if (!comment) {
                comment = pool.getComment();
            }

            if (!comment) return; // 池空了

            setActivities(prev => {
                const newActivity = { id: Date.now(), name: displayName, comment: comment!, time: "剛剛" };
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
