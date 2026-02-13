"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Route } from "next";
import { supabase } from "@/lib/supabase";

interface Announcement {
  id: string;
  title: string;
  content: string;
  status: string;
  show_popup: boolean;
  show_in_list: boolean;
  published_at: string | null;
  created_at: string;
}

type Reader = {
  user_id: string;
  full_name: string | null;
  email: string;
  read_at: string;
};

type ReadInfo = {
  count: number;
  readers: Reader[];
};

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [readData, setReadData] = useState<Record<string, ReadInfo>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: "", content: "", published_at: "" });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = () => {
    loadAnnouncements();
    loadReadData();
  };

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  };

  const loadReadData = async () => {
    try {
      const res = await fetch("/api/admin/announcements/reads");
      if (res.ok) setReadData(await res.json());
    } catch {
      // 靜默
    }
  };

  // 建立公告
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("未登入");

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "admin") throw new Error("只有管理員可以建立公告");

      // 判斷：有排程且為未來時間 → scheduled，否則 → published
      const isScheduled = formData.published_at && new Date(formData.published_at) > new Date();

      const { error } = await supabase.from("announcements").insert([{
        title: formData.title,
        content: formData.content,
        status: isScheduled ? "scheduled" : "published",
        published_at: formData.published_at ? new Date(formData.published_at).toISOString() : new Date().toISOString(),
        show_popup: true,
        show_in_list: true,
        created_by: user.id,
      }]).select();

      if (error) throw new Error(`建立失敗: ${error.message}`);

      setSuccess(isScheduled ? "公告已排程！" : "公告已發布！");
      setFormData({ title: "", content: "", published_at: "" });
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "建立失敗");
    } finally {
      setSaving(false);
    }
  };

  // 切換開關
  const handleToggle = async (id: string, field: "show_popup" | "show_in_list", currentValue: boolean) => {
    try {
      const res = await fetch("/api/admin/announcements/toggle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, field, value: !currentValue }),
      });
      if (!res.ok) throw new Error("切換失敗");
      // 本地更新
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, [field]: !currentValue } : a))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "切換失敗");
    }
  };

  // 重置已讀
  const handleResetReads = async (announcementId: string, userId?: string) => {
    const msg = userId
      ? "確定要讓此用戶重新看到彈窗？"
      : "確定要讓所有人重新看到此公告的彈窗？";
    if (!confirm(msg)) return;

    try {
      const res = await fetch("/api/admin/announcements/reads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcement_id: announcementId, user_id: userId }),
      });
      if (!res.ok) throw new Error("重置失敗");
      setSuccess(userId ? "已重置該用戶的已讀狀態" : "已重置所有人的已讀狀態");
      loadReadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "重置失敗");
    }
  };

  // 刪除公告
  const handleDelete = async (id: string) => {
    if (!confirm("確定要刪除這則公告嗎？")) return;
    try {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
      setSuccess("公告已刪除");
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗");
    }
  };

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-white/90">📢 公告管理</h1>
        <p className="text-sm text-white/60">建立公告、控制彈窗與列表顯示、查看已讀狀態。</p>
      </header>

      {error && (
        <div className="rounded-lg bg-red-500/20 border border-red-500/50 px-4 py-3 text-sm text-red-100">
          {error}
          <button onClick={() => setError("")} className="float-right text-red-300 hover:text-white">✕</button>
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-500/20 border border-green-500/50 px-4 py-3 text-sm text-green-100">
          {success}
          <button onClick={() => setSuccess("")} className="float-right text-green-300 hover:text-white">✕</button>
        </div>
      )}

      {/* 建立公告 */}
      <article className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white/90">建立新公告</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="flex flex-col gap-2 text-xs text-white/70">
            公告標題 *
            <input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
              placeholder="輸入公告標題"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/70">
            公告內容 *
            <textarea
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
              placeholder="輸入公告內容"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/70">
            發布排程（留空 = 立即發布）
            <input
              type="datetime-local"
              value={formData.published_at}
              onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:from-amber-600 hover:to-orange-600 disabled:opacity-50"
          >
            {saving ? "建立中..." : formData.published_at && new Date(formData.published_at) > new Date() ? "⏰ 排程發布" : "🚀 立即發布"}
          </button>
        </form>
      </article>

      {/* 公告清單 */}
      <article className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white/90">公告清單</h2>

        {loading ? (
          <div className="mt-4 text-center text-white/60">載入中...</div>
        ) : announcements.length === 0 ? (
          <div className="mt-4 text-center text-white/60">尚無公告</div>
        ) : (
          <div className="mt-4 space-y-4">
            {announcements.map((item) => {
              const info = readData[item.id];
              const readCount = info?.count || 0;
              const isExpanded = expandedId === item.id;

              return (
                <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                  {/* 主行 */}
                  <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
                    {/* 標題 + 時間 */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white/90 truncate">{item.title}</p>
                      <p className="text-xs text-white/50 mt-0.5">
                        {item.published_at ? new Date(item.published_at).toLocaleString("zh-TW") : "未發布"}
                      </p>
                    </div>

                    {/* 開關區 */}
                    <div className="flex items-center gap-3">
                      {/* 📋 列表開關 */}
                      <button
                        onClick={() => handleToggle(item.id, "show_in_list", item.show_in_list)}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${item.show_in_list
                          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                          : "bg-white/10 text-white/40 hover:bg-white/15"
                          }`}
                        title={item.show_in_list ? "列表：顯示中" : "列表：已隱藏"}
                      >
                        📋 {item.show_in_list ? "列表 開" : "列表 關"}
                      </button>

                      {/* 🔔 彈窗開關 */}
                      <button
                        onClick={() => handleToggle(item.id, "show_popup", item.show_popup)}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${item.show_popup
                          ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                          : "bg-white/10 text-white/40 hover:bg-white/15"
                          }`}
                        title={item.show_popup ? "彈窗：顯示中" : "彈窗：已關閉"}
                      >
                        🔔 {item.show_popup ? "彈窗 開" : "彈窗 關"}
                      </button>

                      {/* 已讀人數（可展開） */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="flex items-center gap-1.5 rounded-full bg-blue-500/15 px-3 py-1.5 text-xs font-medium text-blue-300 transition hover:bg-blue-500/25"
                      >
                        👀 {readCount} 人已讀
                      </button>
                    </div>

                    {/* 操作 */}
                    <div className="flex items-center gap-2 text-xs">
                      <Link href={`/admin/announcements/${item.id}` as Route} className="text-white/70 hover:text-white/90">
                        編輯
                      </Link>
                      <span className="text-white/30">|</span>
                      <button onClick={() => handleDelete(item.id)} className="text-red-300 hover:text-red-200">
                        刪除
                      </button>
                    </div>
                  </div>

                  {/* 展開：已讀用戶列表 */}
                  {isExpanded && (
                    <div className="border-t border-white/10 bg-white/[0.02] p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-medium text-white/70">已讀用戶</p>
                        {readCount > 0 && (
                          <button
                            onClick={() => handleResetReads(item.id)}
                            className="rounded-lg bg-orange-500/20 px-3 py-1 text-xs text-orange-300 transition hover:bg-orange-500/30"
                          >
                            🔄 重新推送給所有人
                          </button>
                        )}
                      </div>
                      {readCount === 0 ? (
                        <p className="text-xs text-white/40">尚無人已讀</p>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {info.readers.map((r) => (
                            <div key={r.user_id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                              <div>
                                <p className="text-sm text-white/80">{r.full_name || "(未設定)"}</p>
                                <p className="text-xs text-white/40">{r.email}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-white/40">
                                  {new Date(r.read_at).toLocaleString("zh-TW")}
                                </span>
                                <button
                                  onClick={() => handleResetReads(item.id, r.user_id)}
                                  className="rounded-md bg-white/10 px-2 py-1 text-xs text-white/60 transition hover:bg-white/20 hover:text-white"
                                  title="重新推送給此用戶"
                                >
                                  🔄
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </article>
    </section>
  );
}
