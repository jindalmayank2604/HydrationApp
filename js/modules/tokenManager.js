/* ══════════════════════════════════════════════════════════════
   MODULE: TokenManager  (js/modules/tokenManager.js)
   ──────────────────────────────────────────────────────────────
   Enforces per-role AI scan limits.
   All checks happen client-side against Firestore data.
   Rate limits are enforced client-side for instant UX feedback.

   Role limits:
     user   → 6 scans / day    (resets at midnight)
     pro    → 450 scans / month (resets on 1st of month)
     admin  → unlimited
     maggie → unlimited
   ══════════════════════════════════════════════════════════════ */

const TokenManager = (() => {

  const LIMITS = {
    user   : { max: 6,   period: 'daily'   },
    pro    : { max: 450, period: 'monthly' },
    admin  : { max: Infinity, period: null },
    maggie : { max: Infinity, period: null },
  };

  /* ── Get today's date string ── */
  const todayStr  = () => new Date().toISOString().slice(0, 10);
  /* ── Get current month string ── */
  const monthStr  = () => new Date().toISOString().slice(0, 7);

  /* ── Read user token doc from Firestore ── */
  const _getUserDoc = async (uid) => {
    const db   = firebase.firestore();
    const ref  = db.collection('users').doc(uid);
    const snap = await ref.get();
    return { ref, data: snap.exists ? snap.data() : {} };
  };

  /* ══════════════════════════════════════════
     CHECK: can user scan right now?
     Returns { allowed: bool, reason: string, used: number, max: number }
  ══════════════════════════════════════════ */
  const canScan = async () => {
    const session = Auth.getSession();
    if (!session?.uid) return { allowed: false, reason: 'Not logged in.' };

    /* Use Utils.getRole() so Maggie email = privileged even if Firestore role = "user" */
    const role  = window.Utils?.getRole ? Utils.getRole() : (session.role || 'user').toLowerCase();
    const limit = LIMITS[role] || LIMITS.user;

    /* Admin, Maggie, Pro (unlimited or high limit) */
    if (!isFinite(limit.max)) return { allowed: true, used: 0, max: Infinity };

    try {
      const { data } = await _getUserDoc(session.uid);

      if (limit.period === 'daily') {
        const today = todayStr();
        /* Reset if last reset was not today */
        const used = data.lastResetDate === today ? (data.tokensUsedToday || 0) : 0;
        if (used >= limit.max) {
          return {
            allowed: false,
            reason : `Daily limit reached (${limit.max} scans/day). Resets at midnight.`,
            used, max: limit.max,
          };
        }
        return { allowed: true, used, max: limit.max };
      }

      if (limit.period === 'monthly') {
        const month = monthStr();
        const used  = data.lastResetMonth === month ? (data.monthlyUsage || 0) : 0;
        if (used >= limit.max) {
          return {
            allowed: false,
            reason : `Monthly limit reached (${limit.max} scans/month for Pro). Resets on the 1st.`,
            used, max: limit.max,
          };
        }
        return { allowed: true, used, max: limit.max };
      }

    } catch (e) {
      console.warn('[TokenManager] canScan error:', e.message);
      /* Fail open — don't block user if Firestore is down */
      return { allowed: true, used: 0, max: limit.max };
    }

    return { allowed: true, used: 0, max: limit.max };
  };

  /* ══════════════════════════════════════════
     RECORD: increment usage after a successful scan
  ══════════════════════════════════════════ */
  const recordScan = async () => {
    const session = Auth.getSession();
    if (!session?.uid) return;

    const role  = (session.role || 'user').toLowerCase();
    const limit = LIMITS[role] || LIMITS.user;
    if (!isFinite(limit.max)) return; /* unlimited — no need to track */

    try {
      const { ref, data } = await _getUserDoc(session.uid);
      const today = todayStr();
      const month = monthStr();
      const update = { updatedAt: firebase.firestore.FieldValue.serverTimestamp() };

      if (limit.period === 'daily') {
        const wasToday = data.lastResetDate === today;
        update.lastResetDate   = today;
        update.tokensUsedToday = wasToday
          ? firebase.firestore.FieldValue.increment(1)
          : 1;
      }

      if (limit.period === 'monthly') {
        const wasThisMonth = data.lastResetMonth === month;
        update.lastResetMonth = month;
        update.monthlyUsage   = wasThisMonth
          ? firebase.firestore.FieldValue.increment(1)
          : 1;
      }

      await ref.set(update, { merge: true });
    } catch (e) {
      console.warn('[TokenManager] recordScan error:', e.message);
    }
  };

  /* ══════════════════════════════════════════
     BADGE: small pill showing remaining scans
     (shown in the AI scan overlay header)
  ══════════════════════════════════════════ */
  const getBadgeHTML = async () => {
    const session = Auth.getSession();
    if (!session?.uid) return '';
    const role  = (session.role || 'user').toLowerCase();
    const limit = LIMITS[role] || LIMITS.user;
    if (!isFinite(limit.max)) {
      return '<span style="background:rgba(0,200,83,0.15);color:#69F0AE;font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;">∞ Unlimited</span>';
    }
    const { used, max } = await canScan().catch(() => ({ used: 0, max: limit.max }));
    const remaining = Math.max(0, max - used);
    const color = remaining > 2 ? '#69F0AE' : remaining > 0 ? '#FBBC04' : '#FF8A80';
    const bg    = remaining > 2 ? 'rgba(0,200,83,0.15)' : remaining > 0 ? 'rgba(251,188,4,0.15)' : 'rgba(234,67,53,0.15)';
    const period = limit.period === 'daily' ? '/day' : '/month';
    return `<span style="background:${bg};color:${color};font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;">${remaining} left ${period}</span>`;
  };

  return { canScan, recordScan, getBadgeHTML, LIMITS };
})();
