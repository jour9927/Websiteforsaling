-- 診斷留言插入問題
-- 請在 Supabase SQL Editor 執行此查詢

-- 1. 檢查現有的 RLS 政策
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profile_comments';

-- 2. 暫時放寬 INSERT 政策（允許任何已登入用戶留言）
-- 先刪除現有政策
DROP POLICY IF EXISTS "comments_insert_authenticated" ON profile_comments;

-- 重新創建更寬鬆的政策
CREATE POLICY "comments_insert_authenticated" ON profile_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 3. 測試查詢：查看最近的留言
SELECT * FROM profile_comments ORDER BY created_at DESC LIMIT 10;
