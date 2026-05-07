/**
 * Push Notification Service
 *
 * Phase 1 — browser-based (when tab/PWA is open):
 *   registerSW / checkAndNotify / startReminderInterval
 *
 * Phase 2 — VAPID server-side (true background push):
 *   subscribeToWebPush / savePushSubscription / unsubscribeFromWebPush
 *   (subscription saved to DB; Edge Function send-reminders delivers the push)
 */

import { supabase } from '../lib/supabase/client';

let intervalId: ReturnType<typeof setInterval> | null = null;

// ── Support check ──────────────────────────────────────────────────────────────

export function isNotificationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

export function getPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

// ── Permission ─────────────────────────────────────────────────────────────────

export async function requestPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

// ── Service Worker ─────────────────────────────────────────────────────────────

export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch {
    return null;
  }
}

// ── Direct notification (browser-based, Phase 1) ──────────────────────────────

export async function fireNotification(
  title: string,
  body: string,
  tag = 'sigmalog-reminder',
): Promise<void> {
  if (getPermission() !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, {
      body,
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg',
      vibrate: [200, 100, 200],
      tag,
      renotify: true,
    });
  } catch {
    new Notification(title, { body, icon: '/icons/icon.svg' });
  }
}

// ── VAPID Web Push (Phase 2) ───────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export async function subscribeToWebPush(): Promise<PushSubscription | null> {
  if (getPermission() !== 'granted') return null;
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!vapidKey) return null;

  try {
    const reg = await navigator.serviceWorker.ready;
    // Reuse existing subscription if available
    const existing = await reg.pushManager.getSubscription();
    if (existing) return existing;

    return await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
  } catch {
    return null;
  }
}

export async function savePushSubscription(subscription: PushSubscription): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('notifications')
    .upsert(
      { user_id: user.id, push_subscription: subscription.toJSON(), enabled: true },
      { onConflict: 'user_id' },
    );
}

export async function unsubscribeFromWebPush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
  } catch { /* ignore */ }

  // Clear subscription from DB
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('notifications')
    .update({ push_subscription: null })
    .eq('user_id', user.id);
}

// ── Reminder logic (Phase 1, browser-based) ───────────────────────────────────

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isWithinReminderWindow(reminderTime: string): boolean {
  const [h, m] = reminderTime.split(':').map(Number);
  const now = new Date();
  const diff = now.getHours() * 60 + now.getMinutes() - (h * 60 + m);
  return diff >= 0 && diff <= 30;
}

function hasLoggedToday(dailyLogs: { date: string; score: number }[]): boolean {
  return dailyLogs.some((l) => l.date === getTodayStr() && l.score > 0);
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
  if (localStorage.getItem('sigmalog_notifications') !== 'true') return;
  if (getPermission() !== 'granted') return;

  const reminderTime = localStorage.getItem('sigmalog_reminder_time') || '20:00';
  if (!isWithinReminderWindow(reminderTime)) return;
  if (hasLoggedToday(dailyLogs)) return;
  if (alreadyNotifiedToday()) return;

  await fireNotification(
    'SigmaLog — Time to Log 🗿',
    "Your habits are waiting. Don't let today slip.",
  );
  markNotifiedToday();
}

// ── Interval-based check (while tab is open) ──────────────────────────────────

export function startReminderInterval(
  getDailyLogs: () => { date: string; score: number }[],
): void {
  stopReminderInterval();
  intervalId = setInterval(() => checkAndNotify(getDailyLogs()), 60_000);
}

export function stopReminderInterval(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
