import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/store/products — 前台道具商店的公開商品清單。
 *
 * 前台原本直接打 /api/admin/store，那條路由沒有任何驗證卻用 service role
 * 讀整張 shop_products（含下架商品）。所以不能只是替 admin 路由補上守衛——
 * 補了前台就壞掉——必須先有這條乾淨的公開端點。
 *
 * 與 admin 版的差異：
 *  - 只回 is_active 的商品
 *  - 只選前台真的會用到的欄位，不要 select("*")
 *
 * 這裡仍用 admin client 是因為 shop_products 沒開放 anon 讀取；
 * 但查詢條件與欄位都寫死在伺服器端，呼叫端無法擴大範圍。
 */
export async function GET() {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("shop_products")
    .select(
      "id, name, description, price, image_url, category, stock, sold_count, is_active, seller_name, interested_count, liked_count",
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
