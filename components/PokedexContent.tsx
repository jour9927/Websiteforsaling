"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { detectLanguage, getLanguageTag, getLanguageStyle } from "@/lib/utils/language";
import {
    type AttachedDistributionBadge,
    type DistributionBadge,
    type UserDistributionRecord,
    badgeRarityMeta,
    isBadgeCompatibleWithDistribution,
    sortDistributionBadges,
    sumBadgePoints,
} from "@/lib/distributionBadges";

interface Distribution {
    id: string;
    pokemon_name: string;
    pokemon_name_en?: string;
    pokemon_dex_number?: number;
    pokemon_sprite_url?: string;
    pokeball_image_url?: string;
    event_name?: string;
    generation: number;
    game_titles?: string[];
    original_trainer?: string;
    trainer_id?: string;
    level?: number;
    distribution_method?: string;
    distribution_period_start?: string;
    distribution_period_end?: string;
    region?: string;
    is_shiny?: boolean;
    special_move?: string;
    points?: number;
}

interface PokedexContentProps {
    distributions: Distribution[];
    distributionsByGen: Record<number, Distribution[]>;
    badges: DistributionBadge[];
    userCollected: string[];
    userDistributionRecords: UserDistributionRecord[];
    attachedBadgesByDistributionId: Record<string, AttachedDistributionBadge[]>;
    isLoggedIn: boolean;
    userId?: string;
}

// 確保色違寶可夢使用正確的 shiny sprite URL
function getSpriteUrl(dist: Distribution): string | undefined {
    if (!dist.pokemon_sprite_url) return undefined;
    if (dist.is_shiny && !dist.pokemon_sprite_url.includes('/shiny/')) {
        return dist.pokemon_sprite_url.replace('/sprites/pokemon/', '/sprites/pokemon/shiny/');
    }
    return dist.pokemon_sprite_url;
}

// 世代顏色
const genColors: Record<number, string> = {
    1: "from-red-500 to-red-700",
    2: "from-yellow-500 to-yellow-700",
    3: "from-emerald-500 to-emerald-700",
    4: "from-blue-500 to-blue-700",
    5: "from-gray-500 to-gray-700",
    6: "from-blue-400 to-blue-600",
    7: "from-orange-500 to-orange-700",
    8: "from-pink-500 to-pink-700",
    9: "from-purple-500 to-violet-700",
};

