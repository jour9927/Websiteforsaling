"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface OrderItem {
  id: string;
  product_name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  notes: string;
  created_at: string;
  items: OrderItem[];
}

function formatPrice(price: number) {
  return `NT$ ${price.toLocaleString()}`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "待處理", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  paid: { label: "已付款", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  delivered: { label: "已交付", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  cancelled: { label: "已取消", color: "text-red-400 bg-red-400/10 border-red-400/20" },
};

export default function OrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/store/orders")
      .then((res) => res.json())
      .then((orders) => {
        if (Array.isArray(orders)) {
          const found = orders.find((o: Order) => o.id === params.id);
          if (found) setOrder(found);
          else setError("找不到此訂單");
        }
      })
      .catch(() => setError("無法載入訂單"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-white/50 animate-pulse">載入中...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <span className="text-5xl opacity-30">📦</span>
        <p className="mt-4 text-white/50">{error || "訂單不存在"}</p>
        <Link
          href="/store"
          className="mt-4 rounded-xl bg-amber-500 px-4 py-2 text-sm text-black hover:bg-amber-400"
        >
          返回商店
        </Link>
      </div>
    );
  }

  const status = statusLabels[order.status] ?? statusLabels.pending;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 成功提示 */}
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-6 text-center">
        <span className="text-4xl">✅</span>
        <h1 className="mt-3 text-xl font-bold text-white">訂單已建立！</h1>
        <p className="mt-1 text-white/60 text-sm">
          我們已收到你的訂單，請等待管理員處理。
        </p>
      </div>

      {/* 訂單資訊 */}
      <section className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white/70">訂單資訊</h2>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}
          >
            {status.label}
          </span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-white/5">
            <span className="text-white/50">訂單編號</span>
            <span className="text-white/70 font-mono text-xs">{order.id.slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/5">
            <span className="text-white/50">下單時間</span>
            <span className="text-white/70">{formatDateTime(order.created_at)}</span>
          </div>
          {order.notes && (
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-white/50">備註</span>
              <span className="text-white/70 text-right max-w-[60%]">{order.notes}</span>
            </div>
          )}
        </div>
      </section>

      {/* 商品明細 */}
      <section className="glass-card p-6">
        <h2 className="text-sm font-semibold text-white/70 mb-4">商品明細</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
            >
              <div>
                <p className="text-white text-sm">{item.product_name}</p>
                <p className="text-white/40 text-xs">
                  {formatPrice(item.price)} × {item.quantity}
                </p>
              </div>
              <p className="text-amber-400 text-sm font-semibold">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
          <span className="text-white/60">總計</span>
          <span className="text-xl font-bold text-amber-400">
            {formatPrice(order.total_amount)}
          </span>
        </div>
      </section>

      <div className="flex gap-3">
        <Link
          href="/store"
          className="flex-1 rounded-xl border border-white/20 py-3 text-center text-sm text-white/70 hover:bg-white/10 transition"
        >
          繼續購物
        </Link>
        <Link
          href="/profile"
          className="flex-1 rounded-xl bg-white/10 py-3 text-center text-sm text-white/70 hover:bg-white/20 transition"
        >
          查看我的訂單
        </Link>
      </div>
    </div>
  );
}
