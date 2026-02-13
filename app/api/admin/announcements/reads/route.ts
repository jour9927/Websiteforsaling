import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: 取得每則公告的已讀詳情（包含用戶資訊）
export async function GET() {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const adminClient = createAdminSupabaseClient();
    const { data, error } = await adminClient
        .from("announcement_reads")
        .select("announcement_id, user_id, read_at")
        .order("read_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // 收集所有 user IDs
    const userIds = [...new Set((data || []).map((r: { user_id: string }) => r.user_id))];
    const profilesMap = new Map<string, { full_name: string | null; email: string }>();

    if (userIds.length > 0) {
        const { data: profiles } = await adminClient.from("profiles").select("id, full_name, email").in("id", userIds);
        (profiles || []).forEach((p: { id: string; full_name: string | null; email: string }) => {
            profilesMap.set(p.id, { full_name: p.full_name, email: p.email });
        });
    }

    // 組裝：每則公告 → 已讀用戶列表
    const result: Record<string, { count: number; readers: { user_id: string; full_name: string | null; email: string; read_at: string }[] }> = {};

    (data || []).forEach((r: { announcement_id: string; user_id: string; read_at: string }) => {
        if (!result[r.announcement_id]) {
            result[r.announcement_id] = { count: 0, readers: [] };
        }
        result[r.announcement_id].count++;
        const profile = profilesMap.get(r.user_id);
        result[r.announcement_id].readers.push({
            user_id: r.user_id,
            full_name: profile?.full_name || null,
            email: profile?.email || "",
            read_at: r.read_at,
        });
    });

    return NextResponse.json(result);
}

// DELETE: 重置已讀記錄
export async function DELETE(request: Request) {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const { announcement_id, user_id } = await request.json();
        if (!announcement_id) return NextResponse.json({ error: "announcement_id is required" }, { status: 400 });

        const adminClient = createAdminSupabaseClient();

        let query = adminClient.from("announcement_reads").delete().eq("announcement_id", announcement_id);

        // 如果指定 user_id，只刪該用戶的；否則刪全部
        if (user_id) {
            query = query.eq("user_id", user_id);
        }

        const { error } = await query;
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
