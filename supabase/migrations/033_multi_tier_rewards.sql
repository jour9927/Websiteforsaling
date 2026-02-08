-- 多層級簽到獎勵系統
-- 層級：12天(9世代)、40天(7-9世代)、120點(6-9世代)

-- 新增獎勵層級追蹤欄位
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS reward_tier_12_goal_id UUID REFERENCES distributions(id),
ADD COLUMN IF NOT EXISTS reward_tier_12_claimed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reward_tier_40_goal_id UUID REFERENCES distributions(id),
ADD COLUMN IF NOT EXISTS reward_tier_40_claimed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reward_tier_points_goal_id UUID REFERENCES distributions(id),
ADD COLUMN IF NOT EXISTS reward_tier_points_claimed_at TIMESTAMPTZ;

-- 為舊的 check_in_goal_distribution_id 欄位建立別名（保持向下相容）
-- 將現有的 40 天目標遷移到新欄位
UPDATE profiles 
SET reward_tier_40_goal_id = check_in_goal_distribution_id
WHERE check_in_goal_distribution_id IS NOT NULL
  AND reward_tier_40_goal_id IS NULL;

-- 新增獎勵歷史表（記錄已領取的所有獎勵）
CREATE TABLE IF NOT EXISTS check_in_tier_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('tier_12', 'tier_40', 'tier_points')),
    distribution_id UUID REFERENCES distributions(id) NOT NULL,
    claimed_at TIMESTAMPTZ DEFAULT NOW(),
    streak_at_claim INTEGER,
    points_at_claim INTEGER,
    UNIQUE(user_id, tier)  -- 每個層級只能領一次
);

-- RLS 政策
ALTER TABLE check_in_tier_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tier rewards" ON check_in_tier_rewards;
CREATE POLICY "Users can view own tier rewards"
ON check_in_tier_rewards FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tier rewards" ON check_in_tier_rewards;
CREATE POLICY "Users can insert own tier rewards"
ON check_in_tier_rewards FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_tier_rewards_user_id ON check_in_tier_rewards(user_id);
