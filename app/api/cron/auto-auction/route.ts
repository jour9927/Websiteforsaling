import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/auth";
import { getGlobalLinkV2VirtualHighest } from "@/lib/globalLinkV2VirtualBids";

type AuctionRow = {
  id: string;
  start_time: string;
  end_time: string;
  starting_price: number;
  min_increment: number;
  automation_target_min: number | null;
  automation_target_max: number | null;
  automation_stop_seconds: number | null;
};

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const now = new Date();

  const { data: auctions, error: auctionsError } = await supabase
    .from("auctions")
    .select("id, start_time, end_time, starting_price, min_increment, automation_target_min, automation_target_max, automation_stop_seconds")
    .eq("status", "active")
    .eq("automation_mode", "global_link_v2")
    .lte("end_time", now.toISOString())
    .limit(20);

  if (auctionsError) {
    return NextResponse.json({ success: false, error: auctionsError.message }, { status: 500 });
  }

  const results = [];

  for (const auction of (auctions ?? []) as AuctionRow[]) {
    const { data: bids, error: bidsError } = await supabase
      .from("bids")
      .select("amount, created_at")
      .eq("auction_id", auction.id)
      .gte("created_at", auction.start_time)
      .order("created_at", { ascending: true });

    if (bidsError) {
      results.push({ auctionId: auction.id, success: false, error: bidsError.message });
      continue;
    }

    const virtualHighest = getGlobalLinkV2VirtualHighest({
      auctionId: auction.id,
      startTime: auction.start_time,
      endTime: auction.end_time,
      startingPrice: auction.starting_price,
      currentTime: new Date(auction.end_time),
      targetMin: auction.automation_target_min ?? 39000,
      targetMax: auction.automation_target_max ?? 45000,
      stopSeconds: auction.automation_stop_seconds ?? 1,
      realBids: bids ?? [],
    });

    const { data, error } = await supabase.rpc("finalize_global_link_auto_follow_system", {
      p_auction_id: auction.id,
      p_virtual_highest: virtualHighest,
    });

    results.push({
      auctionId: auction.id,
      virtualHighest,
      success: !error,
      result: data ?? null,
      error: error?.message,
    });
  }

  return NextResponse.json({
    success: true,
    disabled: true,
    finalized: results.length,
    results,
    message: "舊版自動排程競標維持暫停；此端點只執行 Global Link v2 結尾保底結算。",
  });
}
