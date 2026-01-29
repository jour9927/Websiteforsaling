-- 配布圖鑑資料表
-- 儲存歷史寶可夢配布資料

-- 配布資料主表
CREATE TABLE IF NOT EXISTS distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pokemon_name TEXT NOT NULL,
    pokemon_name_en TEXT,
    pokemon_dex_number INTEGER,
    generation INTEGER NOT NULL CHECK (generation >= 1 AND generation <= 9),
    game_titles TEXT[],
    original_trainer TEXT,
    trainer_id TEXT,
    level INTEGER,
    distribution_method TEXT,
    distribution_period_start DATE,
    distribution_period_end DATE,
    region TEXT,
    image_url TEXT,
    wiki_url TEXT,
    is_shiny BOOLEAN DEFAULT FALSE,
    special_move TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用戶收集記錄表
CREATE TABLE IF NOT EXISTS user_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    distribution_id UUID REFERENCES distributions(id) ON DELETE CASCADE NOT NULL,
    obtained_at TIMESTAMPTZ DEFAULT NOW(),
    serial_code TEXT,
    notes TEXT,
    UNIQUE(user_id, distribution_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_distributions_generation ON distributions(generation);
CREATE INDEX IF NOT EXISTS idx_distributions_pokemon ON distributions(pokemon_name);
CREATE INDEX IF NOT EXISTS idx_user_distributions_user ON user_distributions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_distributions_distribution ON user_distributions(distribution_id);

-- 開啟 RLS
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_distributions ENABLE ROW LEVEL SECURITY;

-- distributions 表：所有人可讀
CREATE POLICY "distributions_read_all" ON distributions
    FOR SELECT USING (true);

-- user_distributions 表：用戶只能操作自己的記錄
CREATE POLICY "user_distributions_select_own" ON user_distributions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_distributions_insert_own" ON user_distributions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_distributions_delete_own" ON user_distributions
    FOR DELETE USING (auth.uid() = user_id);
