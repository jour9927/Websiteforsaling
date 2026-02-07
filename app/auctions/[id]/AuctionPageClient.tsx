"use client";

import { useState, useCallback, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
    BidHistoryWithSimulation,
    ViewerCountDisplay,
    ViewerProvider,
    useViewerCount
} from "./BidHistoryWithSimulation";
import { AuctionSidebarActivity } from "./AuctionActivityWrapper";
import { SimulatedViewers, SimulatedViewerJoinToast } from "@/components/SimulatedActivity";
import BidButton from "./BidButton";

// 浮動在線人數元件（使用統一的 ViewerContext）
function FloatingViewerCount() {
    const { viewerCount } = useViewerCount();

    return (
        <div className="fixed bottom-4 left-4 z-40">
            <div className="glass-card px-4 py-2">
                <SimulatedViewers viewerCount={viewerCount} />
            </div>
        </div>
    );
}
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

    // 動態追蹤是否活躍（可被倒數計時或資料庫更新改變）
    const [isActiveState, setIsActiveState] = useState(isActive);

    useEffect(() => {
        setMounted(true);
    }, []);

    // 倒數計時檢查競標是否結束
    useEffect(() => {
        if (!isActiveState) return;

        const checkEnded = () => {
            const now = new Date().getTime();
            const end = new Date(endTime).getTime();
            if (now >= end) {
                setIsActiveState(false);
            }
        };

        // 立即檢查一次
        checkEnded();

        // 每秒檢查
        const interval = setInterval(checkEnded, 1000);

        return () => clearInterval(interval);
    }, [isActiveState, endTime]);

    // Realtime 訂閱偵測競標狀態變更
    useEffect(() => {
        // 動態引入 supabase client
        import('@/lib/supabase').then(({ supabase }) => {
            const channel = supabase
                .channel(`auction_status_${auctionId}`)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'auctions',
                    filter: `id=eq.${auctionId}`
                }, (payload) => {
                    const newStatus = (payload.new as { status?: string }).status;
                    if (newStatus === 'ended' || newStatus === 'cancelled') {
                        setIsActiveState(false);
                    }
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        });
    }, [auctionId]);

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
    const bidButtonSlot = mounted ? document.getElementById('bid-button-slot') : null;

    return (
        <ViewerProvider
            isActive={isActiveState}
            endTime={endTime}
            bidActivity={(realBids.length || 0) + bidCount}
        >
            {children}

            {/* 浮動在線人數（使用統一的 ViewerContext） */}
            {isActiveState && <FloatingViewerCount />}

            {/* 即時出價 Toast 通知 */}
            {isActiveState && <SimulatedViewerJoinToast />}

            {/* 在線人數 Portal */}
            {viewerSlot && isActiveState && createPortal(
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
                        isActive={isActiveState}
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
            {sidebarSlot && isActiveState && createPortal(
                <AuctionSidebarActivity
                    auctionId={auctionId}
                    isActive={isActiveState}
                />,
                sidebarSlot
            )}

            {/* 出價按鈕 Portal（傳遞模擬最高價） */}
            {bidButtonSlot && isActiveState && createPortal(
                <BidButton
                    auctionId={auctionId}
                    minIncrement={minIncrement}
                    currentPrice={realCurrentPrice}
                    startingPrice={startingPrice}
                    simulatedHighest={displayHighest}
                />,
                bidButtonSlot
            )}
        </ViewerProvider>
    );
}
