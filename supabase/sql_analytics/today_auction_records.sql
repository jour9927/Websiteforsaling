-- 查詢今天的用戶競標紀錄
-- 執行日期: 2026-02-17

-- ============================================
-- 1. 今天所有出價記錄（按時間排序）
-- ============================================
SELECT 
    b.created_at as 出價時間,
    p.full_name as 用戶名稱,
    p.email as 電子郵件,
    a.title as 競標標題,
    b.amount as 出價金額,
    a.current_price as 當前最高價,
    CASE 
        WHEN a.current_bidder_id = b.user_id THEN '✅ 當前最高'
        ELSE '❌ 已被超越'
    END as 出價狀態
FROM bids b
JOIN profiles p ON b.user_id = p.id
JOIN auctions a ON b.auction_id = a.id
WHERE DATE(b.created_at) = CURRENT_DATE
ORDER BY b.created_at DESC;

-- ============================================
-- 2. 今天各用戶的出價統計
-- ============================================
SELECT 
    p.full_name as 用戶名稱,
    p.email as 電子郵件,
    COUNT(b.id) as 今日出價次數,
    COUNT(DISTINCT b.auction_id) as 參與競標數,
    SUM(b.amount) as 總出價金額,
    ROUND(AVG(b.amount), 0) as 平均出價,
    MAX(b.amount) as 最高單次出價,
    MAX(b.created_at) as 最後出價時間
FROM profiles p
JOIN bids b ON p.id = b.user_id
WHERE DATE(b.created_at) = CURRENT_DATE
GROUP BY p.id, p.full_name, p.email
ORDER BY COUNT(b.id) DESC;

-- ============================================
-- 3. 今天最活躍的競標項目
-- ============================================
SELECT 
    a.title as 競標標題,
    COUNT(b.id) as 今日出價次數,
    a.current_price as 當前價格,
    a.starting_price as 起標價,
    a.bid_count as 總出價次數,
    a.status as 狀態,
    a.end_time as 結束時間
FROM auctions a
LEFT JOIN bids b ON a.id = b.auction_id AND DATE(b.created_at) = CURRENT_DATE
GROUP BY a.id, a.title, a.current_price, a.starting_price, a.bid_count, a.status, a.end_time
HAVING COUNT(b.id) > 0
ORDER BY COUNT(b.id) DESC;

-- ============================================
-- 4. 今天的出價時間分布（每小時）
-- ============================================
SELECT 
    EXTRACT(HOUR FROM b.created_at) as 小時,
    COUNT(b.id) as 出價次數,
    COUNT(DISTINCT b.user_id) as 活躍用戶數,
    ROUND(AVG(b.amount), 0) as 平均出價金額
FROM bids b
WHERE DATE(b.created_at) = CURRENT_DATE
GROUP BY EXTRACT(HOUR FROM b.created_at)
ORDER BY 小時;

-- ============================================
-- 5. 今天被超價的記錄（競價激烈度）
-- ============================================
WITH bid_rankings AS (
    SELECT 
        b.*,
        a.title,
        a.current_bidder_id,
        p.full_name,
        ROW_NUMBER() OVER (PARTITION BY b.auction_id ORDER BY b.created_at DESC) as rank
    FROM bids b
    JOIN auctions a ON b.auction_id = a.id
    JOIN profiles p ON b.user_id = p.id
    WHERE DATE(b.created_at) = CURRENT_DATE
)
SELECT 
    title as 競標標題,
    full_name as 用戶,
    amount as 出價金額,
    created_at as 出價時間,
    CASE 
        WHEN user_id = current_bidder_id THEN '✅ 仍是最高'
        ELSE '❌ 已被超越'
    END as 狀態
FROM bid_rankings
WHERE rank <= 5  -- 顯示每個競標的最近5次出價
ORDER BY auction_id, created_at DESC;

-- ============================================
-- 6. 今天新增的競標項目
-- ============================================
SELECT 
    title as 競標標題,
    starting_price as 起標價,
    current_price as 當前價格,
    bid_count as 出價次數,
    status as 狀態,
    start_time as 開始時間,
    end_time as 結束時間,
    created_at as 創建時間
FROM auctions
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- ============================================
-- 7. 今天結束的競標與成交記錄
-- ============================================
SELECT 
    a.title as 競標標題,
    a.starting_price as 起標價,
    a.current_price as 成交價,
    p.full_name as 得標者,
    p.email as 得標者郵箱,
    a.bid_count as 總出價次數,
    a.end_time as 結束時間,
    ROUND((a.current_price::numeric / NULLIF(a.starting_price, 0) - 1) * 100, 2) as 漲幅百分比
FROM auctions a
LEFT JOIN profiles p ON a.current_bidder_id = p.id
WHERE a.status = 'ended'
    AND DATE(a.end_time) = CURRENT_DATE
ORDER BY a.end_time DESC;
