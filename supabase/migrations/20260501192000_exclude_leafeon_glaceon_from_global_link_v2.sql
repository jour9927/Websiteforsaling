-- Remove Leafeon and Glaceon from the Global Link v2 auction pipeline.
-- Their distribution dex records remain available, but they should not use v2 automation.

UPDATE public.auctions a
SET
  automation_mode = 'legacy',
  automation_disclosure = NULL,
  automation_stop_seconds = 30
FROM public.distributions d
WHERE a.distribution_id = d.id
  AND a.automation_mode = 'global_link_v2'
  AND (
    d.pokemon_name_en IN ('Leafeon', 'Glaceon')
    OR d.pokemon_name IN ('葉伊布', '冰伊布')
  );
