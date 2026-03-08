import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const commentId = params.id;
        const body = await request.json();
        const { action, virtualUserId } = body;

        if (!action || !['like', 'dislike'].includes(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        const supabase = createServerSupabaseClient();

        let userIdToUse = null;
        let virtualIdToUse = null;

        if (virtualUserId) {
            virtualIdToUse = virtualUserId;
        } else {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return NextResponse.json({ error: "Unauthorized: Please log in to react" }, { status: 401 });
            }
            userIdToUse = user.id;
        }

        const { data, error } = await supabase.rpc('toggle_comment_reaction', {
            p_comment_id: commentId,
            p_user_id: userIdToUse,
            p_virtual_user_id: virtualIdToUse,
            p_reaction_type: action
        });

        if (error) {
            console.error("Error toggling reaction:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Error in comment reaction route:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
