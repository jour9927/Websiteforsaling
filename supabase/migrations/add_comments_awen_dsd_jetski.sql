-- =============================================
-- 為阿文、DSD、Jetski 清除舊留言並灌入個性化新留言
-- =============================================

-- ====== 第一步：清除舊留言與相關 reactions ======
-- 刪除 reactions（外鍵約束）
DELETE FROM comment_reactions WHERE comment_id IN (
    SELECT id FROM profile_comments WHERE profile_user_id IN (
        '7cdc6fb0-fc8d-4119-88f3-62a0a9541e9c',  -- 阿文
        '4a91af11-4092-475f-9f85-596f47a120b3',  -- DSD
        'a3ccfeb8-d489-4289-b3ff-923384ca5d88'   -- Jetski
    )
);
-- 刪除留言
DELETE FROM profile_comments WHERE profile_user_id IN (
    '7cdc6fb0-fc8d-4119-88f3-62a0a9541e9c',
    '4a91af11-4092-475f-9f85-596f47a120b3',
    'a3ccfeb8-d489-4289-b3ff-923384ca5d88'
);

-- ====== 第二步：灌入新留言與隨機 reactions ======
DO $$
DECLARE
    v_comment_id UUID;
    v_virtual_user RECORD;
    v_like_count INTEGER;
    v_dislike_count INTEGER;
    v_counter INTEGER;

    -- 阿文的 user_id
    awen_id CONSTANT UUID := '7cdc6fb0-fc8d-4119-88f3-62a0a9541e9c';
    -- DSD 的 user_id
    dsd_id CONSTANT UUID := '4a91af11-4092-475f-9f85-596f47a120b3';
    -- Jetski 的 user_id
    jetski_id CONSTANT UUID := 'a3ccfeb8-d489-4289-b3ff-923384ca5d88';

BEGIN

-- =============================================
-- 阿文的留言（伊布收藏家、常辦伊布盲盒）
-- =============================================

