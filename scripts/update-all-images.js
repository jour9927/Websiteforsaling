#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateAllImages() {
  const eventId = 'e956ea35-fa17-46ba-a260-7c1b88cd355d';
  
  // 官方高清渲染圖
  const highResImage = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/700.png';
  
  console.log('🔄 正在將所有相關圖片更新為官方高清渲染圖...');
  console.log(`🔗 URL: ${highResImage}\n`);
  
  // 1. 更新活動圖片
  console.log('1️⃣ 更新活動圖片...');
  const { error: eventError } = await supabase
    .from('events')
    .update({ image_url: highResImage })
    .eq('id', eventId);
  
  if (eventError) {
    console.error('❌ 更新活動圖片失敗:', eventError);
  } else {
    console.log('✅ 活動圖片更新成功！');
  }

  // 2. 更新公告圖片
  console.log('\n2️⃣ 更新公告圖片...');
  const { error: announcementError } = await supabase
    .from('announcements')
    .update({ image_url: highResImage })
    .like('title', '%仙子伊布%');
  
  if (announcementError) {
    console.error('❌ 更新公告圖片失敗:', announcementError);
  } else {
    console.log('✅ 公告圖片更新成功！');
  }

  console.log('\n🎉 所有圖片已更新完畢！');
  return true;
}

updateAllImages()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
