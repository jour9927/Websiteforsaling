import { NextResponse } from "next/server";
import { resolveTaipeiDateKey } from "@/lib/eeveeGuardian";
import {
  buildCampaignPublicData,
  buildDefaultBattleMetadata,
  buildPlayerLiveProgress,
  ensurePlayer,
  getEeveeGuardianClients,
  loadCampaign,
} from "@/app/api/eevee-guardian/_shared";

export const dynamic = "force-dynamic";

export async function POST() {
  const { userClient, privilegedClient } = getEeveeGuardianClients();
  const {
    data: { user },
  } = await userClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const campaignResult = await loadCampaign(privilegedClient);
  const campaign = campaignResult.data;

  if (!campaignResult.tableReady) {
    return NextResponse.json({
      error: campaignResult.message || "活動資料尚未準備完成",
    }, { status: 503 });
  }

  const campaignData = buildCampaignPublicData(campaign);
  if (!campaignData.isActive) {
    return NextResponse.json({
      error: campaignData.hasEnded ? "活動已結束" : "活動尚未開始",
      campaign: campaignData,
    }, { status: 403 });
  }

  const playerResult = await ensurePlayer(privilegedClient, campaign, user.id);
  const player = playerResult.data;

  if (!playerResult.tableReady) {
    return NextResponse.json({
      error: playerResult.message || "玩家資料尚未準備完成",
    }, { status: 503 });
  }

  const playerProgress = buildPlayerLiveProgress(player, campaign);
  if (playerProgress.battlesRemainingToday <= 0) {
    return NextResponse.json({
      error: "今天已完成對戰，請明天再來",
      campaign: campaignData,
      player: playerProgress,
    }, { status: 409 });
  }

  const todayKey = resolveTaipeiDateKey();

  const { data: existingBattle } = await privilegedClient
    .from("eevee_guardian_battles")
    .select("id, status, battle_day, created_at, metadata")
    .eq("campaign_id", campaign.id)
    .eq("player_id", player.id)
    .eq("battle_day", todayKey)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingBattle) {
    if (existingBattle.status === "pending") {
      return NextResponse.json({
        battleId: existingBattle.id,
        battleDay: existingBattle.battle_day,
        metadata: existingBattle.metadata || buildDefaultBattleMetadata(user.id),
        campaign: campaignData,
        player: playerProgress,
        resuming: true,
      });
    }

    return NextResponse.json({
      error: "你今天已完成對戰",
      campaign: campaignData,
      player: playerProgress,
    }, { status: 409 });
  }

  const metadata = buildDefaultBattleMetadata(user.id);

  const { data: insertedBattle, error: insertError } = await privilegedClient
    .from("eevee_guardian_battles")
    .insert({
      campaign_id: campaign.id,
      player_id: player.id,
      user_id: user.id,
      battle_day: todayKey,
      status: "pending",
      points_awarded: 0,
      player_damage: 0,
      opponent_damage: 0,
      turns: 0,
      metadata,
    })
    .select("id, battle_day, metadata")
    .single();

  if (insertError) {
    const isUniqueConflict = insertError.code === "23505";
    if (isUniqueConflict) {
      const { data: conflictBattle } = await privilegedClient
        .from("eevee_guardian_battles")
        .select("id, battle_day, status, metadata")
        .eq("campaign_id", campaign.id)
        .eq("player_id", player.id)
        .eq("battle_day", todayKey)
        .maybeSingle();

      if (conflictBattle?.status === "pending") {
        return NextResponse.json({
          battleId: conflictBattle.id,
          battleDay: conflictBattle.battle_day,
          metadata: conflictBattle.metadata || metadata,
          campaign: campaignData,
          player: playerProgress,
          resuming: true,
        });
      }
    }

    console.error("[eevee-guardian] start battle insert error", insertError);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const nextTotalBattles = player.total_battles + 1;
  const nextTodayUsed = player.today_battles_used + 1;

  const { error: updatePlayerError } = await privilegedClient
    .from("eevee_guardian_players")
    .update({
      total_battles: nextTotalBattles,
      today_battles_used: nextTodayUsed,
      last_battle_day: todayKey,
      updated_at: new Date().toISOString(),
    })
    .eq("id", player.id);

  if (updatePlayerError) {
    console.error("[eevee-guardian] update player after start error", updatePlayerError);
  }

  return NextResponse.json({
    battleId: insertedBattle.id,
    battleDay: insertedBattle.battle_day,
    metadata: insertedBattle.metadata || metadata,
    campaign: campaignData,
    player: {
      ...playerProgress,
      totalBattles: nextTotalBattles,
      todayBattlesUsed: nextTodayUsed,
      battlesRemainingToday: Math.max(0, campaign.daily_battles - nextTodayUsed),
    },
    resuming: false,
  });
}
