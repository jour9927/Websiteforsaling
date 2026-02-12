-- 新增 announcement_reads 資料表
-- 追蹤每位使用者對每則公告的已讀狀態

CREATE TABLE IF NOT EXISTS announcement_reads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    read_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(announcement_id, user_id)
);

-- 啟用 RLS
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

-- 使用者可以插入自己的已讀記錄
CREATE POLICY "announcement_reads_insert_own" ON announcement_reads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 使用者可以查詢自己的已讀記錄
CREATE POLICY "announcement_reads_select_own" ON announcement_reads
    FOR SELECT USING (auth.uid() = user_id);

-- 管理員可以查詢所有已讀記錄
CREATE POLICY "announcement_reads_select_admin" ON announcement_reads
    FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 建立索引加速查詢
CREATE INDEX IF NOT EXISTS idx_announcement_reads_announcement_id ON announcement_reads(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user_id ON announcement_reads(user_id);
