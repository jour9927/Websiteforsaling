import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/auth";

// POST /api/store/orders — 建立訂單
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  const body = await req.json();
  const { items, notes, total_amount, coupon_item_id } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "購物車為空" }, { status: 400 });
  }

  // 使用 admin client 寫入（繞過 RLS INSERT 限制）
  const adminClient = createAdminSupabaseClient();

  let discountedAmount = Number(total_amount);
  let couponNote = "";

  // 處理 50% 抵用券
  if (coupon_item_id) {
    const { data: coupon } = await adminClient
      .from("backpack_items")
      .select("id, item_type, item_name, is_active")
      .eq("id", coupon_item_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!coupon) {
      return NextResponse.json({ error: "找不到該折價券" }, { status: 400 });
    }

    if (!coupon.is_active) {
      return NextResponse.json({ error: "該折價券已使用" }, { status: 400 });
    }

    if (coupon.item_name !== "商店消費報銷券（50%）") {
      return NextResponse.json({ error: "該折價券不適用於商店消費" }, { status: 400 });
    }

    discountedAmount = Math.round(Number(total_amount) * 0.5);
    couponNote = `（使用 50% 商店報銷券，原價 NT$ ${Number(total_amount).toLocaleString()}）`;

    // 標記折價券為已使用
    await adminClient
      .from("backpack_items")
      .update({ is_active: false })
      .eq("id", coupon_item_id);
  }

  // 建立訂單
  const { data: order, error: orderError } = await adminClient
    .from("shop_orders")
    .insert({
      user_id: user.id,
      status: "pending",
      total_amount: discountedAmount,
      notes: [notes ?? "", couponNote].filter(Boolean).join(" ").trim(),
    })
    .select()
    .single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  // 建立訂單項目
  const orderItems = items.map((item: { product_id: string; product_name: string; price: number; quantity: number }) => ({
    order_id: order.id,
    product_id: item.product_id,
    product_name: item.product_name,
    price: Number(item.price),
    quantity: Number(item.quantity),
  }));

  const { error: itemsError } = await adminClient
    .from("shop_order_items")
    .insert(orderItems);

  if (itemsError) {
    // 刪除已建立的訂單（rollback）
    await adminClient.from("shop_orders").delete().eq("id", order.id);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json(order, { status: 201 });
}

// GET /api/store/orders — 查詢用戶訂單
export async function GET() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("shop_orders")
    .select("*, items:shop_order_items(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
