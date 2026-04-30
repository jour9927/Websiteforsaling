-- Global Link Eeveelution auction automation v2.
-- This keeps the legacy auction automation path intact and marks the new path explicitly.

ALTER TABLE public.auctions
  ADD COLUMN IF NOT EXISTS automation_mode TEXT NOT NULL DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS automation_disclosure TEXT,
  ADD COLUMN IF NOT EXISTS automation_target_min INTEGER NOT NULL DEFAULT 35000,
  ADD COLUMN IF NOT EXISTS automation_target_max INTEGER NOT NULL DEFAULT 40000,
  ADD COLUMN IF NOT EXISTS automation_stop_seconds INTEGER NOT NULL DEFAULT 30;

ALTER TABLE public.auctions DROP CONSTRAINT IF EXISTS auctions_automation_mode_check;
ALTER TABLE public.auctions
  ADD CONSTRAINT auctions_automation_mode_check
  CHECK (automation_mode IN ('legacy', 'global_link_v2'));

ALTER TABLE public.auctions DROP CONSTRAINT IF EXISTS auctions_automation_target_check;
ALTER TABLE public.auctions
  ADD CONSTRAINT auctions_automation_target_check
  CHECK (automation_target_min > 0 AND automation_target_max >= automation_target_min);

ALTER TABLE public.auctions DROP CONSTRAINT IF EXISTS auctions_automation_stop_seconds_check;
ALTER TABLE public.auctions
  ADD CONSTRAINT auctions_automation_stop_seconds_check
  CHECK (automation_stop_seconds BETWEEN 0 AND 300);

CREATE INDEX IF NOT EXISTS idx_auctions_automation_mode
  ON public.auctions(automation_mode);

ALTER TABLE public.backpack_items
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.auction_auto_follow_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  backpack_item_id UUID REFERENCES public.backpack_items(id) ON DELETE SET NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  follow_increment INTEGER NOT NULL DEFAULT 70 CHECK (follow_increment >= 1 AND follow_increment <= 10000),
  max_bid INTEGER NOT NULL CHECK (max_bid > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (auction_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_auction_auto_follow_settings_user
  ON public.auction_auto_follow_settings(user_id, enabled);

ALTER TABLE public.auction_auto_follow_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own auction auto follow settings"
  ON public.auction_auto_follow_settings;
CREATE POLICY "Users can view their own auction auto follow settings"
ON public.auction_auto_follow_settings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all auction auto follow settings"
  ON public.auction_auto_follow_settings;
CREATE POLICY "Admins can view all auction auto follow settings"
ON public.auction_auto_follow_settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE TABLE IF NOT EXISTS public.auction_automation_v2_schedule_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_family TEXT NOT NULL DEFAULT 'global_link_eeveelution',
  local_start_time TIME NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Taipei',
  max_per_day INTEGER NOT NULL DEFAULT 2 CHECK (max_per_day = 2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (auction_family, local_start_time, timezone)
);

INSERT INTO public.auction_automation_v2_schedule_slots (auction_family, local_start_time, timezone, max_per_day)
VALUES
  ('global_link_eeveelution', TIME '13:00', 'Asia/Taipei', 2),
  ('global_link_eeveelution', TIME '19:00', 'Asia/Taipei', 2)
ON CONFLICT (auction_family, local_start_time, timezone) DO UPDATE
SET is_active = true,
    max_per_day = 2;

UPDATE public.auctions a
SET automation_mode = 'global_link_v2',
    automation_disclosure = 'Global Link v2 uses a disclosed reserve-price pacing track. Coupon auto-follow requires explicit user opt-in and a maximum bid cap.',
    automation_target_min = 35000,
    automation_target_max = 40000,
    automation_stop_seconds = 3
FROM public.distributions d
WHERE a.distribution_id = d.id
  AND COALESCE(d.pokemon_name_en, '') NOT IN ('Leafeon', 'Glaceon')
  AND COALESCE(d.pokemon_name, '') NOT IN ('葉伊布', '冰伊布')
  AND (
    d.event_name ILIKE '%Global Link%'
    OR d.trainer_id IN ('PGL2010LAB', 'PGL2011BF', 'PGL2011KR')
  );

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

  UPDATE public.auction_auto_follow_settings
  SET enabled = false,
      updated_at = now()
  WHERE auction_id = p_auction_id
    AND user_id = v_user_id;

  RETURN json_build_object('success', true, 'message', '自動跟標已停用');
END;
$$;
