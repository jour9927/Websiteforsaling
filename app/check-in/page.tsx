"use client";

import { useState, useEffect } from "react";
import { MemberOnlyBlock } from "@/components/MemberOnlyBlock";

type CheckInStatus = {
    canCheckIn: boolean;
    streak: number;
    fortunePoints: number;
    lastCheckIn: string | null;
};

export default function CheckInPage() {
    const [status, setStatus] = useState<CheckInStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [showAnimation, setShowAnimation] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(true);

    // 取得簽到狀態
    useEffect(() => {
        fetch("/api/check-in")
            .then((res) => {
                if (res.status === 401) {
                    setIsLoggedIn(false);
                    setLoading(false);
                    return null;
                }
                return res.json();
            })
            .then((data) => {
                if (data && !data.error) {
                    setStatus(data);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    // 執行簽到
    const handleCheckIn = async () => {
        if (!status?.canCheckIn || checking) return;

        setChecking(true);
        setMessage(null);

        try {
            const res = await fetch("/api/check-in", { method: "POST" });
            const data = await res.json();

            if (data.success) {
                setShowAnimation(true);
                setMessage(data.message);
                setStatus({
                    canCheckIn: false,
                    streak: data.streak,
                    fortunePoints: data.fortunePoints,
                    lastCheckIn: new Date().toISOString(),
                });

                // 動畫結束後隱藏
                setTimeout(() => setShowAnimation(false), 2000);
            } else {
                setMessage(data.error || "簽到失敗");
            }
        } catch {
            setMessage("網路錯誤，請稍後再試");
        } finally {
            setChecking(false);
        }
    };

    if (loading) {
        return (
            <section className="glass-card p-8 text-center">
                <div className="animate-pulse text-white/60">載入中...</div>
            </section>
        );
    }

    // 未登入用戶顯示會員限定區塊
    if (!isLoggedIn) {
        return (
            <section className="space-y-6">
                <header>
                    <h1 className="text-2xl font-semibold text-white/90">每日簽到</h1>
                    <p className="mt-1 text-sm text-white/60">
                        每日簽到累積幸運點數，連續簽到獎勵更多！
                    </p>
                </header>
                <MemberOnlyBlock
                    title="會員專屬功能"
                    description="登入後即可開始每日簽到，累積幸運點數參與抽獎"
                    itemCount={3}
                />
            </section>
        );
    }

    // 計算連續簽到的獎勵預覽
    const weekDays = ["一", "二", "三", "四", "五", "六", "日"];
    const currentStreak = status?.streak || 0;

    return (
        <section className="space-y-6">
            {/* 頁面標題 */}
            <header>
                <h1 className="text-2xl font-semibold text-white/90">每日簽到</h1>
                <p className="mt-1 text-sm text-white/60">
                    每日簽到累積幸運點數，連續簽到獎勵更多！
                </p>
            </header>

            {/* 簽到主區塊 */}
            <div className="glass-card overflow-hidden">
                {/* 頂部統計 */}
                <div className="grid grid-cols-2 divide-x divide-white/10 border-b border-white/10">
                    <div className="p-6 text-center">
                        <p className="text-xs uppercase tracking-wider text-white/50">連續簽到</p>
                        <p className="mt-1 text-3xl font-bold text-amber-400">
                            {currentStreak} <span className="text-lg text-white/50">天</span>
                        </p>
                    </div>
                    <div className="p-6 text-center">
                        <p className="text-xs uppercase tracking-wider text-white/50">幸運點數</p>
                        <p className="mt-1 text-3xl font-bold text-emerald-400">
                            {status?.fortunePoints || 0} <span className="text-lg text-white/50">點</span>
                        </p>
                    </div>
                </div>

                {/* 簽到按鈕 */}
                <div className="flex flex-col items-center p-8">
                    <button
                        onClick={handleCheckIn}
                        disabled={!status?.canCheckIn || checking}
                        className={`relative h-32 w-32 rounded-full text-xl font-bold transition-all duration-300 ${status?.canCheckIn
                            ? "bg-gradient-to-br from-amber-400 to-orange-500 text-black shadow-lg shadow-amber-500/30 hover:scale-105 hover:shadow-amber-500/50 active:scale-95"
                            : "bg-white/10 text-white/40 cursor-not-allowed"
                            }`}
                    >
                        {checking ? (
                            <span className="animate-pulse">...</span>
                        ) : status?.canCheckIn ? (
                            <>
                                <span className="block text-3xl">👆</span>
                                <span>簽到</span>
                            </>
                        ) : (
                            <>
                                <span className="block text-3xl">✓</span>
                                <span>已簽到</span>
                            </>
                        )}

                        {/* 簽到成功動畫 */}
                        {showAnimation && (
                            <span className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-30" />
                        )}
                    </button>

                    {/* 訊息提示 */}
                    {message && (
                        <p
                            className={`mt-4 text-sm ${message.includes("成功") ? "text-emerald-400" : "text-red-400"
                                }`}
                        >
                            {message}
                        </p>
                    )}
                </div>

                {/* 連續簽到獎勵預覽 */}
                <div className="border-t border-white/10 px-6 py-4">
                    <p className="mb-3 text-center text-xs text-white/50">連續簽到獎勵</p>
                    <div className="flex justify-center gap-2">
                        {weekDays.map((day, index) => (
                            <div
                                key={day}
                                className={`flex h-10 w-10 flex-col items-center justify-center rounded-lg text-xs ${index < currentStreak
                                    ? "bg-amber-500/20 text-amber-400"
                                    : "bg-white/5 text-white/30"
                                    }`}
                            >
                                <span className="font-bold">{index + 1}</span>
                                <span className="text-[10px]">點</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 說明區塊 */}
            <div className="glass-card p-4">
                <h3 className="text-sm font-semibold text-white/80">📌 簽到規則</h3>
                <ul className="mt-2 space-y-1 text-xs text-white/60">
                    <li>• 每日簽到可獲得幸運點數</li>
                    <li>• 連續簽到天數越多，每日獲得的點數越多（最多 7 點/天）</li>
                    <li>• 中斷簽到將重新計算連續天數</li>
                    <li>• 幸運點數可用於未來的特殊活動抽獎</li>
                </ul>
            </div>
        </section>
    );
}
