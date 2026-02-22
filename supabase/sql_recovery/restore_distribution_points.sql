-- ============================================
-- Distribution Points 數據恢復 SQL
-- 執行日期: 2026-02-17
-- 目的: 恢復被錯誤重置的配布點數
-- ============================================

-- 步驟 1: 備份當前數據 (可選，但建議執行)
CREATE TABLE IF NOT EXISTS distributions_backup_20260217 AS
SELECT * FROM distributions;

-- 步驟 2: 使用完整公式重新計算所有配布點數
WITH calc AS (
  SELECT id,
    generation,
    pokemon_name,
    -- 世代範圍
    CASE generation
      WHEN 9 THEN 500 WHEN 8 THEN 5000 WHEN 7 THEN 10000
      WHEN 6 THEN 50000 WHEN 5 THEN 120000 WHEN 4 THEN 250000 WHEN 3 THEN 650000
      ELSE 500
    END as range_min,
    CASE generation
      WHEN 9 THEN 5000 WHEN 8 THEN 10000 WHEN 7 THEN 50000
      WHEN 6 THEN 120000 WHEN 5 THEN 220000 WHEN 4 THEN 460000 WHEN 3 THEN 1200000
      ELSE 5000
    END as range_max,
    -- 語種分數
    CASE 
      WHEN original_trainer ~ '[가-힣]' AND original_trainer !~ '[ァ-ヴぁ-ん]' 
           AND original_trainer !~ '[A-Za-z]' THEN 0.30
      WHEN original_trainer ~ '[가-힣]' THEN 0.22
      WHEN original_trainer ~ '[ァ-ヶー]' AND original_trainer !~ '[A-Za-z]' THEN 0.18
      WHEN original_trainer ~ '[ァ-ヶー]' THEN 0.14
      WHEN original_trainer ~ '[A-Za-z]' THEN 0.06
      ELSE 0.10
    END as lang_score,
    -- 閃光加分
    CASE WHEN is_shiny = true THEN 0.15 ELSE 0.0 END as shiny_score,
    -- 配布方式加分
    CASE 
      WHEN distribution_method ILIKE '%現場%' OR distribution_method ILIKE '%活動%' THEN 0.12
      WHEN distribution_method ILIKE '%序號%' OR distribution_method ILIKE '%序列%' THEN 0.08
      WHEN distribution_method ILIKE '%紅外線%' THEN 0.10
      WHEN distribution_method ILIKE '%HOME%' THEN -0.05 -- 大幅降低 HOME 常駐配布的高溢價現象
      ELSE 0.03
    END as method_score,
    -- 年代加分
    CASE 
      WHEN distribution_period_start IS NOT NULL THEN
        LEAST(0.15, 0.15 * EXTRACT(EPOCH FROM (NOW() - distribution_period_start::timestamp)) 
              / (EXTRACT(EPOCH FROM INTERVAL '20 years')))
      ELSE 0.08
    END as age_score,
    -- ID 隨機偏移
    (('x' || LPAD(REPLACE(SPLIT_PART(id::text, '-', 1), '-', ''), 8, '0'))::bit(32)::int::numeric 
     % 10000) / 40000.0 as id_random_offset,
    -- 用於打破滿分天花板的尾數偏移 (13 ~ 812)
    (('x' || LPAD(REPLACE(SPLIT_PART(id::text, '-', 1), '-', ''), 8, '0'))::bit(32)::int % 800 + 13) as tail_offset
  FROM distributions
)
UPDATE distributions d
SET points = LEAST(
  c.range_max - c.tail_offset,
  GREATEST(
    c.range_min,
    (c.range_min + (c.range_max - c.range_min) 
     * LEAST(1.0, 0.15 + c.lang_score + c.shiny_score + c.method_score + c.age_score + c.id_random_offset))
  )
)::INTEGER
FROM calc c
WHERE d.id = c.id;

-- 步驟 3: 化石系特殊覆寫
UPDATE distributions
SET points = 900000 + (ABS(('x' || LPAD(REPLACE(SPLIT_PART(id::text, '-', 1), '-', ''), 8, '0'))
              ::bit(32)::int) % 90000)
