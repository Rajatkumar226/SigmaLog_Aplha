import { fireNotification, isNotificationSupported, getPermission } from './pushNotificationService';
import type { Habit } from '../App';

// ── Tagline pools ──────────────────────────────────────────────────────────────

const DAILY_TAGLINES: Record<string, string[]> = {
  Body: [
    "Your body is your temple — you honored it today 🏛️",
    "Sweat doesn't lie. You showed up when it mattered 💪",
    "Every rep builds the version of you you're becoming 🔥",
    "You chose discipline over comfort. Your body remembers that ⚡",
    "Iron sharpens iron. You sharpened yourself today 🗡️",
    "Most people talk about getting fit. You're actually doing it 🏆",
    "Your future self is grateful for what you did just now 🙌",
    "Pain today, power tomorrow. You're building both 💥",
  ],
  Mind: [
    "Your mind is sharper than it was yesterday. Compound it 🧠",
    "Clarity comes to those who do the work — and you did 🔮",
    "You fed your mind today. Watch it compound over months 📈",
    "Mental strength is built one day at a time. Today's rep is done 🌟",
    "Knowledge without action is nothing. You chose both today 💡",
    "Every book read, every lesson learned — it's all accumulating 📚",
    "The sharpest minds are forged through daily practice. Yours is too ✨",
    "You didn't just think about growing. You actually grew today 🌱",
  ],
  Career: [
    "Execution beats intention every single time. You proved that 🚀",
    "Another brick in the wall of your empire. Keep laying them 🏢",
    "Success isn't given. It's built today, exactly like this 💼",
    "You're not working for a salary — you're building a legacy 🌐",
    "Champions show up even when they don't feel like it. You did 🏅",
    "Every hour of focused work is an asset your future self earns 💰",
    "Mediocrity is comfortable. You chose excellence instead 🔑",
    "The gap between you and your competition just widened today 📊",
  ],
  Discipline: [
    "Discipline is choosing who you want to be over how you feel ⚔️",
    "You did hard things today. Most people won't. That's the point 🔱",
    "The sigma doesn't negotiate with comfort. You proved that 🗿",
    "Every disciplined day writes a chapter of your future story 📖",
    "You won today. The streak continues because you refused to quit 💎",
    "Motivation fades. Discipline stays. You built more discipline today 🏗️",
    "The hard path now is the easy path later. You're on the right road ⛰️",
    "Your habits are becoming your identity. This is who you are now 🦅",
  ],
};

const DAILY_GENERAL: string[] = [
  "Today's discipline is tomorrow's freedom 🦅",
  "You showed up. That's the whole game 🎯",
  "Small wins stack. You just added to your stack 📦",
  "Progress over perfection — but you nailed both today 🏹",
  "The version of you from last year would be proud 🌱",
  "Consistency is the compound interest of excellence 📊",
  "Champions are made in the moments when no one's watching 🔥",
  "You outworked your past self today. Tomorrow, do it again ⚡",
  "Sigma mode: engaged. Habits done. Day won. 🗿",
  "Every day you complete is proof that you're serious 💯",
];

const STREAK_TAGLINES: Record<number, string[]> = {
  7: [
    "7 days straight. The chain is forged — now keep it unbreakable ⛓️",
    "One week of pure sigma energy. Your streak is real. Don't stop now 🔥",
    "7 days done. This is where most people quit. Not you. Never you 💎",
  ],
  14: [
    "2 weeks of locked-in discipline. You are not the same person you were ✨",
    "14 days. Half a month of choosing growth over comfort. Remarkable 🚀",
    "Two weeks strong. Your habits are starting to rewire your identity 🧬",
  ],
  21: [
    "21 days — science says a habit takes 21 days. Yours are now permanent 🧬",
    "Three weeks. The discipline is no longer forced. It's who you are 🏆",
    "21 days of sigma energy. This is identity-level change. Own it ⚔️",
  ],
  30: [
    "30 days. A full month of unbroken discipline. Most quit at day 3. Not you 🏅",
    "One month in. You've built something 99% of people never achieve 🌟",
    "30 days straight — this is legendary territory. Welcome to the top 1% 👑",
  ],
  60: [
    "60 days. Two months of relentless consistency. This is rare 💎",
    "You've now spent 60 days investing in yourself. The returns are coming 📈",
    "60 days of discipline. The foundation is solid. Now build the skyscraper 🏗️",
  ],
  90: [
    "90 days. One full season of pure discipline. Your brain is rewired 🧠",
    "Three months strong. You've proven you can do what most dream about 🗿",
    "90 days in — you didn't just build habits, you built a new identity 🦅",
  ],
  180: [
    "Half a year of choosing discipline over comfort. That's legendary 👑",
    "180 days. Six months of sigma energy. You're in a category of one 🔱",
    "Half a year — most people can't make it 2 weeks. You did six months 💫",
  ],
  365: [
    "365 days. A full year. You've done what 99.9% of people never do 🏆",
    "One year of unbroken discipline. You are the standard now 👑",
    "365 days of sigma — you didn't just build habits, you built a legacy 🌟",
  ],
};

