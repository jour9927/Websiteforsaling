import { NextResponse } from "next/server";
import { clamp, resolveMedalsFromPoints } from "@/lib/eeveeGuardian";
import {
  buildCampaignPublicData,
  buildPlayerLiveProgress,
  ensurePlayer,
  getEeveeGuardianClients,
  loadCampaign,
} from "@/app/api/eevee-guardian/_shared";

type ResolveBody = {
  battleId?: string;
  result?: "won" | "lost";
  playerDamage?: number;
  opponentDamage?: number;
  turns?: number;
  eventLog?: string[];
};

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { userClient, privilegedClient } = getEeveeGuardianClients();
  const {
    data: { user },
  } = await userClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as ResolveBody;
  const battleId = typeof payload.battleId === "string" ? payload.battleId : "";
  const result = payload.result;

  if (!battleId || (result !== "won" && result !== "lost")) {
    return NextResponse.json({ error: "battleId 與 result 為必填" }, { status: 400 });
  }

  const campaignResult = await loadCampaign(privilegedClient);
  const campaign = campaignResult.data;

  if (!campaignResult.tableReady) {
    return NextResponse.json({
      error: campaignResult.message || "活動資料尚未準備完成",
    }, { status: 503 });
  }

  const playerResult = await ensurePlayer(privilegedClient, campaign, user.id);
  const player = playerResult.data;

  if (!playerResult.tableReady) {
    return NextResponse.json({
      error: playerResult.message || "玩家資料尚未準備完成",
    }, { status: 503 });
  }

  const { data: battle, error: battleError } = await privilegedClient
    .from("eevee_guardian_battles")
    .select("id, status, battle_day, created_at")
    .eq("id", battleId)
    .eq("campaign_id", campaign.id)
    .eq("player_id", player.id)
    .maybeSingle();

  if (battleError) {
    return NextResponse.json({ error: battleError.message }, { status: 500 });
  }

  if (!battle) {
    return NextResponse.json({ error: "找不到這場對戰" }, { status: 404 });
  }

  if (battle.status === "won" || battle.status === "lost") {
    return NextResponse.json({
      duplicate: true,
      campaign: buildCampaignPublicData(campaign),
      player: buildPlayerLiveProgress(player, campaign),
    });
  }

  const pointsAwarded = result === "won" ? campaign.win_points : campaign.lose_points;
  const playerDamage = clamp(Math.floor(Number(payload.playerDamage || 0)), 0, 9999);
  const opponentDamage = clamp(Math.floor(Number(payload.opponentDamage || 0)), 0, 9999);
  const turns = clamp(Math.floor(Number(payload.turns || 1)), 1, 24);

  const metadata = {
    engine: "gen3-live-mvp",
    resolvedAt: new Date().toISOString(),
    eventLog: Array.isArray(payload.eventLog) ? payload.eventLog.slice(-40) : [],
  };

  const { error: updateBattleError } = await privilegedClient
    .from("eevee_guardian_battles")
    .update({
      status: result,
      points_awarded: pointsAwarded,
      player_damage: playerDamage,
      opponent_damage: opponentDamage,
      turns,
      metadata,
    })
    .eq("id", battle.id);

  if (updateBattleError) {
    return NextResponse.json({ error: updateBattleError.message }, { status: 500 });
  }

  const nextTotalPoints = Number((player.total_points + pointsAwarded).toFixed(1));
  const nextTotalWins = player.total_wins + (result === "won" ? 1 : 0);
  const nextTotalLosses = player.total_losses + (result === "lost" ? 1 : 0);
  const nextTotalDamage = player.total_damage + playerDamage;
  const nextMedals = resolveMedalsFromPoints(nextTotalPoints, campaign.target_medals);
  const rareRewardUnlocked = player.rare_reward_unlocked || nextMedals >= campaign.target_medals;

  const { error: updatePlayerError } = await privilegedClient
    .from("eevee_guardian_players")
    .update({
      total_points: nextTotalPoints,
      total_wins: nextTotalWins,
      total_losses: nextTotalLosses,
      total_damage: nextTotalDamage,
      medals_collected: nextMedals,
      rare_reward_unlocked: rareRewardUnlocked,
      updated_at: new Date().toISOString(),
    })
    .eq("id", player.id);

  if (updatePlayerError) {
    return NextResponse.json({ error: updatePlayerError.message }, { status: 500 });
  }

  const updatedPlayer = {
    ...player,
    total_points: nextTotalPoints,
    total_wins: nextTotalWins,
    total_losses: nextTotalLosses,
    total_damage: nextTotalDamage,
    medals_collected: nextMedals,
    rare_reward_unlocked: rareRewardUnlocked,
  };

  return NextResponse.json({
    battle: {
      id: battle.id,
      result,
      pointsAwarded,
      playerDamage,
      opponentDamage,
      turns,
    },
    campaign: buildCampaignPublicData(campaign),
    player: buildPlayerLiveProgress(updatedPlayer, campaign),
  });
}
