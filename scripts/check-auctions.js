require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAuctions() {
    const now = new Date();
    console.log('現在時間 (UTC):', now.toISOString());
    console.log('現在時間 (台灣):', now.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }));

    // 查最近 3 天的競標
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
        .from('auctions')
        .select('id, title, start_time, end_time, status')
        .gte('start_time', threeDaysAgo.toISOString())
        .order('start_time', { ascending: false })
        .limit(20);

    if (error) {
        console.error('查詢失敗:', error);
        return;
    }

    console.log('\n最近 3 天的競標紀錄 (最新 20 筆):');
    console.log('總共找到:', data.length, '筆');

    if (data.length === 0) {
        console.log('沒有找到任何競標！Cron 可能沒有觸發。');
        return;
    }

    // 按日期分組
    const byDate = {};
    data.forEach(a => {
        const dateStr = new Date(a.start_time).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' });
        if (!byDate[dateStr]) byDate[dateStr] = [];
        byDate[dateStr].push(a);
    });

    Object.keys(byDate).sort().reverse().forEach(date => {
        const auctions = byDate[date];
        const active = auctions.filter(a => a.status === 'active').length;
        const ended = auctions.filter(a => a.status === 'ended').length;
        console.log('\n' + date + ': ' + auctions.length + ' 場 (active: ' + active + ', ended: ' + ended + ')');
        
        auctions.slice(0, 3).forEach(a => {
            const startTW = new Date(a.start_time).toLocaleTimeString('zh-TW', { timeZone: 'Asia/Taipei' });
            const endTW = new Date(a.end_time).toLocaleTimeString('zh-TW', { timeZone: 'Asia/Taipei' });
            console.log('  - [' + a.status + '] ' + startTW + ' ~ ' + endTW + ' | ' + a.title);
        });
        if (auctions.length > 3) {
            console.log('  ... 還有 ' + (auctions.length - 3) + ' 場');
        }
    });

    // 檢查今天有沒有
    const todayStr = now.toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' });
    if (!byDate[todayStr]) {
        console.log('\n今天 (' + todayStr + ') 沒有任何競標！Cron 今天可能沒有觸發。');
    } else {
        console.log('\n今天 (' + todayStr + ') 有 ' + byDate[todayStr].length + ' 場競標');
    }
}

checkAuctions();
