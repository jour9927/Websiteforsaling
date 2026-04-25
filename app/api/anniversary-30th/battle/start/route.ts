import { NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/auth";
import {
  ANNIVERSARY_30TH_EEVEE_POINT_GOAL,
  ANNIVERSARY_30TH_SLUG,
  CHALLENGE_META,
  RETRO_MAX_HP,
  RETRO_MOVE_PP,
  RETRO_OPPONENT_TEAM_SIZE,
  RETRO_TEAM_SIZE,
  calculateAnniversaryEventPoints,
  generateRetroOpponentLineup,
  generateScriptedOutcomes,
  getRetroPartnerType,
  isBattleSessionExpired,
  resolveTaipeiDateKey,
  resolveNarrativeBattleDay,
  hashString,
  type AnniversaryBattle,
  type AnniversaryCampaign,
  type AnniversaryParticipant,
  type ChallengeType,
  type PartnerPokemonId,
  type RetroBattleState,
  type ScriptMode,
} from "@/lib/anniversary30th";

export const dynamic = "force-dynamic";

const CHALLENGE_TYPES: ChallengeType[] = ["retro"];

async function countCompletedBattles(
  adminSupabase: ReturnType<typeof createAdminSupabaseClient>,
  participantId: string,
) {
  const { count } = await adminSupabase
    .from("anniversary_battles")
    .select("id", { count: "exact", head: true })
    .eq("participant_id", participantId)
    .in("status", ["won", "lost"]);

  return count ?? 0;
}

function sanitizeBattleForClient(battle: AnniversaryBattle): Partial<AnniversaryBattle> {
  // Hide scripted data from client
  return {
    ...battle,
    scripted_outcomes: [], // never expose script to client
    script_mode: "A" as ScriptMode, // hide real mode
  };
}

export async function POST() {
  const supabase = createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Load campaign
  const { data: campaignData } = await supabase
    .from("anniversary_campaigns")
    .select("*")
    .eq("slug", ANNIVERSARY_30TH_SLUG)
    .maybeSingle();

  const campaign = (campaignData || null) as AnniversaryCampaign | null;
  if (!campaign) {
    return NextResponse.json({ error: "活動尚未建立。" }, { status: 503 });
  }

  // Check event started
  if (campaign.starts_at && new Date() < new Date(campaign.starts_at)) {
    return NextResponse.json({ error: "活動尚未開始。" }, { status: 403 });
  }

  // Load participant
  const { data: participantData } = await supabase
    .from("anniversary_participants")
    .select("*")
    .eq("campaign_id", campaign.id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  const participant = (participantData || null) as AnniversaryParticipant | null;
  if (!participant) {
    return NextResponse.json({ error: "你尚未報名此活動。" }, { status: 404 });
  }

  if (!participant.partner_pokemon) {
    return NextResponse.json({ error: "請先選擇你的攜帶伴侶寶可夢。" }, { status: 400 });
  }

  // Reset daily counter if new day
  const todayKey = resolveTaipeiDateKey();
  let todayBattlesUsed = participant.today_battles_used;

  if (participant.last_battle_day !== todayKey) {
    todayBattlesUsed = 0;
    await adminSupabase
      .from("anniversary_participants")
      .update({ today_battles_used: 0, last_battle_day: todayKey })
      .eq("id", participant.id);
  }

  // Check for existing in-progress battle
  const { data: existingBattleData } = await supabase
    .from("anniversary_battles")
    .select("*")
    .eq("participant_id", participant.id)
    .in("status", ["pending", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let expiredPreviousBattle = false;
  const existingBattle = (existingBattleData || null) as AnniversaryBattle | null;
  const now = new Date().toISOString();

  if (existingBattle && isBattleSessionExpired(existingBattle.last_active_at || existingBattle.started_at)) {
    expiredPreviousBattle = true;
    await adminSupabase
      .from("anniversary_battles")
      .update({
        status: "lost",
        last_active_at: now,
        ended_at: now,
      })
      .eq("id", existingBattle.id);
    const completedBattles = await countCompletedBattles(adminSupabase, participant.id);
    const eventPoints = calculateAnniversaryEventPoints(completedBattles, participant.total_wins ?? 0);
    await adminSupabase
      .from("anniversary_participants")
      .update({
        win_streak: 0,
        partner_unlocked: participant.partner_unlocked || eventPoints >= ANNIVERSARY_30TH_EEVEE_POINT_GOAL,
      })
      .eq("id", participant.id);
  } else if (existingBattle) {
    const { data: resumedBattleData } = await adminSupabase
      .from("anniversary_battles")
      .update({
        last_active_at: now,
      })
      .eq("id", existingBattle.id)
      .select("*")
      .single();

    const resumedBattle = (resumedBattleData || existingBattle) as AnniversaryBattle;
    return NextResponse.json({
      battle: sanitizeBattleForClient(resumedBattle),
      challengeMeta: CHALLENGE_META[resumedBattle.challenge_type],
      resuming: true,
    });
  }

  // Check daily limit
  if (todayBattlesUsed >= campaign.battles_per_day) {
    return NextResponse.json({
      error: expiredPreviousBattle
        ? "上一場對決已逾時結束，今天的對決場次也已經用完了。"
        : "今天的對決場次已經用完了。",
    }, { status: 409 });
  }

  // Count actual battles in DB for this participant to avoid unique constraint issues
  const { count: actualBattleCount } = await adminSupabase
    .from("anniversary_battles")
    .select("*", { count: "exact", head: true })
    .eq("participant_id", participant.id);

  const safeTotalUsed = Math.max(participant.total_battles_used, actualBattleCount ?? 0);

  // Generate battle
  const battleSerial = safeTotalUsed + 1;
  const seed = `${participant.id}:${battleSerial}:challenge`;
  const rngValue = hashString(seed);

  // Random Distribution currently uses the retro battle flow.
  const challengeType = CHALLENGE_TYPES[rngValue % CHALLENGE_TYPES.length];

  // Random script mode (A or B, balanced)
  const scriptMode: ScriptMode = rngValue % 2 === 0 ? "A" : "B";

  // Generate deterministic round outcomes (legacy scripted path; 1gen path 不讀但保留供舊 battle).
  const scriptedOutcomes = generateScriptedOutcomes(challengeType, scriptMode, seed);

  // 1gen 對戰：產 3 隻對手 lineup（取代原本單一 opponent）
  const opponentLineup = generateRetroOpponentLineup(
    `${participant.id}:${battleSerial}:lineup`,
    RETRO_OPPONENT_TEAM_SIZE,
  );
  const firstOpponent = opponentLineup[0];

  // 1gen battle_state — 玩家隊伍從 participant.team_pokemon（已 backfill 至少 [partner_pokemon]）
  const teamSource: string[] =
    Array.isArray(participant.team_pokemon) && participant.team_pokemon.length > 0
      ? participant.team_pokemon
      : [participant.partner_pokemon as string];
  const playerTeamIds = teamSource.slice(0, RETRO_TEAM_SIZE);
  const battleState: RetroBattleState = {
    player: {
      team: playerTeamIds.map((id) => ({
        id,
        type: getRetroPartnerType(id as PartnerPokemonId),
        hp: RETRO_MAX_HP,
        maxHp: RETRO_MAX_HP,
        fainted: false,
      })),
      activeIndex: 0,
      pp: { ...RETRO_MOVE_PP },
    },
    opponent: {
      team: opponentLineup.map((o) => ({
        id: o.spriteId,
        type: o.type,
        hp: RETRO_MAX_HP,
        maxHp: RETRO_MAX_HP,
        fainted: false,
      })),
      activeIndex: 0,
    },
    rngSeed: seed,
    turn: 0,
  };

  // Calculate battle day (no cap to avoid collisions)
  const battleDay = resolveNarrativeBattleDay(
    safeTotalUsed,
    campaign.battles_per_day,
  );

  // Insert battle with retry loop to handle unique constraint collisions
  let battleData: Record<string, unknown> | null = null;
  let battleError: { message: string; code?: string } | null = null;
  const MAX_RETRIES = 5;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // Query actual max battle_no for this participant+day
    const { data: maxRow } = await adminSupabase
      .from("anniversary_battles")
      .select("battle_no")
      .eq("participant_id", participant.id)
      .eq("battle_day", battleDay)
      .order("battle_no", { ascending: false })
      .limit(1)
      .maybeSingle();

    const battleNo = (maxRow?.battle_no ?? 0) + 1;

    const { data, error } = await adminSupabase
      .from("anniversary_battles")
      .insert({
        participant_id: participant.id,
        battle_day: battleDay,
        battle_no: battleNo,
        challenge_type: challengeType,
        script_mode: scriptMode,
        scripted_outcomes: JSON.stringify(scriptedOutcomes),
        // opponent_* 顯示為 lineup 第 1 隻（向後兼容 UI 顯示）
        opponent_name: firstOpponent.name,
        opponent_pokemon: firstOpponent.pokemon,
        opponent_sprite_id: firstOpponent.spriteId,
        status: "pending",
        current_round: 0,
        player_score: 0,
        opponent_score: 0,
        started_at: now,
        last_active_at: now,
        template_code: null,
        final_tug_position: 0,
        battle_state: battleState,
      })
      .select("*")
      .single();

    if (!error && data) {
      battleData = data;
      battleError = null;
      break;
    }

    // If not a duplicate key error, don't retry
    if (error?.code !== "23505") {
      battleError = error;
      break;
    }

    // Duplicate key — loop will re-query max and retry with a higher battle_no
    battleError = error;
  }

  if (battleError || !battleData) {
    return NextResponse.json({ error: battleError?.message || "無法建立對戰" }, { status: 500 });
  }

  // Update participant counters
  await adminSupabase
    .from("anniversary_participants")
    .update({
      total_battles_used: safeTotalUsed + 1,
      today_battles_used: todayBattlesUsed + 1,
      last_battle_day: todayKey,
    })
    .eq("id", participant.id);

  return NextResponse.json({
    battle: sanitizeBattleForClient(battleData as AnniversaryBattle),
    challengeMeta: CHALLENGE_META[challengeType],
    expiredPreviousBattle,
    resuming: false,
  });
}
