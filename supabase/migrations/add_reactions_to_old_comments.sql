-- =============================================
-- 為所有 0 讚 0 倒讚的留言隨機灌入互動資料
-- =============================================
DO $$
DECLARE
    v_comment RECORD;
    v_virtual_user RECORD;
    v_like_count INTEGER;
    v_dislike_count INTEGER;
    v_total INTEGER;
    v_counter INTEGER;
    v_used_ids UUID[];
BEGIN
    -- 遍歷所有 pop 頁面上 likes=0 且 dislikes=0 的留言
    FOR v_comment IN 
        SELECT id FROM profile_comments 
        WHERE profile_user_id = '8f2a2fb5-0d9b-41fe-b890-c899618abffd'
          AND (likes_count = 0 OR likes_count IS NULL)
          AND (dislikes_count = 0 OR dislikes_count IS NULL)
          AND NOT EXISTS (
              SELECT 1 FROM comment_reactions cr WHERE cr.comment_id = profile_comments.id
          )
    LOOP
        -- 隨機決定讚數 (8~22) 和倒讚數 (0~3)
        v_like_count := 8 + floor(random() * 15)::int;
        v_dislike_count := floor(random() * 4)::int;
        v_total := v_like_count + v_dislike_count;
        v_counter := 0;
        v_used_ids := ARRAY[]::UUID[];

        -- 隨機抽取虛擬用戶來按讚/倒讚
        FOR v_virtual_user IN 
            SELECT id FROM virtual_profiles 
            ORDER BY random() 
            LIMIT v_total
        LOOP
            v_counter := v_counter + 1;
            
            -- 檢查是否已經對這則留言反應過（避免重複）
            IF NOT EXISTS (
                SELECT 1 FROM comment_reactions 
                WHERE comment_id = v_comment.id 
                AND virtual_user_id = v_virtual_user.id
            ) THEN
                IF v_counter <= v_like_count THEN
                    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
                    VALUES (v_comment.id, v_virtual_user.id, 'like');
                ELSE
                    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
                    VALUES (v_comment.id, v_virtual_user.id, 'dislike');
                END IF;
            END IF;
        END LOOP;

        -- 更新快取計數
        UPDATE profile_comments 
        SET likes_count = (
                SELECT COUNT(*) FROM comment_reactions 
                WHERE comment_id = v_comment.id AND reaction_type = 'like'
            ),
            dislikes_count = (
                SELECT COUNT(*) FROM comment_reactions 
                WHERE comment_id = v_comment.id AND reaction_type = 'dislike'
            )
        WHERE id = v_comment.id;

    END LOOP;

    RAISE NOTICE 'Done! All zero-reaction comments now have reactions.';
END $$;
