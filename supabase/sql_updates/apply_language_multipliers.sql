-- ============================================
-- Multi-Language Distribution Points Adjustment
-- Strategy: Option A - Direct Multipliers
-- Date: 2026-02-18
-- ============================================

-- 語種倍率規則：
-- Korean (韓) = Base × 3.0
-- Japanese (日) = Base × 1.7
-- English/Other = Base × 1.0

-- ============================================
-- 步驟 1: 備份當前數據
-- ============================================

CREATE TABLE IF NOT EXISTS distributions_backup_multilang_20260218 AS
SELECT * FROM distributions;

-- ============================================
-- 步驟 2: 識別語種並計算基準點數
-- ============================================

-- 2.1: 創建臨時表存儲語種分類
CREATE TEMP TABLE lang_classification AS
SELECT 
  id,
  pokemon_name,
  pokemon_dex_number,
  original_trainer,
  points as current_points,
  -- 語種識別
  CASE 
    WHEN original_trainer ~ '[가-힣]' THEN 'Korean'
    WHEN original_trainer ~ '[ぁ-んァ-ン一-龠]' OR original_trainer ~ '[ァ-ヶー]' THEN 'Japanese'
    ELSE 'Other'
  END as language,
  distribution_period_start,
  generation
FROM distributions;

-- 2.2: 找出每個寶可夢的基準點數（優先使用 Other 版本）
CREATE TEMP TABLE base_points_table AS
SELECT 
  pokemon_name,
  pokemon_dex_number,
  -- 優先使用 Other 版本作為基準，如沒有則使用最低點數
  COALESCE(
    MIN(CASE WHEN language = 'Other' THEN current_points END),
    MIN(current_points)
  ) as base_points,
  -- 記錄基準來源
  CASE 
    WHEN MIN(CASE WHEN language = 'Other' THEN current_points END) IS NOT NULL 
      THEN 'Other'
    ELSE 'Min'
  END as base_source
FROM lang_classification
GROUP BY pokemon_name, pokemon_dex_number
HAVING COUNT(DISTINCT language) > 1;  -- 只處理多語種配布

-- ============================================
-- 步驟 3: 預覽更新（驗證用）
-- ============================================

-- 查看更新前後的對比
SELECT 
  lc.pokemon_name,
  lc.original_trainer,
  lc.language,
  lc.current_points,
  bp.base_points,
  bp.base_source,
  -- 計算新點數
  CASE 
    WHEN lc.language = 'Korean' THEN (bp.base_points * 3)::INTEGER
    WHEN lc.language = 'Japanese' THEN (bp.base_points * 1.7)::INTEGER
    ELSE bp.base_points::INTEGER
  END as new_points,
  -- 倍率
  CASE 
    WHEN lc.language = 'Korean' THEN 3.0
    WHEN lc.language = 'Japanese' THEN 1.7
    ELSE 1.0
  END as multiplier
FROM lang_classification lc
JOIN base_points_table bp 
  ON lc.pokemon_name = bp.pokemon_name 
  AND lc.pokemon_dex_number = bp.pokemon_dex_number
ORDER BY lc.pokemon_name, lc.language;

-- ============================================
-- 步驟 4: 執行更新
-- ============================================

WITH update_data AS (
  SELECT 
    lc.id,
    lc.pokemon_name,
    lc.language,
    lc.current_points,
    bp.base_points,
    -- 計算新點數
    CASE 
      WHEN lc.language = 'Korean' THEN (bp.base_points * 3)::INTEGER
      WHEN lc.language = 'Japanese' THEN (bp.base_points * 1.7)::INTEGER
      ELSE bp.base_points::INTEGER
    END as new_points
  FROM lang_classification lc
  JOIN base_points_table bp 
    ON lc.pokemon_name = bp.pokemon_name 
    AND lc.pokemon_dex_number = bp.pokemon_dex_number
)
UPDATE distributions d
SET points = ud.new_points
FROM update_data ud
WHERE d.id = ud.id
  AND ud.new_points != ud.current_points;  -- 只更新有變化的記錄

