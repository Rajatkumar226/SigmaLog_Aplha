-- =====================================================
-- SigmaLog: Per-task reminders + completion congrats
-- =====================================================
-- - habits.reminder_time: optional daily "time to start this task" push
-- - habits.reminder_last_sent_date: per-habit daily dedup (user-local date)
-- - notifications.daily_reminders_enabled: the Settings toggle (4 AM new-day,
--   evening "tasks left", and the all-done congrats). Per-task reminders are
--   independent and fire whenever a habit has a reminder_time + a subscription.
-- - notifications.congrats_sent_at: dedup for the "all complete" congrats
-- =====================================================

ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS reminder_time TIME,
  ADD COLUMN IF NOT EXISTS reminder_last_sent_date DATE;

COMMENT ON COLUMN public.habits.reminder_time IS 'Optional local time for a daily "time to start this task" push. NULL = no per-task reminder.';
COMMENT ON COLUMN public.habits.reminder_last_sent_date IS 'User-local date this habit''s reminder was last sent (per-day dedup).';

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS daily_reminders_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS congrats_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.notifications.daily_reminders_enabled IS 'Settings toggle: morning new-day + evening tasks-left + all-done congrats.';
COMMENT ON COLUMN public.notifications.congrats_sent_at IS 'Last time the all-habits-complete congrats was sent.';
