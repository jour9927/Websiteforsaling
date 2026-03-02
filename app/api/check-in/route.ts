import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

// 計算某日期距今多少天
function daysBetween(date1: Date, date2: Date): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

// GET: 取得簽到狀態
export async function GET() {
    const supabase = createServerSupabaseClient();
    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select(`
            last_check_in, 
            check_in_streak, 
            fortune_points,
            points,
            check_in_goal_distribution_id,
            check_in_debt,
            check_in_milestone,
            lottery_tickets,
            blindbox_coupons
        `)
        .eq("id", user.id)
        .single();

    if (!profile) {
        return NextResponse.json({
            canCheckIn: true,
            streak: 0,
            fortunePoints: 0,
            economyPoints: 0,
            lastCheckIn: null,
            debt: 0,
            milestone: 40,
            goalDistribution: null,
        });
    }

    // 檢查今天是否已簽到
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastCheckIn = profile.last_check_in ? new Date(profile.last_check_in) : null;
    let canCheckIn = true;

    if (lastCheckIn) {
        const lastCheckInDate = new Date(lastCheckIn);
        lastCheckInDate.setHours(0, 0, 0, 0);
        canCheckIn = lastCheckInDate.getTime() < today.getTime();
    }

    // 查詢目標寶可夢資訊
    let goalDistribution = null;
    if (profile.check_in_goal_distribution_id) {
        const { data: dist } = await supabase
            .from("distributions")
            .select("id, pokemon_name, pokemon_name_en, pokemon_sprite_url, is_shiny")
            .eq("id", profile.check_in_goal_distribution_id)
            .single();
        goalDistribution = dist;
    }

    return NextResponse.json({
        canCheckIn,
        streak: profile.check_in_streak || 0,
        fortunePoints: profile.fortune_points || 0,
        economyPoints: profile.points || 0,
        lastCheckIn: profile.last_check_in,
        debt: profile.check_in_debt || 0,
        milestone: profile.check_in_milestone || 40,
        goalDistribution,
    });
}

