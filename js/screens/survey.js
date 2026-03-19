/* ══════════════════════════════════════════
   SCREEN: Survey — pre-login onboarding
   Calculates personalised hydration goal
   Persists to Firestore so survey never
   repeats across devices or after clearing cache
   ══════════════════════════════════════════ */

const SurveyScreen = (() => {

  const SURVEY_KEY  = 'wt_survey_done';
  const SURVEY_DATA = 'wt_survey_data';

  /* ── Check local flag (fast path) ── */
  const isDoneLocally = () => localStorage.getItem(SURVEY_KEY) === 'true';

  /* ── Check Firestore profile (cross-device) ── */
  const checkFirestore = async (uid) => {
    if (!uid || !window.firebase || !firebase.apps?.length) return false;
    try {
      const doc = await firebase.firestore()
        .collection('users').doc(uid).get();
      if (doc.exists && doc.data()?.surveyDone === true) {
        // Mark locally so future checks are instant
        localStorage.setItem(SURVEY_KEY, 'true');
        const savedGoal = doc.data()?.goal;
        if (savedGoal) LocalStorage.setGoal(savedGoal);
        return true;
      }
      return false;
    } catch(e) {
      console.warn('[Survey] Firestore check failed:', e.message);
      return false;
    }
  };

  /* ── Save result to Firestore ── */
  const saveToFirestore = async (uid, goal, data) => {
    if (!uid || !window.firebase || !firebase.apps?.length) return;
    try {
      await firebase.firestore()
        .collection('users').doc(uid).set({
          surveyDone:   true,
          goal,
          surveyData:   data,
          surveyCompletedAt: firebase.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      console.log('[Survey] Saved to Firestore for uid:', uid);
    } catch(e) {
      console.warn('[Survey] Firestore save failed:', e.message);
    }
  };

  /* ── isDone: local check only (used before login) ── */
  const isDone = () => isDoneLocally();

  /* ── Check after login: Firestore takes priority ── */
  const checkAfterLogin = async (uid) => {
    if (isDoneLocally()) return true;
    return await checkFirestore(uid);
  };

  /* ── Calculate recommended goal in ml ── */
  const calcGoal = (data) => {
    let base = (data.weight || 70) * 35;
    const actMap     = { sedentary:1.0, light:1.1, moderate:1.2, active:1.35, very_active:1.5 };
    const climateMap = { cold:0.9, temperate:1.0, warm:1.15, hot:1.3, very_hot:1.5 };
    base *= (actMap[data.activity]     || 1.0);
    base *= (climateMap[data.climate]  || 1.0);
    if (data.conditions?.includes('kidney'))   base *= 1.1;
    if (data.conditions?.includes('pregnant')) base *= 1.15;
    if (data.conditions?.includes('athlete'))  base *= 1.25;
    return Math.round(Math.min(Math.max(base, 1500), 6000) / 100) * 100;
  };

  /* ── Show survey overlay ── */
  const show = (onComplete, uid = null) => {
    // Remove any existing survey overlay first
    const existing = document.getElementById('surveyOverlay');
    if (existing) existing.remove();

    // Inject survey entry animation keyframe + spin
    if (!document.getElementById('surveyAnimStyle')) {
      const style = document.createElement('style');
      style.id = 'surveyAnimStyle';
      style.textContent = `
        @keyframes surveyCardIn {
          0%   { opacity:0.3; transform:scale(0.92) translateY(20px); }
          60%  { opacity:1; transform:scale(1.02) translateY(-3px); }
          100% { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes spin {
          to { transform:rotate(360deg); }
        }
        @keyframes surveyBubble {
          0%,100% { transform:translateY(0) scale(1); opacity:0.7; }
          50%      { transform:translateY(-30px) scale(1.1); opacity:0.3; }
        }
        @keyframes svSlideIn  { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes svSlideOut { from{opacity:1;transform:translateX(0)} to{opacity:0;transform:translateX(-24px)} }
        .survey-card { animation: surveyCardIn 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
      `;
      document.head.appendChild(style);
    }

    const isDarkMode = document.body.classList.contains('dark-mode');
    const overlay = document.createElement('div');
    overlay.id = 'surveyOverlay';
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:10000',
      isDarkMode
        ? 'background:linear-gradient(135deg,#0D1B2A,#1A2C4E 50%,#111318)'
        : 'background:linear-gradient(135deg,#E8F5E9,#E3F2FD 50%,#EDE7F6)',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'padding:16px',
      'box-sizing:border-box',
    ].join(';') + ';';

    try {
      overlay.innerHTML = buildSurveyHTML();
    } catch(e) {
      console.error('[Survey] buildSurveyHTML failed:', e);
      overlay.innerHTML = '<div style="color:#fff;padding:20px;font-size:16px;">Loading survey...</div>';
    }

    document.body.appendChild(overlay);
    bindSurveyEvents(overlay, onComplete, uid);
  };

  /* ── Build survey HTML ── */
  const buildSurveyHTML = () => `
    <div class="survey-card" style="
      background:var(--md-surface,#fff);
      border-radius:28px;
      width:100%;max-width:420px;
      padding:0;overflow:hidden;
      box-shadow:0 20px 60px rgba(0,0,0,0.4);
      max-height:92vh;overflow-y:auto;
    ">
      <!-- Water caricature header -->
      <div class="survey-hero" style="
        background:linear-gradient(135deg,#1A73E8,#0D47A1);
        padding:28px 24px 20px;text-align:center;position:relative;overflow:hidden;
      ">
        <div style="position:absolute;bottom:-10px;left:15%;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.12);animation:surveyBubble 3s ease-in-out infinite;"></div>
        <div style="position:absolute;bottom:-10px;left:45%;width:25px;height:25px;border-radius:50%;background:rgba(255,255,255,0.1);animation:surveyBubble 3.5s ease-in-out infinite 0.5s;"></div>
        <div style="position:absolute;bottom:-10px;right:20%;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.08);animation:surveyBubble 2.8s ease-in-out infinite 1s;"></div>

        <svg width="80" height="80" viewBox="0 0 80 80" style="display:block;margin:0 auto 12px;">
          <path d="M40 8 C40 8, 62 32, 62 48 C62 62, 52 72, 40 72 C28 72, 18 62, 18 48 C18 32, 40 8, 40 8Z" fill="rgba(255,255,255,0.9)"/>
          <path d="M28 30 C28 30, 26 40, 30 44" stroke="rgba(255,255,255,0.6)" stroke-width="3" fill="none" stroke-linecap="round"/>
          <circle cx="33" cy="46" r="4" fill="#1A73E8"/>
          <circle cx="47" cy="46" r="4" fill="#1A73E8"/>
          <circle cx="34.5" cy="44.5" r="1.5" fill="#fff"/>
          <circle cx="48.5" cy="44.5" r="1.5" fill="#fff"/>
          <path d="M33 56 Q40 62 47 56" stroke="#1A73E8" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <circle cx="28" cy="54" r="4" fill="#FF8A80" opacity="0.5"/>
          <circle cx="52" cy="54" r="4" fill="#FF8A80" opacity="0.5"/>
        </svg>
        <div style="color:#fff;font-size:20px;font-weight:700;font-family:var(--font-display);">Hi there! 👋</div>
        <div style="color:rgba(255,255,255,0.85);font-size:13px;margin-top:4px;">Let me personalise your hydration goal</div>
        <div id="surveyDots" style="display:flex;gap:6px;justify-content:center;margin-top:14px;">
          ${[0,1,2,3,4].map(i => `<div class="sv-dot" data-step="${i}" style="width:8px;height:8px;border-radius:50%;background:${i===0?'#fff':'rgba(255,255,255,0.35)'};transition:all 0.3s;${i===0?'transform:scale(1.3);':''}"></div>`).join('')}
        </div>
      </div>

      <div id="surveySteps" style="padding:24px 24px 8px;">
        ${buildStep(0)}
      </div>

      <div style="display:flex;gap:10px;padding:16px 24px 24px;">
        <button id="svBack" style="
          flex:1;padding:13px;border-radius:14px;
          border:1.5px solid var(--md-outline,#DADCE0);
          background:var(--md-surface-2,#F1F3F4);
          font-size:14px;font-weight:600;cursor:pointer;
          font-family:var(--font-body);
          color:var(--md-on-surface-med,#5F6368);display:none;
          transition:all 0.2s cubic-bezier(0.22,1,0.36,1);
        ">← Back</button>
        <button id="svNext" style="
          flex:2;padding:13px;border-radius:14px;border:none;
          background:#1A73E8;color:#fff;font-size:15px;font-weight:700;
          cursor:pointer;font-family:var(--font-body);
          box-shadow:0 4px 14px rgba(26,115,232,0.35);
          transition:all 0.2s cubic-bezier(0.22,1,0.36,1);
        ">Next →</button>
      </div>

      <div style="text-align:center;padding-bottom:20px;">
        <button id="svSkip" style="background:none;border:none;color:#9AA0A6;font-size:12px;cursor:pointer;font-family:var(--font-body);">
          Skip — use default goal (3000ml)
        </button>
      </div>
    </div>

    <style>
      /* Keyframes injected globally by show() — see surveyAnimStyle */
      .sv-opt {
        display:flex;align-items:center;gap:12px;padding:13px 16px;
        border-radius:14px;
        border:2px solid var(--md-outline,#E8EAED);
        background:var(--md-surface-2,#F8F9FA);
        cursor:pointer;transition:all 0.18s cubic-bezier(0.34,1.56,0.64,1);
        font-family:var(--font-body);width:100%;text-align:left;margin-bottom:8px;
      }
      .sv-opt:hover  { border-color:#1A73E8;background:rgba(26,115,232,0.08);transform:translateX(4px); }
      .sv-opt.selected { border-color:#1A73E8;background:rgba(26,115,232,0.1);box-shadow:0 0 0 3px rgba(26,115,232,0.15); }
      .sv-opt .sv-opt-emoji { font-size:22px;flex-shrink:0; }
      .sv-opt .sv-opt-label { font-size:14px;font-weight:600;color:var(--md-on-background,#202124); }
      .sv-opt .sv-opt-sub   { font-size:12px;color:var(--md-on-surface-med,#5F6368);margin-top:1px; }
      .sv-number-input {
        width:100%;padding:14px 16px;
        border:2px solid var(--md-outline,#DADCE0);border-radius:14px;
        font-size:18px;font-weight:700;font-family:var(--font-display);
        color:var(--md-on-background,#202124);
        background:var(--md-surface-2,#F8F9FA);
        outline:none;text-align:center;transition:border-color 0.18s;
        box-sizing:border-box;
      }
      .sv-number-input:focus { border-color:#1A73E8;box-shadow:0 0 0 3px rgba(26,115,232,0.12); }
      .sv-step { animation:svSlideIn 0.3s cubic-bezier(0.22,1,0.36,1); }
      .sv-step-title {
        font-size:18px;font-weight:700;
        color:var(--md-on-background,#202124);
        margin-bottom:6px;font-family:var(--font-display);
      }
      .sv-step-sub   { font-size:13px;color:var(--md-on-surface-med,#5F6368);margin-bottom:18px;line-height:1.5; }
      .sv-result-goal { font-size:52px;font-weight:700;color:#1A73E8;font-family:var(--font-display);text-align:center;margin:16px 0 4px; }
    </style>
  `;

  const STEPS = [
    { id:'weight',     q:"What\'s your weight?",              sub:"Used to calculate your baseline hydration needs." },
    { id:'activity',   q:"How active are you?",               sub:"Physical activity increases water requirements." },
    { id:'climate',    q:"What\'s your local climate like?", sub:"Heat and humidity mean you need more water." },
    { id:'conditions', q:"Any special considerations?",       sub:"Select all that apply — or tap Next to skip." },
    { id:'result',     q:"Your personalised goal is ready!",  sub:"Based on your profile, here\'s what we recommend." },
  ];

  const buildStep = (step, data = {}) => {
    const s = STEPS[step];
    if (step === 0) return `
      <div class="sv-step">
        <div class="sv-step-title">⚖️ ${s.q}</div>
        <div class="sv-step-sub">${s.sub}</div>
        <input class="sv-number-input" id="svWeight" type="number" min="30" max="250" placeholder="e.g. 70" value="${data.weight||''}" />
        <div style="text-align:center;font-size:12px;color:#9AA0A6;margin-top:6px;">kilograms (kg)</div>
      </div>`;
    if (step === 1) return `
      <div class="sv-step">
        <div class="sv-step-title">🏃 ${s.q}</div>
        <div class="sv-step-sub">${s.sub}</div>
        ${[['sedentary','🪑','Sedentary','Desk job, little movement'],['light','🚶','Lightly active','Light walks, 1-2x/week exercise'],['moderate','🚴','Moderately active','3-4x/week exercise'],['active','🏋️','Active','5+ workouts per week'],['very_active','🔥','Very active','Athlete / physical job']].map(([val,em,label,sub]) => `
          <button class="sv-opt ${data.activity===val?'selected':''}" data-val="${val}" data-group="activity">
            <span class="sv-opt-emoji">${em}</span>
            <div><div class="sv-opt-label">${label}</div><div class="sv-opt-sub">${sub}</div></div>
          </button>`).join('')}
      </div>`;
    if (step === 2) return `
      <div class="sv-step">
        <div class="sv-step-title">🌍 ${s.q}</div>
        <div class="sv-step-sub">${s.sub}</div>
        ${[['cold','❄️','Cold','Below 10°C regularly'],['temperate','🌤️','Temperate','10°C – 25°C, mild'],['warm','☀️','Warm','25°C – 32°C summers'],['hot','🌶️','Hot','Regularly above 32°C'],['very_hot','🔥','Very hot','Desert / tropical climate']].map(([val,em,label,sub]) => `
          <button class="sv-opt ${data.climate===val?'selected':''}" data-val="${val}" data-group="climate">
            <span class="sv-opt-emoji">${em}</span>
            <div><div class="sv-opt-label">${label}</div><div class="sv-opt-sub">${sub}</div></div>
          </button>`).join('')}
      </div>`;
    if (step === 3) return `
      <div class="sv-step">
        <div class="sv-step-title">💊 ${s.q}</div>
        <div class="sv-step-sub">${s.sub}</div>
        ${[['athlete','🏆','Competitive athlete','Training 6+ days/week'],['pregnant','🤰','Pregnant / nursing','Increased fluid needs'],['kidney','🫘','Kidney health','Doctor recommends extra fluid'],['diabetes','💉','Diabetes','Blood sugar management'],['none','✅','None of the above','Standard recommendations apply']].map(([val,em,label,sub]) => `
          <button class="sv-opt multi ${(data.conditions||[]).includes(val)?'selected':''}" data-val="${val}" data-group="conditions">
            <span class="sv-opt-emoji">${em}</span>
            <div><div class="sv-opt-label">${label}</div><div class="sv-opt-sub">${sub}</div></div>
          </button>`).join('')}
      </div>`;
    if (step === 4) {
      const goal = calcGoal(data);
      return `
        <div class="sv-step" style="text-align:center;">
          <div class="sv-step-title" style="text-align:center;">🎯 ${s.q}</div>
          <div class="sv-step-sub" style="text-align:center;">${s.sub}</div>
          <div class="sv-result-goal">${goal.toLocaleString()}<span style="font-size:22px;font-weight:500;color:#5F6368;"> ml</span></div>
          <div style="font-size:13px;color:#5F6368;margin-bottom:20px;">per day</div>
          <div style="background:#F1F3F4;border-radius:16px;padding:14px 16px;text-align:left;margin-bottom:16px;">
            <div style="font-size:12px;font-weight:700;color:#5F6368;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Your profile</div>
            ${data.weight?`<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span>Weight</span><span style="font-weight:600;">${data.weight} kg</span></div>`:''}
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span>Activity</span><span style="font-weight:600;text-transform:capitalize;">${(data.activity||'standard').replace('_',' ')}</span></div>
            <div style="display:flex;justify-content:space-between;font-size:13px;"><span>Climate</span><span style="font-weight:600;text-transform:capitalize;">${data.climate||'temperate'}</span></div>
          </div>
          <div style="font-size:12px;color:#9AA0A6;line-height:1.5;">You can adjust this anytime in Settings. We check the weather daily for temporary adjustments.</div>
        </div>
        <input type="hidden" id="svGoalResult" value="${goal}">`;
    }
    return '';
  };

  /* ── Bind events ── */
  const bindSurveyEvents = (overlay, onComplete, uid) => {
    let step = 0;
    const data = {};

    const setStep = (newStep) => {
      const container = overlay.querySelector('#surveySteps');
      const current   = container.querySelector('.sv-step');
      if (current) current.style.animation = 'svSlideOut 0.18s ease both';
      setTimeout(() => {
        step = newStep;
        container.innerHTML = buildStep(step, data);
        overlay.querySelectorAll('.sv-dot').forEach((dot, i) => {
          dot.style.background  = i === step ? '#fff' : 'rgba(255,255,255,0.35)';
          dot.style.transform   = i === step ? 'scale(1.3)' : 'scale(1)';
        });
        const backBtn = overlay.querySelector('#svBack');
        if (backBtn) backBtn.style.display = step > 0 ? 'block' : 'none';
        const nextBtn = overlay.querySelector('#svNext');
        if (nextBtn) nextBtn.textContent = step === STEPS.length - 1 ? "Let\'s Go! 🚀" : 'Next →';
        bindOptions();
      }, 180);
    };

    const bindOptions = () => {
      overlay.querySelectorAll('.sv-opt').forEach(btn => {
        btn.addEventListener('click', () => {
          const group   = btn.dataset.group;
          const val     = btn.dataset.val;
          const isMulti = btn.classList.contains('multi');
          if (isMulti) {
            if (!data.conditions) data.conditions = [];
            if (val === 'none') {
              data.conditions = ['none'];
              overlay.querySelectorAll('.sv-opt.multi').forEach(b => b.classList.toggle('selected', b.dataset.val === 'none'));
            } else {
              data.conditions = data.conditions.filter(c => c !== 'none');
              if (data.conditions.includes(val)) {
                data.conditions = data.conditions.filter(c => c !== val);
                btn.classList.remove('selected');
              } else {
                data.conditions.push(val);
                btn.classList.add('selected');
              }
              overlay.querySelectorAll('.sv-opt.multi[data-val="none"]').forEach(b => b.classList.remove('selected'));
            }
          } else {
            data[group] = val;
            overlay.querySelectorAll(`.sv-opt[data-group="${group}"]`).forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
          }
        });
      });
    };

    bindOptions();

    const complete = async (goal, skipSave = false) => {
      // Mark locally
      localStorage.setItem(SURVEY_KEY, 'true');
      if (!skipSave) localStorage.setItem(SURVEY_DATA, JSON.stringify(data));
      LocalStorage.setGoal(goal);
      // Save to Firestore so it never shows again on any device
      if (uid) await saveToFirestore(uid, goal, skipSave ? {} : data);
      // Animate out
      const card = overlay.querySelector('.survey-card');
      if (card) {
        card.style.transition = 'all 0.35s cubic-bezier(0.55,0,1,0.45)';
        card.style.transform  = 'scale(0.9)';
        card.style.opacity    = '0';
      }
      setTimeout(() => { overlay.remove(); if (onComplete) onComplete(goal); }, 350);
    };

    overlay.querySelector('#svNext').addEventListener('click', async () => {
      if (step === 0) {
        const w = overlay.querySelector('#svWeight')?.value;
        if (w) data.weight = parseFloat(w);
      }
      if (step === STEPS.length - 1) {
        const goal = parseInt(overlay.querySelector('#svGoalResult')?.value || 3000);
        const btn  = overlay.querySelector('#svNext');
        btn.textContent = '⏳ Saving…'; btn.disabled = true;
        await complete(goal, false);
        return;
      }
      setStep(step + 1);
    });

    overlay.querySelector('#svBack')?.addEventListener('click', () => {
      if (step > 0) setStep(step - 1);
    });

    overlay.querySelector('#svSkip')?.addEventListener('click', async () => {
      await complete(3000, true);
    });
  };

  return { show, isDone, isDoneLocally, checkAfterLogin, calcGoal, saveToFirestore };
})();
