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
    /* Use Utils.getRole() so Maggie is treated as privileged even if Firestore role = "user" */
    const role         = window.Utils?.getRole ? Utils.getRole() : (session?.role || 'user').toLowerCase();
    const isPro        = ['pro', 'maggie', 'admin'].includes(role);
    const isPrivileged = isPro;
    const isConnected = Firebase.isInitialized();
    const email       = session?.email || '';
    const name        = session?.displayName || email.split('@')[0] || 'User';
    const photoURL    = session?.photoURL || null;

    Utils.el('settings-root').innerHTML = `
      <div class="screen-stack">

        <!-- ══ Account tile ══ -->
        <div class="tile settings-account-tile">

          <!-- Avatar row -->
          <div class="settings-account-row" style="margin-bottom:16px;">

            <!-- Tappable avatar with camera badge -->
            <div style="position:relative;flex-shrink:0;cursor:pointer;" title="Tap to change photo">
              ${session?.photoURL
                ? `<img id="settingsAvatar" src="${Utils.escapeHtml(session.photoURL)}"
                    style="width:60px;height:60px;border-radius:50%;object-fit:cover;border:3px solid var(--md-primary);"
                    onerror="this.outerHTML='<div id=settingsAvatar style=width:60px;height:60px;border-radius:50%;background:var(--md-primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:24px;>${name.charAt(0).toUpperCase()}</div>'" />`
                : `<div id="settingsAvatar" style="width:60px;height:60px;border-radius:50%;background:var(--md-primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:24px;">${name.charAt(0).toUpperCase()}</div>`
              }
              <div style="position:absolute;bottom:-2px;right:-2px;width:22px;height:22px;border-radius:50%;background:var(--md-primary);display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid var(--md-surface);">📷</div>
              <input type="file" id="avatarFileInput" accept="image/*"
                style="position:absolute;inset:0;opacity:0;cursor:pointer;border-radius:50%;width:100%;height:100%;" />
            </div>

            <!-- Name + email + badge -->
            <div class="settings-account-info" style="flex:1;min-width:0;">
              <div class="settings-account-name">${Utils.escapeHtml(name)}</div>
              <div class="settings-account-email" style="font-size:12px;">${Utils.escapeHtml(email)}</div>
              <div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:4px;align-items:center;">
                <span class="role-badge ${isAdmin ? 'role-badge--admin' : isPro ? 'role-badge--pro' : 'role-badge--user'}">
                  ${isAdmin ? '🔑 Admin' : isPro ? '⭐ Pro' : '👤 User'}
                </span>
              </div>
            </div>
          </div>

          <!-- Upload status -->
          <div id="avatarStatus" style="font-size:12px;min-height:16px;text-align:center;font-weight:600;margin-bottom:2px;"></div>
          <!-- Remove photo (only shown when photo exists) -->
          ${session?.photoURL ? `
          <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--md-surface-3);">
            <button id="removePhotoBtn" style="
              display:flex;align-items:center;justify-content:center;gap:7px;
              width:100%;padding:10px 14px;border-radius:12px;cursor:pointer;
              background:rgba(217,48,37,0.06);
              border:1.5px solid rgba(217,48,37,0.25);
              color:#D93025;font-size:13px;font-weight:600;
              font-family:var(--font-body);
              transition:all 0.15s;">
              🗑️ Remove Profile Photo
            </button>
          </div>` : ''}

          <!-- Username edit -->
          <div style="border-top:1px solid var(--md-surface-3);padding-top:14px;margin-top:6px;">
            <div style="font-size:11px;font-weight:700;color:var(--md-on-surface-med);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">✏️ Display Name</div>
            <div style="display:flex;gap:8px;">
              <input class="md-input" id="usernameInput" type="text" maxlength="30"
                value="${Utils.escapeHtml(name)}" placeholder="Your name…"
                style="flex:1;padding:10px 14px;font-size:14px;" />
              <button id="saveUsernameBtn" style="
                padding:10px 16px;border-radius:12px;border:none;
                background:var(--md-primary);color:#fff;
                font-size:13px;font-weight:700;cursor:pointer;
                font-family:var(--font-body);white-space:nowrap;">Save</button>
            </div>
            <div id="usernameStatus" style="font-size:12px;min-height:16px;margin-top:6px;font-weight:600;"></div>
          </div>

          <button class="danger-btn" id="signOutBtn" style="margin-top:14px;">🚪 Sign Out</button>
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

        ${!isAdmin && !isPro ? proUpgradeBanner() : ''}

        ${isPrivileged ? `
        <!-- ── Monthly Report Download (Pro/Admin/Maggie) ── -->
        <div class="tile" style="border:1.5px solid rgba(251,188,4,0.3);background:linear-gradient(135deg,rgba(251,188,4,0.05),rgba(255,143,0,0.04));">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="font-size:28px;">📄</div>
            <div style="flex:1;">
              <div style="font-size:14px;font-weight:700;color:var(--md-on-background);">Monthly Report</div>
              <div style="font-size:12px;color:var(--md-on-surface-med);margin-top:2px;">
                Download your hydration data as a PDF
              </div>
            </div>
          </div>
          <button id="downloadReportBtn" style="
            width:100%;margin-top:14px;padding:13px;border-radius:14px;border:none;cursor:pointer;
            background:linear-gradient(135deg,#FBBC04,#F57C00);
            color:#000;font-size:14px;font-weight:800;font-family:var(--font-body);
            box-shadow:0 4px 14px rgba(251,188,4,0.3);transition:all 0.15s;">
            📥 Download This Month's Report
          </button>
        </div>` : ''}

        ${isAdmin ? adminOnlyHTML(isConnected) : userRestrictedBanner()}

      </div>
    `;

    bindEvents(isAdmin);
  };

  /* ── Pro upgrade banner (shown to free users only) ── */
  const proUpgradeBanner = () => `
    <div style="
      border-radius:20px;overflow:hidden;
      background:linear-gradient(135deg,#1A1200,#2C1F00);
      border:1.5px solid rgba(251,188,4,0.35);
      position:relative;
    ">
      <!-- Decorative glow blob -->
      <div style="
        position:absolute;top:-40px;right:-40px;
        width:140px;height:140px;border-radius:50%;
        background:radial-gradient(circle,rgba(251,188,4,0.15),transparent 70%);
        pointer-events:none;
      "></div>

      <div style="padding:22px 20px;position:relative;">

        <!-- Header -->
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
          <div style="font-size:28px;">⭐</div>
          <div>
            <div style="font-size:16px;font-weight:800;color:#FBBC04;letter-spacing:-0.2px;">
              HydrationApp Pro
            </div>
            <div style="font-size:12px;color:rgba(251,188,4,0.6);font-weight:500;">
              Unlock your full potential
            </div>
          </div>
          <div style="
            margin-left:auto;
            background:rgba(251,188,4,0.15);
            color:#FBBC04;font-size:10px;font-weight:800;
            padding:3px 10px;border-radius:99px;
            border:1px solid rgba(251,188,4,0.3);
            white-space:nowrap;
          ">COMING SOON</div>
        </div>

        <!-- Feature list -->
        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="color:#FBBC04;font-size:15px;flex-shrink:0;">✓</div>
            <div>
              <span style="font-size:13px;font-weight:700;color:#fff;">450 AI drink scans</span>
              <span style="font-size:12px;color:rgba(255,255,255,0.5);"> / month</span>
            </div>
            <div style="margin-left:auto;font-size:11px;color:rgba(255,255,255,0.3);">6/day free</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="color:#FBBC04;font-size:15px;flex-shrink:0;">✓</div>
            <div>
              <span style="font-size:13px;font-weight:700;color:#fff;">Unlimited custom drinks</span>
            </div>
            <div style="margin-left:auto;font-size:11px;color:rgba(255,255,255,0.3);">5 free</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;opacity:0.45;">
            <div style="color:#FBBC04;font-size:15px;flex-shrink:0;">✓</div>
            <div>
              <span style="font-size:13px;font-weight:700;color:#fff;">Advanced analytics</span>
              <span style="font-size:11px;color:rgba(255,255,255,0.5);"> — soon</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;opacity:0.45;">
            <div style="color:#FBBC04;font-size:15px;flex-shrink:0;">✓</div>
            <div>
              <span style="font-size:13px;font-weight:700;color:#fff;">⭐ Pro badge on leaderboard</span>
            </div>
          </div>
        </div>

        <!-- Divider -->
        <div style="border-top:1px solid rgba(251,188,4,0.15);margin-bottom:16px;"></div>

        <!-- CTA -->
        <button id="proUpgradeBtn" style="
          width:100%;padding:14px;border-radius:14px;border:none;cursor:pointer;
          background:linear-gradient(135deg,rgba(251,188,4,0.3),rgba(255,143,0,0.2));
          color:#FBBC04;font-size:14px;font-weight:800;font-family:var(--font-body);
          border:1.5px solid rgba(251,188,4,0.4);
          letter-spacing:0.3px;transition:all 0.15s;
        " onclick="SettingsScreen._handleProUpgrade()">
          ✨ Upgrade to Pro — Coming Soon
        </button>

        <div style="font-size:11px;color:rgba(255,255,255,0.25);text-align:center;margin-top:10px;">
          Premium pricing will be announced soon
        </div>
      </div>
    </div>
  `;

  /* ── Admin-only section ── */
  const adminOnlyHTML = (isConnected) => `

    <!-- Drinks Manager -->
    <div class="tile">
      <div class="settings-section-title">🥤 Drink Types</div>
      <div class="settings-section-sub">Changes here apply to <strong>all users</strong> 🌐</div>
      <div id="drinksList" style="margin-top:12px;display:flex;flex-direction:column;gap:8px;"></div>
      <button class="md-btn md-btn--filled md-btn--full" id="addDrinkBtn"
        style="margin-top:12px;border-radius:12px;padding:10px;">+ Add Custom Drink</button>
    </div>

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
    <!-- User private drinks -->
    <div class="tile">
      <div class="settings-section-title">🥤 My Custom Drinks</div>
      <div class="settings-section-sub">These drinks are <strong>visible only to you</strong> 🔒</div>
      <div id="privateDrinksList" style="margin-top:12px;display:flex;flex-direction:column;gap:8px;"></div>
      <button class="md-btn md-btn--filled md-btn--full" id="addPrivateDrinkBtn"
        style="margin-top:12px;border-radius:12px;padding:10px;">+ Add My Custom Drink</button>
    </div>

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

    /* ── Photo upload — uses Profile.uploadPhoto() for smart compression ── */
    Utils.el('avatarFileInput')?.addEventListener('change', async function() {
      const file    = this.files[0];
      if (!file) return;
      const statusEl = Utils.el('avatarStatus');
      statusEl.textContent = '⏳ Compressing & uploading…';
      statusEl.style.color = 'var(--md-on-surface-med)';
      try {
        /* Profile.uploadPhoto handles compression (quality ladder down to 150KB)
           then uploads to Cloudinary. No size limit — any resolution is accepted. */
        const url = await Profile.uploadPhoto(file);

        /* Save URL to Firestore + patch session */
        await Profile.saveProfile({ photoURL: url });

        /* Update avatar circle in tile */
        const av = Utils.el('settingsAvatar');
        if (av) {
          const img = document.createElement('img');
          img.id = 'settingsAvatar';
          img.src = url;
          img.style.cssText = 'width:60px;height:60px;border-radius:50%;object-fit:cover;border:3px solid var(--md-primary);';
          av.replaceWith(img);
        }

        /* Update header */
        if (window.App) App.updateHeaderAvatar(Auth.getSession());
        if (window.Leaderboard) Leaderboard.publishStreak(Firebase.getUserId()).catch(() => {});

        statusEl.textContent = '✅ Photo updated!';
        statusEl.style.color = '#34A853';
        Utils.showToast('📷 Profile photo updated!');
      } catch (err) {
        statusEl.textContent = '❌ ' + err.message;
        statusEl.style.color = '#D93025';
      }
      this.value = '';
    });

    /* ── Monthly report download ── */
    Utils.el('downloadReportBtn')?.addEventListener('click', () => {
      DataExport.downloadMonthlyPDF();
    });

    /* ── Remove photo ── */
    Utils.el('removePhotoBtn')?.addEventListener('click', async () => {
      if (!confirm('Remove your profile photo?')) return;
      const uid     = Firebase.getUserId();
      const session = Auth.getSession();
      try {
        if (uid) await firebase.firestore().collection('users').doc(uid).set({ photoURL: null }, { merge: true });
        Auth.saveSession({ ...session, photoURL: null }, session?.rememberMe !== false);
        /* Reset settings avatar to letter circle */
        const av = Utils.el('settingsAvatar');
        if (av) {
          const letter = (session?.displayName || session?.email || '?').charAt(0).toUpperCase();
          const div = document.createElement('div');
          div.id = 'settingsAvatar';
          div.style.cssText = 'width:60px;height:60px;border-radius:50%;background:var(--md-primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:24px;';
          div.textContent = letter;
          av.replaceWith(div);
        }
        /* Reset header avatar back to 💧 dewdrop */
        const hav = Utils.el('headerAvatar');
        if (hav) {
          hav.style.background = 'var(--md-primary-light)';
          hav.style.fontSize   = '20px';
          hav.innerHTML        = '💧';
        }
        /* Hide remove button */
        Utils.el('removePhotoBtn')?.closest('div')?.remove();
        if (window.Leaderboard && uid) Leaderboard.publishStreak(uid).catch(() => {});
        Utils.showToast('🗑 Photo removed');
      } catch(err) {
        Utils.showToast('❌ ' + err.message);
      }
    });

    /* ── Username save ── */
    Utils.el('saveUsernameBtn')?.addEventListener('click', async () => {
      const input  = Utils.el('usernameInput');
      const status = Utils.el('usernameStatus');
      const newName = (input?.value || '').trim();
      if (newName.length < 2) { status.textContent = '⚠️ Min 2 characters'; status.style.color = '#D93025'; return; }
      if (newName.length > 30) { status.textContent = '⚠️ Max 30 characters'; status.style.color = '#D93025'; return; }
      const btn = Utils.el('saveUsernameBtn');
      btn.textContent = '⏳'; btn.disabled = true;
      try {
        const session = Auth.getSession();
        const uid     = Firebase.getUserId();
        /* Save to Firestore */
        if (uid) {
          await firebase.firestore().collection('users').doc(uid).set({ displayName: newName }, { merge: true });
          await firebase.firestore().collection('Roles').doc((session?.email || '').toLowerCase())
            .set({ displayName: newName }, { merge: true }).catch(()=>{});
        }
        /* Patch session */
        Auth.saveSession({ ...session, displayName: newName }, session?.rememberMe !== false);
        /* Update header */
        const greetEl = Utils.el('greeting');
        if (greetEl) {
          // maggieTag removed — Pro badge handled below
          const _em3 = (session?.email||'').toLowerCase().trim();
          const _isMaggie = _em3.startsWith('sampadagupta') && _em3.endsWith('@gmail.com');
          const _isPro = (session?.role||'').toLowerCase().trim() === 'pro' || _isMaggie;
          const _badge = Auth.isAdmin() ? '<span class="admin-badge">Admin</span>' : _isPro ? '<span class="role-badge role-badge--pro">Pro</span>' : '👋';
          greetEl.innerHTML = `Hey, ${Utils.escapeHtml(newName)} ${_badge}`;
        }
        const nameEl = document.querySelector('.settings-account-name');
        if (nameEl) nameEl.textContent = newName;
        if (uid && window.Leaderboard) Leaderboard.publishStreak(uid).catch(()=>{});
        status.textContent = '✅ Name updated!'; status.style.color = '#34A853';
        Utils.showToast('✏️ Username updated!');
      } catch(err) {
        status.textContent = '❌ ' + err.message; status.style.color = '#D93025';
      }
      btn.textContent = 'Save'; btn.disabled = false;
    });

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
      // CHANGE-3: re-publish streak with updated goal so leaderboard reflects new target
      const uid = Firebase.getUserId();
      if (uid && window.Leaderboard) Leaderboard.publishStreak(uid).catch(() => {});
      HomeScreen.updateUI();
    });

    /* Private drinks (all users) */
    if (Utils.el('addPrivateDrinkBtn')) {
      _PrivateDrinksUI.renderList();
      Utils.el('addPrivateDrinkBtn').addEventListener('click', () => _PrivateDrinksUI.showForm(null));
    }

    if (!isAdmin) return;

    /* Drinks manager — render list and wire add button */
    _DrinksUI.renderList();
    Utils.el('addDrinkBtn')?.addEventListener('click', () => _DrinksUI.showForm(null));

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

/* ══════════════════════════════════════════════════════════════
   PRO UPGRADE — Razorpay-ready hook
   ──────────────────────────────────────────────────────────────
   When you're ready to launch Pro, replace this function with:

   SettingsScreen._handleProUpgrade = async () => {
     const session = Auth.getSession();
     const options = {
       key: 'rzp_live_XXXXXXXXX',      // ← your Razorpay live key
       amount: 9900,                    // ₹99 in paise
       currency: 'INR',
       name: 'HydrationApp',
       description: 'Pro — 450 scans/month',
       image: 'assets/icon-192.png',
       prefill: { email: session?.email || '' },
       theme: { color: '#FBBC04' },
       handler: async (response) => {
         // Payment successful — promote user to Pro
         const uid = Firebase.getUserId();
         const email = (session?.email || '').toLowerCase();
         await firebase.firestore().collection('Roles').doc(email)
           .set({ role: 'pro' }, { merge: true });
         await firebase.firestore().collection('users').doc(uid)
           .set({ role: 'pro' }, { merge: true });
         Auth.saveSession({ ...session, role: 'pro' }, true);
         Utils.showToast('🎉 Welcome to Pro!');
         SettingsScreen.renderForRole();
       },
     };
     const rzp = new window.Razorpay(options);
     rzp.open();
   };

   Also add this script to index.html before app.js:
   <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
   ══════════════════════════════════════════════════════════════ */
SettingsScreen._handleProUpgrade = () => {
  Utils.showToast('✨ Pro is coming soon — stay tuned!');
};

/* ══ Drinks manager helpers ══ */
const _DrinksUI = {};

_DrinksUI.renderList = function renderDrinksList() {
  const el = Utils.el('drinksList');
  if (!el) return;
  const drinks = Drinks.getAll();
  el.innerHTML = drinks.map(d => `
    <div class="drink-row" data-id="${d.id}">
      <span class="drink-row-emoji">${d.emoji}</span>
      <div class="drink-row-info">
        <div class="drink-row-name">${d.name}</div>
        <div class="drink-row-pct">${d.hydration >= 0 ? d.hydration + '% hydration' : d.hydration + '% (dehydrating)'}</div>
      </div>
      ${d.locked
        ? '<span class="drink-row-badge">built-in</span>'
        : `<button class="drink-row-edit" data-id="${d.id}">Edit</button>
           <button class="drink-row-del"  data-id="${d.id}">✕</button>`
      }
    </div>
  `).join('');

  el.querySelectorAll('.drink-row-edit').forEach(btn => {
    btn.addEventListener('click', () => _DrinksUI.showForm(Drinks.getById(btn.dataset.id)));
  });
  el.querySelectorAll('.drink-row-del').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this drink type?')) return;
      await Drinks.remove(btn.dataset.id);
      _DrinksUI.renderList();
      Utils.showToast('🗑 Drink removed');
    });
  });
};

_DrinksUI.showForm = function showDrinkForm(existing) {
  const isEdit = !!existing;
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.innerHTML = `
    <div class="drink-sheet open" style="padding-bottom:24px;">
      <div class="sheet-handle"></div>
      <div class="sheet-title">${isEdit ? 'Edit Drink' : 'New Drink Type'}</div>
      <div style="display:flex;flex-direction:column;gap:14px;margin-top:8px;">

        <div>
          <label style="font-size:12px;color:var(--md-on-surface-med);font-weight:600;">EMOJI</label>
          <input class="md-input" id="dfEmoji" type="text" maxlength="2"
            value="${existing?.emoji || '🥤'}" style="margin-top:6px;font-size:24px;text-align:center;width:60px;" />
        </div>

        <div>
          <label style="font-size:12px;color:var(--md-on-surface-med);font-weight:600;">NAME</label>
          <input class="md-input" id="dfName" type="text" maxlength="20"
            value="${existing?.name || ''}" placeholder="e.g. Green Tea" style="margin-top:6px;" />
        </div>

        <div>
          <label style="font-size:12px;color:var(--md-on-surface-med);font-weight:600;">
            HYDRATION: <span id="dfPctLabel">${existing?.hydration ?? 90}%</span>
          </label>
          <input type="range" id="dfHydration" min="-50" max="100" step="5"
            value="${existing?.hydration ?? 90}" style="width:100%;margin-top:8px;" />
          <div style="font-size:11px;color:var(--md-on-surface-low);margin-top:4px;" id="dfHintText">
            ${_DrinksUI.hydrationHint(existing?.hydration ?? 90)}
          </div>
        </div>

      </div>
      <div style="display:flex;gap:10px;margin-top:20px;">
        <button class="md-btn md-btn--full" id="dfCancel"
          style="border-radius:12px;padding:12px;flex:1;">Cancel</button>
        <button class="md-btn md-btn--filled md-btn--full" id="dfSave"
          style="border-radius:12px;padding:12px;flex:2;">
          ${isEdit ? '💾 Save Changes' : '+ Add Drink'}
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const slider = overlay.querySelector('#dfHydration');
  slider.addEventListener('input', () => {
    overlay.querySelector('#dfPctLabel').textContent  = slider.value + '%';
    overlay.querySelector('#dfHintText').textContent  = _DrinksUI.hydrationHint(parseInt(slider.value));
  });

  overlay.querySelector('#dfCancel').addEventListener('click', () => overlay.remove());

  overlay.querySelector('#dfSave').addEventListener('click', async () => {
    const emoji     = overlay.querySelector('#dfEmoji').value.trim() || '🥤';
    const name      = overlay.querySelector('#dfName').value.trim();
    const hydration = parseInt(slider.value);
    if (!name) { Utils.showToast('⚠️ Enter a drink name'); return; }
    const btn = overlay.querySelector('#dfSave');
    btn.textContent = '⏳ Saving…';
    btn.disabled = true;
    try {
      if (isEdit) {
        await Drinks.update(existing.id, { emoji, name, hydration });
        Utils.showToast('✅ Drink updated');
      } else {
        await Drinks.add({ emoji, name, hydration, locked: false });
        Utils.showToast('✅ Drink added');
      }
    } catch (e) {
      Utils.showToast('⚠️ Saved locally (Firestore: ' + e.message + ')');
    }
    overlay.remove();
    _DrinksUI.renderList();
  });
};

