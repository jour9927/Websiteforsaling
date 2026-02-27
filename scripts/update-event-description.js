#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateDescription() {
  const eventId = 'e956ea35-fa17-46ba-a260-7c1b88cd355d';
  
  const detailedDescription = `🎁 仙子伊布配布盲盒 - 限量寶可夢配布活動

📌 活動說明
每個盲盒包含 2 隻珍貴寶可夢：
• 伊布（Eevee）- 經典進化前寶可夢
• 仙子伊布（Sylveon）- 高點數配布版本（75,000～400,000 點數隨機）

💰 定價：NT$5,990 / 盒

📊 活動規模
• 總數：50 盒

🎯 參與方式
1. 在線上完成付款報名（NT$5,990）
2. 於活動現場領取盲盒
3. 現場報名者可直接購買（需現場支付）

🌟 特色亮點
✨ - 仙子伊布的點數在 75,000～400,000 點間隨機抽取
✨ 限量配布 - 僅此 50 盒，機會難得
✨ 雙寶可夢組合 - 每盒都能獲得 2 隻珍稀寶可夢
✨ 集點利器 - 高點數仙子伊布可快速累積集點

📅 活動時間
日期：2026 年 3 月 12 日（星期四）
時間：10:00 ～ 18:00

📍 活動地點
配布活動現場

⚠️ 注意事項
• 需完成線上付款或現場報名
• 每個帳號限購 1 盒
• 獲得的寶可夢將自動加入您的背包

🎊 趕快報名，這是您集點的絕佳機會！`;

  const { data, error } = await supabase
    .from('events')
    .update({ description: detailedDescription })
    .eq('id', eventId)
    .select();
  
  if (error) {
    console.error('❌ Error:', error);
    return false;
  } else {
    console.log('✅ Event description updated!\n');
    console.log('📝 updated description:');
    console.log('─'.repeat(60));
    console.log(detailedDescription);
    console.log('─'.repeat(60) + '\n');
    return true;
  }
}

updateDescription()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
