import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// 虛擬留言池
const VIRTUAL_COMMENTS = [
    "收藏好漂亮！🌟",
    "大佬帶帶我 🙏",
    "什麼時候再上新的？",
    "好羨慕你的收藏",
    "這個配布我也有！",
    "可以交流一下嗎？",
    "新手報到！學習中 📚",
    "你的願望清單我都想要 😂",
    "收藏家 respect 🫡",
    "路過留言～",
    "太強了吧這收藏！",
    "期待你的新增收藏 👀",
    "真羨慕你的收藏量！",
    "剛入坑的新人來學習了",
    "收藏真的太讚了！",
];

export async function GET(request: NextRequest) {
    // 驗證 cron secret（防止惡意觸發）
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 使用 service role key 來繞過 RLS
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        // 1. 獲取所有真實用戶
        const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name")
            .limit(100);

        if (profilesError) throw profilesError;
        if (!profiles || profiles.length === 0) {
            return NextResponse.json({ message: "No profiles found" });
        }

        // 2. 獲取所有虛擬用戶（用來當訪客和留言者）
        const { data: virtualProfiles, error: virtualError } = await supabase
            .from("virtual_profiles")
            .select("id, display_name");

        if (virtualError) throw virtualError;
        if (!virtualProfiles || virtualProfiles.length === 0) {
            return NextResponse.json({ message: "No virtual profiles found" });
        }

        // 3. 為每個用戶添加虛擬訪問和留言
        const now = new Date();
        const visits = [];
        const comments = [];
        const viewUpdates = [];

        for (const profile of profiles) {
            // 隨機決定這個用戶今天獲得多少虛擬訪問（1-5）
            const visitCount = Math.floor(Math.random() * 5) + 1;

            // 從虛擬用戶中隨機選擇不重複的訪客
            const shuffledVirtual = [...virtualProfiles].sort(() => Math.random() - 0.5);
            const selectedVisitors = shuffledVirtual.slice(0, visitCount);

            for (const visitor of selectedVisitors) {
                visits.push({
                    profile_user_id: profile.id,
                    visitor_id: null,
                    virtual_visitor_id: visitor.id,
                    is_virtual: true,
                    visited_at: now.toISOString(),
                });
            }

            // 隨機決定是否留言（30% 機率）
            if (Math.random() < 0.3) {
                const commenter = shuffledVirtual[0]; // 用第一個訪客來留言
                const randomComment = VIRTUAL_COMMENTS[Math.floor(Math.random() * VIRTUAL_COMMENTS.length)];

                comments.push({
                    profile_user_id: profile.id,
                    commenter_id: null,
                    virtual_commenter_id: commenter.id,
                    is_virtual: true,
                    content: randomComment,
                    created_at: now.toISOString(),
                });
            }

            viewUpdates.push({
                id: profile.id,
                addViews: selectedVisitors.length,
            });
        }

        // 4. 批次插入訪問記錄
        const { error: visitError } = await supabase
            .from("profile_visits")
            .upsert(visits, {
                onConflict: "profile_user_id,virtual_visitor_id",
                ignoreDuplicates: true
            });

        if (visitError) {
            console.error("Visit insert error:", visitError);
        }

        // 5. 批次插入留言
        if (comments.length > 0) {
            const { error: commentError } = await supabase
                .from("profile_comments")
                .insert(comments);

            if (commentError) {
                console.error("Comment insert error:", commentError);
            }
        }

        // 6. 更新每個用戶的 view 計數
        for (const update of viewUpdates) {
            await supabase.rpc("increment_profile_views", {
                profile_id: update.id,
                add_views: update.addViews,
            });
        }

        // 7. 重置今日訪問（如果是上午 11:00）
        const hour = now.getHours();
        if (hour === 11) {
            await supabase
                .from("profiles")
                .update({ today_views: 0 })
                .neq("id", "00000000-0000-0000-0000-000000000000");
        }

        return NextResponse.json({
            success: true,
            message: `Added ${visits.length} visits and ${comments.length} comments`,
            totalVisits: visits.length,
            totalComments: comments.length,
            timestamp: now.toISOString(),
        });

    } catch (error) {
        console.error("Cron job error:", error);
        return NextResponse.json(
            { error: "Internal server error", details: String(error) },
            { status: 500 }
        );
    }
}
