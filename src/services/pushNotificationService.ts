/**
 * Push Notification Service
 * Manages browser notification permission, service worker, and reminder logic.
 *
 * Works in two modes:
 *  1. On-load check  — fires when user opens the app
 *  2. Interval check — fires every minute while the tab is open / PWA is in background
 *
 * True background push (device sleeping, app fully closed) requires a server-side
 * Supabase Edge Function with VAPID Web Push — infrastructure is ready in notificationService.ts.
 */

let intervalId: ReturnType<typeof setInterval> | null = null;

// ── Support check ──────────────────────────────────────────────────────────────

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator;
}

export function getPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

// ── Permission ─────────────────────────────────────────────────────────────────

export async function requestPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return 'denied';
  }
}

// ── Service Worker ─────────────────────────────────────────────────────────────

export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return reg;
  } catch {
    return null;
  }
}

// ── Show notification via SW (bypasses stacking context / in-page JS limits) ──

export async function fireNotification(title: string, body: string): Promise<void> {
  if (getPermission() !== 'granted') return;

  try {
    // Prefer SW-based notification (works in background, shows on lock screen)
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, {
      body,
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg',
      vibrate: [200, 100, 200],
      tag: 'sigmalog-reminder',
      renotify: false,
    });
  } catch {
    // Fallback: direct Notification API (works when tab is focused)
    new Notification(title, { body, icon: '/icons/icon.svg' });
  }
}

// ── Reminder logic ─────────────────────────────────────────────────────────────

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isWithinReminderWindow(reminderTime: string): boolean {
  const [h, m] = reminderTime.split(':').map(Number);
  const now = new Date();
  const diff = now.getHours() * 60 + now.getMinutes() - (h * 60 + m);
  // Fire in the 30-minute window after the reminder time
  return diff >= 0 && diff <= 30;
}

function hasLoggedToday(dailyLogs: { date: string; score: number }[]): boolean {
  return dailyLogs.some(l => l.date === getTodayStr() && l.score > 0);
}

function alreadyNotifiedToday(): boolean {
  return localStorage.getItem('sigmalog_last_notified') === getTodayStr();
}

function markNotifiedToday(): void {
  localStorage.setItem('sigmalog_last_notified', getTodayStr());
}

export async function checkAndNotify(
  dailyLogs: { date: string; score: number }[],
): Promise<void> {
  const enabled = localStorage.getItem('sigmalog_notifications') === 'true';
  if (!enabled) return;
  if (getPermission() !== 'granted') return;

  const reminderTime = localStorage.getItem('sigmalog_reminder_time') || '20:00';
  if (!isWithinReminderWindow(reminderTime)) return;
  if (hasLoggedToday(dailyLogs)) return;
  if (alreadyNotifiedToday()) return;

  await fireNotification(
    'SigmaLog — Time to Log 🗿',
    "Your habits are waiting. Don't let today slip."
  );
  markNotifiedToday();
}

// ── Interval-based background check (while browser tab / PWA is running) ──────

export function startReminderInterval(
  getDailyLogs: () => { date: string; score: number }[],
): void {
  stopReminderInterval();
  // Check every 60 seconds
  intervalId = setInterval(() => {
    checkAndNotify(getDailyLogs());
  }, 60_000);
}

export function stopReminderInterval(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
