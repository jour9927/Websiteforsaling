import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/auth";

// PATCH /api/admin/commissions/[id]/proof-review — 管理員審核合法性證明
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

  const { data: commission, error: fetchError } = await adminSupabase
    .from("commissions")
    .select("*")
    .eq("id", params.id)
    .single();

  if (fetchError || !commission) {
    return NextResponse.json({ error: "找不到此委託" }, { status: 404 });
  }

  if (commission.status !== "proof_submitted") {
    return NextResponse.json({ error: "此委託不在證明審核狀態" }, { status: 400 });
  }

  if (action === "approve") {
    const { data, error } = await adminSupabase
      .from("commissions")
      .update({
        status: "proof_approved",
        admin_review_note: note || "證明審核通過",
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ commission: data, message: "證明審核通過" });
  }

  if (action === "reject") {
    // 退回到 accepted 狀態讓執行者重新提交
    const { data, error } = await adminSupabase
      .from("commissions")
      .update({
        status: "accepted",
        admin_review_note: note || "證明未通過，請重新提交",
        proof_images: [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ commission: data, message: "證明未通過，已退回" });
  }

  return NextResponse.json({ error: "無效的 action" }, { status: 400 });
}
