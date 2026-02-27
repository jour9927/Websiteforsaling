#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addStamps() {
  // 這裡替換成您想修改的用戶 ID (您的帳號: 8f2a2fb5-0d9b-41fe-b890-c899618abffd)
  const targetUserId = '8f2a2fb5-0d9b-41fe-b890-c899618abffd'; 
  const stampsToAdd = 1; // 想增加的點數
  
  console.log(`🔄 準備為用戶 ${targetUserId} 增加 ${stampsToAdd} 點伊布集點...`);
  
  // 為了增加點數，我們需要插入對應數量的紀錄到 eevee_day_stamps 表
  const records = Array(stampsToAdd).fill({
    user_id: targetUserId,
    quiz_score: 10, // 模擬滿分通過
    quiz_total: 10
  });
  
  const { data, error } = await supabase
    .from('eevee_day_stamps')
    .insert(records)
    .select();
  
  if (error) {
    console.error('❌ 增加點數失敗:', error);
    return false;
  }

  console.log(`✅ 成功為用戶增加了 ${data.length} 點！`);
  
  // 查詢目前總點數
  const { count } = await supabase
    .from('eevee_day_stamps')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', targetUserId);
    
  console.log(`📊 該用戶目前總點數: ${count} 點`);
  return true;
}

// 如果直接執行此腳本，會提示需要修改 ID
console.log('💡 這是一個範例腳本。請編輯此檔案，將 targetUserId 替換為實際的用戶 ID 後再執行。');

// 取消註解下面這行來執行
addStamps();
