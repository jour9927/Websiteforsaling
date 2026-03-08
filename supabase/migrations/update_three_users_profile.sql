-- =============================================
-- 更新阿文、DSD、Jetski 的個人資料
-- 1. 加入日期
-- 2. 配布收藏數量 200+
-- 3. 參與所有活動
-- =============================================

-- ====== 更新加入日期 ======
UPDATE profiles SET created_at = '2025-10-02T00:00:00Z' WHERE id = '7cdc6fb0-fc8d-4119-88f3-62a0a9541e9c'; -- 阿文 → 2025/10/2
UPDATE profiles SET created_at = '2025-09-29T00:00:00Z' WHERE id = '4a91af11-4092-475f-9f85-596f47a120b3'; -- DSD → 2025/9/29
UPDATE profiles SET created_at = '2025-10-08T00:00:00Z' WHERE id = 'a3ccfeb8-d489-4289-b3ff-923384ca5d88'; -- Jetski → 2025/10/8

-- ====== 為三人隨機灌入 200+ 配布收藏 ======
-- 先清除三人現有的配布收藏（避免重複）
DELETE FROM user_distributions WHERE user_id IN (
    '7cdc6fb0-fc8d-4119-88f3-62a0a9541e9c',
    '4a91af11-4092-475f-9f85-596f47a120b3',
    'a3ccfeb8-d489-4289-b3ff-923384ca5d88'
);

-- 為阿文灌入 220 筆配布收藏（從全部配布中隨機選取）
INSERT INTO user_distributions (user_id, distribution_id)
SELECT '7cdc6fb0-fc8d-4119-88f3-62a0a9541e9c', id
FROM distributions
ORDER BY random()
LIMIT 220
ON CONFLICT DO NOTHING;

-- 為 DSD 灌入 250 筆配布收藏
INSERT INTO user_distributions (user_id, distribution_id)
SELECT '4a91af11-4092-475f-9f85-596f47a120b3', id
FROM distributions
ORDER BY random()
LIMIT 250
ON CONFLICT DO NOTHING;

-- 為 Jetski 灌入 210 筆配布收藏
INSERT INTO user_distributions (user_id, distribution_id)
SELECT 'a3ccfeb8-d489-4289-b3ff-923384ca5d88', id
FROM distributions
ORDER BY random()
LIMIT 210
ON CONFLICT DO NOTHING;

-- ====== 為三人報名所有活動（參與經驗）======
-- 先清除三人現有的活動報名（避免重複）
DELETE FROM registrations WHERE user_id IN (
    '7cdc6fb0-fc8d-4119-88f3-62a0a9541e9c',
    '4a91af11-4092-475f-9f85-596f47a120b3',
    'a3ccfeb8-d489-4289-b3ff-923384ca5d88'
);

-- 阿文：參加所有活動
INSERT INTO registrations (user_id, event_id, status, registered_at)
SELECT '7cdc6fb0-fc8d-4119-88f3-62a0a9541e9c', id, 'confirmed', created_at
FROM events
ON CONFLICT DO NOTHING;

-- DSD：參加所有活動
INSERT INTO registrations (user_id, event_id, status, registered_at)
SELECT '4a91af11-4092-475f-9f85-596f47a120b3', id, 'confirmed', created_at
FROM events
ON CONFLICT DO NOTHING;

-- Jetski：參加所有活動
INSERT INTO registrations (user_id, event_id, status, registered_at)
SELECT 'a3ccfeb8-d489-4289-b3ff-923384ca5d88', id, 'confirmed', created_at
FROM events
ON CONFLICT DO NOTHING;
