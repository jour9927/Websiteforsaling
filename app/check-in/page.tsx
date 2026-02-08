"use client";

import { useState, useEffect } from "react";
import { MemberOnlyBlock } from "@/components/MemberOnlyBlock";
import Image from "next/image";

type Distribution = {
    id: string;
    pokemon_name: string;
    pokemon_name_en?: string;
    pokemon_sprite_url?: string;
    is_shiny?: boolean;
    generation?: number;
};

type CheckInStatus = {
    canCheckIn: boolean;
    streak: number;
    fortunePoints: number;
    lastCheckIn: string | null;
    debt: number;
    milestone: number;
    goalDistribution: Distribution | null;
};

export default function CheckInPage() {
    const [status, setStatus] = useState<CheckInStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [showAnimation, setShowAnimation] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(true);

    // 目標選擇相關
    const [showPicker, setShowPicker] = useState(false);
    const [distributions, setDistributions] = useState<Distribution[]>([]);
    const [loadingDist, setLoadingDist] = useState(false);
    const [selectedGen, setSelectedGen] = useState<number | null>(null);

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
            setMessage("網路錯誤，請稍後再試");
        } finally {
            setChecking(false);
        }
    };

    // 載入配布列表
    const loadDistributions = async () => {
        if (distributions.length > 0) {
            setShowPicker(true);
            return;
        }

        setLoadingDist(true);
        try {
            const res = await fetch("/api/check-in/goal");
            const data = await res.json();
            if (data.distributions) {
                setDistributions(data.distributions);
            }
            setShowPicker(true);
        } catch {
            setMessage("無法載入配布列表");
        } finally {
            setLoadingDist(false);
        }
    };

    // 設定目標寶可夢
    const handleSetGoal = async (distId: string) => {
        try {
            const res = await fetch("/api/check-in/goal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ distributionId: distId }),
            });
            const data = await res.json();

            if (data.success) {
                setMessage(data.message);
                setStatus((prev) => prev ? {
                    ...prev,
                    goalDistribution: data.distribution,
                } : null);
                setShowPicker(false);
            } else {
                setMessage(data.error);
            }
        } catch {
            setMessage("設定失敗");
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

    const currentStreak = status?.streak || 0;
    const milestone = status?.milestone || 40;
    const progress = milestone > 0 ? (currentStreak / milestone) * 100 : 0;

    // 篩選配布
    const generations = [...new Set(distributions.map(d => d.generation).filter(Boolean))].sort((a, b) => (a || 0) - (b || 0));
    const filteredDistributions = selectedGen
        ? distributions.filter(d => d.generation === selectedGen)
        : distributions;

    return (
        <section className="space-y-6">
            {/* 頁面標題 */}
            <header>
                <h1 className="text-2xl font-semibold text-white/90">每日簽到</h1>
                <p className="mt-1 text-sm text-white/60">
                    每日簽到累積幸運點數，連續 {milestone} 天可獲得寶可夢配布獎勵！
                </p>
            </header>

            {/* 簽到主區塊 */}
            <div className="glass-card overflow-hidden">
                {/* 頂部統計 */}
                <div className="grid grid-cols-3 divide-x divide-white/10 border-b border-white/10">
                    <div className="p-4 text-center">
                        <p className="text-xs uppercase tracking-wider text-white/50">連續簽到</p>
                        <p className="mt-1 text-2xl font-bold text-amber-400">
                            {currentStreak} <span className="text-sm text-white/50">天</span>
                        </p>
                    </div>
                    <div className="p-4 text-center">
                        <p className="text-xs uppercase tracking-wider text-white/50">幸運點數</p>
                        <p className="mt-1 text-2xl font-bold text-emerald-400">
                            {status?.fortunePoints || 0} <span className="text-sm text-white/50">點</span>
                        </p>
                    </div>
                    <div className="p-4 text-center">
                        <p className="text-xs uppercase tracking-wider text-white/50">
                            {(status?.debt || 0) > 0 ? "補簽債務" : "距離獎勵"}
                        </p>
                        <p className={`mt-1 text-2xl font-bold ${(status?.debt || 0) > 0 ? "text-red-400" : "text-blue-400"}`}>
                            {(status?.debt || 0) > 0
                                ? `${status?.debt}`
                                : `${milestone - currentStreak}`
                            } <span className="text-sm text-white/50">天</span>
                        </p>
                    </div>
                </div>

                {/* 40 天進度條 */}
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between text-xs text-white/50 mb-2">
                        <span>🎁 {milestone} 天獎勵進度</span>
                        <span>{currentStreak} / {milestone}</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500 relative"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        >
                            {progress > 10 && (
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-black font-bold">
                                    {Math.round(progress)}%
                                </span>
                            )}
                        </div>
                    </div>

                    {/* 目標寶可夢 */}
                    <div className="mt-3 flex items-center justify-between">
                        {status?.goalDistribution ? (
                            <div className="flex items-center gap-2">
                                {status.goalDistribution.pokemon_sprite_url && (
                                    <Image
                                        src={status.goalDistribution.pokemon_sprite_url}
                                        alt={status.goalDistribution.pokemon_name}
                                        width={32}
                                        height={32}
                                        className="pixelated"
                                    />
                                )}
                                <span className="text-sm text-white/80">
                                    目標獎勵：<span className="text-amber-400 font-semibold">{status.goalDistribution.pokemon_name}</span>
                                    {status.goalDistribution.is_shiny && " ✨"}
                                </span>
                            </div>
                        ) : (
                            <span className="text-sm text-white/50">尚未設定目標獎勵</span>
                        )}
                        <button
                            onClick={loadDistributions}
                            disabled={loadingDist}
                            className="text-sm text-amber-400 hover:underline disabled:opacity-50"
                        >
                            {loadingDist ? "載入中..." : status?.goalDistribution ? "更換" : "選擇獎勵"}
                        </button>
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
                            className={`mt-4 text-sm ${message.includes("成功") || message.includes("恭喜")
                                ? "text-emerald-400"
                                : "text-red-400"
                                }`}
                        >
                            {message}
                        </p>
                    )}
                </div>

                {/* 連續簽到獎勵預覽（7天） */}
                <div className="border-t border-white/10 px-6 py-4">
                    <p className="mb-3 text-center text-xs text-white/50">每日點數獎勵（連續簽到遞增）</p>
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                            <div
                                key={day}
                                className={`flex h-10 w-10 flex-col items-center justify-center rounded-lg text-xs ${day <= (currentStreak % 7 || (currentStreak > 0 ? 7 : 0))
                                    ? "bg-amber-500/20 text-amber-400"
                                    : "bg-white/5 text-white/30"
                                    }`}
                            >
                                <span className="font-bold">{day}</span>
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
                    <li>• 連續簽到 {milestone} 天可獲得你設定的寶可夢配布獎勵！</li>
                    <li>• 斷簽一天需要額外簽到兩天才能恢復進度</li>
                    <li>• 幸運點數可用於未來的特殊活動抽獎</li>
                </ul>
            </div>

            {/* 目標選擇器 Modal */}
            {showPicker && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                    onClick={() => setShowPicker(false)}
                >
                    <div
                        className="w-full max-w-md max-h-[70vh] overflow-hidden rounded-2xl bg-slate-800 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-white/10">
                            <h3 className="text-lg font-semibold text-white">選擇目標獎勵寶可夢</h3>
                            <p className="text-xs text-white/50 mt-1">連續簽到 {milestone} 天後可獲得</p>
                        </div>

                        {/* 世代篩選 */}
                        {generations.length > 0 && (
                            <div className="p-3 border-b border-white/10 flex gap-2 overflow-x-auto">
                                <button
                                    onClick={() => setSelectedGen(null)}
                                    className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${!selectedGen ? "bg-amber-500 text-black" : "bg-white/10 text-white/60"
                                        }`}
                                >
                                    全部
                                </button>
                                {generations.map((gen) => (
                                    <button
                                        key={gen}
                                        onClick={() => setSelectedGen(gen || null)}
                                        className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${selectedGen === gen ? "bg-amber-500 text-black" : "bg-white/10 text-white/60"
                                            }`}
                                    >
                                        第 {gen} 世代
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* 配布列表 */}
                        <div className="p-3 max-h-[50vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-2">
                                {filteredDistributions.map((dist) => (
                                    <button
                                        key={dist.id}
                                        onClick={() => handleSetGoal(dist.id)}
                                        className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-left"
                                    >
                                        {dist.pokemon_sprite_url && (
                                            <Image
                                                src={dist.pokemon_sprite_url}
                                                alt={dist.pokemon_name}
                                                width={40}
                                                height={40}
                                                className="pixelated"
                                            />
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-sm text-white truncate">
                                                {dist.pokemon_name}
                                                {dist.is_shiny && " ✨"}
                                            </p>
                                            {dist.pokemon_name_en && (
                                                <p className="text-[10px] text-white/40 truncate">{dist.pokemon_name_en}</p>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-3 border-t border-white/10">
                            <button
                                onClick={() => setShowPicker(false)}
                                className="w-full py-2 rounded-lg bg-white/10 text-white/60 text-sm hover:bg-white/20"
                            >
                                取消
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
