import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const { data: expired, error } = await supabase
    .from("community_auctions")
    .select("id")
    .eq("status", "active")
    .lte("end_time", new Date().toISOString())
    .order("end_time", { ascending: true })
    .limit(50);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const results = [];
  for (const auction of expired || []) {
    const { data, error: finalizeError } = await supabase.rpc("finalize_community_auction", {
      p_auction_id: auction.id,
    });
    results.push({
      auctionId: auction.id,
      success: !finalizeError,
      status: data?.status || null,
      error: finalizeError?.message || null,
    });
  }

  const failed = results.filter((result) => !result.success).length;
  return NextResponse.json({
    success: failed === 0,
    finalized: results.length - failed,
    failed,
    results,
  });
}
