-- Global Link v2 auto-follow consumes the 30% coupon on activation.
-- Do not allow users to disable it afterward; they can only update settings.

CREATE OR REPLACE FUNCTION public.disable_auction_auto_follow(
  p_auction_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', '請先登入');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.auction_auto_follow_settings
    WHERE auction_id = p_auction_id
      AND user_id = v_user_id
      AND enabled = true
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', '自動跟標啟用後不可停用，可調整跟標金額與上限'
    );
  END IF;

  RETURN json_build_object('success', true, 'message', '自動跟標未啟用');
END;
$$;
