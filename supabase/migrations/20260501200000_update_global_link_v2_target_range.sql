-- Raise Global Link v2 auction pacing target to the new operating range.

ALTER TABLE public.auctions
  ALTER COLUMN automation_target_min SET DEFAULT 39000,
  ALTER COLUMN automation_target_max SET DEFAULT 45000;

UPDATE public.auctions
SET automation_target_min = 39000,
    automation_target_max = 45000
WHERE automation_mode = 'global_link_v2'
  AND automation_target_min = 35000
  AND automation_target_max = 40000;
