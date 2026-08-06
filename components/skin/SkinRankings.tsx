"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Route } from "next";
import { SectionHead, EmptyState } from "@/components/skin/primitives";

type RankingUser = {
  id: string;
  displayName: string;
  username?: string;
  score: number;
  followers: number;
  isVirtual: boolean;
};

function userHref(u: RankingUser): Route {
  return (u.isVirtual ? `/user/${u.id}` : `/user/${u.username || u.id}`) as Route;
}

/** 前三名的獎牌色。用實心深色而不是漸層，白底上才不會糊掉 */
const MEDAL = [
  { label: "1", ring: "#C9A227", tint: "rgba(201,162,39,0.09)" },
  { label: "2", ring: "#8E8E93", tint: "rgba(142,142,147,0.09)" },
  { label: "3", ring: "#B06A2C", tint: "rgba(176,106,44,0.09)" },
];

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <span
      className="flex flex-none items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        background: "var(--eg-bg-inset)",
        color: "var(--eg-ink-2)",
      }}
      aria-hidden="true"
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export default function SkinRankings() {
  const [rankings, setRankings] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/popularity?action=rankings&limit=50")
      .then((r) => r.json())
      .then((d) => {
        if (d.rankings) setRankings(d.rankings);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const top3 = rankings.slice(0, 3);

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col items-start gap-4">
        <p className="eg-eyebrow">Rankings</p>
        <h1 className="eg-h1">人氣排行榜</h1>
        <p className="eg-lead max-w-xl">
          本週最受歡迎的成員。每人每週可給同一人投 1 票，每月共 4 次額度。
        </p>
      </header>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="eg-skeleton h-16 w-full" />
          ))}
        </div>
      ) : rankings.length === 0 ? (
        <EmptyState title="暫無排名資料" hint="有人開始投票後就會出現在這裡" />
      ) : (
        <>
          {top3.length === 3 && (
            <section>
              <SectionHead title="前三名" />
              <div className="grid gap-5 sm:grid-cols-3">
                {top3.map((u, i) => (
                  <Link
                    key={u.id}
                    href={userHref(u)}
                    className="eg-card eg-card--interactive flex flex-col items-center gap-2 px-5 py-7 text-center"
                    style={{ background: MEDAL[i].tint, borderColor: MEDAL[i].ring }}
                  >
                    <span
                      className="eg-num text-[11px] font-semibold tracking-widest"
                      style={{ color: MEDAL[i].ring }}
                    >
                      NO.{MEDAL[i].label}
                    </span>
                    <Avatar name={u.displayName} size={52} />
                    <p className="eg-h3 mt-1 max-w-full truncate">{u.displayName}</p>
                    <p
                      className="eg-num text-[26px] font-semibold leading-none"
                      style={{ color: "var(--eg-ink)" }}
                    >
                      {u.score}
                    </p>
                    <p className="eg-meta eg-num">{u.followers} 關注者</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <SectionHead title="完整排名" count={`${rankings.length} 人`} />
            <div className="eg-card overflow-hidden">
              {rankings.map((u, i) => (
                <Link
                  key={u.id}
                  href={userHref(u)}
                  className="flex items-center gap-4 px-4 py-3 transition-colors"
                  style={{
                    borderTop: i === 0 ? "none" : "1px solid var(--eg-border)",
                  }}
                >
                  <span
                    className="eg-num w-7 flex-none text-right text-[13px] font-medium"
                    style={{ color: i < 3 ? "var(--eg-ink)" : "var(--eg-ink-3)" }}
                  >
                    {i + 1}
                  </span>
                  <Avatar name={u.displayName} />
                  <span className="min-w-0 flex-1">
                    <span className="eg-h3 block truncate text-[14px]">{u.displayName}</span>
                    <span className="eg-meta eg-num">{u.followers} 關注者</span>
                  </span>
                  <span
                    className="eg-num flex-none text-[16px] font-semibold"
                    style={{ color: "var(--eg-ink)" }}
                  >
                    {u.score}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
