-- 修正配布圖鑑證章/緞帶圖示路徑。
-- Bulbagarden Archives 的 Special:Redirect 必須走 /wiki 路徑；/media/upload/Special:Redirect 會回 404。

UPDATE distribution_badges
SET icon_url = replace(
    icon_url,
    'https://archives.bulbagarden.net/media/upload/Special:Redirect/file/',
    'https://archives.bulbagarden.net/wiki/Special:Redirect/file/'
)
WHERE icon_url LIKE 'https://archives.bulbagarden.net/media/upload/Special:Redirect/file/%';

UPDATE distribution_badges
SET icon_url = CASE icon_url
    WHEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Sinnoh_Champion_Ribbon.png'
        THEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Sinnoh_Champion_Ribbon_VIII.png'
    WHEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Galar_Champion_Ribbon.png'
        THEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Galar_Champion_Ribbon_VIII.png'
    WHEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Twinkling_Star_Ribbon.png'
        THEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Twinkling_Star_Ribbon_VIII.png'
    WHEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Tower_Master_Ribbon.png'
        THEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Tower_Master_Ribbon_VIII.png'
    WHEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Master_Rank_Ribbon.png'
        THEN 'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Master_Rank_Ribbon_VIII.png'
    ELSE icon_url
END
WHERE icon_url IN (
    'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Sinnoh_Champion_Ribbon.png',
    'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Galar_Champion_Ribbon.png',
    'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Twinkling_Star_Ribbon.png',
    'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Tower_Master_Ribbon.png',
    'https://archives.bulbagarden.net/wiki/Special:Redirect/file/Master_Rank_Ribbon.png'
);
