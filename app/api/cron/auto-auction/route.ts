import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// 競標預設參數
const AUCTION_DEFAULTS = {
    starting_price: 100,
    min_increment: 100,
    duration_hours: 24,
    generation: 9,
};

export async function GET(request: NextRequest) {
    // 驗證 cron secret（防止惡意觸發）
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const now = new Date();

        // ============================================
        // 1. 結標已過期的競標
        // ============================================
        const { data: expiredAuctions, error: expiredError } = await supabase
            .from("auctions")
            .update({ status: "ended" })
            .eq("status", "active")
            .lt("end_time", now.toISOString())
            .select("id, title");

        if (expiredError) {
            console.error("結標過期競標失敗:", expiredError);
        }

        // ============================================
        // 2. 查詢第 9 世代配布（排除近 30 天已用過的）
        // ============================================
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 取得近 30 天已用過的 distribution_id
        const { data: recentAuctions } = await supabase
            .from("auctions")
            .select("distribution_id")
            .gte("created_at", thirtyDaysAgo.toISOString())
            .not("distribution_id", "is", null);

        const usedIds = (recentAuctions || [])
            .map(a => a.distribution_id)
            .filter(Boolean);

        // 查詢第 9 世代可用配布
        let query = supabase
            .from("distributions")
            .select("id, pokemon_name, pokemon_name_en, pokemon_dex_number, pokemon_sprite_url, image_url, is_shiny, original_trainer, level")
            .eq("generation", AUCTION_DEFAULTS.generation);

        // 排除已用過的
        if (usedIds.length > 0) {
            query = query.not("id", "in", `(${usedIds.join(",")})`);
        }

        const { data: availableDistributions, error: distError } = await query;

        if (distError) {
            throw new Error(`查詢配布失敗: ${distError.message}`);
        }

        if (!availableDistributions || availableDistributions.length === 0) {
            return NextResponse.json({
                success: true,
                message: "沒有可用的第 9 世代配布（可能都用過了），今天跳過。",
                expired: expiredAuctions?.length || 0,
                newAuction: null,
            });
        }

        // ============================================
        // 3. 偽隨機選擇（基於日期的確定性隨機）
        // ============================================
        const dateStr = now.toISOString().slice(0, 10); // "2026-02-11"
        const seed = hashCode(dateStr);
        const index = Math.abs(seed) % availableDistributions.length;
        const selected = availableDistributions[index];

        // ============================================
        // 4. 建立新競標
        // ============================================
        const endTime = new Date(now);
        endTime.setHours(endTime.getHours() + AUCTION_DEFAULTS.duration_hours);

        const shinyPrefix = selected.is_shiny ? "✨ 異色 " : "";
        const title = `${shinyPrefix}${selected.pokemon_name}${selected.pokemon_name_en ? ` (${selected.pokemon_name_en})` : ""}`;

        const description = [
            `🎯 每日自動競標 — 第 ${AUCTION_DEFAULTS.generation} 世代配布`,
            selected.original_trainer ? `訓練家：${selected.original_trainer}` : null,
            selected.level ? `等級：Lv.${selected.level}` : null,
            `⏰ 競標將於 ${endTime.toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })} 結束`,
        ].filter(Boolean).join("\n");

        const { data: newAuction, error: insertError } = await supabase
            .from("auctions")
            .insert({
                distribution_id: selected.id,
                title,
                description,
                image_url: selected.pokemon_sprite_url || selected.image_url,
                starting_price: AUCTION_DEFAULTS.starting_price,
                min_increment: AUCTION_DEFAULTS.min_increment,
                current_price: 0,
                start_time: now.toISOString(),
                end_time: endTime.toISOString(),
                status: "active",
            })
            .select("id, title")
            .single();

        if (insertError) {
            throw new Error(`建立競標失敗: ${insertError.message}`);
        }

        return NextResponse.json({
            success: true,
            message: `自動競標已建立: ${title}`,
            expired: expiredAuctions?.length || 0,
            newAuction: {
                id: newAuction.id,
                title: newAuction.title,
                pokemon: selected.pokemon_name,
                endTime: endTime.toISOString(),
            },
            timestamp: now.toISOString(),
        });

    } catch (error) {
        console.error("自動競標 Cron 錯誤:", error);
        return NextResponse.json(
            { error: "Internal server error", details: String(error) },
            { status: 500 }
        );
    }
}

// 確定性 hash（同一天產生相同數字）
function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return hash;
}
