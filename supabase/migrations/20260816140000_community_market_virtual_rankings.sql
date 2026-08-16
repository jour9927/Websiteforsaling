-- 民間交易排行榜的虛擬會員資料。
-- 這些數字只用於首頁社群氛圍，不建立假拍賣、不移轉收藏，也不影響任何會員點數。

CREATE TABLE IF NOT EXISTS public.community_market_virtual_rankings (
  virtual_user_id UUID PRIMARY KEY REFERENCES public.virtual_profiles(id) ON DELETE CASCADE,
  seller_trade_count INTEGER NOT NULL DEFAULT 0 CHECK (seller_trade_count >= 0),
  seller_total_points BIGINT NOT NULL DEFAULT 0 CHECK (seller_total_points >= 0),
  buyer_trade_count INTEGER NOT NULL DEFAULT 0 CHECK (buyer_trade_count >= 0),
  buyer_total_points BIGINT NOT NULL DEFAULT 0 CHECK (buyer_total_points >= 0),
  is_visible BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.community_market_virtual_rankings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_market_virtual_rankings_read_visible"
  ON public.community_market_virtual_rankings;
CREATE POLICY "community_market_virtual_rankings_read_visible"
  ON public.community_market_virtual_rankings
  FOR SELECT
  TO anon, authenticated
  USING (is_visible = true);

REVOKE ALL ON TABLE public.community_market_virtual_rankings FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.community_market_virtual_rankings FROM anon, authenticated;
GRANT SELECT ON TABLE public.community_market_virtual_rankings TO anon, authenticated;

-- 只挑選既有且名稱唯一的虛擬會員；若某個名稱不存在，該列會自然略過。
INSERT INTO public.community_market_virtual_rankings (
  virtual_user_id,
  seller_trade_count,
  seller_total_points,
  buyer_trade_count,
  buyer_total_points
)
SELECT
  vp.id,
  seed.seller_trade_count,
  seed.seller_total_points,
  seed.buyer_trade_count,
  seed.buyer_total_points
FROM (
  VALUES
    ('DistroCollector', 12, 48600::BIGINT,  6, 21400::BIGINT),
    ('PKM交換所',       11, 43200::BIGINT,  8, 31900::BIGINT),
    ('TradeKing_886',   10, 39700::BIGINT,  7, 26800::BIGINT),
    ('PokeTrader_TW',    9, 35100::BIGINT, 12, 47200::BIGINT),
    ('HOME轉送員',       9, 33800::BIGINT,  5, 18200::BIGINT),
    ('VGC_Player',       8, 29600::BIGINT, 13, 51900::BIGINT),
    ('色違獵人',          8, 28400::BIGINT, 11, 43800::BIGINT),
    ('配布達人',          7, 24700::BIGINT,  9, 35600::BIGINT),
    ('GTS_Trader',       6, 21300::BIGINT, 10, 40100::BIGINT),
    ('神奇交換',          5, 17600::BIGINT,  8, 30200::BIGINT)
) AS seed(
  display_name,
  seller_trade_count,
  seller_total_points,
  buyer_trade_count,
  buyer_total_points
)
JOIN public.virtual_profiles vp
  ON vp.display_name = seed.display_name
 AND vp.is_virtual = true
ON CONFLICT (virtual_user_id) DO UPDATE SET
  seller_trade_count = EXCLUDED.seller_trade_count,
  seller_total_points = EXCLUDED.seller_total_points,
  buyer_trade_count = EXCLUDED.buyer_trade_count,
  buyer_total_points = EXCLUDED.buyer_total_points,
  is_visible = true,
  updated_at = NOW();

CREATE OR REPLACE VIEW public.community_market_rankings
WITH (security_invoker = true, security_barrier = true)
AS
  SELECT
    'seller'::TEXT AS ranking_type,
    ca.seller_id AS user_id,
    COUNT(*)::BIGINT AS trade_count,
    COALESCE(SUM(ca.sold_price), 0)::BIGINT AS total_points,
    'real'::TEXT AS participant_type
  FROM public.community_auctions ca
  WHERE ca.status = 'sold'
    AND ca.sold_price IS NOT NULL
  GROUP BY ca.seller_id

  UNION ALL

  SELECT
    'buyer'::TEXT AS ranking_type,
    ca.winner_id AS user_id,
    COUNT(*)::BIGINT AS trade_count,
    COALESCE(SUM(ca.sold_price), 0)::BIGINT AS total_points,
    'real'::TEXT AS participant_type
  FROM public.community_auctions ca
  WHERE ca.status = 'sold'
    AND ca.winner_id IS NOT NULL
    AND ca.sold_price IS NOT NULL
  GROUP BY ca.winner_id

  UNION ALL

  SELECT
    'seller'::TEXT AS ranking_type,
    vr.virtual_user_id AS user_id,
    vr.seller_trade_count::BIGINT AS trade_count,
    vr.seller_total_points AS total_points,
    'virtual'::TEXT AS participant_type
  FROM public.community_market_virtual_rankings vr
  WHERE vr.is_visible = true
    AND vr.seller_trade_count > 0

  UNION ALL

  SELECT
    'buyer'::TEXT AS ranking_type,
    vr.virtual_user_id AS user_id,
    vr.buyer_trade_count::BIGINT AS trade_count,
    vr.buyer_total_points AS total_points,
    'virtual'::TEXT AS participant_type
  FROM public.community_market_virtual_rankings vr
  WHERE vr.is_visible = true
    AND vr.buyer_trade_count > 0;

REVOKE ALL ON TABLE public.community_market_rankings FROM PUBLIC;
GRANT SELECT ON TABLE public.community_market_rankings TO anon, authenticated;

COMMENT ON TABLE public.community_market_virtual_rankings IS
  'Display-only simulated community-market ranking data. It never represents ledger transactions.';
COMMENT ON VIEW public.community_market_rankings IS
  'Combined real completed trades and display-only virtual ranking rows. Resolve names from public_profiles or virtual_profiles according to participant_type.';
