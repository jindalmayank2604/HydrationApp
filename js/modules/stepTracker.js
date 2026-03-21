/* ══════════════════════════════════════════════════════════════
   MODULE: StepTracker
   Strategy (in order of availability):
   1. window.healthConnect  — TWA/native wrapper (Health Connect)
   2. DeviceMotionEvent     — Browser accelerometer (step detection)
   3. Manual entry fallback — user enters steps
   ══════════════════════════════════════════════════════════════ */

const StepTracker = (() => {
  const STORAGE_KEY    = 'wt_steps_v1';
  const PERMISSION_KEY = 'wt_steps_permission';

  const isAndroid = () => /android/i.test(navigator.userAgent);

  /* ── LocalStorage helpers ── */
  const _todayKey = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  };
  const _readStore  = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; } };
  const _writeStore = (d) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} };

  const getTodaySteps = () => _readStore()[_todayKey()] || 0;
  const setTodaySteps = (steps) => {
    const store = _readStore();
    store[_todayKey()] = Math.max(0, Math.round(steps));
    const keys = Object.keys(store).sort();
    if (keys.length > 7) keys.slice(0, keys.length - 7).forEach(k => delete store[k]);
    _writeStore(store);
  };

  const hasPermission = () => localStorage.getItem(PERMISSION_KEY) === 'granted';
  const setPermission = (v) => localStorage.setItem(PERMISSION_KEY, v ? 'granted' : 'denied');

  /* ── 1. Health Connect (TWA only) ── */
  const _hasHealthConnect = () => !!(window.healthConnect || window.HealthConnect);

  const _requestHealthConnect = async () => {
    try {
      const hc = window.healthConnect || window.HealthConnect;
      return await hc.requestPermission([{ accessType: 'read', recordType: 'Steps' }]);
    } catch(e) { return false; }
  };

  const _fetchHealthConnectSteps = async () => {
    try {
      const hc = window.healthConnect || window.HealthConnect;
      if (!hc) return null;
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const records = await hc.readRecords('Steps', {
        timeRangeFilter: { type: 'between', startTime: start.toISOString(), endTime: now.toISOString() }
      });
      return (records || []).reduce((s, r) => s + (r.count || 0), 0);
    } catch(e) { return null; }
  };

  /* ── 2. DeviceMotion step counter (browser fallback) ── */
  let _motionSteps = 0;
  let _lastMagnitude = 0;
  let _motionActive = false;
  let _threshold = 12; // m/s² — tune for walking detection
  let _lastStepTime = 0;
  const MIN_STEP_INTERVAL = 300; // ms — min time between steps

  const _onMotion = (e) => {
    const acc = e.accelerationIncludingGravity;
    if (!acc) return;
    const mag = Math.sqrt(acc.x**2 + acc.y**2 + acc.z**2);
    const now = Date.now();

    // Detect peak crossing threshold (step = magnitude crosses threshold from below)
    if (_lastMagnitude < _threshold && mag >= _threshold) {
      if (now - _lastStepTime > MIN_STEP_INTERVAL) {
        _motionSteps++;
        _lastStepTime = now;
        // Save every 10 steps
        if (_motionSteps % 5 === 0) {
          const stored = getTodaySteps();
          setTodaySteps(stored + _motionSteps);
          _motionSteps = 0;
        }
      }
    }
    _lastMagnitude = mag;
  };

  const _startMotionTracking = () => {
    if (_motionActive) return;
    if (!window.DeviceMotionEvent) return false;
    window.addEventListener('devicemotion', _onMotion);
    _motionActive = true;
    console.log('[Steps] DeviceMotion tracking started');
    return true;
  };

  const _stopMotionTracking = () => {
    if (!_motionActive) return;
    // Flush remaining steps
    if (_motionSteps > 0) {
      setTodaySteps(getTodaySteps() + _motionSteps);
      _motionSteps = 0;
    }
    window.removeEventListener('devicemotion', _onMotion);
    _motionActive = false;
  };

  const _requestMotionPermission = async () => {
    // iOS 13+ requires explicit permission request
    if (typeof DeviceMotionEvent?.requestPermission === 'function') {
      try {
        const result = await DeviceMotionEvent.requestPermission();
        return result === 'granted';
      } catch(e) { return false; }
    }
    // Android Chrome — permission is implicit, just check if API exists
    return !!window.DeviceMotionEvent;
  };

  /* ── Hydration loss from steps + weather ── */
  const calcHydrationLoss = (steps, weatherTemp, humidity) => {
    if (!steps || steps <= 0) return 0;
    const t = weatherTemp || 22;
    const h = humidity || 50;
    const humFactor = h > 70 ? 1.15 : h > 50 ? 1.05 : 1.0;
    let mlPer1000;
    if      (t >= 38) mlPer1000 = 65 * humFactor;
    else if (t >= 32) mlPer1000 = 40 * humFactor;
    else if (t >= 26) mlPer1000 = 30 * humFactor;
    else if (t >= 18) mlPer1000 = 25 * humFactor;
    else              mlPer1000 = 17 * humFactor;
    return Math.min(2000, Math.round((steps / 1000) * mlPer1000 / 10) * 10);
  };

  /* ── Main permission request ── */
  const requestPermission = async () => {
    // Try Health Connect first (TWA)
    if (_hasHealthConnect()) {
      const granted = await _requestHealthConnect();
      setPermission(granted);
      return granted;
    }
    // Try DeviceMotion (browser)
    const granted = await _requestMotionPermission();
    if (granted) {
      setPermission(true);
      _startMotionTracking();
    }
    return granted;
  };

  /* ── Sync: fetch latest steps ── */
  const sync = async () => {
    // Health Connect (most accurate)
    if (_hasHealthConnect() && hasPermission()) {
      const hcSteps = await _fetchHealthConnectSteps();
      if (hcSteps !== null) { setTodaySteps(hcSteps); return hcSteps; }
    }
    // DeviceMotion — flush pending + return stored
    if (_motionActive && _motionSteps > 0) {
      setTodaySteps(getTodaySteps() + _motionSteps);
      _motionSteps = 0;
    }
    return getTodaySteps();
  };

  /* ── Auto-start motion tracking if permission already granted ── */
  if (hasPermission() && !_hasHealthConnect() && window.DeviceMotionEvent) {
    // Start immediately — no need to ask again
    _startMotionTracking();
  }

  return {
    isAndroid,
    hasPermission,
    setPermission,
    requestPermission,
    getTodaySteps,
    setTodaySteps,
    calcHydrationLoss,
    sync,
    startMotionTracking: _startMotionTracking,
    stopMotionTracking:  _stopMotionTracking,
  };
})();
