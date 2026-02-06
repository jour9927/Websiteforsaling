-- 競標系統資料庫遷移
-- 新增 member 角色、競標表、出價紀錄表

-- ============================================
-- 1. 新增 member 角色到 user_role ENUM
-- ============================================
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'member';

-- ============================================
-- 2. 建立競標商品表
-- ============================================
CREATE TABLE IF NOT EXISTS auctions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    distribution_id UUID REFERENCES distributions(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    starting_price INTEGER NOT NULL DEFAULT 100,
    min_increment INTEGER NOT NULL DEFAULT 100,
    current_price INTEGER NOT NULL DEFAULT 0,
    current_bidder_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'ended', 'cancelled')),
    bid_count INTEGER NOT NULL DEFAULT 0,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- 3. 建立出價紀錄表
-- ============================================
CREATE TABLE IF NOT EXISTS bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- 4. 建立索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_end_time ON auctions(end_time);
CREATE INDEX IF NOT EXISTS idx_auctions_distribution ON auctions(distribution_id);
CREATE INDEX IF NOT EXISTS idx_bids_auction ON bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_bids_user ON bids(user_id);

-- ============================================
-- 5. 更新時間觸發器
-- ============================================
CREATE TRIGGER update_auctions_updated_at BEFORE UPDATE ON auctions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. 開啟 RLS
-- ============================================
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. Auctions RLS 政策
-- ============================================

-- 所有人可檢視 active 與 ended 狀態的競標
CREATE POLICY "auctions_select_public" ON auctions
    FOR SELECT
    USING (status IN ('active', 'ended') OR auth.uid() IN (
        SELECT id FROM profiles WHERE role = 'admin'
    ));

-- 管理員可新增競標
CREATE POLICY "auctions_insert_admin" ON auctions
    FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT id FROM profiles WHERE role = 'admin'
    ));

-- 管理員可更新競標
CREATE POLICY "auctions_update_admin" ON auctions
    FOR UPDATE
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE role = 'admin'
    ));

-- 管理員可刪除競標
CREATE POLICY "auctions_delete_admin" ON auctions
    FOR DELETE
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE role = 'admin'
    ));

-- ============================================
-- 8. Bids RLS 政策
-- ============================================

-- 所有人可檢視出價紀錄
CREATE POLICY "bids_select_public" ON bids
    FOR SELECT
    USING (true);

-- 群內成員 (member) 或管理員可出價
CREATE POLICY "bids_insert_member" ON bids
    FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT id FROM profiles WHERE role IN ('member', 'admin')
    ));

-- ============================================
-- 9. 輔助函數：檢查使用者是否為群內成員
-- ============================================
CREATE OR REPLACE FUNCTION is_member_or_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = user_id AND role IN ('member', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. 出價處理函數
-- ============================================
CREATE OR REPLACE FUNCTION place_bid(
    p_auction_id UUID,
    p_user_id UUID,
    p_amount INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_auction auctions%ROWTYPE;
    v_new_bid bids%ROWTYPE;
BEGIN
    -- 檢查使用者權限
    IF NOT is_member_or_admin(p_user_id) THEN
        RETURN json_build_object('success', false, 'error', '需要群內成員資格才能出價');
    END IF;

    -- 取得競標資訊並鎖定
    SELECT * INTO v_auction FROM auctions WHERE id = p_auction_id FOR UPDATE;

    IF v_auction IS NULL THEN
        RETURN json_build_object('success', false, 'error', '找不到此競標');
    END IF;

    -- 檢查競標狀態
    IF v_auction.status != 'active' THEN
        RETURN json_build_object('success', false, 'error', '此競標尚未開始或已結束');
    END IF;

    -- 檢查是否已過期
    IF v_auction.end_time < NOW() THEN
        UPDATE auctions SET status = 'ended' WHERE id = p_auction_id;
        RETURN json_build_object('success', false, 'error', '競標已結束');
    END IF;

    -- 檢查出價金額
    IF v_auction.current_price = 0 THEN
        -- 首次出價，需 >= 起標價
        IF p_amount < v_auction.starting_price THEN
            RETURN json_build_object('success', false, 'error', '出價需 >= 起標價 ' || v_auction.starting_price);
        END IF;
    ELSE
        -- 非首次出價，需 >= 目前最高價 + 最低加價
        IF p_amount < v_auction.current_price + v_auction.min_increment THEN
            RETURN json_build_object('success', false, 'error', '出價需 >= ' || (v_auction.current_price + v_auction.min_increment));
        END IF;
    END IF;

    -- 新增出價紀錄
    INSERT INTO bids (auction_id, user_id, amount)
    VALUES (p_auction_id, p_user_id, p_amount)
    RETURNING * INTO v_new_bid;

    -- 更新競標資訊
    UPDATE auctions
    SET current_price = p_amount,
        current_bidder_id = p_user_id,
        bid_count = bid_count + 1
    WHERE id = p_auction_id;

    RETURN json_build_object(
        'success', true,
        'bid_id', v_new_bid.id,
        'amount', p_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
