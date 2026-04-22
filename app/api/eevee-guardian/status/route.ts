import { NextResponse } from "next/server";
import { resolveTaipeiDateKey } from "@/lib/eeveeGuardian";
import {
  buildCampaignPublicData,
  buildPlayerLiveProgress,
  ensurePlayer,
  getEeveeGuardianClients,
  getLiveMetrics,
  loadCampaign,
} from "@/app/api/eevee-guardian/_shared";

export const dynamic = "force-dynamic";

export async function GET() {
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
      tableReady: false,
      message: campaignResult.message,
      campaign: buildCampaignPublicData(campaign),
      player: null,
      live: {
        todayBattlers: 0,
        todayHighestDamage: 0,
        highestTotalDamage: 0,
        highestTotalDamageDisplayName: null,
      },
      pendingBattle: null,
      canBattleToday: false,
    });
  }

  const playerResult = await ensurePlayer(privilegedClient, campaign, user.id);
  const player = playerResult.data;

  if (!playerResult.tableReady) {
    return NextResponse.json({
      tableReady: false,
      message: playerResult.message,
      campaign: buildCampaignPublicData(campaign),
      player: buildPlayerLiveProgress(player, campaign),
      live: {
        todayBattlers: 0,
        todayHighestDamage: 0,
        highestTotalDamage: 0,
        highestTotalDamageDisplayName: null,
      },
      pendingBattle: null,
      canBattleToday: false,
    });
  }

  const todayKey = resolveTaipeiDateKey();
  const { data: pendingBattle } = await privilegedClient
    .from("eevee_guardian_battles")
    .select("id, created_at, metadata")
    .eq("campaign_id", campaign.id)
    .eq("player_id", player.id)
    .eq("battle_day", todayKey)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const live = await getLiveMetrics(privilegedClient, campaign);
  const playerProgress = buildPlayerLiveProgress(player, campaign);
  const campaignData = buildCampaignPublicData(campaign);

  return NextResponse.json({
    tableReady: true,
    message: null,
    campaign: campaignData,
    player: playerProgress,
    live,
    pendingBattle: pendingBattle || null,
    canBattleToday: campaignData.isActive && playerProgress.battlesRemainingToday > 0,
  });
}
