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

type AddPaymentFormProps = {
  events: EventChoice[];
  users: UserChoice[];
};

export default function AddPaymentForm({ events, users }: AddPaymentFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [eventId, setEventId] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("pending");
  const [paymentDate, setPaymentDate] = useState("");
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
      const response = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          event_id: eventId,
          amount: Number(amount) || 0,
          status,
          payment_date: paymentDate || null,
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
    setAmount("");
    setStatus("pending");
    setPaymentDate("");
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
        ➕ 新增付款記錄
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl border border-sky-500/30 p-6">
      <h3 className="text-lg font-semibold text-white">新增付款記錄</h3>
      
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

        {/* Amount */}
        <div>
          <label className="block text-xs uppercase tracking-[0.3em] text-white/50">
            金額 (NT$)
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
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
            <option value="pending" className="bg-midnight-900">待付款</option>
            <option value="paid" className="bg-midnight-900">已付款</option>
            <option value="overdue" className="bg-midnight-900">逾期</option>
            <option value="cancelled" className="bg-midnight-900">已取消</option>
          </select>
        </div>

        {/* Payment Date */}
        <div>
          <label className="block text-xs uppercase tracking-[0.3em] text-white/50">
            付款日期（選填）
          </label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
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
            placeholder="例如：轉帳後五碼12345"
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
