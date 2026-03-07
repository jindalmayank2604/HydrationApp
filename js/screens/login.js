/* ══════════════════════════════════════════
   SCREEN: Login — Sign In / Sign Up / Forgot Password
   ══════════════════════════════════════════ */

const LoginScreen = (() => {

  const isDark = () => document.body.classList.contains('dark-mode');

  /* ── Show the login overlay ── */
  const show = () => {
    let overlay = document.getElementById('loginOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loginOverlay';
      document.body.appendChild(overlay);
    }
    updateOverlayBg(overlay);
    overlay.style.cssText += ';position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
    overlay.innerHTML = buildLoginHTML();
    bindLoginEvents();
  };

  const updateOverlayBg = (overlay) => {
    overlay.style.background = isDark()
      ? 'linear-gradient(135deg,#0D1B2A,#1A237E 50%,#0D1B2A)'
      : 'linear-gradient(135deg,#E8F0FE,#D2E3FC 50%,#C5E1F5)';
  };

  /* ── Hide overlay ── */
  const hide = () => {
    const overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.style.display = 'none';
  };

  const googleSVG = `<svg width="20" height="20" viewBox="0 0 48 48" style="flex-shrink:0">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>`;

  /* ── Build HTML ── */
  const buildLoginHTML = () => `
    <div class="login-card" id="loginCard">

      <div class="login-logo">💧</div>
      <div class="login-title">Water Tracker</div>
      <div class="login-sub" id="loginSubTitle">Sign in to sync your data</div>

      <!-- Tab switcher: Sign In / Sign Up -->
      <div class="login-tabs" id="loginTabs">
        <button class="login-tab active" id="tabSignIn" data-tab="signIn">Sign In</button>
        <button class="login-tab" id="tabSignUp" data-tab="signUp">Sign Up</button>
      </div>

      <!-- VIEW: Sign In -->
      <div id="signInView">
        <button class="google-btn" id="googleSignInBtn">
          ${googleSVG} Continue with Google
        </button>
        <div class="login-divider"><span>or</span></div>

        <div class="login-field-group">
          <label class="login-label">Email address</label>
          <input class="login-input" type="email" id="loginEmail"
            placeholder="your@gmail.com" autocomplete="email" />
        </div>
        <div class="login-field-group">
          <label class="login-label">Password</label>
          <div style="position:relative;">
            <input class="login-input" type="password" id="loginPassword"
              placeholder="••••••••" autocomplete="current-password" style="padding-right:44px;" />
            <button type="button" id="togglePassword" class="pw-toggle-btn">👁</button>
          </div>
        </div>

        <div id="loginError" class="login-error" style="display:none;"></div>
        <button class="login-btn" id="emailSignInBtn">Sign In</button>

        <div class="remember-row">
          <label class="remember-label">
            <input type="checkbox" id="rememberMe" checked />
            <span>Remember me for 30 days</span>
          </label>
        </div>
        <button class="login-forgot" id="forgotBtn">Forgot password?</button>
      </div>

      <!-- VIEW: Sign Up -->
      <div id="signUpView" style="display:none;">
        <button class="google-btn" id="googleSignUpBtn">
          ${googleSVG} Continue with Google
        </button>
        <div class="login-divider"><span>or</span></div>

        <div class="login-field-group">
          <label class="login-label">Full Name</label>
          <input class="login-input" type="text" id="signUpName"
            placeholder="Your name" autocomplete="name" />
        </div>
        <div class="login-field-group">
          <label class="login-label">Email address</label>
          <input class="login-input" type="email" id="signUpEmail"
            placeholder="your@gmail.com" autocomplete="email" />
        </div>
        <div class="login-field-group">
          <label class="login-label">Password</label>
          <div style="position:relative;">
            <input class="login-input" type="password" id="signUpPassword"
              placeholder="Min 6 characters" autocomplete="new-password" style="padding-right:44px;" />
            <button type="button" id="toggleSignUpPassword" class="pw-toggle-btn">👁</button>
          </div>
        </div>

        <div id="signUpError" class="login-error" style="display:none;"></div>
        <div id="signUpInfo" class="login-info" style="display:none;"></div>
        <button class="login-btn" id="emailSignUpBtn">Create Account</button>

        <div class="login-sub" style="margin-top:12px;font-size:12px;text-align:center;">
          By signing up, your account needs to be approved by admin before access is granted.
        </div>
      </div>

      <!-- VIEW: Forgot Password -->
      <div id="forgotView" style="display:none;">
        <button class="login-back" id="backToLoginBtn">← Back to Sign In</button>
        <div class="login-section-title">Reset Password</div>
        <div class="login-section-sub">Enter your email and we'll send you a reset link</div>

        <div class="login-field-group">
          <label class="login-label">Email address</label>
          <input class="login-input" type="email" id="resetEmail" placeholder="your@gmail.com" />
        </div>

        <div id="resetError" class="login-error" style="display:none;"></div>
        <div id="resetSuccess" class="login-info" style="display:none;"></div>
        <button class="login-btn" id="sendResetBtn">Send Reset Email</button>
      </div>

    </div>
  `;

  /* ── Bind events ── */
  const bindLoginEvents = () => {

    // Tab switching
    Utils.el('tabSignIn').addEventListener('click', () => switchTab('signIn'));
    Utils.el('tabSignUp').addEventListener('click', () => switchTab('signUp'));

    // Google Sign In
    Utils.el('googleSignInBtn').addEventListener('click', () => handleGoogle(false));
    Utils.el('googleSignUpBtn').addEventListener('click', () => handleGoogle(false));

    // Email Sign In
    Utils.el('emailSignInBtn').addEventListener('click', handleSignIn);
    Utils.el('loginPassword').addEventListener('keydown', e => { if (e.key === 'Enter') handleSignIn(); });

    // Email Sign Up
    Utils.el('emailSignUpBtn').addEventListener('click', handleSignUp);

    // Toggle passwords
    Utils.el('togglePassword').addEventListener('click', () => togglePw('loginPassword', 'togglePassword'));
    Utils.el('toggleSignUpPassword').addEventListener('click', () => togglePw('signUpPassword', 'toggleSignUpPassword'));

    // Forgot password
    Utils.el('forgotBtn').addEventListener('click', () => {
      Utils.el('signInView').style.display = 'none';
      Utils.el('loginTabs').style.display  = 'none';
      Utils.el('forgotView').style.display = 'block';
      Utils.el('loginSubTitle').textContent = 'Reset your password';
    });
    Utils.el('backToLoginBtn').addEventListener('click', () => {
      Utils.el('forgotView').style.display = 'none';
      Utils.el('loginTabs').style.display  = 'flex';
      Utils.el('signInView').style.display = 'block';
      Utils.el('loginSubTitle').textContent = 'Sign in to sync your data';
    });

    // Reset email
    Utils.el('sendResetBtn').addEventListener('click', handleResetEmail);
  };

  /* ── Tab switch ── */
  const switchTab = (tab) => {
    Utils.el('signInView').style.display = tab === 'signIn' ? 'block' : 'none';
    Utils.el('signUpView').style.display = tab === 'signUp' ? 'block' : 'none';
    Utils.el('tabSignIn').classList.toggle('active', tab === 'signIn');
    Utils.el('tabSignUp').classList.toggle('active', tab === 'signUp');
    Utils.el('loginSubTitle').textContent = tab === 'signIn' ? 'Sign in to sync your data' : 'Create a new account';
  };

  /* ── Google handler ── */
  const handleGoogle = async (isSignUp) => {
    const btn = Utils.el(isSignUp ? 'googleSignUpBtn' : 'googleSignInBtn');
    setLoginError('');
    try {
      btn.textContent = '⏳ Signing in…';
      btn.disabled = true;
      const rememberMe = Utils.el('rememberMe')?.checked !== false;
      const result = await Auth.signInWithGoogle(rememberMe);
      onLoginSuccess(result);
    } catch (e) {
      setLoginError(e.message || 'Sign in failed. Try again.');
      btn.innerHTML = `${googleSVG} Continue with Google`;
      btn.disabled = false;
    }
  };

  /* ── Sign In handler ── */
  const handleSignIn = async () => {
    const email    = Utils.el('loginEmail').value.trim();
    const password = Utils.el('loginPassword').value;
    setLoginError('');
    if (!email || !password) { setLoginError('Please enter email and password.'); return; }

    const btn = Utils.el('emailSignInBtn');
    btn.textContent = '⏳ Signing in…';
    btn.disabled = true;

    try {
      const rememberMe = Utils.el('rememberMe')?.checked !== false;
      const result = await Auth.signInWithEmail(email, password, rememberMe);
      onLoginSuccess(result);
    } catch (e) {
      setLoginError('Invalid user credentials.');
      btn.textContent = 'Sign In';
      btn.disabled = false;
    }
  };

  /* ── Sign Up handler ── */
  const handleSignUp = async () => {
    const name     = Utils.el('signUpName').value.trim();
    const email    = Utils.el('signUpEmail').value.trim();
    const password = Utils.el('signUpPassword').value;

    setSignUpError('');
    setSignUpInfo('');

    if (!name)     { setSignUpError('Please enter your name.'); return; }
    if (!email)    { setSignUpError('Please enter your email.'); return; }
    if (!password || password.length < 6) { setSignUpError('Password must be at least 6 characters.'); return; }

    const btn = Utils.el('emailSignUpBtn');
    btn.textContent = '⏳ Creating account…';
    btn.disabled = true;

    try {
      // Create Firebase Auth account
      await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = firebase.auth().currentUser;

      // Update display name
      await user.updateProfile({ displayName: name });

      // Sign out immediately — account needs admin approval (role in Firestore)
      await firebase.auth().signOut();

      setSignUpInfo('✅ Account created! Ask your admin to grant you access, then sign in.');
      btn.textContent = 'Create Account';
      btn.disabled = false;

      // Switch back to sign in after 3 seconds
      setTimeout(() => switchTab('signIn'), 3000);

    } catch (e) {
      let msg = 'Could not create account. Try again.';
      if (e.code === 'auth/email-already-in-use') msg = 'This email is already registered. Try signing in.';
      if (e.code === 'auth/invalid-email')        msg = 'Invalid email address.';
      if (e.code === 'auth/weak-password')        msg = 'Password is too weak. Use at least 6 characters.';
      setSignUpError(msg);
      btn.textContent = 'Create Account';
      btn.disabled = false;
    }
  };

  /* ── Reset email handler ── */
  const handleResetEmail = async () => {
    const email = Utils.el('resetEmail').value.trim();
    Utils.el('resetError').style.display = 'none';
    Utils.el('resetSuccess').style.display = 'none';

    if (!email) {
      Utils.el('resetError').textContent = 'Please enter your email.';
      Utils.el('resetError').style.display = 'block';
      return;
    }

    const btn = Utils.el('sendResetBtn');
    btn.textContent = '⏳ Sending…';
    btn.disabled = true;

    try {
      await firebase.auth().sendPasswordResetEmail(email);
      Utils.el('resetSuccess').textContent = '✅ Reset email sent! Check your inbox.';
      Utils.el('resetSuccess').style.display = 'block';
    } catch (e) {
      Utils.el('resetError').textContent = 'Could not send reset email. Check the address.';
      Utils.el('resetError').style.display = 'block';
    }
    btn.textContent = 'Send Reset Email';
    btn.disabled = false;
  };

  /* ── Helpers ── */
  const togglePw = (inputId, btnId) => {
    const input = Utils.el(inputId);
    const btn   = Utils.el(btnId);
    input.type  = input.type === 'password' ? 'text' : 'password';
    btn.textContent = input.type === 'password' ? '👁' : '🙈';
  };

  const setLoginError = (msg) => {
    const el = Utils.el('loginError');
    if (!el) return;
    el.textContent = msg;
    el.style.display = msg ? 'block' : 'none';
  };

  const setSignUpError = (msg) => {
    const el = Utils.el('signUpError');
    if (!el) return;
    el.textContent = msg;
    el.style.display = msg ? 'block' : 'none';
  };

  const setSignUpInfo = (msg) => {
    const el = Utils.el('signUpInfo');
    if (!el) return;
    el.textContent = msg;
    el.style.display = msg ? 'block' : 'none';
  };

  /* ── Called after successful login ── */
  const onLoginSuccess = (result) => {
    hide();
    App.onAuthReady(result);
  };

  return { show, hide };
})();
