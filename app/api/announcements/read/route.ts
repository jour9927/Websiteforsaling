import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST: 記錄公告已讀
export async function POST(request: Request) {
    const supabase = createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { announcement_id } = await request.json();

        if (!announcement_id) {
            return NextResponse.json({ error: "announcement_id is required" }, { status: 400 });
        }

        // upsert：如果已存在則忽略（不更新 read_at）
        const { error } = await supabase
            .from("announcement_reads")
            .upsert(
                { announcement_id, user_id: user.id },
                { onConflict: "announcement_id,user_id", ignoreDuplicates: true }
            );

        if (error) {
            console.error("記錄已讀失敗:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
