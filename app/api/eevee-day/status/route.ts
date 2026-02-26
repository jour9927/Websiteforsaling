import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";
import { EEVEE_DAY_CONFIG } from "@/lib/eevee-day-questions";

export const dynamic = "force-dynamic";

// GET: 取得活動狀態
export async function GET() {
    const supabase = createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 活動時間
    const now = new Date();
    const start = new Date(EEVEE_DAY_CONFIG.startDate);
    const end = new Date(EEVEE_DAY_CONFIG.endDate);
    const isActive = now >= start && now <= end;
    const hasEnded = now > end;

    // 今日嘗試次數
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { count: attemptsCount } = await supabase
        .from("eevee_day_quiz_attempts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("attempted_at", today.toISOString())
        .lt("attempted_at", tomorrow.toISOString());

    // 集點數
    const { count: stampCount } = await supabase
        .from("eevee_day_stamps")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

    // 獎勵選擇
    const { data: reward } = await supabase
        .from("eevee_day_rewards")
        .select(`
            id,
            distribution_id,
            selected_at,
            distributions (
                id,
                pokemon_name,
                pokemon_name_en,
                pokemon_sprite_url,
                is_shiny,
                generation,
                event_name,
                original_trainer
            )
        `)
        .eq("user_id", user.id)
        .single();

    // 取得可選配布列表
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let availableDistributions: any[] = [];
    if ((stampCount || 0) >= EEVEE_DAY_CONFIG.stampsRequired && !reward) {
        const { data: distributions } = await supabase
            .from("distributions")
            .select("id, pokemon_name, pokemon_name_en, pokemon_sprite_url, is_shiny, generation, event_name, original_trainer")
            .in("generation", EEVEE_DAY_CONFIG.allowedGenerations)
            .in("pokemon_name", EEVEE_DAY_CONFIG.allowedPokemon)
            .order("pokemon_name");

        availableDistributions = distributions || [];
    }

    // 🎫 VIP補考券：6點用戶在最後一天可答題2次
    const todayStr = now.toDateString();
    const endStr = end.toDateString();
    const isLastDay = todayStr === endStr;
    const hasRetakeTicket = isLastDay && (stampCount || 0) === 6;
    const maxAttempts = hasRetakeTicket ? 2 : EEVEE_DAY_CONFIG.dailyAttempts;

    return NextResponse.json({
        isActive,
        hasEnded,
        startDate: EEVEE_DAY_CONFIG.startDate,
        endDate: EEVEE_DAY_CONFIG.endDate,
        stamps: stampCount || 0,
        stampsRequired: EEVEE_DAY_CONFIG.stampsRequired,
        attemptsToday: attemptsCount || 0,
        dailyAttempts: maxAttempts,
        remainingAttempts: Math.max(0, maxAttempts - (attemptsCount || 0)),
        hasRetakeTicket,
        isLastDay,
        reward: reward || null,
        availableDistributions,
    });
}
