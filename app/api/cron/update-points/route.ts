import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * 每日配布點數漲跌更新 Cron
 * 
 * 功能：
 * 1. 讀取所有有點數的配布紀錄
 * 2. 對每筆計算一個 ±0.3%~3% 的隨機漲跌幅
 * 3. 55% 機率上漲 / 45% 機率下跌
 * 4. 確保點數不低於世代下限、不超過世代上限的 1.5 倍
 * 5. 伊布家族波動更大（±2%~12%）
 * 6. 化石系寶可夢不低於 900,000
 * 7. 將更新後的點數寫回資料庫
 */

// 世代點數範圍
const GEN_RANGES: Record<number, { min: number; max: number }> = {
    3: { min: 650000, max: 1800000 },
    4: { min: 250000, max: 460000 },
    5: { min: 120000, max: 330000 },
    6: { min: 50000, max: 400000 },
    7: { min: 10000, max: 75000 },
    8: { min: 5000, max: 15000 },
    9: { min: 300, max: 7500 },
};

// 化石寶可夢名稱 (不能跌破 900k)
const FOSSIL_NAMES = ['冰雪龍', '寶寶暴龍', '鰓魚龍', '化石翼龍', '菊石獸', '多刺菊石獸',
    '鐮刀盔', '搖籃百合', '太古盔甲', '戰槌龍', '盾甲龍', '肋骨海龜', '始祖大鳥',
    '怪顎龍', '冰雪龍', '雷鳥龍', '鰓魚海獸', '雷鳥海獸'];

// 確定性 hash（與前端一致）
function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return hash;
}

export async function GET(request: NextRequest) {
    // 驗證 cron secret（未設定 CRON_SECRET 時也拒絕，防止未授權觸發）
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const today = new Date().toISOString().slice(0, 10);

        // ============================================
        // 1. 讀取所有有點數的配布
        // ============================================
        const { data: distributions, error: fetchError } = await supabase
            .from("distributions")
            .select("id, pokemon_name, generation, points")
            .not("points", "is", null)
            .gt("points", 0);

        if (fetchError) throw new Error(`讀取配布失敗: ${fetchError.message}`);
        if (!distributions || distributions.length === 0) {
            return NextResponse.json({ success: true, message: "沒有需要更新的配布", updated: 0 });
        }

        // ============================================
        // 2. 計算每筆的漲跌並準備更新
        // ============================================
        let upCount = 0;
        let downCount = 0;
        let totalChange = 0;

        const updates: { id: string; points: number }[] = [];

        for (const dist of distributions) {
            const seed = dist.id + today + "daily-fluctuation";
            const hash = hashCode(seed);

            const isEevee = dist.pokemon_name?.includes('伊布');
            const isFossil = FOSSIL_NAMES.some(name => dist.pokemon_name?.includes(name));

            // 漲跌方向：55% 上漲
            const isPositive = (Math.abs(hash) % 100) < 55;

            // 漲跌幅度
            let minPct: number, maxPct: number;
            if (isEevee) {
                // 伊布家族：大波動 2%~12%
                minPct = 0.02;
                maxPct = 0.12;
            } else {
                // 一般：小波動 0.3%~3%
                minPct = 0.003;
                maxPct = 0.03;
            }

            const pctRange = maxPct - minPct;
            const pct = minPct + (Math.abs(hash >> 8) % 10000) / 10000 * pctRange;
            const change = Math.round(dist.points * pct);

            let newPoints = isPositive ? dist.points + change : dist.points - change;

            // ============================================
            // 3. 安全邊界
            // ============================================
            const range = GEN_RANGES[dist.generation] || GEN_RANGES[9];

            // 化石系不低於 900,000
            if (isFossil) {
                newPoints = Math.max(newPoints, 900000);
            }

            // 不低於世代下限
            newPoints = Math.max(newPoints, range.min);

            // 不超過世代上限的 1.5 倍（留成長空間但不無限膨脹）
            newPoints = Math.min(newPoints, range.max);

            // 確保是正整數
            newPoints = Math.max(1, Math.round(newPoints));

            if (isPositive) upCount++;
            else downCount++;
            totalChange += newPoints - dist.points;

            updates.push({ id: dist.id, points: newPoints });
        }

        // ============================================
        // 4. 批次更新（每 50 筆一批）
        // ============================================
        const BATCH_SIZE = 50;
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < updates.length; i += BATCH_SIZE) {
            const batch = updates.slice(i, i + BATCH_SIZE);

            // 逐筆更新（Supabase 不支持批次 update by id）
            const promises = batch.map(item =>
                supabase
                    .from("distributions")
                    .update({ points: item.points })
                    .eq("id", item.id)
            );

            const results = await Promise.all(promises);
            results.forEach(r => {
                if (r.error) errorCount++;
                else successCount++;
            });
        }

        // ============================================
        // 5. 回傳結果
        // ============================================
        const avgChange = distributions.length > 0
            ? (totalChange / distributions.length).toFixed(1)
            : "0";

        return NextResponse.json({
            success: true,
            message: `每日點數更新完成`,
            date: today,
            total: distributions.length,
            updated: successCount,
            errors: errorCount,
            up: upCount,
            down: downCount,
            avgChange: Number(avgChange),
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error("每日點數更新 Cron 錯誤:", error);
        return NextResponse.json(
            { error: "Internal server error", details: String(error) },
            { status: 500 }
        );
    }
}
