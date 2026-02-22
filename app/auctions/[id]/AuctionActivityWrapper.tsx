"use client";

import { SimulatedViewers, SimulatedViewerJoinToast } from "@/components/SimulatedActivity";
import AuctionComments from "@/components/AuctionComments";
import { useViewerCount } from "./BidHistoryWithSimulation";

type AuctionActivityWrapperProps = {
    isActive: boolean;
};

export default function AuctionActivityWrapper({ isActive }: AuctionActivityWrapperProps) {
    if (!isActive) return null;

    return (
        <>
            {/* 即時出價 Toast 通知 */}
            <SimulatedViewerJoinToast />

            {/* 在線觀看人數 - 浮動顯示（使用全局 ViewerContext） */}
            <FloatingViewerCount />
        </>
    );
}

// 使用全局 Context 的浮動在線人數
function FloatingViewerCount() {
    // 使用 ViewerContext 統一在線人數
    const { viewerCount } = useViewerCount();

    return (
        <div className="fixed bottom-4 left-4 z-40">
            <div className="glass-card px-4 py-2">
                <SimulatedViewers viewerCount={viewerCount} />
            </div>
        </div>
    );
}

type AuctionSidebarActivityProps = {
    auctionId?: string;
    auctionTitle?: string;
    isActive?: boolean;
    currentUserName?: string | null;
    currentPrice?: number;
    endTime?: string;
};

export function AuctionSidebarActivity({
    auctionId,
    auctionTitle,
    isActive = true,
    currentUserName
}: AuctionSidebarActivityProps) {
    if (!auctionId) {
        return null;
    }

    return (
        <AuctionComments
            auctionId={auctionId}
            auctionTitle={auctionTitle || ''}
            isActive={isActive}
            currentUserName={currentUserName}
            currentPrice={currentPrice}
            endTime={endTime}
        />
    );
}
