-- ============================================
-- 春節特別活動 Day 4 (2/19)
-- 錦標賽木木梟（Eric）、東京卡蒂狗、真菰的夢夢蝕、浜松町泡沫蛙
-- ============================================

-- Step 1: 插入 NAIC 錦標賽木木梟配布資料
INSERT INTO distributions (
    pokemon_name, pokemon_name_en, pokemon_dex_number, generation,
    game_titles, original_trainer, trainer_id, level,
    distribution_method, distribution_period_start, distribution_period_end,
    region, is_shiny, pokemon_sprite_url
) VALUES (
    '木木梟', 'Rowlet', 722, 9,
    ARRAY['Scarlet', 'Violet'],
    'Eric', '220624', 5,
    'Serial Code', '2022-06-24', '2022-06-27',
    'Global', false,
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/722.png'
);

-- Step 2: 刪除今天未來時段、無人出價的自動競標
DELETE FROM auctions
WHERE start_time >= '2026-02-19T09:30:00+08:00'
  AND start_time < '2026-02-20T00:00:00+08:00'
  AND bid_count = 0;

-- Step 3: 建立 4 隻寶可夢的競標 (09:30 ~ 22:00, 每 10 分鐘)
DO $$
DECLARE
    dist_ids UUID[];
    dist_titles TEXT[];
    dist_sprites TEXT[];
    slot_start TIMESTAMPTZ;
    slot_end TIMESTAMPTZ;
    idx INTEGER;
    descriptions TEXT[] := ARRAY[
        '🧧 春節特別活動 Day 4',
        '🧧 春節限定競標',
        '🧧 新春開運配布',
        '🧧 恭喜發財！限時競標'
    ];
    desc_idx INTEGER;
    total_slots INTEGER := 0;
    actual_minute INTEGER;
BEGIN
    -- 手動組裝 4 隻寶可夢（按固定順序）
    -- 1. 錦標賽木木梟（Eric）
    -- 2. 東京卡蒂狗（トウキョー）
    -- 3. 真菰的夢夢蝕（Fennel）
    -- 4. 浜松町泡沫蛙（はままつちょ）

    dist_ids := ARRAY[
        (SELECT id FROM distributions WHERE pokemon_name = '木木梟' AND original_trainer = 'Eric' ORDER BY created_at DESC LIMIT 1),
        (SELECT id FROM distributions WHERE pokemon_name = '卡蒂狗' AND original_trainer = 'トウキョー' ORDER BY created_at DESC LIMIT 1),
        (SELECT id FROM distributions WHERE pokemon_name = '夢夢蝕' AND original_trainer = 'Fennel' ORDER BY created_at DESC LIMIT 1),
        (SELECT id FROM distributions WHERE pokemon_name = '泡沫蛙' AND original_trainer = 'はままつちょ' ORDER BY created_at DESC LIMIT 1)
    ];

    dist_titles := ARRAY[
        '錦標賽木木梟（Eric）',
        '東京卡蒂狗（トウキョー）',
        '真菰的夢夢蝕（Fennel）',
        '浜松町泡沫蛙（はままつちょ）'
    ];

    dist_sprites := ARRAY[
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/722.png',
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/58.png',
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/517.png',
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/656.png'
    ];

    -- 檢查所有配布都存在
    FOR idx IN 1..4 LOOP
        IF dist_ids[idx] IS NULL THEN
            RAISE EXCEPTION '找不到第 % 隻寶可夢的配布: %', idx, dist_titles[idx];
        END IF;
    END LOOP;

    -- 生成 09:30 ~ 21:50 每 10 分鐘一場
    FOR hour IN 9..21 LOOP
        FOR minute_slot IN 0..5 LOOP
            actual_minute := minute_slot * 10;

            -- 跳過 09:00 和 09:10 和 09:20（已過時段）
            IF hour = 9 AND actual_minute < 30 THEN
                CONTINUE;
            END IF;

            slot_start := ('2026-02-19T' || LPAD(hour::TEXT, 2, '0') || ':' || LPAD(actual_minute::TEXT, 2, '0') || ':00+08:00')::TIMESTAMPTZ;
            slot_end := slot_start + INTERVAL '10 minutes';

            -- 循環選擇寶可夢 (1-4)
            idx := total_slots % 4 + 1;
            desc_idx := total_slots % 4 + 1;
            total_slots := total_slots + 1;

            INSERT INTO auctions (
                distribution_id, title, description, image_url,
                starting_price, min_increment, current_price,
                start_time, end_time, status, bid_count
            ) VALUES (
                dist_ids[idx],
                dist_titles[idx],
                descriptions[desc_idx],
                dist_sprites[idx],
                100, 100, 0,
                slot_start, slot_end, 'active', 0
            );
        END LOOP;
    END LOOP;

    RAISE NOTICE '✅ 成功建立 % 場春節 Day 4 競標 (09:30 ~ 22:00)', total_slots;
END $$;

-- Step 4: 驗證結果
SELECT
    title as 標題,
    description as 描述,
    starting_price as 起標價,
    start_time as 開始時間,
    end_time as 結束時間,
    status as 狀態
FROM auctions
WHERE start_time >= '2026-02-19T09:30:00+08:00'
  AND start_time < '2026-02-20T00:00:00+08:00'
ORDER BY start_time
LIMIT 12;
