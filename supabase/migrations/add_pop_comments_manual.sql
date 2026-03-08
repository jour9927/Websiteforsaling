
-- =========================================
-- 自動產生：為 user pop 增加 20 則留言與按讚紀錄
-- 繞過 Supabase REST API Cache 問題
-- =========================================
DO $$
DECLARE
    v_comment_id UUID;
BEGIN

    -- 插入留言 "看了你的首頁，覺得這..."
    INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
    VALUES ('8f2a2fb5-0d9b-41fe-b890-c899618abffd', 'b1ce4b04-3141-4689-952b-41e712b28c78', '看了你的首頁，覺得這些收藏真的太壯觀了！', '2026-02-28T15:10:36.776Z', 19, 1, true)
    RETURNING id INTO v_comment_id;

    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '376cfb65-86e1-43d3-9289-1b6674020343', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7fa859d2-d71c-4220-8108-6e37d43bafd8', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '16b75429-39e9-4963-afe0-19589ddaae30', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '24ac4ae3-8945-4c91-a699-5b7ad294a384', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '01c75475-b8ec-4bf8-8bcc-f59b5c40e5eb', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'c044cac1-b88d-44ce-acdb-c619719dbbc1', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'ec52d34d-d7ee-475d-b728-539bf84aae40', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '1f70aacb-d8d2-47d2-b2c0-87ed6506ffaa', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd8038469-2bed-45bb-9263-11888faf5fc5', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '56d39cdd-7c04-45e2-92a2-147790d12bb1', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'ab92879a-801b-4c56-afec-50e319409a9c', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'aed4dd6e-f4fb-472a-934c-e10c8a918cf8', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '895d02a4-6c11-457d-b817-87870ac14fbb', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '80e8463b-6cfd-4e4c-bce9-d2bc0dd87843', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'b865c1de-35a0-4a86-852d-f756b8cc61ed', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd689caa0-68f8-4d33-bd3b-2f55d11b368f', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7f831690-d812-45a8-a54a-89901a6aec61', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7cdb1269-8444-4d9f-bff4-c926e0c3b70c', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'b02c6d92-557a-491f-b6bb-61e26662a109', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '34e47a26-c946-4e8f-be38-a0e8750c55fb', 'dislike');

    -- 插入留言 "配布量400+真的太..."
    INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
    VALUES ('8f2a2fb5-0d9b-41fe-b890-c899618abffd', '34e47a26-c946-4e8f-be38-a0e8750c55fb', '配布量400+真的太狂啦！我也想開始收集了 😂', '2026-03-05T08:10:36.776Z', 16, 2, true)
    RETURNING id INTO v_comment_id;

    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '5f102d3f-6a1b-4cbc-a13a-06f8f2b16195', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd54ec27e-654b-4879-8f63-8b7cceb950d5', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7cdb1269-8444-4d9f-bff4-c926e0c3b70c', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '3d82cd25-0600-464a-836c-a126eceab084', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'ec52d34d-d7ee-475d-b728-539bf84aae40', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '376cfb65-86e1-43d3-9289-1b6674020343', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd689caa0-68f8-4d33-bd3b-2f55d11b368f', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '16b75429-39e9-4963-afe0-19589ddaae30', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'c5343e5e-38b3-4e7e-af42-eebe0b6c7ebc', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '8707eb03-9082-42c1-98a1-0057b2d011d4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '8694869e-21db-483f-be22-1a750d65ebf7', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '4b4facae-2768-48dc-9024-cfae5934de5d', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '10465d36-0388-447b-ad6c-b08ae9b6c6ab', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'f95350d8-28be-4ebd-81cd-fac4ec2a7580', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7078025a-474b-4c82-8950-ea4c01684a89', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '18b0422f-5774-44cc-8b64-913eb9b072b4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'a992292a-f02e-4be5-ae8a-3cbb39356983', 'dislike');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '5dbb2cfc-eb77-407b-94d0-89c218b991aa', 'dislike');

    -- 插入留言 "請問這些稀有配布都是..."
    INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
    VALUES ('8f2a2fb5-0d9b-41fe-b890-c899618abffd', 'a992292a-f02e-4be5-ae8a-3cbb39356983', '請問這些稀有配布都是哪裡換到的呀？好奇~', '2026-02-27T20:10:36.776Z', 20, 2, true)
    RETURNING id INTO v_comment_id;

    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '56d39cdd-7c04-45e2-92a2-147790d12bb1', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '24ac4ae3-8945-4c91-a699-5b7ad294a384', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '586ba402-9e9c-4a65-9eec-5c4336f3f386', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'a24c0e92-a12a-4426-9b53-b6d237e91a40', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '8707eb03-9082-42c1-98a1-0057b2d011d4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '3d82cd25-0600-464a-836c-a126eceab084', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '17b4a500-ba24-44fa-be69-0836af9314b1', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'aed4dd6e-f4fb-472a-934c-e10c8a918cf8', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'f95350d8-28be-4ebd-81cd-fac4ec2a7580', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '9f7b0c04-c63f-49d3-9859-0403157e50d7', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '80e8463b-6cfd-4e4c-bce9-d2bc0dd87843', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '239183e3-8c27-4117-93a0-bf654eca2638', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7fa859d2-d71c-4220-8108-6e37d43bafd8', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'ffd4f16b-d2dc-4ef3-8e82-c67b2c1301e4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'db2aa12d-3537-4699-a0c6-bbc20d7ad3a2', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '4b4facae-2768-48dc-9024-cfae5934de5d', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '44a3ee54-441b-44e6-8f70-c4e365dd14cd', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'c1263dcf-2c69-453e-a625-f6ff61b17e79', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '34e47a26-c946-4e8f-be38-a0e8750c55fb', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'b1ce4b04-3141-4689-952b-41e712b28c78', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7cdb1269-8444-4d9f-bff4-c926e0c3b70c', 'dislike');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'b02c6d92-557a-491f-b6bb-61e26662a109', 'dislike');

    -- 插入留言 "神仙排版！個人頁面用..."
    INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
    VALUES ('8f2a2fb5-0d9b-41fe-b890-c899618abffd', 'c044cac1-b88d-44ce-acdb-c619719dbbc1', '神仙排版！個人頁面用這背景音樂也好搭，是哪一版的配樂？', '2026-03-03T22:10:36.776Z', 19, 0, true)
    RETURNING id INTO v_comment_id;

    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '17b4a500-ba24-44fa-be69-0836af9314b1', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd8038469-2bed-45bb-9263-11888faf5fc5', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd397793d-f04a-438c-9a6c-ee0613597f25', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '8707eb03-9082-42c1-98a1-0057b2d011d4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'ab92879a-801b-4c56-afec-50e319409a9c', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'b02c6d92-557a-491f-b6bb-61e26662a109', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '9f7b0c04-c63f-49d3-9859-0403157e50d7', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '24ac4ae3-8945-4c91-a699-5b7ad294a384', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '16b75429-39e9-4963-afe0-19589ddaae30', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'db2aa12d-3537-4699-a0c6-bbc20d7ad3a2', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd8749cc1-a3d2-4957-9733-996a82d23c0b', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'a92eb104-676a-4c9e-9d2f-02d635f0fbc4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '3d82cd25-0600-464a-836c-a126eceab084', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7cdb1269-8444-4d9f-bff4-c926e0c3b70c', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '1b5c11ab-201d-44ac-824f-0eb7a79e2cf7', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '80e8463b-6cfd-4e4c-bce9-d2bc0dd87843', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'c5343e5e-38b3-4e7e-af42-eebe0b6c7ebc', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'f95350d8-28be-4ebd-81cd-fac4ec2a7580', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'a992292a-f02e-4be5-ae8a-3cbb39356983', 'like');

    -- 插入留言 "有看到好多我以前沒追..."
    INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
    VALUES ('8f2a2fb5-0d9b-41fe-b890-c899618abffd', '65285ec1-4b08-4f05-b367-e11b4d64e28d', '有看到好多我以前沒追到的活動配布，已羨慕 😍', '2026-03-06T19:10:36.777Z', 16, 2, true)
    RETURNING id INTO v_comment_id;

    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd54ec27e-654b-4879-8f63-8b7cceb950d5', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '1f70aacb-d8d2-47d2-b2c0-87ed6506ffaa', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '376cfb65-86e1-43d3-9289-1b6674020343', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '16b75429-39e9-4963-afe0-19589ddaae30', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '5dbb2cfc-eb77-407b-94d0-89c218b991aa', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'c5343e5e-38b3-4e7e-af42-eebe0b6c7ebc', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7078025a-474b-4c82-8950-ea4c01684a89', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'b1ce4b04-3141-4689-952b-41e712b28c78', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '01c75475-b8ec-4bf8-8bcc-f59b5c40e5eb', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '17b4a500-ba24-44fa-be69-0836af9314b1', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '488c4d50-4a8f-43b4-92b2-3feb583632fc', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'a92eb104-676a-4c9e-9d2f-02d635f0fbc4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'b865c1de-35a0-4a86-852d-f756b8cc61ed', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd689caa0-68f8-4d33-bd3b-2f55d11b368f', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '6ae9a5c5-6da7-45bc-800d-e5276dc50089', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '84df84d5-644f-4937-b540-cb3d73700344', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '18b0422f-5774-44cc-8b64-913eb9b072b4', 'dislike');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '8694869e-21db-483f-be22-1a750d65ebf7', 'dislike');

    -- 插入留言 "好想要夢幻和雪拉比啊..."
    INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
    VALUES ('8f2a2fb5-0d9b-41fe-b890-c899618abffd', '34e47a26-c946-4e8f-be38-a0e8750c55fb', '好想要夢幻和雪拉比啊！大大之後有考慮開交換會嗎？', '2026-03-06T14:10:36.777Z', 16, 2, true)
    RETURNING id INTO v_comment_id;

    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '9f7b0c04-c63f-49d3-9859-0403157e50d7', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '488c4d50-4a8f-43b4-92b2-3feb583632fc', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'a992292a-f02e-4be5-ae8a-3cbb39356983', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'aed4dd6e-f4fb-472a-934c-e10c8a918cf8', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7cdb1269-8444-4d9f-bff4-c926e0c3b70c', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'b02c6d92-557a-491f-b6bb-61e26662a109', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7f831690-d812-45a8-a54a-89901a6aec61', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'b865c1de-35a0-4a86-852d-f756b8cc61ed', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '56d39cdd-7c04-45e2-92a2-147790d12bb1', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'bd21abc1-62a4-4677-8a21-f209d263693a', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'b1ce4b04-3141-4689-952b-41e712b28c78', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd54ec27e-654b-4879-8f63-8b7cceb950d5', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'a92eb104-676a-4c9e-9d2f-02d635f0fbc4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'bca23e5e-b4f1-438d-9ecd-3aae12d98dd4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '18b0422f-5774-44cc-8b64-913eb9b072b4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'c5343e5e-38b3-4e7e-af42-eebe0b6c7ebc', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '87d264cd-f0f9-4ff1-a487-5cb9570f481f', 'dislike');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '586ba402-9e9c-4a65-9eec-5c4336f3f386', 'dislike');

    -- 插入留言 "這收藏完整度絕對是繁..."
    INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
    VALUES ('8f2a2fb5-0d9b-41fe-b890-c899618abffd', '7cdb1269-8444-4d9f-bff4-c926e0c3b70c', '這收藏完整度絕對是繁中圈數一數二的了吧！', '2026-03-02T17:10:36.777Z', 24, 2, true)
    RETURNING id INTO v_comment_id;

    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '87d264cd-f0f9-4ff1-a487-5cb9570f481f', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7f831690-d812-45a8-a54a-89901a6aec61', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '376cfb65-86e1-43d3-9289-1b6674020343', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'ab92879a-801b-4c56-afec-50e319409a9c', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '4b4facae-2768-48dc-9024-cfae5934de5d', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'c5d3f769-e7f5-4c87-bc50-7c31b29e30f7', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '17b4a500-ba24-44fa-be69-0836af9314b1', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '84df84d5-644f-4937-b540-cb3d73700344', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '586ba402-9e9c-4a65-9eec-5c4336f3f386', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '5dbb2cfc-eb77-407b-94d0-89c218b991aa', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd54ec27e-654b-4879-8f63-8b7cceb950d5', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7078025a-474b-4c82-8950-ea4c01684a89', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'db2aa12d-3537-4699-a0c6-bbc20d7ad3a2', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '1f70aacb-d8d2-47d2-b2c0-87ed6506ffaa', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'c1263dcf-2c69-453e-a625-f6ff61b17e79', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'b02c6d92-557a-491f-b6bb-61e26662a109', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '9f7b0c04-c63f-49d3-9859-0403157e50d7', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7fa859d2-d71c-4220-8108-6e37d43bafd8', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '239183e3-8c27-4117-93a0-bf654eca2638', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd8749cc1-a3d2-4957-9733-996a82d23c0b', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7495d413-30b5-4132-a298-5b8195e0692b', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '44a3ee54-441b-44e6-8f70-c4e365dd14cd', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '24ac4ae3-8945-4c91-a699-5b7ad294a384', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd689caa0-68f8-4d33-bd3b-2f55d11b368f', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '8707eb03-9082-42c1-98a1-0057b2d011d4', 'dislike');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '4b4977c5-4a4c-4f35-b3a3-e85181f919aa', 'dislike');

    -- 插入留言 "我是從巴哈看到連結點..."
    INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
    VALUES ('8f2a2fb5-0d9b-41fe-b890-c899618abffd', '8694869e-21db-483f-be22-1a750d65ebf7', '我是從巴哈看到連結點進來的，真的大開眼界！', '2026-02-28T09:10:36.777Z', 14, 0, true)
    RETURNING id INTO v_comment_id;

    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '4b4facae-2768-48dc-9024-cfae5934de5d', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '84df84d5-644f-4937-b540-cb3d73700344', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7495d413-30b5-4132-a298-5b8195e0692b', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd8749cc1-a3d2-4957-9733-996a82d23c0b', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'bd21abc1-62a4-4677-8a21-f209d263693a', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'bca23e5e-b4f1-438d-9ecd-3aae12d98dd4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '01c75475-b8ec-4bf8-8bcc-f59b5c40e5eb', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '17b4a500-ba24-44fa-be69-0836af9314b1', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'b02c6d92-557a-491f-b6bb-61e26662a109', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'a992292a-f02e-4be5-ae8a-3cbb39356983', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '80e8463b-6cfd-4e4c-bce9-d2bc0dd87843', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '376cfb65-86e1-43d3-9289-1b6674020343', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'c044cac1-b88d-44ce-acdb-c619719dbbc1', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '5dbb2cfc-eb77-407b-94d0-89c218b991aa', 'like');

    -- 插入留言 "原來配布還有分這麼多..."
    INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
    VALUES ('8f2a2fb5-0d9b-41fe-b890-c899618abffd', 'f95350d8-28be-4ebd-81cd-fac4ec2a7580', '原來配布還有分這麼多種語系和初訓家，受教了！', '2026-02-26T22:10:36.777Z', 14, 1, true)
    RETURNING id INTO v_comment_id;

    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '4b4facae-2768-48dc-9024-cfae5934de5d', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '18b0422f-5774-44cc-8b64-913eb9b072b4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '10465d36-0388-447b-ad6c-b08ae9b6c6ab', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'b02c6d92-557a-491f-b6bb-61e26662a109', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '6ae9a5c5-6da7-45bc-800d-e5276dc50089', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'c1263dcf-2c69-453e-a625-f6ff61b17e79', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'a92eb104-676a-4c9e-9d2f-02d635f0fbc4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'c5d3f769-e7f5-4c87-bc50-7c31b29e30f7', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '87d264cd-f0f9-4ff1-a487-5cb9570f481f', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7cdb1269-8444-4d9f-bff4-c926e0c3b70c', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '80e8463b-6cfd-4e4c-bce9-d2bc0dd87843', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '16b75429-39e9-4963-afe0-19589ddaae30', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'a24c0e92-a12a-4426-9b53-b6d237e91a40', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '3d82cd25-0600-464a-836c-a126eceab084', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '586ba402-9e9c-4a65-9eec-5c4336f3f386', 'dislike');

    -- 插入留言 "膜拜神佬！(拜)..."
    INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
    VALUES ('8f2a2fb5-0d9b-41fe-b890-c899618abffd', '5dbb2cfc-eb77-407b-94d0-89c218b991aa', '膜拜神佬！(拜)', '2026-02-26T18:10:36.777Z', 21, 3, true)
    RETURNING id INTO v_comment_id;

    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'db2aa12d-3537-4699-a0c6-bbc20d7ad3a2', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '87d264cd-f0f9-4ff1-a487-5cb9570f481f', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '17b4a500-ba24-44fa-be69-0836af9314b1', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'aed4dd6e-f4fb-472a-934c-e10c8a918cf8', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'f837d0c0-1aaf-4679-807e-96b4266f1f7a', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '2204e75a-ea47-451e-bde5-d4c2bfe1708d', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '1b5c11ab-201d-44ac-824f-0eb7a79e2cf7', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'b02c6d92-557a-491f-b6bb-61e26662a109', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '239183e3-8c27-4117-93a0-bf654eca2638', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'c044cac1-b88d-44ce-acdb-c619719dbbc1', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'b865c1de-35a0-4a86-852d-f756b8cc61ed', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'a24c0e92-a12a-4426-9b53-b6d237e91a40', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '488c4d50-4a8f-43b4-92b2-3feb583632fc', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '4b4977c5-4a4c-4f35-b3a3-e85181f919aa', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'a92eb104-676a-4c9e-9d2f-02d635f0fbc4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '56d39cdd-7c04-45e2-92a2-147790d12bb1', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '8707eb03-9082-42c1-98a1-0057b2d011d4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'b1ce4b04-3141-4689-952b-41e712b28c78', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'c5d3f769-e7f5-4c87-bc50-7c31b29e30f7', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'c1263dcf-2c69-453e-a625-f6ff61b17e79', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7cdb1269-8444-4d9f-bff4-c926e0c3b70c', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'bca23e5e-b4f1-438d-9ecd-3aae12d98dd4', 'dislike');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '895d02a4-6c11-457d-b817-87870ac14fbb', 'dislike');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '24ac4ae3-8945-4c91-a699-5b7ad294a384', 'dislike');

    -- 插入留言 "這數量太誇張了，整理..."
    INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
    VALUES ('8f2a2fb5-0d9b-41fe-b890-c899618abffd', 'c5d3f769-e7f5-4c87-bc50-7c31b29e30f7', '這數量太誇張了，整理起來一定超花時間的吧？辛苦了！', '2026-02-28T13:10:36.777Z', 15, 1, true)
    RETURNING id INTO v_comment_id;

    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'a92eb104-676a-4c9e-9d2f-02d635f0fbc4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '5dbb2cfc-eb77-407b-94d0-89c218b991aa', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'a992292a-f02e-4be5-ae8a-3cbb39356983', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'ab92879a-801b-4c56-afec-50e319409a9c', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd54ec27e-654b-4879-8f63-8b7cceb950d5', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'b02c6d92-557a-491f-b6bb-61e26662a109', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '4b4facae-2768-48dc-9024-cfae5934de5d', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '01c75475-b8ec-4bf8-8bcc-f59b5c40e5eb', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'bca23e5e-b4f1-438d-9ecd-3aae12d98dd4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '1f70aacb-d8d2-47d2-b2c0-87ed6506ffaa', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd397793d-f04a-438c-9a6c-ee0613597f25', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'a24c0e92-a12a-4426-9b53-b6d237e91a40', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7078025a-474b-4c82-8950-ea4c01684a89', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '84df84d5-644f-4937-b540-cb3d73700344', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '17b4a500-ba24-44fa-be69-0836af9314b1', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '376cfb65-86e1-43d3-9289-1b6674020343', 'dislike');

    -- 插入留言 "希望能多拍一些色違的..."
    INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
    VALUES ('8f2a2fb5-0d9b-41fe-b890-c899618abffd', 'c044cac1-b88d-44ce-acdb-c619719dbbc1', '希望能多拍一些色違的展示影片！超愛看！', '2026-03-04T01:10:36.777Z', 16, 1, true)
    RETURNING id INTO v_comment_id;

    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd8749cc1-a3d2-4957-9733-996a82d23c0b', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'f837d0c0-1aaf-4679-807e-96b4266f1f7a', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '1f70aacb-d8d2-47d2-b2c0-87ed6506ffaa', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '80e8463b-6cfd-4e4c-bce9-d2bc0dd87843', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '3d82cd25-0600-464a-836c-a126eceab084', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'f95350d8-28be-4ebd-81cd-fac4ec2a7580', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '56d39cdd-7c04-45e2-92a2-147790d12bb1', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'bca23e5e-b4f1-438d-9ecd-3aae12d98dd4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'b865c1de-35a0-4a86-852d-f756b8cc61ed', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '17b4a500-ba24-44fa-be69-0836af9314b1', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '4b4facae-2768-48dc-9024-cfae5934de5d', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '8707eb03-9082-42c1-98a1-0057b2d011d4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'b1ce4b04-3141-4689-952b-41e712b28c78', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7cdb1269-8444-4d9f-bff4-c926e0c3b70c', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd8038469-2bed-45bb-9263-11888faf5fc5', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '84df84d5-644f-4937-b540-cb3d73700344', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'c5d3f769-e7f5-4c87-bc50-7c31b29e30f7', 'dislike');

    -- 插入留言 "路過幫推，期待之後持..."
    INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
    VALUES ('8f2a2fb5-0d9b-41fe-b890-c899618abffd', 'ab92879a-801b-4c56-afec-50e319409a9c', '路過幫推，期待之後持續更新！', '2026-03-01T03:10:36.777Z', 12, 1, true)
    RETURNING id INTO v_comment_id;

    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '5f102d3f-6a1b-4cbc-a13a-06f8f2b16195', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '376cfb65-86e1-43d3-9289-1b6674020343', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'b02c6d92-557a-491f-b6bb-61e26662a109', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'b1ce4b04-3141-4689-952b-41e712b28c78', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '5dbb2cfc-eb77-407b-94d0-89c218b991aa', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '80e8463b-6cfd-4e4c-bce9-d2bc0dd87843', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'aed4dd6e-f4fb-472a-934c-e10c8a918cf8', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '1f70aacb-d8d2-47d2-b2c0-87ed6506ffaa', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'ffd4f16b-d2dc-4ef3-8e82-c67b2c1301e4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd54ec27e-654b-4879-8f63-8b7cceb950d5', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '4b4facae-2768-48dc-9024-cfae5934de5d', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '17b4a500-ba24-44fa-be69-0836af9314b1', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd397793d-f04a-438c-9a6c-ee0613597f25', 'dislike');

    -- 插入留言 "請問新手如果想入坑配..."
    INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
    VALUES ('8f2a2fb5-0d9b-41fe-b890-c899618abffd', 'c044cac1-b88d-44ce-acdb-c619719dbbc1', '請問新手如果想入坑配布收集，建議從哪幾隻開始起手呢？', '2026-03-06T03:10:36.777Z', 8, 3, true)
    RETURNING id INTO v_comment_id;

    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '239183e3-8c27-4117-93a0-bf654eca2638', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '5dbb2cfc-eb77-407b-94d0-89c218b991aa', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '586ba402-9e9c-4a65-9eec-5c4336f3f386', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '3d82cd25-0600-464a-836c-a126eceab084', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '2204e75a-ea47-451e-bde5-d4c2bfe1708d', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'f95350d8-28be-4ebd-81cd-fac4ec2a7580', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '895d02a4-6c11-457d-b817-87870ac14fbb', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '84df84d5-644f-4937-b540-cb3d73700344', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd8749cc1-a3d2-4957-9733-996a82d23c0b', 'dislike');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7cdb1269-8444-4d9f-bff4-c926e0c3b70c', 'dislike');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '17b4a500-ba24-44fa-be69-0836af9314b1', 'dislike');

    -- 插入留言 "太讚啦！看到這麼多當..."
    INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
    VALUES ('8f2a2fb5-0d9b-41fe-b890-c899618abffd', 'aed4dd6e-f4fb-472a-934c-e10c8a918cf8', '太讚啦！看到這麼多當年的回憶都湧上心頭了 QQ', '2026-02-24T23:10:36.777Z', 21, 2, true)
    RETURNING id INTO v_comment_id;

    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '488c4d50-4a8f-43b4-92b2-3feb583632fc', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7fa859d2-d71c-4220-8108-6e37d43bafd8', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'b02c6d92-557a-491f-b6bb-61e26662a109', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'bd21abc1-62a4-4677-8a21-f209d263693a', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '16b75429-39e9-4963-afe0-19589ddaae30', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '4b4977c5-4a4c-4f35-b3a3-e85181f919aa', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7cdb1269-8444-4d9f-bff4-c926e0c3b70c', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'f837d0c0-1aaf-4679-807e-96b4266f1f7a', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd8749cc1-a3d2-4957-9733-996a82d23c0b', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'a92eb104-676a-4c9e-9d2f-02d635f0fbc4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '895d02a4-6c11-457d-b817-87870ac14fbb', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '3d82cd25-0600-464a-836c-a126eceab084', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '1f70aacb-d8d2-47d2-b2c0-87ed6506ffaa', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '8707eb03-9082-42c1-98a1-0057b2d011d4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd54ec27e-654b-4879-8f63-8b7cceb950d5', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'db2aa12d-3537-4699-a0c6-bbc20d7ad3a2', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '5dbb2cfc-eb77-407b-94d0-89c218b991aa', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '9e56938d-194b-4ce1-b8be-354a2e9454b0', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'c1263dcf-2c69-453e-a625-f6ff61b17e79', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7495d413-30b5-4132-a298-5b8195e0692b', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '10465d36-0388-447b-ad6c-b08ae9b6c6ab', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'ab92879a-801b-4c56-afec-50e319409a9c', 'dislike');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '84df84d5-644f-4937-b540-cb3d73700344', 'dislike');

    -- 插入留言 "有幾張特別版的序號卡..."
    INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
    VALUES ('8f2a2fb5-0d9b-41fe-b890-c899618abffd', '895d02a4-6c11-457d-b817-87870ac14fbb', '有幾張特別版的序號卡我都沒看過耶！珍藏品無誤！', '2026-02-23T07:10:36.777Z', 11, 2, true)
    RETURNING id INTO v_comment_id;

    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '9f7b0c04-c63f-49d3-9859-0403157e50d7', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '56d39cdd-7c04-45e2-92a2-147790d12bb1', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'a92eb104-676a-4c9e-9d2f-02d635f0fbc4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7078025a-474b-4c82-8950-ea4c01684a89', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '24ac4ae3-8945-4c91-a699-5b7ad294a384', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '8707eb03-9082-42c1-98a1-0057b2d011d4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'db2aa12d-3537-4699-a0c6-bbc20d7ad3a2', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '65285ec1-4b08-4f05-b367-e11b4d64e28d', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '44a3ee54-441b-44e6-8f70-c4e365dd14cd', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7fa859d2-d71c-4220-8108-6e37d43bafd8', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '01c75475-b8ec-4bf8-8bcc-f59b5c40e5eb', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'b1ce4b04-3141-4689-952b-41e712b28c78', 'dislike');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '87d264cd-f0f9-4ff1-a487-5cb9570f481f', 'dislike');

    -- 插入留言 "給大大按個超級大讚！..."
    INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
    VALUES ('8f2a2fb5-0d9b-41fe-b890-c899618abffd', 'c044cac1-b88d-44ce-acdb-c619719dbbc1', '給大大按個超級大讚！ 👍👍👍', '2026-03-04T13:10:36.777Z', 20, 2, true)
    RETURNING id INTO v_comment_id;

    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '16b75429-39e9-4963-afe0-19589ddaae30', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7fa859d2-d71c-4220-8108-6e37d43bafd8', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '65285ec1-4b08-4f05-b367-e11b4d64e28d', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '586ba402-9e9c-4a65-9eec-5c4336f3f386', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '17b4a500-ba24-44fa-be69-0836af9314b1', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '1f70aacb-d8d2-47d2-b2c0-87ed6506ffaa', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'c5d3f769-e7f5-4c87-bc50-7c31b29e30f7', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '5f102d3f-6a1b-4cbc-a13a-06f8f2b16195', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '895d02a4-6c11-457d-b817-87870ac14fbb', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'bca23e5e-b4f1-438d-9ecd-3aae12d98dd4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '84df84d5-644f-4937-b540-cb3d73700344', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7cdb1269-8444-4d9f-bff4-c926e0c3b70c', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '4b4facae-2768-48dc-9024-cfae5934de5d', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'a92eb104-676a-4c9e-9d2f-02d635f0fbc4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '56d39cdd-7c04-45e2-92a2-147790d12bb1', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'ab92879a-801b-4c56-afec-50e319409a9c', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd8749cc1-a3d2-4957-9733-996a82d23c0b', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '3d82cd25-0600-464a-836c-a126eceab084', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '6ae9a5c5-6da7-45bc-800d-e5276dc50089', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '18b0422f-5774-44cc-8b64-913eb9b072b4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd8038469-2bed-45bb-9263-11888faf5fc5', 'dislike');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '9e56938d-194b-4ce1-b8be-354a2e9454b0', 'dislike');

    -- 插入留言 "想請問如果有重複的配..."
    INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
    VALUES ('8f2a2fb5-0d9b-41fe-b890-c899618abffd', 'c1263dcf-2c69-453e-a625-f6ff61b17e79', '想請問如果有重複的配布，會有機會開放大家抽獎嗎？(許願)', '2026-02-28T21:10:36.777Z', 22, 3, true)
    RETURNING id INTO v_comment_id;

    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '10465d36-0388-447b-ad6c-b08ae9b6c6ab', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'aed4dd6e-f4fb-472a-934c-e10c8a918cf8', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'bd21abc1-62a4-4677-8a21-f209d263693a', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'b865c1de-35a0-4a86-852d-f756b8cc61ed', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'bca23e5e-b4f1-438d-9ecd-3aae12d98dd4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'c5343e5e-38b3-4e7e-af42-eebe0b6c7ebc', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'c5d3f769-e7f5-4c87-bc50-7c31b29e30f7', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7cdb1269-8444-4d9f-bff4-c926e0c3b70c', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '87d264cd-f0f9-4ff1-a487-5cb9570f481f', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '1b5c11ab-201d-44ac-824f-0eb7a79e2cf7', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '56d39cdd-7c04-45e2-92a2-147790d12bb1', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '239183e3-8c27-4117-93a0-bf654eca2638', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '3d82cd25-0600-464a-836c-a126eceab084', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '4b4977c5-4a4c-4f35-b3a3-e85181f919aa', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '4b4facae-2768-48dc-9024-cfae5934de5d', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '5dbb2cfc-eb77-407b-94d0-89c218b991aa', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '80e8463b-6cfd-4e4c-bce9-d2bc0dd87843', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '24ac4ae3-8945-4c91-a699-5b7ad294a384', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '488c4d50-4a8f-43b4-92b2-3feb583632fc', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd8749cc1-a3d2-4957-9733-996a82d23c0b', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '8707eb03-9082-42c1-98a1-0057b2d011d4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7fa859d2-d71c-4220-8108-6e37d43bafd8', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7078025a-474b-4c82-8950-ea4c01684a89', 'dislike');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'ec52d34d-d7ee-475d-b728-539bf84aae40', 'dislike');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '586ba402-9e9c-4a65-9eec-5c4336f3f386', 'dislike');

    -- 插入留言 "真的超愛逛你的頁面的..."
    INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
    VALUES ('8f2a2fb5-0d9b-41fe-b890-c899618abffd', '10465d36-0388-447b-ad6c-b08ae9b6c6ab', '真的超愛逛你的頁面的，看著滿點的收藏就很療癒~', '2026-03-01T05:10:36.777Z', 13, 2, true)
    RETURNING id INTO v_comment_id;

    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'c1263dcf-2c69-453e-a625-f6ff61b17e79', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'a92eb104-676a-4c9e-9d2f-02d635f0fbc4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '3d82cd25-0600-464a-836c-a126eceab084', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'f837d0c0-1aaf-4679-807e-96b4266f1f7a', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '586ba402-9e9c-4a65-9eec-5c4336f3f386', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'aed4dd6e-f4fb-472a-934c-e10c8a918cf8', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '5dbb2cfc-eb77-407b-94d0-89c218b991aa', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd397793d-f04a-438c-9a6c-ee0613597f25', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '8707eb03-9082-42c1-98a1-0057b2d011d4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'ab92879a-801b-4c56-afec-50e319409a9c', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd689caa0-68f8-4d33-bd3b-2f55d11b368f', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'db2aa12d-3537-4699-a0c6-bbc20d7ad3a2', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '65285ec1-4b08-4f05-b367-e11b4d64e28d', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '376cfb65-86e1-43d3-9289-1b6674020343', 'dislike');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '9e56938d-194b-4ce1-b8be-354a2e9454b0', 'dislike');

    -- 插入留言 "這已經是神獸博物館的..."
    INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
    VALUES ('8f2a2fb5-0d9b-41fe-b890-c899618abffd', '01c75475-b8ec-4bf8-8bcc-f59b5c40e5eb', '這已經是神獸博物館的等級了！請收下我的膝蓋！', '2026-03-04T19:10:36.777Z', 24, 3, true)
    RETURNING id INTO v_comment_id;

    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '80e8463b-6cfd-4e4c-bce9-d2bc0dd87843', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'db2aa12d-3537-4699-a0c6-bbc20d7ad3a2', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'b1ce4b04-3141-4689-952b-41e712b28c78', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'bd21abc1-62a4-4677-8a21-f209d263693a', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '34e47a26-c946-4e8f-be38-a0e8750c55fb', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'f837d0c0-1aaf-4679-807e-96b4266f1f7a', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '9f7b0c04-c63f-49d3-9859-0403157e50d7', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7495d413-30b5-4132-a298-5b8195e0692b', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'ec52d34d-d7ee-475d-b728-539bf84aae40', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '1f70aacb-d8d2-47d2-b2c0-87ed6506ffaa', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '586ba402-9e9c-4a65-9eec-5c4336f3f386', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '3d82cd25-0600-464a-836c-a126eceab084', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'c1263dcf-2c69-453e-a625-f6ff61b17e79', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '4b4977c5-4a4c-4f35-b3a3-e85181f919aa', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'a92eb104-676a-4c9e-9d2f-02d635f0fbc4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '1b5c11ab-201d-44ac-824f-0eb7a79e2cf7', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '6ae9a5c5-6da7-45bc-800d-e5276dc50089', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'c044cac1-b88d-44ce-acdb-c619719dbbc1', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'ffd4f16b-d2dc-4ef3-8e82-c67b2c1301e4', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '376cfb65-86e1-43d3-9289-1b6674020343', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd397793d-f04a-438c-9a6c-ee0613597f25', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7078025a-474b-4c82-8950-ea4c01684a89', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '5dbb2cfc-eb77-407b-94d0-89c218b991aa', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '7fa859d2-d71c-4220-8108-6e37d43bafd8', 'like');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, 'd689caa0-68f8-4d33-bd3b-2f55d11b368f', 'dislike');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '2204e75a-ea47-451e-bde5-d4c2bfe1708d', 'dislike');
    INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
    VALUES (v_comment_id, '895d02a4-6c11-457d-b817-87870ac14fbb', 'dislike');

END $$;
