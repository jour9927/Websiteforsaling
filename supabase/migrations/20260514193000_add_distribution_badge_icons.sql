-- 配布圖鑑：證章/緞帶小圖示
-- 使用 Bulbagarden Archives 的 Special:Redirect/file URL，保留接近原版的小尺寸素材並降低檔案路徑異動風險。

ALTER TABLE distribution_badges
    ADD COLUMN IF NOT EXISTS icon_url TEXT;

UPDATE distribution_badges
SET icon_url = CASE name
    WHEN '冠軍緞帶' THEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Champion_Ribbon.png'
    WHEN '努力緞帶' THEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Effort_Ribbon.png'
    WHEN '稀有紀念緞帶' THEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Souvenir_Ribbon.png'
    WHEN '神奧冠軍緞帶' THEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Champion_Ribbon.png'
    WHEN '經典緞帶' THEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Classic_Ribbon.png'
    WHEN '生日緞帶' THEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Birthday_Ribbon.png'
    WHEN '合眾紀念緞帶' THEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Souvenir_Ribbon.png'
    WHEN '許願緞帶' THEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Wishing_Ribbon.png'
    WHEN '首映緞帶' THEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Premier_Ribbon.png'
    WHEN '卡洛斯冠軍緞帶' THEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Champion_Ribbon.png'
    WHEN '活動緞帶' THEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Event_Ribbon.png'
    WHEN '祝賀緞帶' THEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Special_Ribbon.png'
    WHEN '阿羅拉冠軍緞帶' THEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Champion_Ribbon.png'
    WHEN '大師等級緞帶' THEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Battle_Tree_Master_Ribbon.png'
    WHEN '節慶紀念緞帶' THEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Souvenir_Ribbon.png'
    WHEN '伽勒爾冠軍緞帶' THEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Champion_Ribbon.png'
    WHEN '命運證章' THEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Destiny_Mark.png'
    WHEN '稀有證章' THEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Rare_Mark.png'
    WHEN '帕底亞冠軍緞帶' THEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Champion_Ribbon.png'
    WHEN '夥伴證章' THEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Partner_Mark.png'
    WHEN '迷你證章' THEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Mini_Mark.png'
    WHEN '巨大證章' THEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Jumbo_Mark.png'
    WHEN '第九世代命運證章' THEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Destiny_Mark.png'
    ELSE icon_url
END
WHERE name IN (
    '冠軍緞帶',
    '努力緞帶',
    '稀有紀念緞帶',
    '神奧冠軍緞帶',
    '經典緞帶',
    '生日緞帶',
    '合眾紀念緞帶',
    '許願緞帶',
    '首映緞帶',
    '卡洛斯冠軍緞帶',
    '活動緞帶',
    '祝賀緞帶',
    '阿羅拉冠軍緞帶',
    '大師等級緞帶',
    '節慶紀念緞帶',
    '伽勒爾冠軍緞帶',
    '命運證章',
    '稀有證章',
    '帕底亞冠軍緞帶',
    '夥伴證章',
    '迷你證章',
    '巨大證章',
    '第九世代命運證章'
);
