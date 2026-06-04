/**
 * send-reminders — Supabase Edge Function (Deno)
 *
 * Runs on a cron schedule (e.g. every minute via supabase.toml).
 * Finds users whose reminder_time matches now (±2 min, in their timezone),
 * haven't logged today, and have a VAPID push subscription saved.
 * Sends a Web Push notification via npm:web-push.
 *
 * Required secrets (set via `supabase secrets set`):
 *   SUPABASE_SERVICE_ROLE_KEY
 *   VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY
 *   CRON_SECRET  (arbitrary string; must match X-Cron-Secret header)
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import webPush from "npm:web-push@3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

webPush.setVapidDetails(
  "mailto:rajat8615226@gmail.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
);

Deno.serve(async (req) => {
  // Allow Supabase internal scheduler (passes service role) or explicit CRON_SECRET
  const auth = req.headers.get("Authorization") ?? "";
  const cronHeader = req.headers.get("X-Cron-Secret") ?? "";
  const isServiceRole = auth === `Bearer ${SERVICE_ROLE_KEY}`;
  const isCronSecret = CRON_SECRET && cronHeader === CRON_SECRET;

  if (!isServiceRole && !isCronSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: rows, error } = await supabase
    .from("notifications")
    .select("user_id, reminder_time, timezone, push_subscription, last_sent_at")
    .eq("enabled", true)
    .not("push_subscription", "is", null);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const now = new Date();
  const results = { sent: 0, skipped: 0, errors: 0 };

  for (const row of rows ?? []) {
    try {
      const tz = row.timezone || "UTC";

      // Today's date in user's timezone (en-CA gives YYYY-MM-DD)
      const tzDate = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(now);

      // Skip if already notified today
      if (row.last_sent_at) {
        const lastDate = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(
          new Date(row.last_sent_at),
        );
        if (lastDate === tzDate) {
          results.skipped++;
          continue;
        }
      }

      // Check if current local time is within ±2 minutes of reminder_time
      const [rh, rm] = (row.reminder_time as string).split(":").map(Number);
      const reminderMinutes = rh * 60 + rm;

      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "numeric",
        minute: "numeric",
        hour12: false,
      }).formatToParts(now);

      const hour = parseInt(parts.find((p) => p.type === "hour")!.value);
      const minute = parseInt(parts.find((p) => p.type === "minute")!.value);
      const currentMinutes = hour * 60 + minute;

      if (Math.abs(currentMinutes - reminderMinutes) > 2) {
        results.skipped++;
        continue;
      }

      // Skip if the day is already fully completed.
      // daily_logs stores one row per (habit, day) keyed on log_date — there is
      // no "date"/"score" column — so completion is derived via get_daily_score.
      const { data: scoreRows } = await supabase.rpc("get_daily_score", {
        p_user_id: row.user_id,
        p_date: tzDate,
      });
      const s = Array.isArray(scoreRows) ? scoreRows[0] : scoreRows;
      const maxScore = s?.max_score ?? 0;
      const score = s?.score ?? 0;

      // Fully done for the day → no reminder needed
      if (maxScore > 0 && score >= maxScore) {
        results.skipped++;
        continue;
      }

      // Send Web Push
      await webPush.sendNotification(
        row.push_subscription,
        JSON.stringify({
          title: "SigmaLog — Time to Log 🗿",
          body: "Your habits are waiting. Don't let today slip.",
        }),
      );

      // Record that we sent it
      await supabase
        .from("notifications")
        .update({ last_sent_at: now.toISOString() })
        .eq("user_id", row.user_id);

      results.sent++;
    } catch (err) {
      results.errors++;
      console.error(`Push failed for user ${row.user_id}:`, err);
    }
  }

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" },
  });
});