-- ============================================
-- 步驟 5: 驗證結果
-- ============================================

-- 5.1: 檢查烈咬陸鯊的點數
SELECT 
  pokemon_name,
  original_trainer,
  CASE 
    WHEN original_trainer ~ '[가-힣]' THEN 'Korean'
    WHEN original_trainer ~ '[ぁ-んァ-ン]' THEN 'Japanese'
    ELSE 'Other'
  END as language,
  points,
  -- 預期點數（假設基準為最低的）
  (SELECT MIN(points) FROM distributions WHERE pokemon_name LIKE '%烈咬陸鯊%') as base,
  ROUND(
    points::NUMERIC / 
    (SELECT MIN(points) FROM distributions WHERE pokemon_name LIKE '%烈咬陸鯊%'),
    2
  ) as actual_ratio
FROM distributions
WHERE pokemon_name LIKE '%烈咬陸鯊%'
ORDER BY points;

-- 5.2: 統計更新結果
WITH lang_detect AS (
  SELECT 
    pokemon_name,
    original_trainer,
    points,
    CASE 
      WHEN original_trainer ~ '[가-힣]' THEN 'Korean'
      WHEN original_trainer ~ '[ぁ-んァ-ン]' THEN 'Japanese'
      ELSE 'Other'
    END as language
  FROM distributions
),
base_calc AS (
  SELECT 
    pokemon_name,
    COALESCE(
      MIN(CASE WHEN language = 'Other' THEN points END),
      MIN(points)
    ) as base
  FROM lang_detect
  GROUP BY pokemon_name
  HAVING COUNT(DISTINCT language) > 1
)
SELECT 
  ld.pokemon_name,
  ld.language,
  ld.points,
  bc.base,
  ROUND(ld.points::NUMERIC / bc.base, 2) as actual_ratio,
  CASE 
    WHEN ld.language = 'Korean' THEN 3.0
    WHEN ld.language = 'Japanese' THEN 1.7
    ELSE 1.0
  END as expected_ratio,
  -- 檢查誤差
  ABS(
    ROUND(ld.points::NUMERIC / bc.base, 2) - 
    CASE 
      WHEN ld.language = 'Korean' THEN 3.0
      WHEN ld.language = 'Japanese' THEN 1.7
      ELSE 1.0
    END
  ) as ratio_error
FROM lang_detect ld
JOIN base_calc bc ON ld.pokemon_name = bc.pokemon_name
WHERE ABS(
  ROUND(ld.points::NUMERIC / bc.base, 2) - 
  CASE 
    WHEN ld.language = 'Korean' THEN 3.0
    WHEN ld.language = 'Japanese' THEN 1.7
    ELSE 1.0
  END
) > 0.1  -- 顯示誤差超過 10% 的記錄
ORDER BY ld.pokemon_name, ld.language;

-- 如果返回 0 rows，表示所有倍率都正確！

-- 5.3: 查看更新摘要
SELECT 
  COUNT(*) as total_updated,
  COUNT(DISTINCT pokemon_name) as pokemon_count,
  SUM(CASE WHEN language = 'Korean' THEN 1 ELSE 0 END) as korean_updated,
  SUM(CASE WHEN language = 'Japanese' THEN 1 ELSE 0 END) as japanese_updated,
  SUM(CASE WHEN language = 'Other' THEN 1 ELSE 0 END) as other_updated
FROM (
  SELECT 
    d.pokemon_name,
    CASE 
      WHEN d.original_trainer ~ '[가-힣]' THEN 'Korean'
      WHEN d.original_trainer ~ '[ぁ-んァ-ン]' THEN 'Japanese'
      ELSE 'Other'
    END as language
  FROM distributions d
  JOIN base_points_table bp 
    ON d.pokemon_name = bp.pokemon_name
) stats;

-- ============================================
-- 清理臨時表
-- ============================================

DROP TABLE IF EXISTS lang_classification;
DROP TABLE IF EXISTS base_points_table;
