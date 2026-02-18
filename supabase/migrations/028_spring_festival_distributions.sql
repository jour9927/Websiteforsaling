-- ============================================
-- 春節特別活動 - Phase 1: 新增 5 隻可愛系配布寶可夢
-- ============================================

-- 1. 波加曼 (Piplup) - Pocha Marche 2022
INSERT INTO distributions (
    pokemon_name, pokemon_name_en, pokemon_dex_number, generation,
    game_titles, original_trainer, trainer_id, level,
    distribution_method, distribution_period_start, distribution_period_end,
    region, is_shiny, pokemon_sprite_url
) VALUES (
    '波加曼', 'Piplup', 393, 4,
    ARRAY['Brilliant Diamond', 'Shining Pearl', 'Legends Arceus'],
    'プロポチャ', '220205', 15,
    'Serial Code', '2022-02-05', '2022-02-24',
    'Japan', false,
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/393.png'
);

-- 2. 木木梟 (Rowlet) - Pokémon HOME Distribution
INSERT INTO distributions (
    pokemon_name, pokemon_name_en, pokemon_dex_number, generation,
    game_titles, original_trainer, trainer_id, level,
    distribution_method, distribution_period_start, distribution_period_end,
    region, is_shiny, pokemon_sprite_url
) VALUES (
    '木木梟', 'Rowlet', 722, 7,
    ARRAY['Pokémon HOME'],
    'HOME', '220518', 5,
    'Pokémon HOME', '2022-05-18', NULL,
    'Worldwide', false,
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/722.png'
);

-- 3. 卡蒂狗 (Growlithe) - Pokémon Center 2006
INSERT INTO distributions (
    pokemon_name, pokemon_name_en, pokemon_dex_number, generation,
    game_titles, original_trainer, trainer_id, level,
    distribution_method, distribution_period_start, distribution_period_end,
    region, is_shiny, pokemon_sprite_url
) VALUES (
    '卡蒂狗', 'Growlithe', 58, 3,
    ARRAY['FireRed', 'LeafGreen'],
    'トウキョー', '60114', 10,
    'In-Person', '2006-01-14', '2006-01-29',
    'Japan', false,
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/58.png'
);

-- 4. 夢夢蝕 (Munna) - Global Link Closing Gift
INSERT INTO distributions (
    pokemon_name, pokemon_name_en, pokemon_dex_number, generation,
    game_titles, original_trainer, trainer_id, level,
    distribution_method, distribution_period_start, distribution_period_end,
    region, is_shiny, pokemon_sprite_url
) VALUES (
    '夢夢蝕', 'Munna', 517, 5,
    ARRAY['Sun', 'Moon', 'Ultra Sun', 'Ultra Moon'],
    'Fennel', '100918', 39,
    'Serial Code', '2019-11-26', '2020-02-24',
    'North America', false,
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/517.png'
);

-- 5. 泡沫蛙 (Froakie) - Pokémon Center Tokyo 2014
INSERT INTO distributions (
    pokemon_name, pokemon_name_en, pokemon_dex_number, generation,
    game_titles, original_trainer, trainer_id, level,
    distribution_method, distribution_period_start, distribution_period_end,
    region, is_shiny, pokemon_sprite_url
) VALUES (
    '泡沫蛙', 'Froakie', 656, 6,
    ARRAY['X', 'Y', 'Omega Ruby', 'Alpha Sapphire'],
    'はままつちょ', '12074', 10,
    'In-Person', '2014-12-07', '2014-12-07',
    'Japan', false,
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/656.png'
);

-- ============================================
-- Phase 2: 刪除 2/18 伊布家族競標 + 建立新競標
-- ============================================

-- 刪除 2/18 的伊布家族相關競標 (title 包含伊布)
DELETE FROM auctions
WHERE title LIKE '%伊布%'
  AND start_time >= '2026-02-18T00:00:00+08:00'
  AND start_time < '2026-02-19T00:00:00+08:00';

