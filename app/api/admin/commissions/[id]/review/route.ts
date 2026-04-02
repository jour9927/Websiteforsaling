import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/auth";

// PATCH /api/admin/commissions/[id]/review — 管理員審核委託
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 驗證管理員身份
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "權限不足" }, { status: 403 });
  }

  const body = await request.json();
  const { action, note } = body; // action: "approve" | "reject"

  const adminSupabase = createAdminSupabaseClient();

  // 取得委託
  const { data: commission, error: fetchError } = await adminSupabase
    .from("commissions")
    .select("*")
    .eq("id", params.id)
    .single();

  if (fetchError || !commission) {
    return NextResponse.json({ error: "找不到此委託" }, { status: 404 });
  }

  if (commission.status !== "pending_review") {
    return NextResponse.json({ error: "此委託不在待審核狀態" }, { status: 400 });
  }

  if (action === "reject") {
    const { data, error } = await adminSupabase
      .from("commissions")
      .update({
        status: "cancelled",
        admin_review_note: note || "審核未通過",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ commission: data, message: "已拒絕此委託" });
  }

  if (action === "approve") {
    // 檢查今日啟用數
    const { data: todayCount } = await adminSupabase.rpc("get_today_active_commission_count");
    const todayActive = todayCount || 0;

    let newStatus: string;
    let queuePosition: number | null = null;
    let activatedDate: string | null = null;

    if (todayActive < 5) {
      newStatus = "active";
      activatedDate = new Date().toISOString().split("T")[0];
    } else {
      newStatus = "queued";
      const { data: nextPos } = await adminSupabase.rpc("get_next_queue_position");
      queuePosition = nextPos || 1;
    }

    const { data, error } = await adminSupabase
      .from("commissions")
      .update({
        status: newStatus,
        queue_position: queuePosition,
        activated_date: activatedDate,
        admin_review_note: note || "審核通過",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      commission: data,
      message: newStatus === "active"
        ? `已通過並啟用（今日第 ${todayActive + 1}/5）`
        : `已通過，排隊中（排隊位置 #${queuePosition}）`,
    });
  }

  return NextResponse.json({ error: "無效的 action" }, { status: 400 });
}
