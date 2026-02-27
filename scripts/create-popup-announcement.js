#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAnnouncement() {
  console.log('📢 正在建立彈窗公告...');
  
  const announcement = {
    title: '🎁 仙子伊布配布盲盒活動開跑！',
    content: '萬眾矚目的「仙子伊布配布盲盒」活動正式上線！\n\n每個盲盒包含 2 隻珍貴寶可夢：\n• 伊布（Eevee）\n• 仙子伊布（Sylveon）- 點數 75,000～400,000 隨機抽取！\n\n限量 50 盒，機會難得，趕快前往活動頁面報名參加吧！',
    status: 'published',
    image_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/700.png',
    show_popup: true,
    show_in_list: true
  };
  
  const { data, error } = await supabase
    .from('announcements')
    .insert(announcement)
    .select();
  
  if (error) {
    console.error('❌ Error:', error);
    return false;
  }

  console.log('✅ 彈窗公告建立成功！');
  console.log(`📝 標題: ${data[0].title}`);
  console.log(`🖼️ 圖片: ${data[0].image_url}`);
  return true;
}

createAnnouncement()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
