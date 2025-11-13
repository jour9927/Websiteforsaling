-- 建立通知表格（用於管理員接收報名通知）
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'registration', 'cancellation', 'system'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  related_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- 建立索引提升查詢效能
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 建立郵件訊息表格（用於管理員發送訊息給會員）
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- RLS 政策：通知表格
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 用戶只能看到自己的通知
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 系統可以建立通知（透過函數）
CREATE POLICY "System can create notifications"
ON notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 用戶可以更新自己的通知（標記為已讀）
CREATE POLICY "Users can update their own notifications"
ON notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 用戶可以刪除自己的通知
CREATE POLICY "Users can delete their own notifications"
ON notifications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS 政策：訊息表格
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 用戶可以看到自己發送或接收的訊息
CREATE POLICY "Users can view their messages"
ON messages
FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- 認證用戶可以發送訊息
CREATE POLICY "Authenticated users can send messages"
ON messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- 用戶可以更新自己接收的訊息（標記為已讀）
CREATE POLICY "Users can update received messages"
ON messages
FOR UPDATE
TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

-- 用戶可以刪除自己的訊息
CREATE POLICY "Users can delete their messages"
ON messages
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- 建立函數：當有新報名時，通知所有管理員
CREATE OR REPLACE FUNCTION notify_admins_on_registration()
RETURNS TRIGGER AS $$
DECLARE
  event_record RECORD;
  user_record RECORD;
  admin_record RECORD;
BEGIN
  -- 取得活動資訊
  SELECT * INTO event_record FROM events WHERE id = NEW.event_id;
  
  -- 取得報名用戶資訊
  SELECT * INTO user_record FROM profiles WHERE id = NEW.user_id;
  
  -- 為所有管理員建立通知
  FOR admin_record IN 
    SELECT id FROM profiles WHERE role = 'admin'
  LOOP
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_event_id,
      related_user_id
    ) VALUES (
      admin_record.id,
      'registration',
      '新的活動報名',
      COALESCE(user_record.full_name, user_record.email) || ' 報名了活動「' || event_record.title || '」',
      NEW.event_id,
      NEW.user_id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 建立觸發器：報名時通知管理員
DROP TRIGGER IF EXISTS on_registration_notify_admins ON registrations;
CREATE TRIGGER on_registration_notify_admins
  AFTER INSERT ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_on_registration();

-- 建立函數：當報名被取消時，通知所有管理員
CREATE OR REPLACE FUNCTION notify_admins_on_cancellation()
RETURNS TRIGGER AS $$
DECLARE
  event_record RECORD;
  user_record RECORD;
  admin_record RECORD;
BEGIN
  -- 取得活動資訊
  SELECT * INTO event_record FROM events WHERE id = OLD.event_id;
  
  -- 取得報名用戶資訊
  SELECT * INTO user_record FROM profiles WHERE id = OLD.user_id;
  
  -- 為所有管理員建立通知
  FOR admin_record IN 
    SELECT id FROM profiles WHERE role = 'admin'
  LOOP
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_event_id,
      related_user_id
    ) VALUES (
      admin_record.id,
      'cancellation',
      '活動報名取消',
      COALESCE(user_record.full_name, user_record.email) || ' 取消了活動「' || event_record.title || '」的報名',
      OLD.event_id,
      OLD.user_id
    );
  END LOOP;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 建立觸發器：取消報名時通知管理員
DROP TRIGGER IF EXISTS on_registration_cancel_notify_admins ON registrations;
CREATE TRIGGER on_registration_cancel_notify_admins
  AFTER DELETE ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_on_cancellation();
