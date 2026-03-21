const SettingsScreen = (() => {
  function render() {
    renderForRole();
  }

  function renderForRole() {
    const root = Utils.el('settings-root');
    if (!root) return;
    const session = Auth.getSession() || {};
    const state = window.UserData ? UserData.getState() : { userProfile: {}, hydrationGoal: Storage.getGoal(), familyMembers: [] };
    const profile = {
      username: session.displayName || state.userProfile.username || session.email?.split('@')[0] || 'User',
      photoURL: session.photoURL || state.userProfile.photoURL || null,
      age: state.userProfile.age || '',
      dob: state.userProfile.dob || '',
      height: state.userProfile.height || '',
      gender: state.userProfile.gender || '',
      workoutFrequency: state.userProfile.workoutFrequency || 'moderate',
      workoutIntensity: state.userProfile.workoutIntensity || 'light',
      workoutToday: !!state.userProfile.workoutToday,
    };
    const usage = window.UserData ? UserData.canUseFreeDrink() : { limit: null, used: 0, remaining: 0 };
    const role = window.Utils?.getRole ? Utils.getRole() : (Auth.getSession()?.role || 'user').toLowerCase().trim();
    const _settingsEmail = (Auth.getSession()?.email || '').toLowerCase().trim();
    const _isMaggie = _settingsEmail.startsWith('sampadagupta') && _settingsEmail.endsWith('@gmail.com');
    const isAdmin = role === 'admin';
    const isPro   = _isMaggie || ['pro','admin','maggie'].includes(role) || window.Utils?.isPrivileged?.();

    root.innerHTML = `
      <div class="screen-stack settings-stack">
        <section class="settings-shell">
          <div class="settings-shell__header">
            <div>
              <div class="achievement-pill achievement-pill--shop">Settings</div>
              <h2 class="settings-shell__title">Your hydration profile</h2>
              <p class="settings-shell__sub">Clean, structured controls for profile, account details, preferences, and workout-driven hydration targets.</p>
            </div>
            <button id="openEditProfile" class="settings-edit-trigger">Edit Profile</button>
          </div>

          <div class="settings-grid">
            <section class="tile settings-card settings-card--profile">
              <div class="settings-card__head">
                <div>
                  <div class="settings-section-eyebrow">Profile</div>
                  <div class="settings-section-title">Identity & hydration basics</div>
                </div>
              </div>
              <div class="settings-profile-summary">
                <div class="settings-profile-summary__avatar">
                  ${window.Profile ? Profile.avatarHTML(profile.photoURL, profile.username, 84) : ''}
                </div>
                <div class="settings-profile-summary__info">
                  <div class="settings-profile-summary__name">${Utils.escapeHtml(profile.username)}</div>
                  <div class="settings-profile-summary__email">${Utils.escapeHtml(session.email || '')}</div>
                </div>
              </div>
              <div class="settings-stat-grid">
                <div class="settings-mini-stat settings-mini-stat--clickable" id="editGoalTrigger">
                  <span class="settings-mini-stat__label">Hydration goal</span>
                  <strong class="settings-mini-stat__value">${state.hydrationGoal} ml</strong>
                  <span class="goal-edit-hint">${(() => { try { const g=JSON.parse(localStorage.getItem('wt_goal_edit_v1')||'{}'); const today=new Date().toISOString().slice(0,10); return g.date===today ? '🔒 locked today' : '✏️ tap to edit'; } catch(e){ return '✏️ tap to edit'; } })()}</span>
                </div>
                <div class="settings-mini-stat">
                  <span class="settings-mini-stat__label">Workout mode</span>
                  <strong class="settings-mini-stat__value">${profile.workoutToday ? 'Active' : 'Off'}</strong>
                </div>
                <div class="settings-mini-stat">
                  <span class="settings-mini-stat__label">Coins</span>
                  <strong class="settings-mini-stat__value">${state.coinBalance || 0}</strong>
                </div>
              </div>
            </section>

            <section class="tile settings-card settings-card--vitals">
              <div class="settings-card__head">
                <div>
                  <div class="settings-section-eyebrow">Body & Vitals</div>
                  <div class="settings-section-title">Your personal stats</div>
                </div>
              </div>
              <div class="vitals-grid" id="vitalsGrid">
                ${(() => {
                  // Read directly from localStorage for immediate display — no async wait needed
                  let vp = profile;
                  if (!vp.age && !vp.dob && !vp.height && !vp.gender) {
                    try {
                      const _ls = JSON.parse(localStorage.getItem('wt_user_state_v2'));
                      if (_ls && _ls.userProfile) vp = { ...vp, ..._ls.userProfile };
                    } catch(e) {}
                  }

                  let ageStr = '—';
                  let dobStr = '—';
                  if (vp.dob) {
                    const _p = vp.dob.split('-');
                    const _d = new Date(_p[0], Number(_p[1])-1, _p[2]);
                    const _a = Math.floor((Date.now()-_d.getTime())/(365.25*24*60*60*1000));
                    if (!isNaN(_a) && _a > 0) ageStr = _a + '';
                    dobStr = _d.getDate().toString().padStart(2,'0') + ' ' +
                      ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][_d.getMonth()] +
                      ' ' + _d.getFullYear();
                  } else if (vp.age) {
                    ageStr = vp.age + '';
                  }

                  const htStr  = vp.height ? vp.height + ' cm' : '—';
                  const genStr = vp.gender ? (vp.gender.charAt(0).toUpperCase() + vp.gender.slice(1)) : '—';

                  return [
                    '<div class="vital-item"><span class="vital-icon">🎂</span><div class="vital-body"><span class="vital-label">Date of Birth</span><span class="vital-value">' + dobStr + '</span></div></div>',
                    '<div class="vital-item"><span class="vital-icon">🗓️</span><div class="vital-body"><span class="vital-label">Age</span><span class="vital-value">' + (ageStr !== '—' ? ageStr + ' yrs' : '—') + '</span></div></div>',
                    '<div class="vital-item"><span class="vital-icon">📏</span><div class="vital-body"><span class="vital-label">Height</span><span class="vital-value">' + htStr + '</span></div></div>',
                    '<div class="vital-item"><span class="vital-icon">⚧️</span><div class="vital-body"><span class="vital-label">Gender</span><span class="vital-value">' + genStr + '</span></div></div>'
                  ].join('');
                })()}
              </div>
            </section>

            <section class="tile settings-card">
              <div class="settings-card__head">
                <div>
                  <div class="settings-section-eyebrow">Account</div>
                  <div class="settings-section-title">Plan, family, and streak context</div>
                </div>
              </div>
              <div class="settings-detail-list">
                <div class="settings-detail-row"><span>Plan</span><strong>${['pro', 'admin', 'maggie'].includes(role) ? 'Pro' : 'Free'}</strong></div>
                <div class="settings-detail-row"><span>Current streak</span><strong>${state.currentStreak || 0} days</strong></div>
                <div class="settings-detail-row"><span>Family members</span><strong>${(state.familyMembers || []).length}</strong></div>
                <div class="settings-detail-row"><span>Custom drink allowance</span><strong>${usage.limit ? `${usage.remaining} of ${usage.limit} left` : 'Unlimited'}</strong></div>
                <div class="settings-detail-row"><span>Daily AI scans</span><strong>${['pro','admin','maggie'].includes(role) ? '450/month' : '2/day'}</strong></div>
              </div>
              <button id="openFamilyManager" class="settings-inline-btn">Manage family list</button>
              <button id="openFramePicker" class="settings-inline-btn" style="margin-top:6px;">🖼️ Your Frames — Tap to equip</button>
            </section>

            <section class="tile settings-card">
              <div class="settings-card__head">
                <div>
                  <div class="settings-section-eyebrow">Preferences</div>
                  <div class="settings-section-title">Hydration behavior</div>
                </div>
              </div>
              <div class="settings-form-grid">
                <label class="settings-field-card">
                  <span class="md-input-label">Workout intensity</span>
                  <div class="styled-select-wrap" id="wrapSettingsIntensity">
                    <button type="button" class="styled-select-btn" data-target="ddSettingsIntensity">
                      <span class="styled-select-val">${profile.workoutIntensity || 'light'}</span>
                      <svg class="styled-select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <div class="styled-select-dropdown" id="ddSettingsIntensity">
                      ${['none','light','moderate','intense','athlete'].map(opt => `<div class="styled-select-opt${profile.workoutIntensity===opt?' is-sel':''}" data-val="${opt}">${opt}</div>`).join('')}
                    </div>
                    <input type="hidden" id="settingsWorkoutIntensity" value="${profile.workoutIntensity || 'light'}"/>
                  </div>
                </label>
                <label class="settings-field-card">
                  <span class="md-input-label">Workout frequency</span>
                  <div class="styled-select-wrap" id="wrapSettingsFrequency">
                    <button type="button" class="styled-select-btn" data-target="ddSettingsFrequency">
                      <span class="styled-select-val">${profile.workoutFrequency || 'moderate'}</span>
                      <svg class="styled-select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <div class="styled-select-dropdown" id="ddSettingsFrequency">
                      ${['rare','light','moderate','frequent','daily'].map(opt => `<div class="styled-select-opt${profile.workoutFrequency===opt?' is-sel':''}" data-val="${opt}">${opt}</div>`).join('')}
                    </div>
                    <input type="hidden" id="settingsWorkoutFrequency" value="${profile.workoutFrequency || 'moderate'}"/>
                  </div>
                </label>
                <label class="toggle-wrap">
                    <div class="toggle-text">
                      <div class="toggle-title">Workout day boost</div>
                      <div class="toggle-sub">Increase today's hydration goal in real time.</div>
                    </div>
                    <input id="settingsWorkoutToday" type="checkbox" class="toggle-input" ${profile.workoutToday ? 'checked' : ''} />
                    <div class="toggle-track"></div>
                  </label>
              </div>
              <button id="savePreferencesBtn" class="md-btn md-btn--filled md-btn--full">Update Preferences</button>
            </section>

            <section class="tile settings-card">
              <div class="settings-card__head">
                <div>
                  <div class="settings-section-eyebrow">Expandable</div>
                  <div class="settings-section-title">Future-ready systems</div>
                </div>
              </div>
              <div class="settings-detail-list">
                <div class="settings-detail-row"><span>Shop system</span><strong>Structured</strong></div>
                <div class="settings-detail-row"><span>Achievement claims</span><strong>Live</strong></div>
                <div class="settings-detail-row"><span>Family leaderboard</span><strong>Private</strong></div>
              </div>
              <div class="settings-coming-soon">Upgrade hooks and spendable coin inventory are ready for the next phase.</div>
            </section>
          </div>
        </section>

        ${isAdmin ? `
          <section class="tile settings-card">
            <div class="settings-section-eyebrow">Admin</div>
            <div class="settings-section-title">Shared drink catalog</div>
            <div class="settings-section-sub">Manage drink types visible to every user.</div>
            <div id="drinksList" style="display:flex;flex-direction:column;gap:8px;"></div>
            <button class="md-btn md-btn--filled md-btn--full" id="addDrinkBtn">+ Add Shared Drink</button>
          </section>
        ` : `
          <section class="tile settings-card">
            <div class="settings-section-eyebrow">Private Drinks</div>
            <div class="settings-section-title">Your custom drink library</div>
            <div class="settings-section-sub">Only you can see these drink types.</div>
            <div id="privateDrinksList" style="display:flex;flex-direction:column;gap:8px;"></div>
            <button class="md-btn md-btn--filled md-btn--full" id="addPrivateDrinkBtn">+ Add My Custom Drink</button>
          </section>
        `}

        ${isPro ? `
        <section class="tile settings-card">
          <div class="settings-card__head">
            <div class="settings-section-eyebrow">Reports</div>
            <div class="settings-section-title">Monthly Hydration Report</div>
            <div class="settings-section-sub">Download a full PDF breakdown of your hydration data for this month.</div>
          </div>
          <button class="md-btn md-btn--filled md-btn--full" id="downloadReportBtn">⬇️ Download Report</button>
        </section>
        ` : ''}

        <!-- Danger Zone: admin only -->
        ${isAdmin ? `
        <section class="tile settings-card settings-card--danger">
          <div class="settings-section-eyebrow" style="color:#D93025;">Danger Zone</div>
          <div class="settings-section-title">Reset & Sign out</div>
          <div class="settings-section-sub">Resetting your data is permanent and cannot be undone.</div>
          <div style="display:flex;flex-direction:column;gap:10px;margin-top:14px;">
            <button class="danger-btn" id="resetDataBtn">🗑️ Reset All My Data</button>
            <button class="danger-btn" id="signOutBtn" style="background:transparent;border:1.5px solid rgba(217,48,37,0.4);color:var(--md-on-surface-med);">Sign Out</button>
          </div>
        </section>
        ` : `
        <section class="tile settings-card">
          <div style="display:flex;flex-direction:column;gap:10px;">
            <button class="danger-btn" id="signOutBtn" style="background:transparent;border:1.5px solid rgba(217,48,37,0.4);color:var(--md-on-surface-med);">Sign Out</button>
          </div>
        </section>
        `}
      </div>
    `;

    bindEvents({ isAdmin, profile });
    setTimeout(() => initStyledSelects(), 50);
  }

  function bindEvents({ isAdmin, profile }) {
    Utils.el('openEditProfile')?.addEventListener('click', openEditProfileModal);
    Utils.el('openFamilyManager')?.addEventListener('click', openFamilyManagerModal);

    // Goal edit - once per day
    Utils.el('editGoalTrigger')?.addEventListener('click', () => {
      const today = new Date().toISOString().slice(0,10);
      try {
        const g = JSON.parse(localStorage.getItem('wt_goal_edit_v1') || '{}');
        if (g.date === today) {
          Utils.showToast('⏰ Goal can only be edited once per day');
          return;
        }
      } catch(e) {}
      openGoalEditModal();
    });
    Utils.el('openFramePicker')?.addEventListener('click', openFramePickerModal);

    Utils.el('savePreferencesBtn')?.addEventListener('click', async () => {
      try {
        const _workoutToday = !!Utils.el('settingsWorkoutToday')?.checked;
        // Immediately persist to separate key so refresh doesn't lose it
        try {
          const _ls = JSON.parse(localStorage.getItem('wt_user_state_v2')) || {};
          if (_ls.userProfile) { _ls.userProfile.workoutToday = _workoutToday; localStorage.setItem('wt_user_state_v2', JSON.stringify(_ls)); }
        } catch(e) {}
        await UserData.saveProfile({
          workoutIntensity: Utils.el('settingsWorkoutIntensity')?.value || profile.workoutIntensity,
          workoutFrequency: Utils.el('settingsWorkoutFrequency')?.value || profile.workoutFrequency,
          workoutToday: _workoutToday,
        });
        await UserData.recomputeProgress();
        if (window.HomeScreen) HomeScreen.updateUI();
        Utils.showToast('Preferences updated.');
        renderForRole();
      } catch (e) {
        Utils.showToast(e.message);
      }
    });

    Utils.el('downloadReportBtn')?.addEventListener('click', () => {
      if (window.DataExport?.downloadMonthlyPDF) {
        DataExport.downloadMonthlyPDF();
      } else {
        Utils.showToast('Report feature loading...');
      }
    });

    Utils.el('resetDataBtn')?.addEventListener('click', async () => {
      if (!confirm('This will permanently delete all your hydration data. Are you sure?')) return;
      if (!confirm('Are you absolutely sure? This cannot be undone.')) return;
      try {
        await Firebase.resetAllData();
        Utils.showToast('All data reset.');
        renderForRole();
      } catch (e) { Utils.showToast(e.message); }
    });

    Utils.el('signOutBtn')?.addEventListener('click', async () => {
      if (!confirm('Sign out?')) return;
      await Auth.signOut();
      Firebase.resetUserId();
      Router.navigate('home');
      LoginScreen.show();
      Utils.showToast('Signed out.');
    });

    if (isAdmin) {
      _DrinksUI.renderList();
      Utils.el('addDrinkBtn')?.addEventListener('click', () => _DrinksUI.showForm(null));
    } else {
      _PrivateDrinksUI.renderList();
      Utils.el('addPrivateDrinkBtn')?.addEventListener('click', () => _PrivateDrinksUI.showForm(null));
    }
  }

  function openModal(content) {
    const overlay = document.createElement('div');
    overlay.className = 'sheet-overlay';
    overlay.innerHTML = `<div class="drink-sheet open settings-modal">${content}</div>`;
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
    return overlay;
  }

  async function openEditProfileModal() {
    const session = Auth.getSession() || {};
    // Wait for UserData to finish syncing from Firestore before opening modal
    if (window.UserData && !UserData.isReady()) {
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 100));
        if (UserData.isReady()) break;
      }
    }
    const state = UserData.getState();
    const profile = state.userProfile || {};
    console.log('[Profile] Opening modal. profile:', profile);
    let overlay;
    const getCurrentName = () => overlay?.querySelector('#profileNameInput')?.value?.trim() || session.displayName || profile.username || 'U';
    const renderModalAvatar = (photoURL, revision = null) => (
      window.Frames
        ? Frames.avatarWithFrame(photoURL, getCurrentName(), 88, null, revision)
        : (window.Profile ? Profile.avatarHTML(photoURL, getCurrentName(), 88, '', revision) : '')
    );
    overlay = openModal(`
      <div class="sheet-handle"></div>
      <div class="sheet-title">Edit Profile</div>
      <div class="settings-modal-grid">
        <div class="settings-modal-avatar">
          <div id="profileAvatarPreview">${renderModalAvatar(session.photoURL || profile.photoURL, session.photoVersion || session.savedAt || null)}</div>
          <label class="file-input-label" for="avatarFileInput">📷 Choose Photo<input type="file" id="avatarFileInput" accept="image/*" class="file-input-hidden" /></label>
          <button id="changeFrameBtn" type="button" class="file-input-label" style="background:rgba(139,92,246,0.15);border-color:rgba(139,92,246,0.4);color:#A78BFA;margin-top:2px;">🖼️ Change Frame</button>
          <div id="avatarStatus" class="settings-inline-status"></div>
        </div>
        <label>
          <span class="md-input-label">Username</span>
          <input id="profileNameInput" class="md-input" value="${Utils.escapeHtml(session.displayName || profile.username || '')}" />
        </label>
        <label>
          <span class="md-input-label">Date of Birth</span>
          <div class="dob-picker-wrap">
            <input id="profileDobInput" type="text" class="md-input dob-display-input"
              value="${profile.dob ? (() => { const p=profile.dob.split('-'); const d=new Date(p[0],p[1]-1,p[2]); return d.getDate().toString().padStart(2,'0')+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]+' '+d.getFullYear(); })() : ''}"
              placeholder="DD MMM YYYY" readonly style="cursor:pointer;" />
            <span class="dob-cal-icon" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);cursor:pointer;font-size:18px;">📅</span>
          </div>
          <input id="profileDobRaw" type="hidden" value="${profile.dob || ''}" />
        </label>
        <label>
          <span class="md-input-label">Height (cm)</span>
          <input id="profileHeightInput" type="number" class="md-input" value="${profile.height || ''}" />
        </label>
        <label>
          <span class="md-input-label">Gender</span>
          <div class="styled-select-wrap" id="wrapGender">
            <button type="button" class="styled-select-btn" data-target="ddGender">
              <span class="styled-select-val">${profile.gender || 'Select one'}</span>
              <svg class="styled-select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="styled-select-dropdown" id="ddGender">
              ${['','female','male','non-binary','other'].map(opt => `<div class="styled-select-opt${profile.gender===opt?' is-sel':''}" data-val="${opt}">${opt||'Select one'}</div>`).join('')}
            </div>
            <input type="hidden" id="profileGenderInput" value="${profile.gender || ''}"/>
          </div>
        </label>
        <label>
          <span class="md-input-label">Workout intensity</span>
          <div class="styled-select-wrap" id="wrapModalIntensity">
            <button type="button" class="styled-select-btn" data-target="ddModalIntensity">
              <span class="styled-select-val">${profile.workoutIntensity || 'light'}</span>
              <svg class="styled-select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="styled-select-dropdown" id="ddModalIntensity">
              ${['none','light','moderate','intense','athlete'].map(opt => `<div class="styled-select-opt${profile.workoutIntensity===opt?' is-sel':''}" data-val="${opt}">${opt}</div>`).join('')}
            </div>
            <input type="hidden" id="profileIntensityInput" value="${profile.workoutIntensity || 'light'}"/>
          </div>
        </label>
        <label>
          <span class="md-input-label">Workout frequency</span>
          <div class="styled-select-wrap" id="wrapModalFrequency">
            <button type="button" class="styled-select-btn" data-target="ddModalFrequency">
              <span class="styled-select-val">${profile.workoutFrequency || 'moderate'}</span>
              <svg class="styled-select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="styled-select-dropdown" id="ddModalFrequency">
              ${['rare','light','moderate','frequent','daily'].map(opt => `<div class="styled-select-opt${profile.workoutFrequency===opt?' is-sel':''}" data-val="${opt}">${opt}</div>`).join('')}
            </div>
            <input type="hidden" id="profileFrequencyInput" value="${profile.workoutFrequency || 'moderate'}"/>
          </div>
        </label>
        <div class="settings-modal-actions">
          <button id="profileCancelBtn" class="md-btn">Cancel</button>
          <button id="profileSaveBtn" class="md-btn md-btn--filled">Save Changes</button>
        </div>
      </div>
    `);

    const refreshAvatarPreview = (photoURL, revision = null) => {
      const preview = overlay.querySelector('#profileAvatarPreview');
      if (!preview) return;
      preview.innerHTML = renderModalAvatar(photoURL, revision);
    };

    overlay.querySelector('#profileCancelBtn')?.addEventListener('click', () => overlay.remove());

    // Init styled selects immediately — DOM is ready since overlay was just built
    initStyledSelects(overlay);

    // ── Custom DOB Calendar ─────────────────────────────────────────────
    (function initDobCalendar() {
      const wrap        = overlay.querySelector('.dob-picker-wrap');
      const hiddenInput = overlay.querySelector('#profileDobRaw');
      const dispInput   = overlay.querySelector('.dob-display-input');
      if (!wrap || !hiddenInput || !dispInput) return;

      let calEl = null;
      let viewYear, viewMonth;
      const today = new Date();

      const parseStored = () => { const v = hiddenInput.value; if (!v) return null; const p=v.split('-'); return new Date(p[0],Number(p[1])-1,p[2]); };
      const months3 = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const months  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

      const formatDisplay = (d) => d.getDate().toString().padStart(2,'0') + ' ' + months3[d.getMonth()] + ' ' + d.getFullYear();

      const renderCalendar = () => {
        const selected  = parseStored();
        const firstDay  = new Date(viewYear, viewMonth, 1).getDay();
        const daysInMon = new Date(viewYear, viewMonth + 1, 0).getDate();
        const dayNames  = ['Su','Mo','Tu','We','Th','Fr','Sa'];
        let cells = '';
        for (let i = 0; i < firstDay; i++) cells += '<span class="dob-cal-empty"></span>';
        for (let d = 1; d <= daysInMon; d++) {
          const date    = new Date(viewYear, viewMonth, d);
          const isToday = date.toDateString() === today.toDateString();
          const isSel   = selected && date.toDateString() === selected.toDateString();
          const isFut   = date > today;
          cells += `<span class="dob-cal-day${isToday?' dob-cal-today':''}${isSel?' dob-cal-sel':''}${isFut?' dob-cal-disabled':''}" data-d="${d}">${d}</span>`;
        }
        calEl.innerHTML = `
          <div class="dob-cal-header">
            <button class="dob-cal-nav" id="dobCalPrev">&#8249;</button>
            <div class="dob-cal-title">
              <div class="dob-month-wrap" id="dobMonthWrap">
                <button class="dob-month-btn" id="dobMonthBtn">${months[viewMonth]} <span class="dob-chevron">▾</span></button>
                <div class="dob-month-dropdown" id="dobMonthDropdown" style="display:none;">
                  ${months.map((m,i)=>`<div class="dob-month-opt${i===viewMonth?' dob-month-sel':''}" data-m="${i}">${m}</div>`).join('')}
                </div>
              </div>
              <input class="dob-year" type="number" value="${viewYear}" min="1900" max="${today.getFullYear()}"/>
            </div>
            <button class="dob-cal-nav" id="dobCalNext">&#8250;</button>
          </div>
          <div class="dob-cal-daynames">${dayNames.map(n=>`<span>${n}</span>`).join('')}</div>
          <div class="dob-cal-grid">${cells}</div>
          <div class="dob-cal-footer">
            <button class="dob-btn-clear">Clear</button>
            <button class="dob-btn-done">Done</button>
          </div>`;

        calEl.querySelector('#dobCalPrev').onclick = (e) => { e.stopPropagation(); viewMonth===0?(viewMonth=11,viewYear--):viewMonth--; renderCalendar(); };
        calEl.querySelector('#dobCalNext').onclick = (e) => {
          e.stopPropagation();
          const nm = viewMonth===11?0:viewMonth+1, ny = viewMonth===11?viewYear+1:viewYear;
          if (new Date(ny,nm,1)<=today){viewMonth=nm;viewYear=ny;renderCalendar();}
        };
        // Custom month dropdown
        const monthBtn      = calEl.querySelector('#dobMonthBtn');
        const monthDropdown = calEl.querySelector('#dobMonthDropdown');
        const monthWrap     = calEl.querySelector('#dobMonthWrap');
        if (monthBtn && monthDropdown) {
          monthBtn.onclick = (e) => {
            e.stopPropagation();
            const isOpen = monthDropdown.style.display !== 'none';
            monthDropdown.style.display = isOpen ? 'none' : 'block';
          };
          monthDropdown.querySelectorAll('.dob-month-opt').forEach(opt => {
            opt.onclick = (e) => {
              e.stopPropagation();
              viewMonth = Number(opt.dataset.m);
              monthDropdown.style.display = 'none';
              renderCalendar();
            };
          });
          // Close dropdown when clicking outside
          setTimeout(() => {
            document.addEventListener('click', function closeMonthDD(e) {
              if (monthWrap && !monthWrap.contains(e.target)) {
                monthDropdown.style.display = 'none';
                document.removeEventListener('click', closeMonthDD);
              }
            });
          }, 0);
        }
        calEl.querySelector('.dob-year').onchange = (e) => { const y=Number(e.target.value); if(y>=1900&&y<=today.getFullYear()){viewYear=y;renderCalendar();} };
        calEl.querySelector('.dob-btn-clear').onclick = (e) => { e.stopPropagation(); hiddenInput.value=''; dispInput.value=''; closeCalendar(); };
        calEl.querySelector('.dob-btn-done').onclick  = (e) => { e.stopPropagation(); closeCalendar(); };
        calEl.querySelectorAll('.dob-cal-day:not(.dob-cal-disabled)').forEach(span => {
          span.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            const d = new Date(viewYear, viewMonth, Number(span.dataset.d));
            // Use local date parts to avoid UTC timezone offset shifting the date
            const isoDate = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
            const displayStr = formatDisplay(d);
            // Re-query to ensure we have live references
            const _hidden = overlay.querySelector('#profileDobRaw');
            const _disp   = overlay.querySelector('.dob-display-input');
            if (_hidden) { _hidden.value = isoDate; console.log('[DOB] Set to:', isoDate, '| hidden.value now:', _hidden.value); }
            if (_disp)   { _disp.value   = displayStr; }
            closeCalendar();
          };
        });
      };

      const openCalendar = (e) => {
        e.stopPropagation();
        if (calEl) { closeCalendar(); return; }
        const sel = parseStored() || new Date(today.getFullYear()-20, today.getMonth(), today.getDate());
        viewYear=sel.getFullYear(); viewMonth=sel.getMonth();
        calEl = document.createElement('div');
        calEl.className = 'dob-calendar-popup';
        wrap.style.position = 'relative';
        wrap.appendChild(calEl);
        renderCalendar();
        // Delay outsideClick so this same click event doesn't immediately close the calendar
        setTimeout(() => document.addEventListener('click', outsideClick), 200);
      };

      const closeCalendar = () => { if(calEl){calEl.remove();calEl=null;} document.removeEventListener('click',outsideClick); };
      const outsideClick  = (e) => { if(!wrap.contains(e.target) && (!calEl || !calEl.contains(e.target))) closeCalendar(); };

      dispInput.addEventListener('click', openCalendar);
      wrap.querySelector('.dob-cal-icon').addEventListener('click', openCalendar);
    })();
    // ── End DOB Calendar ────────────────────────────────────────────────
    overlay.querySelector('#profileNameInput')?.addEventListener('input', () => {
      const activeSession = Auth.getSession() || session;
      refreshAvatarPreview(activeSession.photoURL || profile.photoURL, activeSession.photoVersion || activeSession.savedAt || null);
    });
    overlay.querySelector('#changeFrameBtn')?.addEventListener('click', () => {
      overlay.remove();
      openFramePickerModal();
    });
    overlay.querySelector('#profileSaveBtn')?.addEventListener('click', async () => {
      const saveBtn = overlay.querySelector('#profileSaveBtn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';

      const displayName  = overlay.querySelector('#profileNameInput')?.value?.trim() || session.displayName || 'User';
      const dobRaw       = overlay.querySelector('#profileDobRaw')?.value || '';
      const age          = dobRaw ? Math.floor((Date.now() - ((p=>new Date(p[0],p[1]-1,p[2]))(dobRaw.split('-'))).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
      const height       = Number(overlay.querySelector('#profileHeightInput')?.value) || null;
      const gender    = (overlay.querySelector('#profileGenderInput')?.value    || '').toLowerCase().trim();
      const intensity = (overlay.querySelector('#profileIntensityInput')?.value || 'light').toLowerCase().trim();
      const frequency = (overlay.querySelector('#profileFrequencyInput')?.value || 'moderate').toLowerCase().trim();
      console.log('[Profile] Read values — gender:', gender, 'intensity:', intensity, 'frequency:', frequency);

      try {
        // Save display name to auth profile (best-effort — don't block on failure)
        try { await Profile.saveProfile({ displayName }); } catch(e) { console.warn('Profile.saveProfile:', e.message); }

        // Save all fields to UserData (localStorage + Firestore)
        console.log('[Profile] Saving:', { displayName, age, height, gender, intensity, frequency });
        await UserData.saveProfile({
          username: displayName,
          age, height, gender,
          dob: dobRaw || null,
          workoutIntensity: intensity,
          workoutFrequency: frequency,
          surveyData: { age, height, gender, dob: dobRaw || null },
        });
        console.log('[Profile] Saved. State now:', UserData.getState().userProfile);


        if (window.App) App.updateHeaderAvatar(Auth.getSession());
        if (window.HomeScreen) HomeScreen.updateUI();
        Utils.showToast('✅ Profile updated!');
        overlay.remove();
        _patchMetaLine();
        renderForRole();
      } catch (e) {
        Utils.showToast('❌ ' + e.message);
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
      }
    });

    overlay.querySelector('#avatarFileInput')?.addEventListener('change', async function onAvatarChange() {
      const file = this.files?.[0];
      if (!file) return;
      const status = overlay.querySelector('#avatarStatus');
      status.textContent = 'Preparing image...';
      try {
        const previewSrc = window.Profile?.readFileAsDataURL
          ? await Profile.readFileAsDataURL(file)
          : await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onerror = () => reject(new Error('Could not read the selected image.'));
              reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
              reader.readAsDataURL(file);
            });
        if (previewSrc) refreshAvatarPreview(previewSrc, Date.now());
        status.textContent = 'Uploading...';
        const url = await Profile.uploadPhoto(file);
        await Profile.saveProfile({ photoURL: url });
        await UserData.saveProfile({ photoURL: url });
        const nextSession = Auth.getSession() || session;
        refreshAvatarPreview(url, nextSession.photoVersion || nextSession.savedAt || null);
        if (window.App) App.updateHeaderAvatar(Auth.getSession());
        status.textContent = 'Photo updated.';
        Utils.showToast('Profile photo updated.');
        renderForRole();
      } catch (e) {
        status.textContent = e.message;
      } finally {
        this.value = '';
      }
    });
  }

  function openFramePickerModal() {
    if (!window.Frames) { Utils.showToast('Frames not loaded'); return; }

    const overlay = openModal(`
      <div class="sheet-handle"></div>
      <div class="sheet-title">🖼️ Your Frames</div>
      <div style="font-size:13px;color:var(--md-on-surface-med);margin-bottom:14px;">Tap to equip. Buy more in the Shop.</div>
      <div id="framePickerGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(95px,1fr));gap:8px;margin-bottom:16px;">
        <div style="grid-column:1/-1;text-align:center;padding:24px;color:var(--md-on-surface-med);">⏳ Loading frames…</div>
      </div>
      <button id="framePickerDone" class="md-btn md-btn--filled" style="width:100%;">Done</button>
    `);
    overlay.querySelector('#framePickerDone')?.addEventListener('click', () => overlay.remove());

    const populate = () => {
      const grid = overlay.querySelector('#framePickerGrid');
      if (!grid || !overlay.isConnected) return;
      grid.innerHTML = _buildFramePickerGrid();
      _bindFramePickerTiles(overlay);
    };

    // Force reload from Firestore, with retry if Firebase not ready
    const tryLoad = async () => {
      if (!window.firebase || !firebase.apps?.length) {
        setTimeout(tryLoad, 400);
        return;
      }
      await Frames.reloadCatalog();
      populate();
    };
    tryLoad();
  }

  function _buildFramePickerGrid() {
    const catalog = window.Frames?.CATALOG || [];
    const fbEmail = (window.firebase?.auth?.()?.currentUser?.email || '').toLowerCase();
    const sesEmail = (window.Auth?.getSession?.()?.email || '').toLowerCase();
    const sesRole  = (window.Auth?.getSession?.()?.role  || '').toLowerCase();
    const isAdm = sesRole==='admin' || sesRole==='maggie' ||
      fbEmail==='jindalmayank2604@gmail.com' || sesEmail==='jindalmayank2604@gmail.com' ||
      fbEmail==='mayankjindal2604@gmail.com' || sesEmail==='mayankjindal2604@gmail.com';
    const visible = isAdm ? catalog : catalog.filter(f => window.Frames?.isPurchased?.(f.id));

    const curEq = window.Frames?.getEquipped?.() || null;

    const tileParts = visible.map(f => {
      const isEq = curEq === f.id;
      const overlayStyle = window.Frames?.getFrameOverlayStyle?.(f.id, 52, 'object-fit:contain;z-index:2;pointer-events:none;') || '';
      return `<div data-frame-pick="${f.id}" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 8px;border-radius:14px;cursor:pointer;border:2px solid ${isEq?'var(--md-primary)':'var(--md-outline)'};background:${isEq?'rgba(26,115,232,0.12)':'var(--md-surface-2)'};transition:all 0.15s;position:relative;">
        <div style="position:relative;width:52px;height:52px;flex-shrink:0;">
          <div style="position:absolute;top:0;left:0;width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#1a73e8,#0d47a1);display:flex;align-items:center;justify-content:center;font-size:20px;z-index:1;overflow:hidden;pointer-events:none;">💧</div>
          <img src="${f.file}" style="${overlayStyle}" onerror="this.style.display='none'" />
        </div>
        <div style="font-size:11px;font-weight:700;color:var(--md-on-background);text-align:center;pointer-events:none;">${f.emoji||'🖼️'} ${f.name}</div>
        ${isEq?'<div style="font-size:9px;color:var(--md-primary);font-weight:800;pointer-events:none;">EQUIPPED</div>':''}
      </div>`;
    });

    const noneTile = `<div data-frame-pick="none" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 8px;border-radius:14px;cursor:pointer;border:2px solid ${!curEq?'var(--md-primary)':'var(--md-outline)'};background:${!curEq?'rgba(26,115,232,0.12)':'var(--md-surface-2)'};transition:all 0.15s;">
      <div style="width:52px;height:52px;border-radius:50%;background:var(--md-surface-3);display:flex;align-items:center;justify-content:center;font-size:22px;pointer-events:none;">🚫</div>
      <div style="font-size:11px;font-weight:700;color:var(--md-on-background);pointer-events:none;">None</div>
      ${!curEq?'<div style="font-size:9px;color:var(--md-primary);font-weight:800;pointer-events:none;">ACTIVE</div>':''}
    </div>`;

    const empty = visible.length === 0
      ? '<div style="grid-column:1/-1;text-align:center;color:var(--md-on-surface-med);font-size:13px;padding:16px;">No frames yet.<br>Visit Shop to buy! 🪙</div>'
      : '';

    return tileParts.join('') + noneTile + empty;
  }


  function _bindFramePickerTiles(overlay) {
    overlay.querySelectorAll('[data-frame-pick]').forEach(tile => {
      tile.addEventListener('click', async () => {
        const id = tile.dataset.framePick;
        try {
          await Frames.equip(id === 'none' ? null : id);
          if (window.App) App.updateHeaderAvatar?.(Auth.getSession());
          const grid = overlay.querySelector('#framePickerGrid');
          if (grid) { grid.innerHTML = _buildFramePickerGrid(); _bindFramePickerTiles(overlay); }
        } catch(e) { Utils.showToast('❌ ' + e.message); }
      });
    });
  }

  function _openFramePickerModal(ud) {
    // Legacy - redirects to new implementation
    openFramePickerModal();
  }


  function openFamilyManagerModal() {
    const state = UserData.getState();
    const session = Auth.getSession() || {};
    const uid = Firebase.getUserId() || session.uid || '';
    // Generate a shareable invite link using the user's UID
    const baseUrl = window.location.origin + window.location.pathname;
    const familyLink = uid ? `${baseUrl}?joinFamily=${uid}` : null;

    const overlay = openModal(`
      <div class="sheet-handle"></div>
      <div class="sheet-title">👨‍👩‍👧 Family Group</div>
      <div class="settings-modal-grid">

        ${familyLink ? `
        <div class="family-invite-box">
          <div class="md-input-label">🔗 Your Family Invite Link</div>
          <div class="family-invite-link" id="familyLinkDisplay">${familyLink}</div>
          <div style="display:flex;gap:8px;margin-top:8px;">
            <button id="copyFamilyLink" class="md-btn md-btn--filled" style="flex:1;">📋 Copy Link</button>
            <button id="shareFamilyLink" class="md-btn" style="flex:1;">📤 Share</button>
          </div>
          <div class="settings-section-sub" style="margin-top:6px;">Send this link to friends or family. When they open it, they'll be added to your group automatically.</div>
        </div>
        ` : '<div class="settings-section-sub">Log in to generate your family invite link.</div>'}

        <div style="border-top:1px solid var(--md-outline);padding-top:14px;margin-top:4px;">
          <div class="md-input-label">Or add by Gmail ID directly</div>
          <input id="familyModalInput" class="md-input" placeholder="member@gmail.com" style="margin-top:6px;" />
          <button id="familyModalSave" class="md-btn md-btn--filled md-btn--full" style="margin-top:8px;">+ Add to Family</button>
        </div>

        ${(state.familyMembers || []).length > 0 ? `
        <div>
          <div class="md-input-label">Current Members (${(state.familyMembers||[]).length})</div>
          <div class="family-roster">${(state.familyMembers || []).map((email) => `<span class="family-roster__chip">${Utils.escapeHtml(email)}</span>`).join('')}</div>
        </div>` : ''}
      </div>
    `);

    overlay.querySelector('#copyFamilyLink')?.addEventListener('click', () => {
      navigator.clipboard.writeText(familyLink).then(() => Utils.showToast('✅ Link copied!')).catch(() => {
        // Fallback
        const el = document.createElement('textarea');
        el.value = familyLink; document.body.appendChild(el);
        el.select(); document.execCommand('copy'); el.remove();
        Utils.showToast('✅ Link copied!');
      });
    });

    overlay.querySelector('#shareFamilyLink')?.addEventListener('click', () => {
      if (navigator.share) {
        navigator.share({ title: 'Join my hydration family!', text: 'Track hydration together — click to join my family group.', url: familyLink });
      } else {
        Utils.showToast('Copy the link above and send it manually.');
      }
    });

    overlay.querySelector('#familyModalSave')?.addEventListener('click', async () => {
      const email = overlay.querySelector('#familyModalInput')?.value?.trim() || '';
      if (!email) { Utils.showToast('Enter an email address.'); return; }
      try {
        await UserData.addFamilyMember(email);
        Utils.showToast('✅ Family member added.');
        overlay.remove();
        renderForRole();
      } catch (e) { Utils.showToast(e.message); }
    });
  }

  function openGoalEditModal() {
    const current = window.UserData ? UserData.getState().hydrationGoal : 3000;
    const overlay = openModal(`
      <div class="sheet-handle"></div>
      <div class="sheet-title">Edit Daily Goal</div>
      <div style="padding:0 4px 8px;">
        <p style="font-size:13px;color:var(--md-on-surface-variant,rgba(255,255,255,0.6));margin:0 0 16px;">
          Set a custom hydration goal for today. This overrides the auto-calculated goal.<br>
          <strong style="color:#a78bfa;">You can only change this once per day.</strong>
        </p>
        <label>
          <span class="md-input-label">Daily Goal (ml)</span>
          <input id="goalEditInput" type="number" class="md-input" value="${current}" min="500" max="6000" step="50" />
        </label>
        <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
          ${[1500,2000,2500,3000,3500,4000].map(v =>
            '<button class="goal-preset-btn" data-val="'+v+'">'+v+'ml</button>'
          ).join('')}
        </div>
        <div class="settings-modal-actions" style="margin-top:16px;">
          <button id="goalEditCancel" class="md-btn">Cancel</button>
          <button id="goalEditSave" class="md-btn md-btn--filled">Save Goal</button>
        </div>
      </div>
    `);

    overlay.querySelectorAll('.goal-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.querySelector('#goalEditInput').value = btn.dataset.val;
        overlay.querySelectorAll('.goal-preset-btn').forEach(b => b.classList.remove('is-sel'));
        btn.classList.add('is-sel');
      });
    });

    overlay.querySelector('#goalEditCancel')?.addEventListener('click', () => overlay.remove());
    overlay.querySelector('#goalEditSave')?.addEventListener('click', async () => {
      const val = parseInt(overlay.querySelector('#goalEditInput')?.value, 10);
      if (!val || val < 500 || val > 6000) { Utils.showToast('❌ Enter a value between 500–6000 ml'); return; }
      const today = new Date().toISOString().slice(0,10);
      localStorage.setItem('wt_goal_edit_v1', JSON.stringify({ date: today, goal: val }));
      await UserData.save({ hydrationGoal: val });
      Utils.showToast('✅ Goal set to ' + val + ' ml for today');
      overlay.remove();
      renderForRole();
      if (window.HomeScreen) HomeScreen.updateUI();
    });
  }

  function initStyledSelects(root) {
    (root || document).querySelectorAll('.styled-select-wrap').forEach(wrap => {
      if (wrap._ssInit) return;
      wrap._ssInit = true;

      const btn    = wrap.querySelector('.styled-select-btn');
      const dd     = wrap.querySelector('.styled-select-dropdown');
      const hidden = wrap.querySelector('input[type=hidden]');
      const val    = wrap.querySelector('.styled-select-val');
      if (!btn || !dd || !hidden) return;

      // Toggle open
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const opening = !dd.classList.contains('is-open');
        // Close everything first
        document.querySelectorAll('.styled-select-dropdown.is-open').forEach(d => {
          d.classList.remove('is-open');
          d.closest('.styled-select-wrap')?._ssBtn?.classList.remove('is-active');
        });
        if (opening) { dd.classList.add('is-open'); btn.classList.add('is-active'); }
      });
      wrap._ssBtn = btn;

      // Select option — use both mousedown AND click for maximum compatibility
      dd.querySelectorAll('.styled-select-opt').forEach(opt => {
        const selectOpt = (e) => {
          e.stopPropagation();
          if (e.type === 'mousedown') e.preventDefault();
          const v = opt.dataset.val;
          // Update hidden input
          hidden.value = v;
          // Update display
          val.textContent = v || opt.textContent.trim();
          // Update selected state
          dd.querySelectorAll('.styled-select-opt').forEach(o => o.classList.remove('is-sel'));
          opt.classList.add('is-sel');
          // Close
          dd.classList.remove('is-open');
          btn.classList.remove('is-active');
          // Verify write
          console.log('[Select] Set', hidden.id, '=', hidden.value);
        };
        opt.addEventListener('mousedown', selectOpt);
        opt.addEventListener('click', selectOpt);
      });
    });

    if (!window._ssGlobalClose) {
      window._ssGlobalClose = true;
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.styled-select-wrap') && !e.target.closest('.dob-picker-wrap') && !e.target.closest('.dob-calendar-popup')) {
          document.querySelectorAll('.styled-select-dropdown.is-open').forEach(d => {
            d.classList.remove('is-open');
            d.closest('.styled-select-wrap')?._ssBtn?.classList.remove('is-active');
          });
        }
      });
    }
  }

  function _buildMetaLine(p) {
    let ageStr = '— yrs';
    if (p.dob) {
      const _pts = p.dob.split('-');
      const _d   = new Date(_pts[0], Number(_pts[1])-1, _pts[2]);
      const _age = Math.floor((Date.now() - _d.getTime()) / (365.25*24*60*60*1000));
      if (!isNaN(_age) && _age > 0) ageStr = _age + ' yrs';
    } else if (p.age) {
      ageStr = p.age + ' yrs';
    }
    const htStr  = p.height ? p.height + ' cm' : '— cm';
    const genStr = p.gender ? (p.gender.charAt(0).toUpperCase() + p.gender.slice(1)) : 'Unset';
    return ageStr + ' • ' + htStr + ' • ' + genStr;
  }

  function _patchMetaLine() {
    const el = document.getElementById('profileMetaLine');
    if (el) {
      // Element exists — patch it directly
      const up = window.UserData ? UserData.getState().userProfile : {};
      el.textContent = _buildMetaLine(up);
    } else {
      // Element doesn't exist — trigger full re-render if settings screen is mounted
      const settingsRoot = Utils.el('settings-root');
      if (settingsRoot && settingsRoot.children.length > 0) {
        renderForRole();
      }
    }
  }

  const init = () => {
    Router.on('settings', () => { renderForRole(); setTimeout(() => initStyledSelects(), 50); });
  };
  return { init, renderForRole, render, _buildMetaLine, _patchMetaLine };
})();

