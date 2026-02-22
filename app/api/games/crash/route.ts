import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

// 這是一支安全的 API，用來扣除/增加玩家的配布點數
export async function POST(req: NextRequest) {
    try {
        const supabase = createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { action, betAmount, winAmount } = body;

        if (typeof betAmount !== 'number' || betAmount < 10) {
            return NextResponse.json({ error: "Invalid bet amount" }, { status: 400 });
        }

        // 查詢目前點數餘額
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('points')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        const currentPoints = profile.points || 0;

        if (action === 'bet') {
            // 扣除下注點數
            if (currentPoints < betAmount) {
                return NextResponse.json({ error: "Insufficient points" }, { status: 400 });
            }

            const newPoints = currentPoints - betAmount;

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ points: newPoints })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Optional: 記錄點數變動歷史 (此處略過，簡化邏輯)
            // insert log to 'point_transactions'

            return NextResponse.json({ success: true, newPoints });

        } else if (action === 'cashout') {
            // 系統結算 (逃生成功)
            if (typeof winAmount !== 'number' || winAmount < 0) {
                return NextResponse.json({ error: "Invalid win amount" }, { status: 400 });
            }

            const newPoints = currentPoints + winAmount;

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ points: newPoints })
                .eq('id', user.id);

            if (updateError) throw updateError;

            return NextResponse.json({ success: true, newPoints });

        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

    } catch (error) {
        console.error("Crash API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
