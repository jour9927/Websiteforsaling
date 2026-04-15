"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  BACKPACK_ITEM_OPTIONS,
  type BackpackItemType,
  getBackpackItemMeta,
  getBackpackItemName,
} from "@/lib/backpack";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
};

type BackpackItemRow = {
  id: string;
  user_id: string;
  granted_by: string | null;
  item_type: BackpackItemType;
  item_name: string;
  note: string | null;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
};

function toDatetimeLocalValue(date: Date) {
  const tzOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

function getDefaultExpiryInput(baseDate = new Date()) {
  const expiry = new Date(baseDate);
  expiry.setFullYear(expiry.getFullYear() + 50);
  return toDatetimeLocalValue(expiry);
}

export default function AdminBackpackPage() {
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [items, setItems] = useState<BackpackItemRow[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedType, setSelectedType] = useState<BackpackItemType>(
    "blindbox_discount_500",
  );
  const [note, setNote] = useState("");
  const [customGrantedAt, setCustomGrantedAt] = useState("");
  const [expiresAt, setExpiresAt] = useState(() => getDefaultExpiryInput());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterUserId, setFilterUserId] = useState("all");

  const userMap = useMemo(() => {
    return new Map(users.map((u) => [u.id, u]));
  }, [users]);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [{ data: usersData, error: usersError }, { data: itemData, error: itemError }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id, full_name, email, role")
            .order("full_name", { ascending: true }),
          supabase
            .from("backpack_items")
            .select("id, user_id, granted_by, item_type, item_name, note, is_active, created_at, expires_at")
            .order("created_at", { ascending: false }),
        ]);

      if (usersError) throw usersError;
      if (itemError) throw itemError;

      setUsers((usersData || []) as ProfileRow[]);
      setItems((itemData || []) as BackpackItemRow[]);
    } catch (err) {
      console.error(err);
      setError("載入背包資料失敗，請稍後再試。");
    } finally {
      setLoading(false);
    }
  }

  async function handleIssueItem(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedUserId) {
      setError("請先選擇會員");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("請先登入管理員帳號");
      }

      const itemName = getBackpackItemName(selectedType);
      const parsedGrantedAt = customGrantedAt ? new Date(customGrantedAt) : null;
      const parsedExpiresAt = expiresAt ? new Date(expiresAt) : null;
      const resolvedGrantedAt = parsedGrantedAt || new Date();

      if (parsedGrantedAt && Number.isNaN(parsedGrantedAt.getTime())) {
        throw new Error("發放時間格式不正確");
      }

      if (parsedExpiresAt && Number.isNaN(parsedExpiresAt.getTime())) {
        throw new Error("有效期限格式不正確");
      }

      const defaultExpiresAt = new Date(resolvedGrantedAt);
      defaultExpiresAt.setFullYear(defaultExpiresAt.getFullYear() + 50);
      const resolvedExpiresAt = parsedExpiresAt || defaultExpiresAt;

      if (resolvedExpiresAt <= resolvedGrantedAt) {
        throw new Error("有效期限必須晚於發放時間");
      }

      const { error: insertError } = await supabase.from("backpack_items").insert({
        user_id: selectedUserId,
        item_type: selectedType,
        item_name: itemName,
        note: note.trim() || null,
        granted_by: user.id,
        created_at: resolvedGrantedAt.toISOString(),
        expires_at: resolvedExpiresAt.toISOString(),
      });

      if (insertError) throw insertError;

      setSuccess("道具已發放到會員背包");
      setNote("");
      setCustomGrantedAt("");
      setExpiresAt(getDefaultExpiryInput());
      await loadData();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "發放失敗");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleItemStatus(item: BackpackItemRow) {
    setError("");
    setSuccess("");

    const { error: updateError } = await supabase
      .from("backpack_items")
      .update({ is_active: !item.is_active })
      .eq("id", item.id);

    if (updateError) {
      setError("更新道具狀態失敗");
      return;
    }

    setItems((prev) =>
      prev.map((row) =>
        row.id === item.id ? { ...row, is_active: !row.is_active } : row,
      ),
    );
  }

  async function deleteItem(id: string) {
    if (!confirm("確定要刪除這個背包道具嗎？")) {
      return;
    }

    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase
      .from("backpack_items")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError("刪除失敗");
      return;
    }

    setItems((prev) => prev.filter((row) => row.id !== id));
  }

  const filteredItems =
    filterUserId === "all"
      ? items
      : items.filter((item) => item.user_id === filterUserId);

  return (
    <div className="space-y-6">
      <header className="glass-card p-6">
        <h1 className="text-2xl font-semibold text-white">會員背包管理</h1>
        <p className="mt-1 text-sm text-white/60">
          發放盲盒折抵券與競標報銷券到指定會員背包，並可留下獲得原因備註。
        </p>
      </header>

      <section className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white/90">發放道具</h2>

        <form onSubmit={handleIssueItem} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {success}
            </div>
          )}

          <label className="flex flex-col gap-2 text-sm text-white/70">
            會員 *
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-white/40 focus:outline-none"
            >
              <option value="" className="text-gray-900">
                選擇會員
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.id} className="text-gray-900">
                  {user.full_name || user.email || "未命名會員"}
                  {user.role === "admin" ? "（管理員）" : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-white/70">
            道具類型 *
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as BackpackItemType)}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-white/40 focus:outline-none"
            >
              {BACKPACK_ITEM_OPTIONS.map((option) => (
                <option key={option.type} value={option.type} className="text-gray-900">
                  {option.icon} {option.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2 text-xs text-white/45">
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${getBackpackItemMeta(selectedType).badgeClass}`}>
                {getBackpackItemMeta(selectedType).icon}
              </span>
              <span>
                {
                  BACKPACK_ITEM_OPTIONS.find((option) => option.type === selectedType)
                    ?.description
                }
              </span>
            </div>
          </label>

          <label className="flex flex-col gap-2 text-sm text-white/70">
            備註（獲得原因）
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="例如：活動補償、線下活動獎勵、競標補助..."
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-white/70">
            發放時間（選填）
            <input
              type="datetime-local"
              value={customGrantedAt}
              onChange={(e) => setCustomGrantedAt(e.target.value)}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-white/40 focus:outline-none"
            />
            <span className="text-xs text-white/45">未填則使用系統當前時間。</span>
          </label>

          <label className="flex flex-col gap-2 text-sm text-white/70">
            有效期限（選填）
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-white/40 focus:outline-none"
            />
            <span className="text-xs text-white/45">
              預設為發放時間後 50 年，可手動調整；若留空也會自動套用 50 年。
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting || loading}
            className="rounded-xl bg-cyan-500/70 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "發放中..." : "發放到背包"}
          </button>
        </form>
      </section>

      <section className="glass-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white/90">背包道具清單</h2>
          <select
            value={filterUserId}
            onChange={(e) => setFilterUserId(e.target.value)}
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
          >
            <option value="all" className="text-gray-900">
              全部會員
            </option>
            {users.map((user) => (
              <option key={user.id} value={user.id} className="text-gray-900">
                {user.full_name || user.email || "未命名會員"}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-white/60">載入中...</p>
        ) : filteredItems.length === 0 ? (
          <p className="mt-4 text-sm text-white/60">目前沒有道具資料。</p>
        ) : (
          <div className="mt-4 space-y-3">
            {filteredItems.map((item) => {
              const owner = userMap.get(item.user_id);
              const issuer = item.granted_by ? userMap.get(item.granted_by) : null;
              const isExpired =
                Boolean(item.expires_at) && new Date(item.expires_at as string) <= new Date();
              const itemMeta = getBackpackItemMeta(item.item_type);
              return (
                <article
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold text-white/90">
                        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${itemMeta.badgeClass}`}>
                          {itemMeta.icon}
                        </span>
                        <span>{item.item_name}</span>
                      </p>
                      <p className="mt-1 text-xs text-white/55">
                        會員：{owner?.full_name || owner?.email || item.user_id}
                      </p>
                      <p className="mt-1 text-xs text-white/45">
                        發放者：{issuer?.full_name || issuer?.email || "管理員"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        item.is_active && !isExpired
                          ? "bg-emerald-500/20 text-emerald-200"
                          : isExpired
                            ? "bg-red-500/20 text-red-200"
                            : "bg-white/10 text-white/50"
                      }`}
                    >
                      {item.is_active && !isExpired
                        ? "可使用"
                        : isExpired
                          ? "已過期"
                          : "已停用"}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-white/45">
                    發放時間：{new Date(item.created_at).toLocaleString("zh-TW")}
                  </p>
                  <p className={`mt-1 text-xs ${isExpired ? "text-red-300" : "text-white/45"}`}>
                    有效期限：
                    {item.expires_at
                      ? new Date(item.expires_at).toLocaleString("zh-TW")
                      : "無期限"}
                  </p>
                  <p className="mt-2 text-sm text-white/80">
                    備註：{item.note?.trim() ? item.note : "無備註"}
                  </p>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => void toggleItemStatus(item)}
                      className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/10"
                    >
                      {item.is_active ? "停用" : "啟用"}
                    </button>
                    <button
                      onClick={() => void deleteItem(item.id)}
                      className="rounded-lg border border-red-400/40 px-3 py-1.5 text-xs text-red-200 transition hover:bg-red-500/10"
                    >
                      刪除
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
