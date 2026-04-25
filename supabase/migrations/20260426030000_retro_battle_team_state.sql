-- Phase 2 — 1gen 對戰機制 DB schema
-- 必須在 Supabase SQL Editor 手動執行（CLAUDE.md 規則）
--
-- 加兩個欄位：
--   1. anniversary_participants.team_pokemon TEXT[]  — 玩家 6 隻隊伍 ID 陣列
--   2. anniversary_battles.battle_state JSONB         — 1gen 戰鬥狀態（HP/PP/active/lineup）
--
-- 兼容性：
--   - 既有 participant 的 team_pokemon 預設只 backfill [partner_pokemon]，不強塞 5 隻
--   - 既有 battle 的 battle_state 保持 NULL → Phase 3 API 會走 legacy scripted_outcomes 路徑
--   - 新 battle 才填 battle_state → 走 1gen 邏輯
--
-- 可重複執行（IF NOT EXISTS / 條件式 UPDATE），失敗可重跑。

BEGIN;

-- 1) anniversary_participants：team_pokemon TEXT[] (6 隻 partner pool ID)
ALTER TABLE anniversary_participants
  ADD COLUMN IF NOT EXISTS team_pokemon TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Backfill：既有玩家若 team 是空，且已選 partner，把 partner 放進 team
UPDATE anniversary_participants
SET team_pokemon = ARRAY[partner_pokemon]
WHERE partner_pokemon IS NOT NULL
  AND (team_pokemon IS NULL OR cardinality(team_pokemon) = 0);

COMMENT ON COLUMN anniversary_participants.team_pokemon IS
  '玩家對戰隊伍（最多 6 隻 partner pool ID 陣列）。team_pokemon[0] 為主力。Phase 5 team-builder UI 會讓玩家補齊。';

-- 2) anniversary_battles：battle_state JSONB
ALTER TABLE anniversary_battles
  ADD COLUMN IF NOT EXISTS battle_state JSONB;

COMMENT ON COLUMN anniversary_battles.battle_state IS
  '1gen 對戰狀態 (Phase 3+)：{ player: { team: [{id,type,hp,maxHp,fainted}], activeIndex, pp: {moveId: number} }, opponent: { team:[...], activeIndex }, rngSeed, turn }。NULL = 走 legacy scripted_outcomes 邏輯（向後兼容）。';

COMMIT;

-- 驗證查詢（執行後自行確認）：
--   SELECT id, partner_pokemon, team_pokemon FROM anniversary_participants;
--   SELECT id, status, battle_state IS NULL AS legacy FROM anniversary_battles;
