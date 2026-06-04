-- =====================================================
-- SigmaLog: Daily Push Notification Tracking
-- Morning start reminder + evening incomplete-habits reminder
-- =====================================================

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS morning_reminder_time TIME NOT NULL DEFAULT '08:00:00',
  ADD COLUMN IF NOT EXISTS morning_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS evening_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.notifications.morning_reminder_time IS 'Local user time for the daily morning start notification.';
COMMENT ON COLUMN public.notifications.morning_sent_at IS 'Last time the morning notification was sent.';
COMMENT ON COLUMN public.notifications.evening_sent_at IS 'Last time the evening incomplete-habits notification was sent.';
