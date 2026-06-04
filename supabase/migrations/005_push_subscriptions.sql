-- Add VAPID push subscription column to notifications table
-- Stores the browser PushSubscription JSON so the Edge Function can send server-side pushes

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS push_subscription JSONB;

COMMENT ON COLUMN public.notifications.push_subscription IS 'Browser PushSubscription JSON (endpoint + keys). NULL = not subscribed to web push.';
