import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/auth";

// POST /api/commissions/[id]/executor-fee — 執行者提交抽成 / 賣家同意或拒絕
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  const body = await request.json();
  const { action, executor_fee } = body;

  // 取得委託
  const { data: commission, error: fetchError } = await supabase
    .from("commissions")
    .select("*")
    .eq("id", params.id)
    .single();

  if (fetchError || !commission) {
    return NextResponse.json({ error: "找不到此委託" }, { status: 404 });
  }

  // action: "propose" — 執行者提交抽成金額
  if (action === "propose") {
    if (user.id !== commission.executor_id) {
      return NextResponse.json({ error: "只有執行者可以提交抽成" }, { status: 403 });
    }

    if (!executor_fee || executor_fee < 0) {
      return NextResponse.json({ error: "抽成金額無效" }, { status: 400 });
    }

    // 檢查上限：不超過底價的 4/5
    const maxFee = Math.floor((commission.base_price * 4) / 5);
    if (executor_fee > maxFee) {
      return NextResponse.json(
        { error: `抽成不可超過底價的 4/5（上限 ${maxFee}）` },
        { status: 400 }
      );
    }

    // 用 admin client 繞過 RLS
    const adminSupabase = createAdminSupabaseClient();
    const { data, error } = await adminSupabase
      .from("commissions")
      .update({
        executor_fee,
        executor_fee_approved: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ commission: data, message: "抽成已提交，等待賣家確認" });
  }

  // action: "approve" / "reject" — 賣家回應
  if (action === "approve" || action === "reject") {
    if (user.id !== commission.poster_id) {
      return NextResponse.json({ error: "只有刊登者可以審核抽成" }, { status: 403 });
    }

    const updateData =
      action === "approve"
        ? { executor_fee_approved: true, updated_at: new Date().toISOString() }
        : { executor_fee: 0, executor_fee_approved: false, updated_at: new Date().toISOString() };

    const adminSupabase2 = createAdminSupabaseClient();
    const { data, error } = await adminSupabase2
      .from("commissions")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      commission: data,
      message: action === "approve" ? "已同意執行者抽成" : "已拒絕執行者抽成",
    });
  }

  return NextResponse.json({ error: "無效的 action" }, { status: 400 });
}
