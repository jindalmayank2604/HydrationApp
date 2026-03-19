/* ══════════════════════════════════════════
   MODULE: Firebase — Firestore backend
   Data path: users/{uid}/water_entries
   ══════════════════════════════════════════ */

const Firebase = (() => {
  let db     = null;
  let userId = null;
  let _ready = false;

  const HARDCODED_CONFIG = {
    apiKey:            "AIzaSyBbTPBAitCcILlU3ZAOPDVHhqBpG2OTpQo",
    authDomain:        "watertracker-cd14b.firebaseapp.com",
    projectId:         "watertracker-cd14b",
    storageBucket:     "watertracker-cd14b.firebasestorage.app",
    messagingSenderId: "638415849214",
    appId:             "1:638415849214:web:117a193c02c8724e1407af",
  };
  /* NOTE: The Google Sign-In popup title ("watertracker-cd14b") comes from
     your Google Cloud OAuth consent screen app name — change it at:
     console.cloud.google.com → APIs & Services → OAuth consent screen → App name */

  /* ── Init Firestore ── */
  const autoInit = async () => {
    try {
      if (!firebase.apps.length) firebase.initializeApp(HARDCODED_CONFIG);
      db = firebase.firestore();
      console.log('[Firebase] Firestore connected');
      _checkReady();
      return true;
    } catch (e) {
      console.error('[Firebase] Init failed:', e.message);
      return false;
    }
  };

  /* ── Set userId after login ── */
  const setUserId = (uid) => {
    if (!uid) return;
    userId = uid;
    console.log('[Firebase] userId set:', uid);
    _checkReady();
  };

  /* ── Clear userId on sign out ── */
  const resetUserId = () => {
    console.log('[Firebase] userId cleared');
    userId = null;
    _ready = false;
  };

  const _checkReady = () => {
    if (db && userId) {
      _ready = true;
      console.log('[Firebase] Ready — uid:', userId);
    }
  };

  /* ── Poll until ready ── */
  const waitUntilReady = (timeoutMs = 6000) => {
    if (_ready) return Promise.resolve(true);
    return new Promise(resolve => {
      let elapsed = 0;
      const check = setInterval(() => {
        elapsed += 100;
        if (db && userId) {
          _ready = true;
          clearInterval(check);
          resolve(true);
        } else if (elapsed >= timeoutMs) {
          clearInterval(check);
          console.warn('[Firebase] Timeout waiting for ready. db:', !!db, 'userId:', userId);
          resolve(false);
        }
      }, 100);
    });
  };

  /* ── Scoped collection ── */
  const col = () => {
    if (!db)     throw new Error('Firestore not initialized');
    if (!userId) throw new Error('No userId — user not logged in');
    return db.collection('users').doc(userId).collection('water_entries');
  };

  /* ══ CRUD ══ */
  const addEntry = async (amount, date) => {
    await col().add({ amount, date, ts: firebase.firestore.FieldValue.serverTimestamp() });
  };

  const getEntriesForDate = async (date) => {
    const snap = await col().where('date', '==', date).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  };

  const getTotalForDate = async (date) => {
    const entries = await getEntriesForDate(date);
    return entries.reduce((sum, e) => sum + (e.amount || 0), 0);
  };

  const setTotalForDate = async (date, newTotal) => {
    const snap = await col().where('date', '==', date).get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    if (newTotal > 0) {
      batch.set(col().doc(), { amount: newTotal, date, ts: firebase.firestore.FieldValue.serverTimestamp() });
    }
    await batch.commit();
  };

  const deleteEntry = async (id) => { await col().doc(id).delete(); };

  const getAllDates = async () => {
    const snap = await col().orderBy('date', 'desc').get();
    return [...new Set(snap.docs.map(d => d.data().date))].sort().reverse();
  };

  const resetAllData = async () => {
    if (!db || !userId) throw new Error('Not logged in');
    const snap = await col().get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    LocalStorage.resetAll();
    console.log('[Firebase] All data wiped for uid:', userId);
  };

  /* ── Goal & prefs stay local ── */
  const getGoal          = ()  => LocalStorage.getGoal();
  const setGoal          = (g) => LocalStorage.setGoal(g);
  const getReminderPrefs = ()  => LocalStorage.getReminderPrefs();
  const setReminderPrefs = (p) => LocalStorage.setReminderPrefs(p);

  const isInitialized = () => _ready;
  const getUserId     = () => userId;
  const getConfig     = () => HARDCODED_CONFIG;
  const clearConfig   = () => {};

  return {
    autoInit, setUserId, resetUserId, waitUntilReady,
    isInitialized, getUserId, getConfig, clearConfig,
    addEntry, getEntriesForDate, getTotalForDate,
    setTotalForDate, deleteEntry, getAllDates, resetAllData,
    getGoal, setGoal, getReminderPrefs, setReminderPrefs,
  };
})();
