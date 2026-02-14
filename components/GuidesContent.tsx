"use client";

import { useState, useMemo } from "react";
import { BookGuideCard } from "@/components/BookGuideCard";
import { BookGuideDetail } from "@/components/BookGuideDetail";
import {
    guideBooks,
    getBooksByGeneration,
    genNames,
    genGames,
    classifyDistributionsByTier,
    type GuideBook,
    type BookTier,
} from "@/lib/guideBooksData";
import { supabase } from "@/lib/supabase";

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

interface GuidesContentProps {
    distributions: Distribution[];
    userCollected: string[];
    isLoggedIn: boolean;
    userId?: string;
}

export default function GuidesContent({
    distributions,
    userCollected: initialCollected,
    isLoggedIn,
    userId,
}: GuidesContentProps) {
    const [selectedBook, setSelectedBook] = useState<GuideBook | null>(null);
    const [collected, setCollected] = useState<string[]>(initialCollected);

    const booksByGen = getBooksByGeneration();
    const sortedGens = Object.keys(booksByGen)
        .map(Number)
        .sort((a, b) => b - a);

    // 預先按世代 + 稀有度分類所有配布
    const classifiedByGen = useMemo(() => {
        const result: Record<number, Record<BookTier, Distribution[]>> = {};
        // 先按世代分組
        const byGen: Record<number, Distribution[]> = {};
        for (const d of distributions) {
            if (!byGen[d.generation]) byGen[d.generation] = [];
            byGen[d.generation].push(d);
        }
        // 再按 points 分為高貴/稀有/普通
        for (const gen of Object.keys(byGen).map(Number)) {
            result[gen] = classifyDistributionsByTier(byGen[gen]);
        }
        return result;
    }, [distributions]);

    // 取得某本書對應的配布列表
    function getBookDistributions(book: GuideBook): Distribution[] {
        return classifiedByGen[book.generation]?.[book.tier] ?? [];
    }

    // 取得某本書的已收集數量
    function getBookCollectedCount(book: GuideBook): number {
        const bookDists = getBookDistributions(book);
        return bookDists.filter((d) => collected.includes(d.id)).length;
    }

    // 切換收集狀態
    async function toggleCollect(distributionId: string) {
        if (!isLoggedIn || !userId) return;

        if (collected.includes(distributionId)) {
            await supabase
                .from("user_distributions")
                .delete()
                .eq("user_id", userId)
                .eq("distribution_id", distributionId);

            setCollected((prev) => prev.filter((id) => id !== distributionId));
        } else {
            await supabase.from("user_distributions").insert({
                user_id: userId,
                distribution_id: distributionId,
            });

            setCollected((prev) => [...prev, distributionId]);
        }
    }

    // 全站統計
    const totalDistributions = distributions.length;
    const totalCollected = collected.length;
    const totalBooks = guideBooks.length;

    return (
        <div className="space-y-8">
            {/* 頁面標題 */}
            <section className="glass-card p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
                            <span className="text-3xl">📚</span>
                            配布圖鑑書架
                        </h1>
                        <p className="mt-1 text-sm text-white/60">
                            依稀有度分為 👑 高貴・⭐ 稀有・📘 普通，翻閱各世代的配布圖鑑
                        </p>
                    </div>

                    {/* 整體統計 */}
                    <div className="flex items-center gap-4 text-center">
                        <div>
                            <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                                {totalBooks}
                            </p>
                            <p className="text-[10px] text-white/40">圖鑑總數</p>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div>
                            <p className="text-2xl font-bold text-white">{totalDistributions}</p>
                            <p className="text-[10px] text-white/40">配布總計</p>
                        </div>
                        {isLoggedIn && (
                            <>
                                <div className="h-8 w-px bg-white/10" />
                                <div>
                                    <p className="text-2xl font-bold text-emerald-400">
                                        {totalCollected}
                                    </p>
                                    <p className="text-[10px] text-white/40">已收集</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* 按世代展示書架 */}
            {sortedGens.map((gen) => {
                const books = booksByGen[gen];
                if (!books) return null;

                return (
                    <section key={gen} className="space-y-4">
                        {/* 世代標題 */}
                        <div className="flex items-center gap-3">
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${books[0]?.themeGradient || "from-gray-500 to-gray-700"
                                    } text-sm font-bold text-white shadow-lg`}
                            >
                                {gen}
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white/90">
                                    第{gen}世代 — {genNames[gen] || `Gen ${gen}`}
                                </h2>
                                <p className="text-xs text-white/40">
                                    {genGames[gen] || ""}
                                </p>
                            </div>
                        </div>

                        {/* 書架 - 橫向滾動 */}
                        <div className="relative">
                            {/* 書架背景 */}
                            <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent px-4 pb-6 pt-6 sm:px-6">
                                <div className="flex gap-6 overflow-x-auto overflow-y-visible pb-4 pt-2 scrollbar-hide snap-x snap-mandatory">
                                    {books.map((book) => {
                                        const bookDists = getBookDistributions(book);
                                        const bookCollected = getBookCollectedCount(book);

                                        return (
                                            <div key={book.id} className="snap-start">
                                                <BookGuideCard
                                                    book={book}
                                                    distributionCount={bookDists.length}
                                                    collectedCount={bookCollected}
                                                    isLoggedIn={isLoggedIn}
                                                    onClick={() => setSelectedBook(book)}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* 書架木板裝飾 */}
                                <div className="mt-2 h-1.5 rounded-full bg-gradient-to-r from-amber-900/30 via-amber-800/40 to-amber-900/30" />
                            </div>
                        </div>
                    </section>
                );
            })}

            {/* 未登入提示 */}
            {!isLoggedIn && (
                <section className="glass-card p-6 text-center">
                    <p className="text-white/70">登入後即可記錄你的收集進度 📝</p>
                    <a
                        href="/login"
                        className="mt-4 inline-block rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 text-sm font-medium text-white transition hover:opacity-90"
                    >
                        立即登入
                    </a>
                </section>
            )}

            {/* Book Detail Modal */}
            {selectedBook && (
                <BookGuideDetail
                    book={selectedBook}
                    distributions={getBookDistributions(selectedBook)}
                    collected={collected}
                    isLoggedIn={isLoggedIn}
                    userId={userId}
                    onClose={() => setSelectedBook(null)}
                    onToggleCollect={toggleCollect}
                />
            )}
        </div>
    );
}
