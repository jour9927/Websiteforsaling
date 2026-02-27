#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function revertImage() {
  const eventId = 'e956ea35-fa17-46ba-a260-7c1b88cd355d';
  
  // 預設的仙子伊布圖片 (原本的)
  const originalImage = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/700.png';
  
  console.log('🔄 正在將圖片換回原本的預設版本...');
  console.log(`🔗 URL: ${originalImage}`);
  
  const { data, error } = await supabase
    .from('events')
    .update({ image_url: originalImage })
    .eq('id', eventId)
    .select();
  
  if (error) {
    console.error('❌ Error:', error);
    return false;
  }

  console.log('✅ 已成功換回原本的圖片！\n');
  return true;
}

revertImage()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
