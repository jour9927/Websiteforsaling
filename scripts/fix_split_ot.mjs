// 修復 — 從備份還原並重新拆分（只拆真正的多語種 OT）
// 使用方式: SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/fix_split_ot.mjs

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wlomyjuuqovdatrxrfpu.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
    console.error('Please set SUPABASE_SERVICE_ROLE_KEY environment variable');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

function detectLanguage(ot) {
    if (!ot) return 'Other';
    if (/[가-힣]/.test(ot)) return 'Korean';
    if (/[ぁ-んァ-ヶー]/.test(ot)) return 'Japanese';
    if (/[\u4e00-\u9fff]/.test(ot)) return 'Chinese';
    return 'Other';
}

// 已知的多語種 OT 模板
// 只有這些特定格式才需要拆分
const KNOWN_MULTI_LANG_PATTERNS = [
    // 格式: EN / JP / KR / CN（4語種）
    // 例: Paldea / パルデア / 팔데아 / 帕底亞帕底亞
    // 例: サトシ / AshSacha / 지우 / 小智
    // 例: ガラル / Galar / 가라르 / 伽勒爾伽勒爾
    // 例: ポケセン / PokéCenter / 寶可夢中心
    // 例: Eclipse / 이클립스 / にっしょく
    // 例: だいさくせん / 대작전
    // 例: ポケセン / ♪
];

// 判斷一個 OT 字串是否是「真正的多語種 OT」（而非只是名稱含有 /）
function isGenuineMultiLangOT(ot) {
    const parts = ot.split(' / ');
    if (parts.length < 2) return false;

    // 排除已知的非多語種格式
    // ID / No / ., XXX — 這是 Gen5 壞蛋組織的 OT 格式
    if (ot.startsWith('ID / No /')) return false;

    // 包含 （ 或 ） — 這是事件附註，不是 OT 分隔
    if (ot.includes('（') || ot.includes('）')) return false;

    // 檢查：每個分段都必須是「一個有意義的名稱」（不能是單個字元或標點）
    const validParts = parts.filter(p => {
        const trimmed = p.trim();
        // 每個部分至少要 1 個字元，不能只是標點符號
        return trimmed.length >= 1 && !/^[.,!?;:]+$/.test(trimmed);
    });

    if (validParts.length < 2) return false;

    // 檢查分段語種多樣性（至少 2 種不同語種）
    const languages = validParts.map(p => detectLanguage(p.trim()));
    const uniqueLangs = new Set(languages);

    return uniqueLangs.size >= 2;
}

