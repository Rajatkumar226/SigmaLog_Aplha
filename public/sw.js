// SigmaLog Service Worker

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// ── Message from main thread ───────────────────────────────────────────────────
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

  // Action buttons for streak / share notifications (Chrome on Android + desktop)
  if (tag === 'sigmalog-streak' || tag === 'sigmalog-achievement') {
    options.actions = [
      { action: 'share', title: '📤 Share streak' },
      { action: 'open',  title: '🏠 Open app'    },
    ];
  }
  if (tag === 'sigmalog-share') {
    options.actions = [{ action: 'share', title: '📤 Share now' }];
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'SigmaLog 🗿', options)
  );
});

// ── Notification click ─────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const tag    = event.notification.data?.tag || '';

  // "share" action OR the entire share-prompt notification → open with ?share=1
  const openShare = action === 'share' || tag === 'sigmalog-share';
  const targetUrl = openShare ? '/?share=1' : '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if ('focus' in client) {
            client.postMessage({ type: 'NOTIFICATION_CLICK', action, tag, targetUrl });
            return client.focus();
          }
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});
