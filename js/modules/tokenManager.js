/* ══════════════════════════════════════════════════════════════
   MODULE: TokenManager
   All limits stored in localStorage — works offline, no Firestore
   quota dependency. Firestore write is best-effort backup only.

   Limits:
     free  → 2 scans / day     (key: wt_scan_{uid}_{YYYY-MM-DD})
     pro   → 450 scans / month (key: wt_scan_{uid}_{YYYY-MM})
     admin → unlimited
   ══════════════════════════════════════════════════════════════ */

const TokenManager = (() => {

  const LIMITS = {
    user   : { max: 2,   period: 'daily'   },
    pro    : { max: 450, period: 'monthly' },
    admin  : { max: Infinity, period: null },
    maggie : { max: Infinity, period: null },
  };

  const todayStr = () => new Date().toISOString().slice(0, 10);  // YYYY-MM-DD
  const monthStr = () => new Date().toISOString().slice(0, 7);   // YYYY-MM

  /* ── UID from any available source ── */
  const _uid = () =>
    (window.Firebase && Firebase.getUserId()) ||
    window.Auth?.getSession()?.uid ||
    (() => { try { return JSON.parse(localStorage.getItem('wt_session_v1')||'{}').uid||null; } catch { return null; } })();

  /* ── Role from Utils (most reliable) ── */
  const _role = () =>
    window.Utils?.getRole ? Utils.getRole() : (window.Auth?.getSession()?.role || 'user').toLowerCase();

  /* ── localStorage key — daily for free, monthly for pro ── */
  const _key = (uid, period) =>
    period === 'daily' ? `wt_scan_${uid}_${todayStr()}` : `wt_scan_${uid}_${monthStr()}`;

  /* ══════════════════════════════════════════
     canScan — check before every scan attempt
  ══════════════════════════════════════════ */
  const canScan = async () => {
    const uid = _uid();
    if (!uid) return { allowed: false, reason: 'Not logged in.', used: 0, max: 0 };

    const role  = _role();
    const limit = LIMITS[role] || LIMITS.user;

    /* Unlimited roles */
    if (!isFinite(limit.max)) return { allowed: true, used: 0, max: Infinity };

    const used = parseInt(localStorage.getItem(_key(uid, limit.period)) || '0');

    if (used >= limit.max) {
      const resetMsg = limit.period === 'daily'
        ? 'Resets at midnight.'
        : 'Resets on the 1st of next month.';
      return {
        allowed: false,
        reason : `You've used ${used}/${limit.max} AI scans. ${resetMsg}`,
        used,
        max    : limit.max,
        period : limit.period,
      };
    }

    return { allowed: true, used, max: limit.max, period: limit.period };
  };

  /* ══════════════════════════════════════════
     recordScan — call immediately when scan starts
  ══════════════════════════════════════════ */
  const recordScan = async () => {
    const uid = _uid();
    if (!uid) return;

    const role  = _role();
    const limit = LIMITS[role] || LIMITS.user;
    if (!isFinite(limit.max)) return; /* unlimited — skip */

    /* Write to localStorage immediately */
    const key  = _key(uid, limit.period);
    const used = parseInt(localStorage.getItem(key) || '0');
    localStorage.setItem(key, String(used + 1));
    console.log(`[TokenManager] ${role} scan ${used + 1}/${limit.max} (${limit.period})`);

    /* Best-effort Firestore sync (non-blocking, ignore failures) */
    try {
      if (window.firebase?.firestore) {
        const update = { updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
        if (limit.period === 'daily') {
          update.lastResetDate   = todayStr();
          update.tokensUsedToday = firebase.firestore.FieldValue.increment(1);
        } else {
          update.lastResetMonth = monthStr();
          update.monthlyUsage   = firebase.firestore.FieldValue.increment(1);
        }
        firebase.firestore().collection('users').doc(uid).set(update, { merge: true });
      }
    } catch(e) { /* ignore */ }
  };

  /* ── Badge HTML showing remaining scans ── */
  const getBadgeHTML = async () => {
    const uid = _uid();
    if (!uid) return '';
    const role  = _role();
    const limit = LIMITS[role] || LIMITS.user;
    if (!isFinite(limit.max)) return '<span style="font-size:11px;color:#69F0AE;font-weight:600;">✨ Unlimited scans</span>';
    const used = parseInt(localStorage.getItem(_key(uid, limit.period)) || '0');
    const left = Math.max(0, limit.max - used);
    const color = left === 0 ? '#ef4444' : left === 1 ? '#fb923c' : '#69F0AE';
    const label = limit.period === 'daily' ? 'today' : 'this month';
    return `<span style="font-size:11px;color:${color};font-weight:600;">${left}/${limit.max} scans left ${label}</span>`;
  };

  return { canScan, recordScan, getBadgeHTML, LIMITS };
})();
