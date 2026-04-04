/* SERVICE WORKER — v2 — Network first, cache fallback */

const CACHE = 'wt-1774158108';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Always go to network for app files */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

/* Notifications */
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data?.type === 'SCHEDULE_NOTIFICATIONS') {
    const { intervalMinutes } = e.data;
    if (self._bgTimer) clearInterval(self._bgTimer);
    const msgs = ["Drink Water 💧","H2O time! ⏰💧","Your brain is 75% water 🧠💧","Stay hydrated! 💧"];
    self._bgTimer = setInterval(() => {
      self.registration.showNotification('Water Tracker 💧', {
        body: msgs[Math.floor(Math.random()*msgs.length)],
        icon: './assets/icon-192.png',
        tag: 'water-reminder', renotify: true, vibrate: [200,100,200],
      });
    }, intervalMinutes * 60 * 1000);
  }
  if (e.data?.type === 'STOP_NOTIFICATIONS') {
    if (self._bgTimer) { clearInterval(self._bgTimer); self._bgTimer = null; }
  }
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('./'));
});
