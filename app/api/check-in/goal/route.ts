import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: 取得可選的配布列表（用於設定目標）
export async function GET() {
    const supabase = createServerSupabaseClient();
    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 查詢世代 8、9 的配布（目前政策只開放這兩個世代）
    const { data: distributions, error } = await supabase
        .from("distributions")
        .select("id, pokemon_name, pokemon_name_en, pokemon_sprite_url, is_shiny, generation, original_trainer, event_name, distribution_period_start")
        .in("generation", [8, 9])
        .order("generation", { ascending: true })
        .order("pokemon_name", { ascending: true });

    if (error) {
        return NextResponse.json({ error: "無法載入配布列表" }, { status: 500 });
    }

    return NextResponse.json({ distributions });
}

// POST: 設定目標獎勵寶可夢
export async function POST(request: Request) {
    const supabase = createServerSupabaseClient();
    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { distributionId } = await request.json();

        if (!distributionId) {
            return NextResponse.json(
                { error: "請選擇一個寶可夢" },
                { status: 400 }
            );
        }

        // 檢查配布是否存在
        const { data: distribution, error: distError } = await supabase
            .from("distributions")
            .select("id, pokemon_name")
            .eq("id", distributionId)
            .single();

        if (distError || !distribution) {
            return NextResponse.json(
                { error: "找不到指定的配布" },
                { status: 404 }
            );
        }

        // 更新用戶的目標配布
        const { error: updateError } = await supabase
            .from("profiles")
            .update({
                check_in_goal_distribution_id: distributionId
            })
            .eq("id", user.id);

        if (updateError) {
            console.error("Update goal error:", updateError);
            return NextResponse.json(
                { error: "設定失敗，請稍後再試" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `已將目標設定為 ${distribution.pokemon_name}！`,
            distribution
        });
    } catch {
        return NextResponse.json(
            { error: "無效的請求" },
            { status: 400 }
        );
    }
}
