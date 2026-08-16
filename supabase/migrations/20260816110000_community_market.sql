-- 民間交易區：使用站內 points 競標玩家收藏中的配布寶可夢。
-- 所有金流、退款與收藏轉移都只允許經由 SECURITY DEFINER RPC 完成。

CREATE TABLE IF NOT EXISTS public.community_auctions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  user_distribution_id UUID NOT NULL REFERENCES public.user_distributions(id) ON DELETE RESTRICT,
  distribution_id UUID NOT NULL REFERENCES public.distributions(id) ON DELETE RESTRICT,
  description TEXT,
  starting_price INTEGER NOT NULL CHECK (starting_price BETWEEN 1 AND 100000000),
  min_increment INTEGER NOT NULL DEFAULT 1 CHECK (min_increment BETWEEN 1 AND 100000000),
  buy_now_price INTEGER CHECK (buy_now_price BETWEEN 1 AND 100000000),
  current_price INTEGER NOT NULL DEFAULT 0 CHECK (current_price >= 0),
  current_bidder_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  bid_count INTEGER NOT NULL DEFAULT 0 CHECK (bid_count >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'ended', 'cancelled')),
  end_time TIMESTAMPTZ NOT NULL,
  winner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sold_price INTEGER CHECK (sold_price >= 0),
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT community_auctions_buy_now_above_start
    CHECK (buy_now_price IS NULL OR buy_now_price >= starting_price),
  CONSTRAINT community_auctions_description_length
    CHECK (description IS NULL OR char_length(description) <= 500)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_community_auctions_one_active_item
  ON public.community_auctions(user_distribution_id)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_community_auctions_status_end
  ON public.community_auctions(status, end_time);
