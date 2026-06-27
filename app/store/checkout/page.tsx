"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import {
  calculateStoreFixedDiscountPayableAmount,
  calculateStoreRebatePayableAmount,
} from "@/lib/rewardExchange";

function formatPrice(price: number) {
  return `NT$ ${price.toLocaleString()}`;
}

type CouponItem = {
  id: string;
  item_type: string;
  item_name: string;
  discount_kind: "percent" | "amount";
  discount_value: number;
  discount_percent: number | null;
  discount_amount: number | null;
  created_at: string;
  expires_at: string | null;
};

type PaymentMethod = "pay_now" | "deferred";
type DeferredPaymentMonths = 1 | 2;
type DiscountKind = CouponItem["discount_kind"];

const paymentOptions: Array<{
  method: PaymentMethod;
  deferredMonths: DeferredPaymentMonths | null;
  title: string;
  description: string;
  activeClass: string;
  accentClass: string;
}> = [
  {
    method: "pay_now",
    deferredMonths: null,
    title: "立即付款",
    description: "下單後依照一般付款流程處理。",
    activeClass: "border-amber-400/60 bg-amber-500/10",
    accentClass: "accent-amber-400",
  },
  {
    method: "deferred",
    deferredMonths: 1,
    title: "延遲付款 1 個月",
    description: "先送出訂單卡位，預計於 1 個月內完成付款。",
    activeClass: "border-sky-400/60 bg-sky-500/10",
    accentClass: "accent-sky-400",
  },
  {
    method: "deferred",
    deferredMonths: 2,
    title: "延遲付款 2 個月",
    description: "先送出訂單卡位，預計於 2 個月內完成付款。",
    activeClass: "border-violet-400/60 bg-violet-500/10",
    accentClass: "accent-violet-400",
  },
];

function calculateCouponPayableAmount(totalAmount: number, coupon: CouponItem) {
  if (coupon.discount_kind === "amount") {
    return calculateStoreFixedDiscountPayableAmount(totalAmount, coupon.discount_amount ?? coupon.discount_value);
  }

  return calculateStoreRebatePayableAmount(totalAmount, coupon.discount_percent ?? coupon.discount_value);
}

function calculateSelectedCouponPayableAmount(totalAmount: number, coupons: CouponItem[]) {
  return coupons
    .sort((a, b) => (a.discount_kind === b.discount_kind ? 0 : a.discount_kind === "percent" ? -1 : 1))
    .reduce((amount, coupon) => calculateCouponPayableAmount(amount, coupon), totalAmount);
}

function describeCoupon(coupon: CouponItem) {
  if (coupon.discount_kind === "amount") {
    const amount = coupon.discount_amount ?? coupon.discount_value;
    return `可折抵 ${formatPrice(amount)}`;
  }

  const percent = coupon.discount_percent ?? coupon.discount_value;
  return `結帳金額最高報銷 ${percent}%`;
}

function getCouponKind(coupon: CouponItem): DiscountKind {
  return coupon.discount_kind;
}

function getCouponValue(coupon: CouponItem) {
  return coupon.discount_kind === "percent"
    ? (coupon.discount_percent ?? coupon.discount_value)
    : (coupon.discount_amount ?? coupon.discount_value);
}

function canCombineCoupons(firstCoupon: CouponItem, secondCoupon: CouponItem) {
  if (firstCoupon.discount_kind === secondCoupon.discount_kind) {
    return false;
  }

  const percentCoupon =
    firstCoupon.discount_kind === "percent" ? firstCoupon : secondCoupon;
  const amountCoupon =
    firstCoupon.discount_kind === "amount" ? firstCoupon : secondCoupon;

  return getCouponValue(percentCoupon) === 50 && getCouponValue(amountCoupon) === 1000;
}

