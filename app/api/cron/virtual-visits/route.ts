import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

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

        // 2. 為每個用戶添加隨機數量的虛擬訪問（1-5 次）
        const now = new Date();
        const visits = [];
        const viewUpdates = [];

        for (const profile of profiles) {
            // 隨機決定這個用戶今天獲得多少虛擬訪問（1-5）
            const visitCount = Math.floor(Math.random() * 5) + 1;

            for (let i = 0; i < visitCount; i++) {
                // 為每次訪問生成一個虛擬訪客 ID
                const virtualVisitorId = crypto.randomUUID();

                visits.push({
                    profile_user_id: profile.id,
                    visitor_id: null, // NULL 表示虛擬訪客
                    virtual_visitor_id: virtualVisitorId,
                    is_virtual: true,
                    visited_at: now.toISOString(),
                });
            }

            // 記錄要更新的 view 計數
            viewUpdates.push({
                id: profile.id,
                addViews: visitCount,
            });
        }

        // 3. 批次插入訪問記錄（忽略重複）
        const { error: insertError } = await supabase
            .from("profile_visits")
            .upsert(visits, {
                onConflict: "profile_user_id,virtual_visitor_id",
                ignoreDuplicates: true
            });

        if (insertError) {
            console.error("Insert error:", insertError);
            // 不要因為插入錯誤而中斷，繼續更新計數
        }

        // 4. 更新每個用戶的 view 計數
        for (const update of viewUpdates) {
            await supabase.rpc("increment_profile_views", {
                profile_id: update.id,
                add_views: update.addViews,
            });
        }

        // 5. 重置今日訪問（如果是新的一天）
        // 檢查是否需要重置 today_views（在上午 11:00）
        const hour = now.getHours();
        if (hour === 11) {
            await supabase
                .from("profiles")
                .update({ today_views: 0 })
                .neq("id", "00000000-0000-0000-0000-000000000000"); // 更新所有
        }

        return NextResponse.json({
            success: true,
            message: `Added virtual visits for ${profiles.length} profiles`,
            totalVisits: visits.length,
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
