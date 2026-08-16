"use client";

import { ChangeEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const BUCKET = "identity-verifications";
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type IdentityVerificationSummary = {
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
} | null;

type Props = {
  userId: string;
  initialLegalName: string;
  initialLegalNameKana: string;
  verification: IdentityVerificationSummary;
};

function validateFile(file: File | null, label: string): string | null {
  if (!file) return `請選擇身分證${label}照片`;
  if (!ALLOWED_TYPES.has(file.type)) return `${label}僅接受 JPG、PNG 或 WEBP`;
  if (file.size > MAX_BYTES) return `${label}檔案不可超過 8MB`;
  return null;
}

export function IdentityVerificationCard({
  userId,
  initialLegalName,
  initialLegalNameKana,
  verification,
}: Props) {
  const router = useRouter();
  const [legalName, setLegalName] = useState(initialLegalName);
  const [legalNameKana, setLegalNameKana] = useState(initialLegalNameKana);
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  const locked = verification?.status === "pending" || verification?.status === "approved";
  const statusLabel =
    verification?.status === "approved"
      ? "已通過"
      : verification?.status === "pending"
        ? "審核中"
        : verification?.status === "rejected"
          ? "需要補件"
          : "尚未申請";
  const statusClass =
    verification?.status === "approved"
      ? "bg-green-500/20 text-green-200"
      : verification?.status === "pending"
        ? "bg-amber-500/20 text-amber-200"
        : verification?.status === "rejected"
          ? "bg-red-500/20 text-red-200"
          : "bg-white/10 text-white/60";

  function chooseFile(side: "front" | "back", event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    setMessage("");
    if (side === "front") setFront(file);
    else setBack(file);
  }

  async function submit() {
    const trimmedName = legalName.trim();
    if (!trimmedName) return setMessage("請填寫身分證上的真實姓名");
    const frontError = validateFile(front, "正面");
    if (frontError) return setMessage(frontError);
    const backError = validateFile(back, "反面");
    if (backError) return setMessage(backError);
    if (!consent) return setMessage("請先同意證件資料的審核與保存說明");

    setWorking(true);
    setMessage("");
    const uploadedPaths: string[] = [];
    try {
      const frontPath = `${userId}/front`;
      const backPath = `${userId}/back`;

      for (const [path, file] of [[frontPath, front!], [backPath, back!]] as const) {
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
          contentType: file.type,
          cacheControl: "0",
          upsert: true,
        });
        if (error) throw new Error(`證件上傳失敗：${error.message}`);
        uploadedPaths.push(path);
      }

      const response = await fetch("/api/profile/identity-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legal_name: trimmedName,
          legal_name_kana: legalNameKana.trim() || null,
          id_front_path: frontPath,
          id_back_path: backPath,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "提交失敗");

      setMessage(result.message || "資料已送出，請等待人工審核。");
      setFront(null);
      setBack(null);
      router.refresh();
    } catch (error) {
      if (uploadedPaths.length > 0) await supabase.storage.from(BUCKET).remove(uploadedPaths);
      setMessage(error instanceof Error ? error.message : "提交失敗，請稍後再試");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-amber-300">🪪 交易實名認證</h2>
        <span className={`rounded-full px-2.5 py-1 text-xs ${statusClass}`}>{statusLabel}</span>
      </div>
      <p className="mt-2 text-xs leading-6 text-amber-100/60">
        要在民間交易區刊登、出價或直購，必須上傳身分證正反面並通過管理員人工審核。未認證仍可瀏覽商品。
      </p>

      {verification?.status === "rejected" && (
        <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
          <p className="font-medium">審核未通過</p>
          <p className="mt-1 text-red-100/75">{verification.rejection_reason || "請重新確認資料後補件。"}</p>
        </div>
      )}

      {verification?.status === "approved" && (
        <div className="mt-4 rounded-xl border border-green-400/30 bg-green-500/10 p-4 text-sm text-green-100">
          認證完成，你現在可以使用民間交易區的全部交易功能。
          <Link href="/community-market" className="ml-2 font-semibold text-green-200 underline">前往交易區</Link>
        </div>
      )}

      {verification?.status === "pending" && (
        <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          已於 {new Date(verification.submitted_at).toLocaleString("zh-TW")} 送出，目前等待管理員審核。審核結果會透過站內通知告知。
        </div>
      )}

      {!locked && (
        <div className="mt-5 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-slate-200/80">身分證姓名 <span className="text-rose-400">*</span></span>
              <input
                value={legalName}
                onChange={(event) => setLegalName(event.target.value)}
                maxLength={80}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-amber-400/60 focus:outline-none"
                placeholder="請依證件填寫"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-slate-200/80">日文讀音（選填）</span>
              <input
                value={legalNameKana}
                onChange={(event) => setLegalNameKana(event.target.value)}
                maxLength={80}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-amber-400/60 focus:outline-none"
                placeholder="フリガナ"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {(["front", "back"] as const).map((side) => {
              const file = side === "front" ? front : back;
              return (
                <label key={side} className="rounded-xl border border-dashed border-white/20 bg-black/10 p-4 text-sm">
                  <span className="font-medium text-white/90">身分證{side === "front" ? "正面" : "反面"} <span className="text-rose-400">*</span></span>
                  <span className="mt-1 block text-xs text-white/45">JPG、PNG、WEBP，單檔最多 8MB</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => chooseFile(side, event)}
                    className="mt-3 block w-full text-xs text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-white/15 file:px-3 file:py-2 file:text-white"
                  />
                  {file && <span className="mt-2 block truncate text-xs text-green-300">已選擇：{file.name}</span>}
                </label>
              );
            })}
          </div>

          <label className="flex items-start gap-3 rounded-xl bg-black/10 p-4 text-xs leading-5 text-white/60">
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1" />
            <span>
              我同意 Event Glass 僅將證件用於交易實名人工審核。檔案存放於私有空間，只限本人與管理員存取，審核完成 30 天後自動刪除；審核結果會保留以維持交易資格。
            </span>
          </label>

          {message && <div className="rounded-xl bg-white/10 px-4 py-3 text-sm text-white/80" role="status">{message}</div>}
          <button
            type="button"
            onClick={submit}
            disabled={working}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {working ? "加密上傳並送出中…" : verification?.status === "rejected" ? "重新上傳補件" : "送出人工審核"}
          </button>
        </div>
      )}
    </div>
  );
}
