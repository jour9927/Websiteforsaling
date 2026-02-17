"use client";

import { useState } from "react";
import Image from "next/image";
import { tierLabels, tierSubtitles, type GuideBook } from "@/lib/guideBooksData";

interface BookGuideCardProps {
    book: GuideBook;
    distributionCount: number;
    collectedCount: number;
    isLoggedIn: boolean;
    onClick: () => void;
}

export function BookGuideCard({
    book,
    distributionCount,
    collectedCount,
    isLoggedIn,
    onClick,
}: BookGuideCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    const progress =
        distributionCount > 0
            ? Math.round((collectedCount / distributionCount) * 100)
            : 0;

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative block w-[200px] flex-shrink-0 cursor-pointer outline-none focus:outline-none"
            style={{ perspective: "800px" }}
        >
            {/* 書本容器 - 3D 翻轉效果 */}
            <div
                className="relative transition-all duration-500 ease-out"
                style={{
                    transform: isHovered
                        ? "rotateY(-15deg) rotateX(5deg) translateZ(20px)"
                        : "rotateY(0deg)",
                    transformStyle: "preserve-3d",
                }}
            >
                {/* 書本封面 */}
                <div className="relative overflow-hidden rounded-lg shadow-2xl">
                    {/* 封面圖片 */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden">
                        <Image
                            src={book.coverImage}
                            alt={book.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                            sizes="200px"
                        />
                        {/* 漸層覆蓋 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    </div>

                    {/* 書脊光澤效果 */}
                    <div
                        className="pointer-events-none absolute inset-y-0 left-0 w-6 transition-opacity duration-500"
                        style={{
                            background:
                                "linear-gradient(90deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 40%, transparent 100%)",
                            opacity: isHovered ? 0.8 : 0.3,
                        }}
                    />

                    {/* 書本頂部反光 */}
                    <div
                        className="pointer-events-none absolute inset-x-0 top-0 h-20 transition-opacity duration-500"
                        style={{
                            background:
                                "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)",
                            opacity: isHovered ? 1 : 0.4,
                        }}
                    />

                    {/* 稀有度標籤 */}
                    <div
                        className={`absolute right-2 top-2 rounded-full bg-gradient-to-r ${book.themeGradient} px-2 py-0.5 text-[10px] font-bold tracking-wider text-white shadow-lg`}
                    >
                        {tierLabels[book.tier]}（{tierSubtitles[book.tier]}）
                    </div>

                    {/* 書名區域（底部） */}
                    <div className="absolute inset-x-0 bottom-0 p-3">
                        <h3 className="text-sm font-bold leading-tight text-white drop-shadow-lg">
                            {book.title}
                        </h3>
                        <p className="mt-0.5 text-[10px] text-white/70 line-clamp-1">
                            {book.subtitle}
                        </p>

                        {/* 收錄數量 */}
                        <div className="mt-2 flex items-center gap-2">
                            <span className="text-[10px] text-white/50">
                                收錄 {distributionCount} 筆配布
                            </span>
                        </div>

                        {/* 收集進度條（僅登入後顯示） */}
                        {isLoggedIn && distributionCount > 0 && (
                            <div className="mt-1.5">
                                <div className="flex items-center justify-between text-[9px]">
                                    <span className="text-white/50">收集進度</span>
                                    <span className={book.accentColor}>
                                        {collectedCount}/{distributionCount} ({progress}%)
                                    </span>
                                </div>
                                <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-white/10">
                                    <div
                                        className={`h-full rounded-full bg-gradient-to-r ${book.themeGradient} transition-all duration-500`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 書本底部陰影 */}
                <div
                    className="absolute -bottom-3 left-1/2 h-4 w-[90%] -translate-x-1/2 rounded-full blur-xl transition-all duration-500"
                    style={{
                        background: isHovered
                            ? "rgba(0,0,0,0.5)"
                            : "rgba(0,0,0,0.2)",
                    }}
                />
            </div>

            {/* Hover 提示 */}
            <p
                className="mt-3 text-center text-[10px] text-white/30 transition-all duration-300"
                style={{
                    opacity: isHovered ? 1 : 0,
                    transform: isHovered ? "translateY(0)" : "translateY(-4px)",
                }}
            >
                點擊翻閱 →
            </p>
        </button>
    );
}
