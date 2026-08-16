import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/auth";
import {
  MARKET_SELECT,
  normalizeListing,
  type MarketBid,
  type MarketCashPayment,
  type MarketPaymentDetails,
} from "@/lib/community-market";
import { CommunityAuctionDetailClient } from "@/components/community-market/CommunityAuctionDetailClient";

export const dynamic = "force-dynamic";

type PageProps = { params: { id: string } };
type PublicProfile = { id: string; full_name: string | null; username: string | null };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `民間拍賣 ${params.id.slice(0, 8)}`,
  };
}

export default async function CommunityAuctionPage({ params }: PageProps) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: row, error }, { data: bidRows }] = await Promise.all([
    supabase
      .from("community_auctions")
      .select(MARKET_SELECT)
      .eq("id", params.id)
      .maybeSingle(),
    supabase
      .from("community_auction_bids")
      .select("id, bidder_id, amount, created_at")
      .eq("auction_id", params.id)
      .order("amount", { ascending: false })
      .limit(50),
  ]);

  if (error || !row) notFound();

  const profileIds = Array.from(
    new Set(
      [
        row.seller_id,
        row.current_bidder_id,
        row.winner_id,
        ...(bidRows || []).map((bid) => bid.bidder_id),
      ].filter((id): id is string => typeof id === "string" && id.length > 0),
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
  const listing = normalizeListing(row, names);
  const bids: MarketBid[] = (bidRows || []).map((bid) => ({
    id: bid.id,
    bidder_id: bid.bidder_id,
    bidder_name: names.get(bid.bidder_id) || "匿名收藏家",
    amount: bid.amount,
    created_at: bid.created_at,
  }));

  const [ownProfileResult, identityResult, paymentDetailsResult, cashPaymentResult] = user
    ? await Promise.all([
        supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
        supabase
          .from("trade_identity_verifications")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("community_market_payment_details")
          .select("payment_instructions")
          .eq("auction_id", params.id)
          .maybeSingle(),
        supabase
          .from("community_market_cash_payments")
          .select("status, proof_path, reference_note, rejection_reason, submitted_at, reviewed_at")
          .eq("auction_id", params.id)
          .maybeSingle(),
      ])
    : [{ data: null }, { data: null }, { data: null }, { data: null }];

  const cashPayment = (cashPaymentResult.data || null) as MarketCashPayment | null;
  let proofUrl: string | null = null;
  if (cashPayment?.proof_path) {
    const { data } = await supabase.storage
      .from("community-market-payments")
      .createSignedUrl(cashPayment.proof_path, 300);
    proofUrl = data?.signedUrl || null;
  }

  return (
    <CommunityAuctionDetailClient
      listing={listing}
      bids={bids}
      currentUserId={user?.id || null}
      identityStatus={identityResult.data?.status || null}
      isAdmin={ownProfileResult.data?.role === "admin"}
      paymentDetails={(paymentDetailsResult.data || null) as MarketPaymentDetails | null}
      cashPayment={cashPayment}
      proofUrl={proofUrl}
    />
  );
}
