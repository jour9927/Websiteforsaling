import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/auth";
import { getBackpackStoreCouponDiscount } from "@/lib/rewardExchange";

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
    .map((coupon) => {
      const discount = getBackpackStoreCouponDiscount(coupon.item_type, coupon.item_name);

      return {
        ...coupon,
        discount_kind: discount?.kind ?? null,
        discount_value: discount?.value ?? null,
        discount_percent: discount?.kind === "percent" ? discount.value : null,
        discount_amount: discount?.kind === "amount" ? discount.value : null,
      };
    })
    .filter((coupon) => coupon.discount_kind !== null && coupon.discount_value !== null)
    .sort((a, b) => Number(b.discount_value) - Number(a.discount_value));

  return NextResponse.json(coupons);
}
