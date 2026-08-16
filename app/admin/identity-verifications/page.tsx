"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type VerificationStatus = "pending" | "approved" | "rejected";
type ProfileInfo = { email: string; full_name: string | null; username: string | null };
type Verification = {
  id: string;
  user_id: string;
  legal_name: string;
  legal_name_kana: string | null;
  status: VerificationStatus;
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  documents_purged_at: string | null;
  profiles: ProfileInfo | ProfileInfo[] | null;
  front_url: string | null;
  back_url: string | null;
};

function profileOf(value: Verification["profiles"]): ProfileInfo | null {
  return Array.isArray(value) ? value[0] || null : value;
}

export default function IdentityVerificationsAdminPage() {
  const [rows, setRows] = useState<Verification[]>([]);
  const [status, setStatus] = useState<"all" | VerificationStatus>("pending");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/identity-verifications", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "載入失敗");
      setRows(result.verifications || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () => rows.filter((row) => status === "all" || row.status === status),
    [rows, status],
  );
  const counts = {
    pending: rows.filter((row) => row.status === "pending").length,
    approved: rows.filter((row) => row.status === "approved").length,
    rejected: rows.filter((row) => row.status === "rejected").length,
  };

  async function review(row: Verification, nextStatus: "approved" | "rejected") {
    let reason = "";
    if (nextStatus === "approved") {
      if (!window.confirm(`確認「${row.legal_name}」的姓名及身分證正反面一致，並核准交易資格？`)) return;
    } else {
      reason = window.prompt("請填寫駁回／補件原因，會員會在站內通知看到：")?.trim() || "";
      if (!reason) return;
    }

    setWorking(row.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/identity-verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, status: nextStatus, rejection_reason: reason }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "審核失敗");
      setMessage(nextStatus === "approved" ? "已核准交易實名認證。" : "已駁回並通知會員補件。");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "審核失敗");
    } finally {
      setWorking(null);
    }
  }

  return (
    <section className="space-y-7">
      <header>
        <p className="text-xs uppercase tracking-[0.28em] text-amber-300/70">Sensitive Review</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">交易實名審核</h1>
        <p className="mt-2 text-sm leading-6 text-white/55">
          請只在確認姓名及身分證正反面一致後核准。證件連結 5 分鐘失效，審核完成 30 天後系統會自動刪除檔案。
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-4"><p className="text-xs text-amber-200/60">待審核</p><p className="mt-1 text-2xl font-bold text-amber-200">{counts.pending}</p></div>
        <div className="rounded-xl border border-green-400/25 bg-green-500/10 p-4"><p className="text-xs text-green-200/60">已通過</p><p className="mt-1 text-2xl font-bold text-green-200">{counts.approved}</p></div>
        <div className="rounded-xl border border-red-400/25 bg-red-500/10 p-4"><p className="text-xs text-red-200/60">需補件</p><p className="mt-1 text-2xl font-bold text-red-200">{counts.rejected}</p></div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setStatus(item)}
            className={`rounded-full px-4 py-2 text-sm transition ${status === item ? "bg-white/20 text-white" : "bg-white/5 text-white/55 hover:bg-white/10"}`}
          >
            {item === "pending" ? "待審核" : item === "approved" ? "已通過" : item === "rejected" ? "需補件" : "全部"}
          </button>
        ))}
      </div>

      {message && <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/75" role="status">{message}</div>}

      {loading ? (
        <div className="glass-card p-10 text-center text-white/55">正在載入加密證件資料…</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-10 text-center text-white/55">目前沒有符合狀態的申請</div>
      ) : (
        <div className="space-y-5">
          {filtered.map((row) => {
            const profile = profileOf(row.profiles);
            return (
              <article key={row.id} className="glass-card overflow-hidden">
                <div className="flex flex-col gap-4 border-b border-white/10 p-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-white">{row.legal_name}</h2>
                      <span className={`rounded-full px-2.5 py-1 text-xs ${row.status === "approved" ? "bg-green-500/20 text-green-200" : row.status === "rejected" ? "bg-red-500/20 text-red-200" : "bg-amber-500/20 text-amber-200"}`}>
                        {row.status === "approved" ? "已通過" : row.status === "rejected" ? "需補件" : "待審核"}
                      </span>
                    </div>
                    {row.legal_name_kana && <p className="mt-1 text-sm text-white/50">{row.legal_name_kana}</p>}
                    <p className="mt-2 text-sm text-white/60">{profile?.email || "無 Email"} · 公開名稱 {profile?.username || profile?.full_name || "未設定"}</p>
                    <p className="mt-1 text-xs text-white/35">送出：{new Date(row.submitted_at).toLocaleString("zh-TW")}</p>
                    {row.rejection_reason && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200">前次原因：{row.rejection_reason}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={working === row.id} onClick={() => void review(row, "approved")} className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">核准</button>
                    <button type="button" disabled={working === row.id} onClick={() => void review(row, "rejected")} className="rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm text-red-200 disabled:opacity-50">駁回補件</button>
                  </div>
                </div>

                {row.documents_purged_at ? (
                  <div className="p-6 text-center text-sm text-white/45">證件已依保存政策自動刪除，只保留審核結果。</div>
                ) : (
                  <div className="grid gap-4 p-5 md:grid-cols-2">
                    {[["正面", row.front_url], ["反面", row.back_url]].map(([label, url]) => (
                      <div key={label} className="rounded-xl border border-white/10 bg-black/20 p-3">
                        <p className="mb-2 text-xs font-medium text-white/55">身分證{label}</p>
                        {url ? (
                          <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg bg-black/30">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`身分證${label}`} className="max-h-[360px] w-full object-contain" />
                          </a>
                        ) : <div className="p-8 text-center text-sm text-red-200/70">暫時無法取得檔案</div>}
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
