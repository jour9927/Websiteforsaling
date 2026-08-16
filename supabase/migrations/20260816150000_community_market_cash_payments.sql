-- 民間交易改為新台幣人工匯款。
-- 出價不再扣站內點數；得標後先進入待付款，賣家或管理員確認收款才轉移收藏。

ALTER TABLE public.community_auctions
  DROP CONSTRAINT IF EXISTS community_auctions_status_check;
ALTER TABLE public.community_auctions
  ADD CONSTRAINT community_auctions_status_check
  CHECK (status IN ('active', 'pending_payment', 'sold', 'ended', 'cancelled'));

-- 上一版 active 最高出價曾扣住點數；切換現金制時一次全數退還。
WITH held AS (
  SELECT current_bidder_id AS user_id, SUM(current_price)::INTEGER AS amount
  FROM public.community_auctions
  WHERE status = 'active'
    AND current_bidder_id IS NOT NULL
    AND current_price > 0
  GROUP BY current_bidder_id
)
UPDATE public.profiles profile
SET points = COALESCE(profile.points, 0) + held.amount
FROM held
WHERE profile.id = held.user_id;

CREATE TABLE IF NOT EXISTS public.community_market_payment_details (
  auction_id UUID PRIMARY KEY REFERENCES public.community_auctions(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payment_instructions TEXT NOT NULL CHECK (char_length(BTRIM(payment_instructions)) BETWEEN 3 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.community_market_cash_payments (
  auction_id UUID PRIMARY KEY REFERENCES public.community_auctions(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount INTEGER NOT NULL CHECK (amount BETWEEN 1 AND 100000000),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'confirmed', 'rejected')),
  proof_path TEXT NOT NULL,
  reference_note TEXT CHECK (reference_note IS NULL OR char_length(reference_note) <= 300),
  rejection_reason TEXT CHECK (rejection_reason IS NULL OR char_length(rejection_reason) <= 500),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  proof_purge_after TIMESTAMPTZ,
  proof_purged_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT community_market_cash_payment_review_shape CHECK (
    (status = 'submitted' AND reviewed_at IS NULL AND reviewed_by IS NULL)
    OR (status IN ('confirmed', 'rejected') AND reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL)
  ),
  CONSTRAINT community_market_cash_payment_rejection_reason CHECK (
    status <> 'rejected' OR NULLIF(BTRIM(rejection_reason), '') IS NOT NULL
  )
);

ALTER TABLE public.community_market_payment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_market_cash_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cash payment details seller read" ON public.community_market_payment_details;
CREATE POLICY "cash payment details seller read"
  ON public.community_market_payment_details FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = seller_id);

DROP POLICY IF EXISTS "cash payment details winner read" ON public.community_market_payment_details;
CREATE POLICY "cash payment details winner read"
  ON public.community_market_payment_details FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.community_auctions auction
    WHERE auction.id = auction_id
      AND auction.winner_id = (SELECT auth.uid())
      AND auction.status IN ('pending_payment', 'sold')
  ));

DROP POLICY IF EXISTS "cash payment details admin read" ON public.community_market_payment_details;
CREATE POLICY "cash payment details admin read"
  ON public.community_market_payment_details FOR SELECT TO authenticated
  USING ((SELECT public.current_user_is_admin()));

DROP POLICY IF EXISTS "cash payments participant read" ON public.community_market_cash_payments;
CREATE POLICY "cash payments participant read"
  ON public.community_market_cash_payments FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) IN (buyer_id, seller_id)
    OR (SELECT public.current_user_is_admin())
  );

REVOKE ALL ON TABLE public.community_market_payment_details FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.community_market_cash_payments FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.community_market_payment_details FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.community_market_cash_payments FROM authenticated;
GRANT SELECT ON TABLE public.community_market_payment_details TO authenticated;
GRANT SELECT ON TABLE public.community_market_cash_payments TO authenticated;
GRANT ALL ON TABLE public.community_market_payment_details TO service_role;
GRANT ALL ON TABLE public.community_market_cash_payments TO service_role;

