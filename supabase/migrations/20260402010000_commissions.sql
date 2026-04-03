DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'commission_status'
  ) THEN
    CREATE TYPE commission_status AS ENUM (
      'pending_review',
      'queued',
      'open',
      'awaiting_seller_confirmation',
      'in_progress',
      'completed',
      'rejected',
      'cancelled'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_id UUID NOT NULL
    CONSTRAINT commissions_distribution_id_fkey REFERENCES distributions(id) ON DELETE RESTRICT,
  created_by UUID NOT NULL
    CONSTRAINT commissions_created_by_fkey REFERENCES profiles(id) ON DELETE CASCADE,
  accepted_by UUID
    CONSTRAINT commissions_accepted_by_fkey REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  proof_links TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  seller_fee_percent SMALLINT NOT NULL DEFAULT 0,
  executor_fee_percent SMALLINT,
  executor_fee_approved BOOLEAN NOT NULL DEFAULT FALSE,
  is_first_time_client BOOLEAN NOT NULL DEFAULT TRUE,
  deposit_details TEXT,
  processing_date DATE NOT NULL,
  status commission_status NOT NULL DEFAULT 'pending_review',
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT commissions_title_length CHECK (char_length(trim(title)) BETWEEN 2 AND 120),
  CONSTRAINT commissions_description_length CHECK (char_length(trim(description)) BETWEEN 10 AND 2000),
  CONSTRAINT commissions_proof_links_not_empty CHECK (cardinality(proof_links) > 0),
  CONSTRAINT commissions_seller_fee_range CHECK (seller_fee_percent BETWEEN 0 AND 80),
  CONSTRAINT commissions_executor_fee_range CHECK (
    executor_fee_percent IS NULL OR executor_fee_percent BETWEEN 0 AND 80
  ),
  CONSTRAINT commissions_first_time_deposit_required CHECK (
    NOT is_first_time_client OR (
      deposit_details IS NOT NULL AND char_length(trim(deposit_details)) > 0
    )
  ),
  CONSTRAINT commissions_accepted_fields_consistent CHECK (
    (accepted_by IS NULL AND accepted_at IS NULL) OR
    (accepted_by IS NOT NULL AND accepted_at IS NOT NULL)
  ),
  CONSTRAINT commissions_completed_at_consistent CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR
    (status <> 'completed' AND completed_at IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_processing_date ON commissions(processing_date);
CREATE INDEX IF NOT EXISTS idx_commissions_created_by ON commissions(created_by);
CREATE INDEX IF NOT EXISTS idx_commissions_accepted_by ON commissions(accepted_by);
CREATE INDEX IF NOT EXISTS idx_commissions_distribution_id ON commissions(distribution_id);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON commissions(created_at DESC);

CREATE OR REPLACE FUNCTION assign_commission_processing_slot()
RETURNS TRIGGER AS $$
DECLARE
  target_date DATE := timezone('Asia/Taipei', NOW())::DATE;
  today_in_taipei DATE := timezone('Asia/Taipei', NOW())::DATE;
  existing_count INTEGER;
BEGIN
  PERFORM pg_advisory_xact_lock(2026040201);

  IF NEW.processing_date IS NULL THEN
    LOOP
      SELECT COUNT(*)
      INTO existing_count
      FROM commissions
      WHERE processing_date = target_date;

      EXIT WHEN existing_count < 5;
      target_date := target_date + 1;
    END LOOP;

    NEW.processing_date := target_date;
  END IF;

  IF NEW.status IS NULL OR NEW.status IN ('pending_review', 'queued') THEN
    NEW.status := CASE
      WHEN NEW.processing_date = today_in_taipei THEN 'pending_review'
      ELSE 'queued'
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS commissions_assign_processing_slot ON commissions;
CREATE TRIGGER commissions_assign_processing_slot
  BEFORE INSERT ON commissions
  FOR EACH ROW
  EXECUTE FUNCTION assign_commission_processing_slot();

DROP TRIGGER IF EXISTS commissions_set_updated_at ON commissions;
CREATE TRIGGER commissions_set_updated_at
  BEFORE UPDATE ON commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commission_creators_and_assignees_can_view"
  ON commissions FOR SELECT
  USING (
    auth.uid() = created_by OR
    auth.uid() = accepted_by OR
    is_admin(auth.uid())
  );

CREATE POLICY "commission_creators_can_insert"
  ON commissions FOR INSERT
  WITH CHECK (auth.uid() = created_by);
