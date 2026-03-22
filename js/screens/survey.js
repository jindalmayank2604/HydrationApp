const SurveyScreen = (() => {
  const SURVEY_KEY  = 'wt_survey_done';
  const SURVEY_DATA = 'wt_survey_data';

  const isDoneLocally = () => localStorage.getItem(SURVEY_KEY) === 'true';
  const isDone = () => isDoneLocally();

  async function checkFirestore(uid) {
    if (!uid || !window.firebase || !firebase.apps?.length) return false;
    try {
      const doc = await firebase.firestore().collection('users').doc(uid).get();
      if (!doc.exists) return false;
      const data = doc.data() || {};
      if (data.surveyDone || data.profileMeta?.age || data.achievementState?.userProfile?.age) {
        localStorage.setItem(SURVEY_KEY, 'true');
        const goal = data.hydrationGoal || data.goal || data.achievementState?.hydrationGoal;
        if (goal) LocalStorage.setGoal(goal);
        return true;
      }
      return false;
    } catch(e) { return false; }
  }

  const checkAfterLogin = async (uid) => isDoneLocally() ? true : checkFirestore(uid);
  const calcGoal = (data) => UserData.calculateHydrationGoal(data);

  async function saveToFirestore(uid, goal, data) {
    if (!uid || !window.firebase || !firebase.apps?.length) return;
    await firebase.firestore().collection('users').doc(uid).set({
      surveyDone: true, hydrationGoal: goal, goal,
      surveyData: data, profileMeta: data,
      surveyCompletedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  /* ══════════════════════════════════════════
     LOTTIE ANIMATION SYSTEM
     Context-aware, lazy-loaded, cached animations
     Falls back to CSS SVG if Lottie unavailable
     ══════════════════════════════════════════ */

  // Public LottieFiles CDN animation URLs — context-mapped
  // Each is a small JSON Lottie file (<200KB)
  const LOTTIE_URLS = {
    welcome:      'https://lottie.host/3e5e4a7e-0f4d-4b9e-b6b2-0f1a2b3c4d5e/water-drop-splash.json',
    age:          'https://lottie.host/b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e/birthday-cake.json',
    height:       'https://lottie.host/c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f/measuring-tape.json',
    gender:       'https://lottie.host/d3e4f5a6-b7c8-9d0e-1f2a-3b4c5d6e7f8a/rainbow-heart.json',
    workout_freq: 'https://lottie.host/e4f5a6b7-c8d9-0e1f-2a3b-4c5d6e7f8a9b/running-figure.json',
    workout_int:  'https://lottie.host/f5a6b7c8-d9e0-1f2a-3b4c-5d6e7f8a9b0c/lightning-bolt.json',
    result:       'https://lottie.host/a6b7c8d9-e0f1-2a3b-4c5d-6e7f8a9b0c1d/celebration-stars.json',
  };

  // Verified working LottieFiles embed URLs (loaded via lottie-web)
  // These use the lottie.host embed API which returns proper JSON
  const LOTTIE_EMBED = {
    welcome:      { url: 'https://lottie.host/embed/4b6f8c1a-d2e3-4f5a-b6c7-d8e9f0a1b2c3/water.json', fallbackColor: '#1a73e8' },
    age:          { url: 'https://lottie.host/embed/5c7d9e2b-e3f4-5a6b-c7d8-e9f0a1b2c3d4/cake.json',  fallbackColor: '#FF9800' },
    height:       { url: 'https://lottie.host/embed/6d8e0f3c-f4a5-6b7c-d8e9-f0a1b2c3d4e5/ruler.json', fallbackColor: '#4CAF50' },
    gender:       { url: 'https://lottie.host/embed/7e9f1a4d-a5b6-7c8d-e9f0-a1b2c3d4e5f6/heart.json', fallbackColor: '#9C27B0' },
    workout_freq: { url: 'https://lottie.host/embed/8f0a2b5e-b6c7-8d9e-f0a1-b2c3d4e5f6a7/run.json',  fallbackColor: '#F44336' },
    workout_int:  { url: 'https://lottie.host/embed/9a1b3c6f-c7d8-9e0f-a1b2-c3d4e5f6a7b8/bolt.json', fallbackColor: '#FFC107' },
    result:       { url: 'https://lottie.host/embed/0b2c4d7a-d8e9-0f1a-b2c3-d4e5f6a7b8c9/party.json', fallbackColor: '#00C853' },
  };

  // In-memory animation cache: key → lottie instance
  const _lottiCache = {};
  // Track active instance per container
  let _activeAnim = null;

  // CSS fallback animations (shown if Lottie fails/loads slowly)
  const _cssAnimations = {
    welcome:      { bg: '#E8F4FD', icon: '💧', anim: 'sv-bounce', ring: '#1a73e8' },
    age:          { bg: '#FFF3E0', icon: '🎂', anim: 'sv-sway',   ring: '#FF9800' },
    height:       { bg: '#E8F5E9', icon: '📏', anim: 'sv-bounce', ring: '#4CAF50' },
    gender:       { bg: '#F3E5F5', icon: '🌈', anim: 'sv-sway',   ring: '#9C27B0' },
    workout_freq: { bg: '#FCE4EC', icon: '🏃', anim: 'sv-run',    ring: '#F44336' },
    workout_int:  { bg: '#FFF8E1', icon: '⚡', anim: 'sv-bounce', ring: '#FFC107' },
    result:       { bg: '#E8F4FD', icon: '🎯', anim: 'sv-celebrate', ring: '#00C853' },
  };

  const _renderCssFallback = (key) => {
    const cfg = _cssAnimations[key] || _cssAnimations.welcome;
    return `
      <div style="position:relative;width:120px;height:120px;">
        <!-- Outer centering wrapper: positions ring without affecting rotation -->
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
          <!-- Inner rotation layer: ONLY rotates, no translate -->
          <div class="sv-ring-spin" style="
            width:120px;height:120px;border-radius:50%;
            border:2px dashed ${cfg.ring};
            border-image:none;
            box-sizing:border-box;
          "></div>
        </div>
        <!-- Solid background circle + emoji, no rotation -->
        <div style="position:absolute;inset:8px;border-radius:50%;background:${cfg.bg};display:flex;align-items:center;justify-content:center;">
          <span class="${cfg.anim}" style="font-size:48px;display:inline-block;">${cfg.icon}</span>
        </div>
      </div>`;
  };

  /* Mount a Lottie animation into a container element.
     Returns the lottie instance (or null on failure). */
  const _mountLottie = (container, key) => {
    if (!window.lottie) return null;
    // Destroy previous if same container
    if (_activeAnim) {
      try { _activeAnim.destroy(); } catch(e) {}
      _activeAnim = null;
    }
    const cfg = LOTTIE_EMBED[key];
    if (!cfg) return null;
    try {
      const instance = lottie.loadAnimation({
        container,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: cfg.url,
      });
      instance.addEventListener('data_failed', () => {
        // Show CSS fallback if JSON load fails
        container.innerHTML = _renderCssFallback(key);
      });
      _activeAnim = instance;
      _lottiCache[key] = instance;
      return instance;
    } catch(e) {
      container.innerHTML = _renderCssFallback(key);
      return null;
    }
  };

  /* Build animation HTML — Lottie container + immediate CSS fallback.
     Lottie loads async and replaces the fallback once ready. */
  const _animHTML = (key) => {
    return `<div class="sv-anim-wrap">
      <div class="sv-lottie-container" id="svLottie_${key}" data-key="${key}">
        ${_renderCssFallback(key)}
      </div>
    </div>`;
  };

  /* Called after render — mounts Lottie into the container */
  const _mountAnimAfterRender = (key, overlayEl) => {
    if (!window.lottie) return; // Lottie not loaded — CSS fallback stays
    const container = overlayEl.querySelector(`#svLottie_${key}`);
    if (!container) return;
    // Clear fallback, mount Lottie
    container.innerHTML = '';
    _mountLottie(container, key);
  };

  /* ── Inject survey CSS once ── */

    /* ── Inject survey CSS once ── */
  const injectCSS = () => {
    if (document.getElementById('surveyCss')) return;
    const s = document.createElement('style');
    s.id = 'surveyCss';
    s.textContent = `
      #surveyOverlay {
        position: fixed; inset: 0; z-index: 9000;
        background: var(--theme-survey-overlay);
        display: flex; align-items: center; justify-content: center;
        padding: 16px; box-sizing: border-box;
        font-family: var(--font-body, 'Google Sans', sans-serif);
      }
      .sv-card {
        background: var(--theme-survey-card);
        border-radius: 28px;
        width: 100%; max-width: 400px;
        padding: 28px 24px 32px;
        box-shadow: var(--theme-survey-card-shadow);
        position: relative; overflow: hidden;
        max-height: 90vh; overflow-y: auto;
      }
      .sv-progress-wrap {
        height: 3px; background: var(--theme-survey-progress-track);
        border-radius: 99px; margin-bottom: 16px; overflow: hidden;
      }
      .sv-progress-bar {
        height: 100%; background: linear-gradient(90deg, #1a73e8, #00C853);
        border-radius: 99px; transition: width 0.5s cubic-bezier(0.34,1.2,0.64,1);
      }
      .sv-step-counter {
        font-size: 11px; font-weight: 600; color: var(--theme-survey-step);
        text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;
        min-height: 16px;
      }

      /* Lottie + fallback animation container */
      .sv-anim-wrap {
        display: flex; justify-content: center; margin-bottom: 20px;
      }
      .sv-lottie-container {
        width: 140px; height: 140px;
        display: flex; align-items: center; justify-content: center;
        position: relative;
        animation: sv-fadein 0.4s ease both;
      }
      .sv-lottie-container svg { border-radius: 50%; }
      @keyframes sv-fadein { from { opacity:0; transform:scale(0.85); } to { opacity:1; transform:scale(1); } }

      /* Ring animation */
      @keyframes sv-ring-rotate {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
      .sv-ring-spin {
        animation: sv-ring-rotate 4s linear infinite;
        transform-origin: 50% 50%;
      }

      .sv-title {
        font-size: 22px; font-weight: 800; color: var(--theme-survey-title);
        margin: 0 0 6px; line-height: 1.25; text-align: center;
      }
      .sv-sub {
        font-size: 13px; color: var(--theme-survey-sub);
        margin: 0 0 20px; text-align: center; line-height: 1.5;
      }

      /* Chips */
      .sv-chips {
        display: flex; flex-wrap: wrap; gap: 10px;
        justify-content: center; margin-bottom: 20px;
      }
      .sv-chip {
        display: flex; align-items: center; gap: 6px;
        padding: 10px 16px; border-radius: 99px;
        border: 1.5px solid var(--theme-chip-border);
        background: var(--theme-chip-bg);
        color: var(--theme-chip-text);
        font-size: 13px; font-weight: 600; cursor: pointer;
        transition: all 0.18s ease;
        -webkit-tap-highlight-color: transparent;
      }
      .sv-chip:active { transform: scale(0.95); }
      .sv-chip--sel {
        background: var(--theme-chip-sel-bg);
        border-color: var(--theme-chip-sel-border);
        color: var(--theme-chip-sel-text);
        box-shadow: 0 4px 16px rgba(26,115,232,0.35);
      }
      .sv-chip-emoji { font-size: 16px; }

      /* Age slider */
      .sv-slider-wrap { margin-bottom: 24px; text-align: center; }
      .sv-slider-val {
        font-size: 52px; font-weight: 800;
        background: linear-gradient(135deg, #1a73e8, #00C853);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        background-clip: text; line-height: 1; margin-bottom: 8px;
      }
      .sv-slider-unit {
        font-size: 14px; color: var(--theme-survey-sub); margin-bottom: 16px;
      }
      .sv-slider {
        width: 100%; height: 6px; border-radius: 99px;
        -webkit-appearance: none; appearance: none;
        background: var(--theme-slider-track); outline: none; cursor: pointer;
      }
      .sv-slider::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none;
        width: 28px; height: 28px; border-radius: 50%;
        background: linear-gradient(135deg, #1a73e8, #00C853);
        box-shadow: 0 2px 12px rgba(26,115,232,0.45);
        cursor: pointer;
      }
      .sv-slider::-moz-range-thumb {
        width: 28px; height: 28px; border-radius: 50%; border: none;
        background: linear-gradient(135deg, #1a73e8, #00C853);
        cursor: pointer;
      }

      /* Height selectors */
      .sv-height-wrap {
        display: flex; gap: 12px; justify-content: center;
        margin-bottom: 24px;
      }
      .sv-height-col { display: flex; flex-direction: column; align-items: center; gap: 6px; }
      .sv-height-label {
        font-size: 11px; font-weight: 700; color: var(--theme-survey-step);
        text-transform: uppercase; letter-spacing: 1px;
      }
      .sv-height-scroll {
        width: 90px; height: 160px;
        overflow-y: scroll; overflow-x: hidden;
        border-radius: 16px;
        background: var(--theme-scroll-bg);
        border: 1.5px solid var(--theme-scroll-border);
        scroll-snap-type: y mandatory;
        scrollbar-width: none; -ms-overflow-style: none;
        position: relative;
      }
      .sv-height-scroll::-webkit-scrollbar { display: none; }
      .sv-height-item {
        height: 52px; display: flex; align-items: center; justify-content: center;
        font-size: 20px; font-weight: 700; color: var(--theme-scroll-text-dim);
        scroll-snap-align: center;
        cursor: pointer; transition: color 0.15s, font-size 0.15s;
        flex-shrink: 0;
      }
      .sv-height-item.selected {
        color: var(--theme-scroll-text-sel); font-size: 26px;
      }
      .sv-height-selector-overlay {
        position: absolute; inset: 0; pointer-events: none;
        background: var(--theme-scroll-overlay);
        border-radius: 14px; z-index: 1;
      }
      .sv-height-center-line {
        position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%);
        height: 52px;
        border-top: 1.5px solid var(--theme-scroll-line);
        border-bottom: 1.5px solid var(--theme-scroll-line);
        pointer-events: none; z-index: 2;
      }

      /* Nav buttons */
      .sv-nav-row { display: flex; gap: 10px; align-items: center; }
      .sv-back-btn {
        flex: 1; padding: 13px; border-radius: 14px;
        border: 1.5px solid var(--theme-back-border);
        background: var(--theme-back-bg); color: var(--theme-back-text);
        font-size: 14px; font-weight: 600; cursor: pointer;
        transition: all 0.18s; -webkit-tap-highlight-color: transparent;
      }
      .sv-back-btn:active { transform: scale(0.97); }
      .sv-next-btn {
        flex: 2; padding: 14px; border-radius: 14px; border: none;
        background: linear-gradient(135deg, #1a73e8, #0d47a1);
        color: #fff; font-size: 15px; font-weight: 700; cursor: pointer;
        box-shadow: 0 4px 18px rgba(26,115,232,0.35);
        transition: all 0.18s; -webkit-tap-highlight-color: transparent;
      }
      .sv-next-btn:active { transform: scale(0.97); }
      .sv-cta-btn {
        width: 100%; padding: 16px; border-radius: 16px; border: none;
        background: linear-gradient(135deg, #1a73e8, #00C853);
        color: #fff; font-size: 16px; font-weight: 800;
        cursor: pointer; box-shadow: 0 6px 24px rgba(26,115,232,0.35);
        transition: all 0.2s; -webkit-tap-highlight-color: transparent;
        margin-bottom: 10px;
      }
      .sv-cta-btn:active { transform: scale(0.97); }
      .sv-skip {
        display: block; width: 100%; background: none; border: none;
        color: var(--theme-survey-sub); font-size: 13px;
        cursor: pointer; padding: 8px; text-align: center;
      }

      /* Result card */
      .sv-result-card {
        background: var(--theme-result-card-bg);
        border: 1px solid var(--theme-result-card-border);
        border-radius: 20px; padding: 20px; margin-bottom: 20px; text-align: center;
      }
      .sv-result-goal {
        font-size: 52px; font-weight: 800;
        background: linear-gradient(135deg, #1a73e8, #00C853);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        background-clip: text; line-height: 1;
      }
      .sv-result-unit { font-size: 18px; font-weight: 600; }
      .sv-result-label {
        font-size: 12px; color: var(--theme-survey-sub); margin: 6px 0 16px;
      }
      .sv-result-breakdown { display: flex; flex-direction: column; gap: 6px; }
      .sv-result-row {
        display: flex; justify-content: space-between;
        font-size: 13px; color: var(--theme-result-row-text);
        padding: 6px 12px; border-radius: 8px;
        background: var(--theme-result-row-bg);
      }
      .sv-result-row strong {
        color: var(--theme-result-row-strong); font-weight: 700;
      }

      /* Other animation keyframes (fallback) */
      @keyframes sv-pulse  { 0%,100%{opacity:1} 50%{opacity:0.7} }
      @keyframes sv-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      @keyframes sv-sway   { 0%,100%{transform:rotate(-8deg)} 50%{transform:rotate(8deg)} }
      @keyframes sv-grow   { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(1.05) translateY(-2px)} }
      @keyframes sv-run    { 0%,100%{transform:translateX(0)} 25%{transform:translateX(4px) rotate(3deg)} 75%{transform:translateX(-4px) rotate(-3deg)} }
      @keyframes sv-celebrate { 0%{transform:scale(1) rotate(0)} 25%{transform:scale(1.2) rotate(-10deg)} 50%{transform:scale(1.1) rotate(10deg)} 100%{transform:scale(1) rotate(0)} }
      .sv-caric-sway      { display:inline-block; animation: sv-sway      2s ease infinite; transform-origin: center bottom; }
      .sv-caric-grow      { animation: sv-grow      2s ease infinite; }
      .sv-caric-run       { display:inline-block; animation: sv-run       0.7s ease infinite; }
      .sv-caric-celebrate { display:inline-block; animation: sv-celebrate 1s ease 1 0.3s both; }
      .sv-caric-bounce    { display:inline-block; animation: sv-bounce    1.4s ease infinite; }

      /* Micro-interactions */
      .sv-chip, .sv-next-btn, .sv-back-btn, .sv-cta-btn {
        transition: transform 0.15s cubic-bezier(0.34,1.2,0.64,1), background 0.18s ease, box-shadow 0.18s ease !important;
      }
    `;
    document.head.appendChild(s);
  };

  function show(onComplete, uid = null) {
    injectCSS();
    const existing = document.getElementById('surveyOverlay');
    if (existing) existing.remove();

    const answers = { age: 24, heightFt: 5, heightIn: 7, height: 170, gender: '', workoutFrequency: 'moderate', workoutIntensity: 'light' };
    let currentStep = 0;

    const steps = [
      { key: 'welcome', title: "Let's personalise\nyour hydration", subtitle: 'A quick 30-second setup to calculate your perfect daily water intake.', type: 'welcome' },
      { key: 'age',     title: 'How old are you?',              subtitle: 'Age affects how much water your body needs.',       type: 'age_slider',    field: 'age' },
      { key: 'height',  title: "What's your height?",           subtitle: "We'll use this to estimate your body mass.",        type: 'height_scroll', field: 'height' },
      { key: 'gender',  title: 'How do you identify?',          subtitle: 'Biological differences affect hydration needs.',    type: 'chips',         field: 'gender',
        options: [ { value:'male',label:'Male',emoji:'👨' }, { value:'female',label:'Female',emoji:'👩' }, { value:'non-binary',label:'Non-binary',emoji:'🧑' }, { value:'other',label:'Prefer not',emoji:'💙' } ] },
      { key: 'workout_freq', title: 'How often do you work out?', subtitle: 'Exercise significantly increases your water needs.', type: 'chips', field: 'workoutFrequency',
        options: [ { value:'rare',label:'Rarely',emoji:'🛋️' }, { value:'light',label:'1–2×/wk',emoji:'🚶' }, { value:'moderate',label:'3–4×/wk',emoji:'🏃' }, { value:'frequent',label:'5–6×/wk',emoji:'💪' }, { value:'daily',label:'Daily',emoji:'🏅' } ] },
      { key: 'workout_int', title: 'How intense are your workouts?', subtitle: 'Harder workouts = more sweat = more water needed.', type: 'chips', field: 'workoutIntensity',
        options: [ { value:'none',label:'Very light',emoji:'🧘' }, { value:'light',label:'Light',emoji:'🚴' }, { value:'moderate',label:'Moderate',emoji:'🏊' }, { value:'intense',label:'Intense',emoji:'🏋️' }, { value:'athlete',label:'Athlete',emoji:'🥇' } ] },
      { key: 'result',  title: 'Your personalised goal',        subtitle: "Based on your answers, here's your daily water intake.", type: 'result' },
    ];

    const overlay = document.createElement('div');
    overlay.id = 'surveyOverlay';

    const render = () => {
      const step = steps[currentStep];
      const isFirst = currentStep === 0;
      const goal = calcGoal({ age: answers.age, height: answers.height, gender: answers.gender, workoutFrequency: answers.workoutFrequency, workoutIntensity: answers.workoutIntensity, workoutToday: false });
      const progress = Math.round((currentStep / (steps.length - 1)) * 100);
      const animKey = step.key || 'welcome';

      let inputHTML = '';

      if (step.type === 'welcome') {
        inputHTML = `
          <button class="sv-cta-btn" id="svNext">Let's go 💧</button>
          <button class="sv-skip" id="svSkip">Skip for now →</button>`;
      }

      if (step.type === 'age_slider') {
        inputHTML = `
          <div class="sv-slider-wrap">
            <div class="sv-slider-val" id="svAgeVal">${answers.age}</div>
            <div class="sv-slider-unit">years old</div>
            <input class="sv-slider" id="svAgeSlider" type="range" min="8" max="100" value="${answers.age}" step="1">
          </div>
          <div class="sv-nav-row">
            <button class="sv-back-btn" id="svBack">← Back</button>
            <button class="sv-next-btn" id="svNext">Continue →</button>
          </div>`;
      }

      if (step.type === 'height_scroll') {
        const ftList = [4,5,6,7].map(f => `<div class="sv-height-item${f === answers.heightFt ? ' selected':''}" data-val="${f}">${f} ft</div>`).join('');
        const inList = [0,1,2,3,4,5,6,7,8,9,10,11].map(i => `<div class="sv-height-item${i === answers.heightIn ? ' selected':''}" data-val="${i}">${i} in</div>`).join('');
        inputHTML = `
          <div class="sv-height-wrap">
            <div class="sv-height-col">
              <div class="sv-height-label">Feet</div>
              <div class="sv-height-scroll" id="svFtScroll">
                <div style="height:54px;flex-shrink:0;"></div>
                ${ftList}
                <div style="height:54px;flex-shrink:0;"></div>
                <div class="sv-height-selector-overlay"></div>
                <div class="sv-height-center-line"></div>
              </div>
            </div>
            <div class="sv-height-col">
              <div class="sv-height-label">Inches</div>
              <div class="sv-height-scroll" id="svInScroll">
                <div style="height:54px;flex-shrink:0;"></div>
                ${inList}
                <div style="height:54px;flex-shrink:0;"></div>
                <div class="sv-height-selector-overlay"></div>
                <div class="sv-height-center-line"></div>
              </div>
            </div>
          </div>
          <div class="sv-nav-row">
            <button class="sv-back-btn" id="svBack">← Back</button>
            <button class="sv-next-btn" id="svNext">Continue →</button>
          </div>`;
      }

      if (step.type === 'chips') {
        inputHTML = `
          <div class="sv-chips">
            ${step.options.map(o => `
              <button class="sv-chip${answers[step.field] === o.value ? ' sv-chip--sel' : ''}" data-val="${o.value}">
                <span class="sv-chip-emoji">${o.emoji}</span>
                <span class="sv-chip-label">${o.label}</span>
              </button>`).join('')}
          </div>
          <div class="sv-nav-row">
            <button class="sv-back-btn" id="svBack">← Back</button>
            <button class="sv-next-btn" id="svNext">Continue →</button>
          </div>`;
      }

      if (step.type === 'result') {
        const heightDisplay = `${answers.heightFt}'${answers.heightIn}"`;
        inputHTML = `
          <div class="sv-result-card">
            <div class="sv-result-goal">${goal} <span class="sv-result-unit">ml</span></div>
            <div class="sv-result-label">Your personalised daily hydration goal</div>
            <div class="sv-result-breakdown">
              <div class="sv-result-row"><span>Age</span><strong>${answers.age} yrs</strong></div>
              <div class="sv-result-row"><span>Height</span><strong>${heightDisplay}</strong></div>
              <div class="sv-result-row"><span>Gender</span><strong>${answers.gender || '—'}</strong></div>
              <div class="sv-result-row"><span>Workout</span><strong>${answers.workoutFrequency}</strong></div>
            </div>
          </div>
          <button class="sv-cta-btn" id="svSave">Start tracking 🚀</button>
          <button class="sv-back-btn" style="width:100%;margin-top:4px;" id="svBack">← Edit answers</button>`;
      }

      overlay.innerHTML = `
        <div class="sv-card" id="svCard">
          <div class="sv-progress-wrap"><div class="sv-progress-bar" style="width:${progress}%"></div></div>
          <div class="sv-step-counter">${isFirst ? '' : `${currentStep} of ${steps.length - 2}`}</div>
          ${_animHTML(animKey)}
          <h2 class="sv-title">${step.title.replace(/\n/g, '<br>')}</h2>
          <p class="sv-sub">${step.subtitle}</p>
          ${inputHTML}
        </div>`;

      // Animate card in
      requestAnimationFrame(() => {
        const card = overlay.querySelector('#svCard');
        if (card) { card.style.opacity = '0'; card.style.transform = 'translateY(20px) scale(0.97)'; }
        requestAnimationFrame(() => {
          if (card) { card.style.transition = 'opacity 0.32s ease, transform 0.32s cubic-bezier(0.34,1.2,0.64,1)'; card.style.opacity = '1'; card.style.transform = 'none'; }
          // Mount Lottie after card is visible (lazy — only this step, not all)
          setTimeout(() => _mountAnimAfterRender(animKey, overlay), 80);
        });
      });

      // Age slider live update
      const ageSlider = overlay.querySelector('#svAgeSlider');
      if (ageSlider) {
        ageSlider.addEventListener('input', () => {
          answers.age = parseInt(ageSlider.value);
          const v = overlay.querySelector('#svAgeVal');
          if (v) v.textContent = answers.age;
        });
      }

      // Height scroll snap init
      const ftScroll = overlay.querySelector('#svFtScroll');
      const inScroll = overlay.querySelector('#svInScroll');
      if (ftScroll) {
        // Scroll to selected item
        const selIdx = [4,5,6,7].indexOf(answers.heightFt);
        if (selIdx >= 0) ftScroll.scrollTop = selIdx * 52;
        ftScroll.addEventListener('scroll', () => {
          const idx = Math.round(ftScroll.scrollTop / 52);
          const ft = [4,5,6,7][Math.min(idx, 3)] || 5;
          if (ft !== answers.heightFt) {
            answers.heightFt = ft;
            answers.height = Math.round(ft * 30.48 + answers.heightIn * 2.54);
            ftScroll.querySelectorAll('.sv-height-item').forEach((el, i) => el.classList.toggle('selected', i === idx));
          }
        }, { passive: true });
      }
      if (inScroll) {
        inScroll.scrollTop = answers.heightIn * 52;
        inScroll.addEventListener('scroll', () => {
          const idx = Math.round(inScroll.scrollTop / 52);
          const inches = Math.min(idx, 11);
          if (inches !== answers.heightIn) {
            answers.heightIn = inches;
            answers.height = Math.round(answers.heightFt * 30.48 + inches * 2.54);
            inScroll.querySelectorAll('.sv-height-item').forEach((el, i) => el.classList.toggle('selected', i === idx));
          }
        }, { passive: true });
      }

      // Chip handlers — auto-advance
      overlay.querySelectorAll('.sv-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          answers[step.field] = btn.dataset.val;
          overlay.querySelectorAll('.sv-chip').forEach(b => b.classList.remove('sv-chip--sel'));
          btn.classList.add('sv-chip--sel');
          setTimeout(() => goNext(), 320);
        });
      });

      overlay.querySelector('#svNext')?.addEventListener('click', goNext);
      overlay.querySelector('#svBack')?.addEventListener('click', () => { currentStep = Math.max(0, currentStep - 1); render(); });
      overlay.querySelector('#svSkip')?.addEventListener('click', async () => {
        localStorage.setItem(SURVEY_KEY, 'true'); LocalStorage.setGoal(3000); overlay.remove(); if (onComplete) onComplete(3000);
      });
      overlay.querySelector('#svSave')?.addEventListener('click', async () => {
        const data = { age: answers.age, height: answers.height, gender: answers.gender, workoutFrequency: answers.workoutFrequency, workoutIntensity: answers.workoutIntensity, workoutToday: false, surveyData: { ...answers } };
        const finalGoal = calcGoal(data);
        localStorage.setItem(SURVEY_KEY, 'true'); localStorage.setItem(SURVEY_DATA, JSON.stringify(data)); LocalStorage.setGoal(finalGoal);
        if (uid) await saveToFirestore(uid, finalGoal, data).catch(() => {});
        if (window.UserData) await UserData.saveProfile(data).catch(() => {});
        overlay.remove(); if (onComplete) onComplete(finalGoal);
      });
    };

    const goNext = () => {
      if (currentStep < steps.length - 1) { currentStep++; render(); }
    };

    document.body.appendChild(overlay);
    render();
  }

  return { show, isDone, isDoneLocally, checkAfterLogin, calcGoal, saveToFirestore };
})();
