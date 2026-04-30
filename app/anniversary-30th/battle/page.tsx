import Link from "next/link";
import type { ReactNode } from "react";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/auth";
import {
  ANNIVERSARY_30TH_BATTLES_PER_DAY,
  ANNIVERSARY_30TH_EVENT_ID,
  ANNIVERSARY_30TH_SLUG,
  ANNIVERSARY_30TH_STARTS_AT,
  getPartnerPokemon,
  getPokemonSpriteUrl,
  isBattleSessionExpired,
  isEventStarted,
  resolveBattlesRemaining,
  type AnniversaryBattle,
  type AnniversaryCampaign,
  type AnniversaryParticipant,
} from "@/lib/anniversary30th";
import { Anniversary30thBattleConsole } from "@/components/Anniversary30thBattleConsole";
import { Anniversary30thCountdown } from "@/components/Anniversary30thCountdown";
import { NextResetCountdown } from "@/components/NextResetCountdown";

export const dynamic = "force-dynamic";

const PLAYER_TEAM_SELECTION_SIZE = 3;

type BattleState = {
  campaign: AnniversaryCampaign | null;
  participant: AnniversaryParticipant | null;
  battle: AnniversaryBattle | null;
  displayName: string;
};

type NoticeActionHref = "/random-distribution" | "/login?redirect=/random-distribution/battle";

type ProfileName = {
  full_name: string | null;
  username: string | null;
};

function resolvePlayerTeamPokemonIds(participant: AnniversaryParticipant) {
  return Array.from(
    new Set([
      participant.partner_pokemon,
      ...(Array.isArray(participant.team_pokemon) ? participant.team_pokemon : []),
    ].filter((pokemonId): pokemonId is string => typeof pokemonId === "string" && pokemonId.length > 0)),
  ).slice(0, PLAYER_TEAM_SELECTION_SIZE);
}

