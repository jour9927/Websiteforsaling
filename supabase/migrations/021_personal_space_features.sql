-- =====================================================
-- 個人空間功能 - 資料庫擴展
-- =====================================================

-- 1. 擴展 profiles 表
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pokemon_first_year INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS featured_items UUID[] DEFAULT '{}';

-- 確保 joined_at 使用 created_at（如果沒有的話）
-- profiles 表應該已經有 created_at，我們用它作為加入日期

-- 2. 建立願望清單表
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- 願望清單索引
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);

-- 願望清單 RLS
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- 用戶可以查看所有人的願望清單
CREATE POLICY "wishlists_select_all" ON wishlists
  FOR SELECT USING (true);

-- 用戶只能管理自己的願望清單
CREATE POLICY "wishlists_insert_own" ON wishlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wishlists_update_own" ON wishlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "wishlists_delete_own" ON wishlists
  FOR DELETE USING (auth.uid() = user_id);

-- 3. 建立留言表
CREATE TABLE IF NOT EXISTS profile_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  commenter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 留言索引
CREATE INDEX IF NOT EXISTS idx_profile_comments_profile_user ON profile_comments(profile_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_comments_created_at ON profile_comments(created_at DESC);

-- 留言 RLS
ALTER TABLE profile_comments ENABLE ROW LEVEL SECURITY;

-- 任何人可以查看留言
CREATE POLICY "comments_select_all" ON profile_comments
  FOR SELECT USING (true);

-- 登入用戶可以留言
CREATE POLICY "comments_insert_authenticated" ON profile_comments
  FOR INSERT WITH CHECK (auth.uid() = commenter_id);

-- 留言者或被留言者可以刪除
CREATE POLICY "comments_delete_own" ON profile_comments
  FOR DELETE USING (auth.uid() = commenter_id OR auth.uid() = profile_user_id);
