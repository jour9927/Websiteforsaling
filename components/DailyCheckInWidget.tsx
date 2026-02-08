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
            {/* 頂部欄 */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">📅</span>
                    <div>
                        <h3 className="text-sm font-semibold text-white/90">每日簽到</h3>
                        <p className="text-xs text-white/50">
                            連續 <span className="text-amber-400 font-bold">{status.streak}</span> 天
                            {status.debt > 0 && (
                                <span className="text-red-400 ml-2">（補簽中：{status.debt} 天）</span>
                            )}
                        </p>
                    </div>
                </div>

                {/* 快速簽到按鈕 */}
                <button
                    onClick={handleCheckIn}
                    disabled={!status.canCheckIn || checking}
                    className={`relative px-4 py-2 rounded-full text-sm font-semibold transition-all ${status.canCheckIn
                        ? "bg-gradient-to-r from-amber-400 to-orange-500 text-black hover:scale-105 active:scale-95"
                        : "bg-white/10 text-white/40 cursor-not-allowed"
                        }`}
                >
                    {checking ? "..." : status.canCheckIn ? "👆 簽到" : "✓ 已簽到"}
                    {showAnimation && (
                        <span className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-30" />
                    )}
                </button>
            </div>

            {/* 進度條 */}
            <div className="px-4 py-3">
                <div className="flex items-center justify-between text-xs text-white/50 mb-2">
                    <span>40 天獎勵進度</span>
                    <span>{status.streak} / {status.milestone} 天</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>

                {/* 目標寶可夢 */}
                {status.goalDistribution ? (
                    <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {status.goalDistribution.pokemon_sprite_url && (
                                <img
                                    src={status.goalDistribution.pokemon_sprite_url}
                                    alt={status.goalDistribution.pokemon_name}
                                    className="w-6 h-6"
                                />
                            )}
                            <span className="text-xs text-white/60">
                                目標：{status.goalDistribution.pokemon_name}
                                {status.goalDistribution.is_shiny && " ✨"}
                            </span>
                        </div>
                        <Link
                            href="/check-in"
                            className="text-xs text-amber-400 hover:underline"
                        >
                            更換目標
                        </Link>
                    </div>
                ) : (
                    <Link
                        href="/check-in"
                        className="mt-2 block text-xs text-center text-amber-400 hover:underline"
                    >
                        🎁 設定 40 天獎勵目標 →
                    </Link>
                )}
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
