/* ══════════════════════════════════════════
   MODULE: Firebase — Firestore backend
   ══════════════════════════════════════════
   HOW TO SET UP:
   1. Go to https://console.firebase.google.com
   2. Create a project, enable Firestore in "Native mode"
   3. Go to Project Settings → Your apps → Web app
   4. Copy your config values below
   5. In Firestore Rules set:
      allow read, write: if true;   (for testing)
   ══════════════════════════════════════════ */

const Firebase = (() => {
  const CONFIG_KEY = 'wt_firebase_config_v1';
  let db = null;
  let userId = null;
  let initialized = false;

  /* ── Load saved config ── */
  const getSavedConfig = () => {
    try { return JSON.parse(localStorage.getItem(CONFIG_KEY)) || null; }
    catch { return null; }
  };

  const saveConfig = (cfg) => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  };

  /* ── Init Firebase with user-provided config ── */
  const init = async (config) => {
    try {
      if (!window.firebase) {
        await loadFirebaseScripts();
      }

      // If already initialized with same config, reuse — don't delete existing app
      if (firebase.apps && firebase.apps.length > 0) {
        db = firebase.firestore();
        initialized = true;
        return { success: true };
      }

      firebase.initializeApp(config);
      db = firebase.firestore();

      initialized = true;
      saveConfig(config);
      return { success: true };
    } catch (err) {
      // If already initialized error, just get db reference
      if (err.code === 'app/duplicate-app') {
        db = firebase.firestore();
        initialized = true;
        return { success: true };
      }
      initialized = false;
      db = null;
      return { success: false, error: err.message };
    }
  };

  /* ── Set userId from logged-in session (call after login) ── */
  const setUserId = (uid) => {
    if (uid) userId = uid;
  };

  /* ── Load Firebase scripts ── */
  const loadFirebaseScripts = () => new Promise((resolve, reject) => {
    const scripts = [
      'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
      'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js',
      'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js',
    ];
    let loaded = 0;
    scripts.forEach(src => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => { if (++loaded === scripts.length) resolve(); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  });

  /* ── Hardcoded config — auto-connects on every load ── */
  const HARDCODED_CONFIG = {
    apiKey:            "AIzaSyBbTPBAitCcILlU3ZAOPDVHhqBpG2OTpQo",
    authDomain:        "watertracker-cd14b.firebaseapp.com",
    projectId:         "watertracker-cd14b",
    storageBucket:     "watertracker-cd14b.firebasestorage.app",
    messagingSenderId: "638415849214",
    appId:             "1:638415849214:web:117a193c02c8724e1407af",
  };

  /* ── Auto-init: uses hardcoded config, no manual entry needed ── */
  const autoInit = async () => {
    const result = await init(HARDCODED_CONFIG);
    return result.success;
  };

  /* ── CRUD helpers ── */
  const userDoc = (path) => {
    if (!db) throw new Error('Firebase DB not initialized');
    // Use our stored userId, OR fall back to Firebase Auth current user
    const uid = userId || (window.firebase && firebase.auth().currentUser?.uid);
    if (!uid) throw new Error('User not authenticated - no userId set');
    if (!userId) userId = uid; // cache it
    return db.collection('users').doc(uid).collection(path);
  };

  /* ── Get current userId (for debugging) ── */
  const getUserId = () => userId;

  /* ── Add water entry ── */
  const addEntry = async (amount, date) => {
    if (!initialized || !userId) {
      console.warn('Firebase not ready, saving to LocalStorage. initialized:', initialized, 'userId:', userId);
      return LocalStorage.addEntry(amount, date);
    }
    const entry = { amount, date, timestamp: firebase.firestore.FieldValue.serverTimestamp() };
    await userDoc('water_entries').add(entry);
  };

  /* ── Get entries for date ── */
  const getEntriesForDate = async (date) => {
    if (!initialized) return LocalStorage.getEntriesForDate(date);
    const snap = await userDoc('water_entries').where('date', '==', date).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  };

  /* ── Get total for date ── */
  const getTotalForDate = async (date) => {
    const entries = await getEntriesForDate(date);
    return entries.reduce((sum, e) => sum + (e.amount || 0), 0);
  };

  /* ── Set total for a date (overwrite mode for history editing) ── */
  const setTotalForDate = async (date, newTotal) => {
    if (!initialized) {
      LocalStorage.setTotalForDate(date, newTotal);
      return;
    }
    // Delete all entries for that day then add one with the new total
    const snap = await userDoc('water_entries').where('date', '==', date).get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    if (newTotal > 0) {
      batch.set(userDoc('water_entries').doc(), {
        amount: newTotal,
        date,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    await batch.commit();
  };

  /* ── Delete single entry by id ── */
  const deleteEntry = async (entryId) => {
    if (!initialized) return;
    await userDoc('water_entries').doc(entryId).delete();
  };

  /* ── Get all dates with data ── */
  const getAllDates = async () => {
    if (!initialized) return LocalStorage.getAllDates();
    const snap = await userDoc('water_entries').orderBy('date', 'desc').get();
    const dates = new Set(snap.docs.map(d => d.data().date));
    return [...dates].sort().reverse();
  };

  /* ── Goal ── */
  const getGoal = () => LocalStorage.getGoal();
  const setGoal = (g) => LocalStorage.setGoal(g);

  /* ── Reminder prefs ── */
  const getReminderPrefs = () => LocalStorage.getReminderPrefs();
  const setReminderPrefs = (p) => LocalStorage.setReminderPrefs(p);

  /* ── Reset ALL data for this user ── */
  const resetAllData = async () => {
    if (initialized && db && userId) {
      // Delete all Firestore entries
      const snap = await userDoc('water_entries').get();
      const batch = db.batch();
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
    // Also wipe localStorage entries
    LocalStorage.resetAll();
  };

  const isInitialized = () => initialized;
  const getConfig = () => getSavedConfig();
  const clearConfig = () => {
    localStorage.removeItem(CONFIG_KEY);
    initialized = false;
    db = null;
  };

  return {
    init, autoInit, isInitialized, getConfig, clearConfig, setUserId, getUserId,
    addEntry, getEntriesForDate, getTotalForDate, setTotalForDate,
    deleteEntry, getAllDates, resetAllData, getGoal, setGoal,
    getReminderPrefs, setReminderPrefs,
  };
})();
