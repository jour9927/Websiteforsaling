import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/store/checkout/coupons — 取得可用的商店折價券
export async function GET() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  const adminClient = createAdminSupabaseClient();

  // 尋找有效且尚未使用的 50% 商店報銷券
  const { data, error } = await adminClient
    .from("backpack_items")
    .select("id, item_type, item_name, created_at")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .eq("item_name", "商店消費報銷券（50%）");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
