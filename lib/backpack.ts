export const BACKPACK_ITEM_OPTIONS = [
  {
    type: "blindbox_discount_500",
    name: "盲盒折抵券 500",
    description: "購買盲盒可折抵 500",
  },
  {
    type: "blindbox_discount_1000",
    name: "盲盒折抵券 1000",
    description: "購買盲盒可折抵 1000",
  },
  {
    type: "auction_fee_rebate_30",
    name: "競標費用報銷券（30%）",
    description: "競標結算後可報銷 30% 費用",
  },
  {
    type: "auction_fee_rebate_40",
    name: "競標費用報銷券（40%）",
    description: "競標結算後可報銷 40% 費用",
  },
] as const;

export type BackpackItemType = (typeof BACKPACK_ITEM_OPTIONS)[number]["type"];

export function getBackpackItemName(type: BackpackItemType) {
  return (
    BACKPACK_ITEM_OPTIONS.find((item) => item.type === type)?.name || "未知道具"
  );
}
