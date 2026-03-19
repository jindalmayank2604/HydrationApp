/* ══════════════════════════════════════════════════════════════
   MODULE: WeatherGoal  (js/modules/weatherGoal.js)
   ──────────────────────────────────────────────────────────────
   Shows a smart goal suggestion popup when:
     - App is opened before 12:00 PM
     - Temperature changed >= 5°C vs yesterday
     - The popup has NOT already been shown today

   Uses Open-Meteo (free, no API key needed).
   Stores lastWeatherPromptDate in Firestore users/{uid}.
   ══════════════════════════════════════════════════════════════ */

const WeatherGoal = (() => {

  /* ── Check if we should show the popup ── */
  const shouldShow = async () => {
    /* Only before noon */
    if (new Date().getHours() >= 12) return false;

    const session = Auth.getSession();
    if (!session?.uid) return false;

    const today = new Date().toISOString().slice(0, 10);

    /* Check Firestore: already shown today? */
    try {
      const db   = firebase.firestore();
      const snap = await db.collection('users').doc(session.uid).get();
      const data = snap.exists ? snap.data() : {};
      if (data.lastWeatherPromptDate === today) return false;
    } catch(e) {
      console.warn('[WeatherGoal] Firestore check failed:', e.message);
    }

    return true;
  };

  /* ── Fetch today + yesterday temps from Open-Meteo ── */
  const getTempData = async () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error('No geolocation')); return; }
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yStr = yesterday.toISOString().slice(0, 10);
          const tStr = new Date().toISOString().slice(0, 10);

          /* Fetch both today (forecast) and yesterday (historical) in one call */
          const url = `https://api.open-meteo.com/v1/forecast?` +
            `latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
            `&daily=temperature_2m_max,temperature_2m_min` +
            `&start_date=${yStr}&end_date=${tStr}` +
            `&timezone=auto`;
          const res  = await fetch(url);
          const data = await res.json();
          const days = data.daily;

          if (!days || days.time.length < 2) { reject(new Error('No data')); return; }

          const avgTemp = (max, min) => Math.round((max + min) / 2);
          const yIdx    = 0; // yesterday is first
          const tIdx    = 1; // today is second

          resolve({
            today    : avgTemp(days.temperature_2m_max[tIdx], days.temperature_2m_min[tIdx]),
            yesterday: avgTemp(days.temperature_2m_max[yIdx], days.temperature_2m_min[yIdx]),
            todayMax : days.temperature_2m_max[tIdx],
          });
        } catch(e) { reject(e); }
      }, reject, { timeout: 8000 });
    });
  };

  /* ── Calculate suggested goal adjustment ── */
  const calcAdjustment = (tempDiff, todayMax) => {
    if (tempDiff < 5)  return 0;    // not a major change
    if (tempDiff >= 10 || todayMax >= 38) return 500;
    if (tempDiff >= 7  || todayMax >= 32) return 350;
    return 200;
  };

  /* ── Show the popup ── */
  const showPopup = (tempDiff, todayTemp, currentGoal, adjustment) => {
    const suggestedGoal = currentGoal + adjustment;
    const arrow = tempDiff > 0 ? '↑' : '↓';
    const absDiff = Math.abs(tempDiff);

    const overlay = document.createElement('div');
    overlay.id = 'weatherGoalOverlay';
    overlay.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9000;
      display:flex;align-items:center;justify-content:center;padding:20px;
      animation:fadeIn 0.2s ease;
    `;
    overlay.innerHTML = `
      <div style="
        background:var(--md-surface,#1E2128);border-radius:24px;
        padding:24px;max-width:360px;width:100%;
        box-shadow:0 20px 60px rgba(0,0,0,0.5);
        border:1.5px solid rgba(251,188,4,0.3);
        animation:slideUp 0.3s cubic-bezier(0.22,1,0.36,1);
      ">
        <div style="text-align:center;margin-bottom:18px;">
          <div style="font-size:44px;margin-bottom:8px;">🌡️</div>
          <div style="font-size:17px;font-weight:700;color:var(--md-on-background);">
            Temperature ${tempDiff > 0 ? 'Increased' : 'Dropped'} Today
          </div>
          <div style="font-size:13px;color:var(--md-on-surface-med);margin-top:8px;line-height:1.6;">
            ${arrow}${absDiff}°C change detected (now ${todayTemp}°C).<br>
            We suggest increasing your water goal.
          </div>
        </div>

        <!-- Goal comparison -->
        <div style="
          display:flex;align-items:center;justify-content:center;gap:16px;
          background:var(--md-surface-2,#2A2D36);border-radius:16px;padding:16px;
          margin-bottom:20px;
        ">
          <div style="text-align:center;">
            <div style="font-size:11px;color:var(--md-on-surface-low);font-weight:600;text-transform:uppercase;">Current</div>
            <div style="font-size:24px;font-weight:700;color:var(--md-on-background);">${currentGoal} ml</div>
          </div>
          <div style="font-size:28px;">→</div>
          <div style="text-align:center;">
            <div style="font-size:11px;color:#FBBC04;font-weight:600;text-transform:uppercase;">Suggested</div>
            <div style="font-size:24px;font-weight:700;color:#FBBC04;">${suggestedGoal} ml</div>
            <div style="font-size:10px;color:var(--md-on-surface-low);margin-top:2px;">+${adjustment} ml</div>
          </div>
        </div>

        <!-- Buttons -->
        <div style="display:flex;gap:10px;">
          <button id="wgIgnore" style="
            flex:1;padding:13px;border-radius:14px;
            border:1.5px solid var(--md-outline,#33383F);
            background:transparent;color:var(--md-on-surface-med);
            font-size:14px;font-weight:600;cursor:pointer;
            font-family:var(--font-body);transition:all 0.15s;
          ">Ignore</button>
          <button id="wgUpdate" style="
            flex:2;padding:13px;border-radius:14px;border:none;
            background:linear-gradient(135deg,#FBBC04,#F57C00);
            color:#fff;font-size:14px;font-weight:700;cursor:pointer;
            font-family:var(--font-body);
            box-shadow:0 4px 14px rgba(251,188,4,0.35);transition:all 0.15s;
          ">✅ Update Goal</button>
        </div>

        <div style="font-size:11px;color:var(--md-on-surface-low);text-align:center;margin-top:12px;">
          Won't show again today
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    /* Mark as shown today in Firestore */
    const today   = new Date().toISOString().slice(0, 10);
    const session = Auth.getSession();
    if (session?.uid) {
      firebase.firestore()
        .collection('users').doc(session.uid)
        .set({ lastWeatherPromptDate: today }, { merge: true })
        .catch(() => {});
    }

    /* Ignore */
    overlay.querySelector('#wgIgnore').addEventListener('click', () => overlay.remove());

    /* Update Goal */
    overlay.querySelector('#wgUpdate').addEventListener('click', () => {
      Storage.setGoal(suggestedGoal);
      /* Republish streak with new goal */
      if (session?.uid && window.Leaderboard) {
        Leaderboard.publishStreak(session.uid).catch(() => {});
      }
      /* Refresh home screen */
      if (window.HomeScreen) HomeScreen.updateUI();
      Utils.showToast(`🌡️ Goal updated to ${suggestedGoal} ml`);
      overlay.remove();
    });

    /* Tap outside dismisses */
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  };

  /* ══════════════════════════════════════════
     MAIN: try to trigger the weather popup
     Call this from app.js after auth is ready.
  ══════════════════════════════════════════ */
  const tryShow = async () => {
    try {
      const show = await shouldShow();
      if (!show) return;

      const { today, yesterday, todayMax } = await getTempData();
      const tempDiff   = today - yesterday;
      const adjustment = calcAdjustment(Math.abs(tempDiff), todayMax);

      /* Only show if temp changed >= 5°C AND there's a meaningful adjustment */
      if (Math.abs(tempDiff) < 5 || adjustment === 0) return;

      const currentGoal = Storage.getGoal();
      /* Add a small delay so the app finishes loading first */
      setTimeout(() => showPopup(tempDiff, today, currentGoal, adjustment), 1500);

    } catch(e) {
      /* Non-fatal — weather popup is optional */
      console.warn('[WeatherGoal] skipped:', e.message);
    }
  };

  return { tryShow };
})();
