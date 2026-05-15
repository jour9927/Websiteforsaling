export type DistributionBadgeCategory = "ribbon" | "mark";

export type DistributionBadgeRarity =
    | "common"
    | "uncommon"
    | "rare"
    | "epic"
    | "legendary"
    | "mythic";

export type DistributionBadgePointTier =
    | "lowest"
    | "low"
    | "mid"
    | "high"
    | "highest";

export interface DistributionBadge {
    id: string;
    name: string;
    name_en?: string | null;
    category: DistributionBadgeCategory;
    generation: number;
    min_generation: number;
    max_generation: number;
    release_year?: number | null;
    rarity: DistributionBadgeRarity;
    base_points: number;
    icon_url?: string | null;
    description?: string | null;
    sort_order?: number | null;
}

export interface AttachedDistributionBadge extends DistributionBadge {
    attachment_id: string;
}

export interface UserDistributionRecord {
    id: string;
    distribution_id: string;
}

export const badgeRarityMeta: Record<DistributionBadgeRarity, {
    label: string;
    rank: number;
    className: string;
}> = {
    common: {
        label: "普通",
        rank: 1,
        className: "border-white/15 bg-white/10 text-white/70",
    },
    uncommon: {
        label: "精良",
        rank: 2,
        className: "border-emerald-400/25 bg-emerald-500/15 text-emerald-300",
    },
    rare: {
        label: "稀有",
        rank: 3,
        className: "border-sky-400/25 bg-sky-500/15 text-sky-300",
    },
    epic: {
        label: "史詩",
        rank: 4,
        className: "border-violet-400/25 bg-violet-500/15 text-violet-300",
    },
    legendary: {
        label: "傳說",
        rank: 5,
        className: "border-amber-400/30 bg-amber-500/15 text-amber-300",
    },
    mythic: {
        label: "神話",
        rank: 6,
        className: "border-rose-400/30 bg-rose-500/15 text-rose-300",
    },
};

export const badgePointTierMeta: Record<DistributionBadgePointTier, {
    label: string;
    rangeLabel: string;
    rank: number;
    className: string;
}> = {
    lowest: {
        label: "最低級距",
        rangeLabel: "500-99,999",
        rank: 1,
        className: "border-white/15 bg-white/10 text-white/65",
    },
    low: {
        label: "低點級距",
        rangeLabel: "100,000-499,999",
        rank: 2,
        className: "border-emerald-400/25 bg-emerald-500/15 text-emerald-300",
    },
    mid: {
        label: "中點級距",
        rangeLabel: "500,000-999,999",
        rank: 3,
        className: "border-sky-400/25 bg-sky-500/15 text-sky-300",
    },
    high: {
        label: "高點級距",
        rangeLabel: "1,000,000-1,999,999",
        rank: 4,
        className: "border-amber-400/30 bg-amber-500/15 text-amber-300",
    },
    highest: {
        label: "最高級距",
        rangeLabel: "2,000,000-3,000,000",
        rank: 5,
        className: "border-rose-400/30 bg-rose-500/15 text-rose-300",
    },
};

export function getDistributionBadgePointTier(basePoints: number): DistributionBadgePointTier {
    if (basePoints >= 2000000) return "highest";
    if (basePoints >= 1000000) return "high";
    if (basePoints >= 500000) return "mid";
    if (basePoints >= 100000) return "low";
    return "lowest";
}

export function isBadgeCompatibleWithDistribution(
    badge: DistributionBadge,
    distributionGeneration: number,
): boolean {
    return distributionGeneration >= badge.min_generation && distributionGeneration <= badge.max_generation;
}

export function sortDistributionBadges<T extends DistributionBadge>(badges: T[]): T[] {
    return [...badges].sort((a, b) => {
        const rarityDiff = badgeRarityMeta[b.rarity].rank - badgeRarityMeta[a.rarity].rank;
        if (rarityDiff !== 0) return rarityDiff;

        const yearDiff = (a.release_year || 9999) - (b.release_year || 9999);
        if (yearDiff !== 0) return yearDiff;

        const pointsDiff = b.base_points - a.base_points;
        if (pointsDiff !== 0) return pointsDiff;

        return a.name.localeCompare(b.name, "zh-Hant");
    });
}

export function sumBadgePoints(badges: DistributionBadge[]): number {
    return badges.reduce((total, badge) => total + (badge.base_points || 0), 0);
}

const badgeIconFileOverrides: Record<string, string> = {
    Sinnoh_Champion_Ribbon: "Sinnoh_Champion_Ribbon_VIII",
    Galar_Champion_Ribbon: "Galar_Champion_Ribbon_VIII",
    Twinkling_Star_Ribbon: "Twinkling_Star_Ribbon_VIII",
    Tower_Master_Ribbon: "Tower_Master_Ribbon_VIII",
    Master_Rank_Ribbon: "Master_Rank_Ribbon_VIII",
};

export function getDistributionBadgeIconUrl(badge: Pick<DistributionBadge, "icon_url">): string | null {
    if (!badge.icon_url) return null;

    let iconUrl = badge.icon_url.replace(
        "https://archives.bulbagarden.net/media/upload/Special:Redirect/file/",
        "https://archives.bulbagarden.net/wiki/Special:Redirect/file/",
    );

    for (const [staleFileName, currentFileName] of Object.entries(badgeIconFileOverrides)) {
        iconUrl = iconUrl.replace(`/file/${staleFileName}.png`, `/file/${currentFileName}.png`);
    }

    return iconUrl;
}

export function getDistributionBadgeIconFallback(badge: Pick<DistributionBadge, "category" | "rarity">): string {
    if (badge.category === "mark") {
        return badge.rarity === "mythic" || badge.rarity === "legendary" ? "✦" : "◆";
    }

    return badge.rarity === "mythic" || badge.rarity === "legendary" ? "🏵" : "🎗";
}
