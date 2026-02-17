-- 競標系統強化：Anti-Snipe 延長 + 開放出價權限
-- 1. 修改 bids RLS：允許所有已登入用戶出價
-- 2. 修改 place_bid：移除角色檢查 + Anti-Snipe 延長

-- ============================================
-- 1. 修改 bids INSERT RLS 政策
-- ============================================
DROP POLICY IF EXISTS "bids_insert_member" ON bids;
DROP POLICY IF EXISTS "bids_insert_authenticated" ON bids;

CREATE POLICY "bids_insert_authenticated" ON bids
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- 2. 修改 place_bid 函數
--    - 移除 member 角色限制
--    - 加入 Anti-Snipe：最後 60 秒出價延長 2 分鐘
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
    v_time_remaining INTERVAL;
    v_extended BOOLEAN := false;
BEGIN
    -- 檢查使用者是否已登入（不限制角色）
    IF p_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', '請先登入');
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
        IF p_amount < v_auction.starting_price THEN
            RETURN json_build_object('success', false, 'error', '出價需 >= 起標價 ' || v_auction.starting_price);
        END IF;
    ELSE
        IF p_amount < v_auction.current_price + v_auction.min_increment THEN
            RETURN json_build_object('success', false, 'error', '出價需 >= ' || (v_auction.current_price + v_auction.min_increment));
        END IF;
    END IF;

    -- 新增出價紀錄
    INSERT INTO bids (auction_id, user_id, amount)
    VALUES (p_auction_id, p_user_id, p_amount)
    RETURNING * INTO v_new_bid;

    -- Anti-Snipe：最後 60 秒出價自動延長 2 分鐘
    v_time_remaining := v_auction.end_time - NOW();
    IF v_time_remaining < INTERVAL '60 seconds' THEN
        UPDATE auctions
        SET end_time = end_time + INTERVAL '2 minutes',
            current_price = p_amount,
            current_bidder_id = p_user_id,
            bid_count = bid_count + 1
        WHERE id = p_auction_id;
        v_extended = true;
    ELSE
        -- 一般更新
        UPDATE auctions
        SET current_price = p_amount,
            current_bidder_id = p_user_id,
            bid_count = bid_count + 1
        WHERE id = p_auction_id;
    END IF;

    RETURN json_build_object(
        'success', true,
        'bid_id', v_new_bid.id,
        'amount', p_amount,
        'extended', v_extended
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
