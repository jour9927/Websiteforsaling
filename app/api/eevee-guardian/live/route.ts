import { NextResponse } from "next/server";
import {
  buildCampaignPublicData,
  getEeveeGuardianClients,
  getLiveMetrics,
  loadCampaign,
} from "@/app/api/eevee-guardian/_shared";

export const dynamic = "force-dynamic";

export async function GET() {
  const { privilegedClient } = getEeveeGuardianClients();
  const campaignResult = await loadCampaign(privilegedClient);
  const campaign = campaignResult.data;
  const live = campaignResult.tableReady
    ? await getLiveMetrics(privilegedClient, campaign)
    : {
        todayBattlers: 0,
        todayHighestDamage: 0,
        highestTotalDamage: 0,
        highestTotalDamageDisplayName: null,
      };

  return NextResponse.json({
    tableReady: campaignResult.tableReady,
    message: campaignResult.message,
    campaign: buildCampaignPublicData(campaign),
    live,
  });
}