SettingsScreen._handleProUpgrade = () => {
  Utils.showToast('Pro upgrade flow is still coming soon.');
};

const _DrinksUI = {};

_DrinksUI.renderList = function renderDrinksList() {
  const el = Utils.el('drinksList');
  if (!el) return;
  const drinks = Drinks.getAll();
  el.innerHTML = drinks.map((d) => `
    <div class="drink-row" data-id="${d.id}">
      <span class="drink-row-emoji">${d.emoji}</span>
      <div class="drink-row-info">
        <div class="drink-row-name">${d.name}</div>
        <div class="drink-row-pct">${d.hydration >= 0 ? d.hydration + '% hydration' : d.hydration + '% (dehydrating)'}</div>
      </div>
      ${d.locked ? '<span class="drink-row-badge">built-in</span>' : `<button class="drink-row-edit" data-id="${d.id}">Edit</button><button class="drink-row-del" data-id="${d.id}">×</button>`}
    </div>
  `).join('');

  el.querySelectorAll('.drink-row-edit').forEach((btn) => btn.addEventListener('click', () => _DrinksUI.showForm(Drinks.getById(btn.dataset.id))));
  el.querySelectorAll('.drink-row-del').forEach((btn) => btn.addEventListener('click', async () => {
    if (!confirm('Delete this drink type?')) return;
    await Drinks.remove(btn.dataset.id);
    _DrinksUI.renderList();
  }));
};

