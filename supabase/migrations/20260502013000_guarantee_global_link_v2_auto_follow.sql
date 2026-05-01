-- Make Global Link v2 final auto-follow authoritative on the backend.
-- Real users who enabled the 30% coupon auto-follow should beat the v2 virtual
-- bidding track at settlement time, up to the internal 100000 cap.

ALTER TABLE public.auctions
  DROP CONSTRAINT IF EXISTS auctions_global_link_v2_stop_seconds_check;

ALTER TABLE public.auctions
  ADD CONSTRAINT auctions_global_link_v2_stop_seconds_check
  CHECK (automation_mode <> 'global_link_v2' OR automation_stop_seconds = 1)
  NOT VALID;

UPDATE public.auctions
SET automation_stop_seconds = 1
WHERE automation_mode = 'global_link_v2'
  AND COALESCE(automation_stop_seconds, 1) <> 1;

ALTER TABLE public.auctions
  VALIDATE CONSTRAINT auctions_global_link_v2_stop_seconds_check;

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
  v_base_amount INTEGER := 0;
  v_target_amount INTEGER;
  v_bid_created_at TIMESTAMPTZ;
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

  IF now() < v_auction.end_time - INTERVAL '1 second' THEN
    RETURN json_build_object('success', false, 'error', '尚未進入最終跟標時間');
  END IF;

  SELECT *
  INTO v_setting
  FROM public.auction_auto_follow_settings
  WHERE auction_id = p_auction_id
    AND user_id = v_user_id
    AND enabled = true
  LIMIT 1
  FOR UPDATE;

  IF v_setting.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', '尚未啟用自動跟標');
  END IF;

  SELECT COALESCE(MAX(amount), 0), COUNT(*)::INTEGER
  INTO v_session_current, v_session_bid_count
  FROM public.bids
  WHERE auction_id = p_auction_id
    AND created_at >= v_auction.start_time;

  v_base_amount := GREATEST(
    v_session_current,
    p_virtual_highest,
    COALESCE(v_auction.starting_price, 0)
  );
  v_target_amount := GREATEST(
    v_base_amount + GREATEST(COALESCE(v_setting.follow_increment, 1), 1),
    COALESCE(v_auction.starting_price, 0)
  );

  IF v_target_amount > 100000 THEN
    RETURN json_build_object(
      'success', false,
      'error', '已達內部跟標上限',
      'amount', v_base_amount
    );
  END IF;

  v_bid_created_at := CASE
    WHEN now() <= v_auction.end_time THEN now()
    ELSE v_auction.end_time - INTERVAL '1 millisecond'
  END;

  INSERT INTO public.bids (auction_id, user_id, amount, created_at)
  VALUES (p_auction_id, v_user_id, v_target_amount, v_bid_created_at)
  RETURNING * INTO v_new_bid;

  UPDATE public.auctions
  SET current_price = v_target_amount,
      current_bidder_id = v_user_id,
      bid_count = v_session_bid_count + 1,
      status = CASE WHEN now() >= end_time THEN 'ended' ELSE status END
  WHERE id = p_auction_id;

  RETURN json_build_object(
    'success', true,
    'placed', true,
    'bid_id', v_new_bid.id,
    'user_id', v_user_id,
    'amount', v_target_amount,
    'message', '已完成最後一刻自動跟標'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_global_link_auto_follow_system(
  p_auction_id UUID,
  p_virtual_highest INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auction public.auctions%ROWTYPE;
  v_setting public.auction_auto_follow_settings%ROWTYPE;
  v_session_current INTEGER := 0;
  v_session_bid_count INTEGER := 0;
  v_base_amount INTEGER := 0;
  v_target_amount INTEGER;
  v_bid_created_at TIMESTAMPTZ;
  v_new_bid public.bids%ROWTYPE;
BEGIN
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
    RETURN json_build_object('success', true, 'placed', false, 'message', '競標不是進行中');
  END IF;

  IF now() < v_auction.end_time - INTERVAL '1 second' THEN
    RETURN json_build_object('success', false, 'error', '尚未進入後端結算時間');
  END IF;

  SELECT COALESCE(MAX(amount), 0), COUNT(*)::INTEGER
  INTO v_session_current, v_session_bid_count
  FROM public.bids
  WHERE auction_id = p_auction_id
    AND created_at >= v_auction.start_time;

  v_base_amount := GREATEST(
    v_session_current,
    p_virtual_highest,
    COALESCE(v_auction.starting_price, 0)
  );

  SELECT *
  INTO v_setting
  FROM public.auction_auto_follow_settings s
  WHERE s.auction_id = p_auction_id
    AND s.enabled = true
    AND GREATEST(
      v_base_amount + GREATEST(COALESCE(s.follow_increment, 1), 1),
      COALESCE(v_auction.starting_price, 0)
    ) <= 100000
  ORDER BY GREATEST(
             v_base_amount + GREATEST(COALESCE(s.follow_increment, 1), 1),
             COALESCE(v_auction.starting_price, 0)
           ) DESC,
           s.follow_increment DESC,
           s.created_at ASC
  LIMIT 1
  FOR UPDATE;

  IF v_setting.id IS NULL THEN
    IF now() >= v_auction.end_time THEN
      UPDATE public.auctions
      SET status = 'ended'
      WHERE id = p_auction_id;
    END IF;

    RETURN json_build_object(
      'success', true,
      'placed', false,
      'amount', v_base_amount,
      'message', '沒有符合條件的自動跟標用戶'
    );
  END IF;

  v_target_amount := GREATEST(
    v_base_amount + GREATEST(COALESCE(v_setting.follow_increment, 1), 1),
    COALESCE(v_auction.starting_price, 0)
  );

  v_bid_created_at := CASE
    WHEN now() <= v_auction.end_time THEN now()
    ELSE v_auction.end_time - INTERVAL '1 millisecond'
  END;

  INSERT INTO public.bids (auction_id, user_id, amount, created_at)
  VALUES (p_auction_id, v_setting.user_id, v_target_amount, v_bid_created_at)
  RETURNING * INTO v_new_bid;

  UPDATE public.auctions
  SET current_price = v_target_amount,
      current_bidder_id = v_setting.user_id,
      bid_count = v_session_bid_count + 1,
      status = CASE WHEN now() >= end_time THEN 'ended' ELSE status END
  WHERE id = p_auction_id;

  RETURN json_build_object(
    'success', true,
    'placed', true,
    'bid_id', v_new_bid.id,
    'user_id', v_setting.user_id,
    'amount', v_target_amount,
    'message', '後端已完成 Global Link v2 最終跟標'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.finalize_global_link_auto_follow(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_global_link_auto_follow_system(UUID, INTEGER) TO service_role;
