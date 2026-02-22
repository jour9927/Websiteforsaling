import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://wlomyjuuqovdatrxrfpu.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsb215anV1cW92ZGF0cnhyZnB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk0ODYzMSwiZXhwIjoyMDc4NTI0NjMxfQ.muWQthxiqQo0gFmIqR5ri8dGiRArKj_CK_sDKrPPPko'
);

function detectLang(ot) {
    if (!ot) return 'Other';
    if (/[가-힣]/.test(ot)) return 'Korean';
    if (/[ぁ-んァ-ヶー一-龠]/.test(ot)) return 'Japanese';
    return 'Other';
}

const { data, error } = await supabase.from('distributions')
    .select('id, pokemon_name, pokemon_dex_number, original_trainer, points');

if (error) { console.error(error); process.exit(1); }

// 分組
const groups = {};
for (const d of data) {
    const key = `${d.pokemon_name}|${d.pokemon_dex_number}`;
    if (!groups[key]) groups[key] = [];
    d.lang = detectLang(d.original_trainer);
    groups[key].push(d);
}

// 找韓版需要更新的
const updates = [];
for (const [key, dists] of Object.entries(groups)) {
    const langs = new Set(dists.map(d => d.lang));
    if (langs.size <= 1) continue;

    const others = dists.filter(d => d.lang === 'Other');
    const base = others.length > 0
        ? Math.min(...others.map(d => d.points))
        : Math.min(...dists.filter(d => d.lang !== 'Korean').map(d => d.points));

    if (base <= 0) continue;

    for (const d of dists) {
        if (d.lang !== 'Korean') continue;
        const newPts = Math.round(base * 2.2);
        if (d.points !== newPts) {
            updates.push({ id: d.id, name: d.pokemon_name, ot: d.original_trainer, old: d.points, newPts });
        }
    }
}

console.log(`韓版乘數 3.0 → 2.2，需更新 ${updates.length} 筆：\n`);

let ok = 0;
for (const u of updates) {
    const { error: err } = await supabase.from('distributions').update({ points: u.newPts }).eq('id', u.id);
    if (err) {
        console.error(`❌ ${u.name} (${u.ot}): ${err.message}`);
    } else {
        console.log(`✅ ${u.name} (${u.ot}) ${u.old} → ${u.newPts}`);
        ok++;
    }
}

console.log(`\n完成！${ok}/${updates.length} 筆已更新`);
