/**
 * Insights Service — "The Mirror"
 * ================================
 * Rules-based discipline analytics computed entirely client-side from the
 * user's own data (daily_logs + habits). No AI, no external API, no cost.
 *
 * It reuses logService.getLogsForDateRange / calculateStreak and
 * habitService.getHabits, then derives patterns and writes them up in the
 * SigmaLog voice.
 */

import * as logService from './logService';
import * as habitService from './habitService';

export type Tone = 'good' | 'bad' | 'neutral';

export interface InsightCard {
  id: string;
  icon: string;     // emoji
  label: string;    // small uppercase label
  stat: string;     // headline stat
  verdict: string;  // one-line blunt read
  tone: Tone;
}

export interface Insights {
  windowDays: number;
  hasEnoughData: boolean;
  daysTracked: number;
  overallRate: number;     // 0-100
  currentStreak: number;
  bestStreak: number;
  headline: string;
  subhead: string;
  cards: InsightCard[];
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const pad = (n: number) => String(n).padStart(2, '0');
const localDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const createdDate = (h: any) => String(h.created_at ?? '').slice(0, 10);

export async function getInsights(windowDays = 90): Promise<Insights> {
  const habitsResp = await habitService.getHabits();
  const habits = (habitsResp.success && habitsResp.data) ? habitsResp.data : [];

  const today = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (windowDays - 1));
  const startStr = localDateStr(start);
  const todayStr = localDateStr(today);

  const logsResp = await logService.getLogsForDateRange(startStr, todayStr);
  const logs = (logsResp.success && logsResp.data) ? logsResp.data : [];

  const streakResp = await logService.calculateStreak();
  const currentStreak = (streakResp.success && typeof streakResp.data === 'number') ? streakResp.data : 0;

  // Fast lookup of which (habit, day) were completed
  const completedSet = new Set(logs.map((l: any) => `${l.habit_id}|${l.log_date}`));

