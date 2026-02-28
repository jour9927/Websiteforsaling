"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { detectLanguage, getLanguageTag, getLanguageStyle } from "@/lib/utils/language";

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

interface ShopContentProps {
    distributions: Distribution[];
    userCollected: string[];
    isLoggedIn: boolean;
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

// 稀有度等級
function getRarityInfo(points: number) {
    if (points >= 900000) return { label: "傳說", color: "from-red-500/40 to-orange-500/40", border: "border-red-500/50", badge: "bg-gradient-to-r from-red-500 to-orange-500", textColor: "text-red-300" };
    if (points >= 350000) return { label: "史詩", color: "from-amber-500/30 to-yellow-500/30", border: "border-amber-500/40", badge: "bg-gradient-to-r from-amber-500 to-yellow-500", textColor: "text-amber-300" };
    if (points >= 120000) return { label: "稀有", color: "from-purple-500/25 to-pink-500/25", border: "border-purple-500/35", badge: "bg-gradient-to-r from-purple-500 to-pink-500", textColor: "text-purple-300" };
    if (points >= 50000) return { label: "精良", color: "from-blue-500/20 to-cyan-500/20", border: "border-blue-500/30", badge: "bg-gradient-to-r from-blue-500 to-cyan-500", textColor: "text-blue-300" };
    if (points >= 10000) return { label: "優質", color: "from-emerald-500/15 to-green-500/15", border: "border-emerald-500/25", badge: "bg-gradient-to-r from-emerald-500 to-green-500", textColor: "text-emerald-300" };
    return { label: "普通", color: "from-white/5 to-white/5", border: "border-white/15", badge: "bg-white/20", textColor: "text-white/60" };
}

// 格式化點數
function formatPoints(points: number): string {
    return points.toLocaleString();
}

// 排序選項
type SortOption = "price-desc" | "price-asc" | "gen-desc" | "gen-asc" | "name";

export default function ShopContent({
    distributions,
    userCollected,
    isLoggedIn,
}: ShopContentProps) {
    const [selectedGen, setSelectedGen] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>("price-desc");
    const [selectedRarity, setSelectedRarity] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<Distribution | null>(null);
    const [hideOwned, setHideOwned] = useState(false);

    const availableGens = useMemo(() => {
        const gens = new Set(distributions.map(d => d.generation));
        return [...gens].sort((a, b) => b - a);
    }, [distributions]);

    // 篩選
    const filteredDistributions = useMemo(() => {
        let result = distributions.filter((dist) => {
            if (selectedGen && dist.generation !== selectedGen) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const nameMatch = dist.pokemon_name.toLowerCase().includes(q);
                const enMatch = dist.pokemon_name_en?.toLowerCase().includes(q);
                const eventMatch = dist.event_name?.toLowerCase().includes(q);
                if (!nameMatch && !enMatch && !eventMatch) return false;
            }
            if (selectedRarity) {
                const rarity = getRarityInfo(dist.points || 0);
                if (rarity.label !== selectedRarity) return false;
            }
            if (hideOwned && userCollected.includes(dist.id)) return false;
            return true;
        });

        // 排序
        result.sort((a, b) => {
            switch (sortBy) {
                case "price-desc": return (b.points || 0) - (a.points || 0);
                case "price-asc": return (a.points || 0) - (b.points || 0);
                case "gen-desc": return b.generation - a.generation;
                case "gen-asc": return a.generation - b.generation;
                case "name": return a.pokemon_name.localeCompare(b.pokemon_name, "zh-TW");
                default: return 0;
            }
        });

        return result;
    }, [distributions, selectedGen, searchQuery, sortBy, selectedRarity, hideOwned, userCollected]);

    // 統計
    const totalItems = filteredDistributions.length;
    const rarityStats = useMemo(() => {
        const stats: Record<string, number> = {};
        distributions.forEach(d => {
            const r = getRarityInfo(d.points || 0);
            stats[r.label] = (stats[r.label] || 0) + 1;
        });
        return stats;
    }, [distributions]);

