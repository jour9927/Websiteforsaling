import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/auth";
import {
  calculateStoreRebatePayableAmount,
  getBackpackStoreRebatePercent,
} from "@/lib/rewardExchange";

const PAYMENT_METHODS = ["pay_now", "deferred"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];
const DEFERRED_PAYMENT_MONTHS = [1, 2] as const;
type DeferredPaymentMonths = (typeof DEFERRED_PAYMENT_MONTHS)[number];

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
  const paymentMethod = PAYMENT_METHODS.includes(body.payment_method as PaymentMethod)
    ? (body.payment_method as PaymentMethod)
    : "pay_now";
  const requestedDeferredPaymentMonths = Number(body.deferred_payment_months);
  const deferredPaymentMonths: DeferredPaymentMonths | null =
    paymentMethod === "deferred"
      ? DEFERRED_PAYMENT_MONTHS.includes(
          requestedDeferredPaymentMonths as DeferredPaymentMonths,
        )
        ? (requestedDeferredPaymentMonths as DeferredPaymentMonths)
        : 1
      : null;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "購物車為空" }, { status: 400 });
  }

  // 使用 admin client 寫入（繞過 RLS INSERT 限制）
  const adminClient = createAdminSupabaseClient();

  let discountedAmount = Number(total_amount);
  let couponNote = "";
  const paymentNote =
    paymentMethod === "deferred"
      ? `（付款方式：延遲付款 ${deferredPaymentMonths} 個月，已先保留卡位）`
      : "（付款方式：立即付款）";

  // 處理商店消費報銷券
  if (coupon_item_id) {
    const { data: coupon } = await adminClient
      .from("backpack_items")
      .select("id, item_type, item_name, is_active, expires_at")
      .eq("id", coupon_item_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!coupon) {
      return NextResponse.json({ error: "找不到該折價券" }, { status: 400 });
    }

    if (!coupon.is_active) {
      return NextResponse.json({ error: "該折價券已使用或已停用" }, { status: 400 });
    }

    if (coupon.expires_at && new Date(coupon.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: "該折價券已過期" }, { status: 400 });
    }

    const discountPercent = getBackpackStoreRebatePercent(coupon.item_type, coupon.item_name);

    if (discountPercent === null) {
      return NextResponse.json({ error: "該折價券不適用於商店消費" }, { status: 400 });
    }

    discountedAmount = calculateStoreRebatePayableAmount(Number(total_amount), discountPercent);
    couponNote = `（使用 ${discountPercent}% 商店消費報銷券，原價 NT$ ${Number(total_amount).toLocaleString()}，實付 NT$ ${discountedAmount.toLocaleString()}）`;

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
      payment_method: paymentMethod,
      deferred_payment_months: deferredPaymentMonths,
      notes: [notes ?? "", couponNote, paymentNote].filter(Boolean).join(" ").trim(),
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
