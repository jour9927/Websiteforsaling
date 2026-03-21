import { NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/auth";
import {
  ANNIVERSARY_30TH_SLUG,
  CHALLENGE_META,
  generateScriptedOutcomes,
  resolveVirtualOpponent,
  resolveTaipeiDateKey,
  resolveNarrativeBattleDay,
  hashString,
  type AnniversaryBattle,
  type AnniversaryCampaign,
  type AnniversaryParticipant,
  type ChallengeType,
  type ScriptMode,
} from "@/lib/anniversary30th";

export const dynamic = "force-dynamic";

const CHALLENGE_TYPES: ChallengeType[] = ["dice", "trivia", "slots"];

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

  if (existingBattleData) {
    return NextResponse.json({
      battle: sanitizeBattleForClient(existingBattleData as AnniversaryBattle),
      resuming: true,
    });
  }

  // Check daily limit
  if (todayBattlesUsed >= campaign.battles_per_day) {
    return NextResponse.json({ error: "今天的對決場次已經用完了。" }, { status: 409 });
  }

  // Generate battle
  const battleSerial = participant.total_battles_used + 1;
  const seed = `${participant.id}:${battleSerial}:challenge`;
  const rngValue = hashString(seed);

  // Random challenge type
  const challengeType = CHALLENGE_TYPES[rngValue % CHALLENGE_TYPES.length];

  // Random script mode (A or B, balanced)
  const scriptMode: ScriptMode = rngValue % 2 === 0 ? "A" : "B";

  // Generate scripted outcomes (guaranteed user win)
  const scriptedOutcomes = generateScriptedOutcomes(challengeType, scriptMode, seed);

  // Generate virtual opponent
  const opponent = resolveVirtualOpponent(`${participant.id}:${battleSerial}:opponent`);

  // Calculate battle day
  const battleDay = resolveNarrativeBattleDay(
    participant.total_battles_used,
    campaign.battles_per_day,
    campaign.total_days,
  );
  const battleNo = (participant.total_battles_used % campaign.battles_per_day) + 1;

  // Insert battle
  const { data: battleData, error: battleError } = await adminSupabase
    .from("anniversary_battles")
    .insert({
      participant_id: participant.id,
      battle_day: battleDay,
      battle_no: battleNo,
      challenge_type: challengeType,
      script_mode: scriptMode,
      scripted_outcomes: JSON.stringify(scriptedOutcomes),
      opponent_name: opponent.name,
      opponent_pokemon: opponent.pokemon,
      opponent_sprite_id: opponent.spriteId,
      status: "pending",
      current_round: 0,
      player_score: 0,
      opponent_score: 0,
      started_at: new Date().toISOString(),
      template_code: null,
      final_tug_position: 0,
    })
    .select("*")
    .single();

  if (battleError || !battleData) {
    return NextResponse.json({ error: battleError?.message || "無法建立對戰" }, { status: 500 });
  }

  // Update participant counters
  await adminSupabase
    .from("anniversary_participants")
    .update({
      total_battles_used: participant.total_battles_used + 1,
      today_battles_used: todayBattlesUsed + 1,
      last_battle_day: todayKey,
    })
    .eq("id", participant.id);

  return NextResponse.json({
    battle: sanitizeBattleForClient(battleData as AnniversaryBattle),
    challengeMeta: CHALLENGE_META[challengeType],
    resuming: false,
  });
}