_DrinksUI.hydrationHint = function hydrationHint(pct) {
  if (pct === 100) return '100% — pure hydration (water)';
  if (pct >= 80)   return 'Mostly hydrating';
  if (pct >= 50)   return 'Partially hydrating';
  if (pct >= 0)    return 'Low hydration value';
  return 'Dehydrating — will subtract from your total';
};

/* ══ Private Drinks UI (per-user) ══ */
const _PrivateDrinksUI = {};

_PrivateDrinksUI.renderList = function() {
  const el = Utils.el('privateDrinksList');
  if (!el) return;
  const drinks = Drinks.getPrivateAll();
  if (!drinks.length) {
    el.innerHTML = '<div style="font-size:13px;color:var(--md-on-surface-med);padding:8px 0;">No custom drinks yet. Add one!</div>';
    return;
  }
  el.innerHTML = drinks.map(d => `
    <div class="drink-row" data-id="${d.id}">
      <span class="drink-row-emoji">${d.emoji}</span>
      <div class="drink-row-info">
        <div class="drink-row-name">${Utils.escapeHtml(d.name)} <span style="font-size:10px;background:#E8F0FE;color:#1A73E8;padding:1px 6px;border-radius:4px;">Private</span></div>
        <div class="drink-row-pct">${d.hydration >= 0 ? d.hydration + '% hydration' : d.hydration + '% (dehydrating)'}</div>
      </div>
      <button class="drink-row-edit" data-id="${d.id}">Edit</button>
      <button class="drink-row-del" data-id="${d.id}">✕</button>
    </div>
  `).join('');

  el.querySelectorAll('.drink-row-edit').forEach(btn => {
    btn.addEventListener('click', () => _PrivateDrinksUI.showForm(Drinks.getPrivateAll().find(d => d.id === btn.dataset.id)));
  });
  el.querySelectorAll('.drink-row-del').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this drink?')) return;
      await Drinks.removePrivate(btn.dataset.id);
      _PrivateDrinksUI.renderList();
      Utils.showToast('🗑 Custom drink removed');
    });
  });
};