  // List of every calendar day in the window
  const days: string[] = [];
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(localDateStr(d));
  }

  // ── Per-day completion, weekday aggregation, totals ─────────────────────────
  let totalPossible = 0;
  let totalCompleted = 0;
  const perDayPct: Record<string, number> = {};
  const weekday = WEEKDAYS.map(() => ({ sum: 0, count: 0 }));
  const catAgg: Record<string, { poss: number; comp: number }> = {};

  for (const ds of days) {
    const active = habits.filter((h) => createdDate(h) <= ds);
    if (active.length === 0) continue;

    let completed = 0;
    for (const h of active) {
      const done = completedSet.has(`${h.id}|${ds}`);
      if (done) completed++;
      catAgg[h.category] ??= { poss: 0, comp: 0 };
      catAgg[h.category].poss++;
      if (done) catAgg[h.category].comp++;
    }

    const pct = (completed / active.length) * 100;
    perDayPct[ds] = pct;
    totalPossible += active.length;
    totalCompleted += completed;

    const wd = new Date(`${ds}T00:00:00`).getDay();
    weekday[wd].sum += pct;
    weekday[wd].count++;
  }

  const daysTracked = Object.keys(perDayPct).length;
  const overallRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  // Not enough signal yet
  if (daysTracked < 5 || logs.length === 0) {
    return {
      windowDays, hasEnoughData: false, daysTracked, overallRate,
      currentStreak, bestStreak: currentStreak,
      headline: 'The Mirror is still forming.',
      subhead: 'Log a few more days and your patterns will surface here — no hiding.',
      cards: [],
    };
  }

  // ── Best streak of perfect days within the window ───────────────────────────
  let bestStreak = 0;
  let run = 0;
  for (const ds of days) {
    if (!(ds in perDayPct)) continue;
    if (perDayPct[ds] >= 100) { run++; bestStreak = Math.max(bestStreak, run); }
    else run = 0;
  }
  bestStreak = Math.max(bestStreak, currentStreak);

  const cards: InsightCard[] = [];

  // ── Weekday best / worst ────────────────────────────────────────────────────
  const wdRates = weekday
    .map((w, i) => ({ day: WEEKDAYS[i], rate: w.count ? w.sum / w.count : null, count: w.count }))
    .filter((w) => w.rate !== null) as { day: string; rate: number; count: number }[];
  if (wdRates.length >= 2) {
    const best = wdRates.reduce((a, b) => (b.rate > a.rate ? b : a));
    const worst = wdRates.reduce((a, b) => (b.rate < a.rate ? b : a));
    if (best.day !== worst.day) {
      cards.push({
        id: 'weekday',
        icon: '📅',
        label: 'Your weak day',
        stat: `${worst.day} — ${Math.round(worst.rate)}%`,
        verdict: `Strongest on ${best.day} (${Math.round(best.rate)}%). ${worst.day} is where you leak. Plan for it.`,
        tone: worst.rate < 50 ? 'bad' : 'neutral',
      });
    }
  }

  // ── Category strongest / weakest ────────────────────────────────────────────
  const catRates = Object.entries(catAgg)
    .filter(([, v]) => v.poss > 0)
    .map(([cat, v]) => ({ cat, rate: (v.comp / v.poss) * 100 }));
  if (catRates.length >= 2) {
    const top = catRates.reduce((a, b) => (b.rate > a.rate ? b : a));
    const bottom = catRates.reduce((a, b) => (b.rate < a.rate ? b : a));
    if (top.cat !== bottom.cat) {
      cards.push({
        id: 'category',
        icon: '🧭',
        label: 'Discipline leak',
        stat: `${bottom.cat}: ${Math.round(bottom.rate)}%`,
        verdict: `${top.cat} is dialed in (${Math.round(top.rate)}%). ${bottom.cat} is the gap between who you are and who you say you are.`,
        tone: bottom.rate < 50 ? 'bad' : 'neutral',
      });
    }
  }

  // ── Per-habit most / least consistent ───────────────────────────────────────
  const habitRates = habits.map((h) => {
    const activeDays = days.filter((ds) => createdDate(h) <= ds).length;
    const completedDays = logs.filter((l: any) => l.habit_id === h.id).length;
    return { name: h.name, rate: activeDays > 0 ? (completedDays / activeDays) * 100 : 0, activeDays };
  }).filter((h) => h.activeDays >= 3);
  if (habitRates.length >= 1) {
    const worst = habitRates.reduce((a, b) => (b.rate < a.rate ? b : a));
    const best = habitRates.reduce((a, b) => (b.rate > a.rate ? b : a));
    cards.push({
      id: 'habit-strong',
      icon: '🏆',
      label: 'Your anchor',
      stat: `${best.name} — ${Math.round(best.rate)}%`,
      verdict: `Your most reliable habit. This is proof you can hold a standard.`,
      tone: 'good',
    });
    if (habitRates.length >= 2 && worst.name !== best.name) {
      cards.push({
        id: 'habit-weak',
        icon: '⚠️',
        label: 'Weakest link',
        stat: `${worst.name} — ${Math.round(worst.rate)}%`,
        verdict: `You commit to it but skip it most. Shrink it or schedule it — don't keep lying to yourself.`,
        tone: worst.rate < 50 ? 'bad' : 'neutral',
      });
    }
  }

  // ── Time of day ─────────────────────────────────────────────────────────────
  let beforeNoon = 0;
  let timed = 0;
  for (const l of logs as any[]) {
    if (!l.completed_at) continue;
    timed++;
    if (new Date(l.completed_at).getHours() < 12) beforeNoon++;
  }
  if (timed >= 8) {
    const bn = Math.round((beforeNoon / timed) * 100);
    cards.push({
      id: 'timeofday',
      icon: bn >= 50 ? '🌅' : '🌙',
      label: 'When you execute',
      stat: bn >= 50 ? `${bn}% before noon` : `${100 - bn}% after noon`,
      verdict: bn >= 50
        ? 'You win the morning. Stack your hardest habit there before the day fights back.'
        : 'You run late in the day — which is also when willpower dies. Move one habit to the morning.',
      tone: 'neutral',
    });
  }

  // ── Streak card ─────────────────────────────────────────────────────────────
  cards.push({
    id: 'streak',
    icon: '🔥',
    label: 'Perfect-day streak',
    stat: `${currentStreak} day${currentStreak === 1 ? '' : 's'}`,
    verdict: currentStreak >= bestStreak && currentStreak > 0
      ? `Best run yet. Don't be the one who breaks it.`
      : `Your record is ${bestStreak}. Beat it.`,
    tone: currentStreak > 0 ? 'good' : 'bad',
  });

  // ── Headline ────────────────────────────────────────────────────────────────
  let headline: string;
  let subhead: string;
  if (overallRate >= 80) {
    headline = `Locked in — ${overallRate}%.`;
    subhead = `Over ${daysTracked} days you've held the line. Now widen the gap on your weak spots below.`;
  } else if (overallRate >= 50) {
    headline = `Inconsistent — ${overallRate}%.`;
    subhead = `You show up about half the time. The patterns below are exactly where the discipline leaks.`;
  } else {
    headline = `Slipping — ${overallRate}%.`;
    subhead = `Most days are getting away from you. Don't look away — fix one pattern below this week.`;
  }

  return {
    windowDays, hasEnoughData: true, daysTracked, overallRate,
    currentStreak, bestStreak, headline, subhead, cards,
  };
}
