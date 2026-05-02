"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart";

function formatPrice(price: number) {
  return `NT$ ${price.toLocaleString()}`;
}

export default function CheckoutPage() {
  const { items, totalAmount, clearCart } = useCart();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

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
          <span className="text-white/60">總計</span>
          <span className="text-2xl font-bold text-amber-400">
            {formatPrice(totalAmount)}
          </span>
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
          {submitting ? "處理中..." : "確認下單"}
        </button>
      </div>
    </div>
  );
}
