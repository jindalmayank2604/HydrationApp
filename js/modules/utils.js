/* ══════════════════════════════════════════
   MODULE: Utils — shared helpers
   ══════════════════════════════════════════ */

const Utils = (() => {
  /* ── Date ── */
  const todayString = () => {
    const d = new Date();
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-');
  };

  const formatDate = (dateStr, opts = {}) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      ...opts,
    });
  };

  /* ── Greeting — personalised for Sampada ── */
  const getGreeting = () => 'Hey, Sampada 👋';

  const getHeaderDate = () =>
    new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  /* ── Motivation ── */
  const getMotivation = (pct) => {
    if (pct >= 1.0) return '🏆 Daily goal reached! Incredible!';
    if (pct >= 0.75) return '💪 So close! Keep it up!';
    if (pct >= 0.5) return '👍 Halfway there — great progress!';
    if (pct >= 0.25) return '💧 Good start! Keep drinking!';
    return '🌊 Start your hydration journey!';
  };

  /* ── Progress color ── */
  const progressColor = (pct) => {
    if (pct >= 1.0) return 'var(--water-full)';
    if (pct >= 0.6) return 'var(--water-good)';
    if (pct >= 0.3) return 'var(--water-mid)';
    return 'var(--water-low)';
  };

  const badgeClass = (pct) => {
    if (pct >= 1.0) return 'success';
    if (pct >= 0.5) return 'warning';
    return 'error';
  };

  const badgeLabel = (pct) => {
    if (pct >= 1.0) return '🏆 Goal Achieved!';
    if (pct >= 0.5) return '👍 Good Progress';
    return '💧 Keep Drinking';
  };

  /* ── DOM helpers ── */
  const el  = (id) => document.getElementById(id);
  const qs  = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ── Toast ── */
  let toastTimer;
  const showToast = (msg) => {
    const t = el('toast');
    clearTimeout(toastTimer);
    t.textContent = msg;
    t.classList.remove('hiding');
    t.classList.add('visible');
    toastTimer = setTimeout(() => {
      t.classList.add('hiding');
      t.addEventListener('animationend', () => t.classList.remove('visible', 'hiding'), { once: true });
    }, 2500);
  };

  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  return {
    todayString, formatDate, getGreeting, getHeaderDate,
    getMotivation, progressColor, badgeClass, badgeLabel,
    el, qs, qsa, showToast, clamp,
  };
})();

/* ── escapeHtml patch ── */
Utils.escapeHtml = (str) => String(str)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ══════════════════════════════════════════
   RIPPLE — attaches to any .ripple-host element
   ══════════════════════════════════════════ */
Utils.initRipples = () => {
  document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest(
      '.main-add-btn, .add-tile, .md-btn--filled, .sheet-log-btn, .hist-save-btn, .login-btn, .login-tab, .an-pill'
    );
    if (!btn) return;

    const rect   = btn.getBoundingClientRect();
    const size   = Math.max(rect.width, rect.height) * 2;
    const x      = e.clientX - rect.left - size / 2;
    const y      = e.clientY - rect.top  - size / 2;

    const wave = document.createElement('span');
    wave.className = 'ripple-wave';
    wave.style.cssText = `
      width:${size}px; height:${size}px;
      left:${x}px; top:${y}px;
    `;
    btn.appendChild(wave);
    wave.addEventListener('animationend', () => wave.remove());
  }, { passive: true });
};

/* ── Number flip animation on heroAmount ── */
Utils.animateNumber = (el) => {
  if (!el) return;
  el.classList.remove('animating');
  void el.offsetWidth; // reflow to restart
  el.classList.add('animating');
  el.addEventListener('animationend', () => el.classList.remove('animating'), { once: true });
};
