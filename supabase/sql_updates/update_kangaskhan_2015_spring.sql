-- 更新 2015 Spring 袋獸點數至 33 萬+
-- 執行日期: 2026-02-17

-- 查詢目前的袋獸配布記錄（2015 Spring）
SELECT 
    id, 
    pokemon_name, 
    original_trainer, 
    distribution_method,
    distribution_period_start,
    points,
    generation
FROM distributions
WHERE 
    (pokemon_name LIKE '%袋獸%' OR pokemon_name LIKE '%Kangaskhan%')
    AND (
        original_trainer LIKE '%2015 Spring%'
        OR original_trainer LIKE '%봄%'  -- 韓文「春」
        OR (EXTRACT(YEAR FROM distribution_period_start::date) = 2015 
            AND EXTRACT(MONTH FROM distribution_period_start::date) BETWEEN 3 AND 5)
    )
ORDER BY distribution_period_start;

-- 更新點數到 330,000 以上（具體值可根據需求調整）
-- 範例：設定為 330,052（或其他 33 萬多的數字）

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

-- 驗證更新結果
SELECT 
    pokemon_name, 
    original_trainer,
    distribution_period_start,
    points
FROM distributions
WHERE 
    (pokemon_name LIKE '%袋獸%' OR pokemon_name LIKE '%Kangaskhan%')
    AND points >= 300000
ORDER BY points DESC;
