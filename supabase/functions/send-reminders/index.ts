/**
 * send-reminders — Supabase Edge Function (Deno)
 *
 * Runs every minute via pg_cron. For each user with a saved web-push
 * subscription it can fire, evaluated in the user's own timezone:
 *
 *  PER-TASK (independent of the Settings toggle):
 *   • "Time to start <habit>" at each habit's reminder_time, once/day.
 *
 *  DAILY (only when daily_reminders_enabled = true):
 *   • 04:00 — "new day" push, once/day.
 *   • Evening "tasks left" — if the day isn't complete, at (latest habit
 *     reminder_time + 1h), or 21:00 if no habit has a time. Once/day.
 *   • All-done congrats (with streak) — 30 min after the last task is
 *     completed, once/day.
 *
 * Secrets: SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, CRON_SECRET
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import webPush from "npm:web-push@3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

webPush.setVapidDetails("mailto:rajat8615226@gmail.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const NEW_DAY = {
  title: "SigmaLog — New Day 🗿",
  body: "A fresh day, a clean slate. Win the first task and let the day follow.",
};
const TASKS_LEFT = {
  title: "SigmaLog — Don't Let Today Go",
  body: "You still have habits unfinished. Open SigmaLog and close the loop.",
};

const WINDOW_MIN = 2;          // ± minutes around a target time
const NEW_DAY_MIN = 4 * 60;    // 04:00
const DEFAULT_EVENING_MIN = 21 * 60; // 21:00 fallback for "tasks left"
const CONGRATS_DELAY_MIN = 30; // fire congrats 30 min after last completion

type Habit = { id: string; user_id: string; name: string; reminder_time: string | null; reminder_last_sent_date: string | null };

function toMinutes(t: string): number {
  const [h, m] = String(t).split(":").map(Number);
  return h * 60 + m;
}

function localParts(now: Date, tz: string) {
  const tzDate = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(now);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour: "numeric", minute: "numeric", hour12: false,
  }).formatToParts(now);
  const hour = parseInt(parts.find((p) => p.type === "hour")!.value);
  const minute = parseInt(parts.find((p) => p.type === "minute")!.value);
  return { tzDate, currentMinutes: hour * 60 + minute };
}

function sentOnLocalDay(iso: string | null, tz: string, tzDate: string): boolean {
  if (!iso) return false;
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(iso)) === tzDate;
}

const near = (a: number, b: number) => Math.abs(a - b) <= WINDOW_MIN;

Deno.serve(async (req) => {
  const auth = req.headers.get("Authorization") ?? "";
  const cronHeader = req.headers.get("X-Cron-Secret") ?? "";
  if (auth !== `Bearer ${SERVICE_ROLE_KEY}` && !(CRON_SECRET && cronHeader === CRON_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  const { data: users, error } = await supabase
    .from("notifications")
    .select("user_id, timezone, push_subscription, daily_reminders_enabled, morning_sent_at, evening_sent_at, congrats_sent_at")
    .not("push_subscription", "is", null);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  // Active habits with a per-task reminder time, grouped by user
  const { data: habitRows } = await supabase
    .from("habits")
    .select("id, user_id, name, reminder_time, reminder_last_sent_date")
    .eq("is_active", true)
    .not("reminder_time", "is", null);

  const habitsByUser = new Map<string, Habit[]>();
  for (const h of (habitRows ?? []) as Habit[]) {
    const list = habitsByUser.get(h.user_id) ?? [];
    list.push(h);
    habitsByUser.set(h.user_id, list);
  }

  const now = new Date();
  const results = { task: 0, newDay: 0, evening: 0, congrats: 0, skipped: 0, errors: 0 };

  for (const u of users ?? []) {
    try {
      const tz = u.timezone || "UTC";
      const { tzDate, currentMinutes } = localParts(now, tz);
      const sub = u.push_subscription;
      const myHabits = habitsByUser.get(u.user_id) ?? [];

      // ── PER-TASK reminders (independent of daily toggle) ──────────────────
      for (const h of myHabits) {
        if (!h.reminder_time) continue;
        if (!near(currentMinutes, toMinutes(h.reminder_time))) continue;
        if (h.reminder_last_sent_date === tzDate) continue;
        await webPush.sendNotification(sub, JSON.stringify({
          title: "SigmaLog — Time to start 🗿",
          body: `It's time to start "${h.name}". Begin now.`,
        }));
        await supabase.from("habits").update({ reminder_last_sent_date: tzDate }).eq("id", h.id);
        results.task++;
      }

      if (!u.daily_reminders_enabled) { results.skipped++; continue; }

      // ── 04:00 NEW DAY ─────────────────────────────────────────────────────
      if (near(currentMinutes, NEW_DAY_MIN) && !sentOnLocalDay(u.morning_sent_at, tz, tzDate)) {
        await webPush.sendNotification(sub, JSON.stringify(NEW_DAY));
        await supabase.from("notifications").update({ morning_sent_at: now.toISOString() }).eq("user_id", u.user_id);
        results.newDay++;
        continue;
      }

      // ── Completion-driven evening logic ───────────────────────────────────
      const { data: scoreRows } = await supabase.rpc("get_daily_score", { p_user_id: u.user_id, p_date: tzDate });
      const s = Array.isArray(scoreRows) ? scoreRows[0] : scoreRows;
      const maxScore = s?.max_score ?? 0;
      const score = s?.score ?? 0;
      if (maxScore === 0) { results.skipped++; continue; }

      if (score >= maxScore) {
        // CONGRATS — 30 min after the last completion
        if (sentOnLocalDay(u.congrats_sent_at, tz, tzDate)) { results.skipped++; continue; }
        const { data: lastLog } = await supabase
          .from("daily_logs")
          .select("completed_at")
          .eq("user_id", u.user_id)
          .eq("log_date", tzDate)
          .order("completed_at", { ascending: false })
          .limit(1);
        const lastAt = lastLog?.[0]?.completed_at ? new Date(lastLog[0].completed_at) : null;
        if (!lastAt || (now.getTime() - lastAt.getTime()) < CONGRATS_DELAY_MIN * 60_000) { results.skipped++; continue; }

        const { data: streak } = await supabase.rpc("calculate_streak", { p_user_id: u.user_id });
        const n = typeof streak === "number" ? streak : 0;
        await webPush.sendNotification(sub, JSON.stringify({
          title: "SigmaLog — Perfect Day 🔥",
          body: `All habits done. ${n} day${n === 1 ? "" : "s"} strong. Discipline is becoming who you are — don't break the chain.`,
        }));
        await supabase.from("notifications").update({ congrats_sent_at: now.toISOString() }).eq("user_id", u.user_id);
        results.congrats++;
      } else {
        // TASKS LEFT — at (latest habit reminder_time + 1h), else 21:00
        if (sentOnLocalDay(u.evening_sent_at, tz, tzDate)) { results.skipped++; continue; }
        const times = myHabits.map((h) => toMinutes(h.reminder_time!)).filter((n) => !isNaN(n));
        const nudgeMin = times.length ? Math.min(Math.max(...times) + 60, 23 * 60 + 59) : DEFAULT_EVENING_MIN;
        if (!near(currentMinutes, nudgeMin)) { results.skipped++; continue; }
        await webPush.sendNotification(sub, JSON.stringify(TASKS_LEFT));
        await supabase.from("notifications").update({ evening_sent_at: now.toISOString() }).eq("user_id", u.user_id);
        results.evening++;
      }
    } catch (err) {
      results.errors++;
      console.error(`Push failed for user ${u.user_id}:`, err);
    }
  }

  return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
});
