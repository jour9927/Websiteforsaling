"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';

// 模擬出價者名單
const FAKE_BIDDERS = [
    '王**', '李**', '張**', '陳**', '林**', '黃**', '趙**', '周**',
    'L***', 'K***', 'M***', 'S***', 'T***', 'A***', 'J***', 'R***',
    '會員#0892', '會員#1234', '會員#5678', '會員#3456', '會員#7890',
    'Trainer_X', 'PKM_Fan', '神奧勇者', '卡洛斯冠軍', '關都大師'
];

export interface SimulatedBid {
    id: string;
    bidder_name: string;
    amount: number;
    created_at: string;
    is_simulated: true;
}

// 確定性隨機數生成器（基於種子）
function seededRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

// 根據拍賣 ID 和時間生成確定性的模擬出價
function generateDeterministicBids(
    auctionId: string,
    startTime: string,
    endTime: string,
    startingPrice: number,
    minIncrement: number,
    currentTime: Date
): SimulatedBid[] {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const totalDuration = end.getTime() - start.getTime();
    const elapsedTime = currentTime.getTime() - start.getTime();

    if (elapsedTime < 0 || totalDuration <= 0) return [];

    // 計算種子（基於拍賣 ID）
    let seed = 0;
    for (let i = 0; i < auctionId.length; i++) {
        seed += auctionId.charCodeAt(i);
    }

    const bids: SimulatedBid[] = [];
    let currentPrice = startingPrice;
    let bidTime = start.getTime() + 10000 + seededRandom(seed) * 20000; // 初始延遲 10-30 秒
    let bidIndex = 0;
    const usedBidders = new Set<number>();

    // 在結束前 30 秒停止
    const stopTime = Math.min(currentTime.getTime(), end.getTime() - 30000);

    while (bidTime < stopTime && bidIndex < 20) { // 最多 20 筆模擬出價
        const thisSeed = seed + bidIndex * 1000;

        // 選擇出價者（不重複）
        let bidderIndex = Math.floor(seededRandom(thisSeed + 1) * FAKE_BIDDERS.length);
        let attempts = 0;
        while (usedBidders.has(bidderIndex) && attempts < FAKE_BIDDERS.length) {
            bidderIndex = (bidderIndex + 1) % FAKE_BIDDERS.length;
            attempts++;
        }
        usedBidders.add(bidderIndex);
        if (usedBidders.size >= FAKE_BIDDERS.length) {
            usedBidders.clear();
        }

        // 計算出價金額（1-3 倍最低加價）
        const multiplier = 1 + Math.floor(seededRandom(thisSeed + 2) * 3);
        const increment = minIncrement * multiplier;
        currentPrice += increment;

        bids.push({
            id: `sim-${auctionId}-${bidIndex}`,
            bidder_name: FAKE_BIDDERS[bidderIndex],
            amount: currentPrice,
            created_at: new Date(bidTime).toISOString(),
            is_simulated: true
        });

        // 計算下次出價時間
        const remainingTime = end.getTime() - bidTime;
        let interval: number;

        if (remainingTime < 120000) {
            // 最後 2 分鐘：8-15 秒
            interval = 8000 + seededRandom(thisSeed + 3) * 7000;
        } else {
            // 正常時間：15-45 秒
            interval = 15000 + seededRandom(thisSeed + 3) * 30000;
        }

        bidTime += interval;
        bidIndex++;
    }

    return bids;
}

interface UseSimulatedBidsProps {
    auctionId: string;
    startTime: string;
    startingPrice: number;
    minIncrement: number;
    endTime: string;
    isActive: boolean;
}

export function useSimulatedBids({
    auctionId,
    startTime,
    startingPrice,
    minIncrement,
    endTime,
    isActive
}: UseSimulatedBidsProps) {
    const [currentTime, setCurrentTime] = useState(new Date());

    // 每秒更新當前時間（觸發重新計算）
    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive]);

    // 使用確定性算法生成模擬出價
    const simulatedBids = useMemo(() => {
        if (!isActive) return [];
        return generateDeterministicBids(
            auctionId,
            startTime,
            endTime,
            startingPrice,
            minIncrement,
            currentTime
        );
    }, [auctionId, startTime, endTime, startingPrice, minIncrement, currentTime, isActive]);

    // 計算模擬最高價
    const simulatedHighest = useMemo(() => {
        if (simulatedBids.length === 0) return startingPrice;
        return Math.max(...simulatedBids.map(b => b.amount));
    }, [simulatedBids, startingPrice]);

    return {
        simulatedBids,
        simulatedHighest
    };
}

// 全局在線人數 Context（讓兩處顯示同步）
import { createContext, useContext } from 'react';

interface ViewerContextType {
    viewerCount: number;
    stayDuration: number;
}

export const ViewerContext = createContext<ViewerContextType>({
    viewerCount: 5,
    stayDuration: 0
});

export function useViewerContext() {
    return useContext(ViewerContext);
}

// 在線人數 Provider hook
interface UseSimulatedViewersProps {
    isActive: boolean;
    endTime: string;
    bidActivity: number;
}

export function useSimulatedViewers({
    isActive,
    endTime,
    bidActivity
}: UseSimulatedViewersProps) {
    const [viewerCount, setViewerCount] = useState(5 + Math.floor(Math.random() * 4));
    const [stayDuration, setStayDuration] = useState(0);

    // 每秒更新停留時間
    useEffect(() => {
        if (!isActive) return;

        const stayInterval = setInterval(() => {
            setStayDuration(prev => prev + 1);
        }, 1000);

        return () => clearInterval(stayInterval);
    }, [isActive]);

    // 根據規則更新在線人數
    useEffect(() => {
        if (!isActive) return;

        const endDate = new Date(endTime);
        const now = new Date();
        const remainingMs = endDate.getTime() - now.getTime();

        let baseViewers = 5;

        // 停留時間加成
        if (stayDuration > 180) { // > 3 分鐘
            baseViewers += 10 + Math.floor(Math.random() * 5); // 15-20
        } else if (stayDuration > 60) { // > 1 分鐘
            baseViewers += 7 + Math.floor(Math.random() * 5); // 12-17
        } else if (stayDuration > 30) { // > 30 秒
            baseViewers += 3 + Math.floor(Math.random() * 4); // 8-12
        }

        // 最後 1 分鐘激增
        if (remainingMs < 60000 && remainingMs > 0) {
            baseViewers += 5 + Math.floor(Math.random() * 10);
        }

        // 出價活動加成
        baseViewers += Math.min(bidActivity, 5);

        setViewerCount(baseViewers);
    }, [isActive, endTime, stayDuration, bidActivity]);

    // 小幅波動（每 3-8 秒）
    useEffect(() => {
        if (!isActive) return;

        const fluctuateInterval = setInterval(() => {
            setViewerCount(prev => {
                const change = Math.floor(Math.random() * 3) - 1; // -1 to +1
                return Math.max(5, prev + change);
            });
        }, 3000 + Math.random() * 5000);

        return () => clearInterval(fluctuateInterval);
    }, [isActive]);

    return {
        viewerCount,
        stayDuration
    };
}
