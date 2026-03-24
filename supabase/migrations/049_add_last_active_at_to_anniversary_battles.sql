ALTER TABLE anniversary_battles
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

UPDATE anniversary_battles
SET last_active_at = COALESCE(last_active_at, ended_at, started_at, created_at)
WHERE last_active_at IS NULL;

ALTER TABLE anniversary_battles
  ALTER COLUMN last_active_at SET DEFAULT NOW();
