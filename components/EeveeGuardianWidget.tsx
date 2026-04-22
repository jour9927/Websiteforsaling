"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type LiveResponse = {
  tableReady: boolean;
  message: string | null;
  campaign: {
    slug: string;
    title: string;
    totalDays: number;
    daysElapsed: number;
    daysRemaining: number;
    targetMedals: number;
    isActive: boolean;
    hasEnded: boolean;
  };
  live: {
    todayBattlers: number;
    todayHighestDamage: number;
    highestTotalDamage: number;
    highestTotalDamageDisplayName: string | null;
  };
};

type StatusResponse = {
  player: {
    medalsCollected: number;
    targetMedals: number;
    battlesRemainingToday: number;
    totalPoints: number;
  } | null;
};

export function EeveeGuardianWidget() {
  const [loading, setLoading] = useState(true);
  const [liveData, setLiveData] = useState<LiveResponse | null>(null);
  const [myStatus, setMyStatus] = useState<StatusResponse | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [liveRes, statusRes] = await Promise.allSettled([
          fetch("/api/eevee-guardian/live", { cache: "no-store" }),
          fetch("/api/eevee-guardian/status", { cache: "no-store" }),
        ]);

        if (!mounted) {
          return;
        }

        if (liveRes.status === "fulfilled" && liveRes.value.ok) {
          const data = (await liveRes.value.json()) as LiveResponse;
          setLiveData(data);
        }

        if (statusRes.status === "fulfilled" && statusRes.value.ok) {
          const data = (await statusRes.value.json()) as StatusResponse;
          setMyStatus(data);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    const timer = window.setInterval(() => {
      void load();
    }, 15000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const progressPercent = useMemo(() => {
    if (!liveData) {
      return 0;
    }

    return Math.min(
      100,
      Math.max(0, (liveData.campaign.daysElapsed / Math.max(1, liveData.campaign.totalDays)) * 100),
    );
  }, [liveData]);

  if (loading) {
    return (
      <div className="glass-card p-4 animate-pulse">
        <div className="h-4 w-48 rounded bg-white/10" />
        <div className="mt-3 h-8 rounded bg-white/10" />
      </div>
    );
  }

  if (!liveData) {
    return null;
  }

  return (
    <Link href="/eevee-guardian" className="group block">
      <div className="glass-card relative overflow-hidden border border-amber-400/20 p-5 transition hover:border-amber-300/40">
        <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-amber-300/15 blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-amber-300">勳章型伊布護衛活動</h3>
            <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] text-cyan-100">
              即時戰況
            </span>
          </div>

          <p className="mt-2 text-xs text-white/60">
            已進行 {liveData.campaign.daysElapsed} / {liveData.campaign.totalDays} 天，剩餘 {liveData.campaign.daysRemaining} 天
          </p>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
              <p className="text-[10px] text-white/50">今日對戰</p>
              <p className="mt-1 text-sm font-bold text-white">{liveData.live.todayBattlers}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
              <p className="text-[10px] text-white/50">今日最高傷害</p>
              <p className="mt-1 text-sm font-bold text-white">{liveData.live.todayHighestDamage}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
              <p className="text-[10px] text-white/50">總累積最高</p>
              <p className="mt-1 text-sm font-bold text-white">{liveData.live.highestTotalDamage}</p>
            </div>
          </div>

          {myStatus?.player ? (
            <p className="mt-3 text-xs text-emerald-200">
              你的勳章：{myStatus.player.medalsCollected}/{myStatus.player.targetMedals} ・ 今日剩餘 {myStatus.player.battlesRemainingToday} 場
            </p>
          ) : null}

          <p className="mt-3 text-xs text-white/50 transition group-hover:text-white/80">
            進入活動入口與對戰大廳
          </p>
        </div>
      </div>
    </Link>
  );
}