export default function CheckoutPage() {
  const { items, totalAmount, clearCart } = useCart();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [selectedCouponIds, setSelectedCouponIds] = useState<string[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pay_now");
  const [deferredPaymentMonths, setDeferredPaymentMonths] = useState<DeferredPaymentMonths>(1);

  const selectedCoupons = selectedCouponIds
    .map((id) => coupons.find((coupon) => coupon.id === id))
    .filter((coupon): coupon is CouponItem => Boolean(coupon));
  const discountedAmount = selectedCoupons.length > 0
    ? calculateSelectedCouponPayableAmount(totalAmount, selectedCoupons)
    : totalAmount;

  useEffect(() => {
    fetch("/api/store/checkout/coupons")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCoupons(data);
          if (data.length > 0) setSelectedCouponIds([data[0].id]);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCoupons(false));
  }, []);

  function toggleCoupon(coupon: CouponItem) {
    setSelectedCouponIds((currentIds) => {
      if (currentIds.includes(coupon.id)) {
        return currentIds.filter((id) => id !== coupon.id);
      }

      const currentCoupons = currentIds
        .map((id) => coupons.find((currentCoupon) => currentCoupon.id === id))
        .filter((currentCoupon): currentCoupon is CouponItem => Boolean(currentCoupon));
      const nextKind = getCouponKind(coupon);
      const withoutSameKind = currentCoupons.filter(
        (currentCoupon) => getCouponKind(currentCoupon) !== nextKind,
      );

      if (withoutSameKind.length === 1 && !canCombineCoupons(withoutSameKind[0], coupon)) {
        return [coupon.id];
      }

      return [...withoutSameKind.map((currentCoupon) => currentCoupon.id), coupon.id].slice(-2);
    });
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <span className="text-6xl opacity-30">🛒</span>
        <h1 className="mt-6 text-2xl font-bold text-white">購物車是空的</h1>
        <p className="mt-2 text-white/50">先去商店逛逛吧！</p>
        <Link
          href="/store"
          className="mt-6 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-black hover:bg-amber-400 transition"
        >
          前往商店
        </Link>
      </div>
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            product_id: i.productId,
            product_name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
          notes,
          total_amount: totalAmount,
          coupon_item_ids: selectedCouponIds,
          coupon_item_id: selectedCouponIds[0] || null,
          payment_method: paymentMethod,
          deferred_payment_months:
            paymentMethod === "deferred" ? deferredPaymentMonths : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "建立訂單失敗");
      }

      const order = await res.json();
      clearCart();
      router.push(`/store/orders/${order.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "發生錯誤，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">📋 確認訂單</h1>

      {/* 商品清單 */}
      <section className="glass-card p-6">
        <h2 className="text-sm font-semibold text-white/70 mb-4">訂購商品</h2>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0"
            >
              <div className="h-12 w-12 rounded-lg bg-white/5 shrink-0 overflow-hidden">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg opacity-30">
                    🏪
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {item.name}
                </p>
                <p className="text-white/40 text-xs">
                  {formatPrice(item.price)} × {item.quantity}
                </p>
              </div>
              <p className="text-amber-400 text-sm font-semibold shrink-0">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
          <span className="text-white/60">
            {selectedCouponIds.length > 0 ? (
              <span>
                原價 <span className="line-through">{formatPrice(totalAmount)}</span>
              </span>
            ) : (
              "總計"
            )}
          </span>
          <span className="text-2xl font-bold text-amber-400">
            {formatPrice(discountedAmount)}
          </span>
        </div>
      </section>

      {/* 消費券 */}
      {!loadingCoupons && coupons.length > 0 && (
        <section className="glass-card p-6">
          <h2 className="text-sm font-semibold text-white/70 mb-3">🎫 消費券</h2>
          {coupons.map((c) => (
            <label
              key={c.id}
              className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition ${
                selectedCouponIds.includes(c.id)
                  ? "border-emerald-400/50 bg-emerald-500/10"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              }`}
            >
              <input
                type="checkbox"
                name="coupon"
                checked={selectedCouponIds.includes(c.id)}
                onChange={() => toggleCoupon(c)}
                className="accent-emerald-400"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{c.item_name}</p>
                <p className="text-xs text-white/40">
                  {describeCoupon(c)}
                </p>
              </div>
              {selectedCouponIds.includes(c.id) && (
                <span className="text-xs text-emerald-400 font-semibold">使用中</span>
              )}
            </label>
          ))}
          {selectedCouponIds.length > 0 && (
            <button
              onClick={() => setSelectedCouponIds([])}
              className="mt-2 text-xs text-white/40 hover:text-white/70 transition"
            >
              不使用折價券
            </button>
          )}
        </section>
      )}

      {/* 付款方式 */}
      <section className="glass-card p-6">
        <h2 className="text-sm font-semibold text-white/70 mb-3">付款方式</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {paymentOptions.map((option) => {
            const selected =
              paymentMethod === option.method &&
              (option.method === "pay_now" ||
                deferredPaymentMonths === option.deferredMonths);

            return (
              <label
                key={`${option.method}-${option.deferredMonths ?? "now"}`}
                className={`cursor-pointer rounded-xl border p-4 transition ${
                  selected
                    ? option.activeClass
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="payment_method"
                    value={`${option.method}-${option.deferredMonths ?? "now"}`}
                    checked={selected}
                    onChange={() => {
                      setPaymentMethod(option.method);
                      if (option.deferredMonths) {
                        setDeferredPaymentMonths(option.deferredMonths);
                      }
                    }}
                    className={`mt-1 ${option.accentClass}`}
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">{option.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/45">
                      {option.description}
                    </p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </section>

      {/* 備註 */}
      <section className="glass-card p-6">
        <h2 className="text-sm font-semibold text-white/70 mb-3">訂單備註（選填）</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="有任何特別需求請在此填寫..."
          className="w-full px-4 py-3 rounded-xl bg-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
        />
      </section>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* 送出按鈕 */}
      <div className="flex gap-3">
        <Link
          href="/store"
          className="flex-1 rounded-xl border border-white/20 py-3 text-center text-sm text-white/70 hover:bg-white/10 transition"
        >
          繼續購物
        </Link>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-bold text-black hover:bg-amber-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting
            ? "處理中..."
            : paymentMethod === "deferred"
              ? `確認下單並卡位（${deferredPaymentMonths}個月）`
              : "確認下單"}
        </button>
      </div>
    </div>
  );
}