WHERE pokemon_name IN ('冰雪龍', '寶寶暴龍', '鰓魚龍');

-- 步驟 4: 其他特殊配布手動覆寫
-- 太陽岩 (第 7 世代)
UPDATE distributions 
SET points = 740068 
WHERE pokemon_name LIKE '%太陽岩%' AND generation = 7;

-- 炎武王
UPDATE distributions 
SET points = 990082 
WHERE pokemon_name LIKE '%炎武王%';

-- 捷拉奧拉
UPDATE distributions 
SET points = 350052 
WHERE pokemon_name LIKE '%捷拉奧拉%';

-- 美錄梅塔
UPDATE distributions 
SET points = 500 
WHERE pokemon_name LIKE '%美錄梅塔%';

-- 月石
UPDATE distributions 
SET points = 1230089 
WHERE pokemon_name LIKE '%月石%';

-- 瑪夏多 (天青山)
UPDATE distributions 
SET points = 960053 
WHERE pokemon_name LIKE '%瑪夏多%' AND original_trainer LIKE '%天青%';

-- 謝米 (鶴山文化社)
UPDATE distributions 
SET points = 1650073 
WHERE pokemon_name LIKE '%謝米%' AND original_trainer LIKE '%鶴山%';

-- 六尾 (寶可夢中心開業)
UPDATE distributions 
SET points = 570052 
WHERE pokemon_name LIKE '%六尾%';

-- 大劍鬼 (隱藏特性)
UPDATE distributions 
SET points = 1772883 
WHERE pokemon_name LIKE '%大劍鬼%';

-- 君主蛇 (隱藏特性)
UPDATE distributions 
SET points = 1532323 
WHERE pokemon_name LIKE '%君主蛇%';

-- 落托姆 (LINE)
UPDATE distributions 
SET points = 666382 
WHERE pokemon_name LIKE '%落托姆%' AND original_trainer LIKE '%LINE%';

-- 步驟 5: 袋獸 2015 Spring (用戶要求)
UPDATE distributions
SET points = 330052
WHERE 
    (pokemon_name LIKE '%袋獸%' OR pokemon_name LIKE '%Kangaskhan%')
    AND (
        original_trainer LIKE '%2015 Spring%'
        OR original_trainer LIKE '%봄%'
        OR (EXTRACT(YEAR FROM distribution_period_start::date) = 2015 
            AND EXTRACT(MONTH FROM distribution_period_start::date) BETWEEN 3 AND 5)
    );

-- 步驟 6: 蒂安希 univers (用戶要求)
UPDATE distributions
SET points = 280052
WHERE 
    (pokemon_name LIKE '%蒂安希%' OR pokemon_name LIKE '%Diancie%')
    AND (
        original_trainer LIKE '%univers%' 
        OR original_trainer LIKE '%Universe%'
        OR original_trainer LIKE '%ユニバース%'
    );

-- ============================================
-- 驗證查詢
-- ============================================

-- 檢查各世代點數分布
SELECT 
    generation,
    COUNT(*) as total_records,
    MIN(points) as min_points,
    MAX(points) as max_points,
    ROUND(AVG(points), 0) as avg_points
FROM distributions
GROUP BY generation
ORDER BY generation;

-- 檢查特殊覆寫的配布
SELECT 
    pokemon_name,
    original_trainer,
    points,
    generation
FROM distributions
WHERE points > 500000
ORDER BY points DESC;

-- 檢查袋獸和蒂安希
SELECT 
    pokemon_name,
    original_trainer,
    points
FROM distributions
WHERE pokemon_name LIKE '%袋獸%' 
   OR pokemon_name LIKE '%Kangaskhan%'
   OR pokemon_name LIKE '%蒂安希%'
   OR pokemon_name LIKE '%Diancie%'
ORDER BY points DESC;

-- 檢查是否有異常的 330052 點數殘留
SELECT COUNT(*) as count_330052
FROM distributions
WHERE points = 330052 
  AND NOT (pokemon_name LIKE '%袋獸%' OR pokemon_name LIKE '%Kangaskhan%');
