"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import {
  minimumBid,
  points,
  taipeiDate,
  type CommunityListing,
  type MarketBid,
} from "@/lib/community-market";

type Props = {
  listing: CommunityListing;
  bids: MarketBid[];
  currentUserId: string | null;
  balance: number;
  identityStatus: "pending" | "approved" | "rejected" | null;
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

export function CommunityAuctionDetailClient({ listing, bids, currentUserId, balance, identityStatus }: Props) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(() => timeRemaining(listing.end_time));
  const [bidAmount, setBidAmount] = useState(minimumBid(listing));
  const [working, setWorking] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const isExpired = new Date(listing.end_time).getTime() <= Date.now();
  const isOpen = listing.status === "active" && !isExpired;
  const isSeller = currentUserId === listing.seller_id;
  const isHighest = currentUserId !== null && currentUserId === listing.current_bidder_id;

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(timeRemaining(listing.end_time)), 30000);
    return () => window.clearInterval(timer);
  }, [listing.end_time]);

  async function runAction(action: "bid" | "buy" | "finalize" | "cancel", amount?: number) {
    setWorking(action);
    setMessage(null);
    try {
      const response = await fetch(`/api/community-market/${listing.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: action === "bid" ? JSON.stringify({ amount }) : undefined,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "操作失敗");
      setMessage(
        action === "bid"
          ? "出價成功，你目前是最高出價者。"
          : action === "buy"
            ? "購買完成，寶可夢已加入你的收藏。"
            : action === "cancel"
              ? "拍賣已取消。"
              : "拍賣已完成結算。",
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
    void runAction("bid", bidAmount);
  }

  const statusLabel =
    listing.status === "sold"
      ? "已成交"
      : listing.status === "cancelled"
        ? "已取消"
        : listing.status === "ended" || isExpired
          ? "待結算"
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
                  {points(listing.bid_count > 0 ? listing.current_price : listing.starting_price)}
                  <span className="ml-1 text-sm font-normal">點</span>
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
                      aria-label="出價點數"
                    />
                    <button type="submit" disabled={working !== null} className="eg-btn eg-btn--primary">
                      {working === "bid" ? "出價中…" : "出價"}
                    </button>
                  </form>
                )}
                <p className="eg-meta">最低出價 {points(minimumBid(listing))} 點 · 你的餘額 {points(balance)} 點</p>
                {listing.buy_now_price !== null && (
                  <button
                    type="button"
                    disabled={working !== null}
                    onClick={() => {
                      if (window.confirm(`確定要用 ${points(listing.buy_now_price!)} 點立即購買嗎？`)) {
                        void runAction("buy");
                      }
                    }}
                    className="eg-btn eg-btn--secondary eg-btn--block"
                  >
                    {working === "buy" ? "購買中…" : `立即購買 · ${points(listing.buy_now_price)} 點`}
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
                <p className="eg-meta mt-1">得標者 {listing.winner_name || "匿名收藏家"} · {points(listing.sold_price || 0)} 點</p>
              </div>
            )}
          </div>

          <div className="eg-card p-5">
            <p className="eg-h3">交易保障</p>
            <ul className="mt-3 space-y-2 text-sm leading-6" style={{ color: "var(--eg-ink-2)" }}>
              <li>• 出價點數會先由系統保留；被超越時立即退回。</li>
              <li>• 成交時款項與收藏在同一筆交易中交換。</li>
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
                <p className="eg-num flex-none font-semibold">{points(bid.amount)} 點</p>
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
