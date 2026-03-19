/* ══════════════════════════════════════════
   APP — Entry point
   ══════════════════════════════════════════ */

const App = (() => {

  /* ── Update header avatar from session ── */
  const _updateHeaderAvatar = (session) => {
    const el   = Utils.el('headerAvatar');
    if (!el) return;
    const name = session?.displayName || session?.email?.split('@')[0] || '';
    const url  = session?.photoURL || null;
    if (url) {
      // Show profile photo
      el.style.background = 'transparent';
      el.style.fontSize   = '0';
      el.innerHTML = `<img src="${url}"
        style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;"
        onerror="this.parentElement.innerHTML='${name.charAt(0).toUpperCase() || '💧'}';this.parentElement.style.fontSize='18px';this.parentElement.style.background='var(--md-primary-light)';"
      />`;
    } else {
      // No photo — always show the 💧 dewdrop (original default)
      el.style.background = 'var(--md-primary-light)';
      el.style.fontSize   = '20px';
      el.innerHTML        = '💧';
    }
  };

  /* ── Called after successful login ── */
  const onAuthReady = async (authResult) => {
    const session = Auth.getSession();
    if (!session) { LoginScreen.show(); return; }

    // Hide login overlay
    LoginScreen.hide();

    // CRITICAL: set userId immediately so all data ops use correct user path
    if (session.uid) {
      Firebase.setUserId(session.uid);
      console.log('[App] onAuthReady — userId set to:', session.uid, 'email:', session.email);
    }

    // Update header greeting + avatar
    const greetingEl = Utils.el('greeting');
    const isAdmin  = Auth.isAdmin();
    const _email   = (session.email || '').toLowerCase().trim();
    const isMaggie = _email === 'sampadagupta070@gmail.com';
    const isPro    = (session.role || '').toLowerCase().trim() === 'pro' || isMaggie;
    if (greetingEl) {
      const name = session.displayName || session.email?.split('@')[0] || 'there';
      let badgeHTML = '👋';
      if (isAdmin)        badgeHTML = '<span class="admin-badge">Admin</span>';
      else if (isPro)     badgeHTML = '<span class="role-badge role-badge--pro">Pro</span>';
      greetingEl.innerHTML = `Hey, ${name} ${badgeHTML}`;
    }
    // Render profile photo in header
    _updateHeaderAvatar(session);

    if (Router.getCurrent() === 'settings') {
      SettingsScreen.renderForRole();
    }

    // Check if survey was done on another device — if not, show it now
    if (window.SurveyScreen && !SurveyScreen.isDoneLocally()) {
      const donOnOtherDevice = await SurveyScreen.checkAfterLogin(session.uid);
      if (!donOnOtherDevice) {
        // New user — show survey now (after login, we have uid to save to Firestore)
        SurveyScreen.show((goal) => {
          if (goal) LocalStorage.setGoal(goal);
          // Refresh home screen with new goal
          if (window.HomeScreen) HomeScreen.updateUI();
        }, session.uid);
      }
    }

    // Sync shared drinks from Firestore for ALL users
    Drinks.syncFromFirestore().catch(() => {});
    // Sync user's private custom drinks
    if (window.Drinks && Drinks.syncPrivateFromFirestore) {
      Drinks.syncPrivateFromFirestore().catch(() => {});
    }

    // Publish verified streak to leaderboard
    if (window.Leaderboard && session.uid) {
      setTimeout(() => Leaderboard.publishStreak(session.uid).catch(()=>{}), 3000);
    }

    // Weather-based smart goal popup (non-blocking, only before noon, once per day)
    if (window.WeatherGoal) WeatherGoal.tryShow().catch(() => {});

    // Init AI scan FAB
    AIScan.initFAB();

    Utils.showToast(isAdmin ? '🔑 Admin access granted' : '👋 Welcome back!');
  };

  /* ── Main init ── */
  const init = async () => {
    Utils.el('headerDate').textContent = Utils.getHeaderDate();

    // Init all screens
    Router.init();
    HomeScreen.init();
    HistoryScreen.init();
    AnalyticsScreen.init();
    ReminderScreen.init();
    SettingsScreen.init();

    const session = Auth.getSession();

    // Set userId BEFORE autoInit so Firebase uses correct user path from the start
    if (session?.uid) Firebase.setUserId(session.uid);

    // Connect Firebase in background — set userId immediately when ready
    Firebase.autoInit().then(ok => {
      const badge = Utils.el('dbBadge');
      if (badge) badge.textContent = ok ? '🔥' : '📦';
      const currentSession = Auth.getSession();
      if (currentSession?.uid) {
        Firebase.setUserId(currentSession.uid);
        console.log('Firebase ready, userId set:', currentSession.uid);
      }

      // ── Auto-login after email verification ──
      // When user clicks the verification link, Firebase redirects back to the app
      // onAuthStateChanged fires with the verified user — log them in automatically
      if (window.firebase && firebase.auth) {
        firebase.auth().onAuthStateChanged(async (user) => {
          if (!user) return;
          const existingSession = Auth.getSession();
          // Only auto-login if no session exists (fresh verification)
          if (existingSession) return;
          if (!user.emailVerified) {
            console.log('[App] Auth state: user not verified yet');
            return;
          }
          console.log('[App] Email verified! Auto-logging in:', user.email);
          // Fetch or create role
          let role = await Auth.fetchRoleFromFirestore(user.email);
          if (!role) {
            // Create role for new user
            try {
              await firebase.firestore().collection('Roles').doc(user.email.toLowerCase()).set(
                { role:'user', uid:user.uid, createdAt:firebase.firestore.FieldValue.serverTimestamp() },
                { merge:true }
              );
              role = 'user';
            } catch(e) { console.warn('[App] Role create failed:', e.message); role = 'user'; }
          }
          // Save session and proceed
          Auth.saveSession({
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL || null,
            uid: user.uid,
            role,
          }, true);
          Utils.showToast('✅ Email verified! Welcome ' + (user.displayName || user.email.split('@')[0]) + '!');
          // Hide any login/verify overlay and go to app
          LoginScreen.hide();
          const verifyOverlay = document.getElementById('surveyOverlay');
          if (verifyOverlay) verifyOverlay.remove();
          await onAuthReady(Auth.getSession());
        });
      }
    });

    console.log('[App] session:', session ? 'EXISTS rememberMe='+session.rememberMe : 'NULL');
    console.log('[App] SurveyScreen.isDone():', SurveyScreen.isDone());

    if (session && session.rememberMe) {
      console.log('[App] → Branch: rememberMe session, skipping login');
      LoginScreen.hide();
      await onAuthReady(session);
    } else if (session && !session.rememberMe) {
      console.log('[App] → Branch: session exists, no rememberMe → LoginScreen');
      LoginScreen.show();
    } else {
      console.log('[App] → Branch: NO session → showing survey then login');
      LoginScreen.hide();
      if (!SurveyScreen.isDone()) {
        console.log('[App] → Survey not done, calling SurveyScreen.show()');
        SurveyScreen.show((goal) => {
          console.log('[App] → Survey complete, goal:', goal, '→ showing login');
          if (goal) LocalStorage.setGoal(goal);
          LoginScreen.show();
        }, null);
      } else {
        console.log('[App] → Survey done → LoginScreen');
        LoginScreen.show();
      }
    }

    // Restore active reminder
    const prefs = Storage.getReminderPrefs();
    if (prefs.enabled) Notifier.start(prefs.interval).catch(() => {});

    setInterval(() => {
      Utils.el('headerDate').textContent = Utils.getHeaderDate();
    }, 60_000);
  };

  return { init, onAuthReady, updateHeaderAvatar: _updateHeaderAvatar };
})();

document.addEventListener('DOMContentLoaded', () => {
  // Dark mode toggle — init before app
  const darkToggle = document.getElementById('darkModeToggle');
  if (darkToggle) {
    const isDark = localStorage.getItem('wt_dark_mode') === 'true';
    darkToggle.textContent = isDark ? '☀️' : '🌙';
    darkToggle.addEventListener('click', () => {
      const nowDark = document.body.classList.toggle('dark-mode');
      localStorage.setItem('wt_dark_mode', nowDark);
      darkToggle.textContent = nowDark ? '☀️' : '🌙';
    });
  }
  Utils.initRipples();
  App.init();
});
