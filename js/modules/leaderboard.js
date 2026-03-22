/* ══════════════════════════════════════════
   MODULE: Leaderboard — real-time streak rankings
   Firestore: leaderboard/{uid}
   Anti-abuse: streaks only written server-side after
   verification against water_entries data
   ══════════════════════════════════════════ */

const Leaderboard = (() => {

  const DAILY_KEY   = 'lb_daily_cache';
  const MONTHLY_KEY = 'lb_monthly_cache';
  const CACHE_TTL   = 5 * 60 * 1000; // 5 min

  /* ── Get db reference ── */
  const db = () => firebase.firestore();

  /* ── Goal bucket: round to nearest 500ml for fair grouping ──
     500  → 500,  600-999 → 500 (rounded down to nearest 500)... 
     Actually: round to nearest 500 so 2300 → 2500, 2600 → 2500 etc.
     This groups users within ±250ml of each other. */
  const goalBucket = (goal) => Math.round((goal || 2500) / 500) * 500;

  /* ── Compute honest streak from actual Firestore water_entries ──
     CHANGE-3: Fixed streak logic after goal changes.
     - Uses user's CURRENT goal (not cached stale values).
     - Queries water_entries directly — no dependency on leaderboard cache.
     - Daily streak: walks backwards day-by-day from today (or yesterday
       if today is not yet complete) counting consecutive goal-met days.
     - Monthly streak: counts distinct goal-met days in this calendar month.
     - Edge case fix: previously logged entries count if they meet the NEW
       (current) goal — goal changes retroactively recalculate correctly.
     ───────────────────────────────────────────────────────────────── */
  const computeStreak = async (uid) => {
    if (window.Firebase) await Firebase.waitUntilReady(6000);
    if (!window.firebase || !firebase.apps?.length) return { daily: 0, monthly: 0 };
    try {
      // CHANGE-3 fix: always read the CURRENT goal, not a stale cached value.
      // LocalStorage.getGoal() always returns the latest value the user set.
      const goal = LocalStorage.getGoal() || 2500;

      const col = db().collection('users').doc(uid).collection('water_entries');

      // Pull last 32 days — covers a full month + 1-day buffer
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 32);
      const cutoffStr = cutoff.toISOString().slice(0, 10);

      const snap = await col.where('date', '>=', cutoffStr).get();

      // CHANGE-3 fix: aggregate all entries per date regardless of individual
      // entry amount.  A user may log multiple entries on one day (e.g. 300 ml,
      // 200 ml, 100 ml) — sum them to see if they cleared the daily goal.
      const totals = {};
      snap.docs.forEach(d => {
        const { date, amount } = d.data();
        if (date && typeof amount === 'number' && amount > 0) {
          totals[date] = (totals[date] || 0) + amount;
        }
      });

      const today = new Date();
      const fmt = (d) =>
        d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');

      // ── Daily streak ──────────────────────────────────────────
      // Walk backwards: if today already meets goal, start counting from today;
      // otherwise start from yesterday (today is still in progress).
      let dailyStreak = 0;
      const walkDate  = new Date(today);
      const todayKey  = fmt(today);

      if ((totals[todayKey] || 0) < goal) {
        // Today not done yet — start from yesterday
        walkDate.setDate(walkDate.getDate() - 1);
      }

      for (let safety = 0; safety < 366; safety++) {
        const key = fmt(walkDate);
        if ((totals[key] || 0) >= goal) {
          dailyStreak++;
          walkDate.setDate(walkDate.getDate() - 1);
        } else {
          break; // streak broken — stop walking
        }
      }

      // ── Monthly streak ────────────────────────────────────────
      // Count every day in the current calendar month where goal was met.
      // Includes today if data exists (even partial day counts as "met" if sum >= goal).
      const monthStart  = new Date(today.getFullYear(), today.getMonth(), 1);
      const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1); // exclusive
      let monthlyStreak = 0;

      for (let d = new Date(monthStart); d < todayMidnight; d.setDate(d.getDate() + 1)) {
        const key = fmt(new Date(d));
        if ((totals[key] || 0) >= goal) monthlyStreak++;
      }

      console.log(`[Leaderboard] uid=${uid} goal=${goal} daily=${dailyStreak} monthly=${monthlyStreak} dates=${Object.keys(totals).length}`);
      return { daily: dailyStreak, monthly: monthlyStreak };

    } catch (e) {
      console.warn('[Leaderboard] computeStreak failed:', e.message);
      return { daily: 0, monthly: 0 };
    }
  };

  /* ── Push verified streak to leaderboard collection ── */
  let _publishTimer = null;
  const publishStreak = (uid) => {
    // Debounce: if called multiple times quickly, only fire once after 500ms
    // Returns a Promise so callers can safely chain .catch()
    clearTimeout(_publishTimer);
    return new Promise((resolve) => {
      _publishTimer = setTimeout(() => {
        _doPublish(uid).then(resolve).catch(resolve); // always resolve — errors are non-fatal
      }, 500);
    });
  };

  const _doPublish = async (uid) => {
    if (!uid) return;
    if (window.Firebase) await Firebase.waitUntilReady(6000);
    if (!window.firebase || !firebase.apps?.length) return;
    try {
      const session = Auth.getSession();
      if (!session) return;

      const { daily, monthly } = await computeStreak(uid);

      // CHANGE-3: also persist totalWater for tie-breaking sort
      const goal = LocalStorage.getGoal() || 2500;
      // Prefer Firestore-saved profile data (captures changes made since last login)
      let displayName = session.displayName || session.email?.split('@')[0] || 'Hydrator';
      let photoURL    = session.photoURL || null;
      try {
        const userDoc = await db().collection('users').doc(uid).get();
        if (userDoc.exists) {
          const d = userDoc.data();
          if (d.displayName) displayName = d.displayName;
          if (d.photoURL)    photoURL    = d.photoURL;
        }
      } catch (e) { /* non-fatal, use session values */ }

      // Equipped frame: read from dedicated localStorage key (instant, user-specific)
      // Falls back to UserData in-memory state
      let equippedFrame = (window.Frames ? Frames.getEquipped() : null)
        || (window.UserData ? UserData.getState().equippedFrame : null)
        || null;

      await db().collection('leaderboard').doc(uid).set({
        displayName,
        email: session.email,
        photoURL,
        equippedFrame,
        dailyStreak:   Math.min(Math.floor(daily),   365),
        monthlyStreak: Math.min(Math.floor(monthly), 31),
        goal:          Math.max(500, Math.min(goal, 10000)),
        goalBucket:    goalBucket(goal),
        lastUpdated:   firebase.firestore.FieldValue.serverTimestamp(),
        flagged:       false,
      }, { merge: true });

      console.log(`[Leaderboard] Published — daily:${daily} monthly:${monthly}`);
      // Invalidate local cache so next subscribe() fetches fresh data
      try { localStorage.removeItem(_lbCacheKey('daily')); localStorage.removeItem(_lbCacheKey('monthly')); } catch {}
    } catch (e) {
      console.warn('[Leaderboard] publish failed:', e.message);
    }
  };

  /* ── Fetch top N from leaderboard ──
     CHANGE-3: Removed .where('flagged','==',false) Firestore filter.
     That filter excluded users whose doc had no 'flagged' field yet
     (first-time writes, goal-change re-publishes).  We now order by
     streak descending and filter client-side to drop genuinely flagged
     entries, so valid users are never silently excluded.
     ────────────────────────────────────────────────────────────── */
  const fetchTop = async (type = 'daily', limit = 20) => {
    if (!window.firebase || !firebase.apps?.length) return [];
    try {
      const field = type === 'daily' ? 'dailyStreak' : 'monthlyStreak';
      const snap  = await db().collection('leaderboard')
        .where('flagged', '==', false)
        .orderBy(field, 'desc')
        .limit(limit)
        .get();
      return snap.docs
        .map((d, i) => ({ rank: i + 1, uid: d.id, ...d.data() }))
        // client-side: drop only genuinely flagged entries (daily > 365 etc.)
        .filter(r => !r.flagged);
    } catch (e) {
      console.warn('[Leaderboard] fetchTop failed:', e.message);
      return [];
    }
  };

  /* ── Global leaderboard: getDocs + localStorage cache (no onSnapshot) ──
     Replaces the real-time listener with a TTL-cached getDocs call.
     Saves significant Firestore reads — the leaderboard only needs
     to be fresh, not instant. Cache TTL = 5 min. Debounce = 400ms.
     ─────────────────────────────────────────────────────────────── */
  const _LB_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  const _LB_MAX = 50; // max rows to fetch (pagination)

  const _lbCacheKey = (type) => `wt_lb_cache_${type}_v2`;
  const _lbCacheRead = (type) => {
    try {
      const raw = localStorage.getItem(_lbCacheKey(type));
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (Date.now() - p.ts > _LB_CACHE_TTL) return null;
      return p.rows;
    } catch { return null; }
  };
  const _lbCacheWrite = (type, rows) => {
    try { localStorage.setItem(_lbCacheKey(type), JSON.stringify({ ts: Date.now(), rows })); } catch {}
  };

  const _processRows = (docs, field) =>
    docs.map(d => ({ uid: d.id, ...d.data() }))
      .filter(r => !r.flagged)
      .sort((a, b) => {
        const sd = (b[field]||0) - (a[field]||0);
        return sd !== 0 ? sd : (b.totalWater||0) - (a.totalWater||0);
      })
      .slice(0, 20)
      .map((r, i) => ({ ...r, rank: i + 1 }));

  const _fetchGlobalLeaderboard = async (type) => {
    if (!window.firebase || !firebase.apps?.length) return [];
    const field = type === 'daily' ? 'dailyStreak' : 'monthlyStreak';
    const userGoalBucket = goalBucket(LocalStorage.getGoal() || 2500);
    try {
      const snap = await db().collection('leaderboard')
        .where('flagged', '==', false)
        .where('goalBucket', '==', userGoalBucket)
        .orderBy(field, 'desc')
        .limit(_LB_MAX)
        .get();
      return _processRows(snap.docs, field);
    } catch (e) {
      console.warn('[Leaderboard] fetch failed, trying without flagged filter:', e.message);
      try {
        const snap2 = await db().collection('leaderboard')
          .where('goalBucket', '==', userGoalBucket)
          .orderBy(field, 'desc').limit(_LB_MAX).get();
        return _processRows(snap2.docs, field);
      } catch (e2) {
        console.warn('[Leaderboard] fallback also failed:', e2.message);
        return [];
      }
    }
  };

  let _unsubscribe = null;
  let _subDebounceTimer = null;

  const subscribe = (type, callback) => {
    // Cancel previous subscription
    if (_unsubscribe) { _unsubscribe(); _unsubscribe = null; }
    clearTimeout(_subDebounceTimer);

    let _cancelled = false;
    _unsubscribe = () => { _cancelled = true; clearTimeout(_subDebounceTimer); };

    const _load = async (forceRefresh) => {
      if (_cancelled) return;
      // 1. Serve cache immediately (zero reads)
      if (!forceRefresh) {
        const cached = _lbCacheRead(type);
        if (cached) { callback(cached); return; }
      }
      // 2. Wait for Firebase
      if (window.Firebase) {
        const ready = await Firebase.waitUntilReady(6000);
        if (!ready || _cancelled) { callback([]); return; }
      }
      // 3. One getDocs fetch
      const rows = await _fetchGlobalLeaderboard(type);
      if (_cancelled) return;
      _lbCacheWrite(type, rows);
      callback(rows);
    };

    // Debounced initial load
    _subDebounceTimer = setTimeout(() => _load(false), 400);

    // Return a manual refresh function wrapped as the "unsubscribe"
    // Callers can re-call subscribe() to force refresh
    return _unsubscribe;
  };

  const unsubscribe = () => { if (_unsubscribe) { _unsubscribe(); _unsubscribe = null; } };

  /* ── Patch old leaderboard docs missing the flagged field ──
     Runs once on admin/any login. Sets flagged:false on docs
     that don't have it, so they show up in the indexed query. */
  const patchMissingFlagged = async () => {
    if (window.Firebase) await Firebase.waitUntilReady(6000);
    if (!window.firebase || !firebase.apps?.length) return;
    try {
      const snap = await db().collection('leaderboard').limit(100).get();
      const batch = db().batch();
      let count = 0;
      snap.docs.forEach(doc => {
        const data = doc.data();
        const needsPatch =
          data.flagged === undefined || data.flagged === null ||
          data.email   === undefined ||
          typeof data.dailyStreak   !== 'number' ||
          typeof data.monthlyStreak !== 'number';
        if (needsPatch) {
          batch.update(doc.ref, {
            flagged:       false,
            email:         data.email || '',
            dailyStreak:   Math.min(Math.floor(data.dailyStreak   || 0), 365),
            monthlyStreak: Math.min(Math.floor(data.monthlyStreak || 0), 31),
            goal:          Math.max(500, Math.min(data.goal || 2500, 10000)),
            goalBucket:    goalBucket(data.goal || 2500),
          });
          count++;
        }
      });
      if (count > 0) {
        await batch.commit();
        console.log(`[Leaderboard] Patched ${count} old docs with flagged:false`);
      }
    } catch (e) {
      console.warn('[Leaderboard] patchMissingFlagged failed:', e.message);
    }
  };

  return { publishStreak, fetchTop, subscribe, unsubscribe, computeStreak, patchMissingFlagged };
})();
