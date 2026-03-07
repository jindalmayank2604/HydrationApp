/* ══════════════════════════════════════════
   SCREEN: Settings — role-gated
   Admin (jindalmayank2604@gmail.com) → sees everything
   User  (sampadagupta07@gmail.com)   → sees goal + account only
   ══════════════════════════════════════════ */

const SettingsScreen = (() => {

  const render = () => renderForRole();

  const renderForRole = () => {
    const isAdmin     = Auth.isAdmin();
    const session     = Auth.getSession();
    const cfg         = Firebase.getConfig() || {};
    const isConnected = Firebase.isInitialized();
    const email       = session?.email || '';
    const name        = session?.displayName || email.split('@')[0] || 'User';

    Utils.el('settings-root').innerHTML = `
      <div class="screen-stack">

        <!-- Account tile -->
        <div class="tile settings-account-tile">
          <div class="settings-account-row">
            <div class="settings-account-avatar">${name.charAt(0).toUpperCase()}</div>
            <div class="settings-account-info">
              <div class="settings-account-name">${name}</div>
              <div class="settings-account-email">${email}</div>
              <span class="role-badge ${isAdmin ? 'role-badge--admin' : 'role-badge--user'}">
                ${isAdmin ? '🔑 Admin' : '👤 User'}
              </span>
            </div>
          </div>
          <button class="danger-btn" id="signOutBtn" style="margin-top:12px;">
            🚪 Sign Out
          </button>
        </div>

        <!-- Daily Goal (everyone) -->
        <div class="tile">
          <div class="settings-section-title">🎯 Daily Goal</div>
          <div style="display:flex;gap:12px;align-items:center;margin-top:12px;">
            <input class="md-input" type="number" id="goalInput"
              value="${Storage.getGoal()}" min="500" max="10000" style="flex:1;" />
            <span style="color:var(--md-on-surface-med);font-size:14px;font-weight:600;">ml / day</span>
          </div>
          <button class="md-btn md-btn--filled md-btn--full" id="saveGoalBtn"
            style="border-radius:12px;padding:12px;margin-top:12px;">Save Goal</button>
          <div style="font-size:12px;color:var(--md-on-surface-med);margin-top:8px;">
            WHO recommends 2500–3500 ml/day
          </div>
        </div>

        ${isAdmin ? adminOnlyHTML(cfg, isConnected) : userRestrictedBanner()}

      </div>
    `;

    bindEvents(isAdmin);
  };

  /* ── HTML only shown to admin ── */
  const adminOnlyHTML = (cfg, isConnected) => `

    <!-- Firebase Status -->
    <div class="settings-status-tile ${isConnected ? 'connected' : 'disconnected'}">
      <div class="settings-status-icon">${isConnected ? '🔥' : '📦'}</div>
      <div class="settings-status-info">
        <div class="settings-status-title">${isConnected ? 'Firebase Connected' : 'Using Local Storage'}</div>
        <div class="settings-status-sub">${isConnected ? 'Data syncs to Firestore' : 'Data saved locally only'}</div>
      </div>
      ${isConnected ? `<button class="settings-disconnect-btn" id="disconnectBtn">Disconnect</button>` : ''}
    </div>

    <!-- Firebase Config -->
    <div class="tile">
      <div class="settings-section-title">🔥 Firebase Configuration</div>
      <div class="settings-section-sub">
        From <a href="https://console.firebase.google.com" target="_blank"
          style="color:var(--md-primary);font-weight:600;">Firebase Console</a>
        → Project Settings → Your Apps → Web App
      </div>
      <div class="settings-field-group">
        ${field('apiKey',            'API Key',             cfg.apiKey            || '', 'AIzaSy...')}
        ${field('authDomain',        'Auth Domain',         cfg.authDomain        || '', 'your-app.firebaseapp.com')}
        ${field('projectId',         'Project ID',          cfg.projectId         || '', 'your-project-id')}
        ${field('storageBucket',     'Storage Bucket',      cfg.storageBucket     || '', 'your-app.appspot.com')}
        ${field('messagingSenderId', 'Messaging Sender ID', cfg.messagingSenderId || '', '123456789')}
        ${field('appId',             'App ID',              cfg.appId             || '', '1:123:web:abc123')}
      </div>
      <div id="firebaseStatus" style="margin:12px 0;min-height:20px;font-size:13px;font-weight:600;"></div>
      <button class="md-btn md-btn--filled md-btn--full" id="connectFirebaseBtn"
        style="border-radius:16px;padding:14px;">
        ${isConnected ? '🔄 Reconnect / Update' : '🔌 Connect to Firebase'}
      </button>
    </div>

    <!-- Setup instructions -->
    <div class="info-banner" style="flex-direction:column;gap:8px;">
      <div style="font-weight:700;font-size:14px;color:var(--md-primary);">📋 Quick Setup</div>
      <ol style="font-size:12px;color:var(--md-primary-dark);line-height:2;padding-left:18px;margin:0;">
        <li>Create project on <strong>console.firebase.google.com</strong></li>
        <li>Enable <strong>Firestore Database</strong> (Native mode)</li>
        <li>Enable <strong>Authentication → Google + Anonymous + Email/Password</strong></li>
        <li>Add Web App → copy config values above</li>
        <li>Set Firestore rules: <code style="background:#E8EAED;padding:2px 6px;border-radius:4px;">allow read, write: if true;</code></li>
      </ol>
    </div>

    <!-- Danger Zone -->
    <div class="tile" style="border:2px solid #FFCDD2;">
      <div class="settings-section-title" style="color:#D93025;">⚠️ Danger Zone</div>
      <div class="settings-section-sub">Admin-only. Permanent and cannot be undone.</div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:4px;">
        <button class="danger-btn" id="resetTodayBtn">🗑 Clear Today's Data</button>
        <button class="danger-btn danger-btn--hard" id="resetAllBtn">💣 Reset Entire Database</button>
      </div>
    </div>
  `;

  /* ── Banner shown to non-admin ── */
  const userRestrictedBanner = () => `
    <div class="tile locked-banner">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:28px;">🔒</span>
        <div>
          <div class="locked-title">Admin Settings Locked</div>
          <div class="locked-sub">Firebase config and database controls are only accessible to the admin account.</div>
        </div>
      </div>
    </div>
  `;

  const field = (key, label, value, placeholder) => `
    <div class="settings-field">
      <label class="md-input-label">${label}</label>
      <input class="md-input settings-fb-input" type="text"
        data-key="${key}" value="${Utils.escapeHtml(value)}" placeholder="${placeholder}"
        autocomplete="off" autocorrect="off" spellcheck="false" />
    </div>
  `;

  /* ── Bind events ── */
  const bindEvents = (isAdmin) => {

    /* Sign out — everyone */
    Utils.el('signOutBtn')?.addEventListener('click', async () => {
      if (!confirm('Sign out?')) return;
      await Auth.signOut();
      // Reset greeting
      const g = Utils.el('greeting');
      if (g) g.textContent = 'Water Tracker';
      // Navigate to home tab first
      Router.navigate('home');
      // Show login screen on top
      LoginScreen.show();
      Utils.showToast('👋 Signed out successfully');
    });

    /* Save goal — everyone */
    Utils.el('saveGoalBtn')?.addEventListener('click', () => {
      const val = parseInt(Utils.el('goalInput').value);
      if (isNaN(val) || val < 500) { Utils.showToast('⚠️ Minimum goal is 500 ml'); return; }
      Storage.setGoal(val);
      Utils.showToast('🎯 Daily goal updated!');
    });

    if (!isAdmin) return; /* ── below: admin only ── */

    /* Connect Firebase */
    Utils.el('connectFirebaseBtn')?.addEventListener('click', async () => {
      const config = {};
      document.querySelectorAll('.settings-fb-input')
        .forEach(inp => { config[inp.dataset.key] = inp.value.trim(); });
      if (!config.apiKey || !config.projectId) {
        setStatus('⚠️ API Key and Project ID are required', 'error'); return;
      }
      setStatus('⏳ Connecting to Firebase…', 'loading');
      Utils.el('connectFirebaseBtn').disabled = true;
      const result = await Firebase.init(config);
      if (result.success) {
        setStatus('✅ Connected! Data now syncs to Firestore.', 'success');
        const badge = Utils.el('dbBadge');
        if (badge) { badge.textContent = '🔥'; badge.title = 'Firebase connected'; }
        setTimeout(renderForRole, 1800);
      } else {
        setStatus(`❌ ${result.error}`, 'error');
        Utils.el('connectFirebaseBtn').disabled = false;
      }
    });

    /* Disconnect */
    Utils.el('disconnectBtn')?.addEventListener('click', () => {
      if (!confirm('Disconnect Firebase? Falls back to local storage.')) return;
      Firebase.clearConfig();
      const badge = Utils.el('dbBadge');
      if (badge) { badge.textContent = '📦'; badge.title = 'Using local storage'; }
      renderForRole();
      Utils.showToast('📦 Switched to local storage');
    });

    /* Clear today */
    Utils.el('resetTodayBtn')?.addEventListener('click', async () => {
      if (!confirm("Clear ALL water data for today? Can't be undone.")) return;
      await Storage.setTotalForDate(Utils.todayString(), 0);
      Utils.showToast('🗑 Today\'s data cleared');
    });

    /* Reset entire DB */
    Utils.el('resetAllBtn')?.addEventListener('click', async () => {
      if (!confirm('⚠️ Delete ALL water intake history permanently?')) return;
      if (!confirm('Last chance — are you absolutely sure?')) return;
      setStatus('⏳ Resetting…', 'loading');
      try {
        await Firebase.resetAllData();
        setStatus('✅ Database reset.', 'success');
        Utils.showToast('💣 All data wiped');
      } catch (e) {
        setStatus(`❌ ${e.message}`, 'error');
      }
    });
  };

  const setStatus = (msg, type) => {
    const el = Utils.el('firebaseStatus');
    if (!el) return;
    const colors = { success:'#137333', error:'#D93025', loading:'#E37400' };
    el.textContent = msg;
    el.style.color = colors[type] || '#202124';
  };

  const init = () => { Router.on('settings', renderForRole); };
  return { init, renderForRole };
})();
