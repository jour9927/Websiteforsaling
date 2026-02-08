-- 公眾形象功能資料庫結構

-- 1. 公眾形象名表（用戶的暱稱和認可度）
CREATE TABLE IF NOT EXISTS public_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    nickname VARCHAR(50),           -- 公眾形象名
    approval_rate INTEGER DEFAULT 0 CHECK (approval_rate >= 0 AND approval_rate <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 公眾認知表（評論和投票百分比）
CREATE TABLE IF NOT EXISTS public_perceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content VARCHAR(100) NOT NULL,   -- 評論內容
    agree_rate INTEGER DEFAULT 0 CHECK (agree_rate >= 0 AND agree_rate <= 100),
    disagree_rate INTEGER DEFAULT 0 CHECK (disagree_rate >= 0 AND disagree_rate <= 100),
    participation_rate INTEGER DEFAULT 0 CHECK (participation_rate >= 0 AND participation_rate <= 100),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 建立索引
CREATE INDEX IF NOT EXISTS idx_public_images_user_id ON public_images(user_id);
CREATE INDEX IF NOT EXISTS idx_public_perceptions_user_id ON public_perceptions(user_id);

-- 4. RLS 政策
ALTER TABLE public_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_perceptions ENABLE ROW LEVEL SECURITY;

-- 所有人可以讀取
CREATE POLICY "public_images_select_all" ON public_images FOR SELECT USING (true);
CREATE POLICY "public_perceptions_select_all" ON public_perceptions FOR SELECT USING (true);

-- service_role 可以插入/更新/刪除（管理員用）
CREATE POLICY "public_images_admin_all" ON public_images FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_perceptions_admin_all" ON public_perceptions FOR ALL USING (true) WITH CHECK (true);
