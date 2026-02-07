/**
 * 確定性出價計數工具函數
 * 使用與詳情頁相同的種子算法計算模擬出價數
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
 * 這個函數與 useSimulatedBids hook 使用相同的算法
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
    const elapsedTime = currentTime.getTime() - start.getTime();

    if (elapsedTime < 0 || totalDuration <= 0) return 0;

    // 計算種子（基於拍賣 ID）
    let seed = 0;
    for (let i = 0; i < auctionId.length; i++) {
        seed += auctionId.charCodeAt(i);
    }

    let bidCount = 0;
    let bidTime = start.getTime() + 10000 + seededRandom(seed) * 20000; // 初始延遲 10-30 秒
    let bidIndex = 0;

    // 計算到當前時間為止的出價數量（最多 20 筆）
    // 在結束前 30 秒停止
    const stopTime = Math.min(currentTime.getTime(), end.getTime() - 30000);

    while (bidTime < stopTime && bidIndex < 20) {
        const thisSeed = seed + bidIndex * 1000;
        bidCount++;

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

    return bidCount;
}
