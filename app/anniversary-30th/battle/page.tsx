import Link from "next/link";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/auth";
import {
  ANNIVERSARY_30TH_BATTLES_PER_DAY,
  ANNIVERSARY_30TH_EEVEE_POINT_GOAL,
  ANNIVERSARY_30TH_EVENT_ID,
  ANNIVERSARY_30TH_SLUG,
  ANNIVERSARY_30TH_STARTS_AT,
  calculateAnniversaryEventPoints,
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

export const dynamic = "force-dynamic";

type BattleState = {
  campaign: AnniversaryCampaign | null;
  participant: AnniversaryParticipant | null;
  battle: AnniversaryBattle | null;
  completedBattleCount: number;
  displayName: string;
};

type NoticeActionHref = "/random-distribution" | "/login?redirect=/random-distribution/battle";

type ProfileName = {
  full_name: string | null;
  username: string | null;
};

async function countCompletedBattles(participantId: string) {
  const adminSupabase = createAdminSupabaseClient();
  const { count } = await adminSupabase
    .from("anniversary_battles")
    .select("id", { count: "exact", head: true })
    .eq("participant_id", participantId)
    .in("status", ["won", "lost"]);

  return count ?? 0;
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
      completedBattleCount: 0,
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
    return { campaign, participant: null, battle: null, completedBattleCount: 0, displayName };
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

  if (battle && isBattleSessionExpired(battle.last_active_at || battle.started_at)) {
    await adminSupabase
      .from("anniversary_battles")
      .update({
        status: "lost",
        last_active_at: now,
        ended_at: now,
      })
      .eq("id", battle.id);

    const completedAfterLoss = await countCompletedBattles(participant.id);
    const pointsAfterLoss = calculateAnniversaryEventPoints(completedAfterLoss, participant.total_wins ?? 0);

    const { data: refreshedParticipant } = await adminSupabase
      .from("anniversary_participants")
      .update({
        win_streak: 0,
        partner_unlocked: participant.partner_unlocked || pointsAfterLoss >= ANNIVERSARY_30TH_EEVEE_POINT_GOAL,
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

  const completedBattleCount = await countCompletedBattles(participant.id);

  return { campaign, participant, battle, completedBattleCount, displayName };
}

function Notice({
  title,
  body,
  actionLabel = "返回活動頁",
  actionHref = "/random-distribution",
}: {
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: NoticeActionHref;
}) {
  return (
    <div className="rounded-lg border border-white/12 bg-black/30 p-8 text-center text-white">
      <h1 className="text-3xl font-black">{title}</h1>
      <p className="mt-4 text-sm leading-6 text-white/65">{body}</p>
      <Link
        href={actionHref}
        className="mt-6 inline-flex rounded bg-emerald-300 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-200"
      >
        {actionLabel}
      </Link>
    </div>
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

  const { campaign, participant, battle, completedBattleCount, displayName } = await loadBattleState(
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

  const startsAt = campaign.starts_at || ANNIVERSARY_30TH_STARTS_AT;
  const started = isEventStarted(startsAt);
  if (!started) {
    return (
      <div className="space-y-5 text-white">
        <Notice title="隨機對戰視窗" body="活動尚未正式開戰。" />
        <Anniversary30thCountdown startsAt={startsAt} />
      </div>
    );
  }

  const battlesPerDay = campaign.battles_per_day || ANNIVERSARY_30TH_BATTLES_PER_DAY;
  const battlesRemaining = resolveBattlesRemaining(participant, battlesPerDay);
  if (battlesRemaining <= 0 && !battle) {
    return (
      <Notice
        title="今日對戰已完成"
        body="每天最多可打兩場。明天 00:00 後會重新開放場次。"
      />
    );
  }

  const partner = getPartnerPokemon(participant.partner_pokemon);
  const eventPoints = calculateAnniversaryEventPoints(completedBattleCount, participant.total_wins ?? 0);

  return (
    <Anniversary30thBattleConsole
      partnerPokemon={partner}
      partnerSpriteUrl={getPokemonSpriteUrl(partner.sprite)}
      playerDisplayName={displayName}
      battlesRemaining={battlesRemaining}
      totalWins={participant.total_wins ?? 0}
      winStreak={participant.win_streak ?? 0}
      initialBattle={battle}
      initialEventPoints={eventPoints}
    />
  );
}
