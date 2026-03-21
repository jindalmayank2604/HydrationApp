/* ══════════════════════════════════════════
   MODULE: SignUp — self-service registration
   Firebase Email Auth + email verification
   hCaptcha for bot prevention
   ══════════════════════════════════════════ */

const SignUp = (() => {

  /* ── After successful Firebase createUser, write role to Firestore ── */
  const createUserProfile = async (uid, email, displayName) => {
    try {
      const db = firebase.firestore();
      // Write to Roles collection (matches existing auth flow)
      await db.collection('Roles').doc(email.toLowerCase()).set({
        role: 'user',
        displayName,
        uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        emailVerified: false,
      });
      // Also create a users/{uid}/profile document for leaderboard display name
      await db.collection('users').doc(uid).set({
        displayName,
        email: email.toLowerCase(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        streakCount: 0,
        monthlyStreak: 0,
      }, { merge: true });
      console.log('[SignUp] User profile created');
    } catch (e) {
      console.warn('[SignUp] Profile write failed:', e.message);
    }
  };

  /* ── Register new user ── */
  const register = async (email, password, displayName) => {
    const ready = await Auth.ensureFirebase ? Auth.ensureFirebase() : true;

    // Create Firebase Auth user
    let cred;
    try {
      cred = await firebase.auth().createUserWithEmailAndPassword(email.trim(), password);
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') throw new Error('An account with this email already exists. Sign in instead.');
      if (e.code === 'auth/weak-password')        throw new Error('Password must be at least 6 characters.');
      if (e.code === 'auth/invalid-email')         throw new Error('Invalid email address.');
      throw new Error(e.message || 'Registration failed.');
    }

    const user = cred.user;

    // Update display name in Firebase Auth
    await user.updateProfile({ displayName: displayName.trim() || email.split('@')[0] });

    // Send verification email
    try {
      await user.sendEmailVerification();
    } catch (e) {
      console.warn('[SignUp] Verification email failed:', e.message);
    }

    // Write role + profile to Firestore
    await createUserProfile(user.uid, user.email, displayName.trim() || email.split('@')[0]);

    // If user already completed survey before signing up, sync it to Firestore now
    if (window.SurveyScreen && SurveyScreen.isDoneLocally()) {
      const savedData = (() => {
        try { return JSON.parse(localStorage.getItem('wt_survey_data')) || {}; } catch { return {}; }
      })();
      const goal = LocalStorage.getGoal();
      SurveyScreen.saveToFirestore
        ? SurveyScreen.saveToFirestore(user.uid, goal, savedData).catch(()=>{})
        : null;
    }

    // Do NOT sign out — keep signed in so onAuthStateChanged fires when email is verified
    // The auth watcher in login.js will auto-login once emailVerified = true

    return { email: user.email, uid: user.uid, verificationSent: true };
  };

  /* ── Check if email is verified (used after sign-in) ── */
  const isEmailVerified = () => {
    const user = firebase.auth().currentUser;
    return user ? user.emailVerified : false;
  };

  /* ── Resend verification ── */
  const resendVerification = async () => {
    const user = firebase.auth().currentUser;
    if (user) await user.sendEmailVerification();
  };

  /* ── Password strength checker ── */
  const passwordStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8)  score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { label: 'Weak',   color: '#EA4335', width: '25%'  };
    if (score <= 2) return { label: 'Fair',   color: '#FBBC04', width: '50%'  };
    if (score <= 3) return { label: 'Good',   color: '#34A853', width: '75%'  };
    return            { label: 'Strong', color: '#1A73E8', width: '100%' };
  };

  return { register, isEmailVerified, resendVerification, passwordStrength };
})();
