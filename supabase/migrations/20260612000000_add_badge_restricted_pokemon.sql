-- 為需要特定寶可夢限制的證章加入白名單
-- 目前用於最強證章 (Mightiest Mark)：只有官方 7星太晶團體戰活動 Pokemon 才能附加

ALTER TABLE distribution_badges ADD COLUMN IF NOT EXISTS restricted_pokemon TEXT[] DEFAULT NULL;

-- 最強證章 (Mightiest Mark) 限制清單：僅限官方 7星太晶團體戰活動 Pokémon
-- 資料來源：Bulbapedia Tera Raid Battle - 7★ Raids
-- 共 45 種獨特 Pokémon（重複活動取 unique）
UPDATE distribution_badges
SET restricted_pokemon = ARRAY[
    'Charizard',
    'Cinderace',
    'Greninja',
    'Pikachu',
    'Samurott',
    'Decidueye',
    'Typhlosion',
    'Blaziken',
    'Empoleon',
    'Iron Bundle',
    'Meganium',
    'Torterra',
    'Feraligatr',
    'Infernape',
    'Meowscarada',
    'Skeledirge',
    'Quaquaval',
    'Dragonite',
    'Dondozo',
    'Sceptile',
    'Emboar',
    'Swampert',
    'Primarina',
    'Venusaur',
    'Blastoise',
    'Delphox',
    'Chesnaught',
    'Inteleon',
    'Rillaboom',
    'Mewtwo',
    'Eevee',
    'Serperior',
    'Incineroar',
    'Garchomp',
    'Metagross',
    'Salamence',
    'Tyranitar',
    'Kommo-o',
    'Baxcalibur',
    'Porygon2',
    'Roaring Moon',
    'Iron Valiant',
    'Hydreigon',
    'Goodra',
    'Dragapult'
]
WHERE name_en = 'Mightiest Mark';

-- 同時更新 RLS policy：INSERT 時也檢查 restricted_pokemon 相容性（如果有的話）
DROP POLICY IF EXISTS "user_distribution_badges_insert_own_compatible" ON user_distribution_badges;

CREATE POLICY "user_distribution_badges_insert_own_compatible" ON user_distribution_badges
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1
            FROM user_distributions ud
            JOIN distributions d ON d.id = ud.distribution_id
            JOIN distribution_badges b ON b.id = badge_id
            WHERE ud.id = user_distribution_id
                AND ud.user_id = auth.uid()
                AND d.generation BETWEEN b.min_generation AND b.max_generation
                AND (
                    b.restricted_pokemon IS NULL
                    OR d.pokemon_name = ANY(b.restricted_pokemon)
                    OR d.pokemon_name_en = ANY(b.restricted_pokemon)
                )
        )
    );
