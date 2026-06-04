/**
 * send-reminders — Supabase Edge Function (Deno)
 *
 * Runs on a cron schedule (every minute via pg_cron). For each user that is
 * enabled and has a saved web-push subscription, it sends:
 *   • a MORNING push at their morning_reminder_time (default 08:00), once/day
 *   • an EVENING push at their reminder_time, once/day, ONLY if the day's
 *     habits are not fully completed
 * Times are evaluated in each user's own timezone.
 *
 * Required secrets (set via `supabase secrets set`):
 *   SUPABASE_SERVICE_ROLE_KEY
 *   VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY
 *   CRON_SECRET   (arbitrary string; must match the X-Cron-Secret header)
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

const MORNING = {
  title: "SigmaLog - New Day, New Standard",
  body: "Start clean. Win the first task and let the day follow.",
};
const EVENING = {
  title: "SigmaLog - Do Not Let Today Go",
  body: "One unfinished habit is still a choice. Open SigmaLog and close the loop.",
};

const WINDOW_MIN = 2; // ± minutes around the target time

function toMinutes(time: string): number {
  const [h, m] = String(time).split(":").map(Number);
  return h * 60 + m;
}

function localParts(now: Date, tz: string): { tzDate: string; currentMinutes: number } {
  const tzDate = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(now);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);
  const hour = parseInt(parts.find((p) => p.type === "hour")!.value);
  const minute = parseInt(parts.find((p) => p.type === "minute")!.value);
  return { tzDate, currentMinutes: hour * 60 + minute };
}

function sentOnLocalDay(iso: string | null, tz: string, tzDate: string): boolean {
  if (!iso) return false;
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(iso)) === tzDate;
}

Deno.serve(async (req) => {
  // Allow the Supabase scheduler (service role) or an explicit CRON_SECRET header
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
    .select(
      "user_id, reminder_time, morning_reminder_time, timezone, push_subscription, morning_sent_at, evening_sent_at",
    )
    .eq("enabled", true)
    .not("push_subscription", "is", null);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const now = new Date();
  const results = { morning: 0, evening: 0, skipped: 0, errors: 0 };

  for (const row of rows ?? []) {
    try {
      const tz = row.timezone || "UTC";
      const { tzDate, currentMinutes } = localParts(now, tz);

      // ── MORNING: every subscribed user, once per local day ──────────────────
      const morningMin = toMinutes(row.morning_reminder_time || "08:00:00");
      if (
        Math.abs(currentMinutes - morningMin) <= WINDOW_MIN &&
        !sentOnLocalDay(row.morning_sent_at, tz, tzDate)
      ) {
        await webPush.sendNotification(row.push_subscription, JSON.stringify(MORNING));
        await supabase
          .from("notifications")
          .update({ morning_sent_at: now.toISOString() })
          .eq("user_id", row.user_id);
        results.morning++;
        continue;
      }

      // ── EVENING: only if the day's habits are not fully completed ───────────
      const eveningMin = toMinutes(row.reminder_time || "20:00:00");
      if (
        Math.abs(currentMinutes - eveningMin) <= WINDOW_MIN &&
        !sentOnLocalDay(row.evening_sent_at, tz, tzDate)
      ) {
        const { data: scoreRows } = await supabase.rpc("get_daily_score", {
          p_user_id: row.user_id,
          p_date: tzDate,
        });
        const s = Array.isArray(scoreRows) ? scoreRows[0] : scoreRows;
        const maxScore = s?.max_score ?? 0;
        const score = s?.score ?? 0;

        // No habits, or already fully completed → nothing to nag about
        if (maxScore === 0 || score >= maxScore) {
          results.skipped++;
          continue;
        }

        await webPush.sendNotification(row.push_subscription, JSON.stringify(EVENING));
        await supabase
          .from("notifications")
          .update({ evening_sent_at: now.toISOString() })
          .eq("user_id", row.user_id);
        results.evening++;
        continue;
      }

      results.skipped++;
    } catch (err) {
      results.errors++;
      console.error(`Push failed for user ${row.user_id}:`, err);
    }
  }

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" },
  });
});