INSERT INTO public.community_market_payment_details (auction_id, seller_id, payment_instructions)
SELECT auction.id, auction.seller_id, '請透過站內訊息聯絡賣家取得匯款資訊'
FROM public.community_auctions auction
WHERE auction.status = 'active'
ON CONFLICT (auction_id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-market-payments',
  'community-market-payments',
  false,
  8388608,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "cash payment buyer upload proof" ON storage.objects;
CREATE POLICY "cash payment buyer upload proof"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'community-market-payments'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT
  AND name = (SELECT auth.uid())::TEXT || '/' || (storage.foldername(name))[2] || '/proof'
  AND EXISTS (
    SELECT 1 FROM public.community_auctions auction
    WHERE auction.id::TEXT = (storage.foldername(name))[2]
      AND auction.winner_id = (SELECT auth.uid())
      AND auction.status = 'pending_payment'
  )
);

DROP POLICY IF EXISTS "cash payment buyer replace proof" ON storage.objects;
CREATE POLICY "cash payment buyer replace proof"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'community-market-payments'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT
  AND EXISTS (
    SELECT 1 FROM public.community_auctions auction
    WHERE auction.id::TEXT = (storage.foldername(name))[2]
      AND auction.winner_id = (SELECT auth.uid())
      AND auction.status = 'pending_payment'
  )
)
WITH CHECK (
  bucket_id = 'community-market-payments'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT
  AND name = (SELECT auth.uid())::TEXT || '/' || (storage.foldername(name))[2] || '/proof'
);

DROP POLICY IF EXISTS "cash payment participants read proof" ON storage.objects;
CREATE POLICY "cash payment participants read proof"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'community-market-payments'
  AND EXISTS (
    SELECT 1 FROM public.community_market_cash_payments payment
    WHERE payment.proof_path = name
      AND (
        (SELECT auth.uid()) IN (payment.buyer_id, payment.seller_id)
        OR (SELECT public.current_user_is_admin())
      )
  )
);

DROP FUNCTION IF EXISTS public.create_community_auction(UUID, INTEGER, INTEGER, INTEGER, TIMESTAMPTZ, TEXT);
CREATE FUNCTION public.create_community_auction(
  p_user_distribution_id UUID,
  p_starting_price INTEGER,
  p_min_increment INTEGER,
  p_buy_now_price INTEGER,
  p_end_time TIMESTAMPTZ,
  p_description TEXT,
  p_payment_instructions TEXT
)
RETURNS public.community_auctions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_distribution_id UUID;
  v_created public.community_auctions;
  v_description TEXT := NULLIF(BTRIM(p_description), '');
  v_payment_instructions TEXT := NULLIF(BTRIM(p_payment_instructions), '');
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION '請先登入'; END IF;
  IF NOT public.current_user_trade_identity_verified() THEN
    RAISE EXCEPTION '交易前需要完成身分證實名認證並通過人工審核';
  END IF;
  IF p_starting_price IS NULL OR p_starting_price < 1 OR p_starting_price > 100000000 THEN
    RAISE EXCEPTION '起標價必須介於 NT$1 到 NT$100000000';
  END IF;
  IF p_min_increment IS NULL OR p_min_increment < 1 OR p_min_increment > 100000000 THEN
    RAISE EXCEPTION '最低加價必須介於 NT$1 到 NT$100000000';
  END IF;
  IF p_buy_now_price IS NOT NULL AND (p_buy_now_price < p_starting_price OR p_buy_now_price > 100000000) THEN
    RAISE EXCEPTION '直購價不可低於起標價';
  END IF;
  IF p_end_time <= NOW() + INTERVAL '10 minutes' OR p_end_time > NOW() + INTERVAL '14 days' THEN
    RAISE EXCEPTION '拍賣時間必須介於 10 分鐘到 14 天';
  END IF;
  IF v_description IS NOT NULL AND char_length(v_description) > 500 THEN
    RAISE EXCEPTION '商品說明不可超過 500 字';
  END IF;
  IF v_payment_instructions IS NULL OR char_length(v_payment_instructions) > 1000 THEN
    RAISE EXCEPTION '請填寫 3 到 1000 字的匯款或付款說明';
  END IF;

  SELECT distribution_id INTO v_distribution_id
  FROM public.user_distributions
  WHERE id = p_user_distribution_id AND user_id = v_user_id
  FOR UPDATE;
  IF v_distribution_id IS NULL THEN RAISE EXCEPTION '找不到可刊登的收藏'; END IF;

  INSERT INTO public.community_auctions (
    seller_id, user_distribution_id, distribution_id, description,
    starting_price, min_increment, buy_now_price, current_price, end_time
  ) VALUES (
    v_user_id, p_user_distribution_id, v_distribution_id, v_description,
    p_starting_price, p_min_increment, p_buy_now_price, 0, p_end_time
  ) RETURNING * INTO v_created;

  INSERT INTO public.community_market_payment_details (auction_id, seller_id, payment_instructions)
  VALUES (v_created.id, v_user_id, v_payment_instructions);
  RETURN v_created;
