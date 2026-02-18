-- 更新蒂安希 (Diancie) univers 配布點數至 28 萬+
-- 執行日期: 2026-02-17

-- 查詢目前的蒂安希配布記錄（univers）
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
    (pokemon_name LIKE '%蒂安希%' OR pokemon_name LIKE '%Diancie%')
    AND (
        original_trainer LIKE '%univers%' 
        OR original_trainer LIKE '%Universe%'
        OR original_trainer LIKE '%ユニバース%'  -- 日文
    )
ORDER BY distribution_period_start;

-- 更新點數到 280,000 以上（具體值：280,052）
UPDATE distributions
SET points = 280052
WHERE 
    (pokemon_name LIKE '%蒂安希%' OR pokemon_name LIKE '%Diancie%')
    AND (
        original_trainer LIKE '%univers%' 
        OR original_trainer LIKE '%Universe%'
        OR original_trainer LIKE '%ユニバース%'
    );

-- 驗證更新結果
SELECT 
    pokemon_name, 
    original_trainer,
    distribution_period_start,
    points
FROM distributions
WHERE 
    (pokemon_name LIKE '%蒂安希%' OR pokemon_name LIKE '%Diancie%')
ORDER BY points DESC;
