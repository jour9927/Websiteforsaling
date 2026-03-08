-- =====================================================
-- 留言按讚/倒讚功能 (Comment Reactions)
-- =====================================================

-- 1. 擴充 profile_comments 表格加入快取欄位
ALTER TABLE profile_comments
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dislikes_count INTEGER DEFAULT 0;

-- 2. 建立 comment_reactions 表格
CREATE TABLE IF NOT EXISTS comment_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES profile_comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    virtual_user_id UUID REFERENCES virtual_profiles(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    -- 確保 user_id 和 virtual_user_id 不能同時為空，也不能同時有值
    CONSTRAINT check_reaction_user CHECK (
        (user_id IS NOT NULL AND virtual_user_id IS NULL) OR
        (user_id IS NULL AND virtual_user_id IS NOT NULL)
    )
);

-- 建立唯一索引：防止同一用戶對同一則留言重複表達相同或不同的表態（按讚/倒讚互斥）
CREATE UNIQUE INDEX IF NOT EXISTS idx_comment_reactions_user 
    ON comment_reactions(comment_id, user_id) 
    WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_comment_reactions_virtual 
    ON comment_reactions(comment_id, virtual_user_id) 
    WHERE virtual_user_id IS NOT NULL;

-- 建立索引加速查詢
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON comment_reactions(comment_id);

-- 開啟 RLS
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "reactions_select_all" ON comment_reactions FOR SELECT USING (true);

-- 登入用戶可以操作自己的 reactions
CREATE POLICY "reactions_insert_own" ON comment_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions_update_own" ON comment_reactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reactions_delete_own" ON comment_reactions FOR DELETE USING (auth.uid() = user_id);

-- Service role 可以操作虛擬用戶的 reactions
CREATE POLICY "service_role_all_reactions" ON comment_reactions FOR ALL USING (true);


-- 3. 建立操作反應的 RPC 函數 (原子性更新)
CREATE OR REPLACE FUNCTION toggle_comment_reaction(
    p_comment_id UUID,
    p_user_id UUID,
    p_virtual_user_id UUID,
    p_reaction_type TEXT -- 'like' 或 'dislike'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_reaction TEXT;
    v_likes_diff INTEGER := 0;
    v_dislikes_diff INTEGER := 0;
    v_action TEXT;
    v_final_likes INTEGER;
    v_final_dislikes INTEGER;
BEGIN
    -- 確保只傳入一種 user id
    IF p_user_id IS NOT NULL AND p_virtual_user_id IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot specify both user_id and virtual_user_id';
    END IF;
    IF p_user_id IS NULL AND p_virtual_user_id IS NULL THEN
        RAISE EXCEPTION 'Must specify either user_id or virtual_user_id';
    END IF;
    IF p_reaction_type NOT IN ('like', 'dislike') THEN
        RAISE EXCEPTION 'reaction_type must be like or dislike';
    END IF;

    -- 檢查是否已有反應
    IF p_user_id IS NOT NULL THEN
        SELECT reaction_type INTO v_existing_reaction 
        FROM comment_reactions 
        WHERE comment_id = p_comment_id AND user_id = p_user_id;
    ELSE
        SELECT reaction_type INTO v_existing_reaction 
        FROM comment_reactions 
        WHERE comment_id = p_comment_id AND virtual_user_id = p_virtual_user_id;
    END IF;

    -- 邏輯判斷
    IF v_existing_reaction IS NULL THEN
        -- 1. 新增反應
        IF p_user_id IS NOT NULL THEN
            INSERT INTO comment_reactions (comment_id, user_id, reaction_type) VALUES (p_comment_id, p_user_id, p_reaction_type);
        ELSE
            INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type) VALUES (p_comment_id, p_virtual_user_id, p_reaction_type);
        END IF;

        IF p_reaction_type = 'like' THEN v_likes_diff := 1; ELSE v_dislikes_diff := 1; END IF;
        v_action := 'added';

    ELSIF v_existing_reaction = p_reaction_type THEN
        -- 2. 取消反應 (再次點擊相同按鈕)
        IF p_user_id IS NOT NULL THEN
            DELETE FROM comment_reactions WHERE comment_id = p_comment_id AND user_id = p_user_id;
        ELSE
            DELETE FROM comment_reactions WHERE comment_id = p_comment_id AND virtual_user_id = p_virtual_user_id;
        END IF;

        IF p_reaction_type = 'like' THEN v_likes_diff := -1; ELSE v_dislikes_diff := -1; END IF;
        v_action := 'removed';

    ELSE
        -- 3. 切換反應 (like -> dislike 或者是 dislike -> like)
        IF p_user_id IS NOT NULL THEN
            UPDATE comment_reactions SET reaction_type = p_reaction_type WHERE comment_id = p_comment_id AND user_id = p_user_id;
        ELSE
            UPDATE comment_reactions SET reaction_type = p_reaction_type WHERE comment_id = p_comment_id AND virtual_user_id = p_virtual_user_id;
        END IF;

        IF p_reaction_type = 'like' THEN 
            v_likes_diff := 1; 
            v_dislikes_diff := -1; 
        ELSE 
            v_likes_diff := -1; 
            v_dislikes_diff := 1; 
        END IF;
        v_action := 'switched';
    END IF;

    -- 更新快取總數並取得最新值
    UPDATE profile_comments 
    SET 
        likes_count = GREATEST(0, COALESCE(likes_count, 0) + v_likes_diff),
        dislikes_count = GREATEST(0, COALESCE(dislikes_count, 0) + v_dislikes_diff)
    WHERE id = p_comment_id
    RETURNING likes_count, dislikes_count INTO v_final_likes, v_final_dislikes;

    -- 若找不到該筆貼文，返回錯誤
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Comment not found';
    END IF;

    RETURN json_build_object(
        'action', v_action,
        'likes_count', v_final_likes,
        'dislikes_count', v_final_dislikes,
        'current_reaction', CASE WHEN v_action = 'removed' THEN null ELSE p_reaction_type END
    )::jsonb;
END;
$$;
