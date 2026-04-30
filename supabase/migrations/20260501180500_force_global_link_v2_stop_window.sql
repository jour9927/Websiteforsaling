-- Global Link v2 virtual bidding must keep running until the final 3 seconds.

UPDATE public.auctions
SET automation_stop_seconds = 3
WHERE automation_mode = 'global_link_v2'
  AND automation_stop_seconds <> 3;

ALTER TABLE public.auctions
  DROP CONSTRAINT IF EXISTS auctions_global_link_v2_stop_seconds_check;

ALTER TABLE public.auctions
  ADD CONSTRAINT auctions_global_link_v2_stop_seconds_check
  CHECK (automation_mode <> 'global_link_v2' OR automation_stop_seconds = 3);
