"use client";

import { SimulatedViewers, SimulatedBidToast, SimulatedRecentActivity } from "@/components/SimulatedActivity";

type AuctionActivityWrapperProps = {
    isActive: boolean;
};

export default function AuctionActivityWrapper({ isActive }: AuctionActivityWrapperProps) {
    if (!isActive) return null;

    return (
        <>
            {/* 即時出價 Toast 通知 */}
            <SimulatedBidToast />

            {/* 在線觀看人數 - 浮動顯示 */}
            <div className="fixed bottom-4 left-4 z-40">
                <div className="glass-card px-4 py-2">
                    <SimulatedViewers baseViewers={8 + Math.floor(Math.random() * 10)} />
                </div>
            </div>
        </>
    );
}

export function AuctionSidebarActivity() {
    return (
        <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-white/80 mb-3">🔔 即時動態</h3>
            <SimulatedRecentActivity />
        </div>
    );
}