-- 留言 1
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (awen_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'伊布家族全制霸了吧！每一隻進化型都有收集到真的太強了 😍', '2026-03-07T10:15:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 2
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (awen_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'上次參加你辦的伊布盲盒超開心！抽到仙子伊布配布 🎉', '2026-03-06T18:30:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 3
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (awen_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'你的伊布收藏頁面看了好療癒，每隻都好可愛 ❤️', '2026-03-06T09:20:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 4
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (awen_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'請問下次伊布盲盒什麼時候開？好想再參加一次！', '2026-03-05T21:45:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 5
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (awen_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'看到你的色違伊布全套收藏，我只想說一個字：神！', '2026-03-05T14:10:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 6
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (awen_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'伊布控認證 ✅ 這收藏量根本是伊布博物館等級', '2026-03-04T16:55:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 7
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (awen_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'每次你辦盲盒活動都超搶手的，下次能不能多開幾個名額 🙏', '2026-03-04T08:30:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 8
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (awen_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'你有那隻 2012 年的活動限定伊布嗎？超級稀有的那隻！', '2026-03-03T19:00:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 9
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (awen_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'阿文大大是伊布界的傳說！收藏量太驚人了吧', '2026-03-02T12:20:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 10
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (awen_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'想問一下，你覺得最難收到的伊布進化型配布是哪隻？', '2026-03-01T22:40:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 11
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (awen_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'我就是從你的伊布盲盒入坑配布收集的！感謝阿文 🫶', '2026-03-01T10:15:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 12
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (awen_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'仙子伊布 + 太陽伊布的組合真的超美的，你有配成組嗎？', '2026-02-28T15:30:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 13
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (awen_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'八種伊布進化型，你最喜歡哪一隻呢？我猜是月亮伊布！', '2026-02-27T20:00:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 14
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (awen_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'你辦的活動品質都很好，開箱影片也超好看 👍', '2026-02-26T11:45:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 15
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (awen_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'社群伊布日的時候你一定是最閃亮的那個吧 ✨', '2026-02-25T16:10:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 16
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (awen_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'身為伊布控的楷模，請問還有缺哪隻嗎？我這邊有幾隻多的', '2026-02-24T09:50:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 17
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (awen_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'你的首頁滿滿都是伊布，看了心情就變好了 😊', '2026-02-23T14:25:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 18
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (awen_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'拜託開一個伊布主題交換會吧！我手上有幾隻特殊球伊布想換', '2026-02-22T18:00:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 19
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (awen_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'聽說你連初代紅綠版的伊布配布都有？太猛了吧 🤯', '2026-02-21T13:30:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 20
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (awen_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'伊布家族代言人就是你了！期待下次的盲盒活動 🎲', '2026-02-20T08:15:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;


-- =============================================
-- DSD 的留言（美洛耶塔收藏、色違神獸、最常辦盲盒配布）
-- =============================================

-- 留言 1
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (dsd_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'色違神獸全制霸太神了吧！每一隻都有收到也太強 🔥', '2026-03-07T11:00:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 2
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (dsd_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'你的美洛耶塔收藏量真的是全社群第一名，無人能及！', '2026-03-06T22:30:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 3
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (dsd_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'上次參加你辦的盲盒配布，中了一隻色違裂空座，謝謝大佬！🙏', '2026-03-06T14:15:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 4
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (dsd_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'DSD 辦的盲盒品質都超高！獎池裡面全是稀有配布 😭', '2026-03-05T17:40:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 5
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (dsd_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'請問你是怎麼收到這麼多美洛耶塔的？難道每場活動都有去？', '2026-03-05T09:20:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 6
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (dsd_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'色違帕路奇亞太帥了！你這隻是哪個活動拿的？', '2026-03-04T20:50:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 7
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (dsd_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'社群盲盒王 DSD！每次開盲盒都超期待的 🎁', '2026-03-04T13:10:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 8
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (dsd_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'你對美洛耶塔的執著真的令人敬佩，這就是收藏家精神！', '2026-03-03T16:25:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 9
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (dsd_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'色違固拉多和色違蓋歐卡都有！這收藏太夢幻了吧 ✨', '2026-03-03T08:45:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 10
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (dsd_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'下次盲盒能放個美洛耶塔當大獎嗎？超想要的！', '2026-03-02T19:30:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 11
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (dsd_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'DSD 的盲盒是整個社群最佛心的，每次參加都覺得很值 💯', '2026-03-02T11:15:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 12
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (dsd_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'那隻舞步形態的美洛耶塔超美的！能分享一下來源嗎？', '2026-03-01T15:55:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 13
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (dsd_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'你的色違神獸收藏真的是社群之光，膜拜 🙇', '2026-02-28T22:10:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 14
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (dsd_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'每次看到你的首頁就會羨慕到不行，色違超夢三隻也太狠了', '2026-02-27T12:40:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 15
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (dsd_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'感謝 DSD 大佬常常辦活動回饋社群！你是最讚的 👍', '2026-02-26T17:20:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 16
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (dsd_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'想知道你收了幾隻美洛耶塔了？感覺已經破 20 了吧 😂', '2026-02-25T10:00:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 17
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (dsd_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'你上次分享的色違蒼響圖真的超帥！好想要一隻 QQ', '2026-02-24T19:35:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 18
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (dsd_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'問一下大佬，色違神獸裡你覺得哪隻色差最大最好看？', '2026-02-23T14:15:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 19
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (dsd_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'DSD 根本就是行走的色違神獸圖鑑，太厲害了 🫡', '2026-02-22T08:50:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 20
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (dsd_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'拜託下次盲盒放點色違神獸進去！我願意多買幾抽 💸', '2026-02-21T16:30:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;


-- =============================================
-- Jetski 的留言（可愛型寶可夢收藏家）
-- =============================================

-- 留言 1
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (jetski_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'你的可愛寶可夢收藏也太療癒了！每隻都好萌 🥺', '2026-03-07T12:30:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 2
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (jetski_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'胖丁、皮丘、迷你龍...你的收藏根本是可愛天堂！', '2026-03-06T19:45:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 3
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (jetski_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'看你的首頁心情就變超好的，滿滿的可愛寶可夢 💖', '2026-03-06T10:20:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 4
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (jetski_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'你有收集到活動限定的皮卡丘嗎？戴帽子那隻超可愛的！', '2026-03-05T22:10:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 5
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (jetski_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'可愛型收藏家太讚了！你有布莉姆溫的配布嗎？超想要 ❤️', '2026-03-05T15:35:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 6
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (jetski_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'你的謎擬Q配布好可愛啊！那是哪場活動的？', '2026-03-04T18:50:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 7
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (jetski_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'想跟你交換可愛寶可夢！我有多隻波加曼配布 🐧', '2026-03-04T11:15:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 8
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (jetski_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'Jetski 的收藏風格好清新！不走強度派走可愛派太有個性了', '2026-03-03T20:40:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 9
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (jetski_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'那隻色違沙奈朵的配布也太夢幻了！真的好美 ✨', '2026-03-03T13:00:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 10
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (jetski_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'請問你心目中最可愛的寶可夢 TOP 3 是哪些？好奇 🤔', '2026-03-02T16:25:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 11
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (jetski_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'吉利蛋護士配與幸福蛋配布都有！可愛粉色系收齊了 🩷', '2026-03-02T08:10:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 12
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (jetski_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'你的收藏讓我重新定義了什麼叫「有品味」的收集 👏', '2026-03-01T21:55:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 13
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (jetski_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'拜託開一個可愛寶可夢主題交換會！我一定報名 🙋‍♀️', '2026-03-01T14:30:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 14
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (jetski_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'小卡比獸配布太可愛了吧！圓滾滾的超萌 😆', '2026-02-28T17:45:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 15
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (jetski_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'你收集的寶可夢看了心情都變好了～每天都想來逛逛', '2026-02-27T10:20:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 16
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (jetski_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'有看到仙子伊布和花潔夫人的配布！粉色控的天堂 🌸', '2026-02-26T19:05:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 17
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (jetski_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'Jetski 是真正懂得欣賞寶可夢之美的人！', '2026-02-25T13:30:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 18
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (jetski_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'想問有沒有耿鬼的配布？雖然是鬼系但超可愛的 👻', '2026-02-24T16:50:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 19
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (jetski_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'你的審美太好了！每隻選的都是最可愛的形態 💕', '2026-02-23T09:15:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;

-- 留言 20
INSERT INTO profile_comments (profile_user_id, virtual_commenter_id, content, created_at, likes_count, dislikes_count, is_virtual)
VALUES (jetski_id, (SELECT id FROM virtual_profiles ORDER BY random() LIMIT 1),
'可愛就是正義！支持 Jetski 繼續收集下去 🎀', '2026-02-22T20:00:00Z', 0, 0, true)
RETURNING id INTO v_comment_id;


-- ====== 第三步：為所有新留言灌入隨機 reactions ======
-- 遍歷三人的所有新留言（likes=0 的），隨機加入 8~20 個讚、0~3 個倒讚
FOR v_comment_id IN 
    SELECT id FROM profile_comments 
    WHERE profile_user_id IN (awen_id, dsd_id, jetski_id)
      AND (likes_count = 0 OR likes_count IS NULL)
LOOP
    v_like_count := 8 + floor(random() * 13)::int;   -- 8~20
    v_dislike_count := floor(random() * 4)::int;      -- 0~3
    v_counter := 0;

    FOR v_virtual_user IN 
        SELECT id FROM virtual_profiles 
        ORDER BY random() 
        LIMIT (v_like_count + v_dislike_count)
    LOOP
        v_counter := v_counter + 1;
        IF v_counter <= v_like_count THEN
            INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
            VALUES (v_comment_id, v_virtual_user.id, 'like')
            ON CONFLICT DO NOTHING;
        ELSE
            INSERT INTO comment_reactions (comment_id, virtual_user_id, reaction_type)
            VALUES (v_comment_id, v_virtual_user.id, 'dislike')
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;

    UPDATE profile_comments 
    SET likes_count = (SELECT COUNT(*) FROM comment_reactions WHERE comment_id = v_comment_id AND reaction_type = 'like'),
        dislikes_count = (SELECT COUNT(*) FROM comment_reactions WHERE comment_id = v_comment_id AND reaction_type = 'dislike')
    WHERE id = v_comment_id;
END LOOP;

RAISE NOTICE 'Done! 60 comments with reactions inserted for 阿文, DSD, Jetski.';
END $$;