CREATE INDEX IF NOT EXISTS idx_community_auctions_seller
  ON public.community_auctions(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_auctions_distribution
  ON public.community_auctions(distribution_id);

CREATE TABLE IF NOT EXISTS public.community_auction_bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auction_id UUID NOT NULL REFERENCES public.community_auctions(id) ON DELETE RESTRICT,
  bidder_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount INTEGER NOT NULL CHECK (amount BETWEEN 1 AND 100000000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_auction_bids_auction
  ON public.community_auction_bids(auction_id, amount DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_community_auction_bids_bidder
  ON public.community_auction_bids(bidder_id, created_at DESC);

ALTER TABLE public.community_auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_auction_bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_auctions_read_all" ON public.community_auctions;
CREATE POLICY "community_auctions_read_all"
  ON public.community_auctions
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "community_auction_bids_read_all" ON public.community_auction_bids;
CREATE POLICY "community_auction_bids_read_all"
  ON public.community_auction_bids
  FOR SELECT
  TO anon, authenticated
  USING (true);

REVOKE ALL ON TABLE public.community_auctions FROM PUBLIC;
REVOKE ALL ON TABLE public.community_auction_bids FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.community_auctions FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.community_auction_bids FROM anon, authenticated;
GRANT SELECT ON TABLE public.community_auctions TO anon, authenticated;
GRANT SELECT ON TABLE public.community_auction_bids TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_community_auction(
  p_user_distribution_id UUID,
  p_starting_price INTEGER,
  p_min_increment INTEGER,
  p_buy_now_price INTEGER,
  p_end_time TIMESTAMPTZ,
  p_description TEXT DEFAULT NULL
)
RETURNS public.community_auctions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_distribution_id UUID;
  v_created public.community_auctions;
  v_description TEXT := NULLIF(BTRIM(p_description), '');
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '請先登入';
  END IF;

  IF p_starting_price IS NULL OR p_starting_price < 1 OR p_starting_price > 100000000 THEN
    RAISE EXCEPTION '起標價必須介於 1 到 100000000 點';
  END IF;
  IF p_min_increment IS NULL OR p_min_increment < 1 OR p_min_increment > 100000000 THEN
    RAISE EXCEPTION '最低加價必須介於 1 到 100000000 點';
  END IF;
  IF p_buy_now_price IS NOT NULL AND
     (p_buy_now_price < p_starting_price OR p_buy_now_price > 100000000) THEN
    RAISE EXCEPTION '直購價不可低於起標價';
  END IF;
  IF p_end_time <= NOW() + INTERVAL '10 minutes' OR p_end_time > NOW() + INTERVAL '14 days' THEN
    RAISE EXCEPTION '拍賣時間必須介於 10 分鐘到 14 天';
  END IF;
  IF v_description IS NOT NULL AND char_length(v_description) > 500 THEN
    RAISE EXCEPTION '商品說明不可超過 500 字';
  END IF;

  SELECT ud.distribution_id
  INTO v_distribution_id
  FROM public.user_distributions ud
  WHERE ud.id = p_user_distribution_id
    AND ud.user_id = v_user_id
  FOR UPDATE;

  IF v_distribution_id IS NULL THEN
    RAISE EXCEPTION '找不到可刊登的收藏';
  END IF;

  INSERT INTO public.community_auctions (
    seller_id,
    user_distribution_id,
    distribution_id,
    description,
    starting_price,
    min_increment,
    buy_now_price,
    current_price,
    end_time
  ) VALUES (
    v_user_id,
    p_user_distribution_id,
    v_distribution_id,
    v_description,
    p_starting_price,
    p_min_increment,
    p_buy_now_price,
    0,
    p_end_time
  )
  RETURNING * INTO v_created;

  RETURN v_created;
END;
$$;

CREATE OR REPLACE FUNCTION public.place_community_bid(
  p_auction_id UUID,
  p_amount INTEGER
)
RETURNS public.community_auctions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_auction public.community_auctions;
  v_minimum INTEGER;
  v_updated public.community_auctions;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '請先登入';
  END IF;

  SELECT * INTO v_auction
  FROM public.community_auctions
  WHERE id = p_auction_id
  FOR UPDATE;

  IF v_auction.id IS NULL THEN
    RAISE EXCEPTION '找不到這筆拍賣';
  END IF;
  IF v_auction.status <> 'active' OR v_auction.end_time <= NOW() THEN
    RAISE EXCEPTION '這筆拍賣已經結束';
  END IF;
  IF v_auction.seller_id = v_user_id THEN
    RAISE EXCEPTION '不能對自己的寶可夢出價';
  END IF;
  IF v_auction.current_bidder_id = v_user_id THEN
    RAISE EXCEPTION '你目前已是最高出價者';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.user_distributions ud
    WHERE ud.user_id = v_user_id
      AND ud.distribution_id = v_auction.distribution_id
  ) THEN
    RAISE EXCEPTION '你的收藏中已經有這隻配布寶可夢';
  END IF;

  v_minimum := CASE
    WHEN v_auction.bid_count = 0 THEN v_auction.starting_price
    ELSE v_auction.current_price + v_auction.min_increment
  END;

  IF p_amount IS NULL OR p_amount < v_minimum OR p_amount > 100000000 THEN
    RAISE EXCEPTION '出價至少需要 % 點', v_minimum;
  END IF;
  IF v_auction.buy_now_price IS NOT NULL AND p_amount >= v_auction.buy_now_price THEN
    RAISE EXCEPTION '此金額已達直購價，請使用立即購買';
  END IF;

  UPDATE public.profiles
  SET points = COALESCE(points, 0) - p_amount
  WHERE id = v_user_id
    AND COALESCE(points, 0) >= p_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION '點數不足';
  END IF;

  IF v_auction.current_bidder_id IS NOT NULL THEN
    UPDATE public.profiles
    SET points = COALESCE(points, 0) + v_auction.current_price
    WHERE id = v_auction.current_bidder_id;
  END IF;

  INSERT INTO public.community_auction_bids (auction_id, bidder_id, amount)
  VALUES (v_auction.id, v_user_id, p_amount);

  UPDATE public.community_auctions
  SET current_price = p_amount,
      current_bidder_id = v_user_id,
      bid_count = bid_count + 1,
      end_time = CASE
        WHEN end_time <= NOW() + INTERVAL '60 seconds'
          THEN end_time + INTERVAL '2 minutes'
        ELSE end_time
      END,
      updated_at = NOW()
  WHERE id = v_auction.id
  RETURNING * INTO v_updated;

  RETURN v_updated;
END;
$$;

CREATE OR REPLACE FUNCTION public.buy_community_auction(p_auction_id UUID)
RETURNS public.community_auctions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_auction public.community_auctions;
  v_charge INTEGER;
  v_updated public.community_auctions;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '請先登入';
  END IF;

  SELECT * INTO v_auction
  FROM public.community_auctions
  WHERE id = p_auction_id
  FOR UPDATE;

  IF v_auction.id IS NULL THEN
    RAISE EXCEPTION '找不到這筆拍賣';
  END IF;
  IF v_auction.status <> 'active' OR v_auction.end_time <= NOW() THEN
    RAISE EXCEPTION '這筆拍賣已經結束';
  END IF;
  IF v_auction.buy_now_price IS NULL THEN
    RAISE EXCEPTION '賣家沒有設定直購價';
  END IF;
  IF v_auction.seller_id = v_user_id THEN
    RAISE EXCEPTION '不能購買自己的寶可夢';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.user_distributions ud
    WHERE ud.user_id = v_user_id
      AND ud.distribution_id = v_auction.distribution_id
  ) THEN
    RAISE EXCEPTION '你的收藏中已經有這隻配布寶可夢';
  END IF;

  v_charge := v_auction.buy_now_price - CASE
    WHEN v_auction.current_bidder_id = v_user_id THEN v_auction.current_price
    ELSE 0
  END;

  UPDATE public.profiles
  SET points = COALESCE(points, 0) - v_charge
  WHERE id = v_user_id
    AND COALESCE(points, 0) >= v_charge;

  IF NOT FOUND THEN
    RAISE EXCEPTION '點數不足';
  END IF;

  IF v_auction.current_bidder_id IS NOT NULL AND v_auction.current_bidder_id <> v_user_id THEN
    UPDATE public.profiles
    SET points = COALESCE(points, 0) + v_auction.current_price
    WHERE id = v_auction.current_bidder_id;
  END IF;

  UPDATE public.user_distributions
  SET user_id = v_user_id
  WHERE id = v_auction.user_distribution_id
    AND user_id = v_auction.seller_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '賣家的收藏狀態已變更，無法完成交易';
  END IF;

  UPDATE public.user_distribution_badges
  SET user_id = v_user_id
  WHERE user_distribution_id = v_auction.user_distribution_id;

  UPDATE public.profiles
  SET points = COALESCE(points, 0) + v_auction.buy_now_price
  WHERE id = v_auction.seller_id;

  INSERT INTO public.community_auction_bids (auction_id, bidder_id, amount)
  VALUES (v_auction.id, v_user_id, v_auction.buy_now_price);

  UPDATE public.community_auctions
  SET current_price = v_auction.buy_now_price,
      current_bidder_id = v_user_id,
      bid_count = bid_count + 1,
      status = 'sold',
      winner_id = v_user_id,
      sold_price = v_auction.buy_now_price,
      settled_at = NOW(),
      updated_at = NOW()
  WHERE id = v_auction.id
  RETURNING * INTO v_updated;

  RETURN v_updated;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_community_auction(p_auction_id UUID)
RETURNS public.community_auctions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_auction public.community_auctions;
  v_updated public.community_auctions;
BEGIN
  IF v_user_id IS NULL AND COALESCE((SELECT auth.role()), '') <> 'service_role' THEN
    RAISE EXCEPTION '請先登入';
  END IF;

  SELECT * INTO v_auction
  FROM public.community_auctions
  WHERE id = p_auction_id
  FOR UPDATE;

  IF v_auction.id IS NULL THEN
    RAISE EXCEPTION '找不到這筆拍賣';
  END IF;
  IF v_auction.status <> 'active' THEN
    RETURN v_auction;
  END IF;
  IF v_auction.end_time > NOW() THEN
    RAISE EXCEPTION '拍賣尚未結束';
  END IF;

  IF v_auction.current_bidder_id IS NULL THEN
    UPDATE public.community_auctions
    SET status = 'ended', settled_at = NOW(), updated_at = NOW()
    WHERE id = v_auction.id
    RETURNING * INTO v_updated;
    RETURN v_updated;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_distributions ud
    WHERE ud.user_id = v_auction.current_bidder_id
      AND ud.distribution_id = v_auction.distribution_id
  ) THEN
    UPDATE public.profiles
    SET points = COALESCE(points, 0) + v_auction.current_price
    WHERE id = v_auction.current_bidder_id;

    UPDATE public.community_auctions
    SET status = 'cancelled',
        current_bidder_id = NULL,
        winner_id = NULL,
        sold_price = NULL,
        settled_at = NOW(),
        updated_at = NOW()
    WHERE id = v_auction.id
    RETURNING * INTO v_updated;
    RETURN v_updated;
  END IF;

  UPDATE public.user_distributions
  SET user_id = v_auction.current_bidder_id
  WHERE id = v_auction.user_distribution_id
    AND user_id = v_auction.seller_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '賣家的收藏狀態已變更，無法完成交易';
  END IF;

  UPDATE public.user_distribution_badges
  SET user_id = v_auction.current_bidder_id
  WHERE user_distribution_id = v_auction.user_distribution_id;

  UPDATE public.profiles
  SET points = COALESCE(points, 0) + v_auction.current_price
  WHERE id = v_auction.seller_id;

  UPDATE public.community_auctions
  SET status = 'sold',
      winner_id = v_auction.current_bidder_id,
      sold_price = v_auction.current_price,
      settled_at = NOW(),
      updated_at = NOW()
  WHERE id = v_auction.id
  RETURNING * INTO v_updated;

  RETURN v_updated;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_community_auction(p_auction_id UUID)
