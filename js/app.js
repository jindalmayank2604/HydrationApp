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

  /* ── Update header date + weather temperature ── */
  const _updateHeaderDate = async () => {
    const dateEl = Utils.el('headerDate');
    if (!dateEl) return;
    const dateStr = Utils.getHeaderDate();
    // Always set plain date immediately
    dateEl.textContent = dateStr;
    // Then try to enrich with weather — geolocation first, IP fallback second
    try {
      let lat = null, lon = null;
      // Try geolocation with short timeout
      const geoResult = await new Promise((resolve) => {
        if (!navigator.geolocation) { resolve(null); return; }
        navigator.geolocation.getCurrentPosition(
          pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          ()   => resolve(null),
          { timeout: 5000, maximumAge: 600_000 }
        );
      });
      if (geoResult) {
        lat = geoResult.lat; lon = geoResult.lon;
      } else {
        // IP-based fallback via ipapi.co (free, no key needed)
        try {
          const ctrl   = new AbortController();
          setTimeout(() => ctrl.abort(), 5000);
          const ipRes  = await window.fetch('https://ipapi.co/json/', { signal: ctrl.signal });
          const ipData = await ipRes.json();
          if (ipData.latitude && ipData.longitude) {
            lat = ipData.latitude; lon = ipData.longitude;
          }
        } catch (e2) { /* IP lookup also failed */ }
      }
      if (lat === null) return; // no location available
      // Fetch current weather from Open-Meteo
      const ctrl2  = new AbortController();
      setTimeout(() => ctrl2.abort(), 6000);
      const url    = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,weather_code&temperature_unit=celsius&timezone=auto`;
      const res    = await window.fetch(url, { signal: ctrl2.signal });
      const data   = await res.json();
      const cur    = data.current;
      if (cur && typeof cur.temperature_2m === 'number') {
        const temp = Math.round(cur.temperature_2m);
        const icon = window.Weather ? Weather.getIcon(cur.weather_code) : '🌡️';
        dateEl.textContent = `${dateStr} · ${icon} ${temp}°C`;
      }
    } catch (e) {
      console.warn('[App] Header weather failed:', e.message);
    }
  };
  const onAuthReady = async (authResult) => {
    let session = Auth.getSession();
    if (!session) { LoginScreen.show(); return; }

    // Hide login overlay
    LoginScreen.hide();

    // CRITICAL: set userId immediately so all data ops use correct user path
    if (session.uid) {
      Firebase.setUserId(session.uid);
      console.log('[App] onAuthReady — userId set to:', session.uid, 'email:', session.email);
    }

    // ALWAYS enforce Maggie's pro role immediately — no Firestore needed
    // This runs before any async ops so settings always renders correctly
    const _sessEmail = (session.email || '').toLowerCase().trim();
    if (_sessEmail.startsWith('sampadagupta') && _sessEmail.endsWith('@gmail.com')) {
      if ((session.role || '').toLowerCase().trim() !== 'pro') {
        Auth.saveSession({ ...session, role: 'pro' }, session.rememberMe !== false);
        session = Auth.getSession();
      }
    }

    // Refresh displayName + photoURL from Firestore once Firebase is ready
    // Use a small delay to let Firebase.autoInit() complete first
    if (session.uid) {
      const _doProfileRefresh = async () => {
        // Wait for Firebase to be ready (up to 3s)
        for (let i = 0; i < 30; i++) {
          if (window.firebase && firebase.apps?.length) break;
          await new Promise(r => setTimeout(r, 100));
        }
        if (!window.firebase || !firebase.apps?.length) return;
        try {
          const userDoc = await firebase.firestore().collection('users').doc(session.uid).get();
          if (userDoc.exists) {
            const d = userDoc.data();
            const patch = {};
            if (d.displayName) patch.displayName = d.displayName;
            if (d.photoURL)    patch.photoURL    = d.photoURL;
            if (Object.keys(patch).length) {
              const latestSession = Auth.getSession();
              if (latestSession) {
                Auth.saveSession({ ...latestSession, ...patch }, latestSession.rememberMe !== false);
                // Update header avatar with fresh photo
                const refreshed = Auth.getSession();
                if (refreshed) _updateHeaderAvatar(refreshed);
              }
            }
          }
        } catch (e) { console.warn('[App] Profile refresh failed:', e.message); }
      };
      _doProfileRefresh();
    }

    // Update header greeting + avatar
    const greetingEl = Utils.el('greeting');
    const isAdmin  = Auth.isAdmin();
    const _email   = (session.email || '').toLowerCase().trim();
    const isMaggie = _email.startsWith('sampadagupta') && _email.endsWith('@gmail.com');
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

    // Update weather in header after login (geolocation may now be permitted)
    _updateHeaderDate();

    // Weather-based smart goal popup (non-blocking, only before noon, once per day)
    if (window.WeatherGoal) WeatherGoal.tryShow().catch(() => {});

    // Init AI scan FAB
    AIScan.initFAB();

    Utils.showToast(isAdmin ? '🔑 Admin access granted' : '👋 Welcome back!');
  };

  /* ── Main init ── */
  const init = async () => {
    _updateHeaderDate();

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
      _updateHeaderDate();
    }, 60_000);
  };

  return { init, onAuthReady, updateHeaderAvatar: _updateHeaderAvatar, updateHeaderDate: _updateHeaderDate };
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
