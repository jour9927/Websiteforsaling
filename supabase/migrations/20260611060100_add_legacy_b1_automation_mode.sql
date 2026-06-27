-- B-1: legacy counter-bid 強化型 — 價格低於 8000 時永不讓步，持續回擊
-- 超過 8000 回歸 B 的「5 次讓步」行為
-- 目標價格區間 8000-12000

ALTER TABLE public.auctions DROP CONSTRAINT IF EXISTS auctions_automation_mode_check;

ALTER TABLE public.auctions
  ADD CONSTRAINT auctions_automation_mode_check
  CHECK (automation_mode IN ('legacy', 'global_link_v2', 'legacy_a', 'legacy_b', 'legacy_b1', 'global_link_v2_c', 'global_link_v2_d', 'global_link_v2_b1'));
