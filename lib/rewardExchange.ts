const STORE_REBATE_DISCOUNTS = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90] as const;

export type StoreRebateDiscount = (typeof STORE_REBATE_DISCOUNTS)[number];
export type StoreRebateItemType = `store_rebate_${StoreRebateDiscount}`;
export type StoreRebateRewardKey = StoreRebateItemType;

export type StoreRebateReward = {
  key: StoreRebateRewardKey;
  itemType: StoreRebateItemType;
  name: string;
  pointsCost: number;
  discountPercent: StoreRebateDiscount;
  description: string;
  example: string;
};

export const STORE_REBATE_REWARDS: StoreRebateReward[] = STORE_REBATE_DISCOUNTS.map(
  (discountPercent, index) => {
    const pointsCost = index + 1;
    const payableExample = calculateStoreRebatePayableAmount(1000, discountPercent);

    return {
      key: `store_rebate_${discountPercent}` as StoreRebateRewardKey,
      itemType: `store_rebate_${discountPercent}` as StoreRebateItemType,
      name: `商店消費報銷券（${discountPercent}%）`,
      pointsCost,
      discountPercent,
      description: `可於商店結帳時報銷消費金額上限 ${discountPercent}%。`,
      example: `例：消費 NT$ 1,000 時，最高報銷 ${discountPercent}%，實付 NT$ ${payableExample.toLocaleString()}。`,
    };
  },
);

export const STORE_REBATE_ITEM_TYPES = STORE_REBATE_REWARDS.map(
  (reward) => reward.itemType,
);

export function getStoreRebateRewardByKey(key: string) {
  return STORE_REBATE_REWARDS.find((reward) => reward.key === key) ?? null;
}

export function getStoreRebateRewardByItemType(itemType: string) {
  return STORE_REBATE_REWARDS.find((reward) => reward.itemType === itemType) ?? null;
}

export function getStoreRebatePercent(itemType: string) {
  return getStoreRebateRewardByItemType(itemType)?.discountPercent ?? null;
}

export function getBackpackStoreRebatePercent(itemType: string, itemName?: string | null) {
  const directPercent = getStoreRebatePercent(itemType);
  if (directPercent !== null) return directPercent;

  // Legacy 30th anniversary compensation stored this with a non-store item_type.
  if (itemName?.includes("商店消費報銷券") && itemName.includes("50%")) {
    return 50;
  }

  return null;
}

export function getBackpackStoreFixedDiscountAmount(itemType: string, itemName?: string | null) {
  if (itemType === "blindbox_discount_1000") {
    return 1000;
  }

  if (itemName === "1000 元抵用券") {
    return 1000;
  }

  return null;
}

export function getBackpackStoreCouponDiscount(itemType: string, itemName?: string | null) {
  const discountPercent = getBackpackStoreRebatePercent(itemType, itemName);
  if (discountPercent !== null) {
    return {
      kind: "percent" as const,
      value: discountPercent,
    };
  }

  const discountAmount = getBackpackStoreFixedDiscountAmount(itemType, itemName);
  if (discountAmount !== null) {
    return {
      kind: "amount" as const,
      value: discountAmount,
    };
  }

  return null;
}

export function isStoreRebateItemType(itemType: string): itemType is StoreRebateItemType {
  return STORE_REBATE_ITEM_TYPES.includes(itemType as StoreRebateItemType);
}

export function calculateStoreRebatePayableAmount(totalAmount: number, discountPercent: number) {
  const normalizedTotal = Math.max(0, Number(totalAmount) || 0);
  const normalizedDiscount = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  return Math.round(normalizedTotal * ((100 - normalizedDiscount) / 100));
}

export function calculateStoreFixedDiscountPayableAmount(totalAmount: number, discountAmount: number) {
  const normalizedTotal = Math.max(0, Number(totalAmount) || 0);
  const normalizedDiscount = Math.max(0, Number(discountAmount) || 0);
  return Math.max(0, Math.round(normalizedTotal - normalizedDiscount));
}
