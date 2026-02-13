import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: 檢查當前用戶是否已讀某則公告
export async function GET(request: Request) {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ read: false });
    }

    const url = new URL(request.url);
    const announcementId = url.searchParams.get("announcement_id");

    if (!announcementId) {
        return NextResponse.json({ error: "announcement_id required" }, { status: 400 });
    }

    // 用 admin client 查詢（繞過 RLS）
    const adminClient = createAdminSupabaseClient();
    const { data } = await adminClient
        .from("announcement_reads")
        .select("id")
        .eq("announcement_id", announcementId)
        .eq("user_id", user.id)
        .maybeSingle();

    return NextResponse.json({ read: !!data });
}
