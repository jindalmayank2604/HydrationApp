/* ══════════════════════════════════════════════════════════════
   StepTracker — DeviceMotion step detection for browser PWA
   Works on: Android Chrome (HTTPS), iOS Safari 13+ (needs permit)
   Falls back to: manual entry
   ══════════════════════════════════════════════════════════════ */
const StepTracker = (() => {
  const STORAGE_KEY    = 'wt_steps_v1';
  const PERMISSION_KEY = 'wt_steps_permission';

  /* ── Storage ── */
  const _todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const _store    = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY))||{}; } catch { return {}; } };
  const _save     = (d) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} };

  const getTodaySteps = () => _store()[_todayKey()] || 0;
  const setTodaySteps = (n) => {
    const s = _store();
    s[_todayKey()] = Math.max(0, Math.round(n));
    // Keep 7 days
    const keys = Object.keys(s).sort();
    if (keys.length > 7) keys.slice(0, keys.length-7).forEach(k => delete s[k]);
    _save(s);
    // Update UI immediately
    _updateDisplay(s[_todayKey()]);
  };

  const hasPermission = () => localStorage.getItem(PERMISSION_KEY) === 'granted';
  const setPermission = (v) => localStorage.setItem(PERMISSION_KEY, v ? 'granted' : 'denied');
  const isAndroid = () => /android/i.test(navigator.userAgent);

  /* ── Live display update ── */
  const _updateDisplay = (steps) => {
    const n = steps || getTodaySteps();
    const strip = document.getElementById('homeStepsVal');
    const count = document.getElementById('stepsCardCount');
    if (strip) strip.textContent = n >= 1000 ? (n/1000).toFixed(1)+'k' : String(n||0);
    if (count) count.textContent = n.toLocaleString();
  };

  /* ── DeviceMotion step detection ── */
  let _active = false;
  let _pending = 0;       // steps detected since last flush
  let _lastMag = 0;
  let _lastStep = 0;
  const THRESHOLD = 11;   // m/s² — adjust if too sensitive/insensitive
  const MIN_GAP   = 320;  // ms between steps

  const _onMotion = (e) => {
    const a = e.accelerationIncludingGravity || e.acceleration;
    if (!a) return;
    const mag = Math.sqrt((a.x||0)**2 + (a.y||0)**2 + (a.z||0)**2);
    const now = Date.now();
    if (_lastMag < THRESHOLD && mag >= THRESHOLD && now - _lastStep > MIN_GAP) {
      _pending++;
      _lastStep = now;
      if (_pending >= 5) {
        setTodaySteps(getTodaySteps() + _pending);
        _pending = 0;
      }
    }
    _lastMag = mag;
  };

  const startTracking = () => {
    if (_active) return true;
    if (!window.DeviceMotionEvent) {
      console.warn('[Steps] DeviceMotionEvent not available');
      return false;
    }
    window.addEventListener('devicemotion', _onMotion);
    _active = true;
    console.log('[Steps] ✅ Motion tracking started');
    return true;
  };

  const stopTracking = () => {
    if (!_active) return;
    if (_pending > 0) { setTodaySteps(getTodaySteps() + _pending); _pending = 0; }
    window.removeEventListener('devicemotion', _onMotion);
    _active = false;
  };

  /* ── Permission ── */
  const requestPermission = async () => {
    // iOS 13+ needs explicit permission
    if (typeof DeviceMotionEvent?.requestPermission === 'function') {
      try {
        const r = await DeviceMotionEvent.requestPermission();
        if (r === 'granted') { setPermission(true); startTracking(); return true; }
        setPermission(false);
        return false;
      } catch(e) {
        console.warn('[Steps] iOS permission error:', e);
        return false;
      }
    }
    // Android Chrome — no explicit permission needed, just start
    if (window.DeviceMotionEvent) {
      setPermission(true);
      startTracking();
      return true;
    }
    return false;
  };

  /* ── Sync ── */
  const sync = async () => {
    // Flush any pending steps
    if (_active && _pending > 0) {
      setTodaySteps(getTodaySteps() + _pending);
      _pending = 0;
    }
    return getTodaySteps();
  };

  /* ── Auto-resume on reload if already granted ── */
  if (hasPermission() && window.DeviceMotionEvent) {
    startTracking();
    console.log('[Steps] Auto-resumed tracking (permission already granted)');
  }

  /* ── Hydration loss formula ── */
  const calcHydrationLoss = (steps, temp=22, humidity=50) => {
    if (!steps || steps <= 0) return 0;
    const hf = humidity > 70 ? 1.15 : humidity > 50 ? 1.05 : 1.0;
    const mlPer1k = temp>=38 ? 65 : temp>=32 ? 40 : temp>=26 ? 30 : temp>=18 ? 25 : 17;
    return Math.min(2000, Math.round((steps/1000) * mlPer1k * hf / 10) * 10);
  };

  // Expose live magnitude so UI can show sensor activity
  const getLiveMag = () => _lastMag;
  const isTracking = () => _active;

  return {
    isAndroid, hasPermission, setPermission,
    requestPermission, startTracking, stopTracking,
    getTodaySteps, setTodaySteps,
    calcHydrationLoss, sync,
    getLiveMag, isTracking,
    startMotionTracking: startTracking,
  };
})();
