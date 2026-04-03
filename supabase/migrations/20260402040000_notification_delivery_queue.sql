ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notification_preference TEXT NOT NULL DEFAULT 'site_only',
  ADD COLUMN IF NOT EXISTS notification_email TEXT,
  ADD COLUMN IF NOT EXISTS discord_webhook_url TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_notification_preference_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_notification_preference_check
      CHECK (notification_preference IN ('site_only', 'site_email', 'site_discord', 'all'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_table TEXT NOT NULL,
  source_id UUID NOT NULL,
  channel TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  inbox_path TEXT NOT NULL,
  provider_target TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  sent_at TIMESTAMPTZ,
  processing_started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status_created_at
  ON notification_deliveries(status, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_user_id
  ON notification_deliveries(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_deliveries_source_channel
  ON notification_deliveries(source_table, source_id, channel);

ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_notification_deliveries_updated_at ON notification_deliveries;
CREATE TRIGGER update_notification_deliveries_updated_at
  BEFORE UPDATE ON notification_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION enqueue_user_notification_delivery(
  delivery_user_id UUID,
  delivery_source_table TEXT,
  delivery_source_id UUID,
  delivery_title TEXT,
  delivery_body TEXT,
  delivery_inbox_path TEXT
)
RETURNS VOID AS $$
DECLARE
  profile_record RECORD;
  resolved_email TEXT;
  resolved_webhook TEXT;
BEGIN
  SELECT
    p.id,
    p.email,
    p.notification_preference,
    p.notification_email,
    p.discord_webhook_url
  INTO profile_record
  FROM profiles p
  WHERE p.id = delivery_user_id;

  IF profile_record.id IS NULL THEN
    RETURN;
  END IF;

  resolved_email := COALESCE(
    NULLIF(BTRIM(profile_record.notification_email), ''),
    NULLIF(BTRIM(profile_record.email), '')
  );
  resolved_webhook := NULLIF(BTRIM(profile_record.discord_webhook_url), '');

  IF profile_record.notification_preference IN ('site_email', 'all')
    AND resolved_email IS NOT NULL THEN
    INSERT INTO notification_deliveries (
      user_id,
      source_table,
      source_id,
      channel,
      title,
      body,
      inbox_path,
      provider_target,
      payload
    ) VALUES (
      delivery_user_id,
      delivery_source_table,
      delivery_source_id,
      'email',
      delivery_title,
      delivery_body,
      delivery_inbox_path,
      resolved_email,
      jsonb_build_object(
        'channel', 'email',
        'source_table', delivery_source_table,
        'source_id', delivery_source_id,
        'title', delivery_title,
        'body', delivery_body,
        'inbox_path', delivery_inbox_path
      )
    )
    ON CONFLICT (source_table, source_id, channel) DO UPDATE
    SET
      title = EXCLUDED.title,
      body = EXCLUDED.body,
      inbox_path = EXCLUDED.inbox_path,
      provider_target = EXCLUDED.provider_target,
      payload = EXCLUDED.payload,
      status = 'pending',
      last_error = NULL,
      processing_started_at = NULL,
      updated_at = now();
  END IF;

  IF profile_record.notification_preference IN ('site_discord', 'all')
    AND resolved_webhook IS NOT NULL THEN
    INSERT INTO notification_deliveries (
      user_id,
      source_table,
      source_id,
      channel,
      title,
      body,
      inbox_path,
      provider_target,
      payload
    ) VALUES (
      delivery_user_id,
      delivery_source_table,
      delivery_source_id,
      'discord',
      delivery_title,
      delivery_body,
      delivery_inbox_path,
      resolved_webhook,
      jsonb_build_object(
        'channel', 'discord',
        'source_table', delivery_source_table,
        'source_id', delivery_source_id,
        'title', delivery_title,
        'body', delivery_body,
        'inbox_path', delivery_inbox_path
      )
    )
    ON CONFLICT (source_table, source_id, channel) DO UPDATE
    SET
      title = EXCLUDED.title,
      body = EXCLUDED.body,
      inbox_path = EXCLUDED.inbox_path,
      provider_target = EXCLUDED.provider_target,
      payload = EXCLUDED.payload,
      status = 'pending',
      last_error = NULL,
      processing_started_at = NULL,
      updated_at = now();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION enqueue_delivery_on_notification_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM enqueue_user_notification_delivery(
    NEW.user_id,
    'notifications',
    NEW.id,
    NEW.title,
    NEW.message,
    '/admin/notifications'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_notification_enqueue_delivery ON notifications;
CREATE TRIGGER on_notification_enqueue_delivery
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION enqueue_delivery_on_notification_insert();

CREATE OR REPLACE FUNCTION enqueue_delivery_on_message_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM enqueue_user_notification_delivery(
    NEW.recipient_id,
    'messages',
    NEW.id,
    COALESCE(NULLIF(BTRIM(NEW.subject), ''), '你收到一封新私訊'),
    NEW.body,
    '/messages'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_enqueue_delivery ON messages;
CREATE TRIGGER on_message_enqueue_delivery
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION enqueue_delivery_on_message_insert();
