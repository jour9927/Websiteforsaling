export const BACKPACK_ITEM_OPTIONS = [
  {
    type: "blindbox_discount_500",
    name: "盲盒折抵券 500",
    description: "購買盲盒可折抵 500",
    icon: "🎟️",
    badgeClass: "bg-indigo-500/20 text-indigo-200",
  },
  {
    type: "blindbox_discount_1000",
    name: "盲盒折抵券 1000",
    description: "購買盲盒可折抵 1000",
    icon: "🎫",
    badgeClass: "bg-cyan-500/20 text-cyan-200",
  },
  {
    type: "blindbox_discount_2000",
    name: "盲盒折抵券 2000",
    description: "購買盲盒可折抵 2000",
    icon: "🎟️",
    badgeClass: "bg-violet-500/20 text-violet-200",
  },
  {
    type: "blindbox_discount_5000",
    name: "盲盒折抵券 5000",
    description: "購買盲盒可折抵 5000",
    icon: "🎫",
    badgeClass: "bg-pink-500/20 text-pink-200",
  },
  {
    type: "auction_fee_rebate_30",
    name: "競標費用報銷券（30%）",
    description: "競標結算後可報銷 30% 費用",
    icon: "💸",
    badgeClass: "bg-amber-500/20 text-amber-200",
  },
  {
    type: "auction_fee_rebate_40",
    name: "競標費用報銷券（40%）",
    description: "競標結算後可報銷 40% 費用",
    icon: "💰",
    badgeClass: "bg-rose-500/20 text-rose-200",
  },
  {
    type: "pokemon_choice_5",
    name: "寶可夢五選一補償券",
    description: "可從指定補償清單中選擇 1 隻寶可夢",
    icon: "🎁",
    badgeClass: "bg-emerald-500/20 text-emerald-200",
  },
] as const;

export type BackpackItemType = (typeof BACKPACK_ITEM_OPTIONS)[number]["type"];

export function getBackpackItemName(type: BackpackItemType) {
  return (
    BACKPACK_ITEM_OPTIONS.find((item) => item.type === type)?.name || "未知道具"
  );
}

export function getBackpackItemMeta(type: BackpackItemType | string) {
  const matched = BACKPACK_ITEM_OPTIONS.find((item) => item.type === type);

  return {
    icon: matched?.icon || "🎁",
    badgeClass: matched?.badgeClass || "bg-white/10 text-white/70",
  };
}
