import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://wlomyjuuqovdatrxrfpu.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsb215anV1cW92ZGF0cnhyZnB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk0ODYzMSwiZXhwIjoyMDc4NTI0NjMxfQ.muWQthxiqQo0gFmIqR5ri8dGiRArKj_CK_sDKrPPPko'
);

// 更新所有 active 競標的 min_increment 為 5（起標價不動）
const { data, error } = await supabase
    .from('auctions')
    .update({ min_increment: 5 })
    .eq('status', 'active')
    .select('id, title, starting_price, min_increment');

if (error) {
    console.error('更新錯誤:', error);
    process.exit(1);
}

console.log(`✅ 成功更新 ${data.length} 場競標的 min_increment → 5：`);
data.forEach(a => {
    const title = a.title.replace(/\n/g, ' ');
    console.log(`  ${title} | 起標: $${a.starting_price} | 最低加價: $${a.min_increment}`);
});