export default function PokedexContent({
    distributions,
    distributionsByGen,
    badges,
    userCollected: initialCollected,
    userDistributionRecords: initialUserDistributionRecords,
    attachedBadgesByDistributionId: initialAttachedBadgesByDistributionId,
    isLoggedIn,
    userId,
}: PokedexContentProps) {
    const [selectedGen, setSelectedGen] = useState<number | null>(9);
    const [collected, setCollected] = useState<string[]>(initialCollected);
    const [userDistributionRecords, setUserDistributionRecords] = useState<UserDistributionRecord[]>(initialUserDistributionRecords);
    const [attachedBadgesByDistributionId, setAttachedBadgesByDistributionId] = useState<Record<string, AttachedDistributionBadge[]>>(initialAttachedBadgesByDistributionId);
    const [searchQuery, setSearchQuery] = useState("");
    const [showCollectedOnly, setShowCollectedOnly] = useState(false);
    const [isToggling, setIsToggling] = useState<string | null>(null);
    const [activeBadgeDistributionId, setActiveBadgeDistributionId] = useState<string | null>(null);
    const [togglingBadgeId, setTogglingBadgeId] = useState<string | null>(null);
    const [showDisclaimer, setShowDisclaimer] = useState(true);

    // 根據 ID 和日期產生穩定的隨機漲跌幅（每天變化一次）
    function getFluctuation(id: string, points: number): { value: number; isPositive: boolean; type: 'normal' | 'crash' | 'boom' } {
        const today = new Date().toISOString().slice(0, 10);
        const seed = id + today;
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
        }

        const absHash = Math.abs(hash);
        const eventRoll = absHash % 100;

        let type: 'normal' | 'crash' | 'boom' = 'normal';
        let isPositive = true;
        let pct = 0;

        if (eventRoll < 2) {
            // 2% 機率：跌停板 (Crash) - 大跌 10% ~ 20%
            type = 'crash';
            isPositive = false;
            pct = ((absHash >> 8) % 1000 + 1000) / 10000; // 0.1000 ~ 0.1999
        } else if (eventRoll < 4) {
            // 2% 機率：漲停板 (Boom) - 大漲 10% ~ 20%
            type = 'boom';
            isPositive = true;
            pct = ((absHash >> 8) % 1000 + 1000) / 10000;
        } else {
            // 96% 機率：正常波動
            isPositive = eventRoll < 55; // 正常情況約 55% 機率上漲
            pct = ((absHash >> 8) % 750 + 50) / 10000; // 漲跌幅 0.5% ~ 8%
        }

        const value = points * pct;
        // 小數點：保留兩位
        const rounded = Math.round(value * 100) / 100;
        return { value: rounded, isPositive, type };
    }

    // 判斷是否為伊布家族（含所有進化型）
    function isEeveeFamily(name: string): boolean {
        return name.includes('伊布');
    }

    // 格式化點數（加小數點）
    function formatPoints(points: number): string {
        // 利用 Math.sin 結合 points 產生一個固定的 0~99 亂數作為小數點
        const decimalStr = Math.abs(Math.sin(points)).toString().slice(2, 4);
        const decimal = parseInt(decimalStr, 10) / 100;
        const display = points + decimal;
        return display.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function getUserDistributionRecord(distributionId: string): UserDistributionRecord | undefined {
        return userDistributionRecords.find(record => record.distribution_id === distributionId);
    }

    function getAttachedBadges(distributionId: string): AttachedDistributionBadge[] {
        return sortDistributionBadges(attachedBadgesByDistributionId[distributionId] || []);
    }

    function getCompatibleBadges(distributionGeneration: number): DistributionBadge[] {
        return sortDistributionBadges(badges.filter(badge => isBadgeCompatibleWithDistribution(badge, distributionGeneration)));
    }

    function getTotalPoints(dist: Distribution): number {
        return (dist.points || 0) + sumBadgePoints(getAttachedBadges(dist.id));
    }

    // 過濾配布
    const filteredDistributions = distributions.filter((dist) => {
        if (selectedGen && dist.generation !== selectedGen) return false;
        if (searchQuery && !dist.pokemon_name.includes(searchQuery) && !dist.pokemon_name_en?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (showCollectedOnly && !collected.includes(dist.id)) return false;
        return true;
    });

    // 統計
    const totalCount = selectedGen ? (distributionsByGen[selectedGen]?.length || 0) : distributions.length;
    const collectedCount = collected.filter(id =>
        selectedGen
            ? distributionsByGen[selectedGen]?.some(d => d.id === id)
            : true
    ).length;
    const visibleBadges = selectedGen
        ? sortDistributionBadges(badges.filter(badge => badge.generation === selectedGen))
        : sortDistributionBadges(badges);
    const attachedBadgeCount = Object.values(attachedBadgesByDistributionId).reduce((total, item) => total + item.length, 0);
    const attachedBadgePoints = Object.values(attachedBadgesByDistributionId).reduce((total, item) => total + sumBadgePoints(item), 0);

    // 切換收集狀態
    async function toggleCollect(distributionId: string) {
        if (!isLoggedIn || !userId) return;

        setIsToggling(distributionId);

        if (collected.includes(distributionId)) {
            // 取消收集
            await supabase
                .from("user_distributions")
                .delete()
                .eq("user_id", userId)
                .eq("distribution_id", distributionId);

            setCollected(prev => prev.filter(id => id !== distributionId));
            setUserDistributionRecords(prev => prev.filter(record => record.distribution_id !== distributionId));
            setAttachedBadgesByDistributionId(prev => {
                const next = { ...prev };
                delete next[distributionId];
                return next;
            });
            if (activeBadgeDistributionId === distributionId) setActiveBadgeDistributionId(null);
        } else {
            // 添加收集
            const { data } = await supabase
                .from("user_distributions")
                .insert({
                    user_id: userId,
                    distribution_id: distributionId,
                })
                .select("id, distribution_id")
                .single();

            setCollected(prev => [...prev, distributionId]);
            if (data) {
                setUserDistributionRecords(prev => [...prev, {
                    id: data.id as string,
                    distribution_id: data.distribution_id as string,
                }]);
            }
        }

        setIsToggling(null);
    }

    async function toggleBadge(dist: Distribution, badge: DistributionBadge) {
        if (!isLoggedIn || !userId) return;
        if (!isBadgeCompatibleWithDistribution(badge, dist.generation)) return;

        const userDistribution = getUserDistributionRecord(dist.id);
        if (!userDistribution) return;

        const attachedBadge = getAttachedBadges(dist.id).find(item => item.id === badge.id);
        setTogglingBadgeId(`${dist.id}:${badge.id}`);

        if (attachedBadge) {
            await supabase
                .from("user_distribution_badges")
                .delete()
                .eq("id", attachedBadge.attachment_id)
                .eq("user_id", userId);

            setAttachedBadgesByDistributionId(prev => ({
                ...prev,
                [dist.id]: (prev[dist.id] || []).filter(item => item.attachment_id !== attachedBadge.attachment_id),
            }));
        } else {
            const { data } = await supabase
                .from("user_distribution_badges")
                .insert({
                    user_id: userId,
                    user_distribution_id: userDistribution.id,
                    badge_id: badge.id,
                })
                .select("id, distribution_badges (*)")
                .single();

            const insertedBadge = data?.distribution_badges as unknown as DistributionBadge | null;
            if (data && insertedBadge) {
                setAttachedBadgesByDistributionId(prev => ({
                    ...prev,
                    [dist.id]: sortDistributionBadges([
                        ...(prev[dist.id] || []),
                        {
                            ...insertedBadge,
                            attachment_id: data.id as string,
                        },
                    ]),
                }));
            }
        }

        setTogglingBadgeId(null);
    }

    const availableGens = Object.keys(distributionsByGen).map(Number).sort((a, b) => b - a);

    return (
        <div className="space-y-6">
            {/* 配布圖鑑免責聲明彈窗 */}
            {showDisclaimer && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.6)' }}>
                    <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-6 shadow-2xl">
                        {/* 頂部圖標 */}
                        <div className="flex justify-center mb-4">
                            <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center">
                                <span className="text-3xl">📋</span>
                            </div>
                        </div>

                        {/* 標題 */}
                        <h2 className="text-center text-lg font-bold text-white mb-4">配布圖鑑 — 資料說明</h2>

                        {/* 內容 */}
                        <div className="space-y-3 text-sm leading-relaxed">
                            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
                                <p className="text-amber-300 font-medium mb-1">⚠️ 資料範圍說明</p>
                                <ul className="text-white/70 space-y-1.5 list-disc list-inside">
                                    <li>並非所有寶可夢配布都列在其中</li>
                                    <li>以<span className="text-amber-300 font-medium">即時交易</span>而出現在系統中的為主</li>
                                    <li>僅提供<span className="text-amber-300 font-medium">五天內有過至少十筆交易</span>以上的寶可夢配布資料</li>
                                    <li>如欲查詢五天之外的配布之個別點數，請洽管理員</li>
                                </ul>
                            </div>

                            <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3">
                                <p className="text-blue-300 font-medium mb-1">ℹ️ 免責聲明</p>
                                <p className="text-white/70">
                                    資訊整理為系統自動整理，難免有誤，敬請見諒。
                                    <br />
                                    相關問題歡迎致電管理員。
                                </p>
                            </div>
                        </div>

                        {/* 確認按鈕 */}
                        <button
                            onClick={() => setShowDisclaimer(false)}
                            className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/25 active:scale-[0.98]"
                        >
                            我知道了
                        </button>
                    </div>
                </div>
            )}
            {/* 標題區 */}
            <section className="glass-card p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">📖 配布圖鑑</h1>
                        <p className="text-white/60 mt-1">記錄你擁有的歷史配布寶可夢</p>
                    </div>

                    {/* 收集進度 */}
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                                {collectedCount}/{totalCount}
                            </p>
                            <p className="text-xs text-white/50">已收集</p>
                        </div>
                        <div className="w-32 h-3 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all"
                                style={{ width: `${totalCount > 0 ? (collectedCount / totalCount) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* 篩選區 */}
            <section className="glass-card p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* 世代選擇 */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedGen(null)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${selectedGen === null
                                ? "bg-white text-slate-900"
                                : "bg-white/10 text-white/70 hover:bg-white/20"
                                }`}
                        >
                            全部
                        </button>
                        {availableGens.map((gen) => (
                            <button
                                key={gen}
                                onClick={() => setSelectedGen(gen)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${selectedGen === gen
                                    ? `bg-gradient-to-r ${genColors[gen] || "from-gray-500 to-gray-700"} text-white`
                                    : "bg-white/10 text-white/70 hover:bg-white/20"
                                    }`}
                            >
                                第{gen}世代
                            </button>
                        ))}
                    </div>

                    {/* 搜尋 */}
                    <div className="flex-1 flex gap-2">
                        <input
                            type="text"
                            placeholder="搜尋寶可夢名稱..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                            onClick={() => setShowCollectedOnly(!showCollectedOnly)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${showCollectedOnly
                                ? "bg-yellow-500 text-black"
                                : "bg-white/10 text-white/70 hover:bg-white/20"
                                }`}
                        >
                            {showCollectedOnly ? "✓ 已收集" : "已收集"}
                        </button>
                    </div>
                </div>
            </section>

            {/* 證章 / 緞帶圖鑑 */}
            <section className="glass-card p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-bold text-white">證章與緞帶</h2>
                            <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-xs text-white/60">
                                獨立收藏軸
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-white/55">
                            按世代、年份與稀有度排序；只可附加到相容世代的已收集配布。
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[360px]">
                        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                            <p className="text-lg font-bold text-white">{visibleBadges.length}</p>
                            <p className="text-[11px] text-white/45">本頁證章</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                            <p className="text-lg font-bold text-amber-300">{attachedBadgeCount}</p>
                            <p className="text-[11px] text-white/45">已附加</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                            <p className="text-lg font-bold text-emerald-300">{attachedBadgePoints.toLocaleString()}</p>
                            <p className="text-[11px] text-white/45">加成點數</p>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                    {visibleBadges.map((badge) => (
                        <div
                            key={badge.id}
                            className={`min-w-[180px] rounded-lg border px-3 py-2 ${badgeRarityMeta[badge.rarity].className}`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-semibold">{badge.name}</p>
                                <span className="shrink-0 text-[10px]">{badge.category === "mark" ? "證章" : "緞帶"}</span>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-[11px] opacity-80">
                                <span>第{badge.generation}世代</span>
                                <span>{badge.release_year || "年份未定"}</span>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-[11px]">
                                <span>{badgeRarityMeta[badge.rarity].label}</span>
                                <span className="font-mono">+{badge.base_points.toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                    {visibleBadges.length === 0 && (
                        <p className="text-sm text-white/45">目前沒有符合此世代的證章資料</p>
                    )}
                </div>
            </section>

            {/* 配布列表 */}
            <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredDistributions.map((dist) => {
                    const isCollected = collected.includes(dist.id);
                    const isLoading = isToggling === dist.id;
                    const attachedBadges = getAttachedBadges(dist.id);
                    const compatibleBadges = getCompatibleBadges(dist.generation);
                    const isBadgePanelOpen = activeBadgeDistributionId === dist.id;

                    return (
                        <div
                            key={dist.id}
                            className={`relative glass-card p-4 transition-all cursor-pointer hover:scale-105 ${isCollected ? "ring-2 ring-yellow-500" : ""
                                }`}
                            onClick={() => toggleCollect(dist.id)}
                        >
                            {/* 收集狀態標記 */}
                            <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${isCollected ? "bg-yellow-500" : "bg-white/20"
                                }`}>
                                {isLoading ? (
                                    <span className="animate-spin text-xs">⏳</span>
                                ) : isCollected ? (
                                    <span className="text-black text-xs">✓</span>
                                ) : (
                                    <span className="text-white/50 text-xs">○</span>
                                )}
                            </div>

                            {/* 閃光標記 */}
                            {dist.is_shiny && (
                                <div className="absolute top-2 left-2 text-xs">✨</div>
                            )}

                            {/* 寶可夢圖片 */}
                            <div className="w-16 h-16 mx-auto mb-2 relative">
                                <div className={`w-full h-full rounded-full bg-gradient-to-br ${genColors[dist.generation] || "from-gray-500 to-gray-700"} p-1`}>
                                    <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                                        {getSpriteUrl(dist) ? (
                                            <img
                                                src={getSpriteUrl(dist)}
                                                alt={dist.pokemon_name}
                                                className="w-12 h-12 object-contain"
                                                referrerPolicy="no-referrer"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                }}
                                            />
                                        ) : null}
                                        <span className={`text-2xl ${dist.pokemon_sprite_url ? 'hidden' : ''}`}>
                                            {dist.pokemon_name.slice(0, 1)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 配布球 + 名稱 */}
                            <div className="flex items-center justify-center gap-1">
                                {dist.pokeball_image_url && (
                                    <img
                                        src={dist.pokeball_image_url}
                                        alt="Ball"
                                        className="w-4 h-4 object-contain"
                                        referrerPolicy="no-referrer"
                                    />
                                )}
                                <h3 className="text-center text-sm font-medium text-white flex items-center justify-center gap-1.5">
                                    {dist.pokemon_name}
                                    {(() => {
                                        const lang = detectLanguage(dist.original_trainer);
                                        return (
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getLanguageStyle(lang)}`}>
                                                {getLanguageTag(lang)}
                                            </span>
                                        );
                                    })()}
                                </h3>
                            </div>

                            {/* 配布活動 */}
                            <p className="text-center text-xs text-white/50 mt-1 truncate" title={dist.event_name}>
                                {dist.event_name || dist.original_trainer || "—"}
                            </p>

                            {/* 原始LV */}
                            <p className="text-center text-xs text-white/40 mt-0.5">
                                原始LV {dist.level || "?"}
                            </p>

                            {/* 配布時間（相對時間） */}
                            <p className="text-center text-xs text-white/30 mt-0.5">
                                {(() => {
                                    if (!dist.distribution_period_start) return "—";
                                    const startDate = new Date(dist.distribution_period_start);
                                    const now = new Date();
                                    const diffMs = now.getTime() - startDate.getTime();
                                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                    const diffMonths = Math.floor(diffDays / 30);
                                    const diffYears = Math.floor(diffDays / 365);

                                    if (diffYears >= 1) return `${diffYears}年前`;
                                    if (diffMonths >= 1) return `${diffMonths}個月前`;
                                    if (diffDays >= 1) return `${diffDays}天前`;
                                    return "今天";
                                })()}
                            </p>

                            {/* TID / 親名 */}
                            <p className="text-center text-xs text-white/30 mt-0.5 truncate px-1" title={`${dist.original_trainer || ''} ${dist.trainer_id ? '/ ID:' + dist.trainer_id : ''}`}>
                                {dist.trainer_id || dist.original_trainer ? (
                                    <>
                                        {dist.original_trainer && <span>{dist.original_trainer}</span>}
                                        {dist.trainer_id && dist.original_trainer && <span> / </span>}
                                        {dist.trainer_id && <span>ID:{dist.trainer_id}</span>}
                                    </>
                                ) : "—"}
                            </p>

                            {/* 遊戲版本 */}
                            {dist.game_titles && dist.game_titles.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap justify-center gap-1 px-1">
                                    {dist.game_titles.map((title, i) => (
                                        <span
                                            key={i}
                                            className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/15 text-indigo-300/80 border border-indigo-500/20 leading-tight"
                                        >
                                            🎮 {title}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* 獲取方式 */}
                            <div className="mt-1.5 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs ${dist.distribution_method?.includes("序號") ? "bg-blue-500/20 text-blue-400" :
                                    dist.distribution_method?.includes("密語") ? "bg-purple-500/20 text-purple-400" :
                                        dist.distribution_method?.includes("HOME") ? "bg-green-500/20 text-green-400" :
                                            dist.distribution_method?.includes("網路") || dist.distribution_method?.includes("互聯網") ? "bg-cyan-500/20 text-cyan-400" :
                                                "bg-white/10 text-white/60"
                                    }`}>
                                    {dist.distribution_method?.split(" ")[0] || "配布"}
                                </span>
                            </div>

                            {/* 已附加證章 */}
                            <div className="mt-2 space-y-1">
                                {attachedBadges.length > 0 && (
                                    <div className="flex flex-wrap justify-center gap-1">
                                        {attachedBadges.slice(0, 3).map((badge) => (
                                            <span
                                                key={badge.attachment_id}
                                                className={`max-w-full truncate rounded-full border px-1.5 py-0.5 text-[10px] ${badgeRarityMeta[badge.rarity].className}`}
                                                title={`${badge.name} +${badge.base_points.toLocaleString()}`}
                                            >
                                                {badge.name}
                                            </span>
                                        ))}
                                        {attachedBadges.length > 3 && (
                                            <span className="rounded-full border border-white/10 bg-white/10 px-1.5 py-0.5 text-[10px] text-white/55">
                                                +{attachedBadges.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {isCollected ? (
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setActiveBadgeDistributionId(isBadgePanelOpen ? null : dist.id);
                                        }}
                                        className="w-full rounded-lg border border-amber-400/25 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-200 transition hover:bg-amber-500/20"
                                    >
                                        {isBadgePanelOpen ? "收合證章" : "附加證章"}
                                    </button>
                                ) : (
                                    <p className="text-center text-[10px] text-white/30">收集後可附加證章</p>
                                )}
                            </div>

                            {isBadgePanelOpen && (
                                <div
                                    className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-slate-950/75 p-2"
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    {compatibleBadges.map((badge) => {
                                        const isAttached = attachedBadges.some(item => item.id === badge.id);
                                        const isBadgeLoading = togglingBadgeId === `${dist.id}:${badge.id}`;

                                        return (
                                            <button
                                                key={badge.id}
                                                type="button"
                                                disabled={isBadgeLoading}
                                                onClick={() => toggleBadge(dist, badge)}
                                                className={`w-full rounded-md border px-2 py-1.5 text-left text-[11px] transition disabled:opacity-60 ${isAttached
                                                    ? "border-amber-400/35 bg-amber-500/20 text-amber-100"
                                                    : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                                                    }`}
                                            >
                                                <span className="flex items-center justify-between gap-2">
                                                    <span className="truncate font-medium">{badge.name}</span>
                                                    <span className="shrink-0 font-mono">+{badge.base_points.toLocaleString()}</span>
                                                </span>
                                                <span className="mt-0.5 flex items-center justify-between gap-2 text-[10px] opacity-70">
                                                    <span>{badgeRarityMeta[badge.rarity].label} · {badge.release_year || "年份未定"}</span>
                                                    <span>{isAttached ? "已附加" : "可附加"}</span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                    {compatibleBadges.length === 0 && (
                                        <p className="text-center text-[11px] text-white/40">沒有相容證章</p>
                                    )}
                                </div>
                            )}

                            {/* 配布點數 */}
                            {dist.points ? (() => {
                                // 伊布家族遮罩
                                if (isEeveeFamily(dist.pokemon_name)) {
                                    return (
                                        <div className="mt-1.5">
                                            <p className="text-center text-[10px] px-1.5 py-1 rounded-full bg-red-500/15 text-red-400/80 font-medium leading-tight">
                                                ⚠️ 價格波動巨大
                                                <br />
                                                <span className="text-[9px] text-red-400/50">（暫不顯示）</span>
                                            </p>
                                        </div>
                                    );
                                }
                                const totalPoints = getTotalPoints(dist);
                                const badgePoints = sumBadgePoints(attachedBadges);
                                const fluct = getFluctuation(dist.id, totalPoints);
                                return (
                                    <div className="mt-1.5 space-y-0.5">
                                        <p className="text-center text-xs font-medium">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${totalPoints >= 900000 ? 'bg-gradient-to-r from-red-500/30 to-orange-500/30 text-red-300' :
                                                totalPoints >= 350000 ? 'bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-300' :
                                                    totalPoints >= 120000 ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-300' :
                                                        totalPoints >= 50000 ? 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-blue-300' :
                                                            totalPoints >= 10000 ? 'bg-gradient-to-r from-emerald-500/30 to-green-500/30 text-emerald-300' :
                                                                totalPoints >= 5000 ? 'bg-gradient-to-r from-teal-500/30 to-cyan-500/30 text-teal-300' :
                                                                    'bg-white/10 text-white/50'
                                                }`}>
                                                💎 {formatPoints(totalPoints)}
                                            </span>
                                        </p>
                                        {badgePoints > 0 && (
                                            <p className="text-center text-[10px] text-amber-300/80">
                                                證章 +{badgePoints.toLocaleString()}
                                            </p>
                                        )}
                                        <p className="text-center text-[10px] font-mono flex items-center justify-center gap-1">
                                            {fluct.type === 'crash' && <span className="px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[9px]">📉 跌停</span>}
                                            {fluct.type === 'boom' && <span className="px-1 py-0.5 rounded bg-red-500/20 text-red-400 font-bold text-[9px]">🚀 漲停</span>}
                                            <span className={fluct.type === 'crash' ? 'text-blue-400 font-bold' : fluct.type === 'boom' ? 'text-red-400 font-bold' : fluct.isPositive ? 'text-green-400' : 'text-red-400'}>
                                                {fluct.isPositive ? '+' : '-'}{fluct.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </p>
                                    </div>
                                );
                            })() : (
                                <p className="text-center text-xs text-white/20 mt-1">—</p>
                            )}
                        </div>
                    );
                })}
            </section>

            {/* 空狀態 */}
            {filteredDistributions.length === 0 && (
                <div className="glass-card p-12 text-center">
                    <p className="text-white/50 text-lg">找不到符合條件的配布</p>
                    <p className="text-white/30 text-sm mt-2">試試改變篩選條件</p>
                </div>
            )}

            {/* 未登入提示 */}
            {!isLoggedIn && (
                <div className="glass-card p-6 text-center">
                    <p className="text-white/70">登入後即可記錄你的收集進度</p>
                    <Link
                        href="/login"
                        className="inline-block mt-4 px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition"
                    >
                        立即登入
                    </Link>
                </div>
            )}
        </div>
    );
}