RETURNS public.community_auctions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_auction public.community_auctions;
  v_updated public.community_auctions;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '請先登入';
  END IF;

  SELECT * INTO v_auction
  FROM public.community_auctions
  WHERE id = p_auction_id
  FOR UPDATE;

  IF v_auction.id IS NULL THEN
    RAISE EXCEPTION '找不到這筆拍賣';
  END IF;
  IF v_auction.seller_id <> v_user_id THEN
    RAISE EXCEPTION '只有賣家可以取消拍賣';
  END IF;
  IF v_auction.status <> 'active' OR v_auction.end_time <= NOW() THEN
    RAISE EXCEPTION '這筆拍賣已經結束';
  END IF;
  IF v_auction.bid_count > 0 THEN
    RAISE EXCEPTION '已有人出價，不能取消拍賣';
  END IF;

  UPDATE public.community_auctions
  SET status = 'cancelled', settled_at = NOW(), updated_at = NOW()
  WHERE id = v_auction.id
  RETURNING * INTO v_updated;

  RETURN v_updated;
END;
$$;

-- 刊登期間鎖住收藏與附加證章，避免賣家在交易途中刪除或改裝商品。
DROP POLICY IF EXISTS "user_distributions_insert_own" ON public.user_distributions;
CREATE POLICY "user_distributions_insert_own"
  ON public.user_distributions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.community_auctions ca
      WHERE ca.status = 'active'
        AND ca.current_bidder_id = (SELECT auth.uid())
        AND ca.distribution_id = user_distributions.distribution_id
    )
  );

