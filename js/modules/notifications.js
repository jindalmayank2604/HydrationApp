const Notifier = (() => {

  const messages = [
    "Drink Water 💧 Stay Hydrated!",
    "Time to hydrate! Your body needs water 💧",
    "It's H2O o'Clock! ⏰💧",
    "Your cells are SCREAMING for water 🔬💦",
    "The vibes are dehydrated. Fix that. ✨💧",
    "Bro. Water. Now. Your kidneys filed a complaint. 🫘📋",
    "Every sip is a love letter to your future self 💌💧",
    "Your brain is 75% water. It's shrinking. 🧠💧",
    "Main character energy = staying hydrated. 🎬💧",
    "Breaking: local human forgets water again 📰💧",
    "Hydration station calling — your body is on hold 📞💧",
    "The water isn't going to drink itself. We checked. 💧",
    "If plants can drink water to survive, so can you bestie 🌱💧",
    "Keep going! Stay hydrated for better health! 🌊",
  ];

  let localTimer = null;

  const randomMsg = () => messages[Math.floor(Math.random() * messages.length)];
  const icon = '/HydrationApp/assets/icon-192.png';

  /* ── Request permission ── */
  const requestPermission = async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    const result = await Notification.requestPermission();
    return result === 'granted';
  };

  /* ── Show notification via SW ── */
  const showNotification = async () => {
    if (Notification.permission !== 'granted') return;
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification('Water Tracker 💧', {
          body: randomMsg(), icon, badge: icon,
          tag: 'water-reminder', renotify: true,
          vibrate: [200, 100, 200],
        });
      } else {
        new Notification('Water Tracker 💧', { body: randomMsg(), icon });
      }
    } catch (e) { console.warn('Notification error:', e); }
  };

  /* ── Tell SW to run background timer ── */
  const scheduleWithSW = async (intervalMinutes) => {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg.active) {
        reg.active.postMessage({ type: 'SCHEDULE_NOTIFICATIONS', intervalMinutes });
      }
    } catch (e) { console.warn('SW schedule error:', e); }
  };

  const stopSW = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg.active) reg.active.postMessage({ type: 'STOP_NOTIFICATIONS' });
    } catch {}
  };

  /* ── START ── */
  const start = async (intervalMinutes) => {
    stop();
    const granted = await requestPermission();
    if (!granted) return false;

    // In-app timer
    localTimer = setInterval(showNotification, intervalMinutes * 60 * 1000);

    // SW background timer
    scheduleWithSW(intervalMinutes);

    // Save prefs
    Storage.saveReminderPrefs({ enabled: true, interval: intervalMinutes });

    return true;
  };

  /* ── STOP ── */
  const stop = () => {
    if (localTimer) { clearInterval(localTimer); localTimer = null; }
    stopSW();
    Storage.saveReminderPrefs({ enabled: false, interval: 30 });
  };

  const isActive    = () => localTimer !== null;
  const getMessages = () => messages;

  return { start, stop, isActive, requestPermission, showNotification, getMessages };
})();
