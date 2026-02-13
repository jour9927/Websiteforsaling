import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

// PATCH: 切換公告的 show_popup 或 show_in_list
export async function PATCH(request: Request) {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const { id, field, value } = await request.json();
        if (!id || !field) return NextResponse.json({ error: "id and field required" }, { status: 400 });
        if (!["show_popup", "show_in_list"].includes(field)) return NextResponse.json({ error: "Invalid field" }, { status: 400 });

        const adminClient = createAdminSupabaseClient();
        const { error } = await adminClient
            .from("announcements")
            .update({ [field]: value })
            .eq("id", id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
