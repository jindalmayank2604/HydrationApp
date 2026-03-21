/* ══════════════════════════════════════════════════════════════
   MODULE: StepTracker
   - Health Connect (Android) for step count
   - Calculates hydration adjustment from steps + weather
   - Desktop: hidden entirely
   ══════════════════════════════════════════════════════════════ */

const StepTracker = (() => {
  const STORAGE_KEY = 'wt_steps_v1';
  const PERMISSION_KEY = 'wt_steps_permission';

  // Is this an Android device that could support Health Connect?
  const isAndroid = () => /android/i.test(navigator.userAgent);

  // Read/write today's step data from localStorage
  const _todayKey = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  };

  const _readStore = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
  };

  const _writeStore = (data) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
  };

  const getTodaySteps = () => {
    const store = _readStore();
    return store[_todayKey()] || 0;
  };

  const setTodaySteps = (steps) => {
    const store = _readStore();
    store[_todayKey()] = Math.max(0, Math.round(steps));
    // Keep only last 7 days
    const keys = Object.keys(store).sort();
    if (keys.length > 7) keys.slice(0, keys.length - 7).forEach(k => delete store[k]);
    _writeStore(store);
  };

  const hasPermission = () => localStorage.getItem(PERMISSION_KEY) === 'granted';
  const setPermission = (v) => localStorage.setItem(PERMISSION_KEY, v ? 'granted' : 'denied');

  /* ── Health Connect API (Android WebView / TWA) ─────────────── */
  const requestHealthConnect = async () => {
    // Health Connect is only available in Android TWA/WebView
    if (!window.healthConnect && !window.HealthConnect) return false;
    try {
      const hc = window.healthConnect || window.HealthConnect;
      const granted = await hc.requestPermission([
        { accessType: 'read', recordType: 'Steps' }
      ]);
      return granted;
    } catch(e) {
      console.warn('[Steps] Health Connect permission error:', e.message);
      return false;
    }
  };

  const fetchHealthConnectSteps = async () => {
    try {
      const hc = window.healthConnect || window.HealthConnect;
      if (!hc) return null;
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const records = await hc.readRecords('Steps', {
        timeRangeFilter: {
          type: 'between',
          startTime: start.toISOString(),
          endTime: now.toISOString(),
        }
      });
      const total = (records || []).reduce((sum, r) => sum + (r.count || 0), 0);
      return total;
    } catch(e) {
      console.warn('[Steps] Health Connect read error:', e.message);
      return null;
    }
  };

  /* ── Hydration loss calculation from steps + weather ─────────── */
  // Based on: 1000 steps ≈ 0.75km ≈ 9 min walking
  // Sweat loss: normal 20-30ml/1000steps, hot 30-50ml, very hot 50-80ml
  const calcHydrationLoss = (steps, weatherTemp, humidity) => {
    if (!steps || steps <= 0) return 0;

    // Determine weather multiplier
    // feelsLike (apparent temp) accounts for humidity
    const t = weatherTemp || 22;
    const h = humidity || 50;

    // Heat index: high humidity makes it feel hotter and increases sweat
    const humidityFactor = h > 70 ? 1.15 : h > 50 ? 1.05 : 1.0;

    let mlPer1000;
    if (t >= 38) {
      // Very hot / extreme: 50–80ml per 1000 steps
      mlPer1000 = 65 * humidityFactor;
    } else if (t >= 32) {
      // Hot: 30–50ml per 1000 steps
      mlPer1000 = 40 * humidityFactor;
    } else if (t >= 26) {
      // Warm: 25–35ml per 1000 steps
      mlPer1000 = 30 * humidityFactor;
    } else if (t >= 18) {
      // Normal: 20–30ml per 1000 steps
      mlPer1000 = 25 * humidityFactor;
    } else {
      // Cool/cold: 15–20ml per 1000 steps (cold air still drying)
      mlPer1000 = 17 * humidityFactor;
    }

    const loss = Math.round((steps / 1000) * mlPer1000);
    // Round to nearest 10ml, cap at 2000ml (safety)
    return Math.min(2000, Math.round(loss / 10) * 10);
  };

  /* ── Sync steps from Health Connect ──────────────────────────── */
  const sync = async () => {
    if (!isAndroid()) return getTodaySteps();
    if (!hasPermission()) return getTodaySteps();

    const hcSteps = await fetchHealthConnectSteps();
    if (hcSteps !== null) {
      setTodaySteps(hcSteps);
      return hcSteps;
    }
    return getTodaySteps();
  };

  /* ── Request permission flow ──────────────────────────────────── */
  const requestPermission = async () => {
    if (!isAndroid()) return false;
    const granted = await requestHealthConnect();
    setPermission(granted);
    return granted;
  };

  return {
    isAndroid,
    hasPermission,
    setPermission,
    requestPermission,
    getTodaySteps,
    setTodaySteps,
    calcHydrationLoss,
    sync,
  };
})();
