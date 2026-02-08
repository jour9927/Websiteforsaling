import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// POST: 管理員更新人氣值
export async function POST(request: Request) {
    const supabase = createRouteHandlerClient({ cookies });

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
    const { userId, virtualId, score } = body;

    if (score === undefined || score < 0) {
        return NextResponse.json({ error: "無效的分數" }, { status: 400 });
    }

    try {
        if (userId) {
            // 更新真實用戶
            const { error } = await supabase
                .from("profiles")
                .update({ popularity_score: score })
                .eq("id", userId);

            if (error) throw error;
        } else if (virtualId) {
            // 更新虛擬用戶
            const { error } = await supabase
                .from("virtual_profiles")
                .update({ popularity_score: score })
                .eq("id", virtualId);

            if (error) throw error;
        } else {
            return NextResponse.json({ error: "需要 userId 或 virtualId" }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: "人氣值更新成功"
        });
    } catch (error) {
        console.error("Update popularity error:", error);
        return NextResponse.json({ error: "更新失敗" }, { status: 500 });
    }
}
