/* ══════════════════════════════════════════
   MODULE: LocalStorage — fallback when Firebase not configured
   ══════════════════════════════════════════ */

const LocalStorage = (() => {
  const ENTRIES_KEY  = 'wt_entries_v1';
  const REMINDER_KEY = 'wt_reminder_v1';
  const GOAL_KEY     = 'wt_goal_v1';
  const DEFAULT_GOAL = 3000;

  const readJSON = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  };
  const writeJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  const getEntries = () => readJSON(ENTRIES_KEY, []);
  const saveEntries = (entries) => writeJSON(ENTRIES_KEY, entries);

  const addEntry = (amount, date) => {
    const entries = getEntries();
    entries.push({ id: Date.now().toString(), amount, date });
    saveEntries(entries);
  };

  const getEntriesForDate = (date) => getEntries().filter(e => e.date === date);

  const getTotalForDate = (date) =>
    getEntriesForDate(date).reduce((sum, e) => sum + e.amount, 0);

  const setTotalForDate = (date, newTotal) => {
    const entries = getEntries().filter(e => e.date !== date);
    if (newTotal > 0) entries.push({ id: Date.now().toString(), amount: newTotal, date });
    saveEntries(entries);
  };

  const deleteEntry = (entryId) => {
    const entries = getEntries().filter(e => e.id !== entryId);
    saveEntries(entries);
  };

  const getAllDates = () =>
    [...new Set(getEntries().map(e => e.date))].sort().reverse();

  const getGoal = () => readJSON(GOAL_KEY, DEFAULT_GOAL);
  const setGoal = (goal) => writeJSON(GOAL_KEY, goal);

  const getReminderPrefs = () => readJSON(REMINDER_KEY, { enabled: false, interval: 60 });
  const setReminderPrefs = (prefs) => writeJSON(REMINDER_KEY, prefs);

  const resetAll = () => {
    localStorage.removeItem(ENTRIES_KEY);
  };

  return {
    addEntry, getEntriesForDate, getTotalForDate, setTotalForDate,
    deleteEntry, getAllDates, getGoal, setGoal,
    getReminderPrefs, setReminderPrefs, resetAll,
  };
})();

/* ── Storage proxy — always waits for Firebase before deciding backend ── */
const Storage = (() => {

  // Wait up to 5s for Firebase to finish initializing
  const waitForFirebase = () => new Promise(resolve => {
    if (Firebase.isInitialized()) return resolve(true);
    let attempts = 0;
    const check = setInterval(() => {
      attempts++;
      if (Firebase.isInitialized()) {
        clearInterval(check);
        resolve(true);
      } else if (attempts > 50) { // 5 seconds
        clearInterval(check);
        resolve(false);
      }
    }, 100);
  });

  const addEntry = async (amount, date) => {
    await waitForFirebase();
    if (Firebase.isInitialized()) return Firebase.addEntry(amount, date);
    return LocalStorage.addEntry(amount, date);
  };

  const getEntriesForDate = async (date) => {
    await waitForFirebase();
    if (Firebase.isInitialized()) return Firebase.getEntriesForDate(date);
    return LocalStorage.getEntriesForDate(date);
  };

  const getTotalForDate = async (date) => {
    await waitForFirebase();
    if (Firebase.isInitialized()) return Firebase.getTotalForDate(date);
    return LocalStorage.getTotalForDate(date);
  };

  const setTotalForDate = async (date, total) => {
    await waitForFirebase();
    if (Firebase.isInitialized()) return Firebase.setTotalForDate(date, total);
    return LocalStorage.setTotalForDate(date, total);
  };

  const deleteEntry = async (id) => {
    await waitForFirebase();
    if (Firebase.isInitialized()) return Firebase.deleteEntry(id);
    return LocalStorage.deleteEntry(id);
  };

  const getAllDates = async () => {
    await waitForFirebase();
    if (Firebase.isInitialized()) return Firebase.getAllDates();
    return LocalStorage.getAllDates();
  };

  const getGoal = () => LocalStorage.getGoal();
  const setGoal = (g) => LocalStorage.setGoal(g);
  const getReminderPrefs = () => LocalStorage.getReminderPrefs();
  const setReminderPrefs = (p) => LocalStorage.setReminderPrefs(p);
  const resetAll = () => Firebase.resetAllData();

  return {
    addEntry, getEntriesForDate, getTotalForDate, setTotalForDate,
    deleteEntry, getAllDates, getGoal, setGoal,
    getReminderPrefs, setReminderPrefs, resetAll,
  };
})();
