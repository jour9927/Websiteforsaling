-- Lock Global Link v2 auction slots to 10-minute rounds.

ALTER TABLE public.auction_automation_v2_schedule_slots
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 10;

ALTER TABLE public.auction_automation_v2_schedule_slots
  DROP CONSTRAINT IF EXISTS auction_automation_v2_schedule_slots_duration_check;

ALTER TABLE public.auction_automation_v2_schedule_slots
  ADD CONSTRAINT auction_automation_v2_schedule_slots_duration_check
  CHECK (duration_minutes = 10);

UPDATE public.auction_automation_v2_schedule_slots
SET duration_minutes = 10
WHERE auction_family = 'global_link_eeveelution';
