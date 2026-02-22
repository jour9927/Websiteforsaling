import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://wlomyjuuqovdatrxrfpu.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsb215anV1cW92ZGF0cnhyZnB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk0ODYzMSwiZXhwIjoyMDc4NTI0NjMxfQ.muWQthxiqQo0gFmIqR5ri8dGiRArKj_CK_sDKrPPPko'
);

// ============================================
// Step 1: 插入 NAIC 錦標賽木木梟配布
// ============================================
console.log('📦 Step 1: 插入 NAIC 錦標賽木木梟配布...');

const { data: existingRowlet } = await supabase
    .from('distributions')
    .select('id')
    .eq('pokemon_name', '木木梟')
    .eq('original_trainer', 'Eric')
    .limit(1);

let rowletId;
if (existingRowlet && existingRowlet.length > 0) {
    rowletId = existingRowlet[0].id;
    console.log(`  ✅ 已存在，ID: ${rowletId}`);
} else {
    const { data: newRowlet, error: rowletErr } = await supabase
        .from('distributions')
        .insert({
            pokemon_name: '木木梟',
            pokemon_name_en: 'Rowlet',
            pokemon_dex_number: 722,
            generation: 9,
            game_titles: ['Scarlet', 'Violet'],
            original_trainer: 'Eric',
            trainer_id: '220624',
            level: 5,
            distribution_method: 'Serial Code',
            distribution_period_start: '2022-06-24',
            distribution_period_end: '2022-06-27',
            region: 'Global',
            is_shiny: false,
            pokemon_sprite_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/722.png'
        })
        .select('id')
        .single();

    if (rowletErr) {
        console.error('  ❌ 插入失敗:', rowletErr.message);
        process.exit(1);
    }
    rowletId = newRowlet.id;
    console.log(`  ✅ 新增成功，ID: ${rowletId}`);
}

// ============================================
// Step 2: 取得其他 3 隻寶可夢的 distribution ID
// ============================================
console.log('\n🔍 Step 2: 查詢 4 隻寶可夢配布 ID...');

const pokemonConfig = [
    { name: '木木梟', ot: 'Eric', title: '錦標賽木木梟（Eric）', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/722.png' },
    { name: '卡蒂狗', ot: 'トウキョー', title: '東京卡蒂狗（トウキョー）', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/58.png' },
    { name: '夢夢蝕', ot: 'Fennel', title: '真菰的夢夢蝕（Fennel）', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/517.png' },
    { name: '泡沫蛙', ot: 'はままつちょ', title: '浜松町泡沫蛙（はままつちょ）', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/656.png' },
];

const distIds = [];
for (const p of pokemonConfig) {
    const { data, error } = await supabase
        .from('distributions')
        .select('id')
        .eq('pokemon_name', p.name)
        .eq('original_trainer', p.ot)
        .limit(1)
        .single();

    if (error || !data) {
        console.error(`  ❌ 找不到 ${p.title}: ${error?.message}`);
        process.exit(1);
    }
    distIds.push(data.id);
    console.log(`  ✅ ${p.title} → ID: ${data.id}`);
}

// ============================================
// Step 3: 刪除今天未來時段的自動競標
// ============================================
console.log('\n🗑️  Step 3: 刪除今天未來時段無人出價的競標...');

const { data: deleted, error: delErr } = await supabase
    .from('auctions')
    .delete()
    .gte('start_time', '2026-02-19T09:30:00+08:00')
    .lt('start_time', '2026-02-20T00:00:00+08:00')
    .eq('bid_count', 0)
    .select('id');

if (delErr) {
    console.error('  ❌ 刪除失敗:', delErr.message);
} else {
    console.log(`  ✅ 已刪除 ${deleted?.length || 0} 場舊競標`);
}

// ============================================
// Step 4: 建立新競標 (09:30 ~ 21:50, 每 10 分鐘)
// ============================================
console.log('\n🎯 Step 4: 建立新競標...');

const descriptions = [
    '🧧 春節特別活動 Day 4',
    '🧧 春節限定競標',
    '🧧 新春開運配布',
    '🧧 恭喜發財！限時競標',
];

const auctions = [];
let slotIndex = 0;

for (let hour = 9; hour <= 21; hour++) {
    for (let minuteSlot = 0; minuteSlot < 6; minuteSlot++) {
        const minute = minuteSlot * 10;

        // 跳過 09:00, 09:10, 09:20
        if (hour === 9 && minute < 30) continue;

        const startTime = `2026-02-19T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+08:00`;
        const endDate = new Date(startTime);
        endDate.setMinutes(endDate.getMinutes() + 10);
        const endTime = endDate.toISOString();

        const idx = slotIndex % 4;
        const p = pokemonConfig[idx];

        auctions.push({
            distribution_id: distIds[idx],
            title: p.title,
            description: descriptions[idx],
            image_url: p.sprite,
            starting_price: 100,
            min_increment: 100,
            current_price: 0,
            start_time: startTime,
            end_time: endTime,
            status: 'active',
            bid_count: 0,
        });

        slotIndex++;
    }
}

console.log(`  📊 準備插入 ${auctions.length} 場競標...`);

// 批次插入（每次最多 50 筆）
let totalInserted = 0;
for (let i = 0; i < auctions.length; i += 50) {
    const batch = auctions.slice(i, i + 50);
    const { data: inserted, error: insertErr } = await supabase
        .from('auctions')
        .insert(batch)
        .select('id');

    if (insertErr) {
        console.error(`  ❌ 批次 ${Math.floor(i/50)+1} 插入失敗:`, insertErr.message);
        process.exit(1);
    }
    totalInserted += inserted.length;
}

console.log(`  ✅ 成功建立 ${totalInserted} 場競標！`);

// ============================================
// Step 5: 驗證
// ============================================
console.log('\n📋 Step 5: 驗證前 8 場競標...');

const { data: verify } = await supabase
    .from('auctions')
    .select('title, starting_price, start_time, end_time, status')
    .gte('start_time', '2026-02-19T09:30:00+08:00')
    .lt('start_time', '2026-02-20T00:00:00+08:00')
    .order('start_time', { ascending: true })
    .limit(8);

if (verify) {
    verify.forEach((a, i) => {
        const start = new Date(a.start_time).toLocaleTimeString('zh-TW', { timeZone: 'Asia/Taipei', hour: '2-digit', minute: '2-digit' });
        const end = new Date(a.end_time).toLocaleTimeString('zh-TW', { timeZone: 'Asia/Taipei', hour: '2-digit', minute: '2-digit' });
        console.log(`  ${i+1}. [${start}~${end}] ${a.title} (起標: ${a.starting_price})`);
    });
}

console.log('\n🎉 完成！春節 Day 4 競標已全部設定好！');
