/* ══════════════════════════════════════════
   MODULE: Firebase — Firestore backend
   Data path: users/{uid}/water_entries
   ══════════════════════════════════════════ */

const Firebase = (() => {
  let db       = null;
  let userId   = null;
  let _ready   = false;          // true once Firebase + userId both set
  let _resolve = null;
  const _promise = new Promise(r => { _resolve = r; });

  /* ── Scripts hardcoded in index.html now — no dynamic loading ── */

  const HARDCODED_CONFIG = {
    apiKey:            "AIzaSyBbTPBAitCcILlU3ZAOPDVHhqBpG2OTpQo",
    authDomain:        "watertracker-cd14b.firebaseapp.com",
    projectId:         "watertracker-cd14b",
    storageBucket:     "watertracker-cd14b.firebasestorage.app",
    messagingSenderId: "638415849214",
    appId:             "1:638415849214:web:117a193c02c8724e1407af",
  };

  /* ── Called once on app start ── */
  const autoInit = async () => {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(HARDCODED_CONFIG);
      }
      db = firebase.firestore();
      console.log('[Firebase] Firestore connected');
      _tryResolve();
      return true;
    } catch (e) {
      console.error('[Firebase] Init failed:', e.message);
      return false;
    }
  };

  /* ── Set user after login ── */
  const setUserId = (uid) => {
    if (!uid) return;
    userId = uid;
    console.log('[Firebase] userId set:', uid);
    _tryResolve();
  };

  const _tryResolve = () => {
    if (db && userId && !_ready) {
      _ready = true;
      _resolve(true);
      console.log('[Firebase] ✅ Ready — db + userId both set');
    }
  };

  /* ── Wait until both db and userId are ready ── */
  const waitUntilReady = (timeoutMs = 6000) => {
    if (_ready) return Promise.resolve(true);
    return Promise.race([
      _promise,
      new Promise(r => setTimeout(() => r(false), timeoutMs))
    ]);
  };

  /* ── Firestore path: users/{uid}/water_entries ── */
  const col = () => {
    if (!db || !userId) throw new Error('Firebase not ready');
    return db.collection('users').doc(userId).collection('water_entries');
  };

  /* ══ CRUD ══ */

  const addEntry = async (amount, date) => {
    await col().add({
      amount,
      date,
      ts: firebase.firestore.FieldValue.serverTimestamp()
    });
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
      batch.set(col().doc(), {
        amount: newTotal,
        date,
        ts: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    await batch.commit();
  };

  const deleteEntry = async (id) => {
    await col().doc(id).delete();
  };

  const getAllDates = async () => {
    const snap = await col().orderBy('date', 'desc').get();
    const dates = new Set(snap.docs.map(d => d.data().date));
    return [...dates].sort().reverse();
  };

  const resetAllData = async () => {
    const snap = await col().get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    LocalStorage.resetAll();
  };

  /* ── Goal & prefs stay in localStorage (device-specific) ── */
  const getGoal        = ()  => LocalStorage.getGoal();
  const setGoal        = (g) => LocalStorage.setGoal(g);
  const getReminderPrefs  = ()  => LocalStorage.getReminderPrefs();
  const setReminderPrefs  = (p) => LocalStorage.setReminderPrefs(p);

  const isInitialized = () => _ready;
  const getUserId     = () => userId;

  return {
    autoInit, setUserId, waitUntilReady,
    isInitialized, getUserId,
    addEntry, getEntriesForDate, getTotalForDate,
    setTotalForDate, deleteEntry, getAllDates, resetAllData,
    getGoal, setGoal, getReminderPrefs, setReminderPrefs,
  };
})();
