"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Route } from "next";
import { createBrowserClient } from "@supabase/ssr";

/* eslint-disable @typescript-eslint/no-explicit-any */

type TabKey = "pending" | "active" | "in_progress" | "completed" | "cancelled";

const tabs: { key: TabKey; label: string; statuses: string[] }[] = [
  { key: "pending", label: "待審核", statuses: ["pending_review"] },
  { key: "active", label: "開放中 / 排隊", statuses: ["active", "queued", "approved"] },
  { key: "in_progress", label: "進行中", statuses: ["accepted", "proof_submitted", "proof_approved"] },
  { key: "completed", label: "已完成", statuses: ["completed"] },
  { key: "cancelled", label: "已取消", statuses: ["cancelled"] },
];

export default function AdminCommissionsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function fetchCommissions() {
    setLoading(true);
    const currentTab = tabs.find((t) => t.key === activeTab)!;

    const { data } = await supabase
      .from("commissions")
      .select(
        `*,
         distributions(pokemon_name, pokemon_sprite_url),
         poster:profiles!commissions_poster_id_fkey(full_name),
         poster_virtual:virtual_profiles!commissions_poster_virtual_id_fkey(display_name),
         executor:profiles!commissions_executor_id_fkey(full_name),
         executor_virtual:virtual_profiles!commissions_executor_virtual_id_fkey(display_name)`
      )
      .in("status", currentTab.statuses)
      .order("created_at", { ascending: false });

    setCommissions(data || []);

    // 取得今日啟用數
    const today = new Date().toISOString().split("T")[0];
    const { count } = await supabase
      .from("commissions")
      .select("id", { count: "exact", head: true })
      .eq("activated_date", today)
      .neq("status", "cancelled");

    setTodayCount(count || 0);
    setLoading(false);
  }

  useEffect(() => {
    fetchCommissions();
  }, [activeTab]);

  async function handleReview(id: string, action: "approve" | "reject") {
    setActionLoading(id);
    const res = await fetch(`/api/admin/commissions/${id}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      fetchCommissions();
    } else {
      alert(data.error);
    }
    setActionLoading(null);
  }

  async function handleProofReview(id: string, action: "approve" | "reject") {
    setActionLoading(id);
    const res = await fetch(`/api/admin/commissions/${id}/proof-review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      fetchCommissions();
    } else {
      alert(data.error);
    }
    setActionLoading(null);
  }

  function getPosterName(c: any) {
    return c.poster_type === "virtual" ? c.poster_virtual?.display_name : c.poster?.full_name;
  }

  function getExecutorName(c: any) {
    if (!c.executor_id && !c.executor_virtual_id) return null;
    return c.executor_type === "virtual" ? c.executor_virtual?.display_name : c.executor?.full_name;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white/90">📋 委託管理</h1>
          <p className="mt-1 text-sm text-white/50">審核委託、管理排隊、檢視合法性證明</p>
        </div>
        <div className="rounded-xl bg-white/5 px-4 py-2 text-center">
          <p className="text-xs text-white/40">今日已啟用</p>
          <p className={`text-lg font-bold ${todayCount >= 5 ? "text-red-400" : "text-green-400"}`}>
            {todayCount}/5
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm transition ${
              activeTab === tab.key
                ? "bg-indigo-600 text-white"
                : "bg-white/5 text-white/50 hover:bg-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="py-20 text-center text-white/40">載入中...</div>
      ) : commissions.length === 0 ? (
        <div className="py-20 text-center text-white/40">此分類目前沒有委託</div>
      ) : (
        <div className="flex flex-col gap-3">
          {commissions.map((c) => (
            <div key={c.id} className="glass-card flex items-center gap-4 p-4">
              {/* 寶可夢圖 */}
              {c.distributions?.pokemon_sprite_url ? (
                <img src={c.distributions.pokemon_sprite_url} alt="" className="h-10 w-10 object-contain" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">🎴</div>
              )}

              {/* 基本資訊 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/commissions/${c.id}` as Route}
                    className="font-semibold text-white/90 hover:text-indigo-300"
                  >
                    {c.pokemon_name}
                  </Link>
                  <span className="text-xs text-white/40">{c.poster_type === "virtual" ? "🤖" : "👤"} {getPosterName(c)}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/40">
                  <span>💰 {c.price_type === "twd" ? `NT$${c.base_price.toLocaleString()}` : `${c.base_price.toLocaleString()} pts`}</span>
                  <span>可抽成 {c.price_type === "twd" ? "NT$" : ""}{c.platform_fee.toLocaleString()}{c.price_type !== "twd" ? " pts" : ""}</span>
                  {getExecutorName(c) && <span>執行者：{getExecutorName(c)}</span>}
                  {c.queue_position && <span>排隊 #{c.queue_position}</span>}
                  <span>{new Date(c.created_at).toLocaleDateString("zh-TW")}</span>
                </div>
              </div>

              {/* 操作按鈕 */}
              <div className="flex gap-2">
                {c.status === "pending_review" && (
                  <>
                    <button
                      onClick={() => handleReview(c.id, "approve")}
                      disabled={actionLoading === c.id}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-500 disabled:opacity-50"
                    >
                      ✓ 通過
                    </button>
                    <button
                      onClick={() => handleReview(c.id, "reject")}
                      disabled={actionLoading === c.id}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-500 disabled:opacity-50"
                    >
                      ✕ 拒絕
                    </button>
                  </>
                )}
                {c.status === "proof_submitted" && (
                  <>
                    <button
                      onClick={() => handleProofReview(c.id, "approve")}
                      disabled={actionLoading === c.id}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-500 disabled:opacity-50"
                    >
                      ✓ 證明通過
                    </button>
                    <button
                      onClick={() => handleProofReview(c.id, "reject")}
                      disabled={actionLoading === c.id}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-500 disabled:opacity-50"
                    >
                      ✕ 退回
                    </button>
                  </>
                )}
                {c.proof_images?.length > 0 && (
                  <Link
                    href={`/commissions/${c.id}` as Route}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/60 hover:bg-white/20"
                  >
                    📄 查看
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
