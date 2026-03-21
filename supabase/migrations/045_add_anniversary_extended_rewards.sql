-- Migration: Add extended milestone rewards to anniversary_participants
-- 7 wins: title_unlocked
-- 9 wins: third_pokemon_unlocked
-- 12 wins: master_ball_unlocked
-- 15 wins: legendary_unlocked

ALTER TABLE anniversary_participants
ADD COLUMN IF NOT EXISTS title_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS third_pokemon_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS master_ball_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS legendary_unlocked BOOLEAN NOT NULL DEFAULT FALSE;
