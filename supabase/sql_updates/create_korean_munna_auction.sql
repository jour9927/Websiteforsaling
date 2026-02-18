-- ============================================
-- 新增韓版真菰的食夢夢 (Korean Fennel's Munna) 競標
-- 配置與韓版波加曼（小光）相同
-- 執行日期: 2026-02-18
-- ============================================

-- Step 1: 插入韓版食夢夢配布資料（如不存在）
INSERT INTO distributions (
    pokemon_name, pokemon_name_en, pokemon_dex_number, generation,
    game_titles, original_trainer, trainer_id, level,
    distribution_method, distribution_period_start, distribution_period_end,
    region, is_shiny, pokemon_sprite_url
) VALUES (
    '食夢夢', 'Munna', 517, 5,
    ARRAY['Black', 'White', 'Black 2', 'White 2'],
    '마코모', '100918', 50,
    'Wi-Fi', '2010-10-18', '2011-01-11',
    'South Korea', false,
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/517.png'
);

-- Step 2: 建立競標（配置跟韓版波加曼一樣: 起標 100, 每次加價 100, 10 分鐘）
-- 開始時間: 現在, 結束時間: 10 分鐘後
INSERT INTO auctions (
    distribution_id,
    title,
    description,
    image_url,
    starting_price,
    min_increment,
    current_price,
    start_time,
    end_time,
    status,
    bid_count
) VALUES (
    (SELECT id FROM distributions 
     WHERE pokemon_name = '食夢夢' 
       AND original_trainer = '마코모'
     ORDER BY created_at DESC 
     LIMIT 1),
    '韓版食夢夢（真菰）' || E'\n' || '🧧 春節特別活動',
    '🧧 春節特別活動 - 韓版真菰的食夢夢',
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/517.png',
    100,
    100,
    0,
    NOW(),
    NOW() + INTERVAL '10 minutes',
    'active',
    0
);

-- 驗證
SELECT id, title, starting_price, min_increment, start_time, end_time, status
FROM auctions
WHERE title LIKE '%食夢夢%'
ORDER BY created_at DESC
LIMIT 1;
