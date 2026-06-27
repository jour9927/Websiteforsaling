-- 擴充 automation_mode 支援 A/B/C/D 四種模擬競標模式
-- A = Legacy 基本型（無種子、固定基底100×倍率、20筆、結束前30秒停止）
-- B = Legacy counter-bid 回擊型（A + 真實玩家出價反應式回擊 + 讓步機制）
-- C = Global Link v2 基本型（確定性種子、easedProgress推價、到target停止）
-- D = Global Link v2 高強度型（C + 超過target持續推 + auto-follow真實玩家）

-- 舊 constraint 只允許 'legacy' 和 'global_link_v2'
ALTER TABLE public.auctions DROP CONSTRAINT IF EXISTS auctions_automation_mode_check;

ALTER TABLE public.auctions
  ADD CONSTRAINT auctions_automation_mode_check
  CHECK (automation_mode IN ('legacy', 'global_link_v2', 'legacy_a', 'legacy_b', 'legacy_b1', 'global_link_v2_c', 'global_link_v2_d', 'global_link_v2_b1'));

-- 將所有 'legacy' → 'legacy_b'（B 是 legacy 的實際行為：有 counter-bid）
UPDATE public.auctions
SET automation_mode = 'legacy_b'
WHERE automation_mode = 'legacy';

-- 將所有 'global_link_v2' → 'global_link_v2_d'（D 是 v2 的實際行為：有 auto-follow）
UPDATE public.auctions
SET automation_mode = 'global_link_v2_d'
WHERE automation_mode = 'global_link_v2';

-- 目前沒有場次用 legacy_a 或 global_link_v2_c，它們是給未來新增場次用的
