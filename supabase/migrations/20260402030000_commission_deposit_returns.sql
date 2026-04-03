ALTER TABLE commissions
ADD COLUMN IF NOT EXISTS deposit_returned_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'commissions_deposit_returned_at_consistent'
  ) THEN
    ALTER TABLE commissions
    ADD CONSTRAINT commissions_deposit_returned_at_consistent CHECK (
      deposit_returned_at IS NULL OR (
        is_first_time_client = TRUE AND
        completed_at IS NOT NULL AND
        deposit_returned_at >= completed_at
      )
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_commissions_deposit_returned_at
  ON commissions(deposit_returned_at DESC);
