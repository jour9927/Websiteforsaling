import { createServerSupabaseClient } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
    // 驗證管理員權限
    const userSupabase = createServerSupabaseClient();
    const { data: { user } } = await userSupabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    const { data: profile } = await userSupabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return NextResponse.json({ error: "權限不足" }, { status: 403 });
    }

    try {
        const { userId, ai_system_prompt, ai_user_summary } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
        }

        // 使用 service role 來更新
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error } = await supabase
            .from("profiles")
            .update({
                ai_system_prompt: ai_system_prompt || null,
                ai_user_summary: ai_user_summary || null,
            })
            .eq("id", userId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("AI settings update error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
