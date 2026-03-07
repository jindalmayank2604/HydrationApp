/* ══════════════════════════════════════════
   MODULE: Storage
   - LocalStorage: goal, reminder prefs, offline fallback
   - Firestore: all water entries (per user, any device)
   ══════════════════════════════════════════ */

/* ── LocalStorage (device-level) ── */
const LocalStorage = (() => {
  const ENTRIES_KEY  = 'wt_entries_v1';
  const REMINDER_KEY = 'wt_reminder_v1';
  const GOAL_KEY     = 'wt_goal_v1';
  const DEFAULT_GOAL = 3000;

  const readJSON  = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
  const writeJSON = (k, v)  => localStorage.setItem(k, JSON.stringify(v));

  const getEntries    = ()           => readJSON(ENTRIES_KEY, []);
  const saveEntries   = (e)          => writeJSON(ENTRIES_KEY, e);
  const addEntry      = (amt, date)  => { const e = getEntries(); e.push({ id: Date.now().toString(), amount: amt, date }); saveEntries(e); };
  const getEntriesForDate = (date)   => getEntries().filter(e => e.date === date);
  const getTotalForDate   = (date)   => getEntriesForDate(date).reduce((s, e) => s + e.amount, 0);
  const setTotalForDate   = (date, t)=> { const e = getEntries().filter(e => e.date !== date); if (t > 0) e.push({ id: Date.now().toString(), amount: t, date }); saveEntries(e); };
  const deleteEntry       = (id)     => saveEntries(getEntries().filter(e => e.id !== id));
  const getAllDates        = ()       => [...new Set(getEntries().map(e => e.date))].sort().reverse();
  const getGoal           = ()       => readJSON(GOAL_KEY, DEFAULT_GOAL);
  const setGoal           = (g)      => writeJSON(GOAL_KEY, g);
  const getReminderPrefs  = ()       => readJSON(REMINDER_KEY, { enabled: false, interval: 60 });
  const setReminderPrefs  = (p)      => writeJSON(REMINDER_KEY, p);
  const resetAll          = ()       => localStorage.removeItem(ENTRIES_KEY);

  return { addEntry, getEntriesForDate, getTotalForDate, setTotalForDate, deleteEntry, getAllDates, getGoal, setGoal, getReminderPrefs, setReminderPrefs, resetAll };
})();

/* ── Storage proxy — Firestore first, localStorage fallback ── */
const Storage = (() => {

  const run = async (firestoreFn, localFn) => {
    const ready = await Firebase.waitUntilReady(5000);
    if (ready) {
      try {
        const result = await firestoreFn();
        return result;
      } catch (e) {
        console.warn('[Storage] Firestore error, using localStorage:', e.message);
      }
    } else {
      console.warn('[Storage] Firebase not ready in time, using localStorage');
    }
    return localFn();
  };

  const addEntry          = (amt, date) => run(() => Firebase.addEntry(amt, date),       () => LocalStorage.addEntry(amt, date));
  const getEntriesForDate = (date)      => run(() => Firebase.getEntriesForDate(date),   () => LocalStorage.getEntriesForDate(date));
  const getTotalForDate   = (date)      => run(() => Firebase.getTotalForDate(date),      () => LocalStorage.getTotalForDate(date));
  const setTotalForDate   = (date, t)   => run(() => Firebase.setTotalForDate(date, t),  () => LocalStorage.setTotalForDate(date, t));
  const deleteEntry       = (id)        => run(() => Firebase.deleteEntry(id),            () => LocalStorage.deleteEntry(id));
  const getAllDates        = ()          => run(() => Firebase.getAllDates(),               () => LocalStorage.getAllDates());

  // These always use localStorage (device preferences)
  const getGoal          = ()  => LocalStorage.getGoal();
  const setGoal          = (g) => LocalStorage.setGoal(g);
  const getReminderPrefs = ()  => LocalStorage.getReminderPrefs();
  const setReminderPrefs = (p) => LocalStorage.setReminderPrefs(p);
  const resetAll         = ()  => Firebase.resetAllData();

  return { addEntry, getEntriesForDate, getTotalForDate, setTotalForDate, deleteEntry, getAllDates, getGoal, setGoal, getReminderPrefs, setReminderPrefs, resetAll };
})();