async function loadBattleState(userId?: string, fallbackEmail?: string | null): Promise<BattleState> {
  const adminSupabase = createAdminSupabaseClient();

  const { data: campaignData } = await adminSupabase
    .from("anniversary_campaigns")
    .select("*")
    .eq("slug", ANNIVERSARY_30TH_SLUG)
    .maybeSingle();

  const campaign = (campaignData || null) as AnniversaryCampaign | null;
  if (!campaign || !userId) {
    return {
      campaign,
      participant: null,
      battle: null,
      displayName: fallbackEmail?.split("@")[0] || "你",
    };
  }

  const { data: profileData } = await adminSupabase
    .from("profiles")
    .select("full_name, username")
    .eq("id", userId)
    .maybeSingle();

  const profile = (profileData || null) as ProfileName | null;
  const displayName = profile?.full_name || profile?.username || fallbackEmail?.split("@")[0] || "你";

  let { data: participantData } = await adminSupabase
    .from("anniversary_participants")
    .select("*")
    .eq("campaign_id", campaign.id)
    .eq("user_id", userId)
    .maybeSingle();

  let participant = (participantData || null) as AnniversaryParticipant | null;

  if (!participant) {
    const { data: registrationData } = await adminSupabase
      .from("registrations")
      .select("id")
      .eq("event_id", campaign.event_id || ANNIVERSARY_30TH_EVENT_ID)
      .eq("user_id", userId)
      .in("status", ["pending", "confirmed"])
      .maybeSingle();

    if (registrationData) {
      const now = new Date().toISOString();
      const { data: insertedParticipant } = await adminSupabase
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

      participant = (insertedParticipant || null) as AnniversaryParticipant | null;
      participantData = insertedParticipant;
    }
  }

  if (!participant) {
    return { campaign, participant: null, battle: null, displayName };
  }

  const { data: battleData } = await adminSupabase
    .from("anniversary_battles")
    .select("*")
    .eq("participant_id", participant.id)
    .in("status", ["pending", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let battle = (battleData || null) as AnniversaryBattle | null;
  const now = new Date().toISOString();

  if (battle && isBattleSessionExpired(battle.started_at || battle.last_active_at)) {
    await adminSupabase
      .from("anniversary_battles")
      .update({
        status: "lost",
        last_active_at: now,
        ended_at: now,
      })
      .eq("id", battle.id);

    const { data: refreshedParticipant } = await adminSupabase
      .from("anniversary_participants")
      .update({
        win_streak: 0,
      })
      .eq("id", participant.id)
      .select("*")
      .single();

    participant = (refreshedParticipant || participantData || participant) as AnniversaryParticipant;
    battle = null;
  } else if (battle) {
    const { data: refreshedBattle } = await adminSupabase
      .from("anniversary_battles")
      .update({ last_active_at: now })
      .eq("id", battle.id)
      .select("*")
      .single();

    battle = (refreshedBattle || battle) as AnniversaryBattle;
  }

  return { campaign, participant, battle, displayName };
}

function Notice({
  title,
  body,
  actionLabel = "返回活動頁",
  actionHref = "/random-distribution",
  status = "LINK CLOSED",
  children,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: NoticeActionHref;
  status?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative left-1/2 -my-10 -ml-[50vw] flex min-h-screen w-screen items-center justify-center overflow-hidden bg-[#050806] px-4 py-8 font-mono text-[#d7f7bf] md:-my-12">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(215,247,191,0.08)_1px,transparent_1px)] bg-[length:100%_5px] opacity-40" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(160,220,120,0.16),transparent_42%)]" />
      <div className="relative w-full max-w-2xl border-4 border-[#d7f7bf] bg-[#e6ffd1] p-2 text-[#172610] shadow-[0_0_0_6px_#172610,0_24px_80px_rgba(0,0,0,0.55)]">
        <div className="border-2 border-[#172610] bg-[#f7ffe9] p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between border-b-2 border-[#172610] pb-3 text-[10px] font-black uppercase tracking-[0.28em]">
            <span>CABLE CLUB</span>
            <span>{status}</span>
          </div>

          <div className="border-2 border-[#172610] bg-[#172610] p-4 text-[#d7f7bf] shadow-inner sm:p-6">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.36em]">LINK BATTLE</p>
            <h1 className="text-2xl font-black uppercase leading-tight sm:text-4xl">{title}</h1>
            <p className="mt-5 border-y border-[#d7f7bf]/45 py-4 text-sm font-bold leading-7 sm:text-base">
              {body}
            </p>
            {children ? <div className="mt-5 text-sm font-black">{children}</div> : null}
            <Link
              href={actionHref}
              className="mt-6 inline-flex border-2 border-[#d7f7bf] bg-[#d7f7bf] px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-[#172610] transition hover:bg-[#f7ffe9]"
            >
              {actionLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function Anniversary30thBattlePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Notice
        title="隨機對戰視窗"
        body="請先登入，才能進入活動對戰。"
        actionLabel="登入後進入"
        actionHref="/login?redirect=/random-distribution/battle"
      />
    );
  }

  const { campaign, participant, battle, displayName } = await loadBattleState(
    user.id,
    user.email,
  );

  if (!campaign) {
    return <Notice title="隨機對戰視窗" body="活動尚未建立，請先套用本次活動 migration。" />;
  }

  if (!participant) {
    return <Notice title="隨機對戰視窗" body="你尚未完成預先報名。" actionLabel="前往預先報名" />;
  }

  if (!participant.partner_pokemon) {
    return <Notice title="隨機對戰視窗" body="請先選擇一隻出場寶可夢。" actionLabel="前往選擇寶可夢" />;
  }

  const playerTeamPokemonIds = resolvePlayerTeamPokemonIds(participant);
  if (playerTeamPokemonIds.length < PLAYER_TEAM_SELECTION_SIZE) {
    return (
      <Notice
        title="TEAM SETUP"
        body="請先補滿 3 隻出場隊伍，再進入復古對戰。"
        actionLabel="返回隊伍選擇"
      />
    );
  }

  const startsAt = campaign.starts_at || ANNIVERSARY_30TH_STARTS_AT;
  const started = isEventStarted(startsAt);
  if (!started) {
    return (
      <Notice title="BATTLE LOCKED" body="活動尚未正式開戰。" status="STANDBY">
        <Anniversary30thCountdown startsAt={startsAt} />
      </Notice>
    );
  }

  const battlesPerDay = campaign.battles_per_day || ANNIVERSARY_30TH_BATTLES_PER_DAY;
  const battlesRemaining = resolveBattlesRemaining(participant, battlesPerDay);
  if (battlesRemaining <= 0 && !battle) {
    return (
      <Notice
        title="NO BATTLE LEFT"
        body="今日連線對戰已結束。下一次台北時間 00:00 重置後，才能重新進入匹配。"
        status="DAILY LIMIT"
      >
        <NextResetCountdown />
      </Notice>
    );
  }

  const partner = getPartnerPokemon(participant.partner_pokemon);

  return (
    <Anniversary30thBattleConsole
      partnerPokemon={partner}
      partnerSpriteUrl={getPokemonSpriteUrl(partner.sprite)}
      playerDisplayName={displayName}
      battlesRemaining={battlesRemaining}
      initialBattle={battle}
    />
  );
}
