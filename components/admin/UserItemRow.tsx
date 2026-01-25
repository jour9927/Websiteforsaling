"use client";

import { useState } from "react";

export type UserItem = {
  id: string;
  name: string;
  quantity: number;
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
  updated_at: string;
};

export type EventChoice = {
  id: string;
  title: string | null;
};

type UserItemRowProps = {
  item: UserItem;
  events: EventChoice[];
};

export default function UserItemRow({ item, events }: UserItemRowProps) {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity);
  const [notes, setNotes] = useState(item.notes ?? "");
  const [eventId, setEventId] = useState(item.event?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setFeedback(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          quantity,
          notes,
          event_id: eventId
        })
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || "無法更新物品");
      }

      setFeedback("更新成功");
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl border border-white/10 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase text-white/60">會員</p>
          <p className="text-sm font-semibold text-white/90">
            {item.user.full_name || item.user.email || "未知會員"}
          </p>
          <p className="text-xs text-white/50">{item.user.email}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-white/60">最近更新</p>
          <p className="text-xs text-white/50">{new Date(item.updated_at).toLocaleString("zh-TW")}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs text-white/60">
          名稱
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/60">
          數量
          <input
            type="number"
            min={0}
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
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
            <option value="">未指定</option>
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
        {feedback && <span className="text-xs text-emerald-300">{feedback}</span>}
        {error && <span className="text-xs text-rose-300">{error}</span>}
      </div>
    </div>
  );
}
