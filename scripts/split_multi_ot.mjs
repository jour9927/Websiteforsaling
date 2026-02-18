// 用 Supabase service role 執行 SQL — 拆分多語種 OT 記錄
// 使用方式: node scripts/split_multi_ot.mjs

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wlomyjuuqovdatrxrfpu.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
    console.error('Please set SUPABASE_SERVICE_ROLE_KEY environment variable');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// 語種偵測函數
function detectLanguage(ot) {
    if (!ot) return 'Other';
    if (/[가-힣]/.test(ot)) return 'Korean';
    if (/[ぁ-んァ-ヶー]/.test(ot)) return 'Japanese';
    if (/[\u4e00-\u9fff]/.test(ot)) return 'Chinese';
    return 'Other';
}

async function main() {
    console.log('=== 步驟 1: 查找需要拆分的記錄 ===');

    // 取得所有含有 ' / ' 的 original_trainer 記錄
    const { data: allDists, error: fetchError } = await supabase
        .from('distributions')
        .select('*')
        .like('original_trainer', '% / %');

    if (fetchError) {
        console.error('查詢失敗:', fetchError);
        return;
    }

    console.log(`找到 ${allDists.length} 筆含有 ' / ' 的記錄`);

    // 篩選：只拆分分段後有 ≥ 2 種不同語種的記錄
    const recordsToSplit = [];
    const recordsToSkip = [];

    for (const dist of allDists) {
        const parts = dist.original_trainer.split(' / ');
        const languages = parts.map(p => detectLanguage(p.trim()));
        const uniqueLangs = new Set(languages);

        if (uniqueLangs.size >= 2) {
            recordsToSplit.push({ dist, parts, languages });
        } else {
            recordsToSkip.push(dist);
        }
    }

    console.log(`需要拆分: ${recordsToSplit.length} 筆`);
    console.log(`跳過（單一語種）: ${recordsToSkip.length} 筆`);

    console.log('\n--- 跳過的記錄（OT 含 / 但屬於同一語種）---');
    for (const d of recordsToSkip) {
        console.log(`  ${d.pokemon_name}: ${d.original_trainer}`);
    }

    console.log('\n--- 將要拆分的記錄 ---');
    for (const { dist, parts, languages } of recordsToSplit) {
        console.log(`  ${dist.pokemon_name}: ${dist.original_trainer}`);
        parts.forEach((p, i) => {
            console.log(`    → [${languages[i]}] ${p.trim()}`);
        });
    }

    console.log('\n=== 步驟 2: 執行拆分 ===');

    let insertCount = 0;
    let updateCount = 0;
    let errorCount = 0;

    for (const { dist, parts, languages } of recordsToSplit) {
        // 解析 trainer_id
        const tidParts = dist.trainer_id ? dist.trainer_id.split(', ') : [];
        const tidMatchesOt = tidParts.length === parts.length;

        // 為第 2, 3, 4... 個 OT 插入新記錄
        for (let i = 1; i < parts.length; i++) {
            const newOt = parts[i].trim();
            const newTid = tidMatchesOt ? tidParts[i].trim() : dist.trainer_id;

            const newRecord = {
                pokemon_name: dist.pokemon_name,
                pokemon_name_en: dist.pokemon_name_en,
                pokemon_dex_number: dist.pokemon_dex_number,
                generation: dist.generation,
                game_titles: dist.game_titles,
                original_trainer: newOt,
                trainer_id: newTid,
                level: dist.level,
                distribution_method: dist.distribution_method,
                distribution_period_start: dist.distribution_period_start,
                distribution_period_end: dist.distribution_period_end,
                region: dist.region,
                image_url: dist.image_url,
                wiki_url: dist.wiki_url,
                is_shiny: dist.is_shiny,
                special_move: dist.special_move,
                pokemon_sprite_url: dist.pokemon_sprite_url,
                pokeball_image_url: dist.pokeball_image_url,
                event_name: dist.event_name,
                points: dist.points,  // 先複製原始點數
            };

            const { error: insertError } = await supabase
                .from('distributions')
                .insert(newRecord);

            if (insertError) {
                console.error(`  ❌ INSERT 失敗 (${dist.pokemon_name} - ${newOt}):`, insertError.message);
                errorCount++;
            } else {
                console.log(`  ✅ INSERT: ${dist.pokemon_name} → [${languages[i]}] ${newOt}`);
                insertCount++;
            }
        }

        // 更新原始記錄 → 只保留第一個 OT
        const firstOt = parts[0].trim();
        const firstTid = tidMatchesOt ? tidParts[0].trim() : dist.trainer_id;

        const { error: updateError } = await supabase
            .from('distributions')
            .update({
                original_trainer: firstOt,
                trainer_id: firstTid,
            })
            .eq('id', dist.id);

        if (updateError) {
            console.error(`  ❌ UPDATE 失敗 (${dist.pokemon_name}):`, updateError.message);
            errorCount++;
        } else {
            console.log(`  ✅ UPDATE: ${dist.pokemon_name} → [${languages[0]}] ${firstOt}`);
            updateCount++;
        }
    }

    console.log('\n=== 步驟 3: 結果 ===');
    console.log(`插入新記錄: ${insertCount}`);
    console.log(`更新原始記錄: ${updateCount}`);
    console.log(`錯誤: ${errorCount}`);

    // 驗證：查看故勒頓的拆分結果
    console.log('\n=== 步驟 4: 驗證 (故勒頓) ===');
    const { data: verify } = await supabase
        .from('distributions')
        .select('pokemon_name, original_trainer, trainer_id, points')
        .like('pokemon_name', '%故勒頓%');

    if (verify) {
        for (const v of verify) {
            const lang = detectLanguage(v.original_trainer);
            console.log(`  ${v.pokemon_name} [${lang}]: OT=${v.original_trainer}, TID=${v.trainer_id}, Points=${v.points}`);
        }
    }

    // 總數
    const { count: newTotal } = await supabase
        .from('distributions')
        .select('*', { count: 'exact', head: true });
    console.log(`\n資料庫總記錄數: ${newTotal}`);
}

main().catch(console.error);
