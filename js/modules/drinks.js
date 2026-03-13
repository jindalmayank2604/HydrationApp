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
  const getAll  = () => readLocal();
  const getById = (id) => getAll().find(d => d.id === id) || DEFAULT_DRINKS[0];

  const add = async (drink) => {
    const drinks = getAll();
    drink.id     = 'custom_' + Date.now();
    drink.locked = false;
    drinks.push(drink);
    await persist(drinks);
    return drink;
  };

  const update = async (id, changes) => {
    const drinks = getAll();
    const idx    = drinks.findIndex(d => d.id === id);
    if (idx !== -1) drinks[idx] = { ...drinks[idx], ...changes };
    await persist(drinks);
  };

  const remove = async (id) => {
    const drinks = getAll().filter(d => d.id !== id || d.locked);
    await persist(drinks);
  };

  /* ── Water equivalent ml ── */
  const waterEquivalent = (drinkId, amount) => {
    const drink = getById(drinkId);
    return Math.round(amount * drink.hydration / 100);
  };

  return { getAll, getById, add, update, remove, syncFromFirestore, waterEquivalent, DEFAULT_DRINKS };
})();
