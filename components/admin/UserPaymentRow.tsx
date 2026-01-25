"use client";

import { useState } from "react";

const STATUSES = [
  { value: "pending", label: "待付款" },
  { value: "paid", label: "已付款" },
  { value: "overdue", label: "逾期" },
  { value: "cancelled", label: "已取消" }
] as const;

export type UserPayment = {
  id: string;
  amount: string;
  status: (typeof STATUSES)[number]["value"];
  payment_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  event:
    | {
        id: string | null;
        title: string | null;
      }
    | null;
  user: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
};

export type EventChoice = {
  id: string;
  title: string | null;
};

type UserPaymentRowProps = {
  payment: UserPayment;
  events: EventChoice[];
};

export default function UserPaymentRow({ payment, events }: UserPaymentRowProps) {
  const [amount, setAmount] = useState(payment.amount);
  const [status, setStatus] = useState<UserPayment["status"]>(payment.status);
  const [paymentDate, setPaymentDate] = useState(
    payment.payment_date ? new Date(payment.payment_date).toISOString().split('T')[0] : ""
  );
  const [eventId, setEventId] = useState(payment.event?.id ?? "");
  const [notes, setNotes] = useState(payment.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setFeedback(null);
    setError(null);

    try {
      const payload: Record<string, string | null> = {
        status,
        event_id: eventId,
        payment_date: paymentDate || null,
        notes
      };

      if (amount.trim().length > 0) {
        payload.amount = amount.trim();
      }

      const response = await fetch(`/api/admin/payments/${payment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.error || "無法更新付款紀錄");
      }

      setFeedback("更新成功");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("確定要刪除這筆付款紀錄嗎？此操作無法復原。")) {
      return;
    }

    setLoading(true);
    setFeedback(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/payments/${payment.id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result?.error || "無法刪除付款紀錄");
      }

      setFeedback("已刪除");
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗");
    } finally {
      setLoading(false);
    }
  };

  const amountDisplay = Number(amount) >= 0 ? Number(amount).toFixed(2) : amount;

  return (
    <div className="glass-card rounded-2xl border border-white/10 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase text-white/60">會員</p>
          <p className="text-sm font-semibold text-white/90">
            {payment.user.full_name || payment.user.email || "未命名會員"}
          </p>
          <p className="text-xs text-white/50">{payment.user.email}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-white/60">最近更新</p>
          <p className="text-xs text-white/50">
            {new Date(payment.updated_at).toLocaleString("zh-TW")}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs text-white/60">
          金額 (TWD)
          <input
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
          />
          <span className="text-[11px] text-white/40">格式: {amountDisplay}</span>
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/60">
          狀態
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as UserPayment["status"])}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
          >
            {STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/60">
          付款日期
          <input
            type="date"
            value={paymentDate}
            onChange={(event) => setPaymentDate(event.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/60">
          活動
          <select
            value={eventId}
            onChange={(event) => setEventId(event.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
          >
            <option value="">尚未指定</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.title ?? "未知活動"}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-3 flex flex-col gap-1 text-xs text-white/60">
        備註
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={2}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
        />
      </label>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="rounded-2xl bg-sky-500/80 px-4 py-2 text-xs font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "更新中..." : "儲存變更"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="rounded-2xl bg-rose-500/80 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "刪除中..." : "刪除"}
        </button>
        {feedback && <span className="text-xs text-emerald-300">{feedback}</span>}
        {error && <span className="text-xs text-rose-300">{error}</span>}
      </div>
    </div>
  );
}
