/* ══════════════════════════════════════════════════════════════
   MODULE: Profile  (js/modules/profile.js)
   ──────────────────────────────────────────────────────────────
   - Photo upload to Cloudinary (unsigned preset)
   - Smart compression: iteratively reduces quality until ≤ 150 KB
   - Username save to Firestore + session
   ══════════════════════════════════════════════════════════════ */

const Profile = (() => {

  const CLOUD_NAME    = 'du5uifnlf'; // set via Cloudinary unsigned preset
  const UPLOAD_PRESET = 'hydration_avatars';
  const UPLOAD_URL    = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  /* Target byte size for uploaded avatar — 150 KB is plenty for a 400×400 face */
  const TARGET_BYTES  = 150 * 1024;
  /* Absolute max before we even try compressing */
  const MAX_RAW_BYTES = 15 * 1024 * 1024; // 15 MB — catches truly huge camera files

  /* ── Avatar HTML helper ── */
  const avatarHTML = (photoURL, name, size = 40, extraStyle = '') => {
    const letter = (name || '?').charAt(0).toUpperCase();
    if (photoURL) {
      return `<img
        src="${Utils.escapeHtml(photoURL)}"
        alt="${Utils.escapeHtml(name)}"
        style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;flex-shrink:0;display:block;border:2px solid var(--md-primary-light);${extraStyle}"
        onerror="this.outerHTML='<div style=\\'width:${size}px;height:${size}px;border-radius:50%;background:var(--md-primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${Math.round(size*0.4)}px;flex-shrink:0;\\'>${letter}</div>'"
      />`;
    }
    return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:var(--md-primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${Math.round(size*0.4)}px;flex-shrink:0;${extraStyle}">${letter}</div>`;
  };

  /* ── Smart compression ──────────────────────────────────────
     1. Crops to square centre
     2. Resizes to max 800px (high-res safe)
     3. Iteratively reduces JPEG quality until output ≤ TARGET_BYTES
        Passes: 0.85 → 0.72 → 0.60 → 0.48 → 0.36
        If still too large after all passes, halves the pixel dimensions
     ──────────────────────────────────────────────────────── */
  const compressImage = (file) => new Promise((resolve, reject) => {
    if (file.size > MAX_RAW_BYTES) {
      reject(new Error('File too large (max 15 MB). Please choose a smaller image.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload  = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload  = () => {
        /* Step 1: square-crop centre */
        const rawSide = Math.min(img.width, img.height);
        const ox      = Math.floor((img.width  - rawSide) / 2);
        const oy      = Math.floor((img.height - rawSide) / 2);

        /* Step 2: cap at 800px — enough for a sharp profile photo */
        const MAX_PX  = 800;
        let   side    = Math.min(rawSide, MAX_PX);

        const tryCompress = (pixelSide, qualityList) => {
          const c   = document.createElement('canvas');
          c.width   = pixelSide;
          c.height  = pixelSide;
          c.getContext('2d').drawImage(img, ox, oy, rawSide, rawSide, 0, 0, pixelSide, pixelSide);

          for (const q of qualityList) {
            const dataURL  = c.toDataURL('image/jpeg', q);
            const byteLen  = Math.round((dataURL.length - 'data:image/jpeg;base64,'.length) * 3 / 4);
            console.log(`[Profile] compress pass: ${pixelSide}px q=${q} → ${Math.round(byteLen/1024)}KB`);
            if (byteLen <= TARGET_BYTES) return dataURL;
          }
          return c.toDataURL('image/jpeg', qualityList[qualityList.length - 1]);
        };

        /* Quality ladder for full size */
        let result = tryCompress(side, [0.85, 0.72, 0.60, 0.48, 0.36]);

        /* If still over target, halve the dimensions and try again */
        const resultBytes = Math.round((result.length - 'data:image/jpeg;base64,'.length) * 3 / 4);
        if (resultBytes > TARGET_BYTES && side > 200) {
          side   = Math.floor(side / 2);
          result = tryCompress(side, [0.80, 0.65, 0.50]);
        }

        console.log(`[Profile] final: ${Math.round((result.length * 3/4)/1024)}KB`);
        resolve(result);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  /* ── Upload to Cloudinary ── */
  const uploadPhoto = async (file) => {
    const base64 = await compressImage(file);
    const data   = base64.replace(/^data:image\/\w+;base64,/, '');
    const fd     = new FormData();
    fd.append('file',          'data:image/jpeg;base64,' + data);
    fd.append('upload_preset', UPLOAD_PRESET);
    fd.append('folder',        'hydration-app/avatars');

    const res = await fetch(UPLOAD_URL, { method: 'POST', body: fd });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Cloudinary upload failed (' + res.status + ')');
    }
    return (await res.json()).secure_url;
  };

  /* ── Save profile to Firestore + session ── */
  const saveProfile = async ({ photoURL, displayName } = {}) => {
    const session = Auth.getSession();
    if (!session?.uid) throw new Error('Not logged in');
    const db      = firebase.firestore();
    const update  = { updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
    const patch   = {};

    if (photoURL !== undefined) { update.photoURL    = photoURL;              patch.photoURL    = photoURL; }
    if (displayName?.trim())    { update.displayName = displayName.trim();    patch.displayName = displayName.trim(); }

    await db.collection('users').doc(session.uid).set(update, { merge: true });
    if (displayName?.trim() && session.email) {
      await db.collection('Roles').doc(session.email.toLowerCase())
        .set({ displayName: displayName.trim() }, { merge: true }).catch(() => {});
    }
    Auth.saveSession({ ...session, ...patch }, session.rememberMe !== false);
    if (window.Leaderboard && session.uid) Leaderboard.publishStreak(session.uid).catch(() => {});
  };

  return { uploadPhoto, saveProfile, avatarHTML, compressImage };
})();
