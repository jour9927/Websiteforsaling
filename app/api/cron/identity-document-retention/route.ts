import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/auth";

const IDENTITY_BUCKET = "identity-verifications";
const PAYMENT_BUCKET = "community-market-payments";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  const { data: due, error } = await admin
    .from("trade_identity_verifications")
    .select("id, id_front_path, id_back_path")
    .not("documents_purge_after", "is", null)
    .is("documents_purged_at", null)
    .lte("documents_purge_after", new Date().toISOString())
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results = [];
  for (const row of due || []) {
    const { error: removeError } = await admin.storage
      .from(IDENTITY_BUCKET)
      .remove([row.id_front_path, row.id_back_path]);
    if (!removeError) {
      await admin
        .from("trade_identity_verifications")
        .update({ documents_purged_at: new Date().toISOString() })
        .eq("id", row.id);
    }
    results.push({ id: row.id, success: !removeError, error: removeError?.message || null });
  }

  const { data: paymentDue, error: paymentDueError } = await admin
    .from("community_market_cash_payments")
    .select("auction_id, proof_path")
    .not("proof_purge_after", "is", null)
    .is("proof_purged_at", null)
    .lte("proof_purge_after", new Date().toISOString())
    .limit(100);
  if (paymentDueError) return NextResponse.json({ error: paymentDueError.message }, { status: 500 });

  const paymentResults = [];
  for (const payment of paymentDue || []) {
    const { error: removeError } = await admin.storage
      .from(PAYMENT_BUCKET)
      .remove([payment.proof_path]);
    if (!removeError) {
      await admin
        .from("community_market_cash_payments")
        .update({ proof_purged_at: new Date().toISOString() })
        .eq("auction_id", payment.auction_id);
    }
    paymentResults.push({
      auctionId: payment.auction_id,
      success: !removeError,
      error: removeError?.message || null,
    });
  }

  return NextResponse.json({
    identityPurged: results.filter((result) => result.success).length,
    paymentProofsPurged: paymentResults.filter((result) => result.success).length,
    identityResults: results,
    paymentResults,
  });
}
