-- =====================================================
-- 032_check_in_rewards.sql
-- 簽到功能升級：40 天獎勵、補簽機制
-- =====================================================

-- 1. 修改 profiles 表：新增簽到相關欄位
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS check_in_goal_distribution_id UUID REFERENCES distributions(id),  -- 目標獎勵寶可夢
ADD COLUMN IF NOT EXISTS check_in_debt INTEGER DEFAULT 0,  -- 補簽債務（斷簽累積的天數）
ADD COLUMN IF NOT EXISTS check_in_milestone INTEGER DEFAULT 40;  -- 里程碑天數（預設 40）

-- 2. 建立 check_in_rewards 表：記錄用戶已獲得的簽到獎勵
CREATE TABLE IF NOT EXISTS check_in_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    distribution_id UUID REFERENCES distributions(id) NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    milestone_days INTEGER NOT NULL,  -- 達成時的連續天數
    UNIQUE(user_id, earned_at)  -- 同一用戶同一時間只能獲得一個獎勵
);

-- 3. 索引
CREATE INDEX IF NOT EXISTS idx_check_in_rewards_user ON check_in_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_check_in_rewards_distribution ON check_in_rewards(distribution_id);
CREATE INDEX IF NOT EXISTS idx_profiles_goal_distribution ON profiles(check_in_goal_distribution_id);

-- 4. RLS 政策
ALTER TABLE check_in_rewards ENABLE ROW LEVEL SECURITY;

-- 用戶可以查看自己的獎勵記錄
CREATE POLICY "check_in_rewards_select_own" ON check_in_rewards
    FOR SELECT USING (auth.uid() = user_id);

-- 系統可以新增獎勵（透過 API）
CREATE POLICY "check_in_rewards_insert_system" ON check_in_rewards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 說明：
-- 1. check_in_goal_distribution_id: 用戶設定的 40 天獎勵目標寶可夢
-- 2. check_in_debt: 補簽債務，斷簽 1 天 = 需多簽 2 天
-- 3. check_in_milestone: 里程碑天數，預設 40 天
-- 4. check_in_rewards: 記錄用戶獲得的所有簽到獎勵
-- =====================================================