_DrinksUI.showForm = function showDrinkForm(existing) {
  const isEdit = !!existing;
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.innerHTML = `
    <div class="drink-sheet open settings-modal">
      <div class="sheet-handle"></div>
      <div class="sheet-title">${isEdit ? 'Edit Drink' : 'New Drink Type'}</div>
      <div class="settings-modal-grid">
        <label><span class="md-input-label">Emoji</span><input class="md-input" id="dfEmoji" maxlength="2" value="${existing?.emoji || '🥤'}"></label>
        <label><span class="md-input-label">Name</span><input class="md-input" id="dfName" maxlength="20" value="${existing?.name || ''}"></label>
        <label><span class="md-input-label">Hydration %</span><input class="md-input" id="dfHydration" type="number" min="-50" max="100" value="${existing?.hydration ?? 90}"></label>
        <div class="settings-modal-actions">
          <button id="dfCancel" class="md-btn">Cancel</button>
          <button id="dfSave" class="md-btn md-btn--filled">${isEdit ? 'Save' : 'Add Drink'}</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#dfCancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#dfSave').addEventListener('click', async () => {
    const emoji = overlay.querySelector('#dfEmoji').value.trim() || '🥤';
    const name = overlay.querySelector('#dfName').value.trim();
    const hydration = parseInt(overlay.querySelector('#dfHydration').value, 10);
    if (!name) { Utils.showToast('Enter a drink name.'); return; }
    if (isEdit) await Drinks.update(existing.id, { emoji, name, hydration });
    else await Drinks.add({ emoji, name, hydration, locked: false });
    overlay.remove();
    _DrinksUI.renderList();
  });
};

const _PrivateDrinksUI = {};

_PrivateDrinksUI.renderList = function renderPrivateDrinks() {
  const el = Utils.el('privateDrinksList');
  if (!el) return;
  const drinks = Drinks.getPrivateAll();
  if (!drinks.length) {
    el.innerHTML = '<div class="settings-coming-soon">No custom drinks yet. Add one to personalize your drink sheet.</div>';
    return;
  }
  el.innerHTML = drinks.map((d) => `
    <div class="drink-row" data-id="${d.id}">
      <span class="drink-row-emoji">${d.emoji}</span>
      <div class="drink-row-info">
        <div class="drink-row-name">${Utils.escapeHtml(d.name)}</div>
        <div class="drink-row-pct">${d.hydration >= 0 ? d.hydration + '% hydration' : d.hydration + '% (dehydrating)'}</div>
      </div>
      <button class="drink-row-edit" data-id="${d.id}">Edit</button>
      <button class="drink-row-del" data-id="${d.id}">×</button>
    </div>
  `).join('');
  el.querySelectorAll('.drink-row-edit').forEach((btn) => btn.addEventListener('click', () => _PrivateDrinksUI.showForm(Drinks.getPrivateAll().find((drink) => drink.id === btn.dataset.id))));
  el.querySelectorAll('.drink-row-del').forEach((btn) => btn.addEventListener('click', async () => {
    if (!confirm('Delete this custom drink?')) return;
    await Drinks.removePrivate(btn.dataset.id);
    _PrivateDrinksUI.renderList();
  }));
};

_PrivateDrinksUI.showForm = function showPrivateDrinkForm(existing) {
  const isEdit = !!existing;
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.innerHTML = `
    <div class="drink-sheet open settings-modal">
      <div class="sheet-handle"></div>
      <div class="sheet-title">${isEdit ? 'Edit My Drink' : 'New Private Drink'}</div>
      <div class="settings-modal-grid">
        <label><span class="md-input-label">Emoji</span><input class="md-input" id="pdfEmoji" maxlength="2" value="${existing?.emoji || '🥤'}"></label>
        <label><span class="md-input-label">Name</span><input class="md-input" id="pdfName" maxlength="20" value="${existing?.name || ''}"></label>
        <label><span class="md-input-label">Hydration %</span><input class="md-input" id="pdfHydration" type="number" min="-50" max="100" value="${existing?.hydration ?? 90}"></label>
        <div class="settings-modal-actions">
          <button id="pdfCancel" class="md-btn">Cancel</button>
          <button id="pdfSave" class="md-btn md-btn--filled">${isEdit ? 'Save' : 'Add Drink'}</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#pdfCancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#pdfSave').addEventListener('click', async () => {
    const emoji = overlay.querySelector('#pdfEmoji').value.trim() || '🥤';
    const name = overlay.querySelector('#pdfName').value.trim();
    const hydration = parseInt(overlay.querySelector('#pdfHydration').value, 10);
    if (!name) { Utils.showToast('Enter a drink name.'); return; }
    if (isEdit) await Drinks.updatePrivate(existing.id, { emoji, name, hydration });
    else await Drinks.addPrivate({ emoji, name, hydration });
    overlay.remove();
    _PrivateDrinksUI.renderList();
  });
};