const SHARE_PROMPTS: string[] = [
  "Your {n}-day streak is proof that discipline wins. Share it — inspire someone today 💪",
  "{n} days of sigma energy. Don't keep that to yourself. Show your people 🔥",
  "A {n}-day streak deserves witnesses. Share your discipline and spark a chain reaction 🏆",
  "You're on a {n}-day streak — someone in your circle needs to see this today 💎",
  "{n} days done. Real ones share real progress. Let them see what consistency looks like 🗿",
];

// ── Deduplication ──────────────────────────────────────────────────────────────

const RECENT_KEY = 'sigmalog_recent_taglines';
const MAX_RECENT = 8;

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}

function trackShown(tagline: string): void {
  const recent = getRecent();
  const updated = [tagline, ...recent.filter(t => t !== tagline)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
}

function pickFrom(pool: string[]): string {
  const recent = getRecent();
  const fresh = pool.filter(t => !recent.includes(t));
  const source = fresh.length > 0 ? fresh : pool;
  const pick = source[Math.floor(Math.random() * source.length)];
  trackShown(pick);
  return pick;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function dominantCategory(habits: Habit[]): string {
  const counts: Record<string, number> = {};
  habits.forEach(h => { counts[h.category] = (counts[h.category] || 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : 'Discipline';
}

function canNotify(): boolean {
  return isNotificationSupported() && getPermission() === 'granted';
}

function habitSummary(habits: Habit[]): string {
  return habits.map(h => h.name).slice(0, 2).join(' & ');
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function notifyDailyComplete(habits: Habit[], streak: number): Promise<void> {
  if (!canNotify()) return;

  const category = dominantCategory(habits);
  const categoryPool = DAILY_TAGLINES[category] ?? [];
  const combined = [...categoryPool, ...DAILY_GENERAL];
  const tagline = pickFrom(combined);

  const streakSuffix = streak > 1 ? ` · ${streak} day streak 🔥` : '';
  const title = `All habits done!${streakSuffix}`;

  await fireNotification(title, tagline, 'sigmalog-achievement');
}

export async function notifyStreakMilestone(habits: Habit[], streak: number): Promise<void> {
  if (!canNotify()) return;

  const milestones = [7, 14, 21, 30, 60, 90, 180, 365];
  const milestone = milestones.filter(m => streak >= m).pop();
  if (!milestone) return;

  const pool = STREAK_TAGLINES[milestone] ?? [`${streak} day streak — keep going! 🔥`];
  const body = pickFrom(pool);
  const summary = habitSummary(habits);
  const title = summary
    ? `${streak}-Day Streak 🏆 — ${summary}`
    : `${streak}-Day Streak Achieved 🏆`;

  await fireNotification(title, body, 'sigmalog-streak');
}

export async function notifySharePrompt(streak: number): Promise<void> {
  if (!canNotify()) return;

  const template = SHARE_PROMPTS[Math.floor(Math.random() * SHARE_PROMPTS.length)];
  const body = template.replace(/\{n\}/g, String(streak));

  await fireNotification(
    '📤 Share Your Streak',
    body,
    'sigmalog-share',
  );
}
