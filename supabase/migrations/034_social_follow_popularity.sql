-- 社交關注與人氣值系統
-- 功能：關注系統、人氣值投票、週排行榜

-- ============================================
-- 1. 創建關注表
-- ============================================
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    -- 被關注對象（二選一）
    followed_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    followed_virtual_id UUID REFERENCES virtual_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- 確保一個用戶只能關注另一個用戶一次
    CONSTRAINT follows_unique_user UNIQUE (follower_id, followed_user_id),
    CONSTRAINT follows_unique_virtual UNIQUE (follower_id, followed_virtual_id),
    -- 確保至少有一個被關注對象
    CONSTRAINT follows_has_target CHECK (
        (followed_user_id IS NOT NULL AND followed_virtual_id IS NULL) OR
        (followed_user_id IS NULL AND followed_virtual_id IS NOT NULL)
    )
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed_user ON follows(followed_user_id) WHERE followed_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_follows_followed_virtual ON follows(followed_virtual_id) WHERE followed_virtual_id IS NOT NULL;

-- ============================================
-- 2. 創建人氣值投票表
-- ============================================
CREATE TABLE IF NOT EXISTS popularity_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    -- 投票對象（二選一）
    target_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    target_virtual_id UUID REFERENCES virtual_profiles(id) ON DELETE CASCADE,
    voted_at TIMESTAMPTZ DEFAULT NOW(),
    -- 用於限制：每週只能給同一人投一次
    week_number INTEGER NOT NULL, -- ISO 週數：EXTRACT(WEEK FROM NOW())
    year_number INTEGER NOT NULL, -- 年份
    -- 用於限制：每月 4 次 quota
    month_year TEXT NOT NULL, -- 格式：2026-02
    -- 唯一約束
    CONSTRAINT votes_unique_user_week UNIQUE (voter_id, target_user_id, year_number, week_number),
    CONSTRAINT votes_unique_virtual_week UNIQUE (voter_id, target_virtual_id, year_number, week_number),
    -- 確保至少有一個對象
    CONSTRAINT votes_has_target CHECK (
        (target_user_id IS NOT NULL AND target_virtual_id IS NULL) OR
        (target_user_id IS NULL AND target_virtual_id IS NOT NULL)
    )
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_votes_voter ON popularity_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_votes_month ON popularity_votes(month_year);
CREATE INDEX IF NOT EXISTS idx_votes_week ON popularity_votes(year_number, week_number);
CREATE INDEX IF NOT EXISTS idx_votes_target_user ON popularity_votes(target_user_id) WHERE target_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_votes_target_virtual ON popularity_votes(target_virtual_id) WHERE target_virtual_id IS NOT NULL;

-- ============================================
-- 3. 修改 profiles 表新增欄位
-- ============================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS popularity_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- ============================================
-- 4. 修改 virtual_profiles 表新增欄位
-- ============================================
ALTER TABLE virtual_profiles
ADD COLUMN IF NOT EXISTS popularity_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;

-- 為虛擬用戶生成隨機初始人氣值（5-50）
UPDATE virtual_profiles
SET popularity_score = floor(random() * 46 + 5)::INTEGER
WHERE popularity_score = 0 OR popularity_score IS NULL;

-- 為虛擬用戶生成隨機初始關注者數（3-30）
UPDATE virtual_profiles
SET followers_count = floor(random() * 28 + 3)::INTEGER
WHERE followers_count = 0 OR followers_count IS NULL;

-- ============================================
-- 5. RLS 政策
-- ============================================

-- follows 表
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view follows" ON follows;
CREATE POLICY "Anyone can view follows"
ON follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON follows;
CREATE POLICY "Users can follow others"
ON follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON follows;
CREATE POLICY "Users can unfollow"
ON follows FOR DELETE
USING (auth.uid() = follower_id);

-- popularity_votes 表
ALTER TABLE popularity_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view votes" ON popularity_votes;
CREATE POLICY "Anyone can view votes"
ON popularity_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can vote" ON popularity_votes;
CREATE POLICY "Users can vote"
ON popularity_votes FOR INSERT
WITH CHECK (auth.uid() = voter_id);

-- ============================================
-- 6. 用於計算週人氣的視圖
-- ============================================
DROP VIEW IF EXISTS weekly_popularity_rankings;
CREATE VIEW weekly_popularity_rankings AS
WITH current_week AS (
    SELECT 
        EXTRACT(WEEK FROM NOW())::INTEGER as week_num,
        EXTRACT(YEAR FROM NOW())::INTEGER as year_num
),
user_votes AS (
    SELECT 
        target_user_id as user_id,
        NULL::UUID as virtual_id,
        COUNT(*) as weekly_votes
    FROM popularity_votes, current_week
    WHERE year_number = current_week.year_num 
      AND week_number = current_week.week_num
      AND target_user_id IS NOT NULL
    GROUP BY target_user_id
),
virtual_votes AS (
    SELECT 
        NULL::UUID as user_id,
        target_virtual_id as virtual_id,
        COUNT(*) as weekly_votes
    FROM popularity_votes, current_week
    WHERE year_number = current_week.year_num 
      AND week_number = current_week.week_num
      AND target_virtual_id IS NOT NULL
    GROUP BY target_virtual_id
),
all_rankings AS (
    SELECT 
        p.id as user_id,
        NULL::UUID as virtual_id,
        p.full_name as display_name,
        p.username,
        p.popularity_score,
        COALESCE(uv.weekly_votes, 0) as weekly_votes,
        false as is_virtual
    FROM profiles p
    LEFT JOIN user_votes uv ON p.id = uv.user_id
    WHERE p.popularity_score > 0 OR uv.weekly_votes > 0
    
    UNION ALL
    
    SELECT 
        NULL::UUID as user_id,
        vp.id as virtual_id,
        vp.display_name,
        NULL as username,
        vp.popularity_score,
        COALESCE(vv.weekly_votes, 0) as weekly_votes,
        true as is_virtual
    FROM virtual_profiles vp
    LEFT JOIN virtual_votes vv ON vp.id = vv.virtual_id
    WHERE vp.popularity_score > 0 OR vv.weekly_votes > 0
)
SELECT 
    user_id,
    virtual_id,
    display_name,
    username,
    popularity_score,
    weekly_votes,
    is_virtual,
    (popularity_score + weekly_votes * 10) as total_score, -- 週投票加權
    ROW_NUMBER() OVER (ORDER BY (popularity_score + weekly_votes * 10) DESC) as rank
FROM all_rankings
ORDER BY total_score DESC;

-- 授權視圖
GRANT SELECT ON weekly_popularity_rankings TO anon, authenticated;
