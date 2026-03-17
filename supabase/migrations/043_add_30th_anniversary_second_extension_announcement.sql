-- supabase/migrations/043_add_30th_anniversary_second_extension_announcement.sql

-- 插入或是更新 30 週年活動二次延期公告
INSERT INTO public.announcements (
    id,
    title,
    content,
    image_url,
    status,
    published_at,
    show_popup,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '【重要公告】30 週年慶典活動再延期及補償方案',
    '親愛的訓練家們：

感謝大家對「寶可夢 30 週年系列活動」的熱烈響應！由於**預先報名人數遠超預期**，為了確保活動上線時伺服器的穩定性並提供最優質的體驗，我們決定將活動開始日期**再次順延至 3 月 19 日**。

🎈 **【專屬補償方案：神秘大禮加碼大放送！】** 🎈
為了感謝您的耐心等待，我們準備了特別的補償好禮！
請在活動頁面點選**「申請專屬神秘補償」**，**前 50 名** 完成申請的訓練家，將獲得一份**未公開的重量級神秘補償**！
（詳細內容未來將擇期公佈，絕對驚喜）
數量有限，先搶先贏，趕快行動吧！

感謝您的支持與體諒，讓我們 3 月 19 日盛大相聚！✨',
    '/pokemon_30th_anniversary_extension.png', -- 剛剛新增的圖片
    'published',
    now(),
    true, -- 設為彈窗公告
    now(),
    now()
);
