CREATE TABLE IF NOT EXISTS public.game_name_reward_balances (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  available_points INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT game_name_reward_available_points_range CHECK (available_points >= 0 AND available_points <= 10),
  CONSTRAINT game_name_reward_lifetime_points_range CHECK (lifetime_points >= 0 AND lifetime_points <= 10),
  CONSTRAINT game_name_reward_available_not_above_lifetime CHECK (available_points <= lifetime_points)
);

CREATE TABLE IF NOT EXISTS public.game_name_reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_key TEXT NOT NULL,
  item_type TEXT NOT NULL,
  item_name TEXT NOT NULL,
  cost_points INTEGER NOT NULL CHECK (cost_points BETWEEN 1 AND 10),
  discount_percent INTEGER NOT NULL CHECK (discount_percent BETWEEN 1 AND 90),
  backpack_item_id UUID REFERENCES public.backpack_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_name_reward_redemptions_user_id
  ON public.game_name_reward_redemptions(user_id);

CREATE INDEX IF NOT EXISTS idx_game_name_reward_redemptions_created_at
  ON public.game_name_reward_redemptions(created_at DESC);

ALTER TABLE public.game_name_reward_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_name_reward_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own game name reward balance" ON public.game_name_reward_balances;
CREATE POLICY "Users can view own game name reward balance"
ON public.game_name_reward_balances
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can manage game name reward balances" ON public.game_name_reward_balances;
CREATE POLICY "Admins can manage game name reward balances"
ON public.game_name_reward_balances
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Users can view own game name reward redemptions" ON public.game_name_reward_redemptions;
CREATE POLICY "Users can view own game name reward redemptions"
ON public.game_name_reward_redemptions
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can manage game name reward redemptions" ON public.game_name_reward_redemptions;
CREATE POLICY "Admins can manage game name reward redemptions"
ON public.game_name_reward_redemptions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

ALTER TABLE public.backpack_items
  DROP CONSTRAINT IF EXISTS backpack_items_item_type_check;

ALTER TABLE public.backpack_items
  ADD CONSTRAINT backpack_items_item_type_check
  CHECK (
    item_type IN (
      'blindbox_discount_500',
      'blindbox_discount_1000',
      'blindbox_discount_2000',
      'blindbox_discount_5000',
      'auction_fee_rebate_30',
      'auction_fee_rebate_40',
      'pokemon_choice_5',
      'store_rebate_5',
      'store_rebate_10',
      'store_rebate_20',
      'store_rebate_30',
      'store_rebate_40',
      'store_rebate_50',
      'store_rebate_60',
      'store_rebate_70',
      'store_rebate_80',
      'store_rebate_90'
    )
  );

INSERT INTO public.game_name_reward_balances (user_id, available_points, lifetime_points)
SELECT
  id,
  LEAST(COALESCE(array_length(owned_games, 1), 0), 10),
  LEAST(COALESCE(array_length(owned_games, 1), 0), 10)
FROM public.profiles
WHERE COALESCE(array_length(owned_games, 1), 0) > 0
ON CONFLICT (user_id) DO UPDATE
SET
  available_points = GREATEST(
    public.game_name_reward_balances.available_points,
    EXCLUDED.available_points
  ),
  lifetime_points = GREATEST(
    public.game_name_reward_balances.lifetime_points,
    EXCLUDED.lifetime_points
  ),
  updated_at = now();

