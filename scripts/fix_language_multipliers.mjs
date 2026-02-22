import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://wlomyjuuqovdatrxrfpu.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsb215anV1cW92ZGF0cnhyZnB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk0ODYzMSwiZXhwIjoyMDc4NTI0NjMxfQ.muWQthxiqQo0gFmIqR5ri8dGiRArKj_CK_sDKrPPPko'
);

// 語言乘數
const MULTIPLIERS = {
    Korean: 3.0,
    Japanese: 1.7,
    Other: 1.0
};

// 語種識別
function detectLanguage(ot) {
    if (!ot) return 'Other';
    if (/[가-힣]/.test(ot)) return 'Korean';
    if (/[ぁ-んァ-ヶー一-龠]/.test(ot)) return 'Japanese';
    return 'Other';
}

// 取得所有配布
const { data: allDists, error } = await supabase
    .from('distributions')
    .select('id, pokemon_name, pokemon_name_en, pokemon_dex_number, original_trainer, points')
    .order('pokemon_dex_number');

if (error) { console.error(error); process.exit(1); }

// 按寶可夢名稱+圖鑑號分組
const groups = {};
for (const d of allDists) {
    const key = `${d.pokemon_name}|${d.pokemon_dex_number}`;
    if (!groups[key]) groups[key] = [];
    d.language = detectLanguage(d.original_trainer);
    groups[key].push(d);
}

// 找出有多語版本但點數相同的寶可夢
const needsFix = [];
const alreadyCorrect = [];

for (const [key, dists] of Object.entries(groups)) {
    const languages = new Set(dists.map(d => d.language));
    if (languages.size <= 1) continue; // 只有一種語言，跳過

    // 檢查是否所有版本點數都一樣
    const points = dists.map(d => d.points);
    const allSame = points.every(p => p === points[0]);

    if (allSame && points[0] > 0) {
        needsFix.push({ key, dists, basePoints: points[0] });
    } else if (!allSame) {
        // 檢查比例是否正確
        const otherDists = dists.filter(d => d.language === 'Other');
        const basePoints = otherDists.length > 0 ? Math.min(...otherDists.map(d => d.points)) : Math.min(...dists.map(d => d.points));

        for (const d of dists) {
            const expected = Math.round(basePoints * MULTIPLIERS[d.language]);
            const ratio = d.points / basePoints;
            const expectedRatio = MULTIPLIERS[d.language];
            if (Math.abs(ratio - expectedRatio) > 0.15 && d.language !== 'Other') {
                needsFix.push({ key, dists, basePoints, partial: true });
                break;
            }
        }
    }
}

if (needsFix.length === 0) {
    console.log('✅ 所有多語版本配布的點數乘數都正確！');
    process.exit(0);
}

console.log(`\n🔍 找到 ${needsFix.length} 組需要修正的配布：\n`);

const updates = [];

for (const { key, dists, basePoints } of needsFix) {
    const name = dists[0].pokemon_name;
    // 找基準點數（Other 版本或最低點數）
    const otherDists = dists.filter(d => d.language === 'Other');
    const base = otherDists.length > 0
        ? Math.min(...otherDists.map(d => d.points))
        : Math.min(...dists.map(d => d.points));

    console.log(`📦 ${name} (基準: ${base})`);

    for (const d of dists) {
        const multiplier = MULTIPLIERS[d.language];
        const newPoints = Math.round(base * multiplier);

        if (d.points !== newPoints) {
            console.log(`   ${d.language.padEnd(8)} OT: ${d.original_trainer?.padEnd(15)} | ${d.points} → ${newPoints} (×${multiplier})`);
            updates.push({ id: d.id, newPoints, name: d.pokemon_name, ot: d.original_trainer, lang: d.language });
        } else {
            console.log(`   ${d.language.padEnd(8)} OT: ${d.original_trainer?.padEnd(15)} | ${d.points} ✅ 正確`);
        }
    }
    console.log('');
}

if (updates.length === 0) {
    console.log('✅ 經檢查，無需更新。');
    process.exit(0);
}

console.log(`\n🔧 準備更新 ${updates.length} 筆記錄...\n`);

let successCount = 0;
for (const u of updates) {
    const { error: updateErr } = await supabase
        .from('distributions')
        .update({ points: u.newPoints })
        .eq('id', u.id);

    if (updateErr) {
        console.error(`   ❌ ${u.name} (${u.ot}): ${updateErr.message}`);
    } else {
        successCount++;
    }
}

console.log(`\n✅ 成功更新 ${successCount}/${updates.length} 筆記錄！`);
