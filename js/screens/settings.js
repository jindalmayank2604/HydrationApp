/* ══════════════════════════════════════════
   SCREEN: Settings
   Admin → sees Firebase status + danger zone
   User  → sees goal + account only
   ══════════════════════════════════════════ */

const SettingsScreen = (() => {

  const render = () => renderForRole();

  const renderForRole = () => {
    const isAdmin     = Auth.isAdmin();
    const session     = Auth.getSession();
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

        ${isAdmin ? adminOnlyHTML(isConnected) : userRestrictedBanner()}

      </div>
    `;

    bindEvents(isAdmin);
  };

  /* ── Admin-only section ── */
  const adminOnlyHTML = (isConnected) => `

    <!-- Firebase Status -->
    <div class="settings-status-tile ${isConnected ? 'connected' : 'disconnected'}">
      <div class="settings-status-icon">${isConnected ? '🔥' : '📦'}</div>
      <div class="settings-status-info">
        <div class="settings-status-title">${isConnected ? 'Firebase Connected' : 'Connecting…'}</div>
        <div class="settings-status-sub">${isConnected ? 'Data syncing to Firestore — separate per user' : 'Not connected yet'}</div>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="tile" style="border:2px solid #FFCDD2;">
      <div class="settings-section-title" style="color:#D93025;">⚠️ Danger Zone</div>
      <div class="settings-section-sub">Admin-only. Affects YOUR data only. Permanent.</div>
      <div id="dangerStatus" style="margin:8px 0;min-height:20px;font-size:13px;font-weight:600;"></div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:4px;">
        <button class="danger-btn" id="resetTodayBtn">🗑 Clear My Today's Data</button>
        <button class="danger-btn danger-btn--hard" id="resetAllBtn">💣 Reset My Entire History</button>
      </div>
    </div>
  `;

  /* ── Non-admin banner ── */
  const userRestrictedBanner = () => `
    <div class="tile locked-banner">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:28px;">🔒</span>
        <div>
          <div class="locked-title">Admin Settings Locked</div>
          <div class="locked-sub">Database controls are only accessible to the admin.</div>
        </div>
      </div>
    </div>
  `;

  /* ── Events ── */
  const bindEvents = (isAdmin) => {

    /* Sign out */
    Utils.el('signOutBtn')?.addEventListener('click', async () => {
      if (!confirm('Sign out?')) return;
      await Auth.signOut();
      Firebase.resetUserId();
      Router.navigate('home');
      LoginScreen.show();
      Utils.showToast('👋 Signed out');
    });

    /* Save goal */
    Utils.el('saveGoalBtn')?.addEventListener('click', () => {
      const val = parseInt(Utils.el('goalInput').value);
      if (isNaN(val) || val < 500) { Utils.showToast('⚠️ Minimum goal is 500 ml'); return; }
      Storage.setGoal(val);
      Utils.showToast('🎯 Daily goal updated!');
      HomeScreen.updateUI();
    });

    if (!isAdmin) return;

    /* Clear today — only affects logged-in user's Firestore data */
    Utils.el('resetTodayBtn')?.addEventListener('click', async () => {
      if (!confirm("Clear ALL water data for today? Can't be undone.")) return;
      setStatus('⏳ Clearing…', 'loading');
      try {
        await Storage.setTotalForDate(Utils.todayString(), 0);
        setStatus('✅ Today\'s data cleared', 'success');
        Utils.showToast('🗑 Today\'s data cleared');
        HomeScreen.updateUI();
      } catch (e) {
        setStatus('❌ ' + e.message, 'error');
      }
    });

    /* Reset all — only affects logged-in user's Firestore data */
    Utils.el('resetAllBtn')?.addEventListener('click', async () => {
      if (!confirm('⚠️ Delete ALL your water intake history permanently?')) return;
      if (!confirm('Last chance — are you absolutely sure?')) return;
      setStatus('⏳ Resetting…', 'loading');
      try {
        await Firebase.resetAllData();
        setStatus('✅ Your history wiped', 'success');
        Utils.showToast('💣 All your data wiped');
        HomeScreen.updateUI();
      } catch (e) {
        setStatus('❌ ' + e.message, 'error');
        Utils.showToast('❌ Reset failed: ' + e.message);
      }
    });
  };

  const setStatus = (msg, type) => {
    const el = Utils.el('dangerStatus');
    if (!el) return;
    const colors = { success: '#137333', error: '#D93025', loading: '#E37400' };
    el.textContent = msg;
    el.style.color = colors[type] || '#202124';
  };

  const init = () => { Router.on('settings', renderForRole); };
  return { init, renderForRole };
})();