CREATE OR REPLACE FUNCTION public.grant_game_name_reward_points(
  p_user_id UUID,
  p_points INTEGER DEFAULT 1
)
RETURNS TABLE (
  available_points INTEGER,
  lifetime_points INTEGER,
  granted_points INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available_points INTEGER;
  v_lifetime_points INTEGER;
  v_requested_points INTEGER;
  v_granted_points INTEGER;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'MISSING_USER_ID';
  END IF;

  v_requested_points := GREATEST(COALESCE(p_points, 0), 0);

  INSERT INTO public.game_name_reward_balances (user_id, available_points, lifetime_points)
  VALUES (p_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT b.available_points, b.lifetime_points
  INTO v_available_points, v_lifetime_points
  FROM public.game_name_reward_balances b
  WHERE b.user_id = p_user_id
  FOR UPDATE;

  v_granted_points := LEAST(v_requested_points, GREATEST(10 - v_lifetime_points, 0));

  UPDATE public.game_name_reward_balances
  SET
    available_points = LEAST(available_points + v_granted_points, 10),
    lifetime_points = LEAST(lifetime_points + v_granted_points, 10),
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING game_name_reward_balances.available_points,
    game_name_reward_balances.lifetime_points
  INTO v_available_points, v_lifetime_points;

  RETURN QUERY SELECT v_available_points, v_lifetime_points, v_granted_points;
END;
$$;

CREATE OR REPLACE FUNCTION public.redeem_game_name_reward_coupon(
  p_user_id UUID,
  p_reward_key TEXT,
  p_item_type TEXT,
  p_item_name TEXT,
  p_cost_points INTEGER,
  p_discount_percent INTEGER
)
RETURNS TABLE (
  backpack_item_id UUID,
  remaining_points INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available_points INTEGER;
  v_expected_discount INTEGER;
  v_backpack_item_id UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'MISSING_USER_ID';
  END IF;

  v_expected_discount := CASE p_cost_points
    WHEN 1 THEN 5
    WHEN 2 THEN 10
    WHEN 3 THEN 20
    WHEN 4 THEN 30
    WHEN 5 THEN 40
    WHEN 6 THEN 50
    WHEN 7 THEN 60
    WHEN 8 THEN 70
    WHEN 9 THEN 80
    WHEN 10 THEN 90
    ELSE NULL
  END;

  IF v_expected_discount IS NULL
    OR v_expected_discount <> p_discount_percent
    OR p_reward_key <> ('store_rebate_' || p_discount_percent::TEXT)
    OR p_item_type <> ('store_rebate_' || p_discount_percent::TEXT)
  THEN
    RAISE EXCEPTION 'INVALID_GAME_REWARD_COUPON';
  END IF;

  INSERT INTO public.game_name_reward_balances (user_id, available_points, lifetime_points)
  VALUES (p_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT b.available_points
  INTO v_available_points
  FROM public.game_name_reward_balances b
  WHERE b.user_id = p_user_id
  FOR UPDATE;

  IF v_available_points < p_cost_points THEN
    RAISE EXCEPTION 'INSUFFICIENT_GAME_REWARD_POINTS';
  END IF;

  UPDATE public.game_name_reward_balances
  SET
    available_points = available_points - p_cost_points,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING game_name_reward_balances.available_points
  INTO v_available_points;

  INSERT INTO public.backpack_items (
    user_id,
    item_type,
    item_name,
    note,
    is_active,
    created_at,
    expires_at
  )
  VALUES (
    p_user_id,
    p_item_type,
    p_item_name,
    format(
      '遊戲名稱登記獎勵兌換：%s 點兌換，商店消費最高報銷 %s%%。',
      p_cost_points,
      p_discount_percent
    ),
    true,
    now(),
    now() + interval '50 years'
  )
  RETURNING id INTO v_backpack_item_id;

  INSERT INTO public.game_name_reward_redemptions (
    user_id,
    reward_key,
    item_type,
    item_name,
    cost_points,
    discount_percent,
    backpack_item_id
  )
  VALUES (
    p_user_id,
    p_reward_key,
    p_item_type,
    p_item_name,
    p_cost_points,
    p_discount_percent,
    v_backpack_item_id
  );

  RETURN QUERY SELECT v_backpack_item_id, v_available_points;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_game_name_reward_points(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.redeem_game_name_reward_coupon(UUID, TEXT, TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.grant_game_name_reward_points(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.redeem_game_name_reward_coupon(UUID, TEXT, TEXT, TEXT, INTEGER, INTEGER) TO service_role;

COMMENT ON TABLE public.game_name_reward_balances IS '遊戲名稱/版本登記獎勵點餘額；兌換用，不與 fortune_points 混用。';
COMMENT ON TABLE public.game_name_reward_redemptions IS '遊戲名稱獎勵點兌換紀錄。';
