-- Add the owner-provided Kiyu Eevee record to the distribution dex.
-- This is a site catalog entry, not a source-backed public event record.

ALTER TABLE public.distributions
  ADD COLUMN IF NOT EXISTS pokemon_sprite_url TEXT,
  ADD COLUMN IF NOT EXISTS event_name TEXT,
  ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

WITH source_rows AS (
  SELECT *
  FROM (
    VALUES
      (
        '伊布',
        'Eevee',
        133,
        9,
        ARRAY['朱', '紫']::TEXT[],
        'Kiyu',
        NULL::TEXT,
        NULL::INTEGER,
        'Site catalog entry',
        DATE '2026-05-22',
        NULL::DATE,
        'Taiwan',
        FALSE,
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png',
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png',
        NULL::TEXT,
        'Kiyu 的伊布',
        NULL::TEXT,
        5000
      )
  ) AS t(
    pokemon_name,
    pokemon_name_en,
    pokemon_dex_number,
    generation,
    game_titles,
    original_trainer,
    trainer_id,
    level,
    distribution_method,
    distribution_period_start,
    distribution_period_end,
    region,
    is_shiny,
    pokemon_sprite_url,
    image_url,
    wiki_url,
    event_name,
    special_move,
    points
  )
)
INSERT INTO public.distributions (
  pokemon_name,
  pokemon_name_en,
  pokemon_dex_number,
  generation,
  game_titles,
  original_trainer,
  trainer_id,
  level,
  distribution_method,
  distribution_period_start,
  distribution_period_end,
  region,
  is_shiny,
  pokemon_sprite_url,
  image_url,
  wiki_url,
  event_name,
  special_move,
  points
)
SELECT
  pokemon_name,
  pokemon_name_en,
  pokemon_dex_number,
  generation,
  game_titles,
  original_trainer,
  trainer_id,
  level,
  distribution_method,
  distribution_period_start,
  distribution_period_end,
  region,
  is_shiny,
  pokemon_sprite_url,
  image_url,
  wiki_url,
  event_name,
  special_move,
  points
FROM source_rows s
WHERE NOT EXISTS (
  SELECT 1
  FROM public.distributions d
  WHERE d.pokemon_name_en = s.pokemon_name_en
    AND COALESCE(d.event_name, '') = COALESCE(s.event_name, '')
    AND COALESCE(d.original_trainer, '') = COALESCE(s.original_trainer, '')
    AND d.distribution_period_start IS NOT DISTINCT FROM s.distribution_period_start
);
