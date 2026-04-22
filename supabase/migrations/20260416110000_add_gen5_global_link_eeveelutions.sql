-- 補齊 Gen5 Global Link 伊布進化型配布資料
-- 來源分類：
-- 1) Global Link Eeveelution Labyrinth（7 筆）
-- 2) Play to Befriend a Pokemon 第 1 彈（7 筆）
-- 3) Play to Befriend a Pokemon 第 2 彈（7 筆）
-- 共 21 筆，使用去重條件避免重複插入

WITH source_rows AS (
  SELECT *
  FROM (
    VALUES
      -- Global Link Eeveelution Labyrinth (2010-10-20 ~ 2011-01-31)
      ('水伊布', 'Vaporeon', 134, 5, ARRAY['黑', '白']::TEXT[], 'PGL', 'PGL2010LAB', 10, 'Pokémon Global Link', DATE '2010-10-20', DATE '2011-01-31', 'Japan', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/134.png', 'Global Link：Eeveelution Labyrinth', 162000),
      ('雷伊布', 'Jolteon', 135, 5, ARRAY['黑', '白']::TEXT[], 'PGL', 'PGL2010LAB', 10, 'Pokémon Global Link', DATE '2010-10-20', DATE '2011-01-31', 'Japan', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/135.png', 'Global Link：Eeveelution Labyrinth', 166000),
      ('火伊布', 'Flareon', 136, 5, ARRAY['黑', '白']::TEXT[], 'PGL', 'PGL2010LAB', 10, 'Pokémon Global Link', DATE '2010-10-20', DATE '2011-01-31', 'Japan', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/136.png', 'Global Link：Eeveelution Labyrinth', 164000),
      ('太陽伊布', 'Espeon', 196, 5, ARRAY['黑', '白']::TEXT[], 'PGL', 'PGL2010LAB', 10, 'Pokémon Global Link', DATE '2010-10-20', DATE '2011-01-31', 'Japan', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/196.png', 'Global Link：Eeveelution Labyrinth', 169000),
      ('月亮伊布', 'Umbreon', 197, 5, ARRAY['黑', '白']::TEXT[], 'PGL', 'PGL2010LAB', 10, 'Pokémon Global Link', DATE '2010-10-20', DATE '2011-01-31', 'Japan', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/197.png', 'Global Link：Eeveelution Labyrinth', 171000),
      ('葉伊布', 'Leafeon', 470, 5, ARRAY['黑', '白']::TEXT[], 'PGL', 'PGL2010LAB', 10, 'Pokémon Global Link', DATE '2010-10-20', DATE '2011-01-31', 'Japan', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/470.png', 'Global Link：Eeveelution Labyrinth', 167000),
      ('冰伊布', 'Glaceon', 471, 5, ARRAY['黑', '白']::TEXT[], 'PGL', 'PGL2010LAB', 10, 'Pokémon Global Link', DATE '2010-10-20', DATE '2011-01-31', 'Japan', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/471.png', 'Global Link：Eeveelution Labyrinth', 168000),

      -- Play to Befriend a Pokemon 第 1 彈 (2013-11-29 ~ 2014-01-31)
      ('水伊布', 'Vaporeon', 134, 5, ARRAY['黑2', '白2']::TEXT[], 'PGL', 'PGL2013BF1', 10, 'Pokémon Global Link', DATE '2013-11-29', DATE '2014-01-31', 'Japan', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/134.png', 'Global Link：Play to Befriend a Pokemon（第1彈）', 184000),
      ('雷伊布', 'Jolteon', 135, 5, ARRAY['黑2', '白2']::TEXT[], 'PGL', 'PGL2013BF1', 10, 'Pokémon Global Link', DATE '2013-11-29', DATE '2014-01-31', 'Japan', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/135.png', 'Global Link：Play to Befriend a Pokemon（第1彈）', 188000),
      ('火伊布', 'Flareon', 136, 5, ARRAY['黑2', '白2']::TEXT[], 'PGL', 'PGL2013BF1', 10, 'Pokémon Global Link', DATE '2013-11-29', DATE '2014-01-31', 'Japan', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/136.png', 'Global Link：Play to Befriend a Pokemon（第1彈）', 186000),
      ('太陽伊布', 'Espeon', 196, 5, ARRAY['黑2', '白2']::TEXT[], 'PGL', 'PGL2013BF1', 10, 'Pokémon Global Link', DATE '2013-11-29', DATE '2014-01-31', 'Japan', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/196.png', 'Global Link：Play to Befriend a Pokemon（第1彈）', 191000),
      ('月亮伊布', 'Umbreon', 197, 5, ARRAY['黑2', '白2']::TEXT[], 'PGL', 'PGL2013BF1', 10, 'Pokémon Global Link', DATE '2013-11-29', DATE '2014-01-31', 'Japan', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/197.png', 'Global Link：Play to Befriend a Pokemon（第1彈）', 193000),
      ('葉伊布', 'Leafeon', 470, 5, ARRAY['黑2', '白2']::TEXT[], 'PGL', 'PGL2013BF1', 10, 'Pokémon Global Link', DATE '2013-11-29', DATE '2014-01-31', 'Japan', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/470.png', 'Global Link：Play to Befriend a Pokemon（第1彈）', 189000),
      ('冰伊布', 'Glaceon', 471, 5, ARRAY['黑2', '白2']::TEXT[], 'PGL', 'PGL2013BF1', 10, 'Pokémon Global Link', DATE '2013-11-29', DATE '2014-01-31', 'Japan', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/471.png', 'Global Link：Play to Befriend a Pokemon（第1彈）', 190000),

      -- Play to Befriend a Pokemon 第 2 彈 (2014-05-08 ~ 2014-07-31)
      ('水伊布', 'Vaporeon', 134, 5, ARRAY['黑2', '白2']::TEXT[], 'PGL', 'PGL2014BF2', 10, 'Pokémon Global Link', DATE '2014-05-08', DATE '2014-07-31', 'Japan', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/134.png', 'Global Link：Play to Befriend a Pokemon（第2彈）', 186000),
      ('雷伊布', 'Jolteon', 135, 5, ARRAY['黑2', '白2']::TEXT[], 'PGL', 'PGL2014BF2', 10, 'Pokémon Global Link', DATE '2014-05-08', DATE '2014-07-31', 'Japan', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/135.png', 'Global Link：Play to Befriend a Pokemon（第2彈）', 190000),
      ('火伊布', 'Flareon', 136, 5, ARRAY['黑2', '白2']::TEXT[], 'PGL', 'PGL2014BF2', 10, 'Pokémon Global Link', DATE '2014-05-08', DATE '2014-07-31', 'Japan', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/136.png', 'Global Link：Play to Befriend a Pokemon（第2彈）', 188000),
      ('太陽伊布', 'Espeon', 196, 5, ARRAY['黑2', '白2']::TEXT[], 'PGL', 'PGL2014BF2', 10, 'Pokémon Global Link', DATE '2014-05-08', DATE '2014-07-31', 'Japan', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/196.png', 'Global Link：Play to Befriend a Pokemon（第2彈）', 194000),
      ('月亮伊布', 'Umbreon', 197, 5, ARRAY['黑2', '白2']::TEXT[], 'PGL', 'PGL2014BF2', 10, 'Pokémon Global Link', DATE '2014-05-08', DATE '2014-07-31', 'Japan', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/197.png', 'Global Link：Play to Befriend a Pokemon（第2彈）', 196000),
      ('葉伊布', 'Leafeon', 470, 5, ARRAY['黑2', '白2']::TEXT[], 'PGL', 'PGL2014BF2', 10, 'Pokémon Global Link', DATE '2014-05-08', DATE '2014-07-31', 'Japan', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/470.png', 'Global Link：Play to Befriend a Pokemon（第2彈）', 192000),
      ('冰伊布', 'Glaceon', 471, 5, ARRAY['黑2', '白2']::TEXT[], 'PGL', 'PGL2014BF2', 10, 'Pokémon Global Link', DATE '2014-05-08', DATE '2014-07-31', 'Japan', FALSE, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/471.png', 'Global Link：Play to Befriend a Pokemon（第2彈）', 193000)
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
    event_name,
    points
  )
),
inserted AS (
  INSERT INTO distributions (
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
    event_name,
    points
  )
  SELECT
    s.pokemon_name,
    s.pokemon_name_en,
    s.pokemon_dex_number,
    s.generation,
    s.game_titles,
    s.original_trainer,
    s.trainer_id,
    s.level,
    s.distribution_method,
    s.distribution_period_start,
    s.distribution_period_end,
    s.region,
    s.is_shiny,
    s.pokemon_sprite_url,
    s.event_name,
    s.points
  FROM source_rows s
  WHERE NOT EXISTS (
    SELECT 1
    FROM distributions d
    WHERE d.pokemon_name = s.pokemon_name
      AND COALESCE(d.event_name, '') = COALESCE(s.event_name, '')
      AND COALESCE(d.trainer_id, '') = COALESCE(s.trainer_id, '')
      AND d.distribution_period_start IS NOT DISTINCT FROM s.distribution_period_start
      AND d.distribution_period_end IS NOT DISTINCT FROM s.distribution_period_end
  )
  RETURNING id
)
SELECT COUNT(*) AS inserted_count
FROM inserted;
