import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

// POST /api/commissions/[id]/accept — 接受委託
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

  // 取得委託
  const { data: commission, error: fetchError } = await supabase
    .from("commissions")
    .select("*")
    .eq("id", params.id)
    .single();

  if (fetchError || !commission) {
    return NextResponse.json({ error: "找不到此委託" }, { status: 404 });
  }

  // 檢查狀態必須是 active 或 queued
  if (commission.status !== "active" && commission.status !== "queued") {
    return NextResponse.json({ error: "此委託目前無法接單" }, { status: 400 });
  }

  // 不能接自己的委託
  if (commission.poster_id === user.id) {
    return NextResponse.json({ error: "不能接受自己的委託" }, { status: 400 });
  }

  // 已經有人接了
  if (commission.executor_id || commission.executor_virtual_id) {
    return NextResponse.json({ error: "此委託已被其他人接受" }, { status: 400 });
  }

  // 解析 body（可能帶 executor_fee）
  let executorFee = 0;
  try {
    const body = await request.json();
    if (body.executor_fee && typeof body.executor_fee === "number" && body.executor_fee > 0) {
      const maxFee = Math.floor((commission.base_price * 4) / 5 - commission.platform_fee);
      if (body.executor_fee > maxFee) {
        return NextResponse.json({ error: `抽成不可超過 ${maxFee}` }, { status: 400 });
      }
      executorFee = body.executor_fee;
    }
  } catch {
    // body 為空也沒關係
  }

  // 檢查是否為首次委託（需要押底）
  const { count: prevCount } = await supabase
    .from("commissions")
    .select("id", { count: "exact", head: true })
    .eq("executor_id", user.id)
    .eq("status", "completed");

  const isFirstTime = (prevCount || 0) === 0;

  // 更新委託狀態
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const isQueued = commission.status === "queued";
  const updateData: Record<string, any> = {
    executor_id: user.id,
    executor_type: "user",
    updated_at: new Date().toISOString(),
  };

  if (isQueued) {
    // 排隊中：記錄執行者但不改狀態，等啟用時自動變 accepted
    updateData.accepted_at = new Date().toISOString();
  } else {
    // active：正式接單
    updateData.status = "accepted";
    updateData.accepted_at = new Date().toISOString();
  }

  if (executorFee > 0) {
    updateData.executor_fee = executorFee;
    updateData.executor_fee_approved = false;
  }

  const { data: updated, error: updateError } = await supabase
    .from("commissions")
    .update(updateData)
    .eq("id", params.id)
    .in("status", ["active", "queued"])
    .select()
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: "接單失敗，請重試" }, { status: 500 });
  }

  const feeNote = executorFee > 0 ? `已提出抽成 ${executorFee.toLocaleString()}，等待刊登者確認。` : "";
  const depositNote = isFirstTime ? "由於是首次執行委託，需要提供押底寶可夢。" : "";
  const queueNote = isQueued ? "已預約！當委託正式啟用時你將成為執行者。" : "接單成功！";
  const msg = [queueNote, depositNote, feeNote].filter(Boolean).join(" ");

  return NextResponse.json({
    commission: updated,
    deposit_required: isFirstTime,
    message: msg,
  });
}
