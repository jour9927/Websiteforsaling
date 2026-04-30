import Link from "next/link";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/auth";
import {
  ANNIVERSARY_30TH_BATTLES_PER_DAY,
  ANNIVERSARY_30TH_EEVEE_POINT_GOAL,
  ANNIVERSARY_30TH_ENDS_AT,
  ANNIVERSARY_30TH_EVENT_ID,
  ANNIVERSARY_30TH_LOSS_POINTS,
  ANNIVERSARY_30TH_PREREG_STARTS_AT,
  ANNIVERSARY_30TH_SLUG,
  ANNIVERSARY_30TH_STARTS_AT,
  ANNIVERSARY_30TH_TOTAL_DAYS,
  ANNIVERSARY_30TH_WIN_POINTS,
  calculateAnniversaryEventPoints,
  defaultCampaignCopy,
  formatDateRange,
  getPartnerPokemon,
  getPokemonSpriteUrl,
  isEventStarted,
  resolveBattlesRemaining,
  type AnniversaryCampaign,
  type AnniversaryParticipant,
} from "@/lib/anniversary30th";
import { Anniversary30thCountdown } from "@/components/Anniversary30thCountdown";
import { Anniversary30thJoinPanel } from "@/components/Anniversary30thJoinPanel";
import { Anniversary30thPartnerSelect } from "@/components/Anniversary30thPartnerSelect";
import { RandomDistributionLiveStats } from "@/components/RandomDistributionLiveStats";

export const dynamic = "force-dynamic";

type PageStats = {
  completedBattles: number;
  highestWinStreak: number;
  baseDamage: number;
};

const PLAYER_TEAM_SELECTION_SIZE = 3;

type PageState = {
  campaign: AnniversaryCampaign | null;
  participant: AnniversaryParticipant | null;
  completedBattleCount: number;
  stats: PageStats;
};

type ParticipantStatsRow = {
  id: string;
  max_win_streak: number | null;
};

async function countCompletedBattles(participantIds: string[]) {
  if (participantIds.length === 0) return 0;

  const adminSupabase = createAdminSupabaseClient();
  const { count } = await adminSupabase
    .from("anniversary_battles")
    .select("id", { count: "exact", head: true })
    .in("participant_id", participantIds)
    .in("status", ["won", "lost"]);

  return count ?? 0;
}

async function loadPageState(userId?: string): Promise<PageState> {
  const supabase = createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient();

  const { data: campaignData } = await adminSupabase
    .from("anniversary_campaigns")
    .select("*")
    .eq("slug", ANNIVERSARY_30TH_SLUG)
    .maybeSingle();

  const campaign = (campaignData || null) as AnniversaryCampaign | null;
  if (!campaign) {
    return {
      campaign: null,
      participant: null,
      completedBattleCount: 0,
      stats: { completedBattles: 0, highestWinStreak: 0, baseDamage: 0 },
    };
  }

  const { data: participantStatsData } = await adminSupabase
    .from("anniversary_participants")
    .select("id, max_win_streak")
    .eq("campaign_id", campaign.id);

  const participantStats = (participantStatsData || []) as ParticipantStatsRow[];
  const participantIds = participantStats.map((participant) => participant.id);
  const completedBattles = await countCompletedBattles(participantIds);
  const highestWinStreak = participantStats.reduce(
    (highest, participant) => Math.max(highest, participant.max_win_streak ?? 0),
    0,
  );

  let participant: AnniversaryParticipant | null = null;
  let completedBattleCount = 0;

  if (userId) {
    const { data: participantData } = await adminSupabase
      .from("anniversary_participants")
      .select("*")
      .eq("campaign_id", campaign.id)
      .eq("user_id", userId)
      .maybeSingle();

    participant = (participantData || null) as AnniversaryParticipant | null;

    if (!participant) {
      const { data: registrationData } = await supabase
        .from("registrations")
        .select("id")
        .eq("event_id", campaign.event_id || ANNIVERSARY_30TH_EVENT_ID)
        .eq("user_id", userId)
        .in("status", ["pending", "confirmed"])
        .maybeSingle();

      if (registrationData) {
        const now = new Date().toISOString();
        const { data: newParticipantData } = await adminSupabase
          .from("anniversary_participants")
          .insert({
            campaign_id: campaign.id,
            user_id: userId,
            target_pokemon: "伊布",
            entry_fee_amount: 0,
            entry_fee_paid_at: now,
            total_battles_used: 0,
            today_battles_used: 0,
            win_streak: 0,
            max_win_streak: 0,
            total_wins: 0,
            partner_unlocked: false,
            second_pokemon_unlocked: false,
            title_unlocked: false,
            third_pokemon_unlocked: false,
            master_ball_unlocked: false,
            legendary_unlocked: false,
          })
          .select("*")
          .single();

        participant = (newParticipantData || null) as AnniversaryParticipant | null;
      }
    }

    if (participant) {
      completedBattleCount = await countCompletedBattles([participant.id]);
    }
  }

  return {
    campaign,
    participant,
    completedBattleCount,
    stats: {
      completedBattles,
      highestWinStreak,
      baseDamage: completedBattles * 168 + participantIds.length * 37,
    },
  };
}

