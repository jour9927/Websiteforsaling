"use client";

import { useState, useEffect, useCallback } from "react";

interface OrderItem {
  id: string;
  product_name: string;
  price: number;
  quantity: number;
}

interface Profile {
  full_name: string | null;
  email: string | null;
}

interface Order {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  notes: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  user: Profile | null;
}

function formatPrice(price: number) {
  return `NT$ ${price.toLocaleString()}`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const statusOptions = [
  { value: "pending", label: "待處理", color: "bg-amber-400/10 text-amber-400 border-amber-400/20" },
  { value: "paid", label: "已付款", color: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" },
  { value: "delivered", label: "已交付", color: "bg-blue-400/10 text-blue-400 border-blue-400/20" },
  { value: "cancelled", label: "已取消", color: "bg-red-400/10 text-red-400 border-red-400/20" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const res = await fetch("/api/admin/store/orders");
    const data = await res.json();
    if (Array.isArray(data)) setOrders(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function updateStatus(orderId: string, newStatus: string) {
    await fetch(`/api/admin/store/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchOrders();
  }

  const filtered =
    filter === "all"
      ? orders
      : orders.filter((o) => o.status === filter);

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    paid: orders.filter((o) => o.status === "paid").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  if (loading) {
    return (
      <section className="space-y-6">
        <p className="text-white/50">載入中...</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white/90">📦 訂單管理</h1>
        <p className="mt-1 text-sm text-white/60">
          管理商店訂單的狀態更新與交付。
        </p>
      </header>

      {/* 狀態篩選 */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "全部", count: counts.all },
          { key: "pending", label: "待處理", count: counts.pending },
          { key: "paid", label: "已付款", count: counts.paid },
          { key: "delivered", label: "已交付", count: counts.delivered },
          { key: "cancelled", label: "已取消", count: counts.cancelled },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filter === key
                ? "bg-white text-slate-900"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* 訂單列表 */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-white/50 text-lg">沒有訂單</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const status = statusOptions.find((s) => s.value === order.status);
            const displayName =
              order.user?.full_name || order.user?.email || "未知用戶";

            return (
              <div key={order.id} className="glass-card overflow-hidden">
                {/* 訂單摘要 */}
                <div
                  className="p-5 cursor-pointer hover:bg-white/[0.02] transition"
                  onClick={() =>
                    setExpandedId(expandedId === order.id ? null : order.id)
                  }
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-semibold">
                          {displayName}
                        </span>
                        <span className="text-white/30 text-xs font-mono">
                          #{order.id.slice(0, 8)}
                        </span>
                      </div>
                      <p className="text-white/40 text-xs mt-0.5">
                        {formatDateTime(order.created_at)} ·{" "}
                        {order.items.length} 項商品
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-amber-400 font-semibold text-sm">
                        {formatPrice(order.total_amount)}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-medium border ${
                          status?.color ?? ""
                        }`}
                      >
                        {status?.label ?? order.status}
                      </span>
                      <span className="text-white/30 text-sm">
                        {expandedId === order.id ? "▴" : "▾"}
                      </span>
                    </div>
                  </div>

                  {/* 展開詳情 */}
                  {expandedId === order.id && (
                    <div
                      className="mt-4 pt-4 border-t border-white/10 space-y-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* 商品明細 */}
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-white/70">
                              {item.product_name} × {item.quantity}
                            </span>
                            <span className="text-white/50">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.notes && (
                        <p className="text-xs text-white/40 border-t border-white/5 pt-2">
                          📝 {order.notes}
                        </p>
                      )}

                      {/* 狀態操作 */}
                      <div className="flex gap-2 pt-2">
                        {statusOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => updateStatus(order.id, opt.value)}
                            disabled={order.status === opt.value}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                              order.status === opt.value
                                ? `${opt.color} cursor-default`
                                : "bg-white/5 text-white/60 hover:bg-white/10 border-white/10"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
