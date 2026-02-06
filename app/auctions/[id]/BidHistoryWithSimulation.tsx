"use client";

import { useEffect } from 'react';
import { useSimulatedBids, useSimulatedViewers } from '@/hooks/useSimulatedAuction';

interface RealBid {
    id: string;
    amount: number;
    created_at: string;
    profiles?: {
        full_name?: string | null;
        email?: string | null;
    };
}

interface BidHistoryWithSimulationProps {
    auctionId: string;
    realBids: RealBid[];
    startingPrice: number;
    minIncrement: number;
    endTime: string;
    isActive: boolean;
    onSimulatedHighestChange?: (amount: number) => void;
}

export function BidHistoryWithSimulation({
    auctionId,
    realBids,
    startingPrice,
    minIncrement,
    endTime,
    isActive,
    onSimulatedHighestChange
}: BidHistoryWithSimulationProps) {
    const { simulatedBids } = useSimulatedBids({
        auctionId,
        startingPrice,
        minIncrement,
        endTime,
        currentRealBids: realBids.length,
        isActive
    });

    // 合併真實和模擬出價，按金額排序
    const allBids = [
        ...realBids.map(bid => ({
            id: bid.id,
            bidder_name: bid.profiles?.full_name || bid.profiles?.email?.split('@')[0] || '匿名',
            bidder_initials: (bid.profiles?.full_name || bid.profiles?.email || '?').slice(0, 2),
            amount: bid.amount,
            created_at: bid.created_at,
            is_simulated: false as const
        })),
        ...simulatedBids.map(bid => ({
            id: bid.id,
            bidder_name: bid.bidder_name,
            bidder_initials: bid.bidder_name.slice(0, 2),
            amount: bid.amount,
            created_at: bid.created_at,
            is_simulated: true as const
        }))
    ].sort((a, b) => b.amount - a.amount).slice(0, 15);

    // 通知父元件模擬最高價變化
    useEffect(() => {
        if (onSimulatedHighestChange && simulatedBids.length > 0) {
            const simHighest = Math.max(...simulatedBids.map(b => b.amount));
            onSimulatedHighestChange(simHighest);
        }
    }, [simulatedBids, onSimulatedHighestChange]);

    if (allBids.length === 0) {
        return (
            <p className="mt-4 text-sm text-white/60">尚無出價紀錄</p>
        );
    }

    return (
        <div className="mt-4 space-y-2">
            {allBids.map((bid, index) => (
                <div
                    key={bid.id}
                    className={`flex items-center justify-between rounded-lg px-4 py-3 transition-all ${index === 0
                        ? 'bg-yellow-500/20 border border-yellow-500/30 animate-pulse'
                        : 'bg-white/5'
                        } ${bid.is_simulated ? 'border-l-2 border-l-purple-400/50' : ''}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${bid.is_simulated ? 'bg-purple-500/20 text-purple-300' : 'bg-white/10'
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
        </div>
    );
}

// 在線人數顯示元件
interface ViewerCountDisplayProps {
    isActive: boolean;
    endTime: string;
    bidActivity: number;
}

export function ViewerCountDisplay({
    isActive,
    endTime,
    bidActivity
}: ViewerCountDisplayProps) {
    const { viewerCount } = useSimulatedViewers({
        isActive,
        endTime,
        bidActivity
    });

    if (!isActive) return null;

    return (
        <div className="flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-200">
            <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
            <span>{viewerCount} 人正在觀看</span>
        </div>
    );
}
