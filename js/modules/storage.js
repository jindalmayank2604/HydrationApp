/* ══════════════════════════════════════════
   MODULE: Storage
   Water entries → Firestore (per user UID)
   Goal / prefs  → localStorage (per device)
   ══════════════════════════════════════════ */

const LocalStorage = (() => {
  const ENTRIES_KEY  = 'wt_entries_v1';
  const REMINDER_KEY = 'wt_reminder_v1';
  const GOAL_KEY     = 'wt_goal_v1';
  const DEFAULT_GOAL = 3000;

  // Get UID for scoping keys — prevents data leaking between users on same device
  const _uid = () => {
    try {
      if (window.Firebase && Firebase.getUserId()) return '_' + Firebase.getUserId();
      if (window.Auth) { const s = Auth.getSession(); if (s && s.uid) return '_' + s.uid; }
    } catch(e) {}
    return '';
  };

  const readJSON  = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
  const writeJSON = (k, v)  => localStorage.setItem(k, JSON.stringify(v));

  const getEntries        = ()           => readJSON(ENTRIES_KEY, []);
  const saveEntries       = (e)          => writeJSON(ENTRIES_KEY, e);
  const addEntry          = (amt, date)  => { const e = getEntries(); e.push({ id: Date.now().toString(), amount: amt, date }); saveEntries(e); };
  const getEntriesForDate = (date)       => getEntries().filter(e => e.date === date);
  const getTotalForDate   = (date)       => getEntriesForDate(date).reduce((s, e) => s + e.amount, 0);
  const getDailyTotals    = ()           => getEntries().reduce((acc, entry) => {
    if (!entry?.date) return acc;
    acc[entry.date] = (acc[entry.date] || 0) + (Number(entry.amount) || 0);
    return acc;
  }, {});
  const setTotalForDate   = (date, t)    => { const e = getEntries().filter(e => e.date !== date); if (t > 0) e.push({ id: Date.now().toString(), amount: t, date }); saveEntries(e); };
  const deleteEntry       = (id)         => saveEntries(getEntries().filter(e => e.id !== id));
  const getAllDates        = ()           => [...new Set(getEntries().map(e => e.date))].sort().reverse();
  // Goal is scoped by UID — each user has their own goal
  const getGoal           = ()           => { const uid = _uid(); return uid ? (readJSON(GOAL_KEY + uid, null) ?? readJSON(GOAL_KEY, DEFAULT_GOAL)) : readJSON(GOAL_KEY, DEFAULT_GOAL); };
  const setGoal           = (g)          => { const uid = _uid(); writeJSON(GOAL_KEY, g); if (uid) writeJSON(GOAL_KEY + uid, g); };
  const getReminderPrefs  = ()           => readJSON(REMINDER_KEY, { enabled: false, interval: 60 });
  const setReminderPrefs  = (p)          => writeJSON(REMINDER_KEY, p);
  const resetAll          = ()           => localStorage.removeItem(ENTRIES_KEY);

  return { addEntry, getEntriesForDate, getTotalForDate, getDailyTotals, setTotalForDate, deleteEntry, getAllDates, getGoal, setGoal, getReminderPrefs, setReminderPrefs, resetAll };
})();

/* ── Storage proxy — Firestore first, localStorage fallback ── */
const Storage = (() => {

  const run = async (label, firestoreFn, localFn) => {
    const ready = await Firebase.waitUntilReady(5000);
    if (ready && Firebase.getUserId()) {
      try {
        const result = await firestoreFn();
        console.log(`[Storage] ✅ Firestore OK — ${label} (uid: ${Firebase.getUserId()})`);
        return result;
      } catch (e) {
        const canRetry = /permission|insufficient/i.test(e?.message || '');
        if (canRetry) {
          const retryReady = await Firebase.waitUntilReady(4000);
          if (retryReady) {
            try {
              const retryResult = await firestoreFn();
              console.log(`[Storage] ✅ Firestore retry OK — ${label} (uid: ${Firebase.getUserId()})`);
              return retryResult;
            } catch (retryError) {
              console.warn(`[Storage] ⚠️ Firestore retry failed for ${label}:`, retryError.message);
            }
          }
        }
        console.warn(`[Storage] ⚠️ Firestore failed for ${label}:`, e.message);
      }
    } else {
      console.warn(`[Storage] ⚠️ Firebase not ready for ${label} — using localStorage`);
    }
    return localFn();
  };

  const addEntry          = (amt, date) => run('addEntry',          () => Firebase.addEntry(amt, date),      () => LocalStorage.addEntry(amt, date));
  const getEntriesForDate = (date)      => run('getEntriesForDate', () => Firebase.getEntriesForDate(date),  () => LocalStorage.getEntriesForDate(date));
  const getTotalForDate   = (date)      => run('getTotalForDate',   () => Firebase.getTotalForDate(date),    () => LocalStorage.getTotalForDate(date));
  const getDailyTotals    = ()          => run('getDailyTotals',    () => Firebase.getDailyTotals(),         () => LocalStorage.getDailyTotals());
  const setTotalForDate   = (date, t)   => run('setTotalForDate',   () => Firebase.setTotalForDate(date, t), () => LocalStorage.setTotalForDate(date, t));
  const deleteEntry       = (id)        => run('deleteEntry',       () => Firebase.deleteEntry(id),          () => LocalStorage.deleteEntry(id));
  const getAllDates        = ()          => run('getAllDates',        () => Firebase.getAllDates(),             () => LocalStorage.getAllDates());

  const getGoal          = ()  => LocalStorage.getGoal();
  const setGoal          = (g) => LocalStorage.setGoal(g);
  const getReminderPrefs = ()  => LocalStorage.getReminderPrefs();
  const setReminderPrefs = (p) => LocalStorage.setReminderPrefs(p);
  const resetAll         = async ()  => { await Firebase.resetAllData(); LocalStorage.resetAll(); };

  return { addEntry, getEntriesForDate, getTotalForDate, getDailyTotals, setTotalForDate, deleteEntry, getAllDates, getGoal, setGoal, getReminderPrefs, setReminderPrefs, resetAll }; // resetAll now exported (STORE-1 fix)
})();
