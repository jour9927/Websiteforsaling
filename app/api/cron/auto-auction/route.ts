import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// 競標預設參數
const AUCTION_CONFIG = {
    starting_price: 100,
    min_increment: 100,
    duration_minutes: 10,
    generation: 9,
    // 每日時段：台灣時間 07:00 ~ 22:00
    start_hour: 7,   // 台灣時間
    end_hour: 22,     // 台灣時間
    interval_minutes: 10,
};

export async function GET(request: NextRequest) {
    // 驗證 cron secret
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
        // ============================================
        // 1. 結標昨天所有過期的競標
        // ============================================
        const now = new Date();

        const { data: expiredAuctions } = await supabase
            .from("auctions")
            .update({ status: "ended" })
            .eq("status", "active")
            .lt("end_time", now.toISOString())
            .select("id");

        // ============================================
        // 1.5 清理 180 天前沒人出價的競標（節省空間）
        // ============================================
        const cleanupCutoff = new Date();
        cleanupCutoff.setDate(cleanupCutoff.getDate() - 180);

        const { data: deletedAuctions } = await supabase
            .from("auctions")
            .delete()
            .eq("status", "ended")
            .eq("bid_count", 0)
            .lt("end_time", cleanupCutoff.toISOString())
            .select("id");

        // ============================================
        // 2. 查詢第 9 世代所有可用配布
        // ============================================
        const { data: distributions, error: distError } = await supabase
            .from("distributions")
            .select("id, pokemon_name, pokemon_name_en, pokemon_dex_number, pokemon_sprite_url, image_url, is_shiny, original_trainer, level")
            .eq("generation", AUCTION_CONFIG.generation);

        if (distError) throw new Error(`查詢配布失敗: ${distError.message}`);
        if (!distributions || distributions.length === 0) {
            return NextResponse.json({
                success: false,
                message: "沒有第 9 世代的配布資料",
            });
        }

        // ============================================
        // 3. 計算今日所有競標時段
        // ============================================
        // 取得今天台灣時間的 00:00
        const todayTW = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
        const todayDateStr = `${todayTW.getFullYear()}-${String(todayTW.getMonth() + 1).padStart(2, "0")}-${String(todayTW.getDate()).padStart(2, "0")}`;

        const slots: { start: Date; end: Date }[] = [];

        for (let hour = AUCTION_CONFIG.start_hour; hour < AUCTION_CONFIG.end_hour; hour++) {
            for (let min = 0; min < 60; min += AUCTION_CONFIG.interval_minutes) {
                // 台灣時間轉 UTC（-8 小時）
                const startUTC = new Date(`${todayDateStr}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00+08:00`);
                const endUTC = new Date(startUTC.getTime() + AUCTION_CONFIG.duration_minutes * 60 * 1000);
                slots.push({ start: startUTC, end: endUTC });
            }
        }

        // ============================================
        // 4. 偽隨機選擇寶可夢（基於日期 + 場次 seed）
        // ============================================
        const auctions = slots.map((slot, index) => {
            const seed = hashCode(`${todayDateStr}-${index}`);
            const distIndex = Math.abs(seed) % distributions.length;
            const selected = distributions[distIndex];

            const shinyPrefix = selected.is_shiny ? "✨ " : "";
            const title = `${shinyPrefix}${selected.pokemon_name}${selected.pokemon_name_en ? ` (${selected.pokemon_name_en})` : ""}`;

            return {
                distribution_id: selected.id,
                title,
                description: `🎯 每日自動競標 #${index + 1}`,
                image_url: selected.pokemon_sprite_url || selected.image_url,
                starting_price: AUCTION_CONFIG.starting_price,
                min_increment: AUCTION_CONFIG.min_increment,
                current_price: 0,
                start_time: slot.start.toISOString(),
                end_time: slot.end.toISOString(),
                status: "active",
                bid_count: 0,
            };
        });

        // ============================================
        // 5. 批次插入所有競標
        // ============================================
        const { data: insertedAuctions, error: insertError } = await supabase
            .from("auctions")
            .insert(auctions)
            .select("id");

        if (insertError) {
            throw new Error(`批次建立競標失敗: ${insertError.message}`);
        }

        return NextResponse.json({
            success: true,
            message: `已建立 ${auctions.length} 場自動競標（${todayDateStr} 07:00~22:00）`,
            expired: expiredAuctions?.length || 0,
            cleaned: deletedAuctions?.length || 0,
            created: insertedAuctions?.length || 0,
            totalSlots: slots.length,
            sampleTitles: auctions.slice(0, 3).map(a => a.title),
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

// 確定性 hash
function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return hash;
}
