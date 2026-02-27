#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateImage() {
  const eventId = 'e956ea35-fa17-46ba-a260-7c1b88cd355d';
  
  // 高品質圖片選項
  const imageOptions = [
    {
      name: '仙子伊布 - 官方高清渲染',
      url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/700.png'
    },
    {
      name: '仙子伊布 - 官方插圖風格',
      url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/illustrations/700.png'
    },
    {
      name: '仙子伊布 - Dream World 版本',
      url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/700.svg'
    }
  ];
  
  console.log('🎨 可用的優質圖片選項：\n');
  imageOptions.forEach((opt, i) => {
    console.log(`${i + 1}. ${opt.name}`);
    console.log(`   ${opt.url}\n`);
  });

  // 使用最高品質的官方渲染版本
  const selectedImage = imageOptions[0].url;
  
  console.log('─'.repeat(60));
  const { data, error } = await supabase
    .from('events')
    .update({ image_url: selectedImage })
    .eq('id', eventId)
    .select();
  
  if (error) {
    console.error('❌ Error:', error);
    return false;
  }

  console.log('✅ 已設置最佳圖片！\n');
  console.log(`📸 當前圖片: ${imageOptions[0].name}`);
  console.log(`🔗 URL: ${selectedImage}\n`);
  
  return true;
}

updateImage()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
