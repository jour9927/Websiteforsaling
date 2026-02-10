import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";
import { EEVEE_DAY_CONFIG } from "@/lib/eevee-day-questions";

export const dynamic = "force-dynamic";

// POST: 選擇獎勵配布
export async function POST(request: Request) {
    const supabase = createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 檢查是否已經選過
    const { data: existingReward } = await supabase
        .from("eevee_day_rewards")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (existingReward) {
        return NextResponse.json(
            { error: "你已經選擇過獎勵了，如需更改請私訊管理員" },
            { status: 400 }
        );
    }

    // 檢查集點數是否足夠
    const { count: stampCount } = await supabase
        .from("eevee_day_stamps")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

    if ((stampCount || 0) < EEVEE_DAY_CONFIG.stampsRequired) {
        return NextResponse.json(
            { error: `集點不足，需要 ${EEVEE_DAY_CONFIG.stampsRequired} 點` },
            { status: 400 }
        );
    }

    const body = await request.json();
    const { distributionId } = body as { distributionId: string };

    if (!distributionId) {
        return NextResponse.json({ error: "請選擇一隻寶可夢" }, { status: 400 });
    }

    // 驗證配布是否在允許範圍內
    const { data: distribution } = await supabase
        .from("distributions")
        .select("id, pokemon_name, generation")
        .eq("id", distributionId)
        .single();

    if (!distribution) {
        return NextResponse.json({ error: "找不到該配布" }, { status: 404 });
    }

    if (
        !EEVEE_DAY_CONFIG.allowedGenerations.includes(distribution.generation) ||
        !EEVEE_DAY_CONFIG.allowedPokemon.includes(distribution.pokemon_name)
    ) {
        return NextResponse.json({ error: "此配布不在活動範圍內" }, { status: 400 });
    }

    // 記錄獎勵選擇
    const { error: insertError } = await supabase
        .from("eevee_day_rewards")
        .insert({
            user_id: user.id,
            distribution_id: distributionId,
        });

    if (insertError) {
        console.error("Insert reward error:", insertError);
        return NextResponse.json({ error: "選擇失敗，請稍後再試" }, { status: 500 });
    }

    // 同時加入用戶的配布圖鑑
    await supabase
        .from("user_distributions")
        .upsert(
            {
                user_id: user.id,
                distribution_id: distributionId,
                notes: "伊布寶可夢 Day 集點活動獎勵",
            },
            { onConflict: "user_id,distribution_id" }
        );

    return NextResponse.json({
        success: true,
        message: `🎉 恭喜獲得 ${distribution.pokemon_name}！已加入你的配布圖鑑`,
    });
}
