-- =============================================
-- 為 Pop 新增公眾形象名與公眾認知資料
-- Pop's user_id: 8f2a2fb5-0d9b-41fe-b890-c899618abffd
-- =============================================

-- 📛 公眾形象名
INSERT INTO public_images (user_id, nickname, approval_rate)
VALUES ('8f2a2fb5-0d9b-41fe-b890-c899618abffd', '配布收藏王', 87)
ON CONFLICT (user_id) DO UPDATE SET nickname = EXCLUDED.nickname, approval_rate = EXCLUDED.approval_rate;

-- 💭 公眾認知（多條）
INSERT INTO public_perceptions (user_id, content, agree_rate, disagree_rate, participation_rate, sort_order)
VALUES 
  ('8f2a2fb5-0d9b-41fe-b890-c899618abffd', '擁有繁中圈數一數二的配布收藏量', 92, 8, 156, 1),
  ('8f2a2fb5-0d9b-41fe-b890-c899618abffd', '對稀有配布的鑑定很有一套', 78, 22, 89, 2),
  ('8f2a2fb5-0d9b-41fe-b890-c899618abffd', '願意分享收集經驗給新手', 85, 15, 112, 3)
ON CONFLICT DO NOTHING;
