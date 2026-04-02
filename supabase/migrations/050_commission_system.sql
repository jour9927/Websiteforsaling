-- ============================================================
-- 050_commission_system.sql
-- 場外委託區（External Commission Zone）
-- ============================================================

-- 1. commissions 主表
CREATE TABLE IF NOT EXISTS commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 刊登者（real user 或 virtual user，二擇一）
    poster_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    poster_virtual_id UUID REFERENCES virtual_profiles(id) ON DELETE SET NULL,
    poster_type TEXT NOT NULL DEFAULT 'user' CHECK (poster_type IN ('user', 'virtual')),

    -- 寶可夢資料（連接配布圖鑑）
    distribution_id UUID REFERENCES distributions(id) ON DELETE SET NULL,
    pokemon_name TEXT NOT NULL,
    description TEXT,

    -- 合法性證明
    proof_images TEXT[] DEFAULT '{}',

    -- 價格與抽成
    base_price INTEGER NOT NULL DEFAULT 0,
    poster_fee INTEGER NOT NULL DEFAULT 0,
    executor_fee INTEGER NOT NULL DEFAULT 0,
    executor_fee_approved BOOLEAN NOT NULL DEFAULT false,

    -- 狀態流：pending_review → approved → queued → active → accepted → proof_submitted → proof_approved → completed / cancelled
    status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN (
        'pending_review', 'approved', 'queued', 'active',
        'accepted', 'proof_submitted', 'proof_approved',
        'completed', 'cancelled'
    )),

    -- 排隊管理
    queue_position INTEGER,
    activated_date DATE,

    -- 執行者（接單的人）
    executor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    executor_virtual_id UUID REFERENCES virtual_profiles(id) ON DELETE SET NULL,
    executor_type TEXT CHECK (executor_type IN ('user', 'virtual')),

    -- 審核
    admin_review_note TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

    -- 時間戳
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- 抽成上限：poster_fee + executor_fee <= base_price * 4/5
    CONSTRAINT commission_fee_cap CHECK (poster_fee + executor_fee <= base_price * 4 / 5),
    -- 確保刊登者二擇一
    CONSTRAINT commission_poster_check CHECK (
        (poster_type = 'user' AND poster_id IS NOT NULL AND poster_virtual_id IS NULL) OR
        (poster_type = 'virtual' AND poster_virtual_id IS NOT NULL AND poster_id IS NULL)
    )
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_poster ON commissions(poster_id);
CREATE INDEX IF NOT EXISTS idx_commissions_executor ON commissions(executor_id);
CREATE INDEX IF NOT EXISTS idx_commissions_activated_date ON commissions(activated_date);
CREATE INDEX IF NOT EXISTS idx_commissions_distribution ON commissions(distribution_id);

-- 2. commission_deposits 押底表
CREATE TABLE IF NOT EXISTS commission_deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commission_id UUID NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
    depositor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- 押底寶可夢
    deposit_pokemon_name TEXT NOT NULL,
    deposit_pokemon_value INTEGER NOT NULL,

    -- 狀態：held → returning → returned
    status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'returning', 'returned')),

    -- 時間
    deposited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    return_eligible_at TIMESTAMPTZ, -- completed_at + 10 days
    returned_at TIMESTAMPTZ,

    CONSTRAINT deposit_unique_per_commission UNIQUE (commission_id, depositor_id)
);

CREATE INDEX IF NOT EXISTS idx_commission_deposits_commission ON commission_deposits(commission_id);
CREATE INDEX IF NOT EXISTS idx_commission_deposits_depositor ON commission_deposits(depositor_id);
CREATE INDEX IF NOT EXISTS idx_commission_deposits_status ON commission_deposits(status);

-- 3. commission_messages 委託內訊息
CREATE TABLE IF NOT EXISTS commission_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commission_id UUID NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    sender_virtual_id UUID REFERENCES virtual_profiles(id) ON DELETE SET NULL,
    sender_type TEXT NOT NULL DEFAULT 'user' CHECK (sender_type IN ('user', 'virtual', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commission_messages_commission ON commission_messages(commission_id);

-- ============================================================
-- RLS 策略
-- ============================================================

ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_messages ENABLE ROW LEVEL SECURITY;

-- commissions: 公開讀取
CREATE POLICY "commissions_read_all" ON commissions
    FOR SELECT USING (true);

-- commissions: 登入用戶可建立（poster_id = 自己）
CREATE POLICY "commissions_insert_own" ON commissions
    FOR INSERT WITH CHECK (auth.uid() = poster_id);

-- commissions: 本人可更新自己的委託（有限欄位，由 API 控制）
CREATE POLICY "commissions_update_own" ON commissions
    FOR UPDATE USING (auth.uid() = poster_id OR auth.uid() = executor_id);

-- commission_deposits: 本人可讀
CREATE POLICY "deposits_read_own" ON commission_deposits
    FOR SELECT USING (auth.uid() = depositor_id);

-- commission_deposits: 本人可建立
CREATE POLICY "deposits_insert_own" ON commission_deposits
    FOR INSERT WITH CHECK (auth.uid() = depositor_id);

-- commission_messages: 委託參與者可讀
CREATE POLICY "messages_read_participants" ON commission_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM commissions c
            WHERE c.id = commission_id
            AND (c.poster_id = auth.uid() OR c.executor_id = auth.uid())
        )
    );

-- commission_messages: 參與者可發訊息
CREATE POLICY "messages_insert_participants" ON commission_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM commissions c
            WHERE c.id = commission_id
            AND (c.poster_id = auth.uid() OR c.executor_id = auth.uid())
        )
    );

-- ============================================================
-- 輔助函數
-- ============================================================

-- 取得當日已啟用委託數
CREATE OR REPLACE FUNCTION get_today_active_commission_count()
RETURNS INTEGER AS $$
    SELECT COUNT(*)::INTEGER
    FROM commissions
    WHERE activated_date = CURRENT_DATE
    AND status NOT IN ('cancelled');
$$ LANGUAGE SQL STABLE;

-- 取得下一個排隊位置
CREATE OR REPLACE FUNCTION get_next_queue_position()
RETURNS INTEGER AS $$
    SELECT COALESCE(MAX(queue_position), 0) + 1
    FROM commissions
    WHERE status = 'queued';
$$ LANGUAGE SQL STABLE;
