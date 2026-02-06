"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState, useEffect } from "react";

type Auction = {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    starting_price: number;
    current_price: number;
    end_time: string;
    status: 'active' | 'ended';
    bid_count: number;
    distributions?: {
        pokemon_name: string;
        pokemon_name_en: string | null;
        pokemon_sprite_url: string | null;
    };
};

type AuctionCardProps = {
    auction: Auction;
};

export default function AuctionCard({ auction }: AuctionCardProps) {
    const [remainingTime, setRemainingTime] = useState("");
    const [isEnded, setIsEnded] = useState(auction.status === 'ended');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const end = new Date(auction.end_time);
            const diff = end.getTime() - now.getTime();

            if (diff <= 0) {
                setRemainingTime("已結束");
                setIsEnded(true);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (days > 0) {
                setRemainingTime(`${days}天 ${hours}小時`);
            } else if (hours > 0) {
                setRemainingTime(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            } else {
                setRemainingTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            }
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [auction.end_time]);

    const imageUrl = auction.image_url || auction.distributions?.pokemon_sprite_url;
    const currentHighest = auction.current_price > 0 ? auction.current_price : auction.starting_price;

    return (
        <Link
            href={`/auctions/${auction.id}` as Route}
            className="glass-card group flex flex-col overflow-hidden transition hover:scale-[1.02] hover:border-white/30"
        >
            {/* 圖片區 */}
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-purple-900/50 to-blue-900/50">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={auction.title}
                        className="h-full w-full object-contain p-4 transition group-hover:scale-110"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl text-white/20">
                        🎁
                    </div>
                )}

                {/* 狀態標籤 */}
                <div className="absolute top-3 right-3">
                    {isEnded ? (
                        <span className="rounded-full bg-gray-900/80 px-3 py-1 text-xs font-medium text-gray-300">
                            已結標
                        </span>
                    ) : (
                        <span className="rounded-full bg-green-500/80 px-3 py-1 text-xs font-medium text-white animate-pulse">
                            🔴 競標中
                        </span>
                    )}
                </div>
            </div>

            {/* 資訊區 */}
            <div className="flex flex-1 flex-col gap-3 p-4">
                <h3 className="font-semibold text-white/90 line-clamp-2">{auction.title}</h3>

                {/* 價格 */}
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-yellow-300">
                        ${currentHighest.toLocaleString()}
                    </span>
                    {auction.current_price === 0 && (
                        <span className="text-xs text-white/50">起標價</span>
                    )}
                </div>

                {/* 底部資訊 */}
                <div className="mt-auto flex items-center justify-between text-xs text-white/60">
                    <span>🔥 {auction.bid_count} 次出價</span>
                    <span className={`font-medium ${isEnded ? 'text-gray-400' : 'text-orange-300'}`}>
                        ⏱ {remainingTime}
                    </span>
                </div>
            </div>
        </Link>
    );
}
