-- =====================================================
-- SigmaLog: Time Capsule "ready" push notification
-- =====================================================
-- ready_notified_at: set when the "your capsule is ready" push has been
-- sent, so it only fires once per capsule.

ALTER TABLE public.time_capsules
  ADD COLUMN IF NOT EXISTS ready_notified_at TIMESTAMPTZ;

COMMENT ON COLUMN public.time_capsules.ready_notified_at IS 'When the delivery-day "capsule ready" push was sent (one-time dedup). NULL = not yet notified.';
