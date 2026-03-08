import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { commentIds, virtualUserId } = body;

        const supabase = createServerSupabaseClient();

        let userIdToUse = null;
        let virtualIdToUse = null;

        if (virtualUserId) {
            virtualIdToUse = virtualUserId;
        } else {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return NextResponse.json({ reactions: {} });
            userIdToUse = user.id;
        }

        if (!commentIds || commentIds.length === 0) {
            return NextResponse.json({ reactions: {} });
        }

        let query = supabase.from('comment_reactions').select('comment_id, reaction_type').in('comment_id', commentIds);

        if (userIdToUse) {
            query = query.eq('user_id', userIdToUse);
        } else {
            query = query.eq('virtual_user_id', virtualIdToUse);
        }

        const { data, error } = await query;
        if (error) throw error;

        const reactions: Record<string, string> = {};
        if (data) {
            data.forEach((r: { comment_id: string; reaction_type: string }) => {
                reactions[r.comment_id] = r.reaction_type;
            });
        }

        return NextResponse.json({ reactions });
    } catch (_error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
