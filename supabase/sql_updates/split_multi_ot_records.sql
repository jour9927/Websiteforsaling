-- ============================================
-- 拆分多語種 OT 配布記錄（安全版）
-- 只拆分「每個 / 分段屬於不同語種」的記錄
-- 排除像 'ID / No / ., ゲーチス' 這種 / 是名稱一部分的情況
-- 執行日期: 2026-02-18
-- ============================================

-- ============================================
-- 步驟 0: 備份（已在前一次執行完成）
-- ============================================
-- CREATE TABLE IF NOT EXISTS distributions_backup_split_ot AS SELECT * FROM distributions;

-- ============================================
-- 步驟 1: 建立需要拆分的記錄清單
-- 條件：
--   1. original_trainer 包含 ' / '
--   2. 按 ' / ' 拆分後，各部分至少有 2 種不同語種
--   3. 排除只有一種語種的情況（那些 / 只是名稱格式）
-- ============================================

CREATE TEMP TABLE records_to_split AS
WITH split_check AS (
    SELECT 
        d.id,
        d.original_trainer,
        d.trainer_id,
        -- 統計拆分後有幾種不同語種
        (SELECT COUNT(DISTINCT 
            CASE 
                WHEN part ~ '[가-힣]' THEN 'KR'
                WHEN part ~ '[ぁ-んァ-ヶー]' THEN 'JP'
                WHEN part ~ '[\u4e00-\u9fff]' THEN 'CN'
                WHEN part ~ '[A-Za-z]' THEN 'EN'
                ELSE 'OTHER'
            END
        ) FROM UNNEST(STRING_TO_ARRAY(d.original_trainer, ' / ')) AS part
        ) as distinct_lang_count,
        ARRAY_LENGTH(STRING_TO_ARRAY(d.original_trainer, ' / '), 1) as part_count
    FROM distributions d
    WHERE d.original_trainer LIKE '% / %'
      AND d.original_trainer ~ '[가-힣ぁ-んァ-ヶー\u4e00-\u9fff]'
)
SELECT id, original_trainer, trainer_id, distinct_lang_count, part_count
FROM split_check
WHERE distinct_lang_count >= 2;  -- 只拆分有 >= 2 種語種的記錄

-- 預覽要拆分的記錄：
SELECT 
    rs.id,
    d.pokemon_name,
    rs.original_trainer,
    rs.trainer_id,
    d.points,
    rs.distinct_lang_count,
    rs.part_count
FROM records_to_split rs
JOIN distributions d ON rs.id = d.id
ORDER BY d.pokemon_name;

-- ============================================
-- 步驟 2: 執行拆分
-- ============================================

-- 2.1: 為每筆多 OT 記錄插入額外的語種記錄（第 2, 3, 4... 個 OT）
INSERT INTO distributions (
    pokemon_name, pokemon_name_en, pokemon_dex_number, generation,
    game_titles, original_trainer, trainer_id, level,
    distribution_method, distribution_period_start, distribution_period_end,
    region, image_url, wiki_url, is_shiny, special_move,
    pokemon_sprite_url, pokeball_image_url, event_name, points
)
SELECT 
    d.pokemon_name,
    d.pokemon_name_en,
    d.pokemon_dex_number,
    d.generation,
    d.game_titles,
    TRIM(ot_part.ot) as original_trainer,
    -- TID: 如果 TID 也按 ', ' 拆分後數量與 OT 數量一致，就 1:1 對應
    CASE 
        WHEN d.trainer_id LIKE '%, %' 
             AND ARRAY_LENGTH(STRING_TO_ARRAY(d.trainer_id, ', '), 1) 
                = rs.part_count
        THEN TRIM((STRING_TO_ARRAY(d.trainer_id, ', '))[ot_part.idx])
        ELSE d.trainer_id
    END as trainer_id,
    d.level,
    d.distribution_method,
    d.distribution_period_start,
    d.distribution_period_end,
    d.region,
    d.image_url,
    d.wiki_url,
    d.is_shiny,
    d.special_move,
    d.pokemon_sprite_url,
    d.pokeball_image_url,
    d.event_name,
    d.points
FROM distributions d
JOIN records_to_split rs ON d.id = rs.id
CROSS JOIN LATERAL (
    SELECT 
        TRIM(elem) as ot,
        ROW_NUMBER() OVER () as idx
    FROM UNNEST(STRING_TO_ARRAY(d.original_trainer, ' / ')) AS elem
) ot_part
WHERE ot_part.idx > 1;

-- 2.2: 更新原始記錄 → 只保留第一個 OT
UPDATE distributions d
SET 
    original_trainer = TRIM((STRING_TO_ARRAY(d.original_trainer, ' / '))[1]),
    trainer_id = CASE 
        WHEN d.trainer_id LIKE '%, %'
             AND ARRAY_LENGTH(STRING_TO_ARRAY(d.trainer_id, ', '), 1) 
                = rs.part_count
        THEN TRIM((STRING_TO_ARRAY(d.trainer_id, ', '))[1])
        ELSE d.trainer_id
    END
FROM records_to_split rs
WHERE d.id = rs.id;

-- ============================================
-- 步驟 3: 驗證拆分結果
-- ============================================

-- 3.1: 以故勒頓為例，確認拆分是否正確
SELECT 
    pokemon_name,
    original_trainer,
    trainer_id,
    points,
    CASE 
        WHEN original_trainer ~ '[가-힣]' THEN '韓'
        WHEN original_trainer ~ '[ぁ-んァ-ヶー]' THEN '日'
        WHEN original_trainer ~ '[\u4e00-\u9fff]' THEN '中'
        ELSE '英'
    END as lang
FROM distributions
WHERE pokemon_name LIKE '%故勒頓%'
ORDER BY lang;

-- 3.2: 總數量變化
SELECT 
    (SELECT COUNT(*) FROM distributions_backup_split_ot) as before_count,
    (SELECT COUNT(*) FROM distributions) as after_count,
    (SELECT COUNT(*) FROM distributions) - (SELECT COUNT(*) FROM distributions_backup_split_ot) as new_records_added;

-- 清理
DROP TABLE IF EXISTS records_to_split;
