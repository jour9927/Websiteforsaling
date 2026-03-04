import { createServerSupabaseClient } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
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

    // 用 service role 查詢是否已有 AI 欄位
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
        .from("profiles")
        .select("ai_system_prompt")
        .limit(1);

    if (error) {
        // 欄位不存在 → migration 還沒跑
        return NextResponse.json({
            migrated: false,
            message: "AI 個人化欄位尚未建立。請到 Supabase Dashboard → SQL Editor 執行以下 SQL：",
            sql: `ALTER TABLE profiles\nADD COLUMN IF NOT EXISTS ai_system_prompt TEXT DEFAULT NULL,\nADD COLUMN IF NOT EXISTS ai_user_summary TEXT DEFAULT NULL;`,
        });
    }

    return NextResponse.json({
        migrated: true,
        message: "AI 個人化欄位已存在，migration 039 已套用。",
        sampleRow: data?.[0] ?? null,
    });
}
