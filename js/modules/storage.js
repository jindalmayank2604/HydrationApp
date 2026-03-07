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

/* ── Storage proxy — uses Firebase if ready, else LocalStorage ── */
const Storage = (() => {
  const addEntry = (amount, date) => {
    if (Firebase.isInitialized()) return Firebase.addEntry(amount, date);
    LocalStorage.addEntry(amount, date);
    return Promise.resolve();
  };
  const getEntriesForDate = (date) => {
    if (Firebase.isInitialized()) return Firebase.getEntriesForDate(date);
    return Promise.resolve(LocalStorage.getEntriesForDate(date));
  };
  const getTotalForDate = async (date) => {
    if (Firebase.isInitialized()) return Firebase.getTotalForDate(date);
    return LocalStorage.getTotalForDate(date);
  };
  const setTotalForDate = (date, total) => {
    if (Firebase.isInitialized()) return Firebase.setTotalForDate(date, total);
    LocalStorage.setTotalForDate(date, total);
    return Promise.resolve();
  };
  const deleteEntry = (id) => {
    if (Firebase.isInitialized()) return Firebase.deleteEntry(id);
    LocalStorage.deleteEntry(id);
    return Promise.resolve();
  };
  const getAllDates = () => {
    if (Firebase.isInitialized()) return Firebase.getAllDates();
    return Promise.resolve(LocalStorage.getAllDates());
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
