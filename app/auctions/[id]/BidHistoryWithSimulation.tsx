"use client";

import { useEffect, useMemo, createContext, useContext, ReactNode } from 'react';
import { useSimulatedBids, useSimulatedViewers, type AuctionAutomationMode, type SimulatedBid } from '@/hooks/useSimulatedAuction';

interface RealBid {
    id: string;
    amount: number;
    created_at: string;
    profiles?: {
        full_name?: string | null;
        email?: string | null;
    };
}

// 全局在線人數 Context
interface ViewerContextType {
    viewerCount: number;
    stayDuration: number;
}

const ViewerContext = createContext<ViewerContextType>({
    viewerCount: 5,
    stayDuration: 0
});

// 在線人數 Provider
export function ViewerProvider({
    children,
    auctionId,
    isActive,
    endTime,
    bidActivity,
    automationMode
}: {
    children: ReactNode;
    auctionId: string;
    isActive: boolean;
    endTime: string;
    bidActivity: number;
    automationMode?: AuctionAutomationMode;
}) {
    const { viewerCount, stayDuration } = useSimulatedViewers({
        auctionId,
        isActive,
        endTime,
        bidActivity,
        automationMode
    });

    return (
        <ViewerContext.Provider value={{ viewerCount, stayDuration }}>
            {children}
        </ViewerContext.Provider>
    );
}

// 使用全局在線人數
export function useViewerCount() {
    return useContext(ViewerContext);
}

interface BidHistoryWithSimulationProps {
    auctionId: string;
    realBids: RealBid[];
    startTime: string;
    startingPrice: number;
    minIncrement: number;
    endTime: string;
    isActive: boolean;
    auctionTitle?: string;  // 新增：競標標題
    automationMode?: AuctionAutomationMode;
    automationTargetMin?: number;
    automationTargetMax?: number;
    automationStopSeconds?: number;
    onHighestChange?: (amount: number, bidderName: string | null) => void;
    onSimulatedHighestChange?: (amount: number) => void;
    onSimulatedBidsChange?: (bids: SimulatedBid[]) => void;
}

export function BidHistoryWithSimulation({
    auctionId,
    realBids,
    startTime,
    startingPrice,
    minIncrement,
    endTime,
    isActive,
    auctionTitle,
    automationMode,
    automationTargetMin,
    automationTargetMax,
    automationStopSeconds,
    onHighestChange,
    onSimulatedHighestChange,
    onSimulatedBidsChange
}: BidHistoryWithSimulationProps) {
    const { simulatedBids } = useSimulatedBids({
        auctionId,
        startTime,
        startingPrice,
        minIncrement,
        endTime,
        isActive,
        auctionTitle,
        automationMode,
        automationTargetMin,
        automationTargetMax,
        automationStopSeconds,
        realBids: realBids.map(b => ({ id: b.id, amount: b.amount, created_at: b.created_at }))
    });

    const combinedBids = useMemo(() => {
        return [
            ...realBids.map(bid => ({
                id: bid.id,
                bidder_name: bid.profiles?.full_name || bid.profiles?.email?.split('@')[0] || '匿名',
                bidder_initials: (bid.profiles?.full_name || bid.profiles?.email || '?').slice(0, 2),
                amount: bid.amount,
                created_at: bid.created_at,
                created_at_ms: new Date(bid.created_at).getTime(),
                is_simulated: false as const,
                is_real: true
            })),
            ...simulatedBids.map(bid => ({
                id: bid.id,
                bidder_name: bid.bidder_name,
                bidder_initials: bid.bidder_name.slice(0, 2),
                amount: bid.amount,
                created_at: bid.created_at,
                created_at_ms: new Date(bid.created_at).getTime(),
                is_simulated: true as const,
                is_real: false
            }))
        ];
    }, [realBids, simulatedBids]);

    const highestBid = useMemo(() => {
        if (combinedBids.length === 0) return null;
        return combinedBids.reduce((max, bid) => (bid.amount > max.amount ? bid : max), combinedBids[0]);
    }, [combinedBids]);

    // 出價紀錄：依時間顯示最新的 5 筆（避免只看到金額最大的一筆而誤以為只有最後才寫入）
    const bidsByTime = useMemo(() => {
        return [...combinedBids].sort((a, b) => {
            const timeA = Number.isFinite(a.created_at_ms) ? a.created_at_ms : 0;
            const timeB = Number.isFinite(b.created_at_ms) ? b.created_at_ms : 0;
            return timeB - timeA;
        });
    }, [combinedBids]);

    // 通知父元件最高價變化
    useEffect(() => {
        if (!onHighestChange || !highestBid) return;
        onHighestChange(highestBid.amount, highestBid.bidder_name);
    }, [highestBid, onHighestChange]);

    useEffect(() => {
        if (!onSimulatedHighestChange) return;

        const simulatedHighest = simulatedBids.reduce(
            (highest, bid) => Math.max(highest, bid.amount),
            0
        );
        onSimulatedHighestChange(simulatedHighest);
    }, [onSimulatedHighestChange, simulatedBids]);

    useEffect(() => {
        if (!onSimulatedBidsChange) return;
        onSimulatedBidsChange(simulatedBids);
    }, [onSimulatedBidsChange, simulatedBids]);

    if (combinedBids.length === 0) {
        return (
            <p className="mt-4 text-sm text-white/60">尚無出價紀錄</p>
        );
    }

    // 只顯示前 5 筆，其餘模糊
    const visibleBids = bidsByTime.slice(0, 5);
    const hiddenCount = Math.max(0, bidsByTime.length - 5);

    return (
        <div className="mt-4 space-y-2">
            {visibleBids.map((bid, index) => (
                <div
                    key={bid.id}
                    className={`flex items-center justify-between rounded-lg px-4 py-3 transition-all ${index === 0
                        ? 'bg-yellow-500/20 border border-yellow-500/30'
                        : 'bg-white/5'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${index === 0 ? 'bg-yellow-500/30 text-yellow-200' : 'bg-white/10'
                            }`}>
                            {bid.bidder_initials}
                        </div>
                        <div>
                            <p className="text-sm text-white/90">
                                {bid.bidder_name}
                            </p>
                            <p className="text-xs text-white/50">
                                {new Date(bid.created_at).toLocaleString('zh-TW')}
                            </p>
                        </div>
                    </div>
                    <span className={`font-bold ${index === 0 ? 'text-yellow-300' : 'text-white/70'}`}>
                        ${bid.amount.toLocaleString()}
                    </span>
                </div>
            ))}

            {/* 模糊顯示更多 */}
            {hiddenCount > 0 && (
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/80 pointer-events-none" />
                    <div className="flex items-center justify-center py-4">
                        <span className="text-sm text-white/40">
                            還有 {hiddenCount} 筆出價紀錄
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

// 在線人數顯示元件（使用全局 Context）
export function ViewerCountDisplay() {
    const { viewerCount } = useViewerCount();

    return (
        <div className="flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-200">
            <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
            <span>{viewerCount} 人正在觀看</span>
        </div>
    );
}
