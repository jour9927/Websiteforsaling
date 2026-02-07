-- 增強虛擬用戶資料表
-- 新增更多欄位讓虛擬用戶頁面與真實用戶一樣豐富

-- 新增欄位
ALTER TABLE virtual_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE virtual_profiles ADD COLUMN IF NOT EXISTS pokemon_first_game TEXT;
ALTER TABLE virtual_profiles ADD COLUMN IF NOT EXISTS total_value INTEGER DEFAULT 0;
ALTER TABLE virtual_profiles ADD COLUMN IF NOT EXISTS total_views INTEGER DEFAULT 0;
ALTER TABLE virtual_profiles ADD COLUMN IF NOT EXISTS today_views INTEGER DEFAULT 0;
ALTER TABLE virtual_profiles ADD COLUMN IF NOT EXISTS featured_event_ids UUID[] DEFAULT '{}';

-- 更新現有虛擬用戶，加入假資料
UPDATE virtual_profiles SET
    bio = CASE display_name
        WHEN '王**' THEN '收藏十年，專攻配布系列 🎴'
        WHEN '李**' THEN '從紅寶石入坑，一路收到朱紫'
        WHEN '陳**' THEN '喜歡閃光寶可夢，目標全圖鑑！'
        WHEN '林**' THEN '新手收藏家，請多指教'
        WHEN '張**' THEN '老玩家回歸，重溫童年回憶'
        WHEN '黃**' THEN '主收神獸配布，歡迎交流'
        WHEN '劉**' THEN '佛系收藏，隨緣就好'
        WHEN '楊**' THEN '喜歡可愛系的寶可夢'
        WHEN '吳**' THEN '目標是成為寶可夢大師！'
        WHEN '蔡**' THEN '收藏使我快樂 ✨'
        WHEN 'P***' THEN 'Pokémon lover since 1996'
        WHEN 'S***' THEN 'Shiny hunter, never give up!'
        WHEN 'M***' THEN 'Master collector in training'
        WHEN 'T***' THEN 'Trading is my passion'
        WHEN 'A***' THEN 'All about rare distributions'
        WHEN 'K***' THEN 'Keep collecting, keep dreaming'
        WHEN 'R***' THEN 'Rare events only'
        WHEN '小**' THEN '小資族也能收藏！'
        WHEN '大**' THEN '剛開始收藏，還在學習中'
        WHEN '阿**' THEN '阿宅的寶可夢日常'
        ELSE '寶可夢愛好者'
    END,
    pokemon_first_game = CASE display_name
        WHEN '王**' THEN '紅/綠/藍 (1996)'
        WHEN '李**' THEN '紅寶石/藍寶石 (2002)'
        WHEN '陳**' THEN '鑽石/珍珠 (2006)'
        WHEN '林**' THEN '劍/盾 (2019)'
        WHEN '張**' THEN '金/銀 (1999)'
        WHEN '黃**' THEN 'X/Y (2013)'
        WHEN '劉**' THEN '黑/白 (2010)'
        WHEN '楊**' THEN 'Let''s Go 皮卡丘 (2018)'
        WHEN '吳**' THEN '太陽/月亮 (2016)'
        WHEN '蔡**' THEN '朱/紫 (2022)'
        WHEN 'P***' THEN 'Red/Blue (1996)'
        WHEN 'S***' THEN 'Diamond/Pearl (2006)'
        WHEN 'M***' THEN 'HeartGold/SoulSilver (2009)'
        WHEN 'T***' THEN 'Sword/Shield (2019)'
        WHEN 'A***' THEN 'Ruby/Sapphire (2002)'
        WHEN 'K***' THEN 'X/Y (2013)'
        WHEN 'R***' THEN 'Sun/Moon (2016)'
        WHEN '小**' THEN '朱/紫 (2022)'
        WHEN '大**' THEN '劍/盾 (2019)'
        WHEN '阿**' THEN '晶燦鑽石 (2021)'
        ELSE '朱/紫 (2022)'
    END,
    total_value = collection_count * (100 + FLOOR(RANDOM() * 200)),
    total_views = 50 + FLOOR(RANDOM() * 200),
    today_views = FLOOR(RANDOM() * 15)
WHERE is_virtual = true;