END;
$$;

CREATE OR REPLACE FUNCTION public.place_community_bid(p_auction_id UUID, p_amount INTEGER)
RETURNS public.community_auctions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_auction public.community_auctions;
  v_minimum INTEGER;
  v_updated public.community_auctions;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION '請先登入'; END IF;
  IF NOT public.current_user_trade_identity_verified() THEN
    RAISE EXCEPTION '交易前需要完成身分證實名認證並通過人工審核';
  END IF;
  SELECT * INTO v_auction FROM public.community_auctions WHERE id = p_auction_id FOR UPDATE;
  IF v_auction.id IS NULL THEN RAISE EXCEPTION '找不到這筆拍賣'; END IF;
  IF v_auction.status <> 'active' OR v_auction.end_time <= NOW() THEN RAISE EXCEPTION '這筆拍賣已經結束'; END IF;
  IF v_auction.seller_id = v_user_id THEN RAISE EXCEPTION '不能對自己的寶可夢出價'; END IF;
  IF v_auction.current_bidder_id = v_user_id THEN RAISE EXCEPTION '你目前已是最高出價者'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_distributions WHERE user_id = v_user_id AND distribution_id = v_auction.distribution_id) THEN
    RAISE EXCEPTION '你的收藏中已經有這隻配布寶可夢';
  END IF;
  v_minimum := CASE WHEN v_auction.bid_count = 0 THEN v_auction.starting_price ELSE v_auction.current_price + v_auction.min_increment END;
  IF p_amount IS NULL OR p_amount < v_minimum OR p_amount > 100000000 THEN RAISE EXCEPTION '出價至少需要 NT$%', v_minimum; END IF;
  IF v_auction.buy_now_price IS NOT NULL AND p_amount >= v_auction.buy_now_price THEN RAISE EXCEPTION '此金額已達直購價，請使用立即購買'; END IF;

  INSERT INTO public.community_auction_bids (auction_id, bidder_id, amount)
  VALUES (v_auction.id, v_user_id, p_amount);
  UPDATE public.community_auctions
  SET current_price = p_amount, current_bidder_id = v_user_id, bid_count = bid_count + 1,
      end_time = CASE WHEN end_time <= NOW() + INTERVAL '60 seconds' THEN end_time + INTERVAL '2 minutes' ELSE end_time END,
      updated_at = NOW()
  WHERE id = v_auction.id RETURNING * INTO v_updated;
  RETURN v_updated;
END;
$$;