async function main() {
    // ============================================
    // 步驟 1: 還原備份
    // ============================================
    console.log('=== 步驟 1: 從備份還原 ===');

    // 先取得備份資料
    const { data: backup, error: backupError } = await supabase
        .from('distributions_backup_split_ot')
        .select('*');

    if (backupError) {
        console.error('無法讀取備份:', backupError.message);
        return;
    }
    console.log(`備份有 ${backup.length} 筆記錄`);

    // 刪除目前 distributions 表的所有記錄
    // 注意：先刪除 user_distributions 中引用到「新增的」distributions 的記錄
    // （新增的記錄不在備份中，所以不會有 user_distributions）

    // 取得備份中的所有 id
    const backupIds = new Set(backup.map(b => b.id));

    // 找出新加入的記錄（在 distributions 但不在備份中）
    const { data: currentAll, error: currentError } = await supabase
        .from('distributions')
        .select('id');

    if (currentError) {
        console.error('無法讀取當前記錄:', currentError.message);
        return;
    }

    const newIds = currentAll.filter(d => !backupIds.has(d.id)).map(d => d.id);
    console.log(`需要刪除的新記錄: ${newIds.length}`);

    // 刪除新增的記錄
    if (newIds.length > 0) {
        // 分批刪除（每次 50 筆）
        for (let i = 0; i < newIds.length; i += 50) {
            const batch = newIds.slice(i, i + 50);
            const { error: delError } = await supabase
                .from('distributions')
                .delete()
                .in('id', batch);
            if (delError) {
                console.error(`  ❌ 刪除失敗 (batch ${i}):`, delError.message);
            } else {
                console.log(`  ✅ 刪除 ${batch.length} 筆新記錄`);
            }
        }
    }

    // 還原被修改的原始記錄（把 original_trainer 和 trainer_id 恢復到原始值）
    let restoreCount = 0;
    for (const b of backup) {
        const { data: current } = await supabase
            .from('distributions')
            .select('original_trainer, trainer_id')
            .eq('id', b.id)
            .single();

        if (current && (current.original_trainer !== b.original_trainer || current.trainer_id !== b.trainer_id)) {
            const { error: restoreError } = await supabase
                .from('distributions')
                .update({
                    original_trainer: b.original_trainer,
                    trainer_id: b.trainer_id
                })
                .eq('id', b.id);

            if (restoreError) {
                console.error(`  ❌ 還原失敗 (${b.pokemon_name}):`, restoreError.message);
            } else {
                restoreCount++;
            }
        }
    }
    console.log(`還原 ${restoreCount} 筆被修改的記錄`);

    // 驗證
    const { count: afterRestore } = await supabase
        .from('distributions')
        .select('*', { count: 'exact', head: true });
    console.log(`還原後總數: ${afterRestore} (應為 ${backup.length})`);

    // ============================================
    // 步驟 2: 正確地重新拆分
    // ============================================
    console.log('\n=== 步驟 2: 重新分析需要拆分的記錄 ===');

    const { data: allDists } = await supabase
        .from('distributions')
        .select('*')
        .like('original_trainer', '% / %');

    const toSplit = [];
    const toSkip = [];

    for (const dist of allDists) {
        if (isGenuineMultiLangOT(dist.original_trainer)) {
            toSplit.push(dist);
        } else {
            toSkip.push(dist);
        }
    }

    console.log(`真正需要拆分: ${toSplit.length} 筆`);
    console.log(`跳過: ${toSkip.length} 筆`);

    console.log('\n--- 跳過的記錄（/ 只是名稱格式）---');
    for (const d of toSkip) {
        console.log(`  ✋ ${d.pokemon_name}: ${d.original_trainer}`);
    }

    console.log('\n--- 將要拆分的記錄 ---');
    for (const dist of toSplit) {
        const parts = dist.original_trainer.split(' / ');
        console.log(`  📋 ${dist.pokemon_name}: ${dist.original_trainer}`);
        parts.forEach(p => {
            console.log(`     → [${detectLanguage(p.trim())}] ${p.trim()}`);
        });
    }

    // ============================================
    // 步驟 3: 執行拆分
    // ============================================
    console.log('\n=== 步驟 3: 執行安全拆分 ===');

    let insertCount = 0;
    let updateCount = 0;
    let errorCount = 0;

    for (const dist of toSplit) {
        const parts = dist.original_trainer.split(' / ').map(p => p.trim());
        const tidParts = dist.trainer_id ? dist.trainer_id.split(', ').map(t => t.trim()) : [];
        const tidMatchesOt = tidParts.length === parts.length;

        // INSERT 新記錄（第 2, 3, 4... 個 OT）
        for (let i = 1; i < parts.length; i++) {
            const newOt = parts[i];
            const newTid = tidMatchesOt ? tidParts[i] : dist.trainer_id;

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
                points: dist.points,
            };

            const { error: insertError } = await supabase
                .from('distributions')
                .insert(newRecord);

            if (insertError) {
                console.error(`  ❌ INSERT: ${dist.pokemon_name} - ${newOt}: ${insertError.message}`);
                errorCount++;
            } else {
                console.log(`  ✅ INSERT: ${dist.pokemon_name} → [${detectLanguage(newOt)}] ${newOt}`);
                insertCount++;
            }
        }

        // UPDATE 原始記錄 → 只保留第一個 OT
        const firstOt = parts[0];
        const firstTid = tidMatchesOt ? tidParts[0] : dist.trainer_id;

        const { error: updateError } = await supabase
            .from('distributions')
            .update({ original_trainer: firstOt, trainer_id: firstTid })
            .eq('id', dist.id);

        if (updateError) {
            console.error(`  ❌ UPDATE: ${dist.pokemon_name}: ${updateError.message}`);
            errorCount++;
        } else {
            console.log(`  ✅ UPDATE: ${dist.pokemon_name} → [${detectLanguage(firstOt)}] ${firstOt}`);
            updateCount++;
        }
    }

    console.log('\n=== 結果 ===');
    console.log(`插入新記錄: ${insertCount}`);
    console.log(`更新原始記錄: ${updateCount}`);
    console.log(`錯誤: ${errorCount}`);

    // ============================================
    // 步驟 4: 驗證
    // ============================================
    console.log('\n=== 步驟 4: 驗證 ===');

    const { data: verify1 } = await supabase
        .from('distributions')
        .select('pokemon_name, original_trainer, trainer_id, points')
        .like('pokemon_name', '%故勒頓%');

    console.log('\n故勒頓:');
    for (const v of verify1 || []) {
        console.log(`  [${detectLanguage(v.original_trainer)}] OT=${v.original_trainer} TID=${v.trainer_id} Points=${v.points}`);
    }

    const { data: verify2 } = await supabase
        .from('distributions')
        .select('pokemon_name, original_trainer, trainer_id')
        .like('pokemon_name', '%尼多王%');

    console.log('\n尼多王（應保持原樣，不拆分）:');
    for (const v of verify2 || []) {
        console.log(`  OT=${v.original_trainer} TID=${v.trainer_id}`);
    }

    const { count: finalCount } = await supabase
        .from('distributions')
        .select('*', { count: 'exact', head: true });
    console.log(`\n總記錄數: ${finalCount}`);

    // 檢查是否還有殘留的多語種 OT
    const { data: remaining } = await supabase
        .from('distributions')
        .select('pokemon_name, original_trainer')
        .like('original_trainer', '% / %');

    console.log(`\n仍含有 ' / ' 的記錄: ${remaining?.length || 0}`);
    if (remaining && remaining.length > 0) {
        for (const r of remaining) {
            const isMulti = isGenuineMultiLangOT(r.original_trainer);
            console.log(`  ${isMulti ? '⚠️ 未拆' : '✅ 正確'} ${r.pokemon_name}: ${r.original_trainer}`);
        }
    }
}

main().catch(console.error);
