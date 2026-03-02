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
        description: "連續簽到 12 天可選擇第 9 世代寶可夢 或 抽獎券"
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
        description: "累積 120 幸運點數可選擇第 6-9 世代寶可夢 或 $1000 盲盒抵用卷"
    }
};

type TierKey = keyof typeof REWARD_TIERS;

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
        const { data } = await supabase
            .from("distributions")
            .select("id, pokemon_name, pokemon_name_en, pokemon_sprite_url, is_shiny, generation, original_trainer, event_name")
            .in("generation", tierConfig.allowedGenerations)
            .order("generation", { ascending: true })
            .order("pokemon_name", { ascending: true });
        
        let allDistributions = data || [];
        
        // 方案 B：手動從 Distributions 撈出新增的卷虛擬物件，並視 tier 插入前排
        if (tier === 'tier_12') {
             const { data: ticket } = await supabase.from('distributions').select("id, pokemon_name, pokemon_name_en, pokemon_sprite_url, is_shiny, generation, original_trainer, event_name").eq('id', '00000000-0000-0000-0000-000000000001');
             if(ticket && ticket.length > 0) allDistributions = [...ticket, ...allDistributions];
        } else if (tier === 'tier_points') {
             const { data: coupon } = await supabase.from('distributions').select("id, pokemon_name, pokemon_name_en, pokemon_sprite_url, is_shiny, generation, original_trainer, event_name").eq('id', '00000000-0000-0000-0000-000000000002');
             if(coupon && coupon.length > 0) allDistributions = [...coupon, ...allDistributions];
        }

        distributions = allDistributions;
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
            return NextResponse.json({ error: "請選擇一個寶可夢" }, { status: 400 });
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
            .select("id, pokemon_name, generation")
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
