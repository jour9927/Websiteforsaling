-- 新增 username 欄位到 profiles 表
-- 用於自訂公開網址 /user/username

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 建立索引加速查詢
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- 新增 username 格式檢查（只允許英文、數字、底線，3-20 字元）
ALTER TABLE profiles
ADD CONSTRAINT username_format CHECK (
  username IS NULL OR 
  (username ~ '^[a-zA-Z0-9_]{3,20}$')
);

-- 新增訪問統計欄位
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS total_views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS today_views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_view_reset DATE DEFAULT CURRENT_DATE;

-- 建立訪問記錄表（用於顯示最近訪客頭像）
CREATE TABLE IF NOT EXISTS profile_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  visitor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  visited_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(profile_user_id, visitor_id, (visited_at::date)) -- 每人每天只記錄一次
);

CREATE INDEX IF NOT EXISTS idx_profile_visits_profile ON profile_visits(profile_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_visits_time ON profile_visits(visited_at DESC);
