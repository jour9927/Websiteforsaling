"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { supabase } from "@/lib/supabase";
import {
  minimumBid,
  twd,
  taipeiDate,
  type CommunityListing,
  type MarketCashPayment,
  type MarketBid,
  type MarketPaymentDetails,
} from "@/lib/community-market";

const PAYMENT_BUCKET = "community-market-payments";
const MAX_PROOF_BYTES = 8 * 1024 * 1024;
const ALLOWED_PROOF_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type Props = {
  listing: CommunityListing;
  bids: MarketBid[];
  currentUserId: string | null;
  identityStatus: "pending" | "approved" | "rejected" | null;
  isAdmin: boolean;
  paymentDetails: MarketPaymentDetails | null;
  cashPayment: MarketCashPayment | null;
  proofUrl: string | null;
};

function timeRemaining(endTime: string): string {
  const difference = new Date(endTime).getTime() - Date.now();
  if (difference <= 0) return "已到結標時間";
  const minutes = Math.floor(difference / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const remainingMinutes = minutes % 60;
  if (days > 0) return `${days} 天 ${hours} 小時`;
  if (hours > 0) return `${hours} 小時 ${remainingMinutes} 分`;
  return `${Math.max(remainingMinutes, 1)} 分鐘`;
}

export function CommunityAuctionDetailClient({
  listing,
  bids,
  currentUserId,
  identityStatus,
  isAdmin,
  paymentDetails,
  cashPayment,
  proofUrl,
}: Props) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(() => timeRemaining(listing.end_time));
  const [bidAmount, setBidAmount] = useState(minimumBid(listing));
  const [working, setWorking] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [referenceNote, setReferenceNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const isExpired = new Date(listing.end_time).getTime() <= Date.now();
  const isOpen = listing.status === "active" && !isExpired;
  const isSeller = currentUserId === listing.seller_id;
  const isHighest = currentUserId !== null && currentUserId === listing.current_bidder_id;
  const isBuyer = currentUserId !== null && currentUserId === listing.winner_id;
  const canReviewPayment = isSeller || isAdmin;

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(timeRemaining(listing.end_time)), 30000);
    return () => window.clearInterval(timer);
  }, [listing.end_time]);

  async function runAction(
    action: "bid" | "buy" | "finalize" | "cancel" | "confirm-payment" | "reject-payment",
    payload?: Record<string, unknown>,
  ) {
    setWorking(action);
    setMessage(null);
    try {
      const response = await fetch(`/api/community-market/${listing.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "操作失敗");
      setMessage(
        action === "bid"
          ? "出價成功，你目前是最高出價者。"
          : action === "buy"
            ? "已建立待付款訂單，請依賣家說明完成匯款。"
            : action === "confirm-payment"
              ? "已確認收款，寶可夢已交付買家。"
              : action === "reject-payment"
                ? "付款證明已退回買家補件。"
            : action === "cancel"
              ? "拍賣已取消。"
              : "已結標，等待得標者付款。",
      );
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失敗");
    } finally {
      setWorking(null);
    }
  }

  function submitBid(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runAction("bid", { amount: bidAmount });
  }

  function chooseProof(event: ChangeEvent<HTMLInputElement>) {
    setProofFile(event.target.files?.[0] || null);
    setMessage(null);
  }

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUserId || !proofFile) return setMessage("請選擇付款證明圖片");
    if (!ALLOWED_PROOF_TYPES.has(proofFile.type)) return setMessage("付款證明僅接受 JPG、PNG 或 WEBP");
    if (proofFile.size > MAX_PROOF_BYTES) return setMessage("付款證明不可超過 8MB");

    setWorking("submit-payment");
    setMessage(null);
    const proofPath = `${currentUserId}/${listing.id}/proof`;
    try {
      const { error: uploadError } = await supabase.storage.from(PAYMENT_BUCKET).upload(proofPath, proofFile, {
        contentType: proofFile.type,
        cacheControl: "0",
        upsert: true,
      });
      if (uploadError) throw new Error(`付款證明上傳失敗：${uploadError.message}`);
      const response = await fetch(`/api/community-market/${listing.id}/submit-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proof_path: proofPath, reference_note: referenceNote.trim() || null }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "付款資料提交失敗");
      setMessage("付款資料已送出，等待賣家確認收款。");
      setProofFile(null);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "付款資料提交失敗");
    } finally {
      setWorking(null);
    }
  }

  const statusLabel =
    listing.status === "sold"
      ? "已成交"
      : listing.status === "pending_payment"
        ? cashPayment?.status === "submitted" ? "確認收款中" : "待付款"
      : listing.status === "cancelled"
        ? "已取消"
        : listing.status === "ended"
          ? "流標"
          : isExpired
            ? "待結標"
          : "競標中";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href={"/community-market" as Route} className="eg-link text-sm">← 返回民間交易區</Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.75fr)]">
        <div className="eg-card overflow-hidden">
          <div className="relative flex min-h-[340px] items-center justify-center" style={{ background: "var(--eg-bg-muted)" }}>
            {listing.pokemon.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={listing.pokemon.image_url} alt={listing.pokemon.pokemon_name} className="max-h-[500px] w-full object-contain p-10" />
            ) : (
              <span className="text-7xl" aria-hidden="true">◓</span>
            )}
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              <span className="eg-tag">第 {listing.pokemon.generation} 世代</span>
              {listing.pokemon.is_shiny && <span className="eg-tag eg-tag--accent">色違</span>}
            </div>
          </div>
          <div className="relative z-[1] p-6">
            <p className="eg-eyebrow">Listed Pokémon</p>
            <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="eg-h1">{listing.pokemon.pokemon_name}</h1>
                {listing.pokemon.pokemon_name_en && <p className="eg-meta mt-1">{listing.pokemon.pokemon_name_en}</p>}
              </div>
              <span className={`eg-tag ${isOpen ? "eg-tag--success" : ""}`}>
                {isOpen && <span className="eg-dot eg-dot--live" />}
                {statusLabel}
              </span>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 text-sm sm:grid-cols-4">
              <div><dt className="eg-meta">訓練家</dt><dd className="mt-1">{listing.pokemon.original_trainer || "未記錄"}</dd></div>
              <div><dt className="eg-meta">訓練家 ID</dt><dd className="eg-num mt-1">{listing.pokemon.trainer_id || "—"}</dd></div>
              <div><dt className="eg-meta">等級</dt><dd className="eg-num mt-1">{listing.pokemon.level || "—"}</dd></div>
              <div><dt className="eg-meta">地區</dt><dd className="mt-1">{listing.pokemon.region || "未記錄"}</dd></div>
            </dl>
            {listing.description && (
              <div className="mt-6 border-t pt-5" style={{ borderColor: "var(--eg-border)" }}>
                <p className="eg-meta">賣家說明</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7" style={{ color: "var(--eg-ink-2)" }}>{listing.description}</p>
              </div>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-5">
          <div className="eg-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eg-meta">{listing.bid_count > 0 ? "目前最高出價" : "起標價"}</p>
                <p className="eg-num mt-1 text-3xl font-semibold" style={{ color: "var(--eg-accent)" }}>
                  {twd(listing.bid_count > 0 ? listing.current_price : listing.starting_price)}
                </p>
              </div>
              <span className="eg-tag eg-num">{listing.bid_count} 次出價</span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl p-4" style={{ background: "var(--eg-bg-subtle)" }}>
              <div><p className="eg-meta">剩餘時間</p><p className="mt-1 text-sm font-medium">{remaining}</p></div>
              <div><p className="eg-meta">結標時間</p><p className="mt-1 text-sm font-medium">{taipeiDate(listing.end_time)}</p></div>
            </div>

            <div className="mt-5 text-sm">
              <p style={{ color: "var(--eg-ink-2)" }}>賣家 · <span style={{ color: "var(--eg-ink)" }}>{listing.seller_name}</span></p>
              {listing.current_bidder_name && (
                <p className="mt-1" style={{ color: "var(--eg-ink-2)" }}>最高出價 · <span style={{ color: "var(--eg-ink)" }}>{listing.current_bidder_name}</span></p>
              )}
            </div>

            {message && (
              <div className="mt-5 rounded-xl border p-3 text-sm" style={{ borderColor: "var(--eg-border)", color: "var(--eg-ink-2)" }} role="status">
                {message}
              </div>
            )}

            {isOpen && !isSeller && currentUserId && identityStatus === "approved" && (
              <div className="mt-6 space-y-3">
                {isHighest ? (
                  <div className="eg-tag eg-tag--success !h-auto w-full justify-center py-2">你目前是最高出價者</div>
                ) : (
                  <form onSubmit={submitBid} className="flex gap-2">
                    <input
                      type="number"
                      min={minimumBid(listing)}
                      max={listing.buy_now_price ? listing.buy_now_price - 1 : 100000000}
                      value={bidAmount}
                      onChange={(event) => setBidAmount(Number(event.target.value))}
                      className="eg-input min-w-0 flex-1"
                      aria-label="新台幣出價金額"
                    />
                    <button type="submit" disabled={working !== null} className="eg-btn eg-btn--primary">
                      {working === "bid" ? "出價中…" : "出價"}
                    </button>
                  </form>
                )}
                <p className="eg-meta">最低出價 {twd(minimumBid(listing))} · 得標後依賣家說明付款</p>
                {listing.buy_now_price !== null && (
                  <button
                    type="button"
                    disabled={working !== null}
                    onClick={() => {
                      if (window.confirm(`確定以 ${twd(listing.buy_now_price!)} 直購並進入待付款流程嗎？`)) {
                        void runAction("buy");
                      }
                    }}
                    className="eg-btn eg-btn--secondary eg-btn--block"
                  >
                    {working === "buy" ? "建立訂單中…" : `立即購買 · ${twd(listing.buy_now_price)}`}
                  </button>
                )}
              </div>
            )}

            {isOpen && !isSeller && currentUserId && identityStatus !== "approved" && (
              <div className="mt-6 rounded-xl border p-4" style={{ borderColor: "var(--eg-warn-border)", background: "var(--eg-warn-soft)" }}>
                <p className="text-sm font-medium" style={{ color: "var(--eg-warn)" }}>
                  {identityStatus === "pending" ? "實名資料審核中" : "請先完成交易實名認證"}
                </p>
                <p className="eg-meta mt-1.5">通過身分證正反面人工審核後才能出價或直購。</p>
                <Link href="/profile" className="eg-link mt-3 inline-block text-sm">查看認證狀態 →</Link>
              </div>
            )}

            {isOpen && !currentUserId && (
              <Link href={`/login?redirect=${encodeURIComponent(`/community-market/${listing.id}`)}`} className="eg-btn eg-btn--primary eg-btn--block mt-6">
                登入後出價
              </Link>
            )}

            {isOpen && isSeller && listing.bid_count === 0 && (
              <button type="button" disabled={working !== null} onClick={() => void runAction("cancel")} className="eg-btn eg-btn--secondary eg-btn--block mt-6">
                {working === "cancel" ? "取消中…" : "取消拍賣"}
              </button>
            )}

            {listing.status === "active" && isExpired && currentUserId && (
              <button type="button" disabled={working !== null} onClick={() => void runAction("finalize")} className="eg-btn eg-btn--primary eg-btn--block mt-6">
                {working === "finalize" ? "結算中…" : "完成結算"}
              </button>
            )}

            {listing.status === "sold" && (
              <div className="mt-6 rounded-xl border p-4" style={{ borderColor: "var(--eg-success-border)", background: "var(--eg-success-soft)" }}>
                <p className="text-sm font-medium" style={{ color: "var(--eg-success)" }}>成交完成</p>
                <p className="eg-meta mt-1">得標者 {listing.winner_name || "匿名收藏家"} · {twd(listing.sold_price || 0)}</p>
              </div>
            )}

            {listing.status === "pending_payment" && isBuyer && (
              <div className="mt-6 space-y-4 rounded-xl border p-4" style={{ borderColor: "var(--eg-warn-border)", background: "var(--eg-warn-soft)" }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--eg-warn)" }}>待付款 · {twd(listing.sold_price || 0)}</p>
                  <p className="eg-meta mt-2 whitespace-pre-wrap">{paymentDetails?.payment_instructions || "請聯絡賣家取得付款資訊。"}</p>
                </div>
                {cashPayment?.status === "submitted" ? (
                  <p className="text-sm">付款證明已送出，等待賣家確認。</p>
                ) : (
                  <form onSubmit={submitPayment} className="space-y-3">
                    {cashPayment?.status === "rejected" && (
                      <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600">退回原因：{cashPayment.rejection_reason}</p>
                    )}
                    <label className="block text-sm">
                      <span className="mb-1.5 block font-medium">付款證明</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseProof} required className="block w-full text-xs" />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1.5 block font-medium">匯款末五碼／備註（選填）</span>
                      <input value={referenceNote} onChange={(event) => setReferenceNote(event.target.value)} maxLength={300} className="eg-input" />
                    </label>
                    <button type="submit" disabled={working !== null} className="eg-btn eg-btn--primary eg-btn--block">
                      {working === "submit-payment" ? "上傳中…" : "送出付款證明"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {listing.status === "pending_payment" && canReviewPayment && (
              <div className="mt-6 space-y-3 rounded-xl border p-4" style={{ borderColor: "var(--eg-border)" }}>
                <p className="text-sm font-semibold">收款確認</p>
                {cashPayment?.status === "submitted" ? (
                  <>
                    <p className="eg-meta">買家備註：{cashPayment.reference_note || "未填寫"}</p>
                    {proofUrl && <a href={proofUrl} target="_blank" rel="noreferrer" className="eg-link text-sm">查看付款證明（5 分鐘有效）→</a>}
                    <button
                      type="button"
                      disabled={working !== null}
                      onClick={() => {
                        if (window.confirm("請先確認款項已實際入帳。確認後寶可夢會立即交付買家，確定繼續嗎？")) {
                          void runAction("confirm-payment");
                        }
                      }}
                      className="eg-btn eg-btn--primary eg-btn--block"
                    >
                      {working === "confirm-payment" ? "確認中…" : "確認已收到款項並交付"}
                    </button>
                    <input value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} maxLength={500} placeholder="若資料有誤，填寫退回原因" className="eg-input" />
                    <button type="button" disabled={working !== null || !rejectionReason.trim()} onClick={() => void runAction("reject-payment", { reason: rejectionReason.trim() })} className="eg-btn eg-btn--secondary eg-btn--block">
                      {working === "reject-payment" ? "退回中…" : "退回買家補件"}
                    </button>
                  </>
                ) : (
                  <p className="eg-meta">買家尚未提交付款證明。</p>
                )}
              </div>
            )}
          </div>

          <div className="eg-card p-5">
            <p className="eg-h3">交易保障</p>
            <ul className="mt-3 space-y-2 text-sm leading-6" style={{ color: "var(--eg-ink-2)" }}>
              <li>• 所有價格均為新台幣；出價不會扣除站內點數。</li>
              <li>• 得標後付款資料只提供交易雙方與管理員查看。</li>
              <li>• 賣家確認實際收款後，系統才會交付收藏。</li>
              <li>• 已有人出價後，賣家不可取消或刪除商品。</li>
            </ul>
          </div>
        </aside>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="eg-h2">出價紀錄</h2>
          <span className="eg-tag eg-num">{bids.length} 筆</span>
        </div>
        {bids.length > 0 ? (
          <div className="eg-card overflow-hidden">
            {bids.map((bid, index) => (
              <div key={bid.id} className="flex items-center justify-between gap-4 border-b px-5 py-4 last:border-b-0" style={{ borderColor: "var(--eg-border)" }}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`eg-tag ${index === 0 ? "eg-tag--accent" : ""}`}>#{index + 1}</span>
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{bid.bidder_name}</p><p className="eg-meta mt-0.5">{taipeiDate(bid.created_at)}</p></div>
                </div>
                <p className="eg-num flex-none font-semibold">{twd(bid.amount)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="eg-card eg-card--subtle px-6 py-10 text-center"><p className="eg-meta">還沒有人出價</p></div>
        )}
      </section>
    </div>
  );
}
