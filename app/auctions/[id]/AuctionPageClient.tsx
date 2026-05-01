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
import BidOutbidAlert from "./BidOutbidAlert";
import type { AuctionAutomationMode } from "@/hooks/useSimulatedAuction";

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
    title: string;  // 新增：競標標題
    realBids: RealBid[];
    startTime: string;
    startingPrice: number;
    minIncrement: number;
    endTime: string;
    isActive: boolean;
    realCurrentPrice: number;
    realHighestBidder: string | null;
    bidCount: number;
    automationMode: AuctionAutomationMode;
    automationTargetMin: number;
    automationTargetMax: number;
    automationStopSeconds: number;
}

export function AuctionPageClient({
    children,
    auctionId,
    title,
    realBids,
    startTime,
    startingPrice,
    minIncrement,
    endTime,
    isActive,
    realCurrentPrice,
    realHighestBidder,
    bidCount,
    automationMode,
    automationTargetMin,
    automationTargetMax,
    automationStopSeconds
}: AuctionPageClientProps) {
    const [mounted, setMounted] = useState(false);
    const [liveRealBids, setLiveRealBids] = useState<RealBid[]>(realBids);
    const [displayHighest, setDisplayHighest] = useState(realCurrentPrice > 0 ? realCurrentPrice : startingPrice);
    const [displayHighestBidder, setDisplayHighestBidder] = useState<string | null>(realHighestBidder);
    const [simulatedHighest, setSimulatedHighest] = useState(0);

    // 動態追蹤是否活躍（可被倒數計時或資料庫更新改變）
    const [isActiveState, setIsActiveState] = useState(isActive);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        setLiveRealBids(realBids);
    }, [realBids]);

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

    // Realtime 訂閱偵測競標狀態與真實出價變更
    useEffect(() => {
        let cancelled = false;
        let cleanup: (() => void) | null = null;

        import('@/lib/supabase').then(({ supabase }) => {
            if (cancelled) return;

            const channel = supabase
                .channel(`auction_live_${auctionId}`)
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
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'bids',
                    filter: `auction_id=eq.${auctionId}`
                }, (payload) => {
                    const newBid = payload.new as {
                        id?: string;
                        amount?: number;
                        created_at?: string;
                    };

                    if (!newBid.id || typeof newBid.amount !== 'number') return;

                    const bidId = newBid.id;
                    const bidAmount = newBid.amount;
                    const createdAt = newBid.created_at ?? new Date().toISOString();

                    setLiveRealBids((prev) => {
                        if (prev.some((bid) => bid.id === bidId)) return prev;

                        return [
                            {
                                id: bidId,
                                amount: bidAmount,
                                created_at: createdAt,
                                profiles: {
                                    full_name: '會員'
                                }
                            },
                            ...prev
                        ];
                    });

                    setDisplayHighest((prev) => Math.max(prev, bidAmount));
                    setDisplayHighestBidder('會員');
                })
                .subscribe();

            cleanup = () => {
                supabase.removeChannel(channel);
            };
        });

        return () => {
            cancelled = true;
            cleanup?.();
        };
    }, [auctionId]);

    const handleHighestChange = useCallback((amount: number, bidderName: string | null) => {
        // 取模擬和真實中較高的價格
        const liveHighest = liveRealBids.reduce(
            (highest, bid) => Math.max(highest, bid.amount),
            realCurrentPrice > 0 ? realCurrentPrice : startingPrice
        );
        const effectiveReal = Math.max(liveHighest, startingPrice);
        if (amount > effectiveReal) {
            setDisplayHighest(amount);
            setDisplayHighestBidder(bidderName);
        } else {
            setDisplayHighest(effectiveReal);
            setDisplayHighestBidder(realHighestBidder);
        }
    }, [liveRealBids, realCurrentPrice, startingPrice, realHighestBidder]);

    // Portal 目標
    const viewerSlot = mounted ? document.getElementById('viewer-count-slot') : null;
    const bidHistorySlot = mounted ? document.getElementById('bid-history-slot') : null;
    const highestPriceSlot = mounted ? document.getElementById('highest-price-slot') : null;
    const sidebarSlot = mounted ? document.getElementById('sidebar-activity-slot') : null;
    const bidButtonSlot = mounted ? document.getElementById('bid-button-slot') : null;

    return (
        <ViewerProvider
            auctionId={auctionId}
            isActive={isActiveState}
            endTime={endTime}
            bidActivity={(liveRealBids.length || 0) + bidCount}
            automationMode={automationMode}
        >
            {children}

            {/* 浮動在線人數（使用統一的 ViewerContext） */}
            {mounted && isActiveState && <FloatingViewerCount />}

            {/* 被超價即時通知 */}
            {isActiveState && <BidOutbidAlert auctionId={auctionId} isActive={isActiveState} />}

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
                        auctionTitle={title}
                        realBids={liveRealBids}
                        startTime={startTime}
                        startingPrice={startingPrice}
                        minIncrement={minIncrement}
                        endTime={endTime}
                        isActive={isActiveState}
                        automationMode={automationMode}
                        automationTargetMin={automationTargetMin}
                        automationTargetMax={automationTargetMax}
                        automationStopSeconds={automationStopSeconds}
                        onHighestChange={handleHighestChange}
                        onSimulatedHighestChange={setSimulatedHighest}
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
                    auctionTitle={title}
                    isActive={isActiveState}
                    currentPrice={displayHighest}
                    endTime={endTime}
                    automationMode={automationMode}
                />,
                sidebarSlot
            )}

            {/* 出價按鈕 Portal（傳遞模擬最高價） */}
            {bidButtonSlot && isActiveState && createPortal(
                <BidButton
                    auctionId={auctionId}
                    minIncrement={minIncrement}
                    currentPrice={displayHighest}
                    startingPrice={startingPrice}
                    endTime={endTime}
                    simulatedHighest={simulatedHighest}
                    automationMode={automationMode}
                    automationStopSeconds={automationStopSeconds}
                />,
                bidButtonSlot
            )}
        </ViewerProvider>
    );
}
