import { createServerSupabaseClient } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// POST: 插入虛擬留言
export async function POST(request: NextRequest) {
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
        const { profile_user_id, virtual_commenter_id, content } = await request.json();

        if (!profile_user_id || !virtual_commenter_id || !content?.trim()) {
            return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
        }

        // 用 service_role 插入（繞過 RLS）
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabase.from("profile_comments").insert({
            profile_user_id,
            commenter_id: null,
            virtual_commenter_id,
            is_virtual: true,
            content: content.trim(),
        }).select();

        if (error) throw error;

        return NextResponse.json({ success: true, comment: data?.[0] });
    } catch (error) {
        console.error("Virtual comment insert error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// DELETE: 刪除虛擬留言
export async function DELETE(request: NextRequest) {
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
        const { commentId } = await request.json();
        if (!commentId) {
            return NextResponse.json({ error: "缺少 commentId" }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error } = await supabase
            .from("profile_comments")
            .delete()
            .eq("id", commentId)
            .eq("is_virtual", true); // 只能刪虛擬留言

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Virtual comment delete error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
