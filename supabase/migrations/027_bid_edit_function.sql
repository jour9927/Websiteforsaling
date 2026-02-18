-- 管理員編輯出價金額功能
-- 此遷移添加管理員更新出價金額的函數和權限

-- ============================================
-- 1. 管理員更新出價金額函數
-- ============================================
CREATE OR REPLACE FUNCTION admin_update_bid_amount(
    p_bid_id UUID,
    p_new_amount INTEGER,
    p_admin_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_auction_id UUID;
    v_old_amount INTEGER;
    v_max_bid RECORD;
BEGIN
    -- 1. 檢查管理員權限
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = p_admin_user_id AND role = 'admin'
    ) THEN
        RETURN json_build_object(
            'success', false, 
            'error', '需要管理員權限才能編輯出價'
        );
    END IF;

    -- 2. 檢查出價是否存在並取得相關資訊
    SELECT auction_id, amount 
    INTO v_auction_id, v_old_amount
    FROM bids 
    WHERE id = p_bid_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'error', '找不到此出價記錄'
        );
    END IF;

    -- 3. 驗證新金額必須為正數
    IF p_new_amount <= 0 THEN
        RETURN json_build_object(
            'success', false, 
            'error', '出價金額必須大於 0'
        );
    END IF;

    -- 4. 更新出價金額
    UPDATE bids 
    SET amount = p_new_amount
    WHERE id = p_bid_id;

    -- 5. 重新計算該競標的最高價和最高出價者
    SELECT 
        MAX(amount) as max_amount,
        user_id as top_bidder_id
    INTO v_max_bid
    FROM bids
    WHERE auction_id = v_auction_id
    GROUP BY user_id
    ORDER BY MAX(amount) DESC
    LIMIT 1;

    -- 6. 更新競標的 current_price 和 current_bidder_id
    IF v_max_bid IS NOT NULL THEN
        UPDATE auctions
        SET 
            current_price = v_max_bid.max_amount,
            current_bidder_id = v_max_bid.top_bidder_id,
            updated_at = NOW()
        WHERE id = v_auction_id;
    ELSE
        -- 如果沒有任何出價（理論上不應該發生），重置為 0
        UPDATE auctions
        SET 
            current_price = 0,
            current_bidder_id = NULL,
            updated_at = NOW()
        WHERE id = v_auction_id;
    END IF;

    -- 7. 返回成功結果
    RETURN json_build_object(
        'success', true,
        'bid_id', p_bid_id,
        'old_amount', v_old_amount,
        'new_amount', p_new_amount,
        'auction_id', v_auction_id,
        'auction_current_price', v_max_bid.max_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. 添加 RLS 政策允許管理員更新出價
-- ============================================
CREATE POLICY "bids_update_admin" ON bids
    FOR UPDATE
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE role = 'admin'
    ));

-- ============================================
-- 3. 註釋
-- ============================================
COMMENT ON FUNCTION admin_update_bid_amount IS '管理員更新出價金額並自動重新計算競標最高價';
