/**
 * 確定性出價計數工具函數
 * 使用簡化的數學公式計算模擬出價數
 */

// 確定性隨機數生成器（基於種子）
function seededRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

interface EstimateBidCountParams {
    auctionId: string;
    startTime: string;
    endTime: string;
    currentTime?: Date;
}

/**
 * 根據競標 ID 和時間計算確定性的模擬出價數量
 * 使用簡化的數學公式，避免 while loop
 */
export function getEstimatedBidCount({
    auctionId,
    startTime,
    endTime,
    currentTime = new Date()
}: EstimateBidCountParams): number {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const totalDuration = end.getTime() - start.getTime();
    const elapsedTime = Math.min(currentTime.getTime(), end.getTime()) - start.getTime();

    if (elapsedTime < 0 || totalDuration <= 0) return 0;

    // 計算種子（基於拍賣 ID）
    let seed = 0;
    for (let i = 0; i < auctionId.length; i++) {
        seed += auctionId.charCodeAt(i);
    }

    // 根據種子決定這個競標的最大出價數（20-50 筆）
    const maxBids = 20 + Math.floor(seededRandom(seed * 7) * 31);

    // 簡化計算：根據已經過時間的比例來決定出價數
    const progress = Math.min(elapsedTime / totalDuration, 1);

    // 用對數函數讓早期出價更密集，後期趨緩
    const bidCount = Math.floor(maxBids * Math.pow(progress, 0.7));

    return Math.min(bidCount, maxBids);
}


