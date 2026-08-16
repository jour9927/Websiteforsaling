import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/auth";
import {
  INVENTORY_SELECT,
  MARKET_SELECT,
  normalizeInventory,
  normalizeListing,
} from "@/lib/community-market";
import { CommunityMarketClient } from "@/components/community-market/CommunityMarketClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "民間交易區",
  description: "瀏覽玩家刊登的配布寶可夢，使用站內點數出價或立即購買。",
};

type PublicProfile = {
  id: string;
  full_name: string | null;
  username: string | null;
};

export default async function CommunityMarketPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: activeRows, error: activeError }, { data: recentRows, error: recentError }] =
    await Promise.all([
      supabase
        .from("community_auctions")
        .select(MARKET_SELECT)
        .eq("status", "active")
        .order("end_time", { ascending: true })
        .limit(80),
      supabase
        .from("community_auctions")
        .select(MARKET_SELECT)
        .in("status", ["sold", "ended", "cancelled"])
        .order("updated_at", { ascending: false })
        .limit(12),
    ]);

  const allRows = [...(activeRows || []), ...(recentRows || [])];
  const profileIds = Array.from(
    new Set(
      allRows.flatMap((row) =>
        [row.seller_id, row.current_bidder_id, row.winner_id].filter(
          (id): id is string => typeof id === "string" && id.length > 0,
        ),
      ),
    ),
  );

  const { data: profileRows } = profileIds.length
    ? await supabase
        .from("public_profiles")
        .select("id, full_name, username")
        .in("id", profileIds)
    : { data: [] as PublicProfile[] };

  const names = new Map(
    ((profileRows || []) as PublicProfile[]).map((profile) => [
      profile.id,
      profile.username || profile.full_name || "匿名收藏家",
    ]),
  );

  const now = Date.now();
  const active = (activeRows || [])
    .map((row) => normalizeListing(row, names))
    .filter((listing) => new Date(listing.end_time).getTime() > now);
  const expired = (activeRows || [])
    .map((row) => normalizeListing(row, names))
    .filter((listing) => new Date(listing.end_time).getTime() <= now);
  const recent = [
    ...expired,
    ...(recentRows || []).map((row) => normalizeListing(row, names)),
  ].slice(0, 12);

  let inventory: ReturnType<typeof normalizeInventory>[] = [];
  let balance = 0;
  let identityStatus: "pending" | "approved" | "rejected" | null = null;

  if (user) {
    const [
      { data: inventoryRows },
      { data: ownProfile },
      { data: ownActiveRows },
      { data: identityVerification },
    ] =
      await Promise.all([
        supabase
          .from("user_distributions")
          .select(INVENTORY_SELECT)
          .eq("user_id", user.id)
          .order("obtained_at", { ascending: false }),
        supabase.from("profiles").select("points").eq("id", user.id).maybeSingle(),
        supabase
          .from("community_auctions")
          .select("user_distribution_id")
          .eq("seller_id", user.id)
          .eq("status", "active"),
        supabase
          .from("trade_identity_verifications")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
    const listedIds = new Set((ownActiveRows || []).map((row) => row.user_distribution_id));
    inventory = (inventoryRows || [])
      .filter((row) => !listedIds.has(row.id))
      .map(normalizeInventory);
    balance = typeof ownProfile?.points === "number" ? ownProfile.points : 0;
    identityStatus = identityVerification?.status || null;
  }

  const unavailable = activeError || recentError
    ? "交易區資料表尚未套用，完成資料庫 migration 後即可啟用。"
    : null;

  return (
    <CommunityMarketClient
      active={active}
      recent={recent}
      inventory={inventory}
      currentUserId={user?.id || null}
      balance={balance}
      identityStatus={identityStatus}
      unavailable={unavailable}
    />
  );
}
