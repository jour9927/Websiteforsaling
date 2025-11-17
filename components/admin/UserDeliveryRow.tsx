"use client";

import { useState } from "react";

export type UserDelivery = {
  id: string;
  item_name: string;
  quantity: number;
  status: string;
  delivery_date: string | null;
  notes: string | null;
  event: {
    id: string | null;
    title: string | null;
  } | null;
  user: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
  created_at: string;
  updated_at: string;
};

export type EventChoice = {
  id: string;
  title: string | null;
};

type UserDeliveryRowProps = {
  delivery: UserDelivery;
  events: EventChoice[];
};

const statusLabels = {
  pending: "待交付",
  delivered: "已交付",
  in_transit: "運送中",
  cancelled: "已取消"
};

export default function UserDeliveryRow({ delivery, events }: UserDeliveryRowProps) {
  const [itemName, setItemName] = useState(delivery.item_name);
  const [quantity, setQuantity] = useState(delivery.quantity);
  const [status, setStatus] = useState(delivery.status);
  const [deliveryDate, setDeliveryDate] = useState(
    delivery.delivery_date ? new Date(delivery.delivery_date).toISOString().split('T')[0] : ""
  );
  const [notes, setNotes] = useState(delivery.notes ?? "");
  const [eventId, setEventId] = useState(delivery.event?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setFeedback(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/deliveries/${delivery.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_name: itemName,
          quantity: Number(quantity),
          status,
          delivery_date: deliveryDate || null,
          notes: notes.trim() || null,
          event_id: eventId || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "更新失敗");
      }

      setFeedback("✓ 已成功更新");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("確定要刪除此交付記錄嗎？")) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/deliveries/${delivery.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "刪除失敗");
      }

      setFeedback("✓ 已成功刪除");
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="glass-card rounded-2xl border border-white/10 p-5">
      {/* User Info */}
      <div className="mb-4 border-b border-white/10 pb-3">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">用戶</p>
        <p className="text-lg font-semibold text-white">{delivery.user.full_name || "未命名用戶"}</p>
        <p className="text-xs text-white/50">{delivery.user.email}</p>
      </div>

      {/* Edit Form */}
      <div className="space-y-4">
        {/* Event Selection */}
        <div>
          <label className="block text-xs uppercase tracking-[0.3em] text-white/50">
            活動
          </label>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white transition focus:border-white/40 focus:outline-none"
          >
            <option value="">選擇活動</option>
            {events.map((event) => (
              <option key={event.id} value={event.id} className="bg-midnight-900">
                {event.title}
              </option>
            ))}
          </select>
        </div>

        {/* Item Name */}
        <div>
          <label className="block text-xs uppercase tracking-[0.3em] text-white/50">
            物品名稱
          </label>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white transition focus:border-white/40 focus:outline-none"
          />
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-xs uppercase tracking-[0.3em] text-white/50">
            數量
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white transition focus:border-white/40 focus:outline-none"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs uppercase tracking-[0.3em] text-white/50">
            狀態
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white transition focus:border-white/40 focus:outline-none"
          >
            <option value="pending" className="bg-midnight-900">待交付</option>
            <option value="in_transit" className="bg-midnight-900">運送中</option>
            <option value="delivered" className="bg-midnight-900">已交付</option>
            <option value="cancelled" className="bg-midnight-900">已取消</option>
          </select>
        </div>

        {/* Delivery Date */}
        <div>
          <label className="block text-xs uppercase tracking-[0.3em] text-white/50">
            交付日期（選填）
          </label>
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white transition focus:border-white/40 focus:outline-none"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs uppercase tracking-[0.3em] text-white/50">
            備註（選填）
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="例如：物流單號、交付方式等"
            className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white transition focus:border-white/40 focus:outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/30 disabled:opacity-50"
          >
            {loading ? "處理中..." : "儲存變更"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            刪除記錄
          </button>
        </div>

        {/* Feedback Messages */}
        {feedback && (
          <p className="text-sm font-semibold text-green-300">{feedback}</p>
        )}
        {error && (
          <p className="text-sm font-semibold text-red-300">✗ {error}</p>
        )}
      </div>

      {/* Metadata */}
      <div className="mt-4 border-t border-white/10 pt-3 text-xs text-white/40">
        <p>建立時間：{new Date(delivery.created_at).toLocaleString("zh-TW")}</p>
        <p>更新時間：{new Date(delivery.updated_at).toLocaleString("zh-TW")}</p>
      </div>
    </article>
  );
}
