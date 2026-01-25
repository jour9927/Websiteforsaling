"use client";

import { useState } from "react";

type EventChoice = {
  id: string;
  title: string | null;
};

type UserChoice = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type AddDeliveryFormProps = {
  events: EventChoice[];
  users: UserChoice[];
};

export default function AddDeliveryForm({ events, users }: AddDeliveryFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [eventId, setEventId] = useState("");
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [status, setStatus] = useState("pending");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          event_id: eventId,
          item_name: itemName,
          quantity: Number(quantity) || 1,
          status,
          delivery_date: deliveryDate || null,
          notes: notes.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "新增失敗");
      }

      setFeedback("✓ 已成功新增");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setUserId("");
    setEventId("");
    setItemName("");
    setQuantity("1");
    setStatus("pending");
    setDeliveryDate("");
    setNotes("");
    setError(null);
    setFeedback(null);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-xl bg-sky-500/80 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-500"
      >
        ➕ 新增交付記錄
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl border border-sky-500/30 p-6">
      <h3 className="text-lg font-semibold text-white">新增交付記錄</h3>
      
      <div className="mt-4 space-y-4">
        {/* User Selection */}
        <div>
          <label className="block text-xs uppercase tracking-[0.3em] text-white/50">
            用戶 *
          </label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white transition focus:border-white/40 focus:outline-none"
          >
            <option value="">選擇用戶</option>
            {users.map((user) => (
              <option key={user.id} value={user.id} className="bg-midnight-900">
                {user.full_name || user.email}
              </option>
            ))}
          </select>
        </div>

        {/* Event Selection */}
        <div>
          <label className="block text-xs uppercase tracking-[0.3em] text-white/50">
            活動 *
          </label>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            required
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
            物品名稱 *
          </label>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            required
            placeholder="例如：活動紀念品、證書"
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
            onChange={(e) => setQuantity(e.target.value)}
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
            type="submit"
            disabled={loading}
            className="rounded-xl bg-sky-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-50"
          >
            {loading ? "處理中..." : "新增記錄"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            取消
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
    </form>
  );
}
