-- 民間交易區排行榜：只彙總已完成的成交，不暴露實名或私人會員資料。

CREATE OR REPLACE VIEW public.community_market_rankings
WITH (security_invoker = true, security_barrier = true)
AS
  SELECT
    'seller'::TEXT AS ranking_type,
    ca.seller_id AS user_id,
    COUNT(*)::BIGINT AS trade_count,
    COALESCE(SUM(ca.sold_price), 0)::BIGINT AS total_points
  FROM public.community_auctions ca
  WHERE ca.status = 'sold'
    AND ca.sold_price IS NOT NULL
  GROUP BY ca.seller_id

  UNION ALL

  SELECT
    'buyer'::TEXT AS ranking_type,
    ca.winner_id AS user_id,
    COUNT(*)::BIGINT AS trade_count,
    COALESCE(SUM(ca.sold_price), 0)::BIGINT AS total_points
  FROM public.community_auctions ca
  WHERE ca.status = 'sold'
    AND ca.winner_id IS NOT NULL
    AND ca.sold_price IS NOT NULL
  GROUP BY ca.winner_id;

REVOKE ALL ON TABLE public.community_market_rankings FROM PUBLIC;
GRANT SELECT ON TABLE public.community_market_rankings TO anon, authenticated;

COMMENT ON VIEW public.community_market_rankings IS
  'Public aggregate of completed community-market sales and purchases. Display names must be read from public_profiles.';
