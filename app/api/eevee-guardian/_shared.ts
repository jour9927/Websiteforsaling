import type { SupabaseClient } from "@supabase/supabase-js";
import {
  EEVEE_GUARDIAN_SLUG,
  buildPlayerPublicProgress,
  buildBattleSeed,
  normalizeCampaignRow,
  normalizePlayerRow,
  resolveCampaignState,
  resolveTaipeiDateKey,
  toSafeNumber,
  type EeveeGuardianCampaignRow,
  type EeveeGuardianLiveMetrics,
  type EeveeGuardianPlayerRow,
} from "@/lib/eeveeGuardian";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/auth";

type TableGuardResult<T> = {
  tableReady: boolean;
  message: string | null;
  data: T;
};

function looksLikeMissingTable(message: string) {
  const lower = message.toLowerCase();
  return lower.includes("does not exist") || lower.includes("relation") || lower.includes("42p01");
}

export function getEeveeGuardianClients() {
  const userClient = createServerSupabaseClient();
  const privilegedClient = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminSupabaseClient()
    : userClient;

  return { userClient, privilegedClient };
}

export async function loadCampaign(
  client: SupabaseClient,
): Promise<TableGuardResult<EeveeGuardianCampaignRow>> {
  const { data, error } = await client
    .from("eevee_guardian_campaigns")
    .select("*")
    .eq("slug", EEVEE_GUARDIAN_SLUG)
    .maybeSingle();

  if (error) {
    if (looksLikeMissingTable(error.message)) {
      return {
        tableReady: false,
        message: "缺少 eevee_guardian_* 資料表，請先執行 migration。",
        data: normalizeCampaignRow(null),
      };
    }

    console.error("[eevee-guardian] loadCampaign error", error);
    return {
      tableReady: false,
      message: error.message,
      data: normalizeCampaignRow(null),
    };
  }

  return {
    tableReady: true,
    message: null,
    data: normalizeCampaignRow(data as Partial<EeveeGuardianCampaignRow> | null),
  };
}

export async function ensurePlayer(
  client: SupabaseClient,
  campaign: EeveeGuardianCampaignRow,
  userId: string,
): Promise<TableGuardResult<EeveeGuardianPlayerRow>> {
  const todayKey = resolveTaipeiDateKey();

  const { data, error } = await client
    .from("eevee_guardian_players")
    .select("*")
    .eq("campaign_id", campaign.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (looksLikeMissingTable(error.message)) {
      return {
        tableReady: false,
        message: "缺少 eevee_guardian_players 資料表，請先執行 migration。",
        data: normalizePlayerRow(userId, campaign.id),
      };
    }

    console.error("[eevee-guardian] ensurePlayer select error", error);
    return {
      tableReady: false,
      message: error.message,
      data: normalizePlayerRow(userId, campaign.id),
    };
  }

  let player = normalizePlayerRow(userId, campaign.id, data as Partial<EeveeGuardianPlayerRow> | null);

  if (!data) {
    const { data: inserted, error: insertError } = await client
      .from("eevee_guardian_players")
      .insert({
        campaign_id: campaign.id,
        user_id: userId,
        total_points: 0,
        total_battles: 0,
        total_wins: 0,
        total_losses: 0,
        total_damage: 0,
        medals_collected: 0,
        last_battle_day: null,
        today_battles_used: 0,
        rare_reward_unlocked: false,
      })
      .select("*")
      .single();

    if (insertError) {
      if (looksLikeMissingTable(insertError.message)) {
        return {
          tableReady: false,
          message: "缺少 eevee_guardian_players 資料表，請先執行 migration。",
          data: player,
        };
      }

      console.error("[eevee-guardian] ensurePlayer insert error", insertError);
      return {
        tableReady: false,
        message: insertError.message,
        data: player,
      };
    }

    player = normalizePlayerRow(userId, campaign.id, inserted as Partial<EeveeGuardianPlayerRow>);
  }

  if (player.last_battle_day !== todayKey && player.today_battles_used > 0) {
    const { error: resetError } = await client
      .from("eevee_guardian_players")
      .update({
        today_battles_used: 0,
        last_battle_day: todayKey,
        updated_at: new Date().toISOString(),
      })
      .eq("id", player.id);

    if (!resetError) {
      player.today_battles_used = 0;
      player.last_battle_day = todayKey;
    } else {
      console.warn("[eevee-guardian] reset daily count failed", resetError.message);
    }
  }

  return {
    tableReady: true,
    message: null,
    data: player,
  };
}

export async function getLiveMetrics(
  client: SupabaseClient,
  campaign: EeveeGuardianCampaignRow,
): Promise<EeveeGuardianLiveMetrics> {
  const todayKey = resolveTaipeiDateKey();

  const { count } = await client
    .from("eevee_guardian_battles")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaign.id)
    .eq("battle_day", todayKey)
    .neq("status", "cancelled");

  const { data: todayTopDamageRow } = await client
    .from("eevee_guardian_battles")
    .select("player_damage")
    .eq("campaign_id", campaign.id)
    .eq("battle_day", todayKey)
    .order("player_damage", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: totalTopRow } = await client
    .from("eevee_guardian_players")
    .select("user_id, total_damage")
    .eq("campaign_id", campaign.id)
    .order("total_damage", { ascending: false })
    .limit(1)
    .maybeSingle();

  let highestTotalDamageDisplayName: string | null = null;
  if (totalTopRow?.user_id) {
    const { data: profile } = await client
      .from("profiles")
      .select("full_name, username")
      .eq("id", totalTopRow.user_id)
      .maybeSingle();

    highestTotalDamageDisplayName =
      profile?.full_name || profile?.username || null;
  }

  return {
    todayBattlers: count || 0,
    todayHighestDamage: Number(toSafeNumber(todayTopDamageRow?.player_damage, 0)),
    highestTotalDamage: Number(toSafeNumber(totalTopRow?.total_damage, 0)),
    highestTotalDamageDisplayName,
  };
}

export function buildCampaignPublicData(campaign: EeveeGuardianCampaignRow) {
  const state = resolveCampaignState(campaign);

  return {
    id: campaign.id,
    slug: campaign.slug,
    title: campaign.title,
    startsAt: state.startsAt,
    endsAt: state.endsAt,
    totalDays: campaign.total_days,
    dailyBattles: campaign.daily_battles,
    winPoints: campaign.win_points,
    losePoints: campaign.lose_points,
    targetMedals: campaign.target_medals,
    rareRewardName: campaign.rare_reward_name,
    isActive: state.isActive,
    hasEnded: state.hasEnded,
    isUpcoming: state.isUpcoming,
    daysElapsed: state.daysElapsed,
    daysRemaining: state.daysRemaining,
  };
}

export function buildPlayerLiveProgress(player: EeveeGuardianPlayerRow, campaign: EeveeGuardianCampaignRow) {
  return buildPlayerPublicProgress(player, campaign);
}

export function buildDefaultBattleMetadata(userId: string) {
  const todayKey = resolveTaipeiDateKey();

  return {
    seed: buildBattleSeed(userId, todayKey),
    engine: "gen3-live-mvp",
    mode: "single-quick-match",
    tags: ["RSE", "FRLG", "Battle Frontier"],
  };
}