CREATE OR REPLACE FUNCTION public.buy_community_auction(p_auction_id UUID)
RETURNS public.community_auctions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_auction public.community_auctions;
  v_updated public.community_auctions;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION '請先登入'; END IF;
  IF NOT public.current_user_trade_identity_verified() THEN
    RAISE EXCEPTION '交易前需要完成身分證實名認證並通過人工審核';
  END IF;
  SELECT * INTO v_auction FROM public.community_auctions WHERE id = p_auction_id FOR UPDATE;
  IF v_auction.id IS NULL THEN RAISE EXCEPTION '找不到這筆拍賣'; END IF;
  IF v_auction.status <> 'active' OR v_auction.end_time <= NOW() THEN RAISE EXCEPTION '這筆拍賣已經結束'; END IF;
  IF v_auction.buy_now_price IS NULL THEN RAISE EXCEPTION '賣家沒有設定直購價'; END IF;
  IF v_auction.seller_id = v_user_id THEN RAISE EXCEPTION '不能購買自己的寶可夢'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_distributions WHERE user_id = v_user_id AND distribution_id = v_auction.distribution_id) THEN
    RAISE EXCEPTION '你的收藏中已經有這隻配布寶可夢';
  END IF;

  INSERT INTO public.community_auction_bids (auction_id, bidder_id, amount)
  VALUES (v_auction.id, v_user_id, v_auction.buy_now_price);
  UPDATE public.community_auctions
  SET current_price = v_auction.buy_now_price, current_bidder_id = v_user_id,
      bid_count = bid_count + 1, status = 'pending_payment', winner_id = v_user_id,
      sold_price = v_auction.buy_now_price, updated_at = NOW()
  WHERE id = v_auction.id RETURNING * INTO v_updated;
  RETURN v_updated;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_community_auction(p_auction_id UUID)
RETURNS public.community_auctions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_auction public.community_auctions;
  v_updated public.community_auctions;
BEGIN
  IF v_user_id IS NULL AND COALESCE((SELECT auth.role()), '') <> 'service_role' THEN RAISE EXCEPTION '請先登入'; END IF;
  SELECT * INTO v_auction FROM public.community_auctions WHERE id = p_auction_id FOR UPDATE;
  IF v_auction.id IS NULL THEN RAISE EXCEPTION '找不到這筆拍賣'; END IF;
  IF v_auction.status <> 'active' THEN RETURN v_auction; END IF;
  IF v_auction.end_time > NOW() THEN RAISE EXCEPTION '拍賣尚未結束'; END IF;
  IF v_auction.current_bidder_id IS NULL THEN
    UPDATE public.community_auctions SET status = 'ended', settled_at = NOW(), updated_at = NOW()
    WHERE id = v_auction.id RETURNING * INTO v_updated;
  ELSE
    UPDATE public.community_auctions
    SET status = 'pending_payment', winner_id = v_auction.current_bidder_id,
        sold_price = v_auction.current_price, updated_at = NOW()
    WHERE id = v_auction.id RETURNING * INTO v_updated;
  END IF;
  RETURN v_updated;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_community_cash_payment(
  p_auction_id UUID,
  p_proof_path TEXT,
  p_reference_note TEXT DEFAULT NULL
)
RETURNS public.community_market_cash_payments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_auction public.community_auctions;
  v_payment public.community_market_cash_payments;
  v_expected_path TEXT;
  v_note TEXT := NULLIF(BTRIM(p_reference_note), '');
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION '請先登入'; END IF;
  SELECT * INTO v_auction FROM public.community_auctions WHERE id = p_auction_id FOR UPDATE;
  IF v_auction.id IS NULL THEN RAISE EXCEPTION '找不到這筆拍賣'; END IF;
  IF v_auction.status <> 'pending_payment' OR v_auction.winner_id <> v_user_id THEN RAISE EXCEPTION '你不是這筆待付款交易的買家'; END IF;
  v_expected_path := v_user_id::TEXT || '/' || p_auction_id::TEXT || '/proof';
  IF p_proof_path <> v_expected_path THEN RAISE EXCEPTION '付款證明路徑不正確'; END IF;
  IF v_note IS NOT NULL AND char_length(v_note) > 300 THEN RAISE EXCEPTION '付款備註不可超過 300 字'; END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'community-market-payments' AND name = v_expected_path) THEN
    RAISE EXCEPTION '找不到付款證明檔案';
  END IF;

  INSERT INTO public.community_market_cash_payments (
    auction_id, buyer_id, seller_id, amount, status, proof_path, reference_note,
    rejection_reason, submitted_at, reviewed_at, reviewed_by, updated_at
  ) VALUES (
    v_auction.id, v_user_id, v_auction.seller_id, v_auction.sold_price,
    'submitted', v_expected_path, v_note, NULL, NOW(), NULL, NULL, NOW()
  ) ON CONFLICT (auction_id) DO UPDATE SET
    status = 'submitted', proof_path = EXCLUDED.proof_path, reference_note = EXCLUDED.reference_note,
    rejection_reason = NULL, submitted_at = NOW(), reviewed_at = NULL, reviewed_by = NULL, updated_at = NOW()
  RETURNING * INTO v_payment;
  RETURN v_payment;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_community_cash_payment(p_auction_id UUID)
