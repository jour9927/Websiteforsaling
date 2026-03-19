"use client";

import { useEffect, useMemo, useState } from "react";


type ParticipantRow = {
  participant: {
    id: string;
    user_id: string;
    target_pokemon: string;
    partner_pokemon: string | null;
    total_battles_used: number;
    total_wins: number;
    win_streak: number;
    max_win_streak: number;
    partner_unlocked: boolean;
    second_pokemon_unlocked: boolean;
    created_at: string;
  };
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
};

type CampaignSummary = {
  id: string;
  title: string;
  slug: string;
  event_id: string | null;
};

export function Anniversary30thAdminPanel() {
  const [campaign, setCampaign] = useState<CampaignSummary | null>(null);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadParticipants() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/anniversary-30th/participants");
      const payload = (await response.json()) as {
        error?: string;
        campaign?: CampaignSummary;
        participants?: ParticipantRow[];
      };

      if (!response.ok) {
        throw new Error(payload.error || "無法載入 30 週年控制台");
      }

      setCampaign(payload.campaign || null);
      setParticipants(payload.participants || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "無法載入 30 週年控制台");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadParticipants();
  }, []);

  const stats = useMemo(() => {
    return {
      total: participants.length,
      partnerUnlocked: participants.filter((row) => row.participant.partner_unlocked).length,
      secondUnlocked: participants.filter((row) => row.participant.second_pokemon_unlocked).length,
    };
  }, [participants]);


  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-300/80">30th Anniversary Control</p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">
              {campaign?.title || "30 週年對決祭典 (v2) 控制台"}
            </h1>
            <p className="mt-2 text-sm text-white/60">
              檢視所有參戰者的對局狀況、勝場累計，以及寶可夢解鎖進度。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadParticipants}
              className="rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/20"
            >
              重新整理
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card rounded-2xl border border-white/10 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-white/45">總參戰者</p>
          <p className="mt-2 text-2xl font-semibold text-white">{stats.total}</p>
        </div>
        <div className="glass-card rounded-2xl border border-emerald-500/20 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-white/45">已獲得伴侶寶可夢</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-300">{stats.partnerUnlocked}</p>
        </div>
        <div className="glass-card rounded-2xl border border-sky-500/20 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-white/45">已解鎖第二隻相遇權</p>
          <p className="mt-2 text-2xl font-semibold text-sky-200">{stats.secondUnlocked}</p>
        </div>
      </div>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      {loading ? (
        <div className="glass-card rounded-2xl border border-white/10 p-6 text-center text-white/60">
          載入 30 週年控制資料中...
        </div>
      ) : participants.length === 0 ? (
        <div className="glass-card rounded-2xl border border-white/10 p-6 text-center text-white/60">
          目前還沒有任何 30 週年參戰者。
        </div>
      ) : (
        <div className="space-y-5">
          {participants.map((row) => (
            <article key={row.participant.id} className="glass-card rounded-3xl border border-white/10 p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-white/45">參戰者</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {row.profile?.full_name || row.profile?.email || "未命名用戶"}
                    </p>
                    <p className="mt-1 text-sm text-white/50">{row.profile?.email || "無 email"}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${row.participant.partner_unlocked ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-white/5 text-white/60'}`}>
                      {row.participant.partner_unlocked ? '✅ 伴侶寶可夢已獲得' : '🔒 伴侶寶可夢未解鎖'}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${row.participant.second_pokemon_unlocked ? 'border-sky-500/30 bg-sky-500/10 text-sky-200' : 'border-white/10 bg-white/5 text-white/60'}`}>
                      {row.participant.second_pokemon_unlocked ? '✅ 第二隻相遇權已解鎖' : '🔒 第二隻相遇權未解鎖'}
                    </span>
                  </div>
                </div>

                <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 md:ml-8 max-w-2xl">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-white/40">攜帶伴侶</p>
                    <p className="mt-2 text-lg font-semibold text-amber-300">{row.participant.partner_pokemon || "未選擇"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-white/40">對戰場次</p>
                    <p className="mt-2 text-xl font-semibold text-white">{row.participant.total_battles_used} <span className="text-sm text-white/50">/ 21</span></p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-white/40">總勝場</p>
                    <p className="mt-2 text-xl font-semibold text-emerald-400">{row.participant.total_wins}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-white/40">最高連勝</p>
                    <p className="mt-2 text-xl font-semibold text-rose-400">{row.participant.max_win_streak}</p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
