-- Source-backed Pokemon Global Link / Dream World Eeveelutions for future auctions.
-- References:
-- - Serebii: Pokemon Black & White - Pokemon Global Link - Dream World Event Pokemon
-- - Bulbanews: Eevee's evolutions now available on Global Link

WITH source_rows AS (
  SELECT *
  FROM (
    VALUES
      ('水伊布', 'Vaporeon', 134, 5, ARRAY['黑', '白']::TEXT[], 'PGL', 'PGL2011BF', 10, 'Pokemon Global Link / Dream World', DATE '2011-05-19', DATE '2011-07-19', 'International', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/134.png', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/134.png', 'https://www.serebii.net/blackwhite/dreamworldpokemon.shtml', 'Global Link: Play to Befriend a Pokemon!', 'Hidden Ability: Hydration; Moves: Tail Whip, Tackle, Helping Hand, Sand Attack', 162000),
      ('雷伊布', 'Jolteon', 135, 5, ARRAY['黑', '白']::TEXT[], 'PGL', 'PGL2011BF', 10, 'Pokemon Global Link / Dream World', DATE '2011-05-19', DATE '2011-07-19', 'International', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/135.png', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/135.png', 'https://www.serebii.net/blackwhite/dreamworldpokemon.shtml', 'Global Link: Play to Befriend a Pokemon!', 'Hidden Ability: Quick Feet; Moves: Tail Whip, Tackle, Helping Hand, Sand Attack', 166000),
      ('火伊布', 'Flareon', 136, 5, ARRAY['黑', '白']::TEXT[], 'PGL', 'PGL2011BF', 10, 'Pokemon Global Link / Dream World', DATE '2011-05-19', DATE '2011-07-19', 'International', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/136.png', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/136.png', 'https://www.serebii.net/blackwhite/dreamworldpokemon.shtml', 'Global Link: Play to Befriend a Pokemon!', 'Hidden Ability: Guts; Moves: Tail Whip, Tackle, Helping Hand, Sand Attack', 164000),
      ('太陽伊布', 'Espeon', 196, 5, ARRAY['黑', '白']::TEXT[], 'PGL', 'PGL2011BF', 10, 'Pokemon Global Link / Dream World', DATE '2011-05-19', DATE '2011-07-19', 'International', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/196.png', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/196.png', 'https://www.serebii.net/blackwhite/dreamworldpokemon.shtml', 'Global Link: Play to Befriend a Pokemon!', 'Hidden Ability: Magic Bounce; Moves: Tail Whip, Tackle, Helping Hand, Sand Attack', 169000),
      ('月亮伊布', 'Umbreon', 197, 5, ARRAY['黑', '白']::TEXT[], 'PGL', 'PGL2011BF', 10, 'Pokemon Global Link / Dream World', DATE '2011-05-19', DATE '2011-07-19', 'International', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/197.png', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/197.png', 'https://www.serebii.net/blackwhite/dreamworldpokemon.shtml', 'Global Link: Play to Befriend a Pokemon!', 'Hidden Ability: Inner Focus; Moves: Tail Whip, Tackle, Helping Hand, Sand Attack', 171000),
      ('葉伊布', 'Leafeon', 470, 5, ARRAY['黑', '白']::TEXT[], 'PGL', 'PGL2011BF', 10, 'Pokemon Global Link / Dream World', DATE '2011-05-19', DATE '2011-07-19', 'International', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/470.png', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/470.png', 'https://www.serebii.net/blackwhite/dreamworldpokemon.shtml', 'Global Link: Play to Befriend a Pokemon!', 'Hidden Ability: Chlorophyll; Moves: Tail Whip, Tackle, Helping Hand, Sand Attack', 168000),
      ('冰伊布', 'Glaceon', 471, 5, ARRAY['黑', '白']::TEXT[], 'PGL', 'PGL2011BF', 10, 'Pokemon Global Link / Dream World', DATE '2011-05-19', DATE '2011-07-19', 'International', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/471.png', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/471.png', 'https://www.serebii.net/blackwhite/dreamworldpokemon.shtml', 'Global Link: Play to Befriend a Pokemon!', 'Hidden Ability: Ice Body; Moves: Tail Whip, Tackle, Helping Hand, Sand Attack', 170000)
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
    AND COALESCE(d.trainer_id, '') = COALESCE(s.trainer_id, '')
    AND d.distribution_period_start IS NOT DISTINCT FROM s.distribution_period_start
    AND d.distribution_period_end IS NOT DISTINCT FROM s.distribution_period_end
);
