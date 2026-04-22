export const EEVEE_GUARDIAN_SLUG = "eevee-medal-guardians";

export const EEVEE_GUARDIAN_DEFAULT_CONFIG = {
  title: "勳章型伊布蒐集控系列護衛活動",
  startsAt: "2026-04-22T00:00:00+08:00",
  endsAt: "2026-04-30T23:59:59+08:00",
  totalDays: 9,
  dailyBattles: 1,
  winPoints: 1,
  losePoints: 0.5,
  targetMedals: 9,
  rareRewardName: "五種勳章以上稀有伊布",
} as const;

export type EeveeGuardianCampaignRow = {
  id: string;
  slug: string;
  title: string;
  starts_at: string;
  ends_at: string;
  total_days: number;
  daily_battles: number;
  win_points: number;
  lose_points: number;
  target_medals: number;
  rare_reward_name: string;
  is_active: boolean;
};

export type EeveeGuardianPlayerRow = {
  id: string;
  campaign_id: string;
  user_id: string;
  total_points: number;
  total_battles: number;
  total_wins: number;
  total_losses: number;
  total_damage: number;
  medals_collected: number;
  last_battle_day: string | null;
  today_battles_used: number;
  rare_reward_unlocked: boolean;
};

export type EeveeGuardianBattleRow = {
  id: string;
  campaign_id: string;
  player_id: string;
  user_id: string;
  battle_day: string;
  status: "pending" | "won" | "lost" | "cancelled";
  points_awarded: number;
  player_damage: number;
  opponent_damage: number;
  turns: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type EeveeGuardianLiveMetrics = {
  todayBattlers: number;
  todayHighestDamage: number;
  highestTotalDamage: number;
  highestTotalDamageDisplayName: string | null;
};

export const GEN3_THEME_TAGS = ["RSE", "FRLG", "Battle Frontier"] as const;

export const GEN3_BATTLE_MOVESET = [
  { id: "quick-attack", label: "電光一閃", power: 26, variance: 10 },
  { id: "shadow-ball", label: "影子球", power: 34, variance: 16 },
  { id: "hidden-power", label: "覺醒力量", power: 30, variance: 12 },
  { id: "protect", label: "守住", power: 10, variance: 6 },
] as const;

export function toSafeNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function resolveTaipeiDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function resolveMedalsFromPoints(totalPoints: number, targetMedals: number) {
  return clamp(Math.floor(totalPoints), 0, targetMedals);
}

export function resolveCampaignState(campaign?: {
  starts_at: string;
  ends_at: string;
  total_days: number;
  is_active?: boolean;
}) {
  const now = new Date();
  const startsAt = new Date(campaign?.starts_at || EEVEE_GUARDIAN_DEFAULT_CONFIG.startsAt);
  const endsAt = new Date(campaign?.ends_at || EEVEE_GUARDIAN_DEFAULT_CONFIG.endsAt);
  const totalDays = campaign?.total_days || EEVEE_GUARDIAN_DEFAULT_CONFIG.totalDays;

  const isActiveByTime = now >= startsAt && now <= endsAt;
  const hasEnded = now > endsAt;
  const isUpcoming = now < startsAt;
  const isActive = Boolean(campaign?.is_active ?? true) && isActiveByTime;

  let daysElapsed = 0;
  if (now >= startsAt) {
    const elapsedMs = now.getTime() - startsAt.getTime();
    daysElapsed = clamp(Math.floor(elapsedMs / (1000 * 60 * 60 * 24)) + 1, 1, totalDays);
  }

  const daysRemaining = hasEnded ? 0 : clamp(totalDays - daysElapsed, 0, totalDays);

  return {
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    totalDays,
    isActive,
    hasEnded,
    isUpcoming,
    daysElapsed,
    daysRemaining,
  };
}

export function buildBattleSeed(userId: string, todayKey: string) {
  return `${userId}:${todayKey}:gen3`; 
}

export function normalizeCampaignRow(
  row: Partial<EeveeGuardianCampaignRow> | null,
): EeveeGuardianCampaignRow {
  return {
    id: row?.id || "default-campaign",
    slug: row?.slug || EEVEE_GUARDIAN_SLUG,
    title: row?.title || EEVEE_GUARDIAN_DEFAULT_CONFIG.title,
    starts_at: row?.starts_at || EEVEE_GUARDIAN_DEFAULT_CONFIG.startsAt,
    ends_at: row?.ends_at || EEVEE_GUARDIAN_DEFAULT_CONFIG.endsAt,
    total_days: Number(row?.total_days || EEVEE_GUARDIAN_DEFAULT_CONFIG.totalDays),
    daily_battles: Number(row?.daily_battles || EEVEE_GUARDIAN_DEFAULT_CONFIG.dailyBattles),
    win_points: toSafeNumber(row?.win_points, EEVEE_GUARDIAN_DEFAULT_CONFIG.winPoints),
    lose_points: toSafeNumber(row?.lose_points, EEVEE_GUARDIAN_DEFAULT_CONFIG.losePoints),
    target_medals: Number(row?.target_medals || EEVEE_GUARDIAN_DEFAULT_CONFIG.targetMedals),
    rare_reward_name: row?.rare_reward_name || EEVEE_GUARDIAN_DEFAULT_CONFIG.rareRewardName,
    is_active: typeof row?.is_active === "boolean" ? row.is_active : true,
  };
}

export function normalizePlayerRow(
  userId: string,
  campaignId: string,
  row?: Partial<EeveeGuardianPlayerRow> | null,
): EeveeGuardianPlayerRow {
  const totalPoints = toSafeNumber(row?.total_points, 0);

  return {
    id: row?.id || "local-player",
    campaign_id: row?.campaign_id || campaignId,
    user_id: row?.user_id || userId,
    total_points: totalPoints,
    total_battles: Number(row?.total_battles || 0),
    total_wins: Number(row?.total_wins || 0),
    total_losses: Number(row?.total_losses || 0),
    total_damage: Number(row?.total_damage || 0),
    medals_collected:
      Number(row?.medals_collected || resolveMedalsFromPoints(totalPoints, EEVEE_GUARDIAN_DEFAULT_CONFIG.targetMedals)),
    last_battle_day: row?.last_battle_day || null,
    today_battles_used: Number(row?.today_battles_used || 0),
    rare_reward_unlocked: Boolean(row?.rare_reward_unlocked),
  };
}

export function buildPlayerPublicProgress(player: EeveeGuardianPlayerRow, campaign: EeveeGuardianCampaignRow) {
  const medalsCollected = resolveMedalsFromPoints(player.total_points, campaign.target_medals);
  const battlesRemainingToday = Math.max(0, campaign.daily_battles - player.today_battles_used);

  return {
    totalPoints: Number(player.total_points.toFixed(1)),
    medalsCollected,
    targetMedals: campaign.target_medals,
    totalBattles: player.total_battles,
    totalWins: player.total_wins,
    totalLosses: player.total_losses,
    totalDamage: player.total_damage,
    todayBattlesUsed: player.today_battles_used,
    battlesRemainingToday,
    rareRewardUnlocked: player.rare_reward_unlocked || medalsCollected >= campaign.target_medals,
  };
}
