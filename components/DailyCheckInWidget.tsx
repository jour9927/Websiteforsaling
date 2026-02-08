"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type CheckInStatus = {
    canCheckIn: boolean;
    streak: number;
    fortunePoints: number;
    debt: number;
    milestone: number;
    goalDistribution: {
        id: string;
        pokemon_name: string;
        pokemon_sprite_url?: string;
        is_shiny?: boolean;
    } | null;
};

export function DailyCheckInWidget() {
    const [status, setStatus] = useState<CheckInStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const [showAnimation, setShowAnimation] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/check-in")
            .then((res) => {
                if (res.status === 401) {
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
                setStatus((prev) => prev ? {
                    ...prev,
                    canCheckIn: false,
                    streak: data.streak,
                    fortunePoints: data.fortunePoints,
                    debt: data.debt,
                } : null);

                setTimeout(() => setShowAnimation(false), 2000);
            } else {
                setMessage(data.error || "簽到失敗");
            }
        } catch {
            setMessage("網路錯誤");
        } finally {
            setChecking(false);
        }
    };

    // 未登入或載入中
    if (loading) {
        return (
            <section className="glass-card p-4">
                <div className="animate-pulse h-16 bg-white/5 rounded-lg" />
            </section>
        );
    }

    if (!status) {
        return null; // 未登入時不顯示
    }

    const progress = status.milestone > 0 ? (status.streak / status.milestone) * 100 : 0;

    return (
        <section className="glass-card overflow-hidden">
            <div className="flex items-stretch">
                {/* 左側：目標寶可夢大圖 + 進度環 */}
                <div className="relative p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/5 flex items-center justify-center">
                    <div className="relative">
                        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="6"
                            />
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="url(#widgetProgress)"
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={`${progress * 2.83} 283`}
                                className="transition-all duration-500"
                            />
                            <defs>
                                <linearGradient id="widgetProgress" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#f59e0b" />
                                    <stop offset="100%" stopColor="#f97316" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            {status.goalDistribution?.pokemon_sprite_url ? (
                                <img
                                    src={status.goalDistribution.pokemon_sprite_url}
                                    alt={status.goalDistribution.pokemon_name}
                                    className="w-12 h-12 pixelated drop-shadow-lg"
                                />
                            ) : (
                                <span className="text-2xl text-white/20">?</span>
                            )}
                        </div>
                        {status.goalDistribution?.is_shiny && (
                            <span className="absolute -top-1 -right-1 text-sm animate-pulse">✨</span>
                        )}
                    </div>
                </div>

                {/* 右側：資訊和按鈕 */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-white/90">每日簽到</h3>
                            <span className="text-xs text-white/50">
                                🔥 {status.streak} 天
                                {status.debt > 0 && (
                                    <span className="text-red-400 ml-1">(-{status.debt})</span>
                                )}
                            </span>
                        </div>

                        {status.goalDistribution ? (
                            <p className="text-xs text-white/60">
                                目標：<span className="text-amber-400">{status.goalDistribution.pokemon_name}</span>
                                <span className="text-white/40 ml-2">
                                    ({status.streak}/{status.milestone})
                                </span>
                            </p>
                        ) : (
                            <Link href="/check-in" className="text-xs text-amber-400 hover:underline">
                                🎁 設定 40 天獎勵目標
                            </Link>
                        )}
                    </div>

                    {/* 快速簽到按鈕 */}
                    <button
                        onClick={handleCheckIn}
                        disabled={!status.canCheckIn || checking}
                        className={`relative mt-2 w-full py-2 rounded-lg text-sm font-semibold transition-all ${status.canCheckIn
                                ? "bg-gradient-to-r from-amber-400 to-orange-500 text-black hover:scale-[1.02] active:scale-95"
                                : "bg-white/10 text-white/40 cursor-not-allowed"
                            }`}
                    >
                        {checking ? "..." : status.canCheckIn ? "👆 立即簽到" : "✓ 今日已簽到"}
                        {showAnimation && (
                            <span className="absolute inset-0 animate-ping rounded-lg bg-amber-400 opacity-30" />
                        )}
                    </button>
                </div>
            </div>

            {/* 訊息提示 */}
            {message && (
                <div className={`px-4 py-2 text-xs text-center ${message.includes("成功") || message.includes("恭喜")
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-red-500/20 text-red-400"
                    }`}>
                    {message}
                </div>
            )}
        </section>
    );
}
