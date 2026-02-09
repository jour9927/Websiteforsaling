import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

// POST: 管理員更新人氣值或被關注數
export async function POST(request: Request) {
    const supabase = createServerSupabaseClient();

    // 驗證管理員權限
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    // 檢查是否為管理員
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return NextResponse.json({ error: "無權限" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, virtualId, score, followers } = body;

    // 構建更新對象
    const updates: Record<string, number> = {};
    if (score !== undefined && score >= 0) {
        updates.popularity_score = score;
    }
    if (followers !== undefined && followers >= 0) {
        updates.followers_count = followers;
    }

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "沒有要更新的資料" }, { status: 400 });
    }

    try {
        if (userId) {
            // 更新真實用戶
            const { error } = await supabase
                .from("profiles")
                .update(updates)
                .eq("id", userId);

            if (error) throw error;
        } else if (virtualId) {
            // 更新虛擬用戶
            const { error } = await supabase
                .from("virtual_profiles")
                .update(updates)
                .eq("id", virtualId);

            if (error) throw error;
        } else {
            return NextResponse.json({ error: "需要 userId 或 virtualId" }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: "更新成功"
        });
    } catch (error) {
        console.error("Update social data error:", error);
        return NextResponse.json({ error: "更新失敗" }, { status: 500 });
    }
}

