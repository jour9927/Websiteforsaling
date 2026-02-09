import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

// GET: 獲取排行榜或檢查投票狀態
export async function GET(request: Request) {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const targetUserId = searchParams.get("userId");
    const targetVirtualId = searchParams.get("virtualId");

    // 獲取當前用戶
    const { data: { user } } = await supabase.auth.getUser();

    // 當前週和月
    const now = new Date();
    const weekNumber = getISOWeek(now);
    const yearNumber = now.getFullYear();
    const monthYear = `${yearNumber}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    if (action === "rankings") {
        // 獲取排行榜
        const limit = parseInt(searchParams.get("limit") || "20");

        // 分別查詢真實用戶和虛擬用戶
        const [{ data: realUsers }, { data: virtualUsers }] = await Promise.all([
            supabase
                .from("profiles")
                .select("id, full_name, username, popularity_score, followers_count")
                .gt("popularity_score", 0)
                .order("popularity_score", { ascending: false })
                .limit(limit),
            supabase
                .from("virtual_profiles")
                .select("id, display_name, avatar_seed, popularity_score, followers_count")
                .gt("popularity_score", 0)
                .order("popularity_score", { ascending: false })
                .limit(limit)
        ]);

        // 合併並排序
        const combined = [
            ...(realUsers || []).map(u => ({
                id: u.id,
                displayName: u.full_name || u.username || "用戶",
                username: u.username,
                score: u.popularity_score || 0,
                followers: u.followers_count || 0,
                isVirtual: false
            })),
            ...(virtualUsers || []).map(u => ({
                id: u.id,
                displayName: u.display_name,
                avatarSeed: u.avatar_seed,
                score: u.popularity_score || 0,
                followers: u.followers_count || 0,
                isVirtual: true
            }))
        ].sort((a, b) => b.score - a.score).slice(0, limit);

        return NextResponse.json({ rankings: combined });
    }

    if (action === "status" && user) {
        // 檢查投票狀態
        let hasVotedThisWeek = false;

        if (targetUserId) {
            const { data } = await supabase
                .from("popularity_votes")
                .select("id")
                .eq("voter_id", user.id)
                .eq("target_user_id", targetUserId)
                .eq("year_number", yearNumber)
                .eq("week_number", weekNumber)
                .single();
            hasVotedThisWeek = !!data;
        } else if (targetVirtualId) {
            const { data } = await supabase
                .from("popularity_votes")
                .select("id")
                .eq("voter_id", user.id)
                .eq("target_virtual_id", targetVirtualId)
                .eq("year_number", yearNumber)
                .eq("week_number", weekNumber)
                .single();
            hasVotedThisWeek = !!data;
        }

        // 檢查月度 quota
        const { count: monthlyVotes } = await supabase
            .from("popularity_votes")
            .select("id", { count: "exact", head: true })
            .eq("voter_id", user.id)
            .eq("month_year", monthYear);

        return NextResponse.json({
            hasVotedThisWeek,
            monthlyVotes: monthlyVotes || 0,
            monthlyQuota: 4,
            remainingQuota: 4 - (monthlyVotes || 0)
        });
    }

    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
}

// POST: 投票
export async function POST(request: Request) {
    const supabase = createServerSupabaseClient();

    // 驗證登入
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, virtualId } = body;

    if (!userId && !virtualId) {
        return NextResponse.json({ error: "需要 userId 或 virtualId" }, { status: 400 });
    }

    // 不能給自己投票
    if (userId === user.id) {
        return NextResponse.json({ error: "不能給自己投票" }, { status: 400 });
    }

    // 當前週和月
    const now = new Date();
    const weekNumber = getISOWeek(now);
    const yearNumber = now.getFullYear();
    const monthYear = `${yearNumber}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // 檢查月度 quota
    const { count: monthlyVotes } = await supabase
        .from("popularity_votes")
        .select("id", { count: "exact", head: true })
        .eq("voter_id", user.id)
        .eq("month_year", monthYear);

    if ((monthlyVotes || 0) >= 4) {
        return NextResponse.json({
            error: "本月投票額度已用完（每月最多 4 次）",
            monthlyVotes: monthlyVotes,
            quota: 4
        }, { status: 400 });
    }

    // 插入投票記錄
    const insertData = userId
        ? {
            voter_id: user.id,
            target_user_id: userId,
            week_number: weekNumber,
            year_number: yearNumber,
            month_year: monthYear
        }
        : {
            voter_id: user.id,
            target_virtual_id: virtualId,
            week_number: weekNumber,
            year_number: yearNumber,
            month_year: monthYear
        };

    const { error } = await supabase
        .from("popularity_votes")
        .insert(insertData);

    if (error) {
        if (error.code === "23505") {
            return NextResponse.json({
                error: "本週已給此用戶投過票（每週只能給同一人投一次）"
            }, { status: 400 });
        }
        console.error("Vote error:", error);
        return NextResponse.json({ error: "投票失敗" }, { status: 500 });
    }

    // 更新人氣值
    if (userId) {
        // 直接查詢並 +1
        const { data: current } = await supabase
            .from("profiles")
            .select("popularity_score")
            .eq("id", userId)
            .single();
        await supabase
            .from("profiles")
            .update({ popularity_score: (current?.popularity_score || 0) + 1 })
            .eq("id", userId);
    } else {
        const { data: current } = await supabase
            .from("virtual_profiles")
            .select("popularity_score")
            .eq("id", virtualId)
            .single();
        await supabase
            .from("virtual_profiles")
            .update({ popularity_score: (current?.popularity_score || 0) + 1 })
            .eq("id", virtualId);
    }

    return NextResponse.json({
        success: true,
        message: "投票成功！",
        remainingQuota: 3 - (monthlyVotes || 0)
    });
}

// 計算 ISO 週數
function getISOWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
