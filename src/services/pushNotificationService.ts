/**
 * Push Notification Service
 * =========================
 * VAPID Web Push (true background push — fires even when the app is closed).
 *
 * Flow when the user enables notifications:
 *   registerSW → requestPermission → subscribeToWebPush → savePushSubscription
 * The browser PushSubscription is stored in public.notifications.push_subscription,
 * and the `send-reminders` Edge Function delivers morning/evening pushes on a cron.
 */

import { supabase } from '../lib/supabase/client';

// ── Support / permission ───────────────────────────────────────────────────────

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

export async function requestPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

// ── Service worker ─────────────────────────────────────────────────────────────

export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch {
    return null;
  }
}

// ── VAPID Web Push ─────────────────────────────────────────────────────────────

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
  if (!vapidKey) {
    console.warn('VITE_VAPID_PUBLIC_KEY is not set — cannot subscribe to web push');
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    // Reuse an existing subscription if the browser already has one
    const existing = await reg.pushManager.getSubscription();
    if (existing) return existing;

    return await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
  } catch (err) {
    console.error('Failed to subscribe to web push:', err);
    return null;
  }
}

/**
 * Persist the subscription plus the user's local timezone and evening reminder
 * time so the Edge Function can fire morning/evening pushes at the right moment.
 */
export async function savePushSubscription(
  subscription: PushSubscription,
  opts?: { reminderTime?: string },
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('notifications')
    .upsert(
      {
        user_id: user.id,
        push_subscription: subscription.toJSON() as any,
        enabled: true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ...(opts?.reminderTime ? { reminder_time: opts.reminderTime } : {}),
      },
      { onConflict: 'user_id' },
    );

  return !error;
}

/** Update just the evening reminder time for the current user. */
export async function updateReminderTime(reminderTime: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('notifications')
    .update({ reminder_time: reminderTime })
    .eq('user_id', user.id);
}

export async function unsubscribeFromWebPush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
  } catch {
    /* ignore */
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('notifications')
    .update({ push_subscription: null, enabled: false })
    .eq('user_id', user.id);
}

/**
 * High-level helper for the Settings toggle: registers the SW, asks permission,
 * subscribes, and saves. Returns a result the UI can react to.
 */
export async function enablePushNotifications(
  reminderTime: string,
): Promise<{ ok: boolean; reason?: 'unsupported' | 'denied' | 'no-vapid' | 'failed' }> {
  if (!isNotificationSupported()) return { ok: false, reason: 'unsupported' };

  await registerSW();

  const permission = await requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'denied' };

  const subscription = await subscribeToWebPush();
  if (!subscription) {
    const reason = import.meta.env.VITE_VAPID_PUBLIC_KEY ? 'failed' : 'no-vapid';
    return { ok: false, reason };
  }

  const saved = await savePushSubscription(subscription, { reminderTime });
  return saved ? { ok: true } : { ok: false, reason: 'failed' };
}
