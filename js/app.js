/* ══════════════════════════════════════════
   APP — Entry point
   ══════════════════════════════════════════ */

const App = (() => {
  /* ── Advanced Navigation (orbit menu + desktop collapse) ── */
  const _setupAdvancedNavigation = () => {
    // ── Desktop sidebar toggle ──
    const desktopToggle = document.getElementById('desktopNavToggle');
    if (desktopToggle) {
      desktopToggle.addEventListener('click', () => {
        document.body.classList.toggle('nav-expanded');
        const isExpanded = document.body.classList.contains('nav-expanded');
        desktopToggle.setAttribute('aria-label', isExpanded ? 'Collapse sidebar' : 'Expand sidebar');
        localStorage.setItem('wt_nav_expanded', isExpanded);
      });
      // Restore expanded state
      if (localStorage.getItem('wt_nav_expanded') === 'true') {
        document.body.classList.add('nav-expanded');
      }
    }

    // ── Mobile orbit nav ──
    const orbitNav      = document.getElementById('mobileOrbitNav');
    const orbitTrigger  = document.getElementById('orbitTrigger');
    const orbitBackdrop = document.getElementById('orbitBackdrop');
    if (!orbitNav || !orbitTrigger) return;

    let orbitOpen = false;

    const openOrbit = () => {
      orbitOpen = true;
      orbitNav.classList.add('open');
      if (orbitBackdrop) orbitBackdrop.classList.add('active');
      orbitTrigger.setAttribute('aria-expanded', 'true');
      if (navigator.vibrate) navigator.vibrate(8);
    };

    const closeOrbit = () => {
      orbitOpen = false;
      orbitNav.classList.remove('open');
      if (orbitBackdrop) orbitBackdrop.classList.remove('active');
      orbitTrigger.setAttribute('aria-expanded', 'false');
    };

    orbitTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      orbitOpen ? closeOrbit() : openOrbit();
    });

    // Item navigation
    orbitNav.querySelectorAll('.mobile-orbit-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const screen = btn.dataset.screen;
        if (screen) {
          closeOrbit();
          setTimeout(() => Router.navigate(screen), 60);
        }
      });
    });

    // Backdrop + escape close
    if (orbitBackdrop) orbitBackdrop.addEventListener('click', closeOrbit);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && orbitOpen) closeOrbit(); });

    // Sync active state on every navigate
    const _syncOrbit = () => {
      const current = Router.getCurrent();
      orbitNav.querySelectorAll('.mobile-orbit-item').forEach(btn => {
        btn.classList.toggle('orbit-active', btn.dataset.screen === current);
      });
      if (orbitOpen) closeOrbit();
    };
    ['home','history','analytics','achievements','reminder','settings','shop'].forEach(s => {
      Router.on(s, _syncOrbit);
    });
    _syncOrbit();
  };

  /* ── Update header avatar from session ── */
  const _updateHeaderAvatar = (session) => {
    const el = Utils.el('headerAvatar');
    if (!el) return;
    const name = session?.displayName || session?.email?.split('@')[0] || '';
    const url  = session?.photoURL || null;

    // Use Frames.avatarWithFrame so equipped frame shows on header
    if (window.Frames) {
      const revision = session?.photoVersion || session?.savedAt || null;
      const size = 40; // .header-avatar is always 40px
      el.style.background = 'transparent';
      el.style.fontSize   = '0';
      el.style.overflow   = 'visible';
      el.innerHTML = Frames.avatarWithFrame(url, name, size, null, revision);
    } else {
      const src = window.Profile?.resolveImageSrc
        ? Profile.resolveImageSrc(url, session?.photoVersion || session?.savedAt || null)
        : url;
      if (src) {
        el.style.background = 'transparent';
        el.style.fontSize   = '0';
        el.innerHTML = `<img src="${src}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;"
          onerror="this.parentElement.innerHTML='${name.charAt(0).toUpperCase()||'💧'}';this.parentElement.style.fontSize='18px';" />`;
      } else {
        el.style.background = 'var(--md-primary-light)';
        el.style.fontSize   = '20px';
        el.innerHTML        = '💧';
      }
    }
  };


  /* ── Coin chip click → shop ── */
  const _initCoinChip = () => {
    const chip = Utils.el('headerCoinChip');
    if (!chip) return;
    chip.style.cursor = 'pointer';
    chip.addEventListener('click', () => Router.navigate('shop'));
    chip.title = 'View Shop';
  };

  /* ── Sync coin balance to header chip ── */
  const _syncHeaderCoins = () => {
    const el = Utils.el('headerCoinValue');
    if (!el) return;
    const coins = window.UserData ? UserData.getState().coinBalance || 0 : 0;
    el.textContent = coins;
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
            if (d.photoVersion) patch.photoVersion = d.photoVersion;
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

    if (window.UserData) {
      await UserData.initForSession();
    }

    // Re-render whatever screen is currently active with fresh Firestore data
    const _currentScreen = Router.getCurrent();
    if (_currentScreen === 'settings' && window.SettingsScreen) {
      SettingsScreen.renderForRole();
    } else if (_currentScreen === 'home' && window.HomeScreen) {
      HomeScreen.updateUI();
    }

    // Load frame catalog from Firestore so frames are ready everywhere
    if (window.Frames) {
      Frames.loadCatalog().catch(() => {});
    }

    /* ── DEV ONLY: temporary 999-coin grant for admin testing ──
       THIS BLOCK IS LOCALHOST-ONLY. It will never run on GitHub Pages
       or any deployed URL because of the hostname check.
       Delete this entire block before going to production.
    ── */
    if (
      window.UserData &&
      Auth.isAdmin() &&
      (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ) {
      const _devState = UserData.getState();
      if ((_devState.coinBalance || 0) < 999) {
        await UserData.save({ coinBalance: 999 });
        console.warn('[DEV] 🪙 Admin test balance set to 999 coins — localhost only, delete before deploy');
      }
    }
    /* ── END DEV BLOCK ── */

    // Sync shared drinks from Firestore for ALL users
    Drinks.syncFromFirestore().catch(() => {});
    // Sync user's private custom drinks
    if (window.Drinks && Drinks.syncPrivateFromFirestore) {
      Drinks.syncPrivateFromFirestore().catch(() => {});
    }

    // Publish verified streak to leaderboard
    if (window.Leaderboard && session.uid) {
      setTimeout(() => {
        Leaderboard.publishStreak(session.uid).catch(()=>{});
        // Patch any old leaderboard docs missing the flagged field
        if (Leaderboard.patchMissingFlagged) Leaderboard.patchMissingFlagged().catch(()=>{});
      }, 3000);
    }

    // Sync coin balance to header
    _syncHeaderCoins();
    // Subscribe to UserData changes to keep coin chip + avatar live
    if (window.UserData) {
      UserData.subscribe(_syncHeaderCoins);
      // Re-render header avatar whenever equippedFrame changes
      UserData.subscribe((state) => {
        const session = window.Auth?.getSession?.();
        if (session) _updateHeaderAvatar(session);
        // Re-render settings if it's the current route (active or not — data just loaded)
        if (window.SettingsScreen && window.Router) {
          if (Router.getCurrent() === 'settings') {
            SettingsScreen.renderForRole?.();
          } else {
            SettingsScreen._patchMetaLine?.();
          }
        }
      });
    }

    // Update weather in header after login (geolocation may now be permitted)
    _updateHeaderDate();

    // Handle pending family join (from invite link before login)
    const pendingJoin = localStorage.getItem('wt_pending_family_join');
    if (pendingJoin) { localStorage.removeItem('wt_pending_family_join'); _handleFamilyInvite(); }
    _handleFamilyInvite();

    // Weather-based smart goal popup (non-blocking, only before noon, once per day)
    if (window.WeatherGoal) WeatherGoal.tryShow().catch(() => {});

    // Init AI scan FAB
    AIScan.initFAB();

    Utils.showToast(isAdmin ? '🔑 Admin access granted' : '👋 Welcome back!');
  };

  /* ── Handle family invite links (?joinFamily=ownerUid) ── */
  const _handleFamilyInvite = async () => {
    const params = new URLSearchParams(window.location.search);
    const ownerUid = params.get('joinFamily');
    if (!ownerUid) return;
    // Clean URL
    window.history.replaceState({}, '', window.location.pathname);
    // Wait for auth
    const session = Auth.getSession();
    if (!session) {
      localStorage.setItem('wt_pending_family_join', ownerUid);
      return;
    }
    try {
      const db = firebase.firestore();
      const ownerDoc = await db.collection('users').doc(ownerUid).get();
      if (!ownerDoc.exists) { Utils.showToast('⚠️ Invalid family link.'); return; }
      const ownerEmail = ownerDoc.data()?.email || ownerUid;
      // Add current user's email to owner's familyMembers in Firestore
      await db.collection('users').doc(ownerUid).update({
        familyMembers: firebase.firestore.FieldValue.arrayUnion(session.email)
      });
      Utils.showToast(`✅ You joined ${ownerEmail.split('@')[0]}'s family group!`);
    } catch (e) {
      console.warn('[App] Family join failed:', e.message);
      Utils.showToast('Could not join family: ' + e.message);
    }
  };

  /* ── Main init ── */
  const init = async () => {
    _updateHeaderDate();
    _setupAdvancedNavigation();

    // Init all screens
    _initCoinChip();
    Router.init();
    HomeScreen.init();
    HistoryScreen.init();
    AnalyticsScreen.init();
    AchievementsScreen.init();
    ReminderScreen.init();
    SettingsScreen.init();
    ShopScreen.init();

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
