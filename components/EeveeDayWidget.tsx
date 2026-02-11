"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type EeveeDayStatus = {
    isActive: boolean;
    hasEnded: boolean;
    stamps: number;
    stampsRequired: number;
    remainingAttempts: number;
    dailyAttempts: number;
    endDate: string;
    reward: {
        distributions: {
            pokemon_name: string;
            pokemon_sprite_url?: string;
        };
    } | null;
};

export function EeveeDayWidget() {
    const [status, setStatus] = useState<EeveeDayStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/eevee-day/status")
            .then((res) => {
                if (!res.ok) return null;
                return res.json();
            })
            .then((data) => {
                if (data && !data.error) setStatus(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="glass-card p-4 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-1/3 mb-3"></div>
                <div className="h-8 bg-white/10 rounded w-full"></div>
            </div>
        );
    }

    if (!status) return null;

    // 活動已結束且沒有獎勵 → 不顯示
    if (status.hasEnded && !status.reward) return null;

    const progress = Math.min(status.stamps / status.stampsRequired, 1);
    const completed = status.stamps >= status.stampsRequired;

    // 計算剩餘天數
    const daysLeft = Math.max(0, Math.ceil((new Date(status.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    const isUrgent = daysLeft <= 3;

    return (
        <Link href="/eevee-day" className="block group">
            <div className="glass-card p-4 border border-amber-500/20 hover:border-amber-400/40 transition-all duration-300 relative overflow-hidden">
                {/* 背景裝飾 — 伊布圖片 */}
                <div className="absolute -top-2 -right-2 w-20 h-20 opacity-15 pointer-events-none">
                    <img
                        src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png"
                        alt=""
                        className="w-full h-full object-contain"
                    />
                </div>

                {/* 標題列 */}
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-1.5">
                        <span className="text-base">🎯</span>
                        伊布 Day 集點
                    </h3>
                    {status.isActive && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isUrgent
                                ? "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse"
                                : "bg-green-500/20 text-green-400 border-green-500/30"
                            }`}>
                            ⏰ 剩餘 {daysLeft} 天
                        </span>
                    )}
                    {status.hasEnded && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50 border border-white/20">
                            已結束
                        </span>
                    )}
                    {!status.isActive && !status.hasEnded && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            即將開始
                        </span>
                    )}
                </div>

                {/* 已選獎勵 */}
                {status.reward ? (
                    <div className="flex items-center gap-2 text-sm text-white/70">
                        <span>🎁</span>
                        <span>已選擇：{status.reward.distributions.pokemon_name}</span>
                        <span className="text-green-400">✓</span>
                    </div>
                ) : (
                    <>
                        {/* 進度條 */}
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${progress * 100}%`,
                                        background: completed
                                            ? "linear-gradient(90deg, #34d399, #10b981)"
                                            : "linear-gradient(90deg, #f59e0b, #f97316)",
                                    }}
                                />
                            </div>
                            <span className="text-xs text-white/60 font-mono whitespace-nowrap">
                                {status.stamps}/{status.stampsRequired}
                            </span>
                        </div>

                        {/* 底部資訊 */}
                        <div className="flex items-center justify-between text-[11px] text-white/50">
                            {completed ? (
                                <span className="text-green-400">🎉 可以選擇獎勵了！</span>
                            ) : (
                                <span>
                                    還差 {status.stampsRequired - status.stamps} 點
                                </span>
                            )}
                            {status.isActive && (
                                <span>
                                    今日剩餘 {status.remainingAttempts} 次
                                </span>
                            )}
                        </div>
                    </>
                )}

                {/* Hover 提示 */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl">
                    <span className="text-sm text-white font-medium">
                        {status.isActive ? "前往答題 →" : "查看詳情 →"}
                    </span>
                </div>
            </div>
        </Link>
    );
}
