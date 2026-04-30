-- Disable anti-snipe time extension for Global Link auction automation v2.
-- Legacy auctions keep the original last-minute extension behavior.

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
    v_session_current INTEGER := 0;
    v_session_bid_count INTEGER := 0;
BEGIN
    IF p_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', '請先登入');
    END IF;

    SELECT EXISTS(SELECT 1 FROM virtual_profiles WHERE id = p_user_id) INTO v_is_virtual;

    SELECT * INTO v_auction FROM auctions WHERE id = p_auction_id FOR UPDATE;

    IF v_auction IS NULL THEN
        RETURN json_build_object('success', false, 'error', '找不到此競標');
    END IF;

    IF v_auction.status != 'active' THEN
        RETURN json_build_object('success', false, 'error', '此競標尚未開始或已結束');
    END IF;

    IF v_auction.end_time < NOW() THEN
        UPDATE auctions SET status = 'ended' WHERE id = p_auction_id;
        RETURN json_build_object('success', false, 'error', '競標已結束');
    END IF;

    SELECT COALESCE(MAX(amount), 0), COUNT(*)::INTEGER
    INTO v_session_current, v_session_bid_count
    FROM bids
    WHERE auction_id = p_auction_id
      AND created_at >= v_auction.start_time;

    IF v_session_current = 0 THEN
        IF p_amount < v_auction.starting_price THEN
            RETURN json_build_object('success', false, 'error', '出價需 >= 起標價 ' || v_auction.starting_price);
        END IF;
    ELSE
        IF v_is_virtual THEN
            IF p_amount < v_session_current + v_auction.min_increment THEN
                RETURN json_build_object('success', false, 'error', '出價需 >= ' || (v_session_current + v_auction.min_increment));
            END IF;
        ELSE
            IF p_amount <= v_session_current THEN
                RETURN json_build_object('success', false, 'error', '出價必須高於目前最高價 ' || v_session_current);
            END IF;
        END IF;
    END IF;

    INSERT INTO bids (auction_id, user_id, amount)
    VALUES (p_auction_id, p_user_id, p_amount)
    RETURNING * INTO v_new_bid;

    v_time_remaining := v_auction.end_time - NOW();
    IF COALESCE(v_auction.automation_mode, 'legacy') <> 'global_link_v2'
       AND v_time_remaining < INTERVAL '60 seconds' THEN
        UPDATE auctions
        SET end_time = end_time + INTERVAL '2 minutes',
            current_price = p_amount,
            current_bidder_id = p_user_id,
            bid_count = v_session_bid_count + 1
        WHERE id = p_auction_id;
        v_extended = true;
    ELSE
        UPDATE auctions
        SET current_price = p_amount,
            current_bidder_id = p_user_id,
            bid_count = v_session_bid_count + 1
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
