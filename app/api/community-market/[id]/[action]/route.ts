import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

const ACTIONS = {
  bid: "place_community_bid",
  buy: "buy_community_auction",
  finalize: "finalize_community_auction",
  cancel: "cancel_community_auction",
} as const;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; action: string } },
) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  const rpc = ACTIONS[params.action as keyof typeof ACTIONS];
  if (!rpc) {
    return NextResponse.json({ error: "不支援這個操作" }, { status: 404 });
  }

  let payload: Record<string, unknown> = { p_auction_id: params.id };
  if (params.action === "bid") {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "請輸入出價金額" }, { status: 400 });
    }
    const amount = typeof body.amount === "number" ? body.amount : Number(body.amount);
    if (!Number.isInteger(amount) || amount < 1 || amount > 100000000) {
      return NextResponse.json({ error: "請輸入正確的整數點數" }, { status: 400 });
    }
    payload = { ...payload, p_amount: amount };
  }

  const { data, error } = await supabase.rpc(rpc, payload);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ auction: data });
}
