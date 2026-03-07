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

  // Wait up to 5s for Firebase to be initialized AND userId to be set
  const waitForFirebase = () => new Promise(resolve => {
    const isReady = () => Firebase.isInitialized() && Firebase.getUserId();
    if (isReady()) return resolve(true);
    let attempts = 0;
    const check = setInterval(() => {
      attempts++;
      if (isReady()) {
        clearInterval(check);
        resolve(true);
      } else if (attempts > 50) { // 5 seconds max
        clearInterval(check);
        // Resolve anyway — will use LocalStorage as fallback
        resolve(Firebase.isInitialized());
      }
    }, 100);
  });

  const tryFirebase = async (fn, fallback) => {
    await waitForFirebase();
    const fbReady = Firebase.isInitialized() && Firebase.getUserId();
    console.log('[Storage] Firebase ready:', fbReady, '| userId:', Firebase.getUserId());
    if (fbReady) {
      try { return await fn(); }
      catch(e) {
        console.warn('[Storage] Firebase op failed, falling back to localStorage:', e.message);
      }
    }
    console.warn('[Storage] Using localStorage — data NOT synced to cloud');
    return fallback();
  };

  const addEntry = (amount, date) =>
    tryFirebase(
      () => Firebase.addEntry(amount, date),
      () => LocalStorage.addEntry(amount, date)
    );

  const getEntriesForDate = (date) =>
    tryFirebase(
      () => Firebase.getEntriesForDate(date),
      () => LocalStorage.getEntriesForDate(date)
    );

  const getTotalForDate = (date) =>
    tryFirebase(
      () => Firebase.getTotalForDate(date),
      () => LocalStorage.getTotalForDate(date)
    );

  const setTotalForDate = (date, total) =>
    tryFirebase(
      () => Firebase.setTotalForDate(date, total),
      () => LocalStorage.setTotalForDate(date, total)
    );

  const deleteEntry = (id) =>
    tryFirebase(
      () => Firebase.deleteEntry(id),
      () => LocalStorage.deleteEntry(id)
    );

  const getAllDates = () =>
    tryFirebase(
      () => Firebase.getAllDates(),
      () => LocalStorage.getAllDates()
    );

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
