-- =====================================================
-- 034_eevee_day_event.sql
-- 伊布寶可夢 Day 限時集點活動
-- =====================================================

-- 1. 活動集點記錄
CREATE TABLE IF NOT EXISTS eevee_day_stamps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    quiz_score INTEGER NOT NULL,  -- 答對題數
    quiz_total INTEGER NOT NULL DEFAULT 10  -- 總題數
);

-- 2. 答題嘗試記錄（追蹤每日次數）
CREATE TABLE IF NOT EXISTS eevee_day_quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    attempted_at TIMESTAMPTZ DEFAULT NOW(),
    score INTEGER NOT NULL,
    passed BOOLEAN NOT NULL DEFAULT FALSE
);

-- 3. 用戶獎勵選擇
CREATE TABLE IF NOT EXISTS eevee_day_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    distribution_id UUID REFERENCES distributions(id) NOT NULL,
    selected_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)  -- 每人只能選一次
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_eevee_stamps_user ON eevee_day_stamps(user_id);
CREATE INDEX IF NOT EXISTS idx_eevee_attempts_user ON eevee_day_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_eevee_attempts_time ON eevee_day_quiz_attempts(user_id, attempted_at);
CREATE INDEX IF NOT EXISTS idx_eevee_rewards_user ON eevee_day_rewards(user_id);

-- RLS 政策
ALTER TABLE eevee_day_stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE eevee_day_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE eevee_day_rewards ENABLE ROW LEVEL SECURITY;

-- stamps
CREATE POLICY "eevee_stamps_select_own" ON eevee_day_stamps
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "eevee_stamps_insert_own" ON eevee_day_stamps
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- quiz attempts
CREATE POLICY "eevee_attempts_select_own" ON eevee_day_quiz_attempts
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "eevee_attempts_insert_own" ON eevee_day_quiz_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- rewards
CREATE POLICY "eevee_rewards_select_own" ON eevee_day_rewards
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "eevee_rewards_insert_own" ON eevee_day_rewards
    FOR INSERT WITH CHECK (auth.uid() = user_id);
