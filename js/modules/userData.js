const UserData = (() => {
  // Keys are scoped by UID so multiple users on same device don't share data
  const _getUID = () => {
    try {
      if (window.Firebase && Firebase.getUserId()) return Firebase.getUserId();
      if (window.Auth) { const s = Auth.getSession(); if (s && s.uid) return s.uid; }
      // Hard refresh fallback: read UID directly from session storage before Firebase/Auth init
      const _raw = localStorage.getItem('wt_session_v1');
      if (_raw) { const _s = JSON.parse(_raw); if (_s && _s.uid) return _s.uid; }
    } catch(e) {}
    return null;
  };
  const LOCAL_KEY   = 'wt_user_state_v2';
  const _localKey   = () => { const u = _getUID(); return u ? 'wt_state_' + u : null; };
  const PROFILE_KEY = 'wt_user_profile_v1';
  const _profileKey = () => { const u = _getUID(); return u ? 'wt_profile_' + u : null; };

  // Dedicated per-user keys — these NEVER interact with Firestore
  const _readWorkoutToday  = () => { try { const u=_getUID(); return u ? localStorage.getItem('wt_workout_'+u)==='true' : false; } catch(e){ return false; } };
  const _writeWorkoutToday = (v) => { try { const u=_getUID(); if(u) localStorage.setItem('wt_workout_'+u, v?'true':'false'); } catch(e){} };
  const _readEquippedFrame  = () => { try { const u=_getUID(); return u ? (localStorage.getItem('wt_frame_'+u)||null) : null; } catch(e){ return null; } };
  const _writeEquippedFrame = (v) => { try { const u=_getUID(); if(u){ if(v) localStorage.setItem('wt_frame_'+u,v); else localStorage.removeItem('wt_frame_'+u); } } catch(e){} };

  const listeners = new Set();

  const defaultState = () => ({
    currentStreak: 0,
    lastActiveDate: null,
    coinBalance: 0,
    claimedMilestones: [],
    familyMembers: [],
    purchasedFrames: [],
    equippedFrame: null,
    hydrationGoal: LocalStorage.getGoal ? LocalStorage.getGoal() : 3000,
    monthKey: getMonthKey(),
    freeTierUsage: {
      weekKey: getWeekKey(),
      drinksUsed: 0,
    },
    userProfile: {
      username: '',
      photoURL: null,
      age: null,
      height: null,
      gender: '',
      dob: null,
      surveyData: {},
      workoutFrequency: 'moderate',
      workoutIntensity: 'light',
      workoutToday: false,
    },
  });

  let state = defaultState();
  let ready = false;

  // Immediately load from UID-scoped localStorage so getState() returns real data instantly.
  // _getUID() reads from wt_session_v1 which is available even before Firebase initializes.
  try {
    const _earlyUID = _getUID();
    if (_earlyUID) {
      const _earlyKey = 'wt_state_' + _earlyUID;
      const _stored = JSON.parse(localStorage.getItem(_earlyKey));
      if (_stored && _stored.userProfile) {
        state = _stored;
        state.userProfile.workoutToday = _readWorkoutToday();
        if (!state.equippedFrame) state.equippedFrame = _readEquippedFrame();
      }
    }
  } catch(e) {}

  function getMonthKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  function getWeekKey(date = new Date()) {
    const copy = new Date(date);
    const day = (copy.getDay() + 6) % 7;
    copy.setDate(copy.getDate() - day);
    return [
      copy.getFullYear(),
      String(copy.getMonth() + 1).padStart(2, '0'),
      String(copy.getDate()).padStart(2, '0'),
    ].join('-');
  }

  function readLocal() {
    try {
      const key = _localKey();
      if (!key) return defaultState(); // UID not known yet — return clean state
      const scoped = localStorage.getItem(key);
      if (scoped) return JSON.parse(scoped) || defaultState();
      return defaultState();
    } catch {
      return defaultState();
    }
  }

  function writeLocal(nextState) {
    const data = JSON.stringify(nextState);
    const key = _localKey();
    if (key) localStorage.setItem(key, data); // only write scoped key when UID is known
    // DO NOT write to legacy unscoped key — prevents cross-user contamination
  }

  function readProfile() {
    try {
      const key = _profileKey();
      if (!key) return {};
      const scoped = localStorage.getItem(key);
      if (scoped) return JSON.parse(scoped) || {};
      return {};
    } catch { return {}; }
  }

  function writeProfile(profile) {
    if (!profile) return;
    const hasData = profile.age != null || profile.height != null || (profile.gender && profile.gender !== '') || profile.dob != null || (profile.username && profile.username !== '');
    if (hasData) {
      const data = JSON.stringify(profile);
      const pkey = _profileKey();
      if (pkey) localStorage.setItem(pkey, data); // only when UID known
    }
  }

  function mergeState(base, patch) {
    return {
      ...base,
      ...patch,
      freeTierUsage: { ...(base.freeTierUsage || {}), ...((patch && patch.freeTierUsage) || {}) },
      userProfile: { ...(base.userProfile || {}), ...((patch && patch.userProfile) || {}) },
    };
  }

  function emit() {
    listeners.forEach((listener) => {
      try { listener(getState()); } catch (e) { console.warn('[UserData] listener failed:', e.message); }
    });
  }

  async function usersDoc() {
    const uid = Firebase.getUserId();
    if (!uid || !window.firebase || !firebase.apps?.length) return null;
    return firebase.firestore().collection('users').doc(uid);
  }

  function syncGoalToStorage(goal) {
    if (!goal) return;
    LocalStorage.setGoal(goal);
  }

  function normalizeState(input) {
    const base = defaultState();
    // Merge top-level fields from default, but for userProfile, only fill in truly missing keys
    const nextState = {
      ...base,
      ...(input || {}),
      freeTierUsage: { ...(base.freeTierUsage || {}), ...((input && input.freeTierUsage) || {}) },
      userProfile: {
        ...base.userProfile,
        ...((input && input.userProfile) || {}),
      },
    };
    if (!Array.isArray(nextState.claimedMilestones)) nextState.claimedMilestones = [];
    if (!Array.isArray(nextState.familyMembers)) nextState.familyMembers = [];
    if (!nextState.freeTierUsage?.weekKey) nextState.freeTierUsage = { weekKey: getWeekKey(), drinksUsed: 0 };
    return applyPeriodicResets(nextState);
  }

  function applyPeriodicResets(nextState) {
    // NOTE: Streak is PERMANENT — it runs indefinitely until broken (missed day).
    // Monthly reset removed: streaks can go for years.
    // claimedMilestones persist forever — once claimed, never re-claimable.
    const weekKey = getWeekKey();
    if (nextState.freeTierUsage?.weekKey !== weekKey) {
      nextState.freeTierUsage = { weekKey, drinksUsed: 0 };
    }
    return nextState;
  }

  function calculateHydrationGoal(profile = {}) {
    // ── Resolve age from DOB or direct age field ─────────────────────
    let age = Number(profile.age) || 0;
    if (!age && profile.dob) {
      const _p = profile.dob.split('-');
      const _d = new Date(_p[0], Number(_p[1])-1, _p[2]);
      age = Math.floor((Date.now() - _d.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    }
    age = age || 25;

    const height      = Number(profile.height) || 170;
    const gender      = (profile.gender || 'other').toLowerCase();
    const intensity   = (profile.workoutIntensity || 'light').toLowerCase();
    const frequency   = (profile.workoutFrequency || 'moderate').toLowerCase();
    const workoutToday = !!profile.workoutToday;

    // ── Base calculation using weight-estimate from height ───────────
    // Estimated weight from height (Broca index approximation):
    //   male: height - 100, female: (height - 100) * 0.85, other: avg
    let estimatedWeight;
    if (gender === 'male')   estimatedWeight = height - 100;
    else if (gender === 'female') estimatedWeight = (height - 100) * 0.85;
    else                     estimatedWeight = (height - 100) * 0.925; // non-binary/other: midpoint

    estimatedWeight = Math.max(40, Math.min(120, estimatedWeight));

    // ── Gender-specific base formula ─────────────────────────────────
    // Males:   ~35ml per kg body weight (higher muscle mass = more metabolic water need)
    // Females: ~31ml per kg (generally lower metabolic rate)
    // Other:   ~33ml per kg (midpoint, inclusive)
    let mlPerKg;
    if (gender === 'male')         mlPerKg = 35;
    else if (gender === 'female')  mlPerKg = 31;
    else                           mlPerKg = 33;

    let goal = Math.round(estimatedWeight * mlPerKg);

    // ── Age adjustments ──────────────────────────────────────────────
    // Children/teens: slightly less due to lower body mass
    if (age < 14)       goal = Math.round(goal * 0.75);
    else if (age < 18)  goal = Math.round(goal * 0.88);
    // Middle age: slight increase due to reduced thirst perception
    else if (age >= 55) goal = Math.round(goal * 1.05);
    else if (age >= 70) goal = Math.round(goal * 1.08);

    // ── Workout intensity bonus (ml) ─────────────────────────────────
    // Males sweat more per session, so bonus is higher
    const intensityBonus = gender === 'male'
      ? { none: 0, light: 250, moderate: 450, intense: 700, athlete: 950 }
      : gender === 'female'
        ? { none: 0, light: 180, moderate: 320, intense: 520, athlete: 720 }
        : { none: 0, light: 215, moderate: 385, intense: 610, athlete: 835 };

    // ── Workout frequency multiplier ─────────────────────────────────
    const frequencyBonus = { rare: 0, light: 60, moderate: 130, frequent: 200, daily: 270 };

    goal += intensityBonus[intensity] || 0;
    goal += frequencyBonus[frequency] || 0;

    // ── Active workout day boost ─────────────────────────────────────
    if (workoutToday) goal += Math.round((intensityBonus[intensity] || 200) * 0.85);

    // ── Round to nearest 50ml, clamp to sensible range ───────────────
    return Math.min(6000, Math.max(1500, Math.round(goal / 50) * 50));
  }

  function getMilestoneGapForValue(streakValue) {
    if (streakValue <= 60) return 5;
    if (streakValue <= 120) return 10;
    if (streakValue <= 180) return 15;
    return 20;
  }

  function buildMilestones(currentStreak = state.currentStreak, count = 10) {
    const items = [];
    let cursor = 5;
    let safety = 0;
    const target = Math.max(currentStreak + 60, 60);
    while ((items.length < count || cursor <= target) && safety < 400) {
      items.push({
        streak: cursor,
        reward: getRewardForMilestone(cursor),
        claimed: state.claimedMilestones.includes(cursor) || (state.allTimeClaimedMilestones || []).includes(cursor),
        unlocked: currentStreak >= cursor,
      });
      cursor += getMilestoneGapForValue(cursor);
      safety += 1;
    }
    return items.slice(0, Math.max(count, items.findIndex((m) => !m.unlocked) + 4 || count));
  }

  function getRewardForMilestone(streakValue) {
    return Math.round(20 + streakValue * 1.6 + Math.floor(streakValue / 30) * 12);
  }

  async function getEntriesForCurrentMonth() {
    if (!Firebase.getUserId() || !window.firebase || !firebase.apps?.length) return [];
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const docRef = firebase.firestore().collection('users').doc(Firebase.getUserId()).collection('water_entries');
    const snap = await docRef.where('date', '>=', monthStart).get();
    return snap.docs.map((doc) => doc.data());
  }

  function aggregateTotals(entries) {
    return entries.reduce((acc, entry) => {
      if (!entry?.date) return acc;
      acc[entry.date] = (acc[entry.date] || 0) + (entry.amount || 0);
      return acc;
    }, {});
  }

  function formatDateKey(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }

  async function recomputeProgress() {
    const current = getState();
    const goal = current.hydrationGoal || calculateHydrationGoal(current.userProfile);
    let streak = 0;
    let lastActiveDate = null;
    try {
      const totals = aggregateTotals(await getEntriesForCurrentMonth());
      const today = new Date();
      const pointer = new Date(today);
      const todayKey = formatDateKey(today);

      if ((totals[todayKey] || 0) < goal) pointer.setDate(pointer.getDate() - 1);
      while (pointer.getMonth() === today.getMonth()) {
        const key = formatDateKey(pointer);
        if ((totals[key] || 0) >= goal) {
          streak += 1;
          lastActiveDate = key;
          pointer.setDate(pointer.getDate() - 1);
        } else {
          break;
        }
      }
    } catch (e) {
      console.warn('[UserData] recomputeProgress failed:', e.message);
    }

    await save({
      currentStreak: streak,
      lastActiveDate,
      hydrationGoal: goal,
    });
    return getState();
  }

  async function save(patch = {}, remoteOnly = false) {
    // Preserve existing non-null userProfile fields before normalizing
    const _profileBefore = state.userProfile ? JSON.parse(JSON.stringify(state.userProfile)) : {};
    state = normalizeState(mergeState(state, patch));
    // Restore any profile fields that got wiped to null by normalizeState
    const up = state.userProfile;
    if (_profileBefore.age      != null && up.age      == null) up.age      = _profileBefore.age;
    if (_profileBefore.height   != null && up.height   == null) up.height   = _profileBefore.height;
    if (_profileBefore.gender   !== ''  && up.gender   === ''  ) up.gender   = _profileBefore.gender;
    if (_profileBefore.dob      != null && up.dob      == null) up.dob      = _profileBefore.dob;
    if (_profileBefore.username !== ''  && up.username === ''  ) up.username = _profileBefore.username;
    if (_profileBefore.photoURL   != null && up.photoURL   == null) up.photoURL   = _profileBefore.photoURL;
    // workoutToday: if it was explicitly true before, keep it true unless patch explicitly sets it false
    if (_profileBefore.workoutToday === true && up.workoutToday !== true && !('workoutToday' in (patch.userProfile || {}))) {
      up.workoutToday = true;
    }
    syncGoalToStorage(state.hydrationGoal);
    _writeWorkoutToday(state.userProfile.workoutToday);
    _writeEquippedFrame(state.equippedFrame);
    if (!remoteOnly) writeLocal(state);

    const doc = await usersDoc();
    if (doc) {
      try {
        // 'profile' is a dedicated top-level Firestore field — single source of truth for profile.
        // Kept separate from achievementState so it can never be clobbered by non-profile saves.
        const _pf = {
          username:         state.userProfile.username         != null ? state.userProfile.username         : null,
          photoURL:         state.userProfile.photoURL         != null ? state.userProfile.photoURL         : null,
          age:              state.userProfile.age              != null ? state.userProfile.age              : null,
          height:           state.userProfile.height           != null ? state.userProfile.height           : null,
          gender:           state.userProfile.gender           != null ? state.userProfile.gender           : null,
          workoutIntensity: state.userProfile.workoutIntensity != null ? state.userProfile.workoutIntensity : null,
          workoutFrequency: state.userProfile.workoutFrequency != null ? state.userProfile.workoutFrequency : null,
          workoutToday:     !!state.userProfile.workoutToday,
          dob:              state.userProfile.dob != null ? state.userProfile.dob : null,
          surveyData:       state.userProfile.surveyData || {},
        };
        console.log('[UserData] Firestore write — profile:', JSON.stringify(_pf));
        await doc.set({
          profile: _pf,
          profileMeta: _pf,
          userProfile: _pf,
          equippedFrame: state.equippedFrame || null,
          purchasedFrames: state.purchasedFrames || [],
          workoutToday: !!state.userProfile.workoutToday,
          achievementState: {
            currentStreak: state.currentStreak,
            lastActiveDate: state.lastActiveDate,
            coinBalance: state.coinBalance,
            claimedMilestones: state.claimedMilestones,
            familyMembers: state.familyMembers,
            hydrationGoal: state.hydrationGoal,
            monthKey: state.monthKey,
            freeTierUsage: state.freeTierUsage,
            userProfile: state.userProfile,
            equippedFrame: state.equippedFrame || null,
            purchasedFrames: state.purchasedFrames || [],
          },
          hydrationGoal: state.hydrationGoal,
          surveyData: state.userProfile.surveyData || {},
        }, { merge: true });
      } catch (e) {
        console.warn('[UserData] remote save failed:', e.message);
      }
    }

    emit();
    return getState();
  }

  async function sync() {
    const local = readLocal();
    state = normalizeState(local);
    // Wait for Firebase to be ready before reading Firestore
    if (window.Firebase?.waitUntilReady) {
      await Firebase.waitUntilReady(8000);
    }
    const doc = await usersDoc();
    if (doc) {
      try {
        const snap = await doc.get();
        if (snap.exists) {
          const data = snap.data() || {};
          const as = data.achievementState || {};

          // Merge non-profile achievement fields first
          state = normalizeState(mergeState(state, {
            currentStreak:    as.currentStreak,
            lastActiveDate:   as.lastActiveDate,
            coinBalance:      as.coinBalance,
            claimedMilestones: as.claimedMilestones,
            familyMembers:    as.familyMembers,
            hydrationGoal:    as.hydrationGoal || data.hydrationGoal,
            monthKey:         as.monthKey,
            freeTierUsage:    as.freeTierUsage,
          }));

          // Restore frames from Firestore — achievementState is primary source
          if (as.equippedFrame !== undefined) state.equippedFrame = as.equippedFrame;
          if (Array.isArray(as.purchasedFrames)) state.purchasedFrames = as.purchasedFrames;
          // Also check top-level equippedFrame field (may be more recent than achievementState)
          if (data.equippedFrame !== undefined) state.equippedFrame = data.equippedFrame;
          if (Array.isArray(data.purchasedFrames)) state.purchasedFrames = data.purchasedFrames;
          _writeEquippedFrame(state.equippedFrame); // cache locally for instant display

          // Read profile from ALL sources — 'profile' top-level field has highest priority,
          // then profileMeta, then achievementState.userProfile, then local state.
          const ap  = as.userProfile    || {};
          const pm  = data.profileMeta  || {};
          const dp  = data.profile      || {};  // dedicated top-level field (most reliable)
          const lp  = state.userProfile || {};

          // pick() returns first value that is not null/undefined/empty-string
          const pick = function() {
            for (var i = 0; i < arguments.length; i++) {
              var v = arguments[i];
              if (v !== null && v !== undefined && v !== '') return v;
            }
            return null;
          };

          // data.userProfile is a TOP-LEVEL field on the Firestore document (visible in Image 1)
          // This is separate from achievementState.userProfile and is the most reliable source
          const tp  = data.userProfile || {};  // top-level userProfile field

          console.log('[UserData] sync sources — dp:', JSON.stringify(dp), '| tp:', JSON.stringify(tp), '| pm:', JSON.stringify(pm), '| as.userProfile:', JSON.stringify(ap));

          state.userProfile = {
            username:         pick(dp.username, tp.username, pm.username, ap.username, lp.username, data.displayName) || '',
            photoURL:         pick(dp.photoURL, tp.photoURL, pm.photoURL, ap.photoURL, lp.photoURL, data.photoURL),
            age:              pick(dp.age, tp.age, pm.age, ap.age, lp.age),
            height:           pick(dp.height, tp.height, pm.height, ap.height, lp.height),
            gender:           pick(dp.gender, tp.gender, pm.gender, ap.gender, lp.gender) || '',
            dob:              pick(dp.dob, tp.dob, pm.dob, ap.dob, lp.dob),
            workoutIntensity: pick(dp.workoutIntensity, tp.workoutIntensity, pm.workoutIntensity, ap.workoutIntensity, lp.workoutIntensity) || 'light',
            workoutFrequency: pick(dp.workoutFrequency, tp.workoutFrequency, pm.workoutFrequency, ap.workoutFrequency, lp.workoutFrequency) || 'moderate',
            workoutToday:     _readWorkoutToday(),
            surveyData:       dp.surveyData || tp.surveyData || pm.surveyData || ap.surveyData || data.surveyData || lp.surveyData || {},
          };

          if (data.hydrationGoal) state.hydrationGoal = data.hydrationGoal;

          state.userProfile.workoutToday = _readWorkoutToday(); // enforce after Firestore rebuild
          console.log('[UserData] sync result — age:', state.userProfile.age, 'height:', state.userProfile.height, 'gender:', state.userProfile.gender);
        }
      } catch (e) {
        console.warn('[UserData] sync failed:', e.message);
      }
    }
    // Merge cached profile (from PROFILE_KEY) — this survives across all save() calls
    const cachedProfile = readProfile();
    const pick2 = function() {
      for (var i = 0; i < arguments.length; i++) {
        var v = arguments[i];
        if (v !== null && v !== undefined && v !== '') return v;
      }
      return null;
    };
    if (cachedProfile && Object.keys(cachedProfile).length > 0) {
      const up = state.userProfile;
      state.userProfile = {
        username:         pick2(up.username, cachedProfile.username) || '',
        photoURL:         pick2(up.photoURL, cachedProfile.photoURL),
        age:              pick2(up.age, cachedProfile.age),
        height:           pick2(up.height, cachedProfile.height),
        gender:           pick2(up.gender, cachedProfile.gender) || '',
        dob:              pick2(up.dob, cachedProfile.dob),
        workoutIntensity: pick2(up.workoutIntensity, cachedProfile.workoutIntensity) || 'light',
        workoutFrequency: pick2(up.workoutFrequency, cachedProfile.workoutFrequency) || 'moderate',
        workoutToday:     _readWorkoutToday(), // dedicated local key — survives all syncs
        surveyData:       up.surveyData || cachedProfile.surveyData || {},
      };
    }
    console.log('[UserData] final profile after sync+cache merge:', JSON.stringify({age:state.userProfile.age, height:state.userProfile.height, gender:state.userProfile.gender, dob:state.userProfile.dob}));
    state.userProfile.workoutToday = _readWorkoutToday(); // final enforcement
    state.equippedFrame = _readEquippedFrame() || state.equippedFrame; // final enforcement
    ready = true;
    // Persist synced state to UID-scoped localStorage immediately so hard refresh gets correct data
    writeLocal(state);
    // Immediately patch leaderboard equippedFrame to match Firestore truth
    // This corrects any stale frame written from a different user's localStorage
    const _lbUid = Firebase.getUserId();
    if (_lbUid && window.firebase && firebase.apps?.length) {
      firebase.firestore().collection('leaderboard').doc(_lbUid)
        .set({ equippedFrame: state.equippedFrame || null }, { merge: true })
        .catch(() => {});
    }
    syncGoalToStorage(state.hydrationGoal);
    writeLocal(state);
    emit();
    return getState();
  }

  async function initForSession() {
    await sync();
    return recomputeProgress();
  }

  async function saveProfile(profilePatch = {}) {
    const nextProfile = {
      ...state.userProfile,
      ...profilePatch,
      surveyData: {
        ...(state.userProfile.surveyData || {}),
        ...(profilePatch.surveyData || {}),
      },
    };
    const hydrationGoal = calculateHydrationGoal(nextProfile);
    // Write profile to its own localStorage key BEFORE anything else can touch it
    writeProfile(nextProfile);
    await save({ userProfile: nextProfile, hydrationGoal });
    writeProfile(state.userProfile); // write again after save in case state changed
    await recomputeProgress();
    writeProfile(state.userProfile); // write again after recompute
    return getState();
  }

  function canUseFreeDrink() {
    const role = Utils.getRole ? Utils.getRole() : 'user';
    if (['pro', 'admin', 'maggie'].includes(role)) {
      return { allowed: true, remaining: Infinity, used: 0, limit: null };
    }
    const usage = state.freeTierUsage || { weekKey: getWeekKey(), drinksUsed: 0 };
    const limit = 5;
    return {
      allowed: usage.drinksUsed < limit,
      used: usage.drinksUsed,
      remaining: Math.max(0, limit - usage.drinksUsed),
      limit,
    };
  }

  async function registerDrinkUsage() {
    const usage = state.freeTierUsage || { weekKey: getWeekKey(), drinksUsed: 0 };
    await save({
      freeTierUsage: {
        weekKey: getWeekKey(),
        drinksUsed: usage.drinksUsed + 1,
      },
    });
    return canUseFreeDrink();
  }

  async function claimMilestone(streakValue) {
    const milestone = buildMilestones(state.currentStreak, 40).find((item) => item.streak === streakValue);
    if (!milestone || !milestone.unlocked || milestone.claimed) return null;
    // allTimeClaimed persists forever — prevents re-claiming after streak breaks & restarts
    const allTimeClaimed = [...(state.allTimeClaimedMilestones || [])];
    if (allTimeClaimed.includes(streakValue)) return null; // already claimed in a prior streak
    allTimeClaimed.push(streakValue);
    const claimedMilestones = [...state.claimedMilestones, streakValue];
    const coinBalance = (state.coinBalance || 0) + milestone.reward;
    await save({ claimedMilestones, allTimeClaimedMilestones: allTimeClaimed, coinBalance });
    return { reward: milestone.reward, coinBalance };
  }

  async function addFamilyMember(memberUid) {
    const cleanUid = String(memberUid || '').trim();
    if (!cleanUid) throw new Error('Invalid user ID.');
    const myUid = window.Firebase ? Firebase.getUserId() : null;
    if (!myUid) throw new Error('Not logged in.');
    if (cleanUid === myUid) throw new Error('You cannot add yourself.');
    // Prevent duplicates
    if ((state.familyMembers || []).includes(cleanUid)) throw new Error('Already in your family.');
    const members = Array.from(new Set([...(state.familyMembers || []), cleanUid]));
    await save({ familyMembers: members });
    return members;
  }

  async function addFamilyMemberBidirectional(inviterUid, joinerUid) {
    /* ── COMPLETE REWRITE: robust write + verify + UI refresh ──────
       Root problems identified:
       1. strict myUid !== joinerUid guard threw 'Auth mismatch' if
          Firebase.getUserId() returned a slightly different value
          than the one passed in — error was swallowed by catch().
       2. No read-back to confirm Firestore actually wrote.
       3. No forced emit() to refresh UI listeners after save.
       ─────────────────────────────────────────────────────────────── */
    if (!window.firebase || !firebase.apps?.length) throw new Error('Firebase not ready.');
    if (!inviterUid) throw new Error('Invalid inviter ID.');

    // Always use the live Firebase auth UID — never trust a passed-in joinerUid
    const myUid = Firebase.getUserId();
    if (!myUid) throw new Error('Not logged in. Please sign in and try again.');
    if (inviterUid === myUid) throw new Error('You cannot join your own family.');

    const db = firebase.firestore();

    // 1. Validate inviter exists
    console.log('[Family] Step 1: validating inviter', inviterUid);
    let inviterDoc;
    try {
      inviterDoc = await db.collection('users').doc(inviterUid).get();
    } catch(e) {
      throw new Error('Could not reach Firestore: ' + e.message);
    }
    if (!inviterDoc.exists) throw new Error('Invite link is invalid or expired.');

    // 2. Check duplicate against CURRENT local state
    const currentMembers = state.familyMembers || [];
    console.log('[Family] Step 2: current familyMembers before add:', currentMembers);
    if (currentMembers.includes(inviterUid)) {
      console.log('[Family] Already connected — no write needed.');
      throw new Error('Already connected with this person.');
    }

    // 3. Build new array
    const newMembers = Array.from(new Set([...currentMembers, inviterUid]));
    console.log('[Family] Step 3: writing newMembers:', newMembers);

    // 4. Write via save() — this hits achievementState.familyMembers (the path sync() reads)
    await save({ familyMembers: newMembers });
    console.log('[Family] Step 4: save() complete. Local state familyMembers:', state.familyMembers);

    // 5. Read back from Firestore to confirm write landed
    try {
      const written = await db.collection('users').doc(myUid).get();
      const writtenMembers = written.data()?.achievementState?.familyMembers || [];
      console.log('[Family] Step 5: Firestore read-back familyMembers:', writtenMembers);
      if (!writtenMembers.includes(inviterUid)) {
        console.warn('[Family] WARNING: inviterUid not found in Firestore after write — rules may have blocked it silently.');
      }
    } catch(e) {
      console.warn('[Family] Step 5: read-back failed (non-fatal):', e.message);
    }

    // 6. Force UI refresh — emit() notifies all UserData subscribers (settings count, leaderboard)
    _famLbCacheInvalidate();
    _reverseFamilyCache = { uids: [], ts: 0 };
    emit();
    console.log('[Family] Step 6: emit() fired, UI should refresh.');

    return state.familyMembers;
  }

  /* ── Family leaderboard cache (localStorage, 5-min TTL) ── */
  const _FAM_LB_CACHE_KEY = 'wt_fam_lb_cache_v1';
  const _FAM_LB_TTL = 5 * 60 * 1000;

  const _famLbCacheRead = () => {
    try {
      const raw = localStorage.getItem(_FAM_LB_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.ts > _FAM_LB_TTL) return null;
      return parsed.rows;
    } catch { return null; }
  };
  const _famLbCacheWrite = (rows) => {
    try { localStorage.setItem(_FAM_LB_CACHE_KEY, JSON.stringify({ ts: Date.now(), rows })); } catch {}
  };
  const _famLbCacheInvalidate = () => {
    try { localStorage.removeItem(_FAM_LB_CACHE_KEY); } catch {}
  };

  const _sortFamilyRows = (rows) =>
    rows.sort((a, b) => {
      const sd = (b.dailyStreak||0)-(a.dailyStreak||0); if (sd!==0) return sd;
      const gd = (b.goal||0)-(a.goal||0); if (gd!==0) return gd;
      const ap = a.goal?(a.waterIntakeToday||0)/a.goal:0;
      const bp = b.goal?(b.waterIntakeToday||0)/b.goal:0;
      return bp-ap;
    }).map((r,i) => ({ ...r, rank: i+1 }));

  // Cached reverse-lookup UIDs (users who added ME to their family)
  let _reverseFamilyCache = { uids: [], ts: 0 };
  const _REVERSE_TTL = 5 * 60 * 1000; // 5 min

  /* Fetch UIDs of users who have added myUid to their familyMembers.
     This is the reverse-lookup needed for mutual visibility without
     cross-user writes. Cached to avoid repeated Firestore reads. */
  const _fetchReverseFamily = async (myUid) => {
    if (!myUid || !window.firebase || !firebase.apps?.length) return [];
    const now = Date.now();
    if (_reverseFamilyCache.uids.length && now - _reverseFamilyCache.ts < _REVERSE_TTL) {
      return _reverseFamilyCache.uids;
    }
    try {
      const snap = await firebase.firestore().collection('users')
        .where('familyMembers', 'array-contains', myUid)
        .get();
      const uids = snap.docs.map(d => d.id).filter(id => id !== myUid);
      _reverseFamilyCache = { uids, ts: now };
      return uids;
    } catch(e) {
      console.warn('[UserData] reverse family lookup failed:', e.message);
      return [];
    }
  };

  const _getFamilyUids = () => {
    const myUid = window.Firebase ? Firebase.getUserId() : null;
    // Synchronous: returns own familyMembers + self only.
    // For full mutual visibility, callers should use _getFamilyUidsAsync().
    return Array.from(new Set([
      ...(state.familyMembers || []),
      ...(myUid ? [myUid] : [])
    ].filter(Boolean)));
  };

  /* Async version: adds reverse-lookup UIDs for mutual visibility */
  const _getFamilyUidsAsync = async () => {
    const myUid = window.Firebase ? Firebase.getUserId() : null;
    const reverseUids = myUid ? await _fetchReverseFamily(myUid) : [];
    return Array.from(new Set([
      ...(state.familyMembers || []),
      ...reverseUids,
      ...(myUid ? [myUid] : [])
    ].filter(Boolean)));
  };

  async function fetchFamilyLeaderboard(forceRefresh) {
    if (!window.firebase || !firebase.apps?.length) return [];
    const memberUids = await _getFamilyUidsAsync();
    if (!memberUids.length) return [];

    // Return from cache unless forced refresh
    if (!forceRefresh) {
      const cached = _famLbCacheRead();
      if (cached) return cached;
    }

    // OPTIMIZED: Firestore allows max 10 ids in 'in' query — batch into chunks of 10
    const db = firebase.firestore();
    const rows = [];
    const CHUNK = 10;

    for (let i = 0; i < memberUids.length; i += CHUNK) {
      const chunk = memberUids.slice(i, i + CHUNK);
      try {
        const snap = await db.collection('leaderboard')
          .where(firebase.firestore.FieldPath.documentId(), 'in', chunk)
          .get();
        const found = new Set();
        snap.docs.forEach(doc => {
          found.add(doc.id);
          rows.push({ uid: doc.id, ...doc.data() });
        });
        // Fill missing uids with defaults (no extra reads)
        chunk.forEach(uid => {
          if (!found.has(uid)) {
            rows.push({ uid, displayName: uid.slice(0,8), dailyStreak: 0, monthlyStreak: 0, goal: 2500, waterIntakeToday: 0 });
          }
        });
      } catch (e) {
        console.warn('[UserData] family batch fetch failed:', e.message);
        chunk.forEach(uid => rows.push({ uid, displayName: uid.slice(0,8), dailyStreak: 0, monthlyStreak: 0, goal: 2500, waterIntakeToday: 0 }));
      }
    }

    const sorted = _sortFamilyRows(rows);
    _famLbCacheWrite(sorted);
    return sorted;
  }

  /* ── Single listener: only the CURRENT user's leaderboard doc ── */
  /* Instead of N listeners for N family members, we only listen to  */
  /* our own doc changing. Family data is fetched on-demand with TTL.*/
  function subscribeToFamilyLeaderboard(callback) {
    // Bootstrap with sync UIDs immediately, then enhance with reverse lookup
    const syncUids = _getFamilyUids();
    const cached = _famLbCacheRead();
    if (cached) callback(cached);

    let _debounceTimer = null;
    let _unsub = null;
    let _cancelled = false;

    const _refresh = () => {
      clearTimeout(_debounceTimer);
      _debounceTimer = setTimeout(async () => {
        if (_cancelled) return;
        const rows = await fetchFamilyLeaderboard(true);
        if (!_cancelled) callback(rows);
      }, 400);
    };

    // Attach own-doc listener (fires when our leaderboard data changes)
    const myUid = window.Firebase ? Firebase.getUserId() : null;
    if (myUid && window.firebase && firebase.apps?.length) {
      try {
        _unsub = firebase.firestore().collection('leaderboard').doc(myUid)
          .onSnapshot(() => _refresh(), err => console.warn('[FamilyLB] own-doc listener:', err.message));
      } catch(e) { console.warn('[FamilyLB] could not attach listener:', e.message); }
    }

    // If no cache, do initial fetch (includes reverse-lookup via _getFamilyUidsAsync)
    if (!cached) _refresh();

    return () => {
      _cancelled = true;
      clearTimeout(_debounceTimer);
      if (_unsub) _unsub();
    };
  }

  function getState() {
    return JSON.parse(JSON.stringify(state));
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return {
    sync,
    initForSession,
    save,
    saveProfile,
    getState,
    subscribe,
    recomputeProgress,
    calculateHydrationGoal,
    buildMilestones,
    claimMilestone,
    getRewardForMilestone,
    addFamilyMember,
    addFamilyMemberBidirectional,
    fetchFamilyLeaderboard,
    subscribeToFamilyLeaderboard,
    canUseFreeDrink,
    registerDrinkUsage,
    isReady: () => ready,
  };
})();
