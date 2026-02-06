"use client";

import { useState, useCallback, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
    BidHistoryWithSimulation,
    ViewerCountDisplay,
    ViewerProvider
} from "./BidHistoryWithSimulation";
import { AuctionSidebarActivity } from "./AuctionActivityWrapper";

interface RealBid {
    id: string;
    amount: number;
    created_at: string;
    profiles?: {
        full_name?: string | null;
        email?: string | null;
    };
}

interface AuctionPageClientProps {
    children: ReactNode;
    auctionId: string;
    realBids: RealBid[];
    startTime: string;
    startingPrice: number;
    minIncrement: number;
    endTime: string;
    isActive: boolean;
    realCurrentPrice: number;
    realHighestBidder: string | null;
    bidCount: number;
}

export function AuctionPageClient({
    children,
    auctionId,
    realBids,
    startTime,
    startingPrice,
    minIncrement,
    endTime,
    isActive,
    realCurrentPrice,
    realHighestBidder,
    bidCount
}: AuctionPageClientProps) {
    const [mounted, setMounted] = useState(false);
    const [displayHighest, setDisplayHighest] = useState(realCurrentPrice > 0 ? realCurrentPrice : startingPrice);
    const [displayHighestBidder, setDisplayHighestBidder] = useState<string | null>(realHighestBidder);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleHighestChange = useCallback((amount: number, bidderName: string | null) => {
        // 取模擬和真實中較高的價格
        const effectiveReal = realCurrentPrice > 0 ? realCurrentPrice : startingPrice;
        if (amount > effectiveReal) {
            setDisplayHighest(amount);
            setDisplayHighestBidder(bidderName);
        } else {
            setDisplayHighest(effectiveReal);
            setDisplayHighestBidder(realHighestBidder);
        }
    }, [realCurrentPrice, startingPrice, realHighestBidder]);

    // Portal 目標
    const viewerSlot = mounted ? document.getElementById('viewer-count-slot') : null;
    const bidHistorySlot = mounted ? document.getElementById('bid-history-slot') : null;
    const highestPriceSlot = mounted ? document.getElementById('highest-price-slot') : null;
    const sidebarSlot = mounted ? document.getElementById('sidebar-activity-slot') : null;

    return (
        <ViewerProvider
            isActive={isActive}
            endTime={endTime}
            bidActivity={(realBids.length || 0) + bidCount}
        >
            {children}

            {/* 在線人數 Portal */}
            {viewerSlot && isActive && createPortal(
                <ViewerCountDisplay />,
                viewerSlot
            )}

            {/* 出價紀錄 Portal */}
            {bidHistorySlot && createPortal(
                <article className="glass-card p-6">
                    <h2 className="text-lg font-semibold text-white/90">出價紀錄</h2>
                    <BidHistoryWithSimulation
                        auctionId={auctionId}
                        realBids={realBids}
                        startTime={startTime}
                        startingPrice={startingPrice}
                        minIncrement={minIncrement}
                        endTime={endTime}
                        isActive={isActive}
                        onHighestChange={handleHighestChange}
                    />
                </article>,
                bidHistorySlot
            )}

            {/* 最高價 Portal */}
            {highestPriceSlot && createPortal(
                <div className="text-center">
                    <p className="text-xs uppercase text-white/60">目前最高價</p>
                    <p className="mt-2 text-4xl font-bold text-yellow-300">
                        ${displayHighest.toLocaleString()}
                    </p>
                    {displayHighestBidder && (
                        <p className="mt-1 text-sm text-white/60">
                            最高出價者: {displayHighestBidder}
                        </p>
                    )}
                </div>,
                highestPriceSlot
            )}

            {/* 側邊欄即時留言 Portal */}
            {sidebarSlot && isActive && createPortal(
                <AuctionSidebarActivity
                    auctionId={auctionId}
                    isActive={isActive}
                />,
                sidebarSlot
            )}
        </ViewerProvider>
    );
}
