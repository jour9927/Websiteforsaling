"use client";

import { useState, useEffect, useCallback } from 'react';

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

interface UseSimulatedBidsProps {
    auctionId: string;
    startingPrice: number;
    minIncrement: number;
    endTime: string;
    currentRealBids: number; // 真實出價數量
    isActive: boolean;
}

export function useSimulatedBids({
    auctionId,
    startingPrice,
    minIncrement,
    endTime,
    currentRealBids,
    isActive
}: UseSimulatedBidsProps) {
    const [simulatedBids, setSimulatedBids] = useState<SimulatedBid[]>([]);
    const [usedBidders, setUsedBidders] = useState<Set<string>>(new Set());

    // 取得隨機出價者（不重複）
    const getRandomBidder = useCallback(() => {
        const available = FAKE_BIDDERS.filter(b => !usedBidders.has(b));
        if (available.length === 0) {
            // 如果都用過了，重置
            setUsedBidders(new Set());
            return FAKE_BIDDERS[Math.floor(Math.random() * FAKE_BIDDERS.length)];
        }
        const bidder = available[Math.floor(Math.random() * available.length)];
        setUsedBidders(prev => new Set([...prev, bidder]));
        return bidder;
    }, [usedBidders]);

    // 計算當前最高價（包含模擬出價）
    const getCurrentHighest = useCallback(() => {
        if (simulatedBids.length === 0) {
            return startingPrice;
        }
        return Math.max(...simulatedBids.map(b => b.amount), startingPrice);
    }, [simulatedBids, startingPrice]);

    // 生成模擬出價
    const generateSimulatedBid = useCallback(() => {
        const currentHighest = getCurrentHighest();
        // 隨機加價 $20-$100（基本上是 minIncrement 的 1-5 倍）
        const multiplier = Math.floor(Math.random() * 3) + 1; // 1-3 倍
        const increment = minIncrement * multiplier;
        const newAmount = currentHighest + increment;

        const newBid: SimulatedBid = {
            id: `sim-${auctionId}-${Date.now()}`,
            bidder_name: getRandomBidder(),
            amount: newAmount,
            created_at: new Date().toISOString(),
            is_simulated: true
        };

        setSimulatedBids(prev => [newBid, ...prev]);
        return newBid;
    }, [auctionId, getCurrentHighest, getRandomBidder, minIncrement]);

    useEffect(() => {
        if (!isActive) return;

        const endDate = new Date(endTime);
        const now = new Date();

        // 如果競標已結束，不生成模擬出價
        if (endDate <= now) return;

        // 計算剩餘時間
        const remainingMs = endDate.getTime() - now.getTime();

        // 初始延遲：10-30 秒
        const initialDelay = 10000 + Math.random() * 20000;

        // 如果有真實出價，減少模擬頻率
        const realBidsFactor = Math.max(0.5, 1 - (currentRealBids * 0.1));

        let timeoutId: NodeJS.Timeout;

        const scheduleNextBid = () => {
            const endDate = new Date(endTime);
            const now = new Date();
            const remainingMs = endDate.getTime() - now.getTime();

            // 剩餘 30 秒內停止模擬
            if (remainingMs < 30000) return;

            // 基礎間隔：15-45 秒
            let baseInterval = 15000 + Math.random() * 30000;

            // 最後 2 分鐘加快節奏
            if (remainingMs < 120000) {
                baseInterval = 8000 + Math.random() * 15000;
            }

            // 考慮真實出價因素
            const interval = baseInterval * realBidsFactor;

            timeoutId = setTimeout(() => {
                generateSimulatedBid();
                scheduleNextBid();
            }, interval);
        };

        // 初始延遲後開始
        const initialTimeout = setTimeout(() => {
            // 有一定機率在初始時就生成一筆出價
            if (Math.random() < 0.7) {
                generateSimulatedBid();
            }
            scheduleNextBid();
        }, initialDelay);

        return () => {
            clearTimeout(initialTimeout);
            clearTimeout(timeoutId);
        };
    }, [auctionId, endTime, isActive, currentRealBids, generateSimulatedBid]);

    return {
        simulatedBids,
        currentSimulatedHighest: getCurrentHighest()
    };
}

// 在線人數 hook
interface UseSimulatedViewersProps {
    isActive: boolean;
    endTime: string;
    bidActivity: number; // 現有出價數
}

export function useSimulatedViewers({
    isActive,
    endTime,
    bidActivity
}: UseSimulatedViewersProps) {
    const [viewerCount, setViewerCount] = useState(5 + Math.floor(Math.random() * 4)); // 初始 5-8 人
    const [stayDuration, setStayDuration] = useState(0); // 停留秒數

    useEffect(() => {
        if (!isActive) return;

        // 每秒更新停留時間
        const stayInterval = setInterval(() => {
            setStayDuration(prev => prev + 1);
        }, 1000);

        return () => clearInterval(stayInterval);
    }, [isActive]);

    useEffect(() => {
        if (!isActive) return;

        const endDate = new Date(endTime);
        const now = new Date();
        const remainingMs = endDate.getTime() - now.getTime();

        // 根據停留時間和剩餘時間計算在線人數
        let baseViewers = 5;

        // 停留時間加成
        if (stayDuration > 180) { // > 3 分鐘
            baseViewers += 10 + Math.floor(Math.random() * 5);
        } else if (stayDuration > 60) { // > 1 分鐘
            baseViewers += 5 + Math.floor(Math.random() * 5);
        } else if (stayDuration > 30) { // > 30 秒
            baseViewers += 3 + Math.floor(Math.random() * 3);
        }

        // 最後 1 分鐘激增
        if (remainingMs < 60000 && remainingMs > 0) {
            baseViewers += 5 + Math.floor(Math.random() * 10);
        }

        // 出價活動加成
        baseViewers += Math.min(bidActivity * 2, 10);

        // 添加一些隨機波動
        const fluctuation = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
        const newCount = Math.max(5, baseViewers + fluctuation);

        setViewerCount(newCount);
    }, [isActive, endTime, stayDuration, bidActivity]);

    // 波動更新（每 3-8 秒）
    useEffect(() => {
        if (!isActive) return;

        const fluctuateInterval = setInterval(() => {
            setViewerCount(prev => {
                const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
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
