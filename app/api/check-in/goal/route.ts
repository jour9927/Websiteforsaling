import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

// 獎勵層級配置
const REWARD_TIERS = {
    tier_12: {
        name: "12天獎勵",
        requiredStreak: 12,
        requiredPoints: null,
        allowedGenerations: [9],
        description: "連續簽到 12 天可選擇第 9 世代寶可夢或點數轉移方案"
    },
    tier_40: {
        name: "40天獎勵",
        requiredStreak: 40,
        requiredPoints: null,
        allowedGenerations: [7, 8, 9],
        description: "連續簽到 40 天可選擇第 7-9 世代寶可夢"
    },
    tier_points: {
        name: "積分獎勵",
        requiredStreak: null,
        requiredPoints: 120,
        allowedGenerations: [6, 7, 8, 9],
        description: "累積 120 幸運點數可選擇第 6-9 世代寶可夢或點數轉移方案"
    }
};

type TierKey = keyof typeof REWARD_TIERS;

type RewardDistribution = {
    id: string;
    pokemon_name: string;
    pokemon_name_en?: string | null;
    pokemon_sprite_url?: string | null;
    is_shiny?: boolean | null;
    generation?: number | null;
    original_trainer?: string | null;
    event_name?: string | null;
    points?: number | null;
};

type RewardGoalSelections = {
    reward_tier_12_goal_id?: string | null;
    reward_tier_40_goal_id?: string | null;
    reward_tier_points_goal_id?: string | null;
};

type RewardSelectionCounts = Record<string, number>;

const SOLD_OUT_VIRTUAL_REWARD_IDS = new Set([
    "00000000-0000-0000-0000-000000000001",
    "00000000-0000-0000-0000-000000000002"
]);
const LOTTERY_TICKET_REWARD_ID = "00000000-0000-0000-0000-000000000001";
const BLINDBOX_COUPON_REWARD_ID = "00000000-0000-0000-0000-000000000002";
const TRANSFER_REWARD_IDS = [
    "00000000-0000-0000-0000-000000000003",
    "00000000-0000-0000-0000-000000000004"
];
const TIER_12_EXTRA_REWARD_IDS = [LOTTERY_TICKET_REWARD_ID, ...TRANSFER_REWARD_IDS];
const TIER_40_EXTRA_REWARD_IDS: string[] = [];
const TIER_POINTS_EXTRA_REWARD_IDS = [BLINDBOX_COUPON_REWARD_ID, ...TRANSFER_REWARD_IDS];
const TIER_EXTRA_REWARD_IDS: Record<TierKey, string[]> = {
    tier_12: TIER_12_EXTRA_REWARD_IDS,
    tier_40: TIER_40_EXTRA_REWARD_IDS,
    tier_points: TIER_POINTS_EXTRA_REWARD_IDS
};
const TIER_SCOPED_REWARD_IDS = new Set(Object.values(TIER_EXTRA_REWARD_IDS).flat());
const GEN9_AVAILABLE_REWARD_IDS = new Set([
    "9c567cb4-2913-4e18-a8d4-7751fdd1e2b3", // 《寶可夢 朱／紫》關聯紀念的新葉喵
    "dd067d88-abbf-42fa-a482-1c8333aceae3", // Alex 的多龍巴魯托
    "0881c821-fc08-4aaa-8af4-fd697d869d95", // 《寶可夢 朱／紫》關聯紀念的潤水鴨
    "8fe1f579-d7aa-4ab5-a7e3-09f243911509", // 禮物的索財靈
    "1090282b-6771-4dcd-a627-4def215f6556", // 夜遊的巴布土撥
    "155b159b-d0e4-4d6e-b018-a73606e040ba", // 惡太晶屬性的噴火龍
    "513d0c66-b0ec-443d-8a5a-2c5de04cc7e2", // 軟件圖鑑完成紀念的美洛耶塔
    "93d1bac1-3169-4b08-b3a2-cee522541ebd" // Nils 的多邊獸Ⅱ
]);
const SOLD_OUT_REWARD_LABEL = "已被選完";
const REWARD_ITEM_STOCK_LIMIT = 3;
const GEN9_SELECTABLE_POINT_CEILING = 2160;
const GEN9_HIGH_VALUE_EVENT_KEYWORDS = [
    "異色的樂園守護龍",
    "異色的災禍之寶",
    "生日的寶可夢",
    "幻之寶可夢",
    "寶可夢中心25週年"
];
const GEN9_HIDDEN_REWARD_POKEMON_NAMES = ["海兔獸"];
const GEN9_HIDDEN_REWARD_EVENT_KEYWORDS = ["Eduardo的海兔獸"];
const COROCORO_EVENT_KEYWORDS = ["corocoro", "coro coro", "colocolo", "コロコロ"];