RETURNS public.community_auctions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_auction public.community_auctions;
  v_payment public.community_market_cash_payments;
  v_updated public.community_auctions;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION '請先登入'; END IF;
  SELECT * INTO v_auction FROM public.community_auctions WHERE id = p_auction_id FOR UPDATE;
  IF v_auction.id IS NULL THEN RAISE EXCEPTION '找不到這筆拍賣'; END IF;
  IF v_auction.status <> 'pending_payment' THEN RAISE EXCEPTION '這筆交易不是待付款狀態'; END IF;
  IF v_user_id <> v_auction.seller_id AND NOT public.current_user_is_admin() THEN RAISE EXCEPTION '只有賣家或管理員可以確認收款'; END IF;
  SELECT * INTO v_payment FROM public.community_market_cash_payments WHERE auction_id = p_auction_id FOR UPDATE;
  IF v_payment.auction_id IS NULL OR v_payment.status <> 'submitted' THEN RAISE EXCEPTION '買家尚未提交有效的付款證明'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_distributions WHERE user_id = v_auction.winner_id AND distribution_id = v_auction.distribution_id) THEN
    RAISE EXCEPTION '買家目前已擁有相同配布，請聯絡管理員處理';
  END IF;

  UPDATE public.user_distributions SET user_id = v_auction.winner_id
  WHERE id = v_auction.user_distribution_id AND user_id = v_auction.seller_id;
  IF NOT FOUND THEN RAISE EXCEPTION '賣家的收藏狀態已變更，無法完成交易'; END IF;
  UPDATE public.user_distribution_badges SET user_id = v_auction.winner_id
  WHERE user_distribution_id = v_auction.user_distribution_id;
  UPDATE public.community_market_cash_payments
  SET status = 'confirmed', reviewed_at = NOW(), reviewed_by = v_user_id,
      proof_purge_after = NOW() + INTERVAL '180 days', updated_at = NOW()
  WHERE auction_id = p_auction_id;
  UPDATE public.community_auctions
  SET status = 'sold', settled_at = NOW(), updated_at = NOW()
  WHERE id = p_auction_id RETURNING * INTO v_updated;
  RETURN v_updated;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_community_cash_payment(p_auction_id UUID, p_reason TEXT)
RETURNS public.community_market_cash_payments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_auction public.community_auctions;
  v_payment public.community_market_cash_payments;
  v_reason TEXT := NULLIF(BTRIM(p_reason), '');
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION '請先登入'; END IF;
  SELECT * INTO v_auction FROM public.community_auctions WHERE id = p_auction_id;
  IF v_auction.id IS NULL THEN RAISE EXCEPTION '找不到這筆拍賣'; END IF;
  IF v_auction.status <> 'pending_payment' THEN RAISE EXCEPTION '這筆交易不是待付款狀態'; END IF;
  IF v_user_id <> v_auction.seller_id AND NOT public.current_user_is_admin() THEN RAISE EXCEPTION '只有賣家或管理員可以退回付款證明'; END IF;
  IF v_reason IS NULL OR char_length(v_reason) > 500 THEN RAISE EXCEPTION '請填寫 500 字以內的退回原因'; END IF;
  UPDATE public.community_market_cash_payments
  SET status = 'rejected', rejection_reason = v_reason, reviewed_at = NOW(), reviewed_by = v_user_id, updated_at = NOW()
  WHERE auction_id = p_auction_id AND status = 'submitted'
  RETURNING * INTO v_payment;
  IF v_payment.auction_id IS NULL THEN RAISE EXCEPTION '沒有可退回的付款證明'; END IF;
  RETURN v_payment;