-- 為 5 隻寶可夢建立新競標
-- 使用 distribution_id 關聯（子查詢取得剛剛插入的 ID）
-- 每隻寶可夢分配多個時段，07:00 ~ 22:00 循環

-- 時段分配（5隻寶可夢循環，每10分鐘一場）:
-- 07:00 波加曼, 07:10 木木梟, 07:20 卡蒂狗, 07:30 夢夢蝕, 07:40 泡沫蛙
-- 07:50 波加曼, 08:00 木木梟 ... 依此類推

DO $$
DECLARE
    dist_ids UUID[];
    dist_names TEXT[];
    dist_names_en TEXT[];
    dist_sprites TEXT[];
    slot_start TIMESTAMPTZ;
    slot_end TIMESTAMPTZ;
    idx INTEGER;
    descriptions TEXT[] := ARRAY[
        '🧧 春節特別活動 Day 2',
        '🧧 春節限定競標',
        '🧧 新春開運配布',
        '🧧 恭喜發財！限時競標',
        '🧧 春節萌系寶可夢特輯'
    ];
    desc_idx INTEGER;
BEGIN
    -- 取得剛插入的 5 隻寶可夢 ID
    SELECT ARRAY_AGG(id ORDER BY pokemon_dex_number)
    INTO dist_ids
    FROM distributions
    WHERE pokemon_name IN ('波加曼', '木木梟', '卡蒂狗', '夢夢蝕', '泡沫蛙')
      AND original_trainer IN ('プロポチャ', 'HOME', 'トウキョー', 'Fennel', 'はままつちょ');

    SELECT ARRAY_AGG(pokemon_name ORDER BY pokemon_dex_number)
    INTO dist_names
    FROM distributions
    WHERE pokemon_name IN ('波加曼', '木木梟', '卡蒂狗', '夢夢蝕', '泡沫蛙')
      AND original_trainer IN ('プロポチャ', 'HOME', 'トウキョー', 'Fennel', 'はままつちょ');

    SELECT ARRAY_AGG(pokemon_name_en ORDER BY pokemon_dex_number)
    INTO dist_names_en
    FROM distributions
    WHERE pokemon_name IN ('波加曼', '木木梟', '卡蒂狗', '夢夢蝕', '泡沫蛙')
      AND original_trainer IN ('プロポチャ', 'HOME', 'トウキョー', 'Fennel', 'はままつちょ');

    SELECT ARRAY_AGG(pokemon_sprite_url ORDER BY pokemon_dex_number)
    INTO dist_sprites
    FROM distributions
    WHERE pokemon_name IN ('波加曼', '木木梟', '卡蒂狗', '夢夢蝕', '泡沫蛙')
      AND original_trainer IN ('プロポチャ', 'HOME', 'トウキョー', 'Fennel', 'はままつちょ');

    -- 生成 07:00 ~ 22:00 每 10 分鐘一場
    FOR hour IN 7..21 LOOP
        FOR minute IN 0..5 LOOP
            slot_start := ('2026-02-18T' || LPAD(hour::TEXT, 2, '0') || ':' || LPAD((minute * 10)::TEXT, 2, '0') || ':00+08:00')::TIMESTAMPTZ;
            slot_end := slot_start + INTERVAL '10 minutes';

            -- 循環選擇寶可夢 (0-4)
            idx := ((hour - 7) * 6 + minute) % 5 + 1;
            desc_idx := ((hour - 7) * 6 + minute) % 5 + 1;

            INSERT INTO auctions (
                distribution_id, title, description, image_url,
                starting_price, min_increment, current_price,
                start_time, end_time, status, bid_count
            ) VALUES (
                dist_ids[idx],
                dist_names[idx] || ' (' || dist_names_en[idx] || ')' || E'\n' || descriptions[desc_idx],
                descriptions[desc_idx],
                dist_sprites[idx],
                100, 100, 0,
                slot_start, slot_end, 'active', 0
            );
        END LOOP;
    END LOOP;
END $$;