DROP POLICY IF EXISTS "user_distributions_delete_own" ON public.user_distributions;
CREATE POLICY "user_distributions_delete_own"
  ON public.user_distributions
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.community_auctions ca
      WHERE ca.status = 'active'
        AND ca.user_distribution_id = user_distributions.id
    )
  );

DROP POLICY IF EXISTS "user_distribution_badges_insert_own_compatible" ON public.user_distribution_badges;
CREATE POLICY "user_distribution_badges_insert_own_compatible"
  ON public.user_distribution_badges
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.community_auctions ca
      WHERE ca.status = 'active'
        AND ca.user_distribution_id = user_distribution_badges.user_distribution_id
    )
    AND EXISTS (
      SELECT 1
      FROM public.user_distributions ud
      JOIN public.distributions d ON d.id = ud.distribution_id
      JOIN public.distribution_badges b ON b.id = badge_id
      WHERE ud.id = user_distribution_id
        AND ud.user_id = (SELECT auth.uid())
        AND d.generation BETWEEN b.min_generation AND b.max_generation
    )
  );

DROP POLICY IF EXISTS "user_distribution_badges_delete_own" ON public.user_distribution_badges;
CREATE POLICY "user_distribution_badges_delete_own"
  ON public.user_distribution_badges
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.community_auctions ca
      WHERE ca.status = 'active'
        AND ca.user_distribution_id = user_distribution_badges.user_distribution_id
    )
  );

REVOKE ALL ON FUNCTION public.create_community_auction(UUID, INTEGER, INTEGER, INTEGER, TIMESTAMPTZ, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.place_community_bid(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.buy_community_auction(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finalize_community_auction(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_community_auction(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_community_auction(UUID, INTEGER, INTEGER, INTEGER, TIMESTAMPTZ, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.place_community_bid(UUID, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.buy_community_auction(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.finalize_community_auction(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.cancel_community_auction(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_community_auction(UUID, INTEGER, INTEGER, INTEGER, TIMESTAMPTZ, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_community_bid(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.buy_community_auction(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_community_auction(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_community_auction(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_community_auction(UUID) TO authenticated;

COMMENT ON TABLE public.community_auctions IS
  '民間交易區拍賣；出價點數會先扣住，結標或直購時由 RPC 原子轉移收藏與款項。';
COMMENT ON COLUMN public.community_auctions.end_time IS
  '最後 60 秒內的新最高出價會自動延長 2 分鐘。';
