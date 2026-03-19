-- Raise 30th anniversary contract fees from 2700 to 2990.
-- This migration updates defaults for future rows and current campaign pricing.

ALTER TABLE anniversary_campaigns
  ALTER COLUMN entry_fee SET DEFAULT 2990,
  ALTER COLUMN additional_fee SET DEFAULT 2990;

ALTER TABLE anniversary_participants
  ALTER COLUMN entry_fee_amount SET DEFAULT 2990;

ALTER TABLE anniversary_contracts
  ALTER COLUMN price SET DEFAULT 2990;

UPDATE anniversary_campaigns
SET
  entry_fee = 2990,
  additional_fee = 2990,
  description = CASE
    WHEN description IS NULL THEN NULL
    ELSE replace(description, '2700', '2990')
  END
WHERE slug = 'guardian-trial-30th';
