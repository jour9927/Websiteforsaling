"use client";

import { useState, useEffect, useCallback } from "react";
import { MemberOnlyBlock } from "@/components/MemberOnlyBlock";
import Image from "next/image";

type Distribution = {
    id: string;
    pokemon_name: string;
    pokemon_name_en?: string;
    pokemon_sprite_url?: string;
    is_shiny?: boolean;
    generation?: number;
    original_trainer?: string;
    event_name?: string;
};

type TierStatus = {
    name: string;
    requiredStreak: number | null;
    requiredPoints: number | null;
    allowedGenerations: number[];
    description: string;
    unlocked: boolean;
    goalId: string | null;
    claimedAt: string | null;
    canSelect: boolean;
    progress: number;
    target: number;
};

type TiersData = {
    tier_12: TierStatus;
    tier_40: TierStatus;
    tier_points: TierStatus;
};

type CheckInStatus = {
    canCheckIn: boolean;
    streak: number;
    fortunePoints: number;
    lastCheckIn: string | null;
    debt: number;
};

type TierKey = "tier_12" | "tier_40" | "tier_points";

export default function CheckInPage() {
    const [status, setStatus] = useState<CheckInStatus | null>(null);
    const [tiers, setTiers] = useState<TiersData | null>(null);
    const [goalDistributions, setGoalDistributions] = useState<Record<string, Distribution>>({});
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [showAnimation, setShowAnimation] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(true);

    // 目標選擇相關
    const [showPicker, setShowPicker] = useState(false);
    const [selectedTier, setSelectedTier] = useState<TierKey | null>(null);
    const [distributions, setDistributions] = useState<Distribution[]>([]);
    const [loadingDist, setLoadingDist] = useState(false);
    const [selectedGen, setSelectedGen] = useState<number | null>(null);

    // 取得簽到狀態和層級資訊
    const loadData = useCallback(async () => {
        try {
            const [checkInRes, tiersRes] = await Promise.all([
                fetch("/api/check-in"),
                fetch("/api/check-in/goal")
            ]);

            if (checkInRes.status === 401) {
                setIsLoggedIn(false);
                setLoading(false);
                return;
            }

            const checkInData = await checkInRes.json();
            const tiersData = await tiersRes.json();

            if (checkInData && !checkInData.error) {
                setStatus(checkInData);
            }
            if (tiersData.tiers) {
                setTiers(tiersData.tiers);
                setGoalDistributions(tiersData.goalDistributions || {});
            }
        } catch (error) {
            console.error("Load data error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

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
                // 重新載入層級狀態
                loadData();
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

    // 載入特定層級的配布列表
    const loadDistributions = async (tier: TierKey) => {
        setLoadingDist(true);
        setSelectedTier(tier);
        setSelectedGen(null);
        try {
            const res = await fetch(`/api/check-in/goal?tier=${tier}`);
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
        if (!selectedTier) return;

        try {
            const res = await fetch("/api/check-in/goal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tier: selectedTier, distributionId: distId }),
            });
            const data = await res.json();

            if (data.success) {
                setMessage(data.message);
                setShowPicker(false);
                // 重新載入層級狀態
                loadData();
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
    const currentPoints = status?.fortunePoints || 0;

    // 🔥 連勝燃燒等級
    const getStreakFlame = (streak: number) => {
        if (streak >= 30) return { emoji: "🔥", label: "傳說連勝", color: "text-purple-400", bg: "from-purple-500/20", animate: true };
        if (streak >= 14) return { emoji: "🔥", label: "超級連勝", color: "text-orange-400", bg: "from-orange-500/20", animate: true };
        if (streak >= 7) return { emoji: "🔥", label: "燃燒中", color: "text-amber-400", bg: "from-amber-500/20", animate: true };
        return { emoji: "", label: "", color: "", bg: "", animate: false };
    };
    const flame = getStreakFlame(currentStreak);

    // 篩選配布
    const generations = [...new Set(distributions.map(d => d.generation).filter(Boolean))].sort((a, b) => (a || 0) - (b || 0));
    const filteredDistributions = selectedGen
        ? distributions.filter(d => d.generation === selectedGen)
        : distributions;

    // 渲染獎勵層級卡片
    const renderTierCard = (tierKey: TierKey, tier: TierStatus) => {
        const goal = tier.goalId ? goalDistributions[tier.goalId] : null;
        const progress = tier.target > 0 ? (tier.progress / tier.target) * 100 : 0;
        const isPoints = tierKey === "tier_points";

        const tierColors: Record<TierKey, { border: string; bg: string; text: string }> = {
            tier_12: { border: "border-emerald-500/30", bg: "from-emerald-500/10", text: "text-emerald-400" },
            tier_40: { border: "border-amber-500/30", bg: "from-amber-500/10", text: "text-amber-400" },
            tier_points: { border: "border-purple-500/30", bg: "from-purple-500/10", text: "text-purple-400" }
        };
        const colors = tierColors[tierKey];

        return (
            <div key={tierKey} className={`glass-card p-4 border ${colors.border} bg-gradient-to-b ${colors.bg} to-transparent`}>
                <div className="flex items-start gap-4">
                    {/* 左側：寶可夢圖片或佔位 */}
                    <div className="relative shrink-0">
                        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                            <circle
                                cx="50" cy="50" r="45" fill="none"
                                stroke={tier.unlocked ? "currentColor" : "rgba(255,255,255,0.2)"}
                                strokeWidth="6" strokeLinecap="round"
                                strokeDasharray={`${progress * 2.83} 283`}
                                className={`transition-all duration-500 ${colors.text}`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            {goal?.pokemon_sprite_url ? (
                                <Image
                                    src={goal.pokemon_sprite_url}
                                    alt={goal.pokemon_name}
                                    width={40}
                                    height={40}
                                    className="pixelated"
                                />
                            ) : (
                                <span className="text-2xl text-white/20">
                                    {tier.unlocked && tier.canSelect ? "+" : "🔒"}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* 右側：資訊 */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <h3 className={`text-sm font-bold ${colors.text}`}>{tier.name}</h3>
                            <span className="text-xs text-white/50">
                                {tier.progress}/{tier.target} {isPoints ? "點" : "天"}
                            </span>
                        </div>
                        <p className="text-xs text-white/50 mt-0.5">
                            可選第 {tier.allowedGenerations.join("、")} 世代
                        </p>

                        {goal ? (
                            <div className="mt-2">
                                <p className="text-sm text-white">
                                    {goal.pokemon_name}
                                    {goal.is_shiny && " ✨"}
                                </p>
                                <p className="text-[10px] text-white/40">{goal.event_name || "配布寶可夢"}</p>
                                {tier.claimedAt && (
                                    <p className="text-[10px] text-emerald-400 mt-1">✓ 已領取</p>
                                )}
                            </div>
                        ) : tier.canSelect ? (
                            <button
                                onClick={() => loadDistributions(tierKey)}
                                disabled={loadingDist}
                                className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${colors.text} bg-white/10 hover:bg-white/20 transition`}
                            >
                                {loadingDist && selectedTier === tierKey ? "載入中..." : "選擇目標"}
                            </button>
                        ) : tier.goalId ? (
                            <p className="text-[10px] text-white/40 mt-2">已設定（無法變更）</p>
                        ) : (
                            <p className="text-[10px] text-white/40 mt-2">
                                {tier.unlocked ? "尚未設定" : `還差 ${tier.target - tier.progress} ${isPoints ? "點" : "天"}`}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <section className="space-y-6">
            {/* 頁面標題 */}
            <header>
                <h1 className="text-2xl font-semibold text-white/90">每日簽到</h1>
                <p className="mt-1 text-sm text-white/60">
                    累積簽到天數和幸運點數，解鎖珍貴的寶可夢配布獎勵！
                </p>
            </header>

            {/* 簽到主區塊 */}
            <div className="glass-card overflow-hidden">
                {/* 頂部統計 */}
                <div className="grid grid-cols-3 divide-x divide-white/10 border-b border-white/10">
                    <div className={`p-4 text-center relative ${flame.animate ? `bg-gradient-to-b ${flame.bg} to-transparent` : ""}`}>
                        <p className="text-xs uppercase tracking-wider text-white/50">連續簽到</p>
                        <p className={`mt-1 text-2xl font-bold ${flame.color || "text-amber-400"}`}>
                            {flame.animate && (
                                <span className="animate-pulse mr-1">{flame.emoji}</span>
                            )}
                            {currentStreak} <span className="text-sm text-white/50">天</span>
                        </p>
                        {flame.label && (
                            <p className={`text-[10px] ${flame.color} mt-0.5`}>{flame.label}</p>
                        )}
                    </div>
                    <div className="p-4 text-center">
                        <p className="text-xs uppercase tracking-wider text-white/50">幸運點數</p>
                        <p className="mt-1 text-2xl font-bold text-emerald-400">
                            {currentPoints} <span className="text-sm text-white/50">點</span>
                        </p>
                    </div>
                    <div className="p-4 text-center">
                        <p className="text-xs uppercase tracking-wider text-white/50">
                            {(status?.debt || 0) > 0 ? "補簽債務" : "狀態"}
                        </p>
                        <p className={`mt-1 text-2xl font-bold ${(status?.debt || 0) > 0 ? "text-red-400" : "text-blue-400"}`}>
                            {(status?.debt || 0) > 0
                                ? `${status?.debt}`
                                : status?.canCheckIn ? "可簽到" : "已簽到"
                            }
                        </p>
                    </div>
                </div>

                {/* 簽到按鈕 */}
                <div className="flex flex-col items-center p-8">
                    <button
                        onClick={handleCheckIn}
                        disabled={!status?.canCheckIn || checking}
                        className={`relative h-28 w-28 rounded-full text-xl font-bold transition-all duration-300 ${status?.canCheckIn
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
                        {showAnimation && (
                            <span className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-30" />
                        )}
                    </button>

                    {message && (
                        <p className={`mt-4 text-sm ${message.includes("成功") || message.includes("恭喜") || message.includes("已將")
                            ? "text-emerald-400"
                            : "text-red-400"
                            }`}>
                            {message}
                        </p>
                    )}
                </div>
            </div>

            {/* 三層級獎勵卡片 */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white/80">🎁 獎勵進度</h2>
                {tiers && (
                    <div className="space-y-3">
                        {renderTierCard("tier_12", tiers.tier_12)}
                        {renderTierCard("tier_40", tiers.tier_40)}
                        {renderTierCard("tier_points", tiers.tier_points)}
                    </div>
                )}
            </div>

            {/* 說明區塊 */}
            <div className="glass-card p-4">
                <h3 className="text-sm font-semibold text-white/80">📌 簽到規則</h3>
                <ul className="mt-2 space-y-1 text-xs text-white/60">
                    <li>• 每日簽到可獲得幸運點數（有 10% 機率獲得雙倍！🎰）</li>
                    <li>• 連續簽到天數越多，每日獲得的點數越多（最多 7 點/天）</li>
                    <li>• <span className="text-emerald-400">12 天</span>：可選第 9 世代寶可夢</li>
                    <li>• <span className="text-amber-400">40 天</span>：可選第 7-9 世代寶可夢</li>
                    <li>• <span className="text-purple-400">120 點</span>：可選第 6-9 世代寶可夢</li>
                    <li>• ⚠️ 目標一旦選定<span className="text-red-400">無法變更</span>，請謹慎選擇</li>
                    <li>• 斷簽一天需要額外簽到兩天才能恢復進度</li>
                </ul>
            </div>

            {/* 目標選擇器 Modal */}
            {showPicker && selectedTier && tiers && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                    onClick={() => setShowPicker(false)}
                >
                    <div
                        className="w-full max-w-md max-h-[80vh] overflow-hidden rounded-2xl bg-slate-800 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-white/10">
                            <h3 className="text-lg font-semibold text-white">
                                選擇 {tiers[selectedTier].name} 目標
                            </h3>
                            <p className="text-xs text-white/50 mt-1">
                                可選第 {tiers[selectedTier].allowedGenerations.join("、")} 世代
                            </p>
                            <p className="text-xs text-red-400 mt-1">
                                ⚠️ 選定後無法變更，請謹慎選擇
                            </p>
                        </div>

                        {/* 世代篩選 */}
                        {generations.length > 1 && (
                            <div className="p-3 border-b border-white/10 flex gap-2 overflow-x-auto">
                                <button
                                    onClick={() => setSelectedGen(null)}
                                    className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${!selectedGen ? "bg-amber-500 text-black" : "bg-white/10 text-white/60"}`}
                                >
                                    全部
                                </button>
                                {generations.map((gen) => (
                                    <button
                                        key={gen}
                                        onClick={() => setSelectedGen(gen || null)}
                                        className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${selectedGen === gen ? "bg-amber-500 text-black" : "bg-white/10 text-white/60"}`}
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
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-white truncate">
                                                {dist.pokemon_name}
                                                {dist.is_shiny && " ✨"}
                                            </p>
                                            <p className="text-[10px] text-amber-400/70 truncate">
                                                {dist.event_name || dist.original_trainer || "配布"}
                                            </p>
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