END;
$$;

DROP INDEX IF EXISTS public.idx_community_auctions_one_active_item;
CREATE UNIQUE INDEX idx_community_auctions_one_open_item
  ON public.community_auctions(user_distribution_id)
  WHERE status IN ('active', 'pending_payment');

-- 交易完成前持續鎖定收藏與證章。
DROP POLICY IF EXISTS "user_distributions_insert_own" ON public.user_distributions;
CREATE POLICY "user_distributions_insert_own"
  ON public.user_distributions FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id AND NOT EXISTS (
    SELECT 1 FROM public.community_auctions auction
    WHERE auction.status IN ('active', 'pending_payment')
      AND COALESCE(auction.winner_id, auction.current_bidder_id) = (SELECT auth.uid())
      AND auction.distribution_id = user_distributions.distribution_id
  ));

DROP POLICY IF EXISTS "user_distributions_delete_own" ON public.user_distributions;
CREATE POLICY "user_distributions_delete_own"
  ON public.user_distributions FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id AND NOT EXISTS (
    SELECT 1 FROM public.community_auctions auction
    WHERE auction.status IN ('active', 'pending_payment')
      AND auction.user_distribution_id = user_distributions.id
  ));

DROP POLICY IF EXISTS "user_distribution_badges_insert_own_compatible" ON public.user_distribution_badges;
CREATE POLICY "user_distribution_badges_insert_own_compatible"
  ON public.user_distribution_badges FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.community_auctions auction
      WHERE auction.status IN ('active', 'pending_payment')
        AND auction.user_distribution_id = user_distribution_badges.user_distribution_id
    )
    AND EXISTS (
      SELECT 1
      FROM public.user_distributions distribution
      JOIN public.distributions pokemon ON pokemon.id = distribution.distribution_id
      JOIN public.distribution_badges badge ON badge.id = badge_id
      WHERE distribution.id = user_distribution_id
        AND distribution.user_id = (SELECT auth.uid())
        AND pokemon.generation BETWEEN badge.min_generation AND badge.max_generation
    )
  );

DROP POLICY IF EXISTS "user_distribution_badges_delete_own" ON public.user_distribution_badges;
CREATE POLICY "user_distribution_badges_delete_own"
  ON public.user_distribution_badges FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id AND NOT EXISTS (
    SELECT 1 FROM public.community_auctions auction
    WHERE auction.status IN ('active', 'pending_payment')
      AND auction.user_distribution_id = user_distribution_badges.user_distribution_id
  ));

REVOKE ALL ON FUNCTION public.create_community_auction(UUID, INTEGER, INTEGER, INTEGER, TIMESTAMPTZ, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.place_community_bid(UUID, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.buy_community_auction(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.finalize_community_auction(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.submit_community_cash_payment(UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.confirm_community_cash_payment(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reject_community_cash_payment(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_community_auction(UUID, INTEGER, INTEGER, INTEGER, TIMESTAMPTZ, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_community_bid(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.buy_community_auction(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_community_auction(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_community_cash_payment(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_community_cash_payment(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_community_cash_payment(UUID, TEXT) TO authenticated;

COMMENT ON TABLE public.community_market_payment_details IS '賣家的私密收款說明，只限賣家及該筆得標買家讀取。';
COMMENT ON TABLE public.community_market_cash_payments IS '新台幣人工匯款證明與確認狀態，不儲存或移轉站內點數。';
COMMENT ON TABLE public.community_auctions IS '民間交易區新台幣拍賣；得標後人工匯款，確認收款才移轉收藏。';
