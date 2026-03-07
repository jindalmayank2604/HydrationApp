/* ══════════════════════════════════════════
   APP — Entry point
   ══════════════════════════════════════════ */

const App = (() => {

  /* ── Called after successful login ── */
  const onAuthReady = async (authResult) => {
    const session = Auth.getSession();
    if (!session) { LoginScreen.show(); return; }

    // Hide login overlay
    LoginScreen.hide();

    // Set Firebase userId to logged-in user's uid for data isolation
    if (session.uid) Firebase.setUserId(session.uid);

    // Update header greeting
    const greetingEl = Utils.el('greeting');
    const isAdmin = Auth.isAdmin();
    if (greetingEl) {
      const DISPLAY_NAMES = {
        'sampadagupta070@gmail.com': 'Maggie',
      };
      const rawName = session.displayName || session.email.split('@')[0];
      const name = DISPLAY_NAMES[session.email?.toLowerCase()] || rawName;
      greetingEl.innerHTML = `Hey, ${name} ${isAdmin ? '<span class="admin-badge">Admin</span>' : '👋'}`;
    }

    if (Router.getCurrent() === 'settings') {
      SettingsScreen.renderForRole();
    }

    Utils.showToast(isAdmin ? '🔑 Admin access granted' : '👋 Welcome back!');
  };

  /* ── Main init ── */
  const init = async () => {
    Utils.el('headerDate').textContent = Utils.getHeaderDate();

    // Init all screens
    Router.init();
    HomeScreen.init();
    HistoryScreen.init();
    ReminderScreen.init();
    SettingsScreen.init();

    const session = Auth.getSession();

    // Set userId BEFORE autoInit so Firebase uses correct user path from the start
    if (session?.uid) Firebase.setUserId(session.uid);

    // Connect Firebase in background — set userId immediately when ready
    Firebase.autoInit().then(ok => {
      const badge = Utils.el('dbBadge');
      if (badge) badge.textContent = ok ? '🔥' : '📦';
      // Always re-set userId after init — critical for data isolation
      const currentSession = Auth.getSession();
      if (currentSession?.uid) {
        Firebase.setUserId(currentSession.uid);
        console.log('Firebase ready, userId set:', currentSession.uid);
      }
    });

    if (session && session.rememberMe) {
      // "Remember me" was checked — skip login entirely, go straight to app
      LoginScreen.hide();
      await onAuthReady(session);
    } else if (session && !session.rememberMe) {
      // Session exists but no remember me — still show login (1-day expiry handled by getSession)
      LoginScreen.show();
    } else {
      // No session at all — show login
      LoginScreen.show();
    }

    // Restore active reminder
    const prefs = Storage.getReminderPrefs();
    if (prefs.enabled) Notifier.start(prefs.interval).catch(() => {});

    setInterval(() => {
      Utils.el('headerDate').textContent = Utils.getHeaderDate();
    }, 60_000);
  };

  return { init, onAuthReady };
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
  App.init();
});
