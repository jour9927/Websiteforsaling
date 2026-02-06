"use client";

import { useState, useCallback } from 'react';
import {
    BidHistoryWithSimulation,
    ViewerCountDisplay,
    ViewerProvider,
    AuctionSidebarActivity
} from "./BidHistoryWithSimulation";

interface RealBid {
    id: string;
    amount: number;
    created_at: string;
    profiles?: {
        full_name?: string | null;
        email?: string | null;
    };
}

interface AuctionClientWrapperProps {
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

export function AuctionClientWrapper({
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
}: AuctionClientWrapperProps) {
    // 追蹤顯示的最高價（包含模擬）
    const [displayHighest, setDisplayHighest] = useState(realCurrentPrice || startingPrice);
    const [displayHighestBidder, setDisplayHighestBidder] = useState<string | null>(realHighestBidder);

    const handleHighestChange = useCallback((amount: number, bidderName: string | null) => {
        // 只更新如果模擬價格高於真實價格
        if (amount > realCurrentPrice) {
            setDisplayHighest(amount);
            setDisplayHighestBidder(bidderName);
        } else {
            setDisplayHighest(realCurrentPrice || startingPrice);
            setDisplayHighestBidder(realHighestBidder);
        }
    }, [realCurrentPrice, startingPrice, realHighestBidder]);

    return (
        <ViewerProvider
            isActive={isActive}
            endTime={endTime}
            bidActivity={(realBids.length || 0) + bidCount}
        >
            {/* 在線人數（header 區域用） */}
            <ViewerCountDisplayWrapper isActive={isActive} />

            {/* 出價紀錄 */}
            <BidHistorySection
                auctionId={auctionId}
                realBids={realBids}
                startTime={startTime}
                startingPrice={startingPrice}
                minIncrement={minIncrement}
                endTime={endTime}
                isActive={isActive}
                onHighestChange={handleHighestChange}
            />

            {/* 最高價顯示 */}
            <HighestPriceDisplay
                amount={displayHighest}
                bidderName={displayHighestBidder}
            />

            {/* 側邊欄即時動態 */}
            <SidebarActivityWrapper isActive={isActive} />
        </ViewerProvider>
    );
}

// 子元件們
function ViewerCountDisplayWrapper({ isActive }: { isActive: boolean }) {
    if (!isActive) return null;
    return <ViewerCountDisplay />;
}

function BidHistorySection({
    auctionId,
    realBids,
    startTime,
    startingPrice,
    minIncrement,
    endTime,
    isActive,
    onHighestChange
}: {
    auctionId: string;
    realBids: RealBid[];
    startTime: string;
    startingPrice: number;
    minIncrement: number;
    endTime: string;
    isActive: boolean;
    onHighestChange: (amount: number, bidderName: string | null) => void;
}) {
    return (
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
                onHighestChange={onHighestChange}
            />
        </article>
    );
}

function HighestPriceDisplay({
    amount,
    bidderName
}: {
    amount: number;
    bidderName: string | null;
}) {
    return (
        <div className="text-center" id="highest-price-display">
            <p className="text-xs uppercase text-white/60">目前最高價</p>
            <p className="mt-2 text-4xl font-bold text-yellow-300">
                ${amount.toLocaleString()}
            </p>
            {bidderName && (
                <p className="mt-1 text-sm text-white/60">
                    最高出價者: {bidderName}
                </p>
            )}
        </div>
    );
}

function SidebarActivityWrapper({ isActive }: { isActive: boolean }) {
    if (!isActive) return null;
    return <AuctionSidebarActivity />;
}

// Export 各個元件供單獨使用
export { ViewerCountDisplay, AuctionSidebarActivity };
