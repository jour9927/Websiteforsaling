type RealBidForSimulation = {
  amount: number;
  created_at: string;
};

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getAuctionSeed(auctionId: string) {
  let seed = 0;
  for (let i = 0; i < auctionId.length; i++) {
    seed += auctionId.charCodeAt(i);
  }
  return seed;
}

/**
 * A/B/C/D/B1 五種模式的虛擬最高出價計算引擎。
 *
 * A = legacy_basic（無種子、固定基底100×倍率、20筆、結束前30秒停止）
 * B = legacy_counter（A + 真實玩家出價反應式回擊 + 讓步機制）
 *     注意：B 的 counter-bid 在 useSimulatedAuction.ts 處理，此處回傳 0（視同無最高價）
 * C = global_link_v2_basic（確定性種子、easedProgress推價、到target停止）
 * D = global_link_v2_intense（C + 超過target持續推 + auto-follow真實玩家）
 * B1 = global_link_v2_b1（D 強度，搭配獨立競標排程）
 *
 * 僅 mode C、D 和 B1 使用此引擎計算最高虛擬價。
 */
export function getVirtualHighest({
  auctionId,
  startTime,
  endTime,
  startingPrice,
  currentTime,
  mode = 'global_link_v2_d',
  targetMin = 39000,
  targetMax = 45000,
  stopSeconds = 1,
  realBids = [],
}: {
  auctionId: string;
  startTime: string;
  endTime: string;
  startingPrice: number;
  currentTime: Date;
  mode?: 'global_link_v2_c' | 'global_link_v2_d' | 'global_link_v2_b1';
  targetMin?: number;
  targetMax?: number;
  stopSeconds?: number;
  realBids?: RealBidForSimulation[];
}) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const totalDuration = end.getTime() - start.getTime();
  const elapsedTime = currentTime.getTime() - start.getTime();

  if (elapsedTime < 0 || totalDuration <= 0) return 0;

  const sessionKey = `${auctionId}-${start.getTime()}`;
  const seed = getAuctionSeed(sessionKey);
  const initialDelay = 800 + seededRandom(seed) * 800;
  let bidTime = start.getTime() + initialDelay;
  let bidIndex = 0;
  let currentPrice = startingPrice;
  const stopBufferMs = Math.max(1, stopSeconds) * 1000;
  const targetFloor = Math.max(startingPrice, Math.min(targetMin, targetMax));
  const targetCeil = Math.max(targetFloor, Math.max(targetMin, targetMax));
  const targetPrice = targetFloor + Math.floor(seededRandom(seed + 77) * (targetCeil - targetFloor + 1));
  const pacingDuration = Math.max(1, end.getTime() - stopBufferMs - start.getTime());
  const realBidTimeline = realBids
    .map((bid) => ({ amount: bid.amount, time: new Date(bid.created_at).getTime() }))
    .filter((bid) => Number.isFinite(bid.time))
    .sort((a, b) => a.time - b.time);
  let realBidCursor = 0;
  let realHighestAtBidTime = startingPrice;
  const stopTime = Math.min(currentTime.getTime(), end.getTime() - stopBufferMs);

  // mode C: 最多 360 筆，到 target 就 break
  // mode D/B1: 最多 1500 筆，超過 target 持續推
  const maxBids = mode === 'global_link_v2_c' ? 360 : 1500;

  while (bidTime < stopTime && bidIndex < maxBids) {
    const thisSeed = seed + bidIndex * 1000;

    while (realBidCursor < realBidTimeline.length && realBidTimeline[realBidCursor].time <= bidTime) {
      realHighestAtBidTime = Math.max(realHighestAtBidTime, realBidTimeline[realBidCursor].amount);
      realBidCursor++;
    }

    const progress = Math.min(1, Math.max(0, (bidTime - start.getTime()) / pacingDuration));
    const easedProgress = 1 - Math.pow(1 - progress, 1.35);
    const plannedPrice = startingPrice + Math.round((targetPrice - startingPrice) * easedProgress);
    const rhythmIncrement = [10, 20, 30, 50, 80, 120, 180, 260][bidIndex % 8];
    const sustainIncrement = [5, 10, 15, 20, 30][bidIndex % 5];
    const pressureIncrement = currentPrice >= targetPrice
      ? [1, 5, 10, 20, 30, 50][bidIndex % 6]
      : [10, 20, 30, 50, 70, 90, 120, 160][bidIndex % 8];

    currentPrice = realHighestAtBidTime >= currentPrice
      ? realHighestAtBidTime + pressureIncrement
      : currentPrice >= targetPrice
      ? currentPrice + sustainIncrement
      : Math.min(
          targetPrice,
          Math.max(currentPrice + rhythmIncrement, plannedPrice)
        );

    // mode C: 達到 target 就停止
    if (mode === 'global_link_v2_c' && currentPrice >= targetPrice) break;

    const interval = 450 + seededRandom(thisSeed + 3) * 450;
    bidTime += interval;
    bidIndex++;
  }

  return currentPrice;
}

// 保留舊名稱兼容性
export const getGlobalLinkV2VirtualHighest = getVirtualHighest;
