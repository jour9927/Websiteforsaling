export type CommunityAuctionStatus = "active" | "pending_payment" | "sold" | "ended" | "cancelled";

export type MarketPokemon = {
  pokemon_name: string;
  pokemon_name_en: string | null;
  generation: number;
  image_url: string | null;
  is_shiny: boolean;
  original_trainer: string | null;
  trainer_id: string | null;
  level: number | null;
  region: string | null;
};

export type CommunityListing = {
  id: string;
  seller_id: string;
  user_distribution_id: string;
  distribution_id: string;
  description: string | null;
  starting_price: number;
  min_increment: number;
  buy_now_price: number | null;
  current_price: number;
  current_bidder_id: string | null;
  bid_count: number;
  status: CommunityAuctionStatus;
  end_time: string;
  winner_id: string | null;
  sold_price: number | null;
  settled_at: string | null;
  created_at: string;
  updated_at: string;
  pokemon: MarketPokemon;
  seller_name: string;
  current_bidder_name: string | null;
  winner_name: string | null;
};

export type MarketInventoryItem = {
  id: string;
  distribution_id: string;
  obtained_at: string;
  pokemon: MarketPokemon;
};

export type MarketBid = {
  id: string;
  bidder_id: string;
  bidder_name: string;
  amount: number;
  created_at: string;
};

export type MarketCashPayment = {
  status: "submitted" | "confirmed" | "rejected";
  proof_path: string;
  reference_note: string | null;
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
};

export type MarketPaymentDetails = {
  payment_instructions: string;
};

export const MARKET_SELECT = `
  id,
  seller_id,
  user_distribution_id,
  distribution_id,
  description,
  starting_price,
  min_increment,
  buy_now_price,
  current_price,
  current_bidder_id,
  bid_count,
  status,
  end_time,
  winner_id,
  sold_price,
  settled_at,
  created_at,
  updated_at,
  distributions(
    pokemon_name,
    pokemon_name_en,
    generation,
    image_url,
    is_shiny,
    original_trainer,
    trainer_id,
    level,
    region
  )
`;

export const INVENTORY_SELECT = `
  id,
  distribution_id,
  obtained_at,
  distributions(
    pokemon_name,
    pokemon_name_en,
    generation,
    image_url,
    is_shiny,
    original_trainer,
    trainer_id,
    level,
    region
  )
`;

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  if (Array.isArray(value)) return asRecord(value[0]);
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function normalizePokemon(value: unknown): MarketPokemon {
  const row = asRecord(value);
  return {
    pokemon_name: asString(row.pokemon_name, "未知寶可夢"),
    pokemon_name_en: asNullableString(row.pokemon_name_en),
    generation: asNumber(row.generation),
    image_url: asNullableString(row.image_url),
    is_shiny: row.is_shiny === true,
    original_trainer: asNullableString(row.original_trainer),
    trainer_id: asNullableString(row.trainer_id),
    level: asNullableNumber(row.level),
    region: asNullableString(row.region),
  };
}

export function normalizeListing(
  value: unknown,
  names: Map<string, string> = new Map(),
): CommunityListing {
  const row = asRecord(value);
  const sellerId = asString(row.seller_id);
  const bidderId = asNullableString(row.current_bidder_id);
  const winnerId = asNullableString(row.winner_id);
  return {
    id: asString(row.id),
    seller_id: sellerId,
    user_distribution_id: asString(row.user_distribution_id),
    distribution_id: asString(row.distribution_id),
    description: asNullableString(row.description),
    starting_price: asNumber(row.starting_price),
    min_increment: asNumber(row.min_increment, 1),
    buy_now_price: asNullableNumber(row.buy_now_price),
    current_price: asNumber(row.current_price),
    current_bidder_id: bidderId,
    bid_count: asNumber(row.bid_count),
    status: (asString(row.status, "active") as CommunityAuctionStatus),
    end_time: asString(row.end_time),
    winner_id: winnerId,
    sold_price: asNullableNumber(row.sold_price),
    settled_at: asNullableString(row.settled_at),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
    pokemon: normalizePokemon(row.distributions),
    seller_name: names.get(sellerId) || "匿名收藏家",
    current_bidder_name: bidderId ? names.get(bidderId) || "匿名收藏家" : null,
    winner_name: winnerId ? names.get(winnerId) || "匿名收藏家" : null,
  };
}

export function normalizeInventory(value: unknown): MarketInventoryItem {
  const row = asRecord(value);
  return {
    id: asString(row.id),
    distribution_id: asString(row.distribution_id),
    obtained_at: asString(row.obtained_at),
    pokemon: normalizePokemon(row.distributions),
  };
}

export function twd(value: number): string {
  return `NT$${new Intl.NumberFormat("zh-TW").format(value)}`;
}

export function taipeiDate(value: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function minimumBid(listing: CommunityListing): number {
  return listing.bid_count > 0
    ? listing.current_price + listing.min_increment
    : listing.starting_price;
}

export function effectiveStatus(listing: CommunityListing): CommunityAuctionStatus {
  if (listing.status === "active" && new Date(listing.end_time).getTime() <= Date.now()) {
    return listing.current_bidder_id ? "sold" : "ended";
  }
  return listing.status;
}
