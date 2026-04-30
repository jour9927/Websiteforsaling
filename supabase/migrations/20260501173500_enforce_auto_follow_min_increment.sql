-- Enforce Global Link v2 auto-follow increments to start at 1.

UPDATE public.auction_auto_follow_settings
SET follow_increment = 1,
    updated_at = now()
WHERE follow_increment < 1;

ALTER TABLE public.auction_auto_follow_settings
  ALTER COLUMN follow_increment SET DEFAULT 70;

ALTER TABLE public.auction_auto_follow_settings
  DROP CONSTRAINT IF EXISTS auction_auto_follow_settings_follow_increment_check;

ALTER TABLE public.auction_auto_follow_settings
  ADD CONSTRAINT auction_auto_follow_settings_follow_increment_check
  CHECK (follow_increment >= 1 AND follow_increment <= 10000);

CREATE OR REPLACE FUNCTION public.configure_auction_auto_follow(
  p_auction_id UUID,
  p_follow_increment INTEGER,
  p_max_bid INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_auction public.auctions%ROWTYPE;
  v_existing public.auction_auto_follow_settings%ROWTYPE;
  v_coupon_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', '請先登入');
  END IF;

  IF p_follow_increment < 1 OR p_follow_increment > 10000 THEN
    RETURN json_build_object('success', false, 'error', '跟標加價設定不正確');
  END IF;

  IF p_max_bid <= 0 THEN
    RETURN json_build_object('success', false, 'error', '跟標上限設定不正確');
  END IF;

  SELECT * INTO v_auction
  FROM public.auctions
  WHERE id = p_auction_id;

  IF v_auction.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', '找不到此競標');
  END IF;

  IF v_auction.automation_mode <> 'global_link_v2' THEN
    RETURN json_build_object('success', false, 'error', '此競標未開放 Global Link v2 自動跟標');
  END IF;

  SELECT * INTO v_existing
  FROM public.auction_auto_follow_settings
  WHERE auction_id = p_auction_id
    AND user_id = v_user_id
  FOR UPDATE;

  IF v_existing.id IS NULL THEN
    SELECT id INTO v_coupon_id
    FROM public.backpack_items
    WHERE user_id = v_user_id
      AND item_type = 'auction_fee_rebate_30'
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE;

    IF v_coupon_id IS NULL THEN
      RETURN json_build_object('success', false, 'error', '未持有可用的 30% 競標抵用券');
    END IF;

    UPDATE public.backpack_items
    SET is_active = false,
        note = trim(both ' ' FROM concat(coalesce(note, ''), ' 已用於 Global Link v2 自動跟標'))
    WHERE id = v_coupon_id;
  ELSE
    v_coupon_id := v_existing.backpack_item_id;
  END IF;

  INSERT INTO public.auction_auto_follow_settings (
    auction_id,
    user_id,
    backpack_item_id,
    enabled,
    follow_increment,
    max_bid,
    updated_at
  )
  VALUES (
    p_auction_id,
    v_user_id,
    v_coupon_id,
    true,
    p_follow_increment,
    p_max_bid,
    now()
  )
  ON CONFLICT (auction_id, user_id) DO UPDATE
  SET enabled = true,
      follow_increment = EXCLUDED.follow_increment,
      max_bid = EXCLUDED.max_bid,
      updated_at = now();

  RETURN json_build_object('success', true, 'message', '自動跟標已啟用');
END;
$$;
