-- 30th Anniversary Overhaul: 7 days × 3 battles/day = 21 total
-- New challenge types: dice, trivia, slots
-- Partner pokemon, win tracking, unlock conditions

-- Add new columns to anniversary_participants
ALTER TABLE anniversary_participants
  ADD COLUMN IF NOT EXISTS partner_pokemon TEXT,
  ADD COLUMN IF NOT EXISTS total_wins INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS win_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_win_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS partner_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS second_pokemon_unlocked BOOLEAN NOT NULL DEFAULT FALSE;

-- Add new columns to anniversary_battles
ALTER TABLE anniversary_battles
  ADD COLUMN IF NOT EXISTS challenge_type TEXT NOT NULL DEFAULT 'dice',
  ADD COLUMN IF NOT EXISTS script_mode TEXT NOT NULL DEFAULT 'A',
  ADD COLUMN IF NOT EXISTS scripted_outcomes JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS opponent_name TEXT NOT NULL DEFAULT '對手',
  ADD COLUMN IF NOT EXISTS opponent_pokemon TEXT NOT NULL DEFAULT '皮卡丘',
  ADD COLUMN IF NOT EXISTS opponent_sprite_id TEXT NOT NULL DEFAULT '25',
  ADD COLUMN IF NOT EXISTS current_round INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS player_score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS opponent_score INTEGER NOT NULL DEFAULT 0;

-- Add round_result to anniversary_battle_rounds
ALTER TABLE anniversary_battle_rounds
  ADD COLUMN IF NOT EXISTS round_result TEXT;

-- Update campaign: 3 battles per day, new start time
UPDATE anniversary_campaigns
SET
  battles_per_day = 3,
  title = '30 週年寶可夢對決祭典',
  description = '選擇你的夥伴寶可夢，在七天對決中並肩作戰！7 天 × 每天 3 場，共 21 場對決。',
  starts_at = '2026-03-20 20:00:00+08',
  ends_at = '2026-03-27 23:59:59+08',
  updated_at = NOW()
WHERE slug = 'guardian-trial-30th';
