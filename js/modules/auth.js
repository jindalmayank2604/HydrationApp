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
  const ROLES_COLLECTION = 'Roles'; // matches your Firestore collection name

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
        const role = doc.data()?.role?.toLowerCase();
        console.log('Role found:', role);
        return role || null;
      }

      // Try original case
      const doc2 = await db.collection(ROLES_COLLECTION).doc(email.trim()).get();
      if (doc2.exists) {
        const role = doc2.data()?.role?.toLowerCase();
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
  const isUser   = () => !!getSession()?.role;
  const getEmail = () => getSession()?.email || null;
  const getName  = () => getSession()?.displayName || getSession()?.email?.split('@')[0] || 'there';

  /* ── Google Sign-In ── */
  const signInWithGoogle = async (rememberMe = true) => {
    if (!window.firebase) throw new Error('Firebase not loaded yet');
    const provider = new firebase.auth.GoogleAuthProvider();
    const result   = await firebase.auth().signInWithPopup(provider);
    const user     = result.user;

    // Fetch role from Firestore
    const role = await fetchRoleFromFirestore(user.email);

    if (!role) {
      await firebase.auth().signOut();
      throw new Error(`Access denied. Your email (${user.email}) is not registered in the system.`);
    }

    saveSession({
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      uid: user.uid,
      role,
    }, rememberMe);

    return { email: user.email, role, displayName: user.displayName };
  };

  /* ── Email/Password Sign-In ── */
  const signInWithEmail = async (email, password, rememberMe = true) => {
    const ready = await ensureFirebase();
    if (!ready) throw new Error('Firebase not ready. Please refresh and try again.');

    // Sign in to Firebase Auth FIRST (needed if Firestore rules require auth)
    let userCredential;
    try {
      userCredential = await firebase.auth().signInWithEmailAndPassword(email.trim(), password);
    } catch (e) {
      console.warn('Firebase auth error:', e.code, e.message);
      throw new Error('Invalid user credentials.');
    }

    const user = userCredential.user;

    // Now fetch role (user is authenticated, so Firestore rules pass)
    const role = await fetchRoleFromFirestore(user.email);
    if (!role) {
      await firebase.auth().signOut();
      throw new Error('Access denied. Your account is not registered in the system.');
    }

    saveSession({
      email: user.email,
      displayName: user.displayName || email.split('@')[0],
      photoURL: null,
      uid: user.uid,
      role,
    }, rememberMe);

    return { email: user.email, role };
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
      saveSession({
        email: pendingEmail,
        displayName: pendingEmail.split('@')[0],
        photoURL: null,
        uid: pendingEmail,
        role,
      }, rememberMe);
    }
    pendingOtp = null;
    return { success: true, role, email: pendingEmail };
  };

  return {
    signInWithGoogle, signInWithEmail, signOut,
    sendOtp, verifyOtp,
    getSession, saveSession, clearSession,
    isAdmin, isUser, getEmail, getName,
    fetchRoleFromFirestore,
  };
})();
