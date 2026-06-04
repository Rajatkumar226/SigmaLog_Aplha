# Daily Push Notifications Setup

SigmaLog now supports two daily push notifications:

1. Morning reminder for every subscribed user at `08:00` in their timezone.
2. Evening reminder at the user's configured reminder time when active habits are not fully completed.

## 1. Run The New Migration

Run this SQL migration in Supabase:

```text
supabase/migrations/006_daily_push_notifications.sql
```

It adds separate tracking columns so morning and evening notifications can both be sent once per day.

## 2. Deploy The Edge Function

Deploy:

```bash
supabase functions deploy send-reminders --no-verify-jwt
```

Required Edge Function secrets:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
supabase secrets set VAPID_PUBLIC_KEY=your-vapid-public-key
supabase secrets set VAPID_PRIVATE_KEY=your-vapid-private-key
supabase secrets set CRON_SECRET=your-random-cron-secret
```

Also set `VITE_VAPID_PUBLIC_KEY` in the frontend environment.

## 3. Schedule The Function

Supabase schedules Edge Functions through Postgres `pg_cron` and `pg_net`.
Run this once in SQL editor, replacing the placeholders:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'sigmalog-send-reminders-every-minute',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Cron-Secret', 'YOUR_CRON_SECRET'
    ),
    body := jsonb_build_object('triggered_at', now())
  ) as request_id;
  $$
);
```

The function runs every minute and only sends when a user's local time matches the morning or evening notification window.

## Notification Copy

Morning:

```text
SigmaLog - New Day, New Standard
Start clean. Win the first task and let the day follow.
```

Evening:

```text
SigmaLog - Do Not Let Today Go
One unfinished habit is still a choice. Open SigmaLog and close the loop.
```
