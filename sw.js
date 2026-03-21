/* ══════════════════════════════════════════
   SERVICE WORKER — Cache + Background Notifications
   ══════════════════════════════════════════ */

const CACHE_NAME = 'water-tracker-v255';

const ASSETS = [
  '/HydrationApp/',
  '/HydrationApp/index.html',
  '/HydrationApp/manifest.json',
  '/HydrationApp/css/tokens.css',
  '/HydrationApp/css/base.css',
  '/HydrationApp/css/components.css',
  '/HydrationApp/css/screens.css',
  '/HydrationApp/js/app.js',
  '/HydrationApp/js/modules/storage.js',
  '/HydrationApp/js/modules/utils.js',
  '/HydrationApp/js/modules/router.js',
  '/HydrationApp/js/modules/notifications.js',
  '/HydrationApp/js/modules/firebase.js',
  '/HydrationApp/js/modules/auth.js',
  '/HydrationApp/js/screens/home.js',
  '/HydrationApp/js/screens/history.js',
  '/HydrationApp/js/screens/reminder.js',
  '/HydrationApp/js/screens/settings.js',
  '/HydrationApp/js/screens/login.js',
  '/HydrationApp/assets/icon-192.png',
  '/HydrationApp/assets/icon-512.png',
];

const WATER_MESSAGES = [
  "Drink Water 💧 Stay Hydrated!",
  "It's H2O o'Clock! ⏰💧",
  "Your cells are SCREAMING for water 🔬💦",
  "The vibes are dehydrated. Fix that. ✨💧",
  "Bro. Water. Now. Your kidneys filed a complaint. 🫘📋",
  "Your brain is 75% water. It's shrinking. 🧠💧",
  "Main character energy = staying hydrated. 🎬💧",
  "Breaking: local human forgets water again 📰💧",
  "Hydration station calling — your body is on hold 📞💧",
  "The water isn't going to drink itself. We checked. 💧",
];

const randomMsg = () => WATER_MESSAGES[Math.floor(Math.random() * WATER_MESSAGES.length)];
const icon = '/HydrationApp/assets/icon-192.png';

/* ── Install ── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

/* ── Activate ── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* ── Fetch ── */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') return caches.match('/HydrationApp/index.html');
      });
    })
  );
});

/* ── Periodic Background Sync (Chrome Android — fires even when app closed) ── */
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'water-reminder') {
    event.waitUntil(
      self.registration.showNotification('Water Tracker 💧', {
        body: randomMsg(),
        icon,
        badge: icon,
        tag: 'water-reminder',
        renotify: true,
        vibrate: [200, 100, 200],
      })
    );
  }
});

/* ── Push event (from server push) ── */
self.addEventListener('push', (event) => {
  const data = event.data?.json().catch(() => ({})) || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Water Tracker 💧', {
      body: data.body || randomMsg(),
      icon,
      badge: icon,
      tag: 'water-reminder',
      renotify: true,
      vibrate: [200, 100, 200],
    })
  );
});

/* ── Message from app (schedule/stop) ── */
let bgTimer = null;

self.addEventListener('message', (event) => {
  // Allow app to force SW activation immediately
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (event.data?.type === 'SCHEDULE_NOTIFICATIONS') {
    const { intervalMinutes } = event.data;
    if (bgTimer) clearInterval(bgTimer);
    bgTimer = setInterval(() => {
      self.registration.showNotification('Water Tracker 💧', {
        body: randomMsg(), icon, badge: icon,
        tag: 'water-reminder', renotify: true, vibrate: [200, 100, 200],
      });
    }, intervalMinutes * 60 * 1000);
  }
  if (event.data?.type === 'STOP_NOTIFICATIONS') {
    if (bgTimer) { clearInterval(bgTimer); bgTimer = null; }
  }
});

/* ── Notification click → open app ── */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if (list.length > 0) return list[0].focus();
      return clients.openWindow('/HydrationApp/');
    })
  );
});
