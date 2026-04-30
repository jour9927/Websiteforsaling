-- Final-window auto-follow guard for Global Link auction automation v2.
-- The virtual bid stream is client-side simulated, so the final real follow bid
-- is committed through this locked RPC during the final seconds.

CREATE OR REPLACE FUNCTION public.finalize_global_link_auto_follow(
  p_auction_id UUID,
  p_virtual_highest INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_auction public.auctions%ROWTYPE;
  v_setting public.auction_auto_follow_settings%ROWTYPE;
  v_session_current INTEGER := 0;
  v_session_bid_count INTEGER := 0;
  v_target_amount INTEGER;
  v_new_bid public.bids%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', '請先登入');
  END IF;

  IF p_virtual_highest IS NULL OR p_virtual_highest <= 0 THEN
    RETURN json_build_object('success', false, 'error', '虛擬最高價不正確');
  END IF;

  SELECT * INTO v_auction
  FROM public.auctions
  WHERE id = p_auction_id
  FOR UPDATE;

  IF v_auction.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', '找不到此競標');
  END IF;

  IF COALESCE(v_auction.automation_mode, 'legacy') <> 'global_link_v2' THEN
    RETURN json_build_object('success', false, 'error', '此競標未開放 Global Link v2 最終跟標');
  END IF;

  IF v_auction.status <> 'active' THEN
    RETURN json_build_object('success', false, 'error', '此競標尚未開始或已結束');
  END IF;

  IF now() > v_auction.end_time THEN
    UPDATE public.auctions
    SET status = 'ended'
    WHERE id = p_auction_id;

    RETURN json_build_object('success', false, 'error', '競標已結束');
  END IF;

  IF now() < v_auction.end_time - INTERVAL '4 seconds' THEN
    RETURN json_build_object('success', false, 'error', '尚未進入最終跟標時間');
  END IF;

  SELECT * INTO v_setting
  FROM public.auction_auto_follow_settings
  WHERE auction_id = p_auction_id
    AND user_id = v_user_id
    AND enabled = true
  FOR UPDATE;

  IF v_setting.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', '尚未啟用自動跟標');
  END IF;

  SELECT COALESCE(MAX(amount), 0), COUNT(*)::INTEGER
  INTO v_session_current, v_session_bid_count
  FROM public.bids
  WHERE auction_id = p_auction_id
    AND created_at >= v_auction.start_time;

  v_target_amount := GREATEST(
    p_virtual_highest + v_setting.follow_increment,
    v_auction.starting_price
  );

  IF v_target_amount <= v_session_current THEN
    RETURN json_build_object(
      'success', true,
      'placed', false,
      'amount', v_session_current,
      'message', '目前已高於最終跟標價'
    );
  END IF;

  IF v_target_amount > v_setting.max_bid OR v_target_amount > 100000 THEN
    RETURN json_build_object(
      'success', true,
      'placed', false,
      'amount', v_target_amount,
      'message', '最終跟標超過上限'
    );
  END IF;

  INSERT INTO public.bids (auction_id, user_id, amount)
  VALUES (p_auction_id, v_user_id, v_target_amount)
  RETURNING * INTO v_new_bid;

  UPDATE public.auctions
  SET current_price = v_target_amount,
      current_bidder_id = v_user_id,
      bid_count = v_session_bid_count + 1
  WHERE id = p_auction_id;

  RETURN json_build_object(
    'success', true,
    'placed', true,
    'bid_id', v_new_bid.id,
    'amount', v_target_amount,
    'message', '已於最後一刻自動跟標'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.finalize_global_link_auto_follow(UUID, INTEGER) TO authenticated;
