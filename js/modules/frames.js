/* ═══════════════════════════════════════════════════
   Frames — per-user frame ownership, equip, render
   State: stored in UserData (Firestore + localStorage)
   Catalog: Firestore app/frameCatalog
   ═══════════════════════════════════════════════════ */
const Frames = (() => {

  let CATALOG = [];
  let _loaded  = false;

  const RARITY = {
    common:    { bg:'rgba(156,163,175,0.15)', border:'rgba(156,163,175,0.4)',  label:'#9CA3AF', text:'Common',    glow:'rgba(156,163,175,0.25)' },
    rare:      { bg:'rgba(59,130,246,0.12)',  border:'rgba(59,130,246,0.45)', label:'#60A5FA', text:'Rare',      glow:'rgba(59,130,246,0.3)'  },
    epic:      { bg:'rgba(139,92,246,0.12)',  border:'rgba(139,92,246,0.45)', label:'#A78BFA', text:'Epic',      glow:'rgba(139,92,246,0.35)' },
    legendary: { bg:'rgba(251,191,36,0.15)',  border:'rgba(251,191,36,0.5)',  label:'#FCD34D', text:'Legendary', glow:'rgba(251,191,36,0.4)'  },
    event:     { bg:'rgba(236,72,153,0.12)',  border:'rgba(236,72,153,0.45)', label:'#F472B6', text:'Event',     glow:'rgba(236,72,153,0.35)' },
  };

  const loadCatalog = async () => {
    if (_loaded && CATALOG.length > 0) return;
    try {
      const doc  = await firebase.firestore().collection('app').doc('frameCatalog').get();
      const data = doc.exists ? (doc.data() || {}) : {};
      const order = { common:0, rare:1, epic:2, legendary:3, event:4 };
      CATALOG = Object.values(data)
        .filter(f => f && f.id && f.file)
        .sort((a,b) => (order[a.rarity]||0)-(order[b.rarity]||0) || (a.cost||0)-(b.cost||0));
    } catch(e) { console.warn('[Frames] loadCatalog:', e.message); }
    _loaded = true;
  };

  const reloadCatalog = async () => { _loaded=false; CATALOG=[]; return loadCatalog(); };

  const getFrameOverlayStyle = (frameId, size, extra='', _ctx='') => {
    const f  = CATALOG.find(f => f.id === frameId);
    const sc = f?.scale ?? 1.75;
    const r  = size / 160;
    const ox = Math.round((f?.offsetX||0)*r), oy = Math.round((f?.offsetY||0)*r);
    const w  = Math.round(size*sc), h = Math.round(size*sc);
    return `position:absolute;left:${Math.round(-(w-size)/2)+ox}px;top:${Math.round(-(h-size)/2)+oy}px;width:${w}px;height:${h}px;pointer-events:none;${extra}`;
  };

  // ── Admin check ──
  const isAdmin = () => {
    try {
      const s = window.Auth?.getSession?.() || {};
      const role  = (s.role  || '').toLowerCase().trim();
      const email = (s.email || '').toLowerCase().trim();
      if (role === 'admin' || role === 'maggie') return true;
      if (email === 'jindalmayank2604@gmail.com') return true;
      if (email === 'mayankjindal2604@gmail.com') return true;
      if (window.Auth?.isAdmin?.()) return true;
    } catch(e) {}
    return false;
  };

  // ── Per-user state via UserData (Firestore-backed) ──
  const _state = () => {
    const s = window.UserData?.getState?.() || {};
    return {
      purchased: s.purchasedFrames || [],
      equipped:  s.equippedFrame   || null,
      coins:     s.coinBalance     || 0,
    };
  };

  const isPurchased = (id) => isAdmin() || _state().purchased.includes(id);
  const isEquipped  = (id) => getEquipped() === id;
  const getEquipped = () => {
    // Read from localStorage directly (most up-to-date, works before Firestore sync)
    try {
      const stored = JSON.parse(localStorage.getItem('wt_user_state_v2') || '{}');
      return stored.equippedFrame || null;
    } catch(e) {}
    return _state().equipped;
  };
  const getFrame    = (id) => CATALOG.find(f => f.id === id) || null;

  // ── Purchase: deduct coins, add to purchasedFrames ──
  const purchase = async (id) => {
    const frame = getFrame(id);
    if (!frame) throw new Error('Frame not found');
    if (isPurchased(id)) throw new Error('Already owned');
    const { coins, purchased } = _state();
    if (coins < frame.cost) throw new Error(`Need ${frame.cost - coins} more coins`);
    await window.UserData?.save?.({
      coinBalance:     coins - frame.cost,
      purchasedFrames: [...purchased, id],
    });
    Utils.showToast(`🎉 ${frame.emoji||'🖼️'} ${frame.name} unlocked!`);
  };

  // ── Equip: save to localStorage immediately, try Firestore too ──
  const equip = async (id) => {
    // No JS ownership check — Firestore rules handle security
    // Admin always owns all frames, regular users checked server-side
    
    // 1. Save to localStorage immediately — always works, survives page reload
    try {
      const lsKey = 'wt_user_state_v2';
      const stored = JSON.parse(localStorage.getItem(lsKey) || '{}');
      stored.equippedFrame = id || null;
      localStorage.setItem(lsKey, JSON.stringify(stored));
    } catch(e) {}

    // 2. Also update in-memory state immediately
    if (window.UserData?.getState) {
      try { window.UserData.getState().equippedFrame = id || null; } catch(e) {}
    }

    // 3. Try Firestore save (may fail if rules not deployed yet — non-blocking)
    try {
      await window.UserData?.save?.({ equippedFrame: id || null });
    } catch(e) {
      console.warn('[Frames] Firestore equip save failed (deploy rules!):', e.message);
    }

    console.log('[Frames] equip called with id:', id, '| frame:', getFrame(id)?.name);
    Utils.showToast(id ? `✅ ${getFrame(id)?.name||'Frame'} equipped!` : 'Frame removed');

    // 4. Republish to leaderboard
    try {
      const uid = window.Firebase?.getUserId?.();
      if (uid && window.Leaderboard) Leaderboard.publishStreak(uid).catch(()=>{});
    } catch(e) {}

    // 5. Refresh header
    try {
      if (window.App) App.updateHeaderAvatar?.(window.Auth?.getSession?.());
    } catch(e) {}
  };

  // ── Delete frame (admin) ──
  const deleteFrame = async (id) => {
    await firebase.firestore().collection('app').doc('frameCatalog').update({
      [id]: firebase.firestore.FieldValue.delete()
    });
    CATALOG = CATALOG.filter(f => f.id !== id);
  };

  // ── Render avatar with frame ──
  // frameId=null  → use this user's equipped frame (current user)
  // frameId=false → no frame (other users without stored frame)
  // frameId='id'  → show specific frame (leaderboard rows)
  const avatarWithFrame = (photoURL, displayName, size=40, frameId=null, revision=null) => {
    const eqId  = (frameId === false) ? null : (frameId || getEquipped());
    const frame = eqId ? getFrame(eqId) : null;
    const letter = (displayName||'?')[0].toUpperCase();
    const src    = window.Profile?.resolveImageSrc ? Profile.resolveImageSrc(photoURL, revision) : photoURL;

    const photoEl = src
      ? `<img src="${Utils.escapeHtml(src)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
         <div style="display:none;width:100%;height:100%;border-radius:50%;background:var(--md-primary);color:#fff;align-items:center;justify-content:center;font-weight:700;font-size:${Math.round(size*.4)}px">${letter}</div>`
      : `<div style="width:100%;height:100%;border-radius:50%;background:var(--md-primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${Math.round(size*.4)}px">${letter}</div>`;

    const frameEl = frame
      ? `<img src="${frame.file}" style="${getFrameOverlayStyle(frame.id,size,'z-index:2;object-fit:contain;')}" draggable="false" onerror="this.style.display='none'"/>`
      : '';

    return `<div style="position:relative;width:${size}px;height:${size}px;flex-shrink:0;overflow:visible;">
      <div style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;position:relative;z-index:1;">${photoEl}</div>
      ${frameEl}
    </div>`;
  };

  window.Frames = { get CATALOG(){return CATALOG;}, RARITY,
    loadCatalog, reloadCatalog, isAdmin,
    isPurchased, isEquipped, getEquipped, getFrame,
    purchase, equip, deleteFrame,
    getFrameOverlayStyle, avatarWithFrame };
  return window.Frames;
})();
