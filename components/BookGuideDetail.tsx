"use client";

import { useState } from "react";
import Image from "next/image";
import { tierLabels, tierSubtitles, type GuideBook } from "@/lib/guideBooksData";

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

interface BookGuideDetailProps {
    book: GuideBook;
    distributions: Distribution[];
    collected: string[];
    isLoggedIn: boolean;
    userId?: string;
    onClose: () => void;
    onToggleCollect: (distributionId: string) => void;
}

export function BookGuideDetail({
    book,
    distributions,
    collected,
    isLoggedIn,
    onClose,
    onToggleCollect,
}: BookGuideDetailProps) {
    const [isToggling, setIsToggling] = useState<string | null>(null);
    const [isClosing, setIsClosing] = useState(false);

    const collectedCount = distributions.filter((d) =>
        collected.includes(d.id)
    ).length;
    const progress =
        distributions.length > 0
            ? Math.round((collectedCount / distributions.length) * 100)
            : 0;

    function handleClose() {
        setIsClosing(true);
        setTimeout(onClose, 300);
    }

    async function handleToggle(distributionId: string) {
        setIsToggling(distributionId);
        onToggleCollect(distributionId);
        setTimeout(() => setIsToggling(null), 300);
    }

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ${isClosing ? "opacity-0" : "opacity-100"
                }`}
            style={{ backdropFilter: "blur(12px)", backgroundColor: "rgba(0,0,0,0.75)" }}
        >
            {/* 外側點擊關閉 */}
            <div className="absolute inset-0" onClick={handleClose} />

            {/* Modal 容器 */}
            <div
                className={`relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl transition-all duration-500 ${isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
                    }`}
                style={{
                    background:
                        "linear-gradient(135deg, rgba(15,23,42,0.97) 0%, rgba(30,41,59,0.97) 100%)",
                }}
            >
                {/* 封面圖片區域 */}
                <div className="relative h-56 flex-shrink-0 overflow-hidden sm:h-64">
                    <Image
                        src={book.coverImage}
                        alt={book.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 672px"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />

                    {/* 關閉按鈕 */}
                    <button
                        onClick={handleClose}
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/70 backdrop-blur-sm transition hover:bg-black/60 hover:text-white"
                    >
                        ✕
                    </button>

                    {/* 稀有度標記 */}
                    <div
                        className={`absolute left-3 top-3 rounded-full bg-gradient-to-r ${book.themeGradient} px-3 py-1 text-xs font-bold text-white shadow-lg`}
                    >
                        {tierLabels[book.tier]}（{tierSubtitles[book.tier]}）・第{book.generation}世代
                    </div>

                    {/* 書名（覆蓋於圖片上） */}
                    <div className="absolute inset-x-0 bottom-0 p-5">
                        <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                            {book.title}
                        </h2>
                        <p className="mt-1 text-sm text-white/70">{book.subtitle}</p>
                    </div>
                </div>

                {/* 滾動內容區域 */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-5">
                    {/* 書本介紹 */}
                    <p className="text-sm leading-relaxed text-white/70">
                        {book.description}
                    </p>

                    {/* 統計卡片 */}
                    <div className="mt-5 grid grid-cols-3 gap-3">
                        <div className="rounded-xl bg-white/5 p-3 text-center">
                            <p className="text-xs text-white/40">總配布數</p>
                            <p className="mt-1 text-xl font-bold text-white">
                                {distributions.length}
                            </p>
                        </div>
                        {isLoggedIn && (
                            <>
                                <div className="rounded-xl bg-white/5 p-3 text-center">
                                    <p className="text-xs text-white/40">已收集</p>
                                    <p className={`mt-1 text-xl font-bold ${book.accentColor}`}>
                                        {collectedCount}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-white/5 p-3 text-center">
                                    <p className="text-xs text-white/40">完成度</p>
                                    <p className="mt-1 text-xl font-bold text-white">
                                        {progress}%
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* 收集進度條 */}
                    {isLoggedIn && distributions.length > 0 && (
                        <div className="mt-3">
                            <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                <div
                                    className={`h-full rounded-full bg-gradient-to-r ${book.themeGradient} transition-all duration-700`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* 分隔線 */}
                    <div className="my-5 h-px bg-white/10" />

                    {/* 配布列表 */}
                    <h3 className="mb-3 text-sm font-semibold text-white/80">
                        📖 收錄配布一覽
                    </h3>

                    {distributions.length === 0 ? (
                        <div className="rounded-xl bg-white/5 p-6 text-center">
                            <p className="text-sm text-white/40">
                                此書暫無收錄配布資料
                            </p>
                            <p className="mt-1 text-xs text-white/30">
                                待新資料加入後將自動更新
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {distributions.map((dist) => {
                                const isCollected = collected.includes(dist.id);
                                const isLoading = isToggling === dist.id;

                                return (
                                    <div
                                        key={dist.id}
                                        className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${isCollected
                                            ? "border-yellow-500/30 bg-yellow-500/5"
                                            : "border-white/5 bg-white/[0.02] hover:bg-white/5"
                                            }`}
                                    >
                                        {/* 寶可夢圖示 */}
                                        <div
                                            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${book.themeGradient} p-0.5`}
                                        >
                                            <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-800">
                                                {dist.pokemon_sprite_url ? (
                                                    <img
                                                        src={dist.pokemon_sprite_url}
                                                        alt={dist.pokemon_name}
                                                        className="h-7 w-7 object-contain"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                ) : (
                                                    <span className="text-lg">
                                                        {dist.pokemon_name.slice(0, 1)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* 配布資訊 */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-white truncate">
                                                    {dist.pokemon_name}
                                                </span>
                                                {dist.is_shiny && (
                                                    <span className="text-xs">✨</span>
                                                )}
                                                {dist.pokeball_image_url && (
                                                    <img
                                                        src={dist.pokeball_image_url}
                                                        alt="Ball"
                                                        className="h-3.5 w-3.5 object-contain"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-white/40 truncate">
                                                    {dist.event_name || dist.original_trainer || "—"}
                                                </span>
                                                {dist.level && (
                                                    <span className="text-[10px] text-white/30">
                                                        Lv.{dist.level}
                                                    </span>
                                                )}
                                                {dist.points && (
                                                    <span className="text-[10px] text-amber-400/70">
                                                        💎 {dist.points.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* 收集按鈕 */}
                                        {isLoggedIn && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggle(dist.id);
                                                }}
                                                disabled={!!isToggling}
                                                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-all ${isCollected
                                                    ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/25"
                                                    : "bg-white/10 text-white/40 hover:bg-white/20"
                                                    }`}
                                            >
                                                {isLoading ? (
                                                    <span className="animate-spin text-[10px]">⏳</span>
                                                ) : isCollected ? (
                                                    <span className="text-xs font-bold">✓</span>
                                                ) : (
                                                    <span className="text-xs">○</span>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 底部固定欄 */}
                <div className="flex-shrink-0 border-t border-white/10 bg-slate-900/80 px-5 py-3 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-white/40">
                            {book.title} — {distributions.length} 筆配布
                        </div>
                        <button
                            onClick={handleClose}
                            className="rounded-lg bg-white/10 px-4 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/20 hover:text-white"
                        >
                            返回書架
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
