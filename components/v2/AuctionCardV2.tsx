"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState, useEffect, useMemo } from "react";
import { getEstimatedBidCount } from "@/lib/simulatedBidCount";

export type AuctionV2 = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  starting_price: number;
  current_price: number;
  start_time?: string;
  end_time: string;
  status: "active" | "ended";
  bid_count: number;
  distributions?: {
    pokemon_name: string;
    pokemon_name_en: string | null;
    pokemon_sprite_url: string | null;
  };
};

/** 出價熱度分級，跟 v1 同一套門檻 */
function heatOf(count: number) {
  if (count >= 20) return { label: "白熱化", cls: "eg-tag--danger" };
  if (count >= 10) return { label: "激烈", cls: "eg-tag--warn" };
  if (count >= 5) return { label: "熱門", cls: "eg-tag--accent" };
  return null;
}

export default function AuctionCardV2({ auction }: { auction: AuctionV2 }) {
  const [remaining, setRemaining] = useState("");
  const [isEnded, setIsEnded] = useState(auction.status === "ended");

  useEffect(() => {
    const tick = () => {
      const diff = new Date(auction.end_time).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("已結束");
        setIsEnded(true);
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (d > 0) setRemaining(`${d} 天 ${h} 小時`);
      else if (h > 0) setRemaining(`${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      else setRemaining(`${m}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [auction.end_time]);

  const bids = useMemo(() => {
    const start =
      auction.start_time ||
      new Date(new Date(auction.end_time).getTime() - 7 * 86400000).toISOString();
    return (
      auction.bid_count +
      getEstimatedBidCount({
        auctionId: auction.id,
        startTime: start,
        endTime: auction.end_time,
        currentTime: isEnded ? new Date(auction.end_time) : new Date(),
      })
    );
  }, [auction.id, auction.start_time, auction.end_time, auction.bid_count, isEnded]);

  const image = auction.image_url || auction.distributions?.pokemon_sprite_url;
  const price = auction.current_price > 0 ? auction.current_price : auction.starting_price;
  const [mainTitle, eventName] = auction.title.split("\n");
  const heat = heatOf(bids);

  return (
    <Link
      href={`/auctions/${auction.id}` as Route}
      className="eg-card eg-card--interactive group flex h-full flex-col overflow-hidden"
    >
      <div
        className="relative flex h-36 items-center justify-center overflow-hidden"
        style={{ background: "var(--eg-bg-muted)" }}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <span style={{ color: "var(--eg-ink-4)" }} aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="8" width="18" height="13" rx="2" />
              <path d="M3 12h18M12 8v13M12 8S9 3 6.5 5.5 12 8 12 8ZM12 8s3-5 5.5-2.5S12 8 12 8Z" />
            </svg>
          </span>
        )}

        <div className="absolute right-2.5 top-2.5 flex flex-col items-end gap-1.5">
          {isEnded ? (
            <span className="eg-tag">已結標</span>
          ) : (
            <span className="eg-tag eg-tag--success">
              <span className="eg-dot eg-dot--live" aria-hidden="true" />
              競標中
            </span>
          )}
          {heat && <span className={`eg-tag ${heat.cls}`}>{heat.label}</span>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="eg-h3 line-clamp-1">{mainTitle}</h3>
        {eventName && <p className="eg-meta line-clamp-1">{eventName}</p>}

        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="eg-num text-[22px] font-semibold" style={{ color: "var(--eg-ink)" }}>
            ${price.toLocaleString()}
          </span>
          {auction.current_price === 0 && <span className="eg-meta">起標價</span>}
        </div>

        <div
          className="mt-auto flex items-center justify-between pt-3"
          style={{ borderTop: "1px solid var(--eg-border)", marginTop: "12px" }}
        >
          <span className="eg-meta eg-num">{bids} 次出價</span>
          <span
            className="eg-meta eg-num font-medium"
            style={{ color: isEnded ? "var(--eg-ink-3)" : "var(--eg-warn)" }}
          >
            {remaining}
          </span>
        </div>
      </div>
    </Link>
  );
}
