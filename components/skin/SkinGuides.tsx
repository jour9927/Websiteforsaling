"use client";

import { useState, useMemo } from "react";
import { BookGuideCard } from "@/components/BookGuideCard";
import { BookGuideDetail } from "@/components/BookGuideDetail";
import { StatTile } from "@/components/skin/primitives";
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

/* 圖鑑卡本身就是插畫，是這頁的主角，直接沿用 BookGuideCard / BookGuideDetail。
   這裡改的是外圍：標題區、世代分隔、書架容器、未登入引導。 */

interface Distribution {
  id: string;
  pokemon_name: string;
  generation: number;
  points?: number;
  [key: string]: unknown;
}

interface Props {
  distributions: Distribution[];
  userCollected: string[];
  isLoggedIn: boolean;
  userId?: string;
}

export default function SkinGuides({
  distributions,
  userCollected: initialCollected,
  isLoggedIn,
  userId,
}: Props) {
  const [selectedBook, setSelectedBook] = useState<GuideBook | null>(null);
  const [collected, setCollected] = useState<string[]>(initialCollected);

  const booksByGen = getBooksByGeneration();
  const sortedGens = Object.keys(booksByGen)
    .map(Number)
    .sort((a, b) => b - a);

  const classifiedByGen = useMemo(() => {
    const result: Record<number, Record<BookTier, Distribution[]>> = {};
    const byGen: Record<number, Distribution[]> = {};
    for (const d of distributions) {
      if (!byGen[d.generation]) byGen[d.generation] = [];
      byGen[d.generation].push(d);
    }
    for (const gen of Object.keys(byGen).map(Number)) {
      result[gen] = classifyDistributionsByTier(byGen[gen]) as Record<BookTier, Distribution[]>;
    }
    return result;
  }, [distributions]);

  const getBookDistributions = (book: GuideBook): Distribution[] =>
    classifiedByGen[book.generation]?.[book.tier] ?? [];

  const getBookCollectedCount = (book: GuideBook) =>
    getBookDistributions(book).filter((d) => collected.includes(d.id)).length;

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
      await supabase
        .from("user_distributions")
        .insert({ user_id: userId, distribution_id: distributionId });
      setCollected((prev) => [...prev, distributionId]);
    }
  }

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col items-start gap-4">
        <p className="eg-eyebrow">Collection</p>
        <h1 className="eg-h1">配布圖鑑書架</h1>
        <p className="eg-lead max-w-xl">
          依稀有度分為 SSR（稀有）、SR（高級）、R（普遍），翻閱各世代的配布圖鑑。
        </p>
      </header>

      <div className={`grid gap-4 ${isLoggedIn ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        <StatTile label="圖鑑總數" value={guideBooks.length} hint="跨九個世代" />
        <StatTile label="配布總計" value={distributions.length.toLocaleString()} hint="已收錄的配布" />
        {isLoggedIn && (
          <StatTile
            label="我已收集"
            value={collected.length.toLocaleString()}
            hint={`完成度 ${
              distributions.length
                ? Math.round((collected.length / distributions.length) * 100)
                : 0
            }%`}
          />
        )}
      </div>

      {sortedGens.map((gen) => {
        const books = booksByGen[gen];
        if (!books) return null;

        return (
          <section key={gen}>
            <div
              className="mb-5 flex items-center gap-3 pb-3"
              style={{ borderBottom: "1px solid var(--eg-border)" }}
            >
              <span
                className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-gradient-to-br ${
                  books[0]?.themeGradient || "from-gray-500 to-gray-700"
                } text-sm font-bold text-white eg-keep-light`}
              >
                {gen}
              </span>
              <div>
                <h2 className="eg-h2 text-[17px] md:text-[18px]">
                  第 {gen} 世代 · {genNames[gen] || `Gen ${gen}`}
                </h2>
                {genGames[gen] && <p className="eg-meta mt-0.5">{genGames[gen]}</p>}
              </div>
            </div>

            <div
              className="scrollbar-hide flex snap-x snap-mandatory gap-6 overflow-x-auto overflow-y-visible px-1 pb-4 pt-2"
              style={{ scrollPaddingLeft: 4 }}
            >
              {books.map((book) => (
                <div key={book.id} className="snap-start">
                  <BookGuideCard
                    book={book}
                    distributionCount={getBookDistributions(book).length}
                    collectedCount={getBookCollectedCount(book)}
                    isLoggedIn={isLoggedIn}
                    onClick={() => setSelectedBook(book)}
                  />
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {!isLoggedIn && (
        <div className="eg-card eg-card--subtle flex flex-col items-center gap-3 px-6 py-10 text-center">
          <p className="eg-h3">登入後即可記錄你的收集進度</p>
          <p className="eg-meta">每一本圖鑑的完成度都會替你保存下來</p>
          <a href="/login" className="eg-btn eg-btn--primary eg-btn--sm mt-2">
            立即登入
          </a>
        </div>
      )}

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
