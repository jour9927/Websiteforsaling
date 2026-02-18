-- 競標系統數據統計查詢
-- 執行日期: 2026-02-17

-- ============================================
-- 1. 競標概覽統計
-- ============================================
SELECT 
    COUNT(*) as 總競標數,
    COUNT(*) FILTER (WHERE status = 'active') as 進行中,
    COUNT(*) FILTER (WHERE status = 'ended') as 已結束,
    COUNT(*) FILTER (WHERE status = 'pending') as 待開始,
    ROUND(AVG(current_price), 2) as 平均成交價,
    MAX(current_price) as 最高成交價,
    SUM(bid_count) as 總出價次數
FROM auctions;

-- ============================================
-- 2. 熱門競標排行（按出價次數）
-- ============================================
SELECT 
    title as 競標標題,
    bid_count as 出價次數,
    current_price as 當前價格,
    starting_price as 起標價,
    ROUND((current_price::numeric / NULLIF(starting_price, 0) - 1) * 100, 2) as 漲幅百分比,
    status as 狀態,
    end_time as 結束時間,
    CASE 
        WHEN bid_count >= 20 THEN '🔥🔥🔥 白熱化'
        WHEN bid_count >= 10 THEN '🔥🔥 激烈'
        WHEN bid_count >= 5 THEN '🔥 熱門'
        ELSE '一般'
    END as 熱度等級
FROM auctions
ORDER BY bid_count DESC
LIMIT 10;

-- ============================================
-- 3. 價格漲幅排行
-- ============================================
SELECT 
    title as 競標標題,
    starting_price as 起標價,
    current_price as 當前價格,
    (current_price - starting_price) as 漲幅金額,
    ROUND((current_price::numeric / NULLIF(starting_price, 0) - 1) * 100, 2) as 漲幅百分比,
    bid_count as 出價次數,
    status as 狀態
FROM auctions
WHERE starting_price > 0
ORDER BY (current_price::numeric / NULLIF(starting_price, 0)) DESC
LIMIT 10;

-- ============================================
-- 4. 最近 24 小時活躍競標
-- ============================================
SELECT 
    a.title as 競標標題,
    a.current_price as 當前價格,
    a.bid_count as 出價次數,
    COUNT(b.id) as 近24小時出價,
    a.status as 狀態,
    a.end_time as 結束時間
FROM auctions a
LEFT JOIN bids b ON a.id = b.auction_id 
    AND b.created_at > NOW() - INTERVAL '24 hours'
WHERE a.status = 'active'
GROUP BY a.id, a.title, a.current_price, a.bid_count, a.status, a.end_time
ORDER BY COUNT(b.id) DESC
LIMIT 10;

-- ============================================
-- 5. 出價者活躍度排行
-- ============================================
SELECT 
    p.full_name as 用戶名稱,
    p.email as 電子郵件,
    COUNT(b.id) as 總出價次數,
    COUNT(DISTINCT b.auction_id) as 參與競標數,
    SUM(b.amount) as 總出價金額,
    ROUND(AVG(b.amount), 2) as 平均出價,
    MAX(b.created_at) as 最後出價時間
FROM profiles p
JOIN bids b ON p.id = b.user_id
GROUP BY p.id, p.full_name, p.email
ORDER BY COUNT(b.id) DESC
LIMIT 10;

-- ============================================
-- 6. 即將結束的競標（未來 2 小時內）
-- ============================================
SELECT 
    title as 競標標題,
    current_price as 當前價格,
    starting_price as 起標價,
    bid_count as 出價次數,
    end_time as 結束時間,
    EXTRACT(EPOCH FROM (end_time - NOW())) / 60 as 剩餘分鐘數,
    CASE 
        WHEN bid_count >= 20 THEN '🔥🔥🔥'
        WHEN bid_count >= 10 THEN '🔥🔥'
        WHEN bid_count >= 5 THEN '🔥'
        ELSE ''
    END as 熱度
FROM auctions
WHERE status = 'active'
    AND end_time <= NOW() + INTERVAL '2 hours'
    AND end_time > NOW()
