-- ============================================
-- 查詢：找出具有多語種版本的配布
-- 目的：識別同一寶可夢在不同語種都有配布的情況
-- ============================================

-- 步驟 1: 識別 original_trainer 的語種
-- 語種判定規則：
-- 韓文：包含 [가-힣]
-- 日文：包含 [ァ-ヶー] 或 [ぁ-ん]
-- 英文：主要包含 [A-Za-z]

WITH language_classification AS (
  SELECT 
    id,
    pokemon_name,
    pokemon_dex_number,
    original_trainer,
    points,
    distribution_period_start,
    generation,
    -- 語種分類
    CASE 
      WHEN original_trainer ~ '[가-힣]' AND original_trainer !~ '[ァ-ヴぁ-ん]' 
           AND original_trainer !~ '[A-Za-z]' THEN 'Korean_Pure'
      WHEN original_trainer ~ '[가-힣]' THEN 'Korean_Mixed'
      WHEN original_trainer ~ '[ァ-ヶー]' AND original_trainer !~ '[A-Za-z]' THEN 'Japanese_Pure'
      WHEN original_trainer ~ '[ァ-ヶー]' OR original_trainer ~ '[ぁ-ん]' THEN 'Japanese_Mixed'
      WHEN original_trainer ~ '[A-Za-z]' THEN 'English'
      ELSE 'Other'
    END as language_type
  FROM distributions
),

-- 步驟 2: 找出同一寶可夢有多語種版本的情況
multi_language_groups AS (
  SELECT 
    pokemon_name,
    pokemon_dex_number,
    COUNT(DISTINCT language_type) as language_count,
    ARRAY_AGG(DISTINCT language_type ORDER BY language_type) as languages,
    -- 檢查是否包含特定語種
    BOOL_OR(language_type LIKE 'Korean%') as has_korean,
    BOOL_OR(language_type LIKE 'Japanese%') as has_japanese,
    BOOL_OR(language_type = 'English') as has_english
  FROM language_classification
  GROUP BY pokemon_name, pokemon_dex_number
  HAVING COUNT(DISTINCT language_type) > 1  -- 只要超過1種語言
)

-- 步驟 3: 列出所有多語種配布的詳細資訊
SELECT 
  lc.pokemon_name,
  lc.pokemon_dex_number,
  lc.original_trainer,
  lc.language_type,
  lc.points as current_points,
  lc.distribution_period_start,
  lc.generation,
  lc.id,
  mlg.language_count as total_languages,
  mlg.languages as all_languages,
  mlg.has_korean,
  mlg.has_japanese,
  mlg.has_english
FROM language_classification lc
JOIN multi_language_groups mlg 
  ON lc.pokemon_name = mlg.pokemon_name 
  AND lc.pokemon_dex_number = mlg.pokemon_dex_number
ORDER BY 
  lc.pokemon_name, 
  CASE lc.language_type
    WHEN 'English' THEN 1
    WHEN 'Japanese_Pure' THEN 2
    WHEN 'Japanese_Mixed' THEN 3
    WHEN 'Korean_Pure' THEN 4
    WHEN 'Korean_Mixed' THEN 5
    ELSE 6
  END;

-- ============================================
-- 統計摘要
-- ============================================

-- 有多少寶可夢具有多語種版本
WITH language_classification AS (
  SELECT 
    pokemon_name,
    pokemon_dex_number,
    CASE 
      WHEN original_trainer ~ '[가-힣]' AND original_trainer !~ '[ァ-ヴぁ-ん]' 
           AND original_trainer !~ '[A-Za-z]' THEN 'Korean_Pure'
      WHEN original_trainer ~ '[가-힣]' THEN 'Korean_Mixed'
      WHEN original_trainer ~ '[ァ-ヶー]' AND original_trainer !~ '[A-Za-z]' THEN 'Japanese_Pure'
      WHEN original_trainer ~ '[ァ-ヶー]' OR original_trainer ~ '[ぁ-ん]' THEN 'Japanese_Mixed'
      WHEN original_trainer ~ '[A-Za-z]' THEN 'English'
      ELSE 'Other'
    END as language_type
  FROM distributions
)
SELECT 
  COUNT(DISTINCT pokemon_name) as pokemon_with_multiple_languages,
  SUM(CASE WHEN language_count = 2 THEN 1 ELSE 0 END) as two_languages,
  SUM(CASE WHEN language_count = 3 THEN 1 ELSE 0 END) as three_languages,
  SUM(CASE WHEN language_count >= 4 THEN 1 ELSE 0 END) as four_or_more_languages
FROM (
  SELECT 
    pokemon_name,
    COUNT(DISTINCT language_type) as language_count
  FROM language_classification
  GROUP BY pokemon_name
  HAVING COUNT(DISTINCT language_type) > 1
) stats;
