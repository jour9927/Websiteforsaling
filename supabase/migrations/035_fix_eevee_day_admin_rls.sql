-- =====================================================
-- 035_fix_eevee_day_admin_rls.sql
-- 修復伊布集點日管理後台統計為 0 的問題
-- 原因：缺少管理員的 SELECT 政策，導致管理員只能看到自己的資料
-- =====================================================

-- 1. eevee_day_stamps - 管理員可查看所有集點紀錄
CREATE POLICY "eevee_stamps_select_admin" ON eevee_day_stamps
    FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE role = 'admin'
    ));

-- 2. eevee_day_quiz_attempts - 管理員可查看所有答題紀錄
CREATE POLICY "eevee_attempts_select_admin" ON eevee_day_quiz_attempts
    FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE role = 'admin'
    ));

-- 3. eevee_day_rewards - 管理員可查看所有獎勵紀錄
CREATE POLICY "eevee_rewards_select_admin" ON eevee_day_rewards
    FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE role = 'admin'
    ));