// POST: 執行簽到
export async function POST() {
    const supabase = createServerSupabaseClient();
    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 取得目前的 profile
    const { data: profile } = await supabase
        .from("profiles")
        .select(`
            last_check_in, 
            check_in_streak, 
            fortune_points,
            points,
            check_in_goal_distribution_id,
            check_in_debt,
            check_in_milestone,
            lottery_tickets,
            blindbox_coupons
        `)
        .eq("id", user.id)
        .single();

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 檢查今天是否已簽到
    if (profile?.last_check_in) {
        const lastCheckInDate = new Date(profile.last_check_in);
        lastCheckInDate.setHours(0, 0, 0, 0);

        if (lastCheckInDate.getTime() >= today.getTime()) {
            return NextResponse.json(
                { error: "今天已經簽到過了！" },
                { status: 400 }
            );
        }
    }

    // 計算連續簽到天數和補簽債務
    let newStreak = profile?.check_in_streak || 0;
    let newDebt = profile?.check_in_debt || 0;
    const milestone = profile?.check_in_milestone || 40;
    let newLotteryTickets = profile?.lottery_tickets || 0;
    let newBlindboxCoupons = profile?.blindbox_coupons || 0;

    if (profile?.last_check_in) {
        const lastCheckIn = new Date(profile.last_check_in);
        const daysSinceLastCheckIn = daysBetween(lastCheckIn, today);

        if (daysSinceLastCheckIn === 1) {
            // 昨天有簽到，正常處理
            if (newDebt > 0) {
                // 有債務，先還債
                newDebt -= 1;
            } else {
                // 無債務，連續天數 +1
                newStreak += 1;
            }
        } else if (daysSinceLastCheckIn > 1) {
            // 斷簽了！計算債務
            const missedDays = daysSinceLastCheckIn - 1;
            newDebt += missedDays * 2;  // 每斷 1 天加 2 天債務
            newStreak = 1;  // 連續天數重置為 1
        }
    } else {
        // 第一次簽到
        newStreak = 1;
    }

    // 計算獎勵點數（依連續天數增加，最多 7 點/天）
    let bonusPoints = Math.min(newStreak, 7);

    // 🎰 10% 機率獲得雙倍點數
    const isDoubleReward = Math.random() < 0.1;
    if (isDoubleReward) {
        bonusPoints *= 2;
    }

    const newFortunePoints = (profile?.fortune_points || 0) + bonusPoints;

    // 計算經濟點數獎勵 (遊樂場與拍賣用)
    // 基礎 100 點，連續每天 +50，第七天 1000 點，斷簽或大於 7 重算
    let economyReward = 100;
    const effectiveEconomicStreak = ((newStreak - 1) % 7) + 1; // 1~7 的循環

    if (effectiveEconomicStreak === 7) {
        economyReward = 1000;
    } else if (effectiveEconomicStreak > 1) {
        economyReward = 100 + ((effectiveEconomicStreak - 1) * 50);
    }

    if (isDoubleReward) {
        economyReward *= 2;
    }

    const newEconomyPoints = (profile?.points || 0) + economyReward;

    // 檢查是否達成里程碑
    let milestoneReached = false;
    let rewardDistribution = null;

    if (newStreak >= milestone && profile?.check_in_goal_distribution_id && newDebt === 0) {
        milestoneReached = true;

        // 查詢獎勵寶可夢資訊
        const { data: dist } = await supabase
            .from("distributions")
            .select("id, pokemon_name, pokemon_name_en, pokemon_sprite_url, is_shiny")
            .eq("id", profile.check_in_goal_distribution_id)
            .single();
        rewardDistribution = dist;

        const isLotteryTicket = profile.check_in_goal_distribution_id === '00000000-0000-0000-0000-000000000001';
        const isBlindboxCoupon = profile.check_in_goal_distribution_id === '00000000-0000-0000-0000-000000000002';

        if (isLotteryTicket) {
            newLotteryTickets += 1;
        } else if (isBlindboxCoupon) {
            newBlindboxCoupons += 1;
        } else {
            // 新增到用戶的配布圖鑑
            await supabase
                .from("user_distributions")
                .upsert({
                    user_id: user.id,
                    distribution_id: profile.check_in_goal_distribution_id,
                    notes: `連續簽到 ${milestone} 天獎勵`
                }, {
                    onConflict: "user_id,distribution_id"
                });
        }

        // 記錄獎勵
        await supabase
            .from("check_in_rewards")
            .insert({
                user_id: user.id,
                distribution_id: profile.check_in_goal_distribution_id,
                milestone_days: milestone
            });

        // 重置連續天數，開始新一輪
        newStreak = 0;
    }

    // 更新 profile
    const { error } = await supabase
        .from("profiles")
        .update({
            last_check_in: now.toISOString(),
            check_in_streak: newStreak,
            fortune_points: newFortunePoints,
            points: newEconomyPoints,
            check_in_debt: newDebt,
            lottery_tickets: newLotteryTickets,
            blindbox_coupons: newBlindboxCoupons,
        })
        .eq("id", user.id);

    if (error) {
        console.error("Check-in error:", error);
        return NextResponse.json(
            { error: "簽到失敗，請稍後再試" },
            { status: 500 }
        );
    }

    // 構建訊息
    let message = `簽到成功！`;
    if (newDebt > 0) {
        message += ` 補簽進度：還需 ${newDebt} 天`;
    } else {
        message += ` 連續 ${newStreak} 天`;
    }
    if (isDoubleReward) {
        message += `，🎰 幸運雙倍！獲得 ${bonusPoints} 幸運點數與 ${economyReward} 經濟點數！`;
    } else {
        message += `，獲得 ${bonusPoints} 幸運點數與 ${economyReward} 經濟點數！`;
    }

    if (milestoneReached && rewardDistribution) {
        message = `🎉 恭喜達成 ${milestone} 天連續簽到！獲得 ${rewardDistribution.pokemon_name}！`;
    }

    return NextResponse.json({
        success: true,
        streak: newStreak,
        fortunePoints: newFortunePoints,
        economyPoints: newEconomyPoints,
        bonusPoints,
        economyReward,
        debt: newDebt,
        milestoneReached,
        rewardDistribution,
        isDoubleReward,
        message,
    });
}
