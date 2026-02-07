-- 虛擬用戶資料表
-- 用於模擬出價、留言等功能，讓模擬用戶可以點擊查看個人頁

-- 建立虛擬用戶表
CREATE TABLE IF NOT EXISTS virtual_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL,           -- 顯示名稱（如：王**、L***）
    avatar_seed TEXT,                      -- 用於生成頭像的種子
    member_since DATE DEFAULT '2024-01-01', -- 加入日期
    collection_count INTEGER DEFAULT 0,   -- 收藏數量
    bid_count INTEGER DEFAULT 0,          -- 參與競標次數
    is_virtual BOOLEAN DEFAULT true,      -- 標記為虛擬用戶
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 啟用 RLS
ALTER TABLE virtual_profiles ENABLE ROW LEVEL SECURITY;

-- 所有人可讀取虛擬用戶
CREATE POLICY "Anyone can read virtual profiles"
    ON virtual_profiles FOR SELECT
    USING (true);

-- 插入預設虛擬用戶（20位）
INSERT INTO virtual_profiles (display_name, avatar_seed, member_since, collection_count, bid_count) VALUES
    ('王**', 'wang01', '2024-03-15', 8, 12),
    ('李**', 'li02', '2024-05-22', 15, 8),
    ('陳**', 'chen03', '2024-01-08', 22, 15),
    ('林**', 'lin04', '2024-07-19', 5, 6),
    ('張**', 'zhang05', '2024-02-28', 18, 20),
    ('黃**', 'huang06', '2024-09-11', 3, 4),
    ('劉**', 'liu07', '2024-04-05', 12, 9),
    ('楊**', 'yang08', '2024-06-30', 9, 11),
    ('吳**', 'wu09', '2024-08-14', 7, 5),
    ('蔡**', 'cai10', '2024-10-22', 11, 7),
    ('P***', 'poke01', '2024-02-14', 25, 18),
    ('S***', 'shin02', '2024-04-20', 14, 10),
    ('M***', 'master03', '2024-06-08', 8, 6),
    ('T***', 'trainer04', '2024-08-25', 19, 14),
    ('A***', 'ace05', '2024-01-30', 6, 8),
    ('K***', 'king06', '2024-03-12', 10, 12),
    ('R***', 'rain07', '2024-05-18', 4, 3),
    ('小**', 'xiao01', '2024-07-07', 16, 9),
    ('大**', 'da02', '2024-09-28', 2, 2),
    ('阿**', 'a03', '2024-11-15', 13, 11);