    return (
        <div className="space-y-6">
            {/* 商店標題 */}
            <section className="glass-card p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            🏪 配布商店
                        </h1>
                        <p className="text-white/60 mt-1">
                            瀏覽歷史配布寶可夢，找到你想入手的配布！
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-center px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                            <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                                {totalItems}
                            </p>
                            <p className="text-[10px] text-white/40">件商品</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 篩選列 */}
            <section className="glass-card p-4 space-y-3">
                {/* 搜尋 + 排序 */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        placeholder="搜尋寶可夢名稱、活動..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm"
                    />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="px-3 py-2 rounded-lg bg-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none cursor-pointer"
                    >
                        <option value="price-desc" className="bg-slate-800">💎 價格高→低</option>
                        <option value="price-asc" className="bg-slate-800">💎 價格低→高</option>
                        <option value="gen-desc" className="bg-slate-800">🔢 世代新→舊</option>
                        <option value="gen-asc" className="bg-slate-800">🔢 世代舊→新</option>
                        <option value="name" className="bg-slate-800">🔤 名稱排序</option>
                    </select>
                </div>

                {/* 世代 + 稀有度篩選 */}
                <div className="flex flex-wrap gap-2">
                    {/* 世代按鈕 */}
                    <button
                        onClick={() => setSelectedGen(null)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${selectedGen === null
                            ? "bg-white text-slate-900"
                            : "bg-white/10 text-white/70 hover:bg-white/20"
                            }`}
                    >
                        全世代
                    </button>
                    {availableGens.map((gen) => (
                        <button
                            key={gen}
                            onClick={() => setSelectedGen(selectedGen === gen ? null : gen)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${selectedGen === gen
                                ? `bg-gradient-to-r ${genColors[gen] || "from-gray-500 to-gray-700"} text-white`
                                : "bg-white/10 text-white/70 hover:bg-white/20"
                                }`}
                        >
                            Gen{gen}
                        </button>
                    ))}

                    <span className="w-px h-6 bg-white/20 self-center mx-1" />

                    {/* 稀有度篩選 */}
                    {["傳說", "史詩", "稀有", "精良", "優質", "普通"].map((label) => (
                        <button
                            key={label}
                            onClick={() => setSelectedRarity(selectedRarity === label ? null : label)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${selectedRarity === label
                                ? "bg-amber-500 text-black"
                                : "bg-white/10 text-white/70 hover:bg-white/20"
                                }`}
                        >
                            {label} {rarityStats[label] ? `(${rarityStats[label]})` : ""}
                        </button>
                    ))}
                </div>

                {/* 額外選項 */}
                {isLoggedIn && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setHideOwned(!hideOwned)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${hideOwned
                                ? "bg-green-500 text-black"
                                : "bg-white/10 text-white/70 hover:bg-white/20"
                                }`}
                        >
                            {hideOwned ? "✓ 隱藏已擁有" : "隱藏已擁有"}
                        </button>
                    </div>
                )}
            </section>

            {/* 商品列表 */}
            {filteredDistributions.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <p className="text-white/50 text-lg">找不到符合條件的配布</p>
                    <p className="text-white/30 text-sm mt-2">試試改變篩選條件</p>
                </div>
            ) : (
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDistributions.map((dist) => {
                        const rarity = getRarityInfo(dist.points || 0);
                        const isOwned = userCollected.includes(dist.id);
                        const lang = detectLanguage(dist.original_trainer);

                        return (
                            <div
                                key={dist.id}
                                onClick={() => setSelectedItem(dist)}
                                className={`relative glass-card overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border ${rarity.border} ${isOwned ? "ring-1 ring-green-500/40" : ""}`}
                            >
                                {/* 稀有度標籤 */}
                                <div className="absolute top-3 left-3 z-10">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${rarity.badge}`}>
                                        {rarity.label}
                                    </span>
                                </div>

                                {/* 已擁有標記 */}
                                {isOwned && (
                                    <div className="absolute top-3 right-3 z-10">
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500 text-black">
                                            ✓ 已擁有
                                        </span>
                                    </div>
                                )}

                                {/* 閃光標記 */}
                                {dist.is_shiny && (
                                    <div className="absolute top-3 right-3 z-10" style={isOwned ? { right: "5.5rem" } : {}}>
                                        <span className="text-sm">✨</span>
                                    </div>
                                )}

                                {/* 卡片內容 */}
                                <div className={`p-5 bg-gradient-to-br ${rarity.color}`}>
                                    <div className="flex items-start gap-4">
                                        {/* 寶可夢圖片 */}
                                        <div className="flex-shrink-0">
                                            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${genColors[dist.generation] || "from-gray-500 to-gray-700"} p-1`}>
                                                <div className="w-full h-full rounded-xl bg-slate-800/80 flex items-center justify-center overflow-hidden">
                                                    {dist.pokemon_sprite_url ? (
                                                        <img
                                                            src={dist.pokemon_sprite_url}
                                                            alt={dist.pokemon_name}
                                                            className="w-16 h-16 object-contain"
                                                            referrerPolicy="no-referrer"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = "none";
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="text-3xl">{dist.pokemon_name.slice(0, 1)}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 資訊區 */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-white font-semibold flex items-center gap-1.5 flex-wrap">
                                                {dist.pokeball_image_url && (
                                                    <img src={dist.pokeball_image_url} alt="" className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
                                                )}
                                                {dist.pokemon_name}
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getLanguageStyle(lang)}`}>
                                                    {getLanguageTag(lang)}
                                                </span>
                                            </h3>
                                            <p className="text-xs text-white/50 mt-0.5 truncate">
                                                {dist.event_name || dist.original_trainer || "—"}
                                            </p>

                                            {/* 標籤列 */}
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-white/60">
                                                    Gen{dist.generation}
                                                </span>
                                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-white/60">
                                                    Lv.{dist.level || "?"}
                                                </span>
                                                {dist.distribution_method && (
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${dist.distribution_method.includes("序號") ? "bg-blue-500/20 text-blue-400" :
                                                        dist.distribution_method.includes("密語") ? "bg-purple-500/20 text-purple-400" :
                                                            dist.distribution_method.includes("HOME") ? "bg-green-500/20 text-green-400" :
                                                                "bg-white/10 text-white/60"
                                                        }`}>
                                                        {dist.distribution_method.split(" ")[0]}
                                                    </span>
                                                )}
                                            </div>

                                            {/* 遊戲版本 */}
                                            {dist.game_titles && dist.game_titles.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                    {dist.game_titles.slice(0, 3).map((title, i) => (
                                                        <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/15 text-indigo-300/80 border border-indigo-500/20">
                                                            🎮 {title}
                                                        </span>
                                                    ))}
                                                    {dist.game_titles.length > 3 && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-white/40">
                                                            +{dist.game_titles.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 價格區 */}
                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                                        <div>
                                            <span className={`text-lg font-bold ${rarity.textColor}`}>
                                                💎 {formatPoints(dist.points || 0)}
                                            </span>
                                            <span className="text-[10px] text-white/30 ml-1">點</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedItem(dist);
                                            }}
                                            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-bold hover:from-amber-400 hover:to-orange-400 transition-all active:scale-95"
                                        >
                                            查看詳情
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </section>
            )}

            {/* 商品詳情 Modal */}
            {selectedItem && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.6)" }}
                    onClick={() => setSelectedItem(null)}
                >
                    <div
                        className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 關閉按鈕 */}
                        <button
                            onClick={() => setSelectedItem(null)}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition"
                        >
                            ✕
                        </button>

                        {(() => {
                            const rarity = getRarityInfo(selectedItem.points || 0);
                            const lang = detectLanguage(selectedItem.original_trainer);
                            const isOwned = userCollected.includes(selectedItem.id);

                            return (
                                <>
                                    {/* 頂部：圖片 + 名稱 */}
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${genColors[selectedItem.generation] || "from-gray-500 to-gray-700"} p-1 flex-shrink-0`}>
                                            <div className="w-full h-full rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden">
                                                {selectedItem.pokemon_sprite_url ? (
                                                    <img
                                                        src={selectedItem.pokemon_sprite_url}
                                                        alt={selectedItem.pokemon_name}
                                                        className="w-20 h-20 object-contain"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                ) : (
                                                    <span className="text-4xl">{selectedItem.pokemon_name.slice(0, 1)}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h2 className="text-xl font-bold text-white">{selectedItem.pokemon_name}</h2>
                                                {selectedItem.is_shiny && <span>✨</span>}
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${rarity.badge} text-white`}>
                                                    {rarity.label}
                                                </span>
                                            </div>
                                            {selectedItem.pokemon_name_en && (
                                                <p className="text-sm text-white/50 mt-0.5">{selectedItem.pokemon_name_en}</p>
                                            )}
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getLanguageStyle(lang)}`}>
                                                    {getLanguageTag(lang)}
                                                </span>
                                                {isOwned && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500 text-black font-bold">
                                                        ✓ 已擁有
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 資訊表格 */}
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between py-2 border-b border-white/10">
                                            <span className="text-white/50">配布活動</span>
                                            <span className="text-white font-medium">{selectedItem.event_name || "—"}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-white/10">
                                            <span className="text-white/50">世代</span>
                                            <span className="text-white">第 {selectedItem.generation} 世代</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-white/10">
                                            <span className="text-white/50">原始等級</span>
                                            <span className="text-white">Lv. {selectedItem.level || "?"}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-white/10">
                                            <span className="text-white/50">親名 / ID</span>
                                            <span className="text-white">
                                                {selectedItem.original_trainer || "—"}
                                                {selectedItem.trainer_id && ` / ${selectedItem.trainer_id}`}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-white/10">
                                            <span className="text-white/50">配布方式</span>
                                            <span className="text-white">{selectedItem.distribution_method || "—"}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-white/10">
                                            <span className="text-white/50">配布地區</span>
                                            <span className="text-white">{selectedItem.region || "—"}</span>
                                        </div>
                                        {selectedItem.special_move && (
                                            <div className="flex justify-between py-2 border-b border-white/10">
                                                <span className="text-white/50">特殊招式</span>
                                                <span className="text-amber-400 font-medium">{selectedItem.special_move}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between py-2 border-b border-white/10">
                                            <span className="text-white/50">配布時間</span>
                                            <span className="text-white">
                                                {selectedItem.distribution_period_start
                                                    ? `${selectedItem.distribution_period_start}${selectedItem.distribution_period_end ? ` ~ ${selectedItem.distribution_period_end}` : ""}`
                                                    : "—"
                                                }
                                            </span>
                                        </div>
                                        {selectedItem.game_titles && selectedItem.game_titles.length > 0 && (
                                            <div className="flex justify-between py-2 border-b border-white/10">
                                                <span className="text-white/50">對應遊戲</span>
                                                <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                                                    {selectedItem.game_titles.map((t, i) => (
                                                        <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/15 text-indigo-300/80 border border-indigo-500/20">
                                                            {t}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* 價格 + 購買區 */}
                                    <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-white/70 text-sm">參考定價</span>
                                            <span className={`text-2xl font-bold ${rarity.textColor}`}>
                                                💎 {formatPoints(selectedItem.points || 0)} 點
                                            </span>
                                        </div>

                                        {isLoggedIn ? (
                                            <Link
                                                href={`/messages?subject=${encodeURIComponent(`【購買詢問】${selectedItem.pokemon_name}（${selectedItem.event_name || "配布"}）`)}`}
                                                className="block w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-sm text-center hover:from-amber-400 hover:to-orange-400 transition-all active:scale-[0.98] shadow-lg shadow-amber-500/25"
                                            >
                                                📩 聯繫管理員購買
                                            </Link>
                                        ) : (
                                            <Link
                                                href="/login?redirect=/shop"
                                                className="block w-full py-3 rounded-xl bg-white/10 text-white font-bold text-sm text-center hover:bg-white/20 transition-all"
                                            >
                                                登入後即可購買
                                            </Link>
                                        )}

                                        <p className="text-[10px] text-white/30 text-center mt-2">
                                            點擊後將跳轉至訊息頁面，由管理員確認交易細節
                                        </p>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* 未登入提示 */}
            {!isLoggedIn && (
                <div className="glass-card p-6 text-center">
                    <p className="text-white/70">登入後即可查看已擁有狀態並聯繫購買</p>
                    <Link
                        href="/login?redirect=/shop"
                        className="inline-block mt-4 px-6 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-black font-medium hover:opacity-90 transition"
                    >
                        立即登入
                    </Link>
                </div>
            )}
        </div>
    );
}
