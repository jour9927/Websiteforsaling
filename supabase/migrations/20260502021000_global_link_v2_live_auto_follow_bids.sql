-- Global Link v2 auto-follow should write real bids during the live virtual
-- bidding rhythm, not only at final settlement.

CREATE OR REPLACE FUNCTION public.place_global_link_auto_follow_bid(
  p_auction_id UUID,
  p_virtual_amount INTEGER,
  p_virtual_bid_id TEXT DEFAULT NULL,
  p_virtual_bid_at TIMESTAMPTZ DEFAULT NULL
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
  v_base_amount INTEGER := 0;
  v_target_amount INTEGER;
  v_new_bid public.bids%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', '請先登入');
  END IF;

  IF p_virtual_amount IS NULL OR p_virtual_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', '虛擬出價金額不正確');
  END IF;

  SELECT * INTO v_auction
  FROM public.auctions
  WHERE id = p_auction_id
  FOR UPDATE;

  IF v_auction.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', '找不到此競標');
  END IF;

  IF COALESCE(v_auction.automation_mode, 'legacy') <> 'global_link_v2' THEN
    RETURN json_build_object('success', false, 'error', '此競標未開放 Global Link v2 自動跟標');
  END IF;

  IF v_auction.status <> 'active' OR now() >= v_auction.end_time THEN
    RETURN json_build_object('success', false, 'error', '競標已結束');
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

  SELECT COALESCE(MAX(amount), 0), COUNT(*)
  INTO v_session_current, v_session_bid_count
  FROM public.bids
  WHERE auction_id = p_auction_id
    AND created_at >= v_auction.start_time;

  v_base_amount := GREATEST(
    COALESCE(v_session_current, 0),
    p_virtual_amount,
    COALESCE(v_auction.starting_price, 0)
  );

  v_target_amount := v_base_amount + GREATEST(COALESCE(v_setting.follow_increment, 1), 1);

  IF v_target_amount <= COALESCE(v_session_current, 0) THEN
    RETURN json_build_object(
      'success', true,
      'placed', false,
      'amount', v_session_current,
      'message', '目前價格不需要跟標'
    );
  END IF;

  IF v_target_amount > LEAST(COALESCE(v_setting.max_bid, 100000), 100000) THEN
    RETURN json_build_object(
      'success', true,
      'placed', false,
      'amount', v_session_current,
      'message', '已達自動跟標內部上限'
    );
  END IF;

  INSERT INTO public.bids (auction_id, user_id, amount, created_at)
  VALUES (p_auction_id, v_user_id, v_target_amount, now())
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
    'virtual_amount', p_virtual_amount,
    'virtual_bid_id', p_virtual_bid_id,
    'virtual_bid_at', p_virtual_bid_at,
    'message', '自動跟標已寫入實際競標'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_global_link_auto_follow_bid(UUID, INTEGER, TEXT, TIMESTAMPTZ) TO authenticated;
