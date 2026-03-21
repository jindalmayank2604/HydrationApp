const SurveyScreen = (() => {
  const SURVEY_KEY = 'wt_survey_done';
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
    } catch (e) {
      console.warn('[Survey] Firestore check failed:', e.message);
      return false;
    }
  }

  const checkAfterLogin = async (uid) => {
    if (isDoneLocally()) return true;
    return checkFirestore(uid);
  };

  const calcGoal = (data) => UserData.calculateHydrationGoal(data);

  async function saveToFirestore(uid, goal, data) {
    if (!uid || !window.firebase || !firebase.apps?.length) return;
    await firebase.firestore().collection('users').doc(uid).set({
      surveyDone: true,
      hydrationGoal: goal,
      goal,
      surveyData: data,
      profileMeta: data,
      surveyCompletedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  function show(onComplete, uid = null) {
    const existing = document.getElementById('surveyOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'surveyOverlay';
    overlay.innerHTML = `
      <div class="survey-modern">
        <div class="survey-modern__hero">
          <div class="survey-modern__badge">Personalized hydration</div>
          <h2>Build your goal around your body and workout routine</h2>
          <p>We use age, height, gender, workout frequency, and workout intensity to set a smarter daily hydration target.</p>
        </div>
        <div class="survey-modern__form">
          <label>
            <span class="md-input-label">Age</span>
            <input id="surveyAge" class="md-input" type="number" min="8" max="100" placeholder="e.g. 24" />
          </label>
          <label>
            <span class="md-input-label">Height (cm)</span>
            <input id="surveyHeight" class="md-input" type="number" min="90" max="250" placeholder="e.g. 172" />
          </label>
          <label>
            <span class="md-input-label">Gender</span>
            <select id="surveyGender" class="md-input">
              <option value="">Select one</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non-binary">Non-binary</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            <span class="md-input-label">Workout frequency</span>
            <select id="surveyFrequency" class="md-input">
              <option value="rare">Rarely</option>
              <option value="light">1-2 days/week</option>
              <option value="moderate" selected>3-4 days/week</option>
              <option value="frequent">5-6 days/week</option>
              <option value="daily">Daily</option>
            </select>
          </label>
          <label>
            <span class="md-input-label">Workout intensity</span>
            <select id="surveyIntensity" class="md-input">
              <option value="none">Minimal</option>
              <option value="light" selected>Light</option>
              <option value="moderate">Moderate</option>
              <option value="intense">Intense</option>
              <option value="athlete">Athlete</option>
            </select>
          </label>
          <label class="settings-toggle-card">
            <div>
              <div class="switch-title">Workout day today?</div>
              <div class="switch-sub">Turn this on to apply the daily workout boost immediately.</div>
            </div>
            <input id="surveyWorkoutToday" type="checkbox" />
          </label>
          <div class="survey-modern__result" id="surveyResult">Recommended goal: 3000 ml/day</div>
          <div class="survey-modern__actions">
            <button id="surveySkip" class="md-btn">Skip</button>
            <button id="surveySave" class="md-btn md-btn--filled">Save & Continue</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const fields = ['surveyAge', 'surveyHeight', 'surveyGender', 'surveyFrequency', 'surveyIntensity', 'surveyWorkoutToday'];
    const getData = () => ({
      age: Number(Utils.el('surveyAge')?.value) || null,
      height: Number(Utils.el('surveyHeight')?.value) || null,
      gender: Utils.el('surveyGender')?.value || '',
      workoutFrequency: Utils.el('surveyFrequency')?.value || 'moderate',
      workoutIntensity: Utils.el('surveyIntensity')?.value || 'light',
      workoutToday: !!Utils.el('surveyWorkoutToday')?.checked,
      surveyData: {
        age: Number(Utils.el('surveyAge')?.value) || null,
        height: Number(Utils.el('surveyHeight')?.value) || null,
        gender: Utils.el('surveyGender')?.value || '',
      },
    });

    const renderGoal = () => {
      const goal = calcGoal(getData());
      const resultEl = Utils.el('surveyResult');
      if (resultEl) resultEl.textContent = `Recommended goal: ${goal} ml/day`;
    };

    fields.forEach((id) => Utils.el(id)?.addEventListener(id === 'surveyWorkoutToday' ? 'change' : 'input', renderGoal));
    renderGoal();

    Utils.el('surveySkip')?.addEventListener('click', async () => {
      localStorage.setItem(SURVEY_KEY, 'true');
      if (uid) await saveToFirestore(uid, 3000, {});
      LocalStorage.setGoal(3000);
      overlay.remove();
      if (onComplete) onComplete(3000);
    });

    Utils.el('surveySave')?.addEventListener('click', async () => {
      const data = getData();
      const goal = calcGoal(data);
      localStorage.setItem(SURVEY_KEY, 'true');
      localStorage.setItem(SURVEY_DATA, JSON.stringify(data));
      LocalStorage.setGoal(goal);
      if (uid) await saveToFirestore(uid, goal, data);
      if (window.UserData) await UserData.saveProfile(data);
      overlay.remove();
      if (onComplete) onComplete(goal);
    });
  }

  return { show, isDone, isDoneLocally, checkAfterLogin, calcGoal, saveToFirestore };
})();
