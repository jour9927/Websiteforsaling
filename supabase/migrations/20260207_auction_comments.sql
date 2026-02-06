-- 建立 auction_comments 留言表
CREATE TABLE IF NOT EXISTS auction_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    user_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立索引
CREATE INDEX idx_auction_comments_auction_id ON auction_comments(auction_id);
CREATE INDEX idx_auction_comments_created_at ON auction_comments(created_at DESC);

-- RLS 政策
ALTER TABLE auction_comments ENABLE ROW LEVEL SECURITY;

-- 所有人可以讀取留言
CREATE POLICY "Anyone can read auction comments" ON auction_comments
    FOR SELECT USING (true);

-- 登入用戶可以新增留言
CREATE POLICY "Authenticated users can insert comments" ON auction_comments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 用戶只能刪除自己的留言
CREATE POLICY "Users can delete own comments" ON auction_comments
    FOR DELETE USING (auth.uid() = user_id);
