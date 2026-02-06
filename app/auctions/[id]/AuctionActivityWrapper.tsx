"use client";

import { SimulatedViewers, SimulatedBidToast } from "@/components/SimulatedActivity";
import AuctionComments from "@/components/AuctionComments";

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

type AuctionSidebarActivityProps = {
    auctionId?: string;
    isActive?: boolean;
    currentUserName?: string | null;
};

export function AuctionSidebarActivity({
    auctionId,
    isActive = true,
    currentUserName
}: AuctionSidebarActivityProps) {
    if (!auctionId) {
        return null;
    }

    return (
        <AuctionComments
            auctionId={auctionId}
            isActive={isActive}
            currentUserName={currentUserName}
        />
    );
}