ORDER BY end_time ASC;

-- ============================================
-- 7. Anti-Snipe 延長統計（需要自訂追蹤）
-- 注意：目前系統沒有記錄延長次數，這裡只能估算
-- ============================================
-- 最後 60 秒出價的記錄（可能觸發 Anti-Snipe）
SELECT 
    a.title as 競標標題,
    COUNT(b.id) as 最後60秒出價次數,
    a.bid_count as 總出價次數
FROM auctions a
JOIN bids b ON a.id = b.auction_id
WHERE b.created_at >= a.end_time - INTERVAL '60 seconds'
    AND a.status = 'ended'
GROUP BY a.id, a.title, a.bid_count
HAVING COUNT(b.id) > 0
ORDER BY COUNT(b.id) DESC
LIMIT 10;

-- ============================================
-- 8. 成交率分析（已結束競標）
-- ============================================
SELECT 
    COUNT(*) as 已結束總數,
    COUNT(*) FILTER (WHERE bid_count > 0) as 有人出價數量,
    COUNT(*) FILTER (WHERE bid_count = 0) as 流標數量,
    ROUND(COUNT(*) FILTER (WHERE bid_count > 0)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as 成交率
FROM auctions
WHERE status = 'ended';

-- ============================================
-- 9. 每日競標活動趨勢（最近 7 天）
-- ============================================
SELECT 
    DATE(b.created_at) as 日期,
    COUNT(b.id) as 出價次數,
    COUNT(DISTINCT b.auction_id) as 活躍競標數,
    COUNT(DISTINCT b.user_id) as 活躍用戶數,
    ROUND(AVG(b.amount), 2) as 平均出價
FROM bids b
WHERE b.created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(b.created_at)
ORDER BY DATE(b.created_at) DESC;

-- ============================================
-- 10. 競標分類統計（若有分類欄位）
-- ============================================
-- 注意：這需要 auctions 表有 category 或類似欄位
-- 如果沒有，可以根據 title 或其他欄位分類

-- 示例：根據配布世代分類（如果 title 包含世代資訊）
SELECT 
    CASE 
        WHEN title LIKE '%第3世代%' OR title LIKE '%Gen3%' THEN '第3世代'
        WHEN title LIKE '%第4世代%' OR title LIKE '%Gen4%' THEN '第4世代'
        WHEN title LIKE '%第5世代%' OR title LIKE '%Gen5%' THEN '第5世代'
        WHEN title LIKE '%第6世代%' OR title LIKE '%Gen6%' THEN '第6世代'
        WHEN title LIKE '%第7世代%' OR title LIKE '%Gen7%' THEN '第7世代'
        WHEN title LIKE '%第8世代%' OR title LIKE '%Gen8%' THEN '第8世代'
        WHEN title LIKE '%第9世代%' OR title LIKE '%Gen9%' THEN '第9世代'
        ELSE '其他'
    END as 世代分類,
    COUNT(*) as 競標數量,
    ROUND(AVG(current_price), 2) as 平均價格,
    SUM(bid_count) as 總出價次數
FROM auctions
GROUP BY 
    CASE 
        WHEN title LIKE '%第3世代%' OR title LIKE '%Gen3%' THEN '第3世代'
        WHEN title LIKE '%第4世代%' OR title LIKE '%Gen4%' THEN '第4世代'
        WHEN title LIKE '%第5世代%' OR title LIKE '%Gen5%' THEN '第5世代'
        WHEN title LIKE '%第6世代%' OR title LIKE '%Gen6%' THEN '第6世代'
        WHEN title LIKE '%第7世代%' OR title LIKE '%Gen7%' THEN '第7世代'
        WHEN title LIKE '%第8世代%' OR title LIKE '%Gen8%' THEN '第8世代'
        WHEN title LIKE '%第9世代%' OR title LIKE '%Gen9%' THEN '第9世代'
        ELSE '其他'
    END
ORDER BY 競標數量 DESC;
