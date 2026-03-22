/* ══════════════════════════════════════════
   MODULE: Drinks — shared drink types
   Storage: Firestore app/shared/drinks  (admin writes, everyone reads)
   Fallback: localStorage (offline / not yet synced)
   ══════════════════════════════════════════ */

const Drinks = (() => {

  const DEFAULT_DRINKS = [
    { id: 'water',       name: 'Water',       emoji: '💧', hydration: 100, locked: true  },
    { id: 'hot-coffee',  name: 'Hot Coffee',  emoji: '☕', hydration: 80,  locked: false },
    { id: 'cold-coffee', name: 'Cold Coffee', emoji: '🧋', hydration: 75,  locked: false },
    { id: 'tea',         name: 'Tea',         emoji: '🍵', hydration: 90,  locked: false },
    { id: 'juice',       name: 'Juice',       emoji: '🥤', hydration: 85,  locked: false },
    { id: 'alcohol',     name: 'Alcohol',     emoji: '🍺', hydration: -30, locked: false },
    { id: 'coca-cola',   name: 'Coca-Cola',   emoji: '🥫', hydration: 60,  locked: false },
  ];

  const LS_KEY = 'wt_drinks_shared'; // same key for all users — it's shared data

  /* ── Per-user private drinks ── */
  const privateKey = () => {
    // Try Firebase first, then session, then wt_session_v1
    const uid = (window.Firebase && Firebase.getUserId())
      || (window.Auth && Auth.getSession()?.uid)
      || (() => { try { return JSON.parse(localStorage.getItem('wt_session_v1')||'{}').uid||null; } catch(e){return null;} })();
    return uid ? `wt_drinks_private_${uid}` : null;
  };

  const readPrivate = () => {
    const key = privateKey();
    if (!key) return [];
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      return Array.isArray(saved) ? saved : [];
    } catch { return []; }
  };

  const writePrivate = (drinks) => {
    const key = privateKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(drinks));
  };

  /* ── Firestore private drinks (users/{uid}/custom_drinks) ── */
  const privateCol = () => {
    const uid = window.Firebase ? Firebase.getUserId() : null;
    if (!uid || !window.firebase?.firestore) return null;
    try { return firebase.firestore().collection('users').doc(uid).collection('custom_drinks'); }
    catch { return null; }
  };

  const syncPrivateFromFirestore = async () => {
    const col = privateCol();
    if (!col) return;
    try {
      const snap = await col.get();
      const drinks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      writePrivate(drinks);
      console.log('[Drinks] Private drinks synced:', drinks.length);
    } catch(e) {
      console.warn('[Drinks] Private sync failed:', e.message);
    }
  };

  /* ── Firestore shared doc (readable by all, writable by admin) ── */
  const fsDoc = () => {
    if (!window.firebase?.firestore) return null;
    try { return firebase.firestore().collection('app').doc('shared'); }
    catch { return null; }
  };

  /* ── localStorage ── */
  const readLocal = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY));
      if (saved && Array.isArray(saved) && saved.length) return saved;
    } catch {}
    return DEFAULT_DRINKS.map(d => ({ ...d }));
  };
  const writeLocal = (drinks) => localStorage.setItem(LS_KEY, JSON.stringify(drinks));

  /* ── Sync FROM Firestore into localStorage (called on login for all users) ── */
  const syncFromFirestore = async () => {
    try {
      const doc  = fsDoc();
      if (!doc) return;
      const snap = await doc.get();
      if (snap.exists && Array.isArray(snap.data().drinks)) {
        writeLocal(snap.data().drinks);
        console.log('[Drinks] Synced shared drinks from Firestore');
      } else {
        // First ever launch — admin pushes defaults
        if (window.Auth && Auth.isAdmin()) {
          await doc.set({ drinks: DEFAULT_DRINKS });
          writeLocal(DEFAULT_DRINKS.map(d => ({ ...d })));
          console.log('[Drinks] Pushed default drinks to Firestore (admin)');
        }
      }
    } catch (e) {
      console.warn('[Drinks] Firestore sync failed, using local:', e.message);
    }
  };

  /* ── Write to Firestore + localStorage (admin only) ── */
  const persist = async (drinks) => {
    writeLocal(drinks);
    try {
      const doc = fsDoc();
      if (doc) {
        await doc.set({ drinks });
        console.log('[Drinks] Shared drinks saved to Firestore');
      }
    } catch (e) {
      console.warn('[Drinks] Firestore write failed (saved locally only):', e.message);
    }
  };

  /* ── Public API ── */
  const getShared = () => readLocal();                            // shared only (admin edits)
  const getAll    = () => [...readLocal(), ...readPrivate()];     // shared + private (drink log)
  const getById   = (id) => getAll().find(d => d.id === id) || DEFAULT_DRINKS[0];

  // Admin shared drink operations — only touch shared list, never private
  const add = async (drink) => {
    const drinks = readLocal(); // shared only
    drink.id     = 'custom_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,7);
    drink.locked = false;
    drinks.push(drink);
    await persist(drinks);
    return drink;
  };

  const update = async (id, changes) => {
    const drinks = readLocal(); // shared only
    const idx    = drinks.findIndex(d => d.id === id);
    if (idx !== -1) drinks[idx] = { ...drinks[idx], ...changes };
    await persist(drinks);
  };

  const remove = async (id) => {
    const drinks = readLocal().filter(d => d.id !== id || d.locked); // shared only
    await persist(drinks);
  };

  /* ── Add private drink (user-only) ── */
  const addPrivate = async (drink) => {
    const drinks = readPrivate();
    const uid = window.Firebase ? Firebase.getUserId() : 'local';
    drink.id     = `priv_${uid}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,5)}`;
    drink.locked = false;
    drink.isPrivate = true;
    drinks.push(drink);
    writePrivate(drinks);
    // Persist to Firestore — only send fields that pass validCustomDrink
    const col = privateCol();
    if (col) {
      try {
        await col.doc(drink.id).set({
          name: drink.name,
          emoji: drink.emoji,
          hydration: drink.hydration,
        });
      } catch(e) { console.warn('[Drinks] Firestore private write failed:', e.message); }
    }
    return drink;
  };

  const removePrivate = async (id) => {
    writePrivate(readPrivate().filter(d => d.id !== id));
    const col = privateCol();
    if (col) try { await col.doc(id).delete(); } catch {}
  };

  const updatePrivate = async (id, changes) => {
    const drinks = readPrivate();
    const idx = drinks.findIndex(d => d.id === id);
    if (idx !== -1) drinks[idx] = { ...drinks[idx], ...changes };
    writePrivate(drinks);
    const col = privateCol();
    if (col) try { await col.doc(id).set(drinks[idx]); } catch {}
  };

  const getPrivateAll = () => readPrivate();

  /* ── Water equivalent ml ── */
  const waterEquivalent = (drinkId, amount) => {
    const drink = getById(drinkId);
    return Math.round(amount * drink.hydration / 100);
  };

  return { getAll, getShared, getById, add, update, remove, syncFromFirestore, waterEquivalent, DEFAULT_DRINKS, addPrivate, removePrivate, updatePrivate, getPrivateAll, syncPrivateFromFirestore };
})();
