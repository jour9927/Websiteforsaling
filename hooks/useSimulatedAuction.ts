"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

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
    currentTime: Date,
    auctionTitle?: string  // 新增：競標標題，用於判斷是否為特殊寶可夢
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

        // 計算出價金額
        // 蒂安希(Diancie)特殊處理：1-7 倍
        // 其他寶可夢：1-3 倍（預設）
        const isDiancie = auctionTitle?.includes('蒂安希') || auctionTitle?.includes('Diancie');
        const maxMultiplier = isDiancie ? 9 : 3;
        const multiplier = 1 + Math.floor(seededRandom(thisSeed + 2) * maxMultiplier);
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

// 真實出價的最小介面
interface RealBid {
    id: string;
    amount: number;
    created_at: string;
}

interface UseSimulatedBidsProps {
    auctionId: string;
    startTime: string;
    startingPrice: number;
    minIncrement: number;
    endTime: string;
    isActive: boolean;
    auctionTitle?: string;
    realBids?: RealBid[];  // 新增：真實出價，用於反應式 counter-bid
}

export function useSimulatedBids({
    auctionId,
    startTime,
    startingPrice,
    minIncrement,
    endTime,
    isActive,
    auctionTitle,
    realBids = []
}: UseSimulatedBidsProps) {
    const [currentTime, setCurrentTime] = useState(new Date());

    // === 反應式 counter-bid 狀態 ===
    const [counterBids, setCounterBids] = useState<SimulatedBid[]>([]);
    const consecutiveRealRef = useRef(0);      // 連續真實出價計數
    const yieldedRef = useRef(false);           // 是否已讓步
    const lastRealBidCountRef = useRef(0);      // 上次偵測到的真實出價數量
    const counterBidTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const counterBidIndexRef = useRef(0);       // counter-bid 索引（用於生成唯一名稱）

    // 每秒更新當前時間（觸發重新計算）
    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive]);

    // === 偵測真實出價 → 生成 counter-bid ===
    useEffect(() => {
        if (!isActive || realBids.length === 0) return;

        // 偵測新的真實出價
        if (realBids.length > lastRealBidCountRef.current) {
            const newBidsCount = realBids.length - lastRealBidCountRef.current;
            lastRealBidCountRef.current = realBids.length;

            // 增加連續真實出價計數
            consecutiveRealRef.current += newBidsCount;

            // 連續 5 次 → 虛擬讓步
            if (consecutiveRealRef.current >= 5) {
                yieldedRef.current = true;
                // 清除待執行的 counter-bid timer
                if (counterBidTimerRef.current) {
                    clearTimeout(counterBidTimerRef.current);
                    counterBidTimerRef.current = null;
                }
                return;
            }

            // 尚未讓步 → 排程 counter-bid
            if (!yieldedRef.current) {
                // 清除之前的 timer（避免重複）
                if (counterBidTimerRef.current) {
                    clearTimeout(counterBidTimerRef.current);
                }

                // 3~8 秒後回擊
                const delay = 3000 + Math.random() * 5000;
                const latestRealBid = realBids.reduce((max, bid) =>
                    bid.amount > max.amount ? bid : max, realBids[0]);

                counterBidTimerRef.current = setTimeout(() => {
                    // counter-bid 金額 = 真實出價的加價幅度（±20% 隨機抖動）
                    const realIncrement = Math.max(latestRealBid.amount - (startingPrice || 0), minIncrement);
                    const jitter = 0.8 + Math.random() * 0.4; // 0.8 ~ 1.2
                    const counterIncrement = Math.max(Math.round(realIncrement * jitter), minIncrement);
                    const counterAmount = latestRealBid.amount + counterIncrement;

                    // 選擇隨機出價者
                    const bidderIdx = Math.floor(Math.random() * FAKE_BIDDERS.length);
                    const idx = counterBidIndexRef.current++;

                    const newCounterBid: SimulatedBid = {
                        id: `counter-${auctionId}-${idx}`,
                        bidder_name: FAKE_BIDDERS[bidderIdx],
                        amount: counterAmount,
                        created_at: new Date().toISOString(),
                        is_simulated: true
                    };

                    setCounterBids(prev => [...prev, newCounterBid]);
                    // 成功回擊 → 重置連續計數
                    consecutiveRealRef.current = 0;
                    counterBidTimerRef.current = null;
                }, delay);
            }
        }
    }, [realBids.length, isActive, auctionId, minIncrement, auctionTitle, realBids]);

    // 清除 timer on unmount
    useEffect(() => {
        return () => {
            if (counterBidTimerRef.current) {
                clearTimeout(counterBidTimerRef.current);
            }
        };
    }, []);

    // 使用確定性算法生成模擬出價（基底出價）
    const baseBids = useMemo(() => {
        const timeToUse = isActive ? currentTime : new Date(endTime);
        return generateDeterministicBids(
            auctionId,
            startTime,
            endTime,
            startingPrice,
            minIncrement,
            timeToUse,
            auctionTitle
        );
    }, [auctionId, startTime, endTime, startingPrice, minIncrement, currentTime, isActive, auctionTitle]);

    // 合併基底出價 + counter-bid
    const simulatedBids = useMemo(() => {
        return [...baseBids, ...counterBids];
    }, [baseBids, counterBids]);

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
