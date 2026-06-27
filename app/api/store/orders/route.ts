import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/auth";
import {
  calculateStoreFixedDiscountPayableAmount,
  calculateStoreRebatePayableAmount,
  getBackpackStoreCouponDiscount,
} from "@/lib/rewardExchange";

const PAYMENT_METHODS = ["pay_now", "deferred"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];
const DEFERRED_PAYMENT_MONTHS = [1, 2] as const;
type DeferredPaymentMonths = (typeof DEFERRED_PAYMENT_MONTHS)[number];
type StoreCouponDiscount = NonNullable<ReturnType<typeof getBackpackStoreCouponDiscount>>;

function getRequestedCouponIds(body: Record<string, unknown>) {
  const rawCouponIds = Array.isArray(body.coupon_item_ids)
    ? body.coupon_item_ids
    : body.coupon_item_id
      ? [body.coupon_item_id]
      : [];

  return Array.from(
    new Set(
      rawCouponIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0),
    ),
  );
}

function validateCouponCombination(discounts: StoreCouponDiscount[]) {
  if (discounts.length > 2) {
    return false;
  }

  const percentDiscounts = discounts.filter((discount) => discount.kind === "percent");
  const amountDiscounts = discounts.filter((discount) => discount.kind === "amount");

  if (percentDiscounts.length > 1 || amountDiscounts.length > 1) {
    return false;
  }

  if (discounts.length === 2) {
    return percentDiscounts[0]?.value === 50 && amountDiscounts[0]?.value === 1000;
  }

  return true;
}

function applyCouponDiscounts(totalAmount: number, discounts: StoreCouponDiscount[]) {
  return discounts
    .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "percent" ? -1 : 1))
    .reduce((amount, discount) => {
      if (discount.kind === "percent") {
        return calculateStoreRebatePayableAmount(amount, discount.value);
      }

      return calculateStoreFixedDiscountPayableAmount(amount, discount.value);
    }, Number(totalAmount));
}

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
  const { items, notes, total_amount } = body;
  const couponItemIds = getRequestedCouponIds(body);
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

  if (couponItemIds.length > 0) {
    const { data: coupons, error: couponError } = await adminClient
      .from("backpack_items")
      .select("id, item_type, item_name, is_active, expires_at")
      .eq("user_id", user.id)
      .in("id", couponItemIds);

    if (couponError) {
      return NextResponse.json({ error: couponError.message }, { status: 500 });
    }

    if (!coupons || coupons.length !== couponItemIds.length) {
      return NextResponse.json({ error: "找不到該折價券" }, { status: 400 });
    }

    const couponDiscounts: StoreCouponDiscount[] = [];

    for (const coupon of coupons) {
      if (!coupon.is_active) {
        return NextResponse.json({ error: "該折價券已使用或已停用" }, { status: 400 });
      }

      if (coupon.expires_at && new Date(coupon.expires_at).getTime() <= Date.now()) {
        return NextResponse.json({ error: "該折價券已過期" }, { status: 400 });
      }

      const discount = getBackpackStoreCouponDiscount(coupon.item_type, coupon.item_name);

      if (discount === null) {
        return NextResponse.json({ error: "該折價券不適用於商店消費" }, { status: 400 });
      }

      couponDiscounts.push(discount);
    }

    if (!validateCouponCombination(couponDiscounts)) {
      return NextResponse.json({ error: "這些折價券不可同時使用" }, { status: 400 });
    }

    discountedAmount = applyCouponDiscounts(Number(total_amount), couponDiscounts);
    couponNote = `（使用消費券，原價 NT$ ${Number(total_amount).toLocaleString()}，實付 NT$ ${discountedAmount.toLocaleString()}）`;

    const { error: couponUpdateError } = await adminClient
      .from("backpack_items")
      .update({ is_active: false })
      .in("id", couponItemIds);

    if (couponUpdateError) {
      return NextResponse.json({ error: couponUpdateError.message }, { status: 500 });
    }
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
