-- 競標系統強化：允許真實會員最低加價不限於 min_increment (改為最低 1)
-- 1. 修改 place_bid：檢查若出價者是真實用戶（profiles 存在且不是 virtual_profiles），則不受 min_increment 限制，只要大於 currentPrice 即可。

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
    v_is_virtual BOOLEAN := false;
BEGIN
    -- 檢查使用者是否已登入
    IF p_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', '請先登入');
    END IF;

    -- 判斷是否為虛擬用戶（此專案中 Cron 虛擬行為通常是用特定的機器人 ID，或者不存在於 profiles 中）
    -- 為了確認是否受到最低加價限制：
    -- 如果該 p_user_id 存在於 virtual_profiles 中，則視為虛擬用戶；
    -- 否則視為真實用戶，真實用戶最低加價限制為 1。
    SELECT EXISTS(SELECT 1 FROM virtual_profiles WHERE id = p_user_id) INTO v_is_virtual;

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
        -- 判斷加價邏輯
        IF v_is_virtual THEN
            -- 虛擬用戶必須滿足系統設定的 min_increment
            IF p_amount < v_auction.current_price + v_auction.min_increment THEN
                RETURN json_build_object('success', false, 'error', '出價需 >= ' || (v_auction.current_price + v_auction.min_increment));
            END IF;
        ELSE
            -- 真實用戶只要大於目前價格即可（最低加價 1）
            IF p_amount <= v_auction.current_price THEN
                RETURN json_build_object('success', false, 'error', '出價必須高於目前最高價 ' || v_auction.current_price);
            END IF;
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
