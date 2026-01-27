import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

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
        .select("last_check_in, check_in_streak, fortune_points")
        .eq("id", user.id)
        .single();

    if (!profile) {
        return NextResponse.json({
            canCheckIn: true,
            streak: 0,
            fortunePoints: 0,
            lastCheckIn: null,
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

    return NextResponse.json({
        canCheckIn,
        streak: profile.check_in_streak || 0,
        fortunePoints: profile.fortune_points || 0,
        lastCheckIn: profile.last_check_in,
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
        .select("last_check_in, check_in_streak, fortune_points")
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

    // 計算連續簽到天數
    let newStreak = 1;
    if (profile?.last_check_in) {
        const lastCheckIn = new Date(profile.last_check_in);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const lastCheckInDate = new Date(lastCheckIn);
        lastCheckInDate.setHours(0, 0, 0, 0);

        // 如果上次簽到是昨天，連續天數 +1
        if (lastCheckInDate.getTime() === yesterday.getTime()) {
            newStreak = (profile.check_in_streak || 0) + 1;
        }
        // 否則重置為 1
    }

    // 計算獎勵點數（依連續天數增加）
    const bonusPoints = Math.min(newStreak, 7); // 最多 7 點/天
    const newFortunePoints = (profile?.fortune_points || 0) + bonusPoints;

    // 更新 profile
    const { error } = await supabase
        .from("profiles")
        .update({
            last_check_in: now.toISOString(),
            check_in_streak: newStreak,
            fortune_points: newFortunePoints,
        })
        .eq("id", user.id);

    if (error) {
        console.error("Check-in error:", error);
        return NextResponse.json(
            { error: "簽到失敗，請稍後再試" },
            { status: 500 }
        );
    }

    return NextResponse.json({
        success: true,
        streak: newStreak,
        fortunePoints: newFortunePoints,
        bonusPoints,
        message: `簽到成功！連續 ${newStreak} 天，獲得 ${bonusPoints} 幸運點數！`,
    });
}
