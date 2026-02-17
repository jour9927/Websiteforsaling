import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

// PATCH: 更新使用者角色（管理員專用）
export async function PATCH(request: Request) {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const { userId, newRole } = await request.json();
        if (!userId || !newRole) return NextResponse.json({ error: "userId and newRole required" }, { status: 400 });
        if (!["user", "member"].includes(newRole)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

        const adminClient = createAdminSupabaseClient();
        const { error } = await adminClient
            .from("profiles")
            .update({ role: newRole })
            .eq("id", userId);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
