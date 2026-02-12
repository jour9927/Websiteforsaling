import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: 取得每則公告的已讀人數
export async function GET() {
    // 驗證管理員身份
    const supabase = createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 使用 service role key 查詢所有已讀記錄
    const adminClient = createAdminSupabaseClient();

    const { data, error } = await adminClient
        .from("announcement_reads")
        .select("announcement_id");

    if (error) {
        console.error("查詢已讀記錄失敗:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 聚合每則公告的已讀人數
    const readCounts: Record<string, number> = {};
    (data || []).forEach((row: { announcement_id: string }) => {
        readCounts[row.announcement_id] = (readCounts[row.announcement_id] || 0) + 1;
    });

    return NextResponse.json(readCounts);
}
