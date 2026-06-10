import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/auth";
import { getBackpackStoreRebatePercent } from "@/lib/rewardExchange";

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

  // 尋找有效且尚未使用的商店消費報銷券
  const { data, error } = await adminClient
    .from("backpack_items")
    .select("id, item_type, item_name, created_at, expires_at")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = Date.now();
  const coupons = (data ?? [])
    .filter((coupon) => !coupon.expires_at || new Date(coupon.expires_at).getTime() > now)
    .map((coupon) => ({
      ...coupon,
      discount_percent: getBackpackStoreRebatePercent(coupon.item_type, coupon.item_name),
    }))
    .filter((coupon) => coupon.discount_percent !== null)
    .sort((a, b) => Number(b.discount_percent) - Number(a.discount_percent));

  return NextResponse.json(coupons);
}
