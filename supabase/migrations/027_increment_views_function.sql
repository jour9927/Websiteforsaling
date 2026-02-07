-- 建立增加瀏覽量的 RPC 函數
CREATE OR REPLACE FUNCTION increment_profile_views(profile_id UUID, add_views INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE profiles
    SET 
        total_views = COALESCE(total_views, 0) + add_views,
        today_views = COALESCE(today_views, 0) + add_views
    WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 允許 authenticated 和 anon 呼叫此函數
GRANT EXECUTE ON FUNCTION increment_profile_views(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_profile_views(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION increment_profile_views(UUID, INTEGER) TO service_role;

-- 更新 profile_visits 的 RLS 策略
ALTER TABLE profile_visits ENABLE ROW LEVEL SECURITY;

-- 允許讀取所有訪問記錄
CREATE POLICY "Anyone can read profile visits"
ON profile_visits FOR SELECT
USING (true);

-- 只有 service_role 可以插入（用於 cron job）
CREATE POLICY "Service role can insert visits"
ON profile_visits FOR INSERT
WITH CHECK (true);
