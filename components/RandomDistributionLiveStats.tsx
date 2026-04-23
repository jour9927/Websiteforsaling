"use client";

import { useEffect, useMemo, useState } from "react";

type RandomDistributionLiveStatsProps = {
  baseDamage: number;
  baseBattles: number;
  highestWinStreak: number;
  anchorIso: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-TW").format(Math.max(0, Math.floor(value)));
}

function formatRemaining(milliseconds: number) {
  const safe = Math.max(0, milliseconds);
  const hours = Math.floor(safe / 3_600_000);
  const minutes = Math.floor((safe % 3_600_000) / 60_000);
  if (hours > 0) return `${hours} 小時 ${minutes} 分`;
  return `${Math.max(1, minutes)} 分`;
}

export function RandomDistributionLiveStats({
  baseDamage,
  baseBattles,
  highestWinStreak,
  anchorIso,
}: RandomDistributionLiveStatsProps) {
  const anchorTime = useMemo(() => new Date(anchorIso).getTime(), [anchorIso]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 2000);
    return () => window.clearInterval(timer);
  }, []);

  const elapsed = Math.max(0, now - anchorTime);
  const liveDamage = baseDamage + Math.floor(elapsed / 2500) * 7;
  const liveBattles = baseBattles + Math.floor(elapsed / 10_800_000);
  const damageRefresh = 43_200_000 - (elapsed % 43_200_000);
  const battleRefresh = 10_800_000 - (elapsed % 10_800_000);

  const stats = [
    {
      label: "總傷害量",
      value: formatNumber(liveDamage),
      note: `約 ${formatRemaining(damageRefresh)} 後校準`,
    },
    {
      label: "已對戰場次",
      value: formatNumber(liveBattles),
      note: `約 ${formatRemaining(battleRefresh)} 後更新`,
    },
    {
      label: "最高連勝紀錄",
      value: `${formatNumber(highestWinStreak)} 場`,
      note: "全體玩家目前紀錄",
    },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-3" aria-label="活動即時統計">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-white/12 bg-black/35 p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200/70">
            {stat.label}
          </p>
          <p className="mt-3 font-mono text-3xl font-black tabular-nums text-white md:text-4xl">
            {stat.value}
          </p>
          <p className="mt-2 text-xs text-white/50">{stat.note}</p>
        </div>
      ))}
    </section>
  );
}