function SummaryCard({
  label,
  value,
  note,
  tone = "white",
}: {
  label: string;
  value: string | number;
  note: string;
  tone?: "white" | "emerald" | "amber";
}) {
  const toneClass = {
    white: "text-white",
    emerald: "text-emerald-200",
    amber: "text-amber-200",
  }[tone];

  return (
    <div className="rounded-lg border border-white/12 bg-black/30 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">{label}</p>
      <p className={`mt-3 font-mono text-3xl font-black tabular-nums ${toneClass}`}>{value}</p>
      <p className="mt-2 text-xs leading-5 text-white/50">{note}</p>
    </div>
  );
}

export default async function Anniversary30thPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { campaign, participant, completedBattleCount, stats } = await loadPageState(user?.id);
  const startsAt = campaign?.starts_at || ANNIVERSARY_30TH_STARTS_AT;
  const endsAt = campaign?.ends_at || ANNIVERSARY_30TH_ENDS_AT;
  const battlesPerDay = campaign?.battles_per_day || ANNIVERSARY_30TH_BATTLES_PER_DAY;
  const started = isEventStarted(startsAt);
  const partner = participant?.partner_pokemon ? getPartnerPokemon(participant.partner_pokemon) : null;
  const teamPokemonIds = participant?.partner_pokemon
    ? Array.from(
        new Set([
          participant.partner_pokemon,
          ...(Array.isArray(participant.team_pokemon) ? participant.team_pokemon : []),
        ]),
      ).slice(0, PLAYER_TEAM_SELECTION_SIZE)
    : [];
  const battlesRemaining = resolveBattlesRemaining(participant, battlesPerDay);
  const eventPoints = calculateAnniversaryEventPoints(
    completedBattleCount,
    participant?.total_wins ?? 0,
  );
  const progressPct = Math.min(100, Math.round((eventPoints / ANNIVERSARY_30TH_EEVEE_POINT_GOAL) * 100));

  return (
    <div className="space-y-7 text-white">
      <section className="overflow-hidden rounded-lg border border-white/12 bg-[#101412]">
        <div className="grid gap-7 p-6 md:grid-cols-[1fr_auto] md:items-end md:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/75">
              {new Date(ANNIVERSARY_30TH_PREREG_STARTS_AT).toLocaleDateString("zh-TW", {
                timeZone: "Asia/Taipei",
              })}{" "}
              預先報名
            </p>
            <h1 className="mt-3 text-3xl font-black leading-tight md:text-5xl">
              {campaign?.title || defaultCampaignCopy.title}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
              {campaign?.description || defaultCampaignCopy.subtitle}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-white/65">
              <span className="rounded border border-white/12 px-3 py-1.5">
                {formatDateRange(startsAt, endsAt)}
              </span>
              <span className="rounded border border-white/12 px-3 py-1.5">
                {ANNIVERSARY_30TH_TOTAL_DAYS} 天，每天 {battlesPerDay} 場
              </span>
              <span className="rounded border border-white/12 px-3 py-1.5">
                勝 {ANNIVERSARY_30TH_WIN_POINTS} 分 / 敗 {ANNIVERSARY_30TH_LOSS_POINTS} 分
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-lg border border-emerald-300/20 bg-black/25 p-4">
            <img
              src={getPokemonSpriteUrl("133")}
              alt="伊布"
              className="h-24 w-24 object-contain"
            />
            <div>
              <p className="font-mono text-4xl font-black text-emerald-200">
                {ANNIVERSARY_30TH_EEVEE_POINT_GOAL}
              </p>
              <p className="text-sm text-white/55">分解鎖伊布配布資格</p>
            </div>
          </div>
        </div>
      </section>

      <RandomDistributionLiveStats
        baseDamage={stats.baseDamage}
        baseBattles={stats.completedBattles}
        highestWinStreak={stats.highestWinStreak}
        anchorIso={startsAt}
      />

      {!user ? (
        <section className="rounded-lg border border-amber-300/20 bg-black/30 p-8 text-center">
          <p className="text-white/70">請先登入，完成預先報名後即可選擇出場寶可夢。</p>
          <Link
            href="/login?redirect=/random-distribution"
            className="mt-5 inline-flex rounded bg-emerald-300 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-200"
          >
            登入後報名
          </Link>
        </section>
      ) : !campaign ? (
        <section className="rounded-lg border border-rose-400/25 bg-rose-500/10 p-8 text-center">
          <p className="text-rose-100">找不到活動資料。請先套用本次活動 migration。</p>
        </section>
      ) : !participant ? (
        <Anniversary30thJoinPanel />
      ) : !partner ? (
        <Anniversary30thPartnerSelect />
      ) : (
        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryCard
                label="今日剩餘"
                value={`${battlesRemaining} / ${battlesPerDay}`}
                note={`已完成 ${completedBattleCount} 場活動對戰`}
                tone={battlesRemaining > 0 ? "emerald" : "white"}
              />
              <SummaryCard
                label="目前積分"
                value={`${eventPoints}`}
                note={`距離伊布還差 ${Math.max(0, ANNIVERSARY_30TH_EEVEE_POINT_GOAL - eventPoints)} 分`}
                tone={eventPoints >= ANNIVERSARY_30TH_EEVEE_POINT_GOAL ? "emerald" : "amber"}
              />
              <SummaryCard
                label="連勝紀錄"
                value={participant.max_win_streak ?? 0}
                note={`目前連勝 ${participant.win_streak ?? 0} 場`}
              />
            </div>

            <div className="rounded-lg border border-white/12 bg-black/30 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white/55">伊布進度</p>
                  <p className="mt-2 font-mono text-3xl font-black tabular-nums">
                    {eventPoints}
                    <span className="text-base text-white/45"> / {ANNIVERSARY_30TH_EEVEE_POINT_GOAL}</span>
                  </p>
                </div>
                <p className="rounded border border-emerald-300/25 px-3 py-1.5 text-xs font-bold text-emerald-100">
                  {eventPoints >= ANNIVERSARY_30TH_EEVEE_POINT_GOAL ? "已達標" : `${progressPct}%`}
                </p>
              </div>
              <div className="mt-5 h-3 overflow-hidden rounded-sm bg-white/10">
                <div className="h-full bg-emerald-300" style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            {teamPokemonIds.length < PLAYER_TEAM_SELECTION_SIZE ? (
              <Anniversary30thPartnerSelect
                existingPartnerId={participant.partner_pokemon}
                initialTeamPokemon={teamPokemonIds}
              />
            ) : null}

            {!started ? (
              <Anniversary30thCountdown startsAt={startsAt} />
            ) : battlesRemaining > 0 ? (
              <Link
                href="/random-distribution/battle"
                className="inline-flex rounded bg-emerald-300 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-200"
              >
                參與戰鬥
              </Link>
            ) : (
              <div className="rounded-lg border border-white/12 bg-black/30 p-6 text-sm text-white/65">
                今日 2 場對戰已完成，明天 00:00 後會重新開放場次。
              </div>
            )}
          </div>

          <aside className="rounded-lg border border-white/12 bg-black/30 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200/70">
              出場隊伍
            </p>
            <div className="mt-5 grid gap-3">
              {teamPokemonIds.map((pokemonId, index) => {
                const teamPokemon = getPartnerPokemon(pokemonId);
                return (
                  <div
                    key={`${pokemonId}-${index}`}
                    className="flex items-center gap-4 rounded border border-white/10 bg-white/[0.03] p-3"
                  >
                    <img
                      src={getPokemonSpriteUrl(teamPokemon.sprite)}
                      alt={teamPokemon.name}
                      className="h-16 w-16 rounded bg-white/5 object-contain p-2"
                    />
                    <div>
                      <p className="text-lg font-black">{teamPokemon.name}</p>
                      <p className="mt-1 text-xs text-white/45">
                        {index === 0 ? "第一順位" : `第 ${index + 1} 順位`}
                      </p>
                    </div>
                  </div>
                );
              })}
              {Array.from({
                length: Math.max(0, PLAYER_TEAM_SELECTION_SIZE - teamPokemonIds.length),
              }).map((_, index) => (
                <div
                  key={`empty-slot-${index}`}
                  className="flex h-[92px] items-center rounded border border-dashed border-white/12 px-4 text-sm font-bold text-white/35"
                >
                  待補選
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-white/10 pt-5 text-sm leading-6 text-white/60">
              <p>
                已選 {teamPokemonIds.length} / {PLAYER_TEAM_SELECTION_SIZE} 隻。
              </p>
              <p className="mt-2">
                戰鬥會先以「你的稱呼的{partner.name}」出場，倒下後依隊伍順位接替。
              </p>
              <p className="mt-2">倒數內未選招式會直接以棄權敗場記錄。</p>
            </div>
          </aside>
        </section>
      )}
    </div>
  );
}
