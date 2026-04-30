-- Split Gen 5 Pokemon Global Link Eeveelution records by source version.
-- Source versions:
-- - JP: Pokemon Labyrinth / Daisuki Club, Global Link availability 2010-10-20 to 2011-01-31
-- - INT: Play to Befriend a Pokemon!, Global Link availability 2011-05-19 to 2011-07-19
-- - KR: Shany Pokemon Bread, Global Link availability 2011-05-18 to 2011-08-31

UPDATE public.distributions
SET
  event_name = 'Global Link INT: Play to Befriend a Pokemon!',
  distribution_method = 'Pokemon Global Link / Dream World',
  region = 'International',
  wiki_url = COALESCE(wiki_url, 'https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_Global_Link_promotions/Pok%C3%A9mon')
WHERE event_name = 'Global Link: Play to Befriend a Pokemon!'
  AND trainer_id = 'PGL2011BF';

WITH source_rows AS (
  SELECT *
  FROM (
    VALUES
      ('水伊布', 'Vaporeon', 134, 5, ARRAY['黑', '白']::TEXT[], 'PGL', 'PGL2010LAB', 10, 'Pokemon Global Link / Dream World', DATE '2010-10-20', DATE '2011-01-31', 'Japan', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/134.png', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/134.png', 'https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_Global_Link_promotions/Pok%C3%A9mon', 'Global Link JP: Pokemon Labyrinth', 'Hidden Ability: Hydration; Moves: Tail Whip, Tackle, Helping Hand, Sand Attack', 182000),
      ('雷伊布', 'Jolteon', 135, 5, ARRAY['黑', '白']::TEXT[], 'PGL', 'PGL2010LAB', 10, 'Pokemon Global Link / Dream World', DATE '2010-10-20', DATE '2011-01-31', 'Japan', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/135.png', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/135.png', 'https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_Global_Link_promotions/Pok%C3%A9mon', 'Global Link JP: Pokemon Labyrinth', 'Hidden Ability: Quick Feet; Moves: Tail Whip, Tackle, Helping Hand, Sand Attack', 186000),
      ('火伊布', 'Flareon', 136, 5, ARRAY['黑', '白']::TEXT[], 'PGL', 'PGL2010LAB', 10, 'Pokemon Global Link / Dream World', DATE '2010-10-20', DATE '2011-01-31', 'Japan', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/136.png', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/136.png', 'https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_Global_Link_promotions/Pok%C3%A9mon', 'Global Link JP: Pokemon Labyrinth', 'Hidden Ability: Guts; Moves: Tail Whip, Tackle, Helping Hand, Sand Attack', 184000),
      ('太陽伊布', 'Espeon', 196, 5, ARRAY['黑', '白']::TEXT[], 'PGL', 'PGL2010LAB', 10, 'Pokemon Global Link / Dream World', DATE '2010-10-20', DATE '2011-01-31', 'Japan', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/196.png', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/196.png', 'https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_Global_Link_promotions/Pok%C3%A9mon', 'Global Link JP: Pokemon Labyrinth', 'Hidden Ability: Magic Bounce; Moves: Tail Whip, Tackle, Helping Hand, Sand Attack', 189000),
      ('月亮伊布', 'Umbreon', 197, 5, ARRAY['黑', '白']::TEXT[], 'PGL', 'PGL2010LAB', 10, 'Pokemon Global Link / Dream World', DATE '2010-10-20', DATE '2011-01-31', 'Japan', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/197.png', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/197.png', 'https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_Global_Link_promotions/Pok%C3%A9mon', 'Global Link JP: Pokemon Labyrinth', 'Hidden Ability: Inner Focus; Moves: Tail Whip, Tackle, Helping Hand, Sand Attack', 191000),
      ('葉伊布', 'Leafeon', 470, 5, ARRAY['黑', '白']::TEXT[], 'PGL', 'PGL2010LAB', 10, 'Pokemon Global Link / Dream World', DATE '2010-10-20', DATE '2011-01-31', 'Japan', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/470.png', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/470.png', 'https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_Global_Link_promotions/Pok%C3%A9mon', 'Global Link JP: Pokemon Labyrinth', 'Hidden Ability: Chlorophyll; Moves: Tail Whip, Tackle, Helping Hand, Sand Attack', 188000),
      ('冰伊布', 'Glaceon', 471, 5, ARRAY['黑', '白']::TEXT[], 'PGL', 'PGL2010LAB', 10, 'Pokemon Global Link / Dream World', DATE '2010-10-20', DATE '2011-01-31', 'Japan', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/471.png', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/471.png', 'https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_Global_Link_promotions/Pok%C3%A9mon', 'Global Link JP: Pokemon Labyrinth', 'Hidden Ability: Ice Body; Moves: Tail Whip, Tackle, Helping Hand, Sand Attack', 190000),
      ('水伊布', 'Vaporeon', 134, 5, ARRAY['黑', '白', '黑2', '白2']::TEXT[], 'PGL', 'PGL2011KR', 10, 'Pokemon Global Link / Dream World', DATE '2011-05-18', DATE '2011-08-31', 'Korea', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/134.png', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/134.png', 'https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_Global_Link_promotions/Pok%C3%A9mon', 'Global Link KR: Shany Pokemon Bread', 'Hidden Ability: Hydration; Moves: Tail Whip, Tackle, Helping Hand, Sand Attack', 172000),
      ('雷伊布', 'Jolteon', 135, 5, ARRAY['黑', '白', '黑2', '白2']::TEXT[], 'PGL', 'PGL2011KR', 10, 'Pokemon Global Link / Dream World', DATE '2011-05-18', DATE '2011-08-31', 'Korea', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/135.png', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/135.png', 'https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_Global_Link_promotions/Pok%C3%A9mon', 'Global Link KR: Shany Pokemon Bread', 'Hidden Ability: Quick Feet; Moves: Tail Whip, Tackle, Helping Hand, Sand Attack', 176000),
      ('火伊布', 'Flareon', 136, 5, ARRAY['黑', '白', '黑2', '白2']::TEXT[], 'PGL', 'PGL2011KR', 10, 'Pokemon Global Link / Dream World', DATE '2011-05-18', DATE '2011-08-31', 'Korea', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/136.png', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/136.png', 'https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_Global_Link_promotions/Pok%C3%A9mon', 'Global Link KR: Shany Pokemon Bread', 'Hidden Ability: Guts; Moves: Tail Whip, Tackle, Helping Hand, Sand Attack', 174000),
      ('太陽伊布', 'Espeon', 196, 5, ARRAY['黑', '白', '黑2', '白2']::TEXT[], 'PGL', 'PGL2011KR', 10, 'Pokemon Global Link / Dream World', DATE '2011-05-18', DATE '2011-08-31', 'Korea', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/196.png', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/196.png', 'https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_Global_Link_promotions/Pok%C3%A9mon', 'Global Link KR: Shany Pokemon Bread', 'Hidden Ability: Magic Bounce; Moves: Tail Whip, Tackle, Helping Hand, Sand Attack', 179000),
      ('月亮伊布', 'Umbreon', 197, 5, ARRAY['黑', '白', '黑2', '白2']::TEXT[], 'PGL', 'PGL2011KR', 10, 'Pokemon Global Link / Dream World', DATE '2011-05-18', DATE '2011-08-31', 'Korea', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/197.png', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/197.png', 'https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_Global_Link_promotions/Pok%C3%A9mon', 'Global Link KR: Shany Pokemon Bread', 'Hidden Ability: Inner Focus; Moves: Tail Whip, Tackle, Helping Hand, Sand Attack', 181000),
      ('葉伊布', 'Leafeon', 470, 5, ARRAY['黑', '白', '黑2', '白2']::TEXT[], 'PGL', 'PGL2011KR', 10, 'Pokemon Global Link / Dream World', DATE '2011-05-18', DATE '2011-08-31', 'Korea', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/470.png', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/470.png', 'https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_Global_Link_promotions/Pok%C3%A9mon', 'Global Link KR: Shany Pokemon Bread', 'Hidden Ability: Chlorophyll; Moves: Tail Whip, Tackle, Helping Hand, Sand Attack', 178000),
      ('冰伊布', 'Glaceon', 471, 5, ARRAY['黑', '白', '黑2', '白2']::TEXT[], 'PGL', 'PGL2011KR', 10, 'Pokemon Global Link / Dream World', DATE '2011-05-18', DATE '2011-08-31', 'Korea', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/471.png', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/471.png', 'https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_Global_Link_promotions/Pok%C3%A9mon', 'Global Link KR: Shany Pokemon Bread', 'Hidden Ability: Ice Body; Moves: Tail Whip, Tackle, Helping Hand, Sand Attack', 180000)
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
