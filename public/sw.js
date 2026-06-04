// SigmaLog Service Worker

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// ── Message from main thread (browser-based, app open) ─────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    const { title, body } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: '/icons/icon.svg',
        badge: '/icons/icon.svg',
        vibrate: [200, 100, 200],
        tag: 'sigmalog-reminder',
        renotify: false,
        data: { url: '/', tag: 'sigmalog-reminder' },
      })
    );
  }
});

// ── Server-sent Web Push ───────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const tag = data.tag || 'sigmalog-reminder';

  const options = {
    body: data.body || "Your habits are waiting. Don't break the chain.",
    icon: '/icons/icon.svg',
    badge: '/icons/icon.svg',
    vibrate: [200, 100, 200],
    tag,
    renotify: true,
    data: { url: data.url || '/', tag },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'SigmaLog 🗿', options)
  );
});

// ── Notification click → focus or open the app ─────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if ('focus' in client) return client.focus();
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});
