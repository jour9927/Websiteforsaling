import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://wlomyjuuqovdatrxrfpu.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsb215anV1cW92ZGF0cnhyZnB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk0ODYzMSwiZXhwIjoyMDc4NTI0NjMxfQ.muWQthxiqQo0gFmIqR5ri8dGiRArKj_CK_sDKrPPPko'
);

// 查詢韓版波加曼（小光）目前的點數
const { data, error } = await supabase
    .from('distributions')
    .select('id, pokemon_name, pokemon_name_en, original_trainer, trainer_id, points, region')
    .or('pokemon_name_en.ilike.%Piplup%,pokemon_name.ilike.%波加曼%')
    .order('points', { ascending: false });

if (error) {
    console.error('查詢錯誤:', error);
    process.exit(1);
}

console.log(`找到 ${data.length} 筆波加曼配布：`);
data.forEach(d => {
    console.log(`  ID: ${d.id} | ${d.pokemon_name} (${d.pokemon_name_en}) | OT: ${d.original_trainer} | 點數: ${d.points} | 地區: ${d.region}`);
});
