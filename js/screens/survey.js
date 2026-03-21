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

  function show(onComplete, uid = null) {
    const existing = document.getElementById('surveyOverlay');
    if (existing) existing.remove();

    // Survey state
    const answers = { age: null, height: null, gender: '', workoutFrequency: 'moderate', workoutIntensity: 'light' };
    let currentStep = 0;

    const steps = [
      {
        emoji: '💧',
        caricature: '🧍',
        title: "Let's personalise\nyour hydration",
        subtitle: 'A quick 30-second setup to calculate your perfect daily water intake.',
        type: 'welcome',
      },
      {
        emoji: '🎂',
        caricature: '🧒',
        title: 'How old are you?',
        subtitle: 'Age affects how much water your body needs.',
        type: 'number',
        field: 'age',
        placeholder: 'e.g. 24',
        min: 8, max: 100,
        unit: 'years',
      },
      {
        emoji: '📏',
        caricature: '🧍',
        title: "What's your height?",
        subtitle: "We'll use this to estimate your body mass.",
        type: 'number',
        field: 'height',
        placeholder: 'e.g. 172',
        min: 90, max: 250,
        unit: 'cm',
      },
      {
        emoji: '⚧️',
        caricature: '🧑',
        title: 'How do you identify?',
        subtitle: 'Biological differences affect hydration needs.',
        type: 'chips',
        field: 'gender',
        options: [
          { value: 'male',       label: 'Male',       emoji: '👨' },
          { value: 'female',     label: 'Female',     emoji: '👩' },
          { value: 'non-binary', label: 'Non-binary', emoji: '🧑' },
          { value: 'other',      label: 'Prefer not to say', emoji: '💙' },
        ],
      },
      {
        emoji: '🏃',
        caricature: '🏋️',
        title: 'How often do you work out?',
        subtitle: 'Exercise significantly increases your water needs.',
        type: 'chips',
        field: 'workoutFrequency',
        options: [
          { value: 'rare',     label: 'Rarely',       emoji: '🛋️' },
          { value: 'light',    label: '1–2×/week',    emoji: '🚶' },
          { value: 'moderate', label: '3–4×/week',    emoji: '🏃' },
          { value: 'frequent', label: '5–6×/week',    emoji: '💪' },
          { value: 'daily',    label: 'Every day',    emoji: '🏅' },
        ],
      },
      {
        emoji: '⚡',
        caricature: '🔥',
        title: 'How intense are your workouts?',
        subtitle: 'Harder workouts = more sweat = more water needed.',
        type: 'chips',
        field: 'workoutIntensity',
        options: [
          { value: 'none',    label: 'Very light',  emoji: '🧘' },
          { value: 'light',   label: 'Light',       emoji: '🚴' },
          { value: 'moderate',label: 'Moderate',    emoji: '🏊' },
          { value: 'intense', label: 'Intense',     emoji: '🏋️' },
          { value: 'athlete', label: 'Athlete',     emoji: '🥇' },
        ],
      },
      {
        emoji: '🎯',
        caricature: '✨',
        title: 'Your personalised goal',
        subtitle: "Based on your answers, here's your smart daily water intake.",
        type: 'result',
      },
    ];

    const overlay = document.createElement('div');
    overlay.id = 'surveyOverlay';

    const render = () => {
      const step = steps[currentStep];
      const isLast = currentStep === steps.length - 1;
      const isFirst = currentStep === 0;
      const goal = calcGoal({ ...answers, workoutToday: false });
      const progress = Math.round((currentStep / (steps.length - 1)) * 100);

      overlay.innerHTML = `
        <div class="sv-card" id="svCard">
          <!-- Progress bar -->
          <div class="sv-progress-wrap">
            <div class="sv-progress-bar" style="width:${progress}%"></div>
          </div>

          <!-- Step counter -->
          <div class="sv-step-counter">${isFirst ? '' : `${currentStep} of ${steps.length - 2}`}</div>

          <!-- Caricature -->
          <div class="sv-caricature">${step.caricature}</div>

          <!-- Content -->
          <div class="sv-content">
            <div class="sv-emoji">${step.emoji}</div>
            <h2 class="sv-title">${step.title.replace(/\n/g, '<br>')}</h2>
            <p class="sv-sub">${step.subtitle}</p>

            ${step.type === 'welcome' ? `
              <button class="sv-cta-btn" id="svNext">
                Let's go 💧
              </button>
              <button class="sv-skip" id="svSkip">Skip for now →</button>
            ` : ''}

            ${step.type === 'number' ? `
              <div class="sv-number-wrap">
                <input class="sv-number-input" id="svNumberInput"
                  type="number" inputmode="numeric"
                  min="${step.min}" max="${step.max}"
                  placeholder="${step.placeholder}"
                  value="${answers[step.field] || ''}" />
                <span class="sv-number-unit">${step.unit}</span>
              </div>
              <div class="sv-nav-row">
                <button class="sv-back-btn" id="svBack">← Back</button>
                <button class="sv-next-btn" id="svNext">Continue →</button>
              </div>
            ` : ''}

            ${step.type === 'chips' ? `
              <div class="sv-chips">
                ${step.options.map(o => `
                  <button class="sv-chip${answers[step.field] === o.value ? ' sv-chip--sel' : ''}"
                    data-val="${o.value}">
                    <span class="sv-chip-emoji">${o.emoji}</span>
                    <span class="sv-chip-label">${o.label}</span>
                  </button>
                `).join('')}
              </div>
              <div class="sv-nav-row">
                <button class="sv-back-btn" id="svBack">← Back</button>
                <button class="sv-next-btn" id="svNext">Continue →</button>
              </div>
            ` : ''}

            ${step.type === 'result' ? `
              <div class="sv-result-card">
                <div class="sv-result-goal">${goal} <span class="sv-result-unit">ml/day</span></div>
                <div class="sv-result-label">Your personalised hydration goal</div>
                <div class="sv-result-breakdown">
                  <div class="sv-result-row"><span>Age</span><strong>${answers.age || '—'} yrs</strong></div>
                  <div class="sv-result-row"><span>Height</span><strong>${answers.height || '—'} cm</strong></div>
                  <div class="sv-result-row"><span>Gender</span><strong>${answers.gender || '—'}</strong></div>
                  <div class="sv-result-row"><span>Workout</span><strong>${answers.workoutFrequency}</strong></div>
                </div>
              </div>
              <button class="sv-cta-btn" id="svSave">
                Start tracking 🚀
              </button>
              <button class="sv-back-btn" style="margin-top:8px" id="svBack">← Edit answers</button>
            ` : ''}
          </div>
        </div>
      `;

      // Animate in
      requestAnimationFrame(() => {
        const card = overlay.querySelector('#svCard');
        if (card) { card.style.opacity = '0'; card.style.transform = 'translateY(24px) scale(0.97)'; }
        requestAnimationFrame(() => {
          if (card) { card.style.transition = 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.34,1.2,0.64,1)'; card.style.opacity = '1'; card.style.transform = 'none'; }
        });
      });

      // Focus number input
      if (step.type === 'number') {
        setTimeout(() => overlay.querySelector('#svNumberInput')?.focus(), 400);
      }

      // Chip click handlers — select and auto-advance after brief delay
      overlay.querySelectorAll('.sv-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          answers[step.field] = btn.dataset.val;
          overlay.querySelectorAll('.sv-chip').forEach(b => b.classList.remove('sv-chip--sel'));
          btn.classList.add('sv-chip--sel');
          // Auto-advance after 350ms so user sees selection
          setTimeout(() => goNext(), 350);
        });
      });

      // Next button
      overlay.querySelector('#svNext')?.addEventListener('click', goNext);

      // Back button
      overlay.querySelector('#svBack')?.addEventListener('click', () => {
        currentStep = Math.max(0, currentStep - 1);
        render();
      });

      // Skip
      overlay.querySelector('#svSkip')?.addEventListener('click', async () => {
        localStorage.setItem(SURVEY_KEY, 'true');
        LocalStorage.setGoal(3000);
        overlay.remove();
        if (onComplete) onComplete(3000);
      });

      // Save
      overlay.querySelector('#svSave')?.addEventListener('click', async () => {
        const data = { ...answers, workoutToday: false, surveyData: { ...answers } };
        const finalGoal = calcGoal(data);
        localStorage.setItem(SURVEY_KEY, 'true');
        localStorage.setItem(SURVEY_DATA, JSON.stringify(data));
        LocalStorage.setGoal(finalGoal);
        if (uid) await saveToFirestore(uid, finalGoal, data).catch(() => {});
        if (window.UserData) await UserData.saveProfile(data).catch(() => {});
        overlay.remove();
        if (onComplete) onComplete(finalGoal);
      });

      // Enter key on number inputs
      overlay.querySelector('#svNumberInput')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') goNext();
      });
    };

    const goNext = () => {
      const step = steps[currentStep];

      // Validate number input
      if (step.type === 'number') {
        const val = Number(overlay.querySelector('#svNumberInput')?.value);
        if (!val || val < step.min || val > step.max) {
          const input = overlay.querySelector('#svNumberInput');
          if (input) { input.style.borderColor = '#ef4444'; input.focus(); }
          setTimeout(() => { const i = overlay.querySelector('#svNumberInput'); if (i) i.style.borderColor = ''; }, 1200);
          return;
        }
        answers[step.field] = val;
      }

      if (currentStep < steps.length - 1) {
        currentStep++;
        render();
      }
    };

    document.body.appendChild(overlay);
    render();
  }

  return { show, isDone, isDoneLocally, checkAfterLogin, calcGoal, saveToFirestore };
})();
