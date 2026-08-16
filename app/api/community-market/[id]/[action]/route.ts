import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

const ACTIONS = {
  bid: "place_community_bid",
  buy: "buy_community_auction",
  finalize: "finalize_community_auction",
  cancel: "cancel_community_auction",
  "submit-payment": "submit_community_cash_payment",
  "confirm-payment": "confirm_community_cash_payment",
  "reject-payment": "reject_community_cash_payment",
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
      return NextResponse.json({ error: "請輸入正確的新台幣整數金額" }, { status: 400 });
    }
    payload = { ...payload, p_amount: amount };
  } else if (params.action === "submit-payment") {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "請提供付款證明" }, { status: 400 });
    }
    const proofPath = typeof body.proof_path === "string" ? body.proof_path : "";
    const referenceNote = typeof body.reference_note === "string" ? body.reference_note.trim() : null;
    const expectedPath = `${user.id}/${params.id}/proof`;
    if (proofPath !== expectedPath) {
      return NextResponse.json({ error: "付款證明路徑不正確" }, { status: 400 });
    }
    if (referenceNote && referenceNote.length > 300) {
      return NextResponse.json({ error: "付款備註不可超過 300 字" }, { status: 400 });
    }
    payload = { ...payload, p_proof_path: proofPath, p_reference_note: referenceNote };
  } else if (params.action === "reject-payment") {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "請填寫退回原因" }, { status: 400 });
    }
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (!reason || reason.length > 500) {
      return NextResponse.json({ error: "請填寫 500 字以內的退回原因" }, { status: 400 });
    }
    payload = { ...payload, p_reason: reason };
  }

  const { data, error } = await supabase.rpc(rpc, payload);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ auction: data });
}
