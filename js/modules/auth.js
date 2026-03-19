/* ══════════════════════════════════════════
   MODULE: Auth — Google sign-in + OTP + roles
   ══════════════════════════════════════════
   Roles are fetched dynamically from Firestore:
     Collection: "Roles"
     Document ID: user's email
     Field: role → "admin" | "user"
   ══════════════════════════════════════════ */

const Auth = (() => {
  const SESSION_KEY  = 'wt_session_v1';
  const ROLES_COLLECTION = 'Roles';

  /* ── AUTH-4: Simple rate limiter ── */
  const _attempts = { count: 0, lockedUntil: 0 };
  const checkRateLimit = () => {
    if (Date.now() < _attempts.lockedUntil) {
      const secs = Math.ceil((_attempts.lockedUntil - Date.now()) / 1000);
      throw new Error(`Too many attempts. Try again in ${secs}s.`);
    }
  };
  const recordAttempt = (success) => {
    if (success) { _attempts.count = 0; return; }
    _attempts.count++;
    if (_attempts.count >= 5) {
      _attempts.lockedUntil = Date.now() + 30_000;
      _attempts.count = 0;
    }
  }; // matches your Firestore collection name

  /* Active OTP state */
  let pendingOtp   = null;
  let pendingEmail = null;
  let otpExpiry    = null;

  /* ── Ensure Firebase is initialized before role fetch ── */
  const ensureFirebase = async () => {
    if (window.firebase && firebase.apps?.length > 0) return true;
    // Wait up to 5s for Firebase to auto-init
    for (let i = 0; i < 50; i++) {
      await new Promise(r => setTimeout(r, 100));
      if (window.firebase && firebase.apps?.length > 0) return true;
    }
    return false;
  };

  /* ── Fetch role from Firestore ── */
  const fetchRoleFromFirestore = async (email) => {
    try {
      // Use existing firebase instance — don't re-init (would reset auth state)
      if (!window.firebase || !firebase.apps?.length) {
        console.warn('Firebase not initialized for role fetch');
        return null;
      }

      const db = firebase.firestore();
      const emailLower = email.toLowerCase().trim();

      console.log('Fetching role for:', emailLower);

      // Try lowercase
      const doc = await db.collection(ROLES_COLLECTION).doc(emailLower).get();
      if (doc.exists) {
        const role = doc.data()?.role?.toLowerCase().trim();
        console.log('Role found:', role);
        return role || null;
      }

      // Try original case
      const doc2 = await db.collection(ROLES_COLLECTION).doc(email.trim()).get();
      if (doc2.exists) {
        const role = doc2.data()?.role?.toLowerCase().trim();
        console.log('Role found (original case):', role);
        return role || null;
      }

      console.warn('No Roles doc found for:', emailLower, '— make sure it exists in Firestore');
      return null;
    } catch (e) {
      console.warn('Role fetch failed:', e.code, e.message);
      return null;
    }
  };

  /* ── Session helpers ── */
  const saveSession = (user, rememberMe = true) => {
    const data = {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      uid: user.uid,
      role: user.role || null,
      savedAt: Date.now(),
      rememberMe: !!rememberMe,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  };

  const getSession = () => {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY));
      if (!s) return null;
      const maxAge = s.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      if (Date.now() - s.savedAt > maxAge) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return s;
    } catch { return null; }
  };

  const clearSession = () => localStorage.removeItem(SESSION_KEY);

  /* ── Role helpers ── */
  const isAdmin  = () => getSession()?.role === 'admin';
  const isPro    = () => ['pro','maggie'].includes(getSession()?.role?.trim().toLowerCase() || '');
  const isUser   = () => !!getSession()?.role;
  const getEmail = () => getSession()?.email || null;
  const getName  = () => getSession()?.displayName || getSession()?.email?.split('@')[0] || 'there';

  /* ── Google Sign-In ── */
  const signInWithGoogle = async (rememberMe = true) => {
    if (!window.firebase) throw new Error('Firebase not loaded yet');
    const provider = new firebase.auth.GoogleAuthProvider();
    const result   = await firebase.auth().signInWithPopup(provider);
    const user     = result.user;

    // Fetch role — or auto-register new Google users (AUTH-2 fix)
    let role = await fetchRoleFromFirestore(user.email);

    if (!role) {
      // New user via Google — create profile automatically
      try {
        const db = firebase.firestore();
        await db.collection('Roles').doc(user.email.toLowerCase()).set({
          role: 'user',
          uid: user.uid,
          displayName: user.displayName || user.email.split('@')[0],
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          emailVerified: true, // Google accounts are pre-verified
        }, { merge: true });
        await db.collection('users').doc(user.uid).set({
          displayName: user.displayName || user.email.split('@')[0],
          email: user.email.toLowerCase(),
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          streakCount: 0, monthlyStreak: 0,
        }, { merge: true });
        role = 'user';
        console.log('[Auth] New Google user registered:', user.email);
      } catch(e) {
        await firebase.auth().signOut();
        throw new Error('Could not create your account. Please try again.');
      }
    }

    // Prefer Firestore-saved displayName/photoURL (user may have changed them)
    let finalDisplayName = user.displayName;
    let finalPhotoURL    = user.photoURL;
    try {
      const db      = firebase.firestore();
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        const d = userDoc.data();
        if (d.displayName) finalDisplayName = d.displayName;
        if (d.photoURL)    finalPhotoURL    = d.photoURL;
      }
    } catch (e) { /* non-fatal */ }

    saveSession({
      email: user.email,
      displayName: finalDisplayName,
      photoURL: finalPhotoURL,
      uid: user.uid,
      role,
    }, rememberMe);

    return { email: user.email, role, displayName: finalDisplayName };
  };

  /* ── Email/Password Sign-In ── */
  const signInWithEmail = async (email, password, rememberMe = true) => {
    checkRateLimit(); // AUTH-4
    const ready = await ensureFirebase();
    if (!ready) throw new Error('Firebase not ready. Please refresh and try again.');

    // Sign in to Firebase Auth FIRST (needed if Firestore rules require auth)
    let userCredential;
    try {
      userCredential = await firebase.auth().signInWithEmailAndPassword(email.trim(), password);
    } catch (e) {
      console.warn('Firebase auth error:', e.code, e.message);
      recordAttempt(false); throw new Error('Invalid user credentials.');
    }

    const user = userCredential.user;

    // Block unverified email accounts
    if (!user.emailVerified) {
      await firebase.auth().signOut();
      throw new Error('Please verify your email first. Check your inbox for the verification link.');
    }

    // Now fetch role (user is authenticated, so Firestore rules pass)
    const role = await fetchRoleFromFirestore(user.email);
    if (!role) {
      await firebase.auth().signOut();
      throw new Error('Access denied. Your account is not registered in the system.');
    }

    recordAttempt(true);

    // Fetch saved displayName + photoURL from Firestore users doc
    // so profile changes persist across logout/login
    let displayName = user.displayName || email.split('@')[0];
    let photoURL    = null;
    try {
      const db      = firebase.firestore();
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        const d = userDoc.data();
        if (d.displayName) displayName = d.displayName;
        if (d.photoURL)    photoURL    = d.photoURL;
      }
    } catch (e) { console.warn('[Auth] Could not load profile from Firestore:', e.message); }

    // Ensure Maggie always gets pro regardless of stored Firestore role
    const emailLower2 = email.toLowerCase().trim();
    const effectiveRole = (emailLower2 === 'sampadagupta070@gmail.com') ? 'pro' : role;

    saveSession({
      email: user.email,
      displayName,
      photoURL,
      uid: user.uid,
      role: effectiveRole,
    }, rememberMe);

    return { email: user.email, role: effectiveRole };
  };

  /* ── Sign Out ── */
  const signOut = async () => {
    try { if (window.firebase) await firebase.auth().signOut(); } catch {}
    clearSession();
  };

  /* ── OTP: generate ── */
  const sendOtp = (emailOrPhone) => {
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    pendingOtp   = otp;
    pendingEmail = emailOrPhone;
    otpExpiry    = Date.now() + 10 * 60 * 1000;
    console.log(`[OTP] Code for ${emailOrPhone}: ${otp}`);
    return { success: true, otp, simulated: true };
  };

  const verifyOtp = async (inputOtp, rememberMe = true) => {
    if (!pendingOtp) return { success: false, error: 'No OTP pending. Request a new one.' };
    if (Date.now() > otpExpiry) {
      pendingOtp = null;
      return { success: false, error: 'OTP expired. Request a new one.' };
    }
    if (inputOtp.trim() !== pendingOtp) {
      return { success: false, error: 'Incorrect OTP. Try again.' };
    }
    const role = await fetchRoleFromFirestore(pendingEmail);
    if (role) {
      // AUTH-3 fix: encode email into safe uid (no @ in Firestore doc IDs)
      const safeUid = 'otp_' + pendingEmail.replace(/[^a-zA-Z0-9]/g, '_');
      // Try to restore saved displayName + photoURL from Firestore
      let displayName = pendingEmail.split('@')[0];
      let photoURL    = null;
      try {
        const db      = firebase.firestore();
        const userDoc = await db.collection('users').doc(safeUid).get();
        if (userDoc.exists) {
          const d = userDoc.data();
          if (d.displayName) displayName = d.displayName;
          if (d.photoURL)    photoURL    = d.photoURL;
        }
      } catch (e) { /* non-fatal */ }
      const emailLow = pendingEmail.toLowerCase().trim();
      const effectiveRole = (emailLow === 'sampadagupta070@gmail.com') ? 'pro' : role;
      saveSession({
        email: pendingEmail,
        displayName,
        photoURL,
        uid: safeUid,
        role: effectiveRole,
      }, rememberMe);
    }
    pendingOtp = null;
    return { success: true, role, email: pendingEmail };
  };

  return {
    signInWithGoogle, signInWithEmail, signOut,
    sendOtp, verifyOtp,
    getSession, saveSession, clearSession,
    isAdmin, isPro, isUser, getEmail, getName,
    fetchRoleFromFirestore,
  };
})();
