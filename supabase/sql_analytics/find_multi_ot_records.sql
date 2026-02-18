-- ============================================
-- 分析：找出含有多語種 OT 的記錄（需要拆分）
-- 特徵：original_trainer 含有 ' / ' 分隔的多個語種親名
-- 執行日期: 2026-02-18
-- ============================================

-- 步驟 1: 找出所有含有 ' / ' 的 original_trainer 記錄
SELECT 
    id,
    pokemon_name,
    original_trainer,
    trainer_id,
    points,
    generation,
    distribution_period_start,
    -- 計算含有幾個 OT（以 ' / ' 分隔）
    ARRAY_LENGTH(STRING_TO_ARRAY(original_trainer, ' / '), 1) as ot_count,
    -- 列出各個 OT
    STRING_TO_ARRAY(original_trainer, ' / ') as ot_parts,
    -- 列出各個 TID（如果有多個）
    STRING_TO_ARRAY(trainer_id, ', ') as tid_parts
FROM distributions
WHERE original_trainer LIKE '%/%'
  AND original_trainer ~ '[가-힣ぁ-んァ-ヶー]'  -- 包含日韓文字
ORDER BY pokemon_name, generation;

-- 步驟 2: 統計摘要
SELECT 
    COUNT(*) as total_multi_ot_records,
    COUNT(DISTINCT pokemon_name) as unique_pokemon,
    ARRAY_AGG(DISTINCT pokemon_name ORDER BY pokemon_name) as affected_pokemon
FROM distributions
WHERE original_trainer LIKE '%/%'
  AND original_trainer ~ '[가-힣ぁ-んァ-ヶー]';
