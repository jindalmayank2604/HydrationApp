/* ══════════════════════════════════════════
   SCREEN: Login — Sign In + Sign Up + Forgot
   hCaptcha bot prevention on signup
   Email verification required for new users
   ══════════════════════════════════════════ */

const LoginScreen = (() => {

  const isDark = () => document.body.classList.contains('dark-mode');

  const show = () => {
    let overlay = document.getElementById('loginOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loginOverlay';
      document.body.appendChild(overlay);
    }
    overlay.style.cssText = `position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;background:${isDark()?'linear-gradient(135deg,#0D1B2A,#1A237E 50%,#0D1B2A)':'linear-gradient(135deg,#E8F0FE,#D2E3FC 50%,#C5E1F5)'};`;
    overlay.innerHTML = buildHTML();
    bindEvents();
    startAuthWatcher();
    // Load hCaptcha script if not loaded
    if (!window.hcaptcha) {
      const s = document.createElement('script');
      s.src = 'https://js.hcaptcha.com/1/api.js';
      s.async = true; s.defer = true;
      document.head.appendChild(s);
    }
  };

  const hide = () => {
    const o = document.getElementById('loginOverlay');
    if (o) o.style.display = 'none';
  };

  const googleSVG = `<svg width="18" height="18" viewBox="0 0 48 48" style="flex-shrink:0"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`;

  const buildHTML = () => `
    <div class="login-card" id="loginCard" style="max-height:92vh;overflow-y:auto;">

      <div class="login-logo">💧</div>
      <div class="login-title">Water Tracker</div>

      <!-- Tab bar -->
      <div class="login-tabs" style="margin-bottom:18px;">
        <button class="login-tab active" id="tabSignIn" data-tab="signin">Sign In</button>
        <button class="login-tab"        id="tabSignUp" data-tab="signup">Create Account</button>
      </div>

      <!-- SIGN IN -->
      <div id="signInView">
        <button class="google-btn" id="googleSignInBtn">${googleSVG} Continue with Google</button>
        <div class="login-divider"><span>or</span></div>
        <div class="login-field-group">
          <label class="login-label">Email</label>
          <input class="login-input" type="email" id="loginEmail" placeholder="you@example.com" autocomplete="email"/>
        </div>
        <div class="login-field-group">
          <label class="login-label">Password</label>
          <div style="position:relative;">
            <input class="login-input" type="password" id="loginPassword" placeholder="••••••••" style="padding-right:44px;" autocomplete="current-password"/>
            <button type="button" id="togglePassword" class="pw-toggle-btn">👁</button>
          </div>
        </div>
        <div id="loginError" class="login-error" style="display:none;"></div>
        <button class="login-btn" id="emailSignInBtn">Sign In</button>
        <div class="remember-row">
          <label class="remember-label">
            <input type="checkbox" id="rememberMe" checked/>
            <span>Remember me for 30 days</span>
          </label>
        </div>
        <button class="login-forgot" id="forgotBtn">Forgot password?</button>
      </div>

      <!-- SIGN UP -->
      <div id="signUpView" style="display:none;">
        <button class="google-btn" id="googleSignUpBtn">${googleSVG} Sign up with Google</button>
        <div class="login-divider"><span>or create with email</span></div>

        <div class="login-field-group">
          <label class="login-label">Display Name</label>
          <input class="login-input" type="text" id="signUpName" placeholder="How should we call you?" maxlength="30"/>
        </div>
        <div class="login-field-group">
          <label class="login-label">Email</label>
          <input class="login-input" type="email" id="signUpEmail" placeholder="you@example.com" autocomplete="email"/>
        </div>
        <div class="login-field-group">
          <label class="login-label">Password</label>
          <div style="position:relative;">
            <input class="login-input" type="password" id="signUpPassword" placeholder="Min 6 characters" style="padding-right:44px;" autocomplete="new-password"/>
            <button type="button" id="toggleSignUpPw" class="pw-toggle-btn">👁</button>
          </div>
          <!-- Password strength bar -->
          <div style="margin-top:6px;">
            <div style="height:4px;background:#E8EAED;border-radius:2px;overflow:hidden;">
              <div id="pwStrengthBar" style="height:100%;width:0%;background:#EA4335;border-radius:2px;transition:all 0.3s;"></div>
            </div>
            <div id="pwStrengthLabel" style="font-size:11px;color:#9AA0A6;margin-top:3px;"></div>
          </div>
        </div>
        <div class="login-field-group">
          <label class="login-label">Confirm Password</label>
          <input class="login-input" type="password" id="signUpConfirm" placeholder="Repeat password" autocomplete="new-password"/>
        </div>

        <!-- hCaptcha -->
        <div style="margin:12px 0;">
          <div class="h-captcha"
            data-sitekey="${window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '10000000-ffff-ffff-ffff-000000000001' : 'e474e944-f3f0-40e6-9130-9a8028b86e84'}"
            data-theme="${isDark()?'dark':'light'}"></div>
          <div style="font-size:11px;color:#9AA0A6;margin-top:4px;">Complete the captcha to prevent spam accounts</div>
        </div>

        <div id="signUpError"   class="login-error" style="display:none;"></div>
        <div id="signUpSuccess" class="login-info"  style="display:none;"></div>
        <button class="login-btn" id="signUpBtn">Create Account 🚀</button>
        <div style="font-size:11px;color:#9AA0A6;margin-top:8px;text-align:center;line-height:1.5;">
          By creating an account you agree to our terms. A verification email will be sent.
        </div>
      </div>

      <!-- FORGOT PASSWORD -->
      <div id="forgotView" style="display:none;">
        <button class="login-back" id="backToLoginBtn">← Back</button>
        <div class="login-section-title">Reset Password</div>
        <div class="login-section-sub">We'll send a reset link to your email.</div>
        <div class="login-field-group">
          <label class="login-label">Email</label>
          <input class="login-input" type="email" id="resetEmail" placeholder="your@email.com"/>
        </div>
        <div id="resetError"   class="login-error" style="display:none;"></div>
        <div id="resetSuccess" class="login-info"  style="display:none;"></div>
        <button class="login-btn" id="sendResetBtn">Send Reset Email</button>
      </div>

      <!-- EMAIL VERIFICATION NOTICE -->
      <div id="verifyView" style="display:none;">
        <div style="text-align:center;padding:16px 0;">
          <div style="font-size:48px;margin-bottom:12px;">📧</div>
          <div class="login-section-title" id="verifyTitle">Check your inbox!</div>
          <div class="login-section-sub" id="verifySub">We sent a verification link to your email. Click it to activate your account.</div>
        </div>
        <button class="login-btn" id="resendVerifyBtn">Resend Verification Email</button>
        <button class="login-back" id="backFromVerifyBtn" style="display:block;margin-top:8px;">← Back to Sign In</button>
      </div>

    </div>
  `;

  const bindEvents = () => {
    // Tab switching
    document.querySelectorAll('.login-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const isSignup = tab.dataset.tab === 'signup';
        document.getElementById('signInView').style.display = isSignup ? 'none' : 'block';
        document.getElementById('signUpView').style.display = isSignup ? 'block' : 'none';
        document.getElementById('forgotView').style.display = 'none';
        document.getElementById('verifyView').style.display = 'none';
        if (isSignup && window.hcaptcha) {
          setTimeout(() => {
            const container = document.querySelector('.h-captcha');
            if (container && !container.dataset.hcaptchaWidgetId) {
              try {
                hcaptcha.render(container);
              } catch(e) {
                console.warn('[hCaptcha] render failed:', e.message);
              }
            }
          }, 300);
        }
      });
    });

    // Sign in
    Utils.el('googleSignInBtn').addEventListener('click', () => handleGoogle(false));
    Utils.el('emailSignInBtn').addEventListener('click', handleSignIn);
    Utils.el('loginPassword').addEventListener('keydown', e => { if (e.key==='Enter') handleSignIn(); });
    Utils.el('togglePassword').addEventListener('click', () => togglePw('loginPassword','togglePassword'));

    // Sign up
    Utils.el('googleSignUpBtn').addEventListener('click', () => handleGoogle(true));
    Utils.el('signUpBtn').addEventListener('click', handleSignUp);
    Utils.el('toggleSignUpPw').addEventListener('click', () => togglePw('signUpPassword','toggleSignUpPw'));
    Utils.el('signUpPassword').addEventListener('input', updatePwStrength);

    // Forgot
    Utils.el('forgotBtn').addEventListener('click', () => {
      const e = Utils.el('loginEmail')?.value?.trim();
      Utils.el('signInView').style.display = 'none';
      Utils.el('forgotView').style.display = 'block';
      if (e) Utils.el('resetEmail').value = e;
    });
    Utils.el('backToLoginBtn').addEventListener('click', () => {
      Utils.el('forgotView').style.display = 'none';
      Utils.el('signInView').style.display = 'block';
    });
    Utils.el('sendResetBtn').addEventListener('click', handleReset);

    // Verify
    Utils.el('resendVerifyBtn').addEventListener('click', async () => {
      try { await SignUp.resendVerification(); Utils.showToast('📧 Verification email resent!'); }
      catch(e) { Utils.showToast('⚠️ ' + e.message); }
    });
    Utils.el('backFromVerifyBtn').addEventListener('click', () => {
      Utils.el('verifyView').style.display = 'none';
      Utils.el('signInView').style.display = 'block';
      document.querySelectorAll('.login-tab').forEach(t => t.classList.toggle('active', t.dataset.tab==='signin'));
    });
  };

  // Password strength UI
  const updatePwStrength = () => {
    const pw  = Utils.el('signUpPassword')?.value || '';
    const str = SignUp.passwordStrength(pw);
    const bar = Utils.el('pwStrengthBar');
    const lbl = Utils.el('pwStrengthLabel');
    if (bar) { bar.style.width = str.width; bar.style.background = str.color; }
    if (lbl) { lbl.textContent = pw.length ? `Strength: ${str.label}` : ''; lbl.style.color = str.color; }
  };

  const setError = (id, msg) => {
    const el = Utils.el(id);
    if (!el) return;
    el.textContent = msg; el.style.display = msg ? 'block' : 'none';
  };

  const togglePw = (inputId, btnId) => {
    const i = Utils.el(inputId), b = Utils.el(btnId);
    if (!i||!b) return;
    i.type = i.type==='password' ? 'text' : 'password';
    b.textContent = i.type==='password' ? '👁' : '🙈';
  };

  const handleGoogle = async (isSignUp) => {
    setError('loginError',''); setError('signUpError','');
    const btn = Utils.el(isSignUp ? 'googleSignUpBtn' : 'googleSignInBtn') || {};
    try {
      btn.textContent = '⏳ Signing in…'; btn.disabled = true;
      if (!window.firebase) throw new Error('Firebase not loaded');
      const provider = new firebase.auth.GoogleAuthProvider();
      const result   = await firebase.auth().signInWithPopup(provider);
      const user     = result.user;

      // Check if existing user in Roles
      let role = await Auth.fetchRoleFromFirestore(user.email);
      if (!role) {
        // New Google user — create profile
        await SignUp.createUserProfile ? SignUp.createUserProfile(user.uid, user.email, user.displayName) : null;
        role = 'user';
        // Write Roles doc
        await firebase.firestore().collection('Roles').doc(user.email.toLowerCase()).set({ role:'user', uid:user.uid, createdAt:firebase.firestore.FieldValue.serverTimestamp() }, { merge:true });
      }
      const rememberMe = Utils.el('rememberMe')?.checked !== false;
      Auth.saveSession({ email:user.email, displayName:user.displayName, photoURL:user.photoURL, uid:user.uid, role }, rememberMe);
      onSuccess({ email:user.email, role, displayName:user.displayName });
    } catch(e) {
      const msg = e.code==='auth/popup-closed-by-user' ? '' : (e.message||'Sign in failed');
      if (msg) { isSignUp ? setError('signUpError',msg) : setError('loginError',msg); }
      btn.innerHTML = `${googleSVG} ${isSignUp?'Sign up':'Continue'} with Google`; btn.disabled = false;
    }
  };

  const handleSignIn = async () => {
    const email = Utils.el('loginEmail').value.trim();
    const pass  = Utils.el('loginPassword').value;
    setError('loginError','');
    if (!email||!pass) { setError('loginError','Please enter email and password.'); return; }
    const btn = Utils.el('emailSignInBtn');
    btn.textContent='⏳ Signing in…'; btn.disabled=true;
    try {
      const rememberMe = Utils.el('rememberMe')?.checked !== false;
      const result = await Auth.signInWithEmail(email, pass, rememberMe);
      onSuccess(result);
    } catch(e) {
      const msg = e.message || 'Sign in failed.';
      if (msg.includes('verify your email')) {
        // Show special unverified state with resend button
        const errEl = Utils.el('loginError');
        errEl.innerHTML = msg + ' <button onclick="(async()=>{try{await firebase.auth().signInWithEmailAndPassword(Utils.el(\'loginEmail\').value,Utils.el(\'loginPassword\').value);await firebase.auth().currentUser?.sendEmailVerification();Utils.showToast(\'📧 Verification email resent!\');await firebase.auth().signOut();}catch(e){Utils.showToast(\'⚠️ \'+e.message);}})();" style="background:none;border:none;color:#1A73E8;font-weight:700;cursor:pointer;font-size:11px;text-decoration:underline;padding:0;font-family:var(--font-body);">Resend email</button>';
        errEl.style.display = 'block';
      } else {
        setError('loginError', msg);
      }
      btn.textContent='Sign In'; btn.disabled=false;
    }
  };

  const handleSignUp = async () => {
    const name    = Utils.el('signUpName').value.trim();
    const email   = Utils.el('signUpEmail').value.trim();
    const pass    = Utils.el('signUpPassword').value;
    const confirm = Utils.el('signUpConfirm').value;
    setError('signUpError',''); setError('signUpSuccess','');

    if (!name)              { setError('signUpError','Enter your display name.'); return; }
    if (!email)             { setError('signUpError','Enter your email.'); return; }
    if (pass.length < 6)    { setError('signUpError','Password must be at least 6 characters.'); return; }
    if (pass !== confirm)   { setError('signUpError','Passwords do not match.'); return; }

    // hCaptcha check — skip on localhost for development
    const isLocalhost = ['localhost','127.0.0.1'].includes(window.location.hostname);
    let captchaToken = '';
    if (!isLocalhost) {
      try {
        if (window.hcaptcha) {
          captchaToken = hcaptcha.getResponse();
          if (!captchaToken) { setError('signUpError','Please complete the captcha.'); return; }
        }
      } catch(e) { /* hcaptcha not loaded */ }
    }

    const btn = Utils.el('signUpBtn');
    btn.textContent='⏳ Creating account…'; btn.disabled=true;

    try {
      const result = await SignUp.register(email, pass, name);
      // Show verification notice
      Utils.el('signUpView').style.display='none';
      Utils.el('verifyView').style.display='block';
      Utils.el('verifyTitle').textContent='Account created! 🎉';
      Utils.el('verifySub').textContent=`A verification link was sent to ${email}. Open it and you'll be logged in automatically!`;
      // Start polling for verification — auto-login when link is clicked
      startVerificationPoller();
    } catch(e) {
      setError('signUpError', e.message||'Registration failed.');
    } finally {
      btn.textContent='Create Account 🚀'; btn.disabled=false;
      try { if(window.hcaptcha) hcaptcha.reset(); } catch {}
    }
  };

  const waitForAuth = () => new Promise((res,rej) => {
    let n=0; const t=setInterval(()=>{ n++;
      if(window.firebase&&firebase.apps?.length>0&&firebase.auth) { clearInterval(t); res(); }
      else if(n>60) { clearInterval(t); rej(new Error('Firebase timeout')); }
    },100);
  });

  const handleReset = async () => {
    const email = Utils.el('resetEmail').value.trim();
    setError('resetError','');
    Utils.el('resetSuccess').style.display='none';
    if(!email){ setError('resetError','Enter your email.'); return; }
    const btn=Utils.el('sendResetBtn'); btn.textContent='⏳ Sending…'; btn.disabled=true;
    try {
      await waitForAuth();
      await firebase.auth().sendPasswordResetEmail(email);
      Utils.el('resetSuccess').textContent='✅ Reset email sent! Check your inbox.';
      Utils.el('resetSuccess').style.display='block';
    } catch(e) {
      let msg=e.message;
      if(e.code==='auth/user-not-found')  msg='No account with this email.';
      if(e.code==='auth/invalid-email')   msg='Invalid email address.';
      setError('resetError',msg);
    } finally { btn.textContent='Send Reset Email'; btn.disabled=false; }
  };

  const onSuccess = (result) => { hide(); App.onAuthReady(result); };

  /* ── Watch Firebase auth state — auto-login when email verified ── */
  let _authUnsubscribe = null;
  const startAuthWatcher = () => {
    if (_authUnsubscribe) return; // already watching
    if (!window.firebase || !firebase.apps?.length) return;

    try {
      _authUnsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) return;

        // User is signed in — check if email is verified
        await user.reload(); // refresh verification status from server
        if (!user.emailVerified) {
          // Not verified yet — check again after 3s (handles tab focus after verification)
          return;
        }

        // Email is verified — complete the login
        console.log('[Login] Email verified — auto-logging in:', user.email);
        stopAuthWatcher();

        // Fetch role from Firestore
        let role = await Auth.fetchRoleFromFirestore(user.email);
        if (!role) {
          // Self-registered user — assign user role
          try {
            await firebase.firestore().collection('Roles').doc(user.email.toLowerCase()).set({
              role: 'user', uid: user.uid,
              displayName: user.displayName || user.email.split('@')[0],
              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
              emailVerified: true,
            }, { merge: true });
            role = 'user';
          } catch(e) {
            console.warn('[Login] Role write failed:', e.message);
            role = 'user';
          }
        }

        Auth.saveSession({
          email:       user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL:    user.photoURL || null,
          uid:         user.uid,
          role,
        }, true);

        Utils.showToast('✅ Email verified! Welcome ' + (user.displayName || user.email.split('@')[0]) + '!');
        hide();
        App.onAuthReady({ email: user.email, role, displayName: user.displayName });
      });
    } catch(e) {
      console.warn('[Login] Auth watcher failed:', e.message);
    }
  };

  const stopAuthWatcher = () => {
    if (_authUnsubscribe) { _authUnsubscribe(); _authUnsubscribe = null; }
  };

  /* ── Poll for verification when user is in verifyView ── */
  const startVerificationPoller = (uid) => {
    let attempts = 0;
    const maxAttempts = 60; // poll for up to 5 minutes
    const poll = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) { clearInterval(poll); return; }
      try {
        const user = firebase.auth().currentUser;
        if (!user) { clearInterval(poll); return; }
        await user.reload();
        if (user.emailVerified) {
          clearInterval(poll);
          console.log('[Login] Verification poll: email verified!');
          // Trigger auth state change
          firebase.auth().currentUser.getIdToken(true).catch(()=>{});
        }
      } catch {}
    }, 5000); // check every 5 seconds
    return poll;
  };

  return { show, hide, stopAuthWatcher };
})();
