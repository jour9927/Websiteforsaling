"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { clamp, type EeveeGuardianLiveMetrics } from "@/lib/eeveeGuardian";

type CampaignData = {
  id: string;
  slug: string;
  title: string;
  startsAt: string;
  endsAt: string;
  totalDays: number;
  dailyBattles: number;
  winPoints: number;
  losePoints: number;
  targetMedals: number;
  rareRewardName: string;
  isActive: boolean;
  hasEnded: boolean;
  isUpcoming: boolean;
  daysElapsed: number;
  daysRemaining: number;
};

type PlayerProgress = {
  totalPoints: number;
  medalsCollected: number;
  targetMedals: number;
  totalBattles: number;
  totalWins: number;
  totalLosses: number;
  totalDamage: number;
  todayBattlesUsed: number;
  battlesRemainingToday: number;
  rareRewardUnlocked: boolean;
};

type StatusResponse = {
  tableReady: boolean;
  message: string | null;
  campaign: CampaignData;
  player: PlayerProgress | null;
  live: EeveeGuardianLiveMetrics;
  pendingBattle: { id: string; created_at: string } | null;
  canBattleToday: boolean;
};

function formatDate(dateString: string) {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-[11px] uppercase tracking-[0.25em] text-white/45">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      {sub ? <p className="mt-1 text-xs text-white/50">{sub}</p> : null}
    </div>
  );
}

export function EeveeGuardianLobby() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<StatusResponse | null>(null);

  const campaign = statusData?.campaign;
  const player = statusData?.player;

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/eevee-guardian/status", { cache: "no-store" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setMessage(errorData.error || "讀取活動狀態失敗");
        return;
      }

      const data = (await res.json()) as StatusResponse;
      setStatusData(data);

      if (!data.tableReady && data.message) {
        setMessage(data.message);
      }
    } catch {
      setMessage("讀取活動狀態失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      const res = await fetch("/api/eevee-guardian/live", { cache: "no-store" });
      if (!res.ok) {
        return;
      }

      const data = (await res.json()) as { campaign: CampaignData; live: EeveeGuardianLiveMetrics };
      setStatusData((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          campaign: {
            ...prev.campaign,
            ...data.campaign,
          },
          live: data.live,
        };
      });
    }, 15000);

    return () => window.clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <section className="glass-card p-8 text-center">
        <p className="animate-pulse text-white/60">載入活動入口中...</p>
      </section>
    );
  }

  if (!statusData || !campaign) {
    return (
      <section className="glass-card p-8 text-center">
        <p className="text-rose-200">活動資訊載入失敗，請稍後再試。</p>
      </section>
    );
  }

  const progressPercent = player
    ? clamp((player.medalsCollected / Math.max(1, player.targetMedals)) * 100, 0, 100)
    : 0;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-amber-400/20 bg-[radial-gradient(ellipse_at_top_left,rgba(245,158,11,0.18),transparent_42%),radial-gradient(ellipse_at_bottom_right,rgba(56,189,248,0.16),transparent_42%),linear-gradient(160deg,#0f1220,#131a2d_45%,#0b111f)] p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-300/70">Eevee Medal Guardians</p>
        <h1 className="mt-3 text-3xl font-black text-white md:text-4xl">{campaign.title}</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70">
          這裡是活動入口，不直接進行戰鬥。點擊「進入對戰匹配」後會進入獨立戰場頁面，先進行隨機匹配，再進入 3gen 對戰畫面。
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
            活動區間：{formatDate(campaign.startsAt)} - {formatDate(campaign.endsAt)}
          </span>
          <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
            今日戰況輪詢：每 15 秒更新
          </span>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
            戰鬥流程：入口 → 匹配 → 戰場
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="今日已對戰人數" value={statusData.live.todayBattlers} sub="即時更新" />
        <StatCard label="今日最高單場傷害" value={statusData.live.todayHighestDamage} sub="單場輸出" />
        <StatCard
          label="最高總累積傷害"
          value={statusData.live.highestTotalDamage}
          sub={statusData.live.highestTotalDamageDisplayName || "尚無資料"}
        />
        <StatCard label="活動進度" value={`${campaign.daysElapsed}/${campaign.totalDays}`} sub={`剩餘 ${campaign.daysRemaining} 天`} />
      </section>

      {player ? (
        <section className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-white/45">你的勳章進度</p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                {player.medalsCollected} / {player.targetMedals}
              </h2>
              <p className="mt-1 text-sm text-white/65">
                累積點數：{player.totalPoints.toFixed(1)} ・ 今日剩餘場次：{player.battlesRemainingToday}
              </p>
            </div>
            <div className="text-right text-sm text-white/65">
              <p>總戰績：{player.totalWins} 勝 / {player.totalLosses} 敗</p>
              <p>總輸出：{player.totalDamage}</p>
              <p>{player.rareRewardUnlocked ? "稀有伊布已解鎖" : "尚未達成獎勵門檻"}</p>
            </div>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </section>
      ) : null}

      {!statusData.tableReady ? (
        <section className="rounded-2xl border border-rose-400/20 bg-rose-500/5 p-5 text-sm text-rose-100">
          <p className="font-semibold">活動資料庫尚未完成</p>
          <p className="mt-2 text-rose-100/80">
            {statusData.message || "請先執行本次新增的 Supabase migration，才能正常記錄進度與戰況。"}
          </p>
        </section>
      ) : null}

      {message ? (
        <section className="rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          {message}
        </section>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-black/30 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">進入對戰匹配</h2>
            <p className="mt-1 text-sm text-white/60">
              對戰將在獨立頁面進行，先走隨機匹配過渡，再進入 3gen 戰場畫面。
            </p>
          </div>
          <Link
            href="/eevee-guardian/battle"
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            {statusData.pendingBattle ? "回到對戰中" : "進入對戰匹配"}
          </Link>
        </div>

        {!campaign.isActive ? (
          <p className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            {campaign.hasEnded ? "活動已結束。" : "活動尚未開始。"}
          </p>
        ) : null}
      </section>
    </div>
  );
}
