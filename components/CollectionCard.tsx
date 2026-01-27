"use client";

import Image from "next/image";

type CollectionCardProps = {
    id: string;
    title: string;
    imageUrl: string | null;
    visualCardUrl: string | null;
    estimatedValue: number;
    seriesTag: string | null;
    owned: boolean;
    quantity?: number;
};

export function CollectionCard({
    title,
    imageUrl,
    visualCardUrl,
    estimatedValue,
    seriesTag,
    owned,
    quantity = 0,
}: CollectionCardProps) {
    // 優先使用圖鑑專用卡面，否則使用活動圖片
    const displayImage = visualCardUrl || imageUrl;

    return (
        <div
            className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${owned
                    ? "border-amber-400/50 bg-gradient-to-br from-amber-900/30 to-orange-900/20 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20"
                    : "border-white/10 bg-white/5 grayscale hover:grayscale-[50%]"
                }`}
        >
            {/* 卡面圖片 */}
            <div className="relative aspect-[3/4] w-full overflow-hidden">
                {displayImage ? (
                    <Image
                        src={displayImage}
                        alt={title}
                        fill
                        className={`object-cover transition-transform duration-300 group-hover:scale-105 ${!owned ? "opacity-50" : ""
                            }`}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-white/5">
                        <span className="text-4xl opacity-30">🎴</span>
                    </div>
                )}

                {/* 擁有標記 */}
                {owned && (
                    <div className="absolute right-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-black shadow-lg">
                        ✓ 擁有
                    </div>
                )}

                {/* 數量標記 */}
                {owned && quantity > 1 && (
                    <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-black">
                        ×{quantity}
                    </div>
                )}

                {/* 懸停時顯示詳細資訊 */}
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {estimatedValue > 0 && (
                        <p className="text-sm font-semibold text-amber-400">
                            估值: ${estimatedValue.toLocaleString()}
                        </p>
                    )}
                    {seriesTag && (
                        <p className="text-xs text-white/70">{seriesTag}</p>
                    )}
                </div>
            </div>

            {/* 卡片標題 */}
            <div className="p-3">
                <h3
                    className={`truncate text-sm font-medium ${owned ? "text-white" : "text-white/50"
                        }`}
                >
                    {title}
                </h3>
                {!owned && (
                    <p className="mt-1 text-xs text-white/30">尚未收集</p>
                )}
            </div>
        </div>
    );
}
