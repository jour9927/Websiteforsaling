// 手動拆分含事件附註的特殊多語種 OT 記錄
// SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/fix_special_ot.mjs

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wlomyjuuqovdatrxrfpu.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

const supabase = createClient(supabaseUrl, serviceRoleKey);

function detectLanguage(ot) {
    if (!ot) return 'Other';
    if (/[가-힣]/.test(ot)) return 'Korean';
    if (/[ぁ-んァ-ヶー]/.test(ot)) return 'Japanese';
    if (/[\u4e00-\u9fff]/.test(ot)) return 'Chinese';
    return 'Other';
}

// 需要手動拆分的記錄定義：
// original_trainer 完全匹配 → 拆成多筆（每筆一個 OT）
const MANUAL_SPLITS = [
    {
        // 爆焰龜獸: カキ（日本）/ 키아웨（韓國）
        original_trainer_match: 'カキ / （ / 日本活動 / ） / 키아웨 / （ / 韓國活動 / ）',
        splits: [
            { ot: 'カキ' },      // 日文 OT → 保留在原始記錄
            { ot: '키아웨' },    // 韓文 OT → 新記錄
        ]
    },
    {
        // 路卡利歐: ソウジ（日本）/ 민준（韓國）
        original_trainer_match: 'ソウジ / （ / 日本活動 / ） / 민준 / （ / 韓國活動 / ）',
        splits: [
            { ot: 'ソウジ' },
            { ot: '민준' },
        ]
    },
    {
        // 波加曼: マコト（日本）/ 다연（韓國）
        original_trainer_match: 'マコト / （ / 日本活動 / ） / 다연 / （ / 韓國活動 / ）',
        splits: [
            { ot: 'マコト' },
            { ot: '다연' },
        ]
    },
    {
        // 甜舞妮: ID No., マオ（日本）/ 마오（韓國）
        original_trainer_match: 'ID / No / ., マオ / （ / 日本活動 / ） / 마오 / （ / 韓國活動 / ）',
        splits: [
            { ot: 'マオ' },
            { ot: '마오' },
        ]
    },
    {
        // 固拉多: ウルトラ（日本）/ 울트라（韓國）
        original_trainer_match: 'ウルトラ / （ / 日本活動 / ） / 울트라 / （ / 韓國活動 / ）',
        pokemon_hint: '固拉多',
        splits: [
            { ot: 'ウルトラ' },
            { ot: '울트라' },
        ]
    },
    {
        // 蓋歐卡: ウルトラ（日本）/ 울트라（韓國）
        original_trainer_match: 'ウルトラ / （ / 日本活動 / ） / 울트라 / （ / 韓國活動 / ）',
        pokemon_hint: '蓋歐卡',
        splits: [
            { ot: 'ウルトラ' },
            { ot: '울트라' },
        ]
    },
];

async function main() {
    console.log('=== 查找需要手動拆分的記錄 ===\n');

    let totalInserts = 0;
    let totalUpdates = 0;

    for (const rule of MANUAL_SPLITS) {
        // 查找匹配的記錄
        let query = supabase
            .from('distributions')
            .select('*')
            .eq('original_trainer', rule.original_trainer_match);

        if (rule.pokemon_hint) {
            query = query.like('pokemon_name', `%${rule.pokemon_hint}%`);
        }

        const { data: matches, error } = await query;

        if (error) {
            console.error(`❌ 查詢失敗: ${error.message}`);
            continue;
        }

        if (!matches || matches.length === 0) {
            console.log(`⚠️  未找到: OT="${rule.original_trainer_match}"${rule.pokemon_hint ? ` (${rule.pokemon_hint})` : ''}`);
            continue;
        }

        for (const dist of matches) {
            console.log(`📋 ${dist.pokemon_name}: ${dist.original_trainer}`);

            // 第 1 個 OT → UPDATE 原始記錄
            const firstOt = rule.splits[0].ot;
            const { error: updateErr } = await supabase
                .from('distributions')
                .update({ original_trainer: firstOt })
                .eq('id', dist.id);

            if (updateErr) {
                console.error(`  ❌ UPDATE: ${updateErr.message}`);
            } else {
                console.log(`  ✅ UPDATE → [${detectLanguage(firstOt)}] ${firstOt}`);
                totalUpdates++;
            }

            // 第 2+ 個 OT → INSERT 新記錄
            for (let i = 1; i < rule.splits.length; i++) {
                const newOt = rule.splits[i].ot;
                const newRecord = { ...dist };
                delete newRecord.id;
                delete newRecord.created_at;
                newRecord.original_trainer = newOt;

                const { error: insertErr } = await supabase
                    .from('distributions')
                    .insert(newRecord);

                if (insertErr) {
                    console.error(`  ❌ INSERT: ${insertErr.message}`);
                } else {
                    console.log(`  ✅ INSERT → [${detectLanguage(newOt)}] ${newOt}`);
                    totalInserts++;
                }
            }
        }
    }

    console.log(`\n=== 結果 ===`);
    console.log(`更新: ${totalUpdates}, 插入: ${totalInserts}`);

    // 驗證
    console.log(`\n=== 驗證 ===`);
    const keywords = ['爆焰龜獸', '路卡利歐', '波加曼', '甜舞妮', '固拉多', '蓋歐卡'];
    for (const kw of keywords) {
        const { data } = await supabase
            .from('distributions')
            .select('pokemon_name, original_trainer, trainer_id, points')
            .like('pokemon_name', `%${kw}%`);
        if (data && data.length > 0) {
            console.log(`\n${kw}:`);
            for (const d of data) {
                console.log(`  [${detectLanguage(d.original_trainer)}] OT=${d.original_trainer} TID=${d.trainer_id} Points=${d.points}`);
            }
        }
    }

    const { count } = await supabase
        .from('distributions')
        .select('*', { count: 'exact', head: true });
    console.log(`\n總記錄數: ${count}`);

    // 最終檢查：還有沒有殘留的事件附註格式 OT
    const { data: remaining } = await supabase
        .from('distributions')
        .select('pokemon_name, original_trainer')
        .like('original_trainer', '%日本活動%');
    console.log(`\n仍含「日本活動」的記錄: ${remaining?.length || 0}`);
    if (remaining) remaining.forEach(r => console.log(`  ${r.pokemon_name}: ${r.original_trainer}`));
}

main().catch(console.error);
