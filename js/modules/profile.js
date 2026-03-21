/*
   MODULE: Profile (js/modules/profile.js)
   - Photo upload to Cloudinary (unsigned preset)
   - Smart compression: iteratively reduces quality until <= 150 KB
   - Username save to Firestore + session
*/

const Profile = (() => {

  const CLOUD_NAME = 'du5uifnlf';
  const UPLOAD_PRESET = 'hydration_avatars';
  const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const TARGET_BYTES = 150 * 1024;
  const MAX_RAW_BYTES = 15 * 1024 * 1024;

  const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No image selected.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.readAsDataURL(file);
  });

  const resolveImageSrc = (photoURL, revision = null) => {
    if (!photoURL || typeof photoURL !== 'string') return null;
    if (/^data:image\//i.test(photoURL)) return photoURL;

    const session = window.Auth?.getSession?.();
    const effectiveRevision = revision ??
      ((session?.photoURL && session.photoURL === photoURL)
        ? (session.photoVersion || session.savedAt || null)
        : null);

    if (!effectiveRevision) return photoURL;
    return `${photoURL}${photoURL.includes('?') ? '&' : '?'}v=${encodeURIComponent(String(effectiveRevision))}`;
  };

  const avatarHTML = (photoURL, name, size = 40, extraStyle = '', revision = null) => {
    if (window.Frames && !extraStyle) {
      // null = show current user's equipped frame (read from UserData state)
      return Frames.avatarWithFrame(photoURL, name, size, null, revision);
    }

    const letter = (name || '?').charAt(0).toUpperCase();
    const src = resolveImageSrc(photoURL, revision);

    if (src) {
      return `<img
        src="${Utils.escapeHtml(src)}"
        alt="${Utils.escapeHtml(name)}"
        loading="lazy"
        decoding="async"
        style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;flex-shrink:0;display:block;border:2px solid var(--md-primary-light);${extraStyle}"
        onerror="this.outerHTML='<div style=\\'width:${size}px;height:${size}px;border-radius:50%;background:var(--md-primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${Math.round(size * 0.4)}px;flex-shrink:0;\\'>${letter}</div>'"
      />`;
    }

    return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:var(--md-primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${Math.round(size * 0.4)}px;flex-shrink:0;${extraStyle}">${letter}</div>`;
  };

  const compressImage = (file) => new Promise((resolve, reject) => {
    if (file.size > MAX_RAW_BYTES) {
      reject(new Error('File too large (max 15 MB). Please choose a smaller image.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const rawSide = Math.min(img.width, img.height);
        const ox = Math.floor((img.width - rawSide) / 2);
        const oy = Math.floor((img.height - rawSide) / 2);

        const MAX_PX = 800;
        let side = Math.min(rawSide, MAX_PX);

        const tryCompress = (pixelSide, qualityList) => {
          const canvas = document.createElement('canvas');
          canvas.width = pixelSide;
          canvas.height = pixelSide;
          canvas.getContext('2d').drawImage(img, ox, oy, rawSide, rawSide, 0, 0, pixelSide, pixelSide);

          for (const quality of qualityList) {
            const dataURL = canvas.toDataURL('image/jpeg', quality);
            const byteLen = Math.round((dataURL.length - 'data:image/jpeg;base64,'.length) * 3 / 4);
            console.log(`[Profile] compress pass: ${pixelSide}px q=${quality} -> ${Math.round(byteLen / 1024)}KB`);
            if (byteLen <= TARGET_BYTES) return dataURL;
          }
          return canvas.toDataURL('image/jpeg', qualityList[qualityList.length - 1]);
        };

        let result = tryCompress(side, [0.85, 0.72, 0.60, 0.48, 0.36]);

        const resultBytes = Math.round((result.length - 'data:image/jpeg;base64,'.length) * 3 / 4);
        if (resultBytes > TARGET_BYTES && side > 200) {
          side = Math.floor(side / 2);
          result = tryCompress(side, [0.80, 0.65, 0.50]);
        }

        console.log(`[Profile] final: ${Math.round((result.length * 3 / 4) / 1024)}KB`);
        resolve(result);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  const uploadPhoto = async (file) => {
    const base64 = await compressImage(file);
    const data = base64.replace(/^data:image\/\w+;base64,/, '');
    const fd = new FormData();
    fd.append('file', `data:image/jpeg;base64,${data}`);
    fd.append('upload_preset', UPLOAD_PRESET);
    fd.append('folder', 'hydration-app/avatars');

    const res = await fetch(UPLOAD_URL, { method: 'POST', body: fd });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Cloudinary upload failed (${res.status})`);
    }
    return (await res.json()).secure_url;
  };

  const saveProfile = async ({ photoURL, displayName } = {}) => {
    const session = Auth.getSession();
    if (!session?.uid) throw new Error('Not logged in');

    const db = firebase.firestore();
    const update = { updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
    const patch = {};

    if (photoURL !== undefined) {
      const photoVersion = Date.now();
      update.photoURL = photoURL;
      update.photoVersion = photoVersion;
      patch.photoURL = photoURL;
      patch.photoVersion = photoVersion;
    }

    if (displayName?.trim()) {
      update.displayName = displayName.trim();
      patch.displayName = displayName.trim();
    }

    await db.collection('users').doc(session.uid).set(update, { merge: true });

    if (displayName?.trim() && session.email) {
      await db.collection('Roles').doc(session.email.toLowerCase())
        .set({ displayName: displayName.trim() }, { merge: true })
        .catch(() => {});
    }

    Auth.saveSession({ ...session, ...patch }, session.rememberMe !== false);
    if (window.Leaderboard && session.uid) Leaderboard.publishStreak(session.uid).catch(() => {});
  };

  return {
    uploadPhoto,
    saveProfile,
    avatarHTML,
    compressImage,
    readFileAsDataURL,
    resolveImageSrc,
  };
})();
