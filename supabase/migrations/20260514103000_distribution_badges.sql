-- 配布圖鑑：獨立證章/緞帶目錄與附加關係
-- 證章本身是獨立收藏軸；附加到使用者持有的配布後，才提高該配布顯示價值。

CREATE TABLE IF NOT EXISTS distribution_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_en TEXT,
    category TEXT NOT NULL CHECK (category IN ('ribbon', 'mark')),
    generation INTEGER NOT NULL CHECK (generation >= 1 AND generation <= 9),
    min_generation INTEGER NOT NULL CHECK (min_generation >= 1 AND min_generation <= 9),
    max_generation INTEGER NOT NULL CHECK (max_generation >= 1 AND max_generation <= 9),
    release_year INTEGER CHECK (release_year >= 1996 AND release_year <= 2100),
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')),
    base_points INTEGER NOT NULL DEFAULT 0 CHECK (base_points >= 0),
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT distribution_badges_generation_range CHECK (min_generation <= max_generation),
    CONSTRAINT distribution_badges_unique_name_generation UNIQUE (name, generation, category)
);

CREATE TABLE IF NOT EXISTS user_distribution_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    user_distribution_id UUID REFERENCES user_distributions(id) ON DELETE CASCADE NOT NULL,
    badge_id UUID REFERENCES distribution_badges(id) ON DELETE CASCADE NOT NULL,
    attached_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    UNIQUE(user_distribution_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_distribution_badges_generation ON distribution_badges(generation);
CREATE INDEX IF NOT EXISTS idx_distribution_badges_rarity ON distribution_badges(rarity);
CREATE INDEX IF NOT EXISTS idx_user_distribution_badges_user ON user_distribution_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_distribution_badges_distribution ON user_distribution_badges(user_distribution_id);
CREATE INDEX IF NOT EXISTS idx_user_distribution_badges_badge ON user_distribution_badges(badge_id);

ALTER TABLE distribution_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_distribution_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "distribution_badges_read_all" ON distribution_badges
    FOR SELECT USING (true);

CREATE POLICY "user_distribution_badges_select_own" ON user_distribution_badges
    FOR SELECT USING (auth.uid() = user_id);

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
        )
    );

CREATE POLICY "user_distribution_badges_delete_own" ON user_distribution_badges
    FOR DELETE USING (auth.uid() = user_id);

INSERT INTO distribution_badges (
    name,
    name_en,
    category,
    generation,
    min_generation,
    max_generation,
    release_year,
    rarity,
    base_points,
    description,
    sort_order
) VALUES
    ('冠軍緞帶', 'Champion Ribbon', 'ribbon', 3, 3, 3, 2002, 'rare', 12000, '第三世代起具代表性的冠軍紀錄緞帶。', 3010),
    ('努力緞帶', 'Effort Ribbon', 'ribbon', 3, 3, 3, 2002, 'uncommon', 8000, '代表培育完成度的第三世代緞帶。', 3020),
    ('稀有紀念緞帶', 'Rare Commemorative Ribbon', 'ribbon', 3, 3, 3, 2005, 'epic', 32000, '早期活動或特殊紀念配布的高價值緞帶。', 3030),
    ('神奧冠軍緞帶', 'Sinnoh Champion Ribbon', 'ribbon', 4, 4, 4, 2006, 'rare', 15000, '第四世代神奧冠軍紀錄緞帶。', 4010),
    ('經典緞帶', 'Classic Ribbon', 'ribbon', 4, 4, 4, 2007, 'legendary', 65000, '常見於重要官方配布的代表性緞帶。', 4020),
    ('生日緞帶', 'Birthday Ribbon', 'ribbon', 4, 4, 4, 2008, 'epic', 36000, '生日主題配布常見的紀念緞帶。', 4030),
    ('合眾紀念緞帶', 'Unova Commemorative Ribbon', 'ribbon', 5, 5, 5, 2010, 'rare', 18000, '第五世代活動配布的世代紀念緞帶。', 5010),
    ('許願緞帶', 'Wishing Ribbon', 'ribbon', 5, 5, 5, 2011, 'epic', 42000, '帶有願望主題的高價值配布緞帶。', 5020),
    ('首映緞帶', 'Premier Ribbon', 'ribbon', 5, 5, 5, 2012, 'legendary', 70000, '大型活動或首映紀念配布的高稀有度緞帶。', 5030),
    ('卡洛斯冠軍緞帶', 'Kalos Champion Ribbon', 'ribbon', 6, 6, 6, 2013, 'rare', 20000, '第六世代卡洛斯冠軍紀錄緞帶。', 6010),
    ('活動緞帶', 'Event Ribbon', 'ribbon', 6, 6, 6, 2014, 'epic', 46000, '第六世代活動配布常見的價值加成緞帶。', 6020),
    ('祝賀緞帶', 'Celebration Ribbon', 'ribbon', 6, 6, 6, 2016, 'legendary', 76000, '週年或大型企劃紀念緞帶。', 6030),
    ('阿羅拉冠軍緞帶', 'Alola Champion Ribbon', 'ribbon', 7, 7, 7, 2016, 'rare', 22000, '第七世代阿羅拉冠軍紀錄緞帶。', 7010),
    ('大師等級緞帶', 'Master Rank Ribbon', 'ribbon', 7, 7, 7, 2017, 'epic', 52000, '對戰成就取向的高階緞帶。', 7020),
    ('節慶紀念緞帶', 'Festival Commemorative Ribbon', 'ribbon', 7, 7, 7, 2018, 'legendary', 82000, '第七世代節慶與紀念活動高價值緞帶。', 7030),
    ('伽勒爾冠軍緞帶', 'Galar Champion Ribbon', 'ribbon', 8, 8, 8, 2019, 'rare', 26000, '第八世代伽勒爾冠軍紀錄緞帶。', 8010),
    ('命運證章', 'Destiny Mark', 'mark', 8, 8, 8, 2019, 'epic', 56000, '第八世代起具代表性的特殊相遇證章。', 8020),
    ('稀有證章', 'Rare Mark', 'mark', 8, 8, 8, 2019, 'mythic', 140000, '低機率出現的高稀有度證章。', 8030),
    ('帕底亞冠軍緞帶', 'Paldea Champion Ribbon', 'ribbon', 9, 9, 9, 2022, 'rare', 30000, '第九世代帕底亞冠軍紀錄緞帶。', 9010),
    ('夥伴證章', 'Partner Mark', 'mark', 9, 9, 9, 2022, 'uncommon', 12000, '代表同行培養與個體故事的證章。', 9020),
    ('迷你證章', 'Mini Mark', 'mark', 9, 9, 9, 2022, 'epic', 62000, '尺寸稀有性帶來高價值加成的證章。', 9030),
    ('巨大證章', 'Jumbo Mark', 'mark', 9, 9, 9, 2022, 'epic', 62000, '尺寸稀有性帶來高價值加成的證章。', 9040),
    ('第九世代命運證章', 'Gen 9 Destiny Mark', 'mark', 9, 9, 9, 2022, 'legendary', 98000, '第九世代特殊日期與相遇條件的高價值證章。', 9050)
ON CONFLICT (name, generation, category) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    min_generation = EXCLUDED.min_generation,
    max_generation = EXCLUDED.max_generation,
    release_year = EXCLUDED.release_year,
    rarity = EXCLUDED.rarity,
    base_points = EXCLUDED.base_points,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order;