_PrivateDrinksUI.showForm = function(existing) {
  const isEdit = !!existing;
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.innerHTML = `
    <div class="drink-sheet open" style="padding-bottom:24px;">
      <div class="sheet-handle"></div>
      <div class="sheet-title">${isEdit ? 'Edit My Drink' : 'New Private Drink'}</div>
      <div style="background:#E8F0FE;border-radius:10px;padding:8px 12px;margin-bottom:14px;font-size:12px;color:#1A73E8;">
        🔒 Only visible to you — not shared with other users
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;margin-top:8px;">
        <div>
          <label style="font-size:12px;color:var(--md-on-surface-med);font-weight:600;">EMOJI</label>
          <input class="md-input" id="pdfEmoji" type="text" maxlength="2"
            value="${existing?.emoji || '🥤'}" style="margin-top:6px;font-size:24px;text-align:center;width:60px;" />
        </div>
        <div>
          <label style="font-size:12px;color:var(--md-on-surface-med);font-weight:600;">NAME</label>
          <input class="md-input" id="pdfName" type="text" maxlength="20"
            value="${existing?.name || ''}" placeholder="e.g. My Protein Shake" style="margin-top:6px;" />
        </div>
        <div>
          <label style="font-size:12px;color:var(--md-on-surface-med);font-weight:600;">
            HYDRATION: <span id="pdfPctLabel">${existing?.hydration ?? 90}%</span>
          </label>
          <input type="range" id="pdfHydration" min="-50" max="100" step="5"
            value="${existing?.hydration ?? 90}" style="width:100%;margin-top:8px;" />
          <div style="font-size:11px;color:var(--md-on-surface-low);margin-top:4px;" id="pdfHintText">
            ${_DrinksUI.hydrationHint(existing?.hydration ?? 90)}
          </div>
        </div>
      </div>
      <div style="display:flex;gap:10px;margin-top:20px;">
        <button class="md-btn md-btn--full" id="pdfCancel" style="border-radius:12px;padding:12px;flex:1;">Cancel</button>
        <button class="md-btn md-btn--filled md-btn--full" id="pdfSave" style="border-radius:12px;padding:12px;flex:2;">
          ${isEdit ? '💾 Save Changes' : '+ Add Drink'}
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const slider = overlay.querySelector('#pdfHydration');
  slider.addEventListener('input', () => {
    overlay.querySelector('#pdfPctLabel').textContent = slider.value + '%';
    overlay.querySelector('#pdfHintText').textContent = _DrinksUI.hydrationHint(parseInt(slider.value));
  });

  overlay.querySelector('#pdfCancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#pdfSave').addEventListener('click', async () => {
    const emoji     = overlay.querySelector('#pdfEmoji').value.trim() || '🥤';
    const name      = overlay.querySelector('#pdfName').value.trim();
    const hydration = parseInt(slider.value);
    if (!name) { Utils.showToast('⚠️ Enter a drink name'); return; }
    const btn = overlay.querySelector('#pdfSave');
    btn.textContent = '⏳ Saving…'; btn.disabled = true;
    try {
      if (isEdit) {
        await Drinks.updatePrivate(existing.id, { emoji, name, hydration });
        Utils.showToast('✅ Drink updated');
      } else {
        await Drinks.addPrivate({ emoji, name, hydration });
        Utils.showToast('✅ Private drink added');
      }
    } catch(e) {
      Utils.showToast('⚠️ ' + e.message);
    }
    overlay.remove();
    _PrivateDrinksUI.renderList();
  });
};