function includesKeyword(value: string | null | undefined, keywords: string[]) {
    const normalized = (value || "").toLowerCase();
    return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

function isHiddenReward(distribution: RewardDistribution) {
    if (distribution.generation !== 9) return false;
    return GEN9_HIDDEN_REWARD_POKEMON_NAMES.includes(distribution.pokemon_name)
        || includesKeyword(distribution.event_name, GEN9_HIDDEN_REWARD_EVENT_KEYWORDS);
}

function isHiddenForTier(distribution: RewardDistribution, tier: TierKey) {
    if (TIER_SCOPED_REWARD_IDS.has(distribution.id)) {
        return !TIER_EXTRA_REWARD_IDS[tier].includes(distribution.id);
    }
    return isHiddenReward(distribution);
}

function isAllowedForTier(distribution: RewardDistribution, tier: TierKey) {
    if (SOLD_OUT_VIRTUAL_REWARD_IDS.has(distribution.id)) return false;
    if (TIER_SCOPED_REWARD_IDS.has(distribution.id)) {
        return TIER_EXTRA_REWARD_IDS[tier].includes(distribution.id);
    }
    if (distribution.generation === 9) return GEN9_AVAILABLE_REWARD_IDS.has(distribution.id);

    return true;
}

function isSoldOutReward(distribution: RewardDistribution) {
    if (SOLD_OUT_VIRTUAL_REWARD_IDS.has(distribution.id)) return true;
    if (distribution.generation !== 9) return false;

    const eventName = distribution.event_name || "";
    const isEevee = distribution.pokemon_name === "伊布";
    const isCorocoro = includesKeyword(eventName, COROCORO_EVENT_KEYWORDS);
    const isAboveSelectablePointRange = (distribution.points || 0) > GEN9_SELECTABLE_POINT_CEILING;
    const isHighValueSeries = includesKeyword(eventName, GEN9_HIGH_VALUE_EVENT_KEYWORDS);

    return isEevee || isCorocoro || isAboveSelectablePointRange || isHighValueSeries || isHiddenReward(distribution);
}

function countRewardSelections(rows: RewardGoalSelections[] | null | undefined) {
    const counts: RewardSelectionCounts = {};
    const goalFields: (keyof RewardGoalSelections)[] = [
        "reward_tier_12_goal_id",
        "reward_tier_40_goal_id",
        "reward_tier_points_goal_id"
    ];

    for (const row of rows || []) {
        for (const field of goalFields) {
            const rewardId = row[field];
            if (!rewardId) continue;
            counts[rewardId] = (counts[rewardId] || 0) + 1;
        }
    }

    return counts;
}

function prependUniqueRewards(distributions: RewardDistribution[], rewards: RewardDistribution[]) {
    const rewardIds = new Set(rewards.map((reward) => reward.id));
    return [
        ...rewards,
        ...distributions.filter((distribution) => !rewardIds.has(distribution.id))
    ];
}

function getDisplayedSelectedCount(distributionId: string, selectionCounts: RewardSelectionCounts) {
    return Math.min(selectionCounts[distributionId] || 0, REWARD_ITEM_STOCK_LIMIT);
}

function isUnavailableForSelection(distribution: RewardDistribution, tier: TierKey) {
    return !isAllowedForTier(distribution, tier) || isSoldOutReward(distribution);
}

function getDisplayedSelectedCountForTier(
    distribution: RewardDistribution,
    tier: TierKey,
    selectionCounts: RewardSelectionCounts
) {
    const selectedCount = getDisplayedSelectedCount(distribution.id, selectionCounts);
    if (isUnavailableForSelection(distribution, tier)) {
        return Math.max(selectedCount, REWARD_ITEM_STOCK_LIMIT);
    }
    return selectedCount;
}

function getRemainingCount(distribution: RewardDistribution, tier: TierKey, selectionCounts: RewardSelectionCounts) {
    if (isUnavailableForSelection(distribution, tier)) return 0;
    return Math.max(0, REWARD_ITEM_STOCK_LIMIT - getDisplayedSelectedCount(distribution.id, selectionCounts));
}

function withSelectionStatus(distribution: RewardDistribution, tier: TierKey, selectionCounts: RewardSelectionCounts) {
    const selectedCount = getDisplayedSelectedCountForTier(distribution, tier, selectionCounts);
    const remainingCount = getRemainingCount(distribution, tier, selectionCounts);
    const selectionExhausted = remainingCount <= 0;

    return {
        ...distribution,
        selected_count: selectedCount,
        remaining_count: remainingCount,
        selection_exhausted: selectionExhausted,
        selection_status_label: selectionExhausted ? SOLD_OUT_REWARD_LABEL : null
    };
}

// GET: 取得各層級狀態和可選配布
export async function GET(request: Request) {
    const supabase = createServerSupabaseClient();
    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 取得用戶 profile
    const { data: profile } = await supabase
        .from("profiles")
        .select(`
            check_in_streak,
            fortune_points,
            reward_tier_12_goal_id,
            reward_tier_12_claimed_at,
            reward_tier_40_goal_id,
            reward_tier_40_claimed_at,
            reward_tier_points_goal_id,
            reward_tier_points_claimed_at
        `)
        .eq("id", user.id)
        .single();

    const streak = profile?.check_in_streak || 0;
    const points = profile?.fortune_points || 0;

    // 解析 URL 參數取得要查詢的層級
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get("tier") as TierKey | null;

    // 建立層級狀態
    const tiers = {
        tier_12: {
            ...REWARD_TIERS.tier_12,
            unlocked: streak >= 12,
            goalId: profile?.reward_tier_12_goal_id,
            claimedAt: profile?.reward_tier_12_claimed_at,
            canSelect: !profile?.reward_tier_12_goal_id && streak >= 12,  // 未設定且已解鎖
            progress: Math.min(streak, 12),
            target: 12
        },
        tier_40: {
            ...REWARD_TIERS.tier_40,
            unlocked: streak >= 40,
            goalId: profile?.reward_tier_40_goal_id,
            claimedAt: profile?.reward_tier_40_claimed_at,
            canSelect: !profile?.reward_tier_40_goal_id && streak >= 40,
            progress: Math.min(streak, 40),
            target: 40
        },
        tier_points: {
            ...REWARD_TIERS.tier_points,
            unlocked: points >= 120,
            goalId: profile?.reward_tier_points_goal_id,
            claimedAt: profile?.reward_tier_points_claimed_at,
            canSelect: !profile?.reward_tier_points_goal_id && points >= 120,
            progress: Math.min(points, 120),
            target: 120
        }
    };

    // 如果指定層級，查詢該層級可選的配布
    let distributions = null;
    if (tier && REWARD_TIERS[tier]) {
        const tierConfig = REWARD_TIERS[tier];
        const { data: rewardGoals } = await supabase
            .from("profiles")
            .select("reward_tier_12_goal_id, reward_tier_40_goal_id, reward_tier_points_goal_id");
        const selectionCounts = countRewardSelections(rewardGoals);
        const { data } = await supabase
            .from("distributions")
            .select("id, pokemon_name, pokemon_name_en, pokemon_sprite_url, is_shiny, generation, original_trainer, event_name, points")
            .in("generation", tierConfig.allowedGenerations)
            .order("generation", { ascending: true })
            .order("pokemon_name", { ascending: true });
        
        let allDistributions: RewardDistribution[] = data || [];
        
        // 手動從 Distributions 撈出指定層級才可顯示的虛擬選項，並插入前排。
        const extraRewardIds = TIER_EXTRA_REWARD_IDS[tier];
        if (extraRewardIds.length > 0) {
            const { data: rewards } = await supabase
                .from('distributions')
                .select("id, pokemon_name, pokemon_name_en, pokemon_sprite_url, is_shiny, generation, original_trainer, event_name, points")
                .in('id', extraRewardIds);
            if (rewards && rewards.length > 0) {
                const sortedRewards = extraRewardIds
                    .map((id) => rewards.find((reward) => reward.id === id))
                    .filter(Boolean) as RewardDistribution[];
                allDistributions = prependUniqueRewards(allDistributions, sortedRewards);
            }
        }

        distributions = allDistributions
            .filter((distribution) => !isHiddenForTier(distribution, tier))
            .map((distribution) => withSelectionStatus(distribution, tier, selectionCounts));
    }

    // 查詢已設定的目標寶可夢詳情
    const goalIds = [
        profile?.reward_tier_12_goal_id,
        profile?.reward_tier_40_goal_id,
        profile?.reward_tier_points_goal_id
    ].filter(Boolean);

    let goalDistributions: Record<string, unknown> = {};
    if (goalIds.length > 0) {
        const { data } = await supabase
            .from("distributions")
            .select("id, pokemon_name, pokemon_sprite_url, is_shiny, event_name")
            .in("id", goalIds);

        if (data) {
            goalDistributions = Object.fromEntries(data.map(d => [d.id, d]));
        }
    }

    return NextResponse.json({
        tiers,
        distributions,
        goalDistributions,
        currentStreak: streak,
        currentPoints: points
    });
}

// POST: 設定目標獎勵寶可夢（一旦設定不可變更）
export async function POST(request: Request) {
    const supabase = createServerSupabaseClient();
    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { tier, distributionId } = await request.json() as { tier: TierKey; distributionId: string };

        if (!tier || !REWARD_TIERS[tier]) {
            return NextResponse.json({ error: "無效的獎勵層級" }, { status: 400 });
        }

        if (!distributionId) {
            return NextResponse.json({ error: "請選擇一個獎勵" }, { status: 400 });
        }

        // 取得用戶 profile
        const { data: profile } = await supabase
            .from("profiles")
            .select(`
                check_in_streak,
                fortune_points,
                reward_tier_12_goal_id,
                reward_tier_40_goal_id,
                reward_tier_points_goal_id
            `)
            .eq("id", user.id)
            .single();

        if (!profile) {
            return NextResponse.json({ error: "找不到用戶資料" }, { status: 404 });
        }

        // 檢查是否已設定過（不可變更）
        const goalField = `reward_${tier}_goal_id` as const;
        type GoalFieldKey = 'reward_tier_12_goal_id' | 'reward_tier_40_goal_id' | 'reward_tier_points_goal_id';
        const existingGoal = profile[goalField as GoalFieldKey];

        if (existingGoal) {
            return NextResponse.json(
                { error: "此層級已設定目標，無法變更。如需變更請聯繫管理員。" },
                { status: 400 }
            );
        }

        // 檢查是否已解鎖此層級
        const tierConfig = REWARD_TIERS[tier];
        if (tierConfig.requiredStreak && profile.check_in_streak < tierConfig.requiredStreak) {
            return NextResponse.json(
                { error: `需要連續簽到 ${tierConfig.requiredStreak} 天才能解鎖此獎勵` },
                { status: 400 }
            );
        }
        if (tierConfig.requiredPoints && (profile.fortune_points || 0) < tierConfig.requiredPoints) {
            return NextResponse.json(
                { error: `需要累積 ${tierConfig.requiredPoints} 幸運點數才能解鎖此獎勵` },
                { status: 400 }
            );
        }

        // 檢查配布是否存在且世代符合
        const { data: distribution, error: distError } = await supabase
            .from("distributions")
            .select("id, pokemon_name, generation, event_name, points")
            .eq("id", distributionId)
            .single();

        if (distError || !distribution) {
            return NextResponse.json({ error: "找不到指定的配布" }, { status: 404 });
        }

        if (!tierConfig.allowedGenerations.includes(distribution.generation)) {
            return NextResponse.json(
                { error: `此層級只能選擇第 ${tierConfig.allowedGenerations.join('、')} 世代的寶可夢` },
                { status: 400 }
            );
        }

        if (!isAllowedForTier(distribution, tier)) {
            return NextResponse.json(
                { error: "此獎勵目前不在此層級的可選清單中，請選擇其他獎勵。" },
                { status: 400 }
            );
        }

        if (isSoldOutReward(distribution)) {
            return NextResponse.json(
                { error: `${distribution.pokemon_name} 已被選完，請選擇其他獎勵。` },
                { status: 400 }
            );
        }

        const { data: rewardGoals } = await supabase
            .from("profiles")
            .select("reward_tier_12_goal_id, reward_tier_40_goal_id, reward_tier_points_goal_id");
        const selectionCounts = countRewardSelections(rewardGoals);
        if (getRemainingCount(distribution, tier, selectionCounts) <= 0) {
            return NextResponse.json(
                { error: `${distribution.pokemon_name} 已被選完，請選擇其他獎勵。` },
                { status: 400 }
            );
        }

        // 更新用戶的目標配布
        const updateData: Record<string, unknown> = {};
        updateData[goalField] = distributionId;

        const { error: updateError } = await supabase
            .from("profiles")
            .update(updateData)
            .eq("id", user.id);

        if (updateError) {
            console.error("Update goal error:", updateError);
            return NextResponse.json(
                { error: "設定失敗，請稍後再試" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `已將 ${tierConfig.name} 目標設定為 ${distribution.pokemon_name}！此選擇無法變更。`,
            distribution
        });
    } catch {
        return NextResponse.json({ error: "無效的請求" }, { status: 400 });
    }
}
