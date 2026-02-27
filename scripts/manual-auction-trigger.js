require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 確定性 hash
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return hash;
}

const AUCTION_DESCRIPTIONS = [
    "手快有手慢無！",
    "閃電戰！限時搶標",
    "稀有配布，不容錯過",
    "今日幸運寶可夢",
    "錯過再等明天！",
    "訓練家的榮耀之戰",
    "精準出手，一擊必殺",
    "誰能成為最後贏家？",
    "超值配布限時釋出",
    "新鮮上架，快來搶！",
    "倒數計時！把握機會",
    "驚喜拍賣開始啦",
    "勇者限定！敢來挑戰嗎",
    "今日份的驚喜配布",
    "命運的轉盤開始旋轉",
    "王者爭奪戰",
    "火速開標！手腳要快",
    "神秘寶可夢現身",
    "每一次出價都是命運",
    "你的寶可夢在等你",
];

async function manualTrigger() {
    const now = new Date();
    console.log('現在時間 (台灣):', now.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }));

    // 1. 結標所有過期的競標
    console.log('\n=== 步驟 1: 結標過期競標 ===');
    const { data: expired, error: expErr } = await supabase
        .from('auctions')
        .update({ status: 'ended' })
        .eq('status', 'active')
        .lt('end_time', now.toISOString())
        .select('id');

    if (expErr) {
        console.error('結標失敗:', expErr);
    } else {
        console.log('已結標:', (expired || []).length, '場');
    }

    // 2. 查詢第 9 世代所有可用配布
    console.log('\n=== 步驟 2: 查詢配布資料 ===');
    const { data: distributions, error: distErr } = await supabase
        .from('distributions')
        .select('id, pokemon_name, pokemon_name_en, pokemon_dex_number, pokemon_sprite_url, image_url, is_shiny, original_trainer, level')
        .eq('generation', 9);

    if (distErr) {
        console.error('查詢配布失敗:', distErr);
        return;
    }
    console.log('找到', distributions.length, '個第 9 世代配布');

    if (distributions.length === 0) {
        console.log('沒有第 9 世代的配布資料，無法建立競標');
        return;
    }

    // 3. 檢查今天是否已有競標
    const todayTW = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
    const todayDateStr = todayTW.getFullYear() + '-' + String(todayTW.getMonth() + 1).padStart(2, '0') + '-' + String(todayTW.getDate()).padStart(2, '0');

    const startOfDay = new Date(todayDateStr + 'T00:00:00+08:00');
    const endOfDay = new Date(todayDateStr + 'T23:59:59+08:00');

    const { count: existingCount } = await supabase
        .from('auctions')
        .select('id', { count: 'exact', head: true })
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString());

    if (existingCount > 0) {
        console.log('今天已有', existingCount, '場競標，跳過建立');
        return;
    }

    // 4. 建立今天的競標時段 (07:00 ~ 22:00, 每 10 分鐘)
    console.log('\n=== 步驟 3: 建立今天的競標 ===');
    const slots = [];
    for (let hour = 7; hour < 22; hour++) {
        for (let min = 0; min < 60; min += 10) {
            const startUTC = new Date(todayDateStr + 'T' + String(hour).padStart(2, '0') + ':' + String(min).padStart(2, '0') + ':00+08:00');
            const endUTC = new Date(startUTC.getTime() + 10 * 60 * 1000);
            slots.push({ start: startUTC, end: endUTC });
        }
    }

    const auctions = slots.map((slot, index) => {
        const seed = hashCode(todayDateStr + '-' + index);
        const distIndex = Math.abs(seed) % distributions.length;
        const selected = distributions[distIndex];

        const shinyPrefix = selected.is_shiny ? '✨ ' : '';
        const title = shinyPrefix + selected.pokemon_name + (selected.pokemon_name_en ? ' (' + selected.pokemon_name_en + ')' : '');

        const descSeed = hashCode(todayDateStr + '-desc-' + index);
        const descIndex = Math.abs(descSeed) % AUCTION_DESCRIPTIONS.length;

        return {
            distribution_id: selected.id,
            title: title,
            description: AUCTION_DESCRIPTIONS[descIndex],
            image_url: selected.pokemon_sprite_url || selected.image_url,
            starting_price: 100,
            min_increment: 100,
            current_price: 0,
            start_time: slot.start.toISOString(),
            end_time: slot.end.toISOString(),
            status: 'active',
            bid_count: 0,
        };
    });

    const { data: inserted, error: insertErr } = await supabase
        .from('auctions')
        .insert(auctions)
        .select('id');

    if (insertErr) {
        console.error('建立競標失敗:', insertErr);
    } else {
        console.log('成功建立', inserted.length, '場競標');
        console.log('時段: ' + todayDateStr + ' 07:00 ~ 22:00');
        console.log('範例:', auctions.slice(0, 3).map(a => a.title).join(', '));
    }
}

manualTrigger();
