import Link from "next/link";

export type CommunityMarketRankingEntry = {
  userId: string;
  displayName: string;
  tradeCount: number;
  totalPoints: number;
};

export type CommunityMarketRankings = {
  sellers: CommunityMarketRankingEntry[];
  buyers: CommunityMarketRankingEntry[];
};

function RankingList({
  title,
  subtitle,
  entries,
  skin,
}: {
  title: string;
  subtitle: string;
  entries: CommunityMarketRankingEntry[];
  skin: boolean;
}) {
  const rankStyles = [
    { background: "var(--eg-accent)", color: "var(--eg-primary-fg)" },
    { background: "var(--eg-bg-inset)", color: "var(--eg-ink-2)" },
    { background: "var(--eg-warn-soft)", color: "var(--eg-warn)" },
  ];

  return (
    <div className={skin ? "eg-card p-4 sm:p-5" : "rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5"}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h3 className={skin ? "eg-h3" : "text-base font-semibold text-white"}>{title}</h3>
          <p className={skin ? "eg-meta mt-1" : "mt-1 text-xs text-white/45"}>{subtitle}</p>
        </div>
        <span aria-hidden="true" className="text-xl">🏆</span>
      </div>

      {entries.length === 0 ? (
        <div
          className={skin ? "rounded-xl px-4 py-7 text-center" : "rounded-xl bg-black/10 px-4 py-7 text-center"}
          style={skin ? { background: "var(--eg-bg-subtle)" } : undefined}
        >
          <p className={skin ? "eg-meta" : "text-sm text-white/50"}>等待第一筆成交紀錄</p>
        </div>
      ) : (
        <ol className="space-y-1.5">
          {entries.map((entry, index) => (
            <li
              key={entry.userId}
              className="flex items-center gap-3 rounded-xl px-2.5 py-2.5"
              style={skin ? { background: index === 0 ? "var(--eg-accent-soft)" : "transparent" } : undefined}
            >
              <span
                className={skin ? "eg-num flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold" : "flex h-7 w-7 flex-none items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/70"}
                style={skin ? (rankStyles[index] ?? rankStyles[1]) : undefined}
              >
                {index + 1}
              </span>
              <Link
                href={`/user/${entry.userId}`}
                className={skin ? "eg-link min-w-0 flex-1 truncate font-medium" : "min-w-0 flex-1 truncate text-sm font-medium text-white/85 transition hover:text-white"}
              >
                {entry.displayName}
              </Link>
              <div className="flex-none text-right">
                <p className={skin ? "eg-num text-sm font-semibold" : "text-sm font-semibold text-white"}>
                  {entry.tradeCount.toLocaleString()} 件
                </p>
                <p className={skin ? "eg-meta" : "text-[11px] text-white/40"}>
                  NT${entry.totalPoints.toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function CommunityMarketRankingsWidget({
  rankings,
  skin = false,
}: {
  rankings: CommunityMarketRankings;
  skin?: boolean;
}) {
  return (
    <section className={skin ? "" : "glass-card p-5 sm:p-6"}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className={skin ? "eg-eyebrow" : "text-xs uppercase tracking-[0.24em] text-white/45"}>Community Market</p>
          <h2 className={skin ? "eg-h2 mt-1" : "mt-1 text-lg font-semibold text-white/90"}>民間交易排行榜</h2>
        </div>
        <Link href="/community-market" className={skin ? "eg-link flex-none" : "flex-none text-sm text-white/60 transition hover:text-white"}>
          前往市場 →
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <RankingList title="賣家排行" subtitle="已完成交易・賣出件數" entries={rankings.sellers} skin={skin} />
        <RankingList title="買家排行" subtitle="已完成交易・購入件數" entries={rankings.buyers} skin={skin} />
      </div>
      <p className={skin ? "eg-meta mt-3 text-right" : "mt-3 text-right text-[11px] text-white/35"}>
        同件數時依成交金額排序
      </p>
    </section>
  );
}
