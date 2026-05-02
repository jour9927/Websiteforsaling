import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/auth";

// GET /api/admin/store/orders — 列出全部訂單（含用戶資訊 + 商品明細）
export async function GET() {
  const supabase = createAdminSupabaseClient();

  const { data: orders, error } = await supabase
    .from("shop_orders")
    .select("*, items:shop_order_items(*), user:profiles!shop_orders_user_id_fkey(full_name, email)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(orders ?? []);
}
