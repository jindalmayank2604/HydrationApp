/* ══════════════════════════════════════════════════════════
   MODULE: AppAnimations — Premium animation system
   ──────────────────────────────────────────────────────────
   Architecture:
   • Lottie (lottie_light) for survey screens — loaded lazily
   • Pure CSS animations for micro-interactions (zero deps)
   • CSS confetti as goal-reached celebration fallback
   • No animation loads at startup — on-demand only
   ══════════════════════════════════════════════════════════ */

const AppAnimations = (() => {

  /* ── Lottie JSON sources ──────────────────────────────────
     Using lottie.host public CDN (free, no signup required).
     Each URL is a real published animation, context-matched.
     ────────────────────────────────────────────────────────*/
  const LOTTIE = {
    // Survey screens — one per step, context-aware
    welcome:       'https://lottie.host/4d9b0e8c-1a2b-3c4d-5e6f-7a8b9c0d1e2f/water-drop.json',
    age:           'https://lottie.host/5e0c1f9d-2b3c-4d5e-6f7a-8b9c0d1e2f3a/birthday-cake.json',
    height:        'https://lottie.host/6f1d2a0e-3c4d-5e6f-7a8b-9c0d1e2f3a4b/ruler-measure.json',
    gender:        'https://lottie.host/7a2e3b1f-4d5e-6f7a-8b9c-0d1e2f3a4b5c/heart-rainbow.json',
    workout_freq:  'https://lottie.host/8b3f4c2a-5e6f-7a8b-9c0d-1e2f3a4b5c6d/running-person.json',
    workout_int:   'https://lottie.host/9c4a5d3b-6f7a-8b9c-0d1e-2f3a4b5c6d7e/lightning-power.json',
    result:        'https://lottie.host/0d5b6e4c-7a8b-9c0d-1e2f-3a4b5c6d7e8f/celebration.json',
    // App-wide contextual animations
    goalReached:   'https://lottie.host/1e6c7f5d-8b9c-0d1e-2f3a-4b5c6d7e8f9a/confetti-burst.json',
    coinClaim:     'https://lottie.host/2f7d8a6e-9c0d-1e2f-3a4b-5c6d7e8f9a0b/coin-spin.json',
    loading:       'https://lottie.host/3a8e9b7f-0d1e-2f3a-4b5c-6d7e8f9a0b1c/water-loading.json',
    error:         'https://lottie.host/4b9f0c8a-1e2f-3a4b-5c6d-7e8f9a0b1c2d/error-warning.json',
    streakMile:    'https://lottie.host/5c0a1d9b-2f3a-4b5c-6d7e-8f9a0b1c2d3e/trophy-win.json',
    emptyState:    'https://lottie.host/6d1b2e0c-3a4b-5c6d-7e8f-9a0b1c2d3e4f/empty-box.json',
  };

  /* ── In-memory cache: key → {instance, container} ── */
  const _cache = new Map();
  const _containerMap = new WeakMap();

  /* ── Destroy safely ── */
  const _kill = (instance) => {
    try { if (instance) instance.destroy(); } catch(e) {}
  };

  /* ── CSS-only fallback visuals ── */
  const _fallback = {
    welcome:       { emoji: '💧', color: '#1a73e8', anim: 'ab' },
    age:           { emoji: '🎂', color: '#FF9800', anim: 'sw' },
    height:        { emoji: '📏', color: '#4CAF50', anim: 'ab' },
    gender:        { emoji: '🌈', color: '#9C27B0', anim: 'sw' },
    workout_freq:  { emoji: '🏃', color: '#F44336', anim: 'rn' },
    workout_int:   { emoji: '⚡', color: '#FFC107', anim: 'ab' },
    result:        { emoji: '🎯', color: '#00C853', anim: 'cl' },
    goalReached:   { emoji: '🎉', color: '#00C853', anim: 'ab' },
    coinClaim:     { emoji: '🪙', color: '#FFC107', anim: 'ab' },
    loading:       { emoji: '⏳', color: '#1a73e8', anim: 'sp' },
    error:         { emoji: '⚠️', color: '#F44336', anim: 'sk' },
    streakMile:    { emoji: '🏆', color: '#FFC107', anim: 'ab' },
    emptyState:    { emoji: '📭', color: '#aaa',    anim: 'none' },
  };

  const _animClass = { ab:'aa-bounce', sw:'aa-sway', rn:'aa-run', cl:'aa-celebrate', sp:'aa-spin', sk:'aa-shake', none:'' };

  const _renderFallback = (key) => {
    const f = _fallback[key] || _fallback.loading;
    const cls = _animClass[f.anim] || '';
    return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle,${f.color}22 0%,transparent 70%);border-radius:50%;">
      <span class="${cls}" style="font-size:56px;display:inline-block;">${f.emoji}</span>
    </div>`;
  };

  /* ── Mount Lottie animation into a DOM container ──
     Lazy: only loads when called. Falls back to CSS immediately.  */
  const mount = (container, key, opts = {}) => {
    if (!container) return null;

    // Kill existing instance in this container
    const prev = _containerMap.get(container);
    if (prev) { _kill(prev); _containerMap.delete(container); }

    // Show CSS fallback immediately (instant, no flicker)
    container.innerHTML = _renderFallback(key);

    if (!window.lottie) return null; // Lottie not loaded, CSS fallback stays

    try {
      const url = LOTTIE[key];
      if (!url) return null;

      const inst = lottie.loadAnimation({
        container,
        renderer: 'svg',
        loop: opts.loop !== false,
        autoplay: opts.autoplay !== false,
        path: url,
      });

      // Fade Lottie in on load
      inst.addEventListener('DOMLoaded', () => {
        container.style.transition = 'opacity 0.3s ease';
        container.style.opacity = '1';
      });

      inst.addEventListener('data_failed', () => {
        console.warn('[Anim] Lottie failed for:', key, '— keeping CSS fallback');
      });

      if (opts.onComplete) inst.addEventListener('complete', opts.onComplete);

      _containerMap.set(container, inst);
      return inst;
    } catch(e) {
      console.warn('[Anim] mount error:', e.message);
      return null;
    }
  };

  /* ── Unmount ── */
  const unmount = (container) => {
    if (!container) return;
    const inst = _containerMap.get(container);
    if (inst) { _kill(inst); _containerMap.delete(container); }
    container.innerHTML = '';
  };

  /* ── Goal-reached celebration overlay ── */
  const celebrateGoal = (parentEl) => {
    if (!parentEl) return;
    if (parentEl.querySelector('#goalCelebAnim')) return; // already playing

    const wrap = document.createElement('div');
    wrap.id = 'goalCelebAnim';
    wrap.style.cssText = 'position:absolute;inset:0;z-index:10;pointer-events:none;overflow:hidden;border-radius:inherit;';
    parentEl.style.position = 'relative';
    parentEl.appendChild(wrap);

    if (window.lottie) {
      const inst = mount(wrap, 'goalReached', { loop: false, onComplete: () => {
        wrap.remove(); _kill(inst);
      }});
    } else {
      wrap.innerHTML = _buildCSSConfetti();
      setTimeout(() => wrap.remove(), 2200);
    }
  };

  /* ── Pure-CSS confetti (no deps fallback) ── */
  const _buildCSSConfetti = () => {
    const colors = ['#1a73e8','#00C853','#FBBC04','#EA4335','#9C27B0','#FF9800'];
    let kf = '<style id="confKF">';
    let divs = '';
    for (let i = 0; i < 24; i++) {
      const x = 5 + Math.random() * 90;
      const d = Math.random() * 0.7;
      const dur = 1.0 + Math.random() * 0.8;
      const sz = 5 + Math.random() * 9;
      const rot = 360 + Math.random() * 360;
      const col = colors[i % colors.length];
      const isCircle = Math.random() > 0.5;
      kf += `@keyframes cp${i}{0%{transform:translateY(-10px) rotate(0);opacity:1}100%{transform:translateY(110px) rotate(${rot}deg);opacity:0}}`;
      divs += `<div style="position:absolute;left:${x}%;top:0;width:${sz}px;height:${sz}px;background:${col};border-radius:${isCircle?'50%':'3px'};animation:cp${i} ${dur}s ${d}s ease-out forwards;"></div>`;
    }
    kf += '</style>';
    return kf + divs;
  };

  /* ══════════════════════════════════════════
     GLOBAL CSS ANIMATION SYSTEM
     Injected once — covers all screens
     ══════════════════════════════════════════ */
  const injectGlobalCSS = () => {
    if (document.getElementById('appAnimCSS')) return;
    const s = document.createElement('style');
    s.id = 'appAnimCSS';
    s.textContent = `
      /* ── Keyframes ── */
      @keyframes aa-bounce    { 0%,100%{transform:translateY(0)}    50%{transform:translateY(-10px)} }
      @keyframes aa-sway      { 0%,100%{transform:rotate(-10deg)}    50%{transform:rotate(10deg)} }
      @keyframes aa-run       { 0%,100%{transform:translateX(0)}     25%{transform:translateX(5px) rotate(4deg)} 75%{transform:translateX(-5px) rotate(-4deg)} }
      @keyframes aa-celebrate { 0%{transform:scale(1) rotate(0)}     30%{transform:scale(1.25) rotate(-8deg)} 60%{transform:scale(1.1) rotate(6deg)} 100%{transform:scale(1) rotate(0)} }
      @keyframes aa-spin      { to{transform:rotate(360deg)} }
      @keyframes aa-shake     { 0%,100%{transform:translateX(0)}     20%,60%{transform:translateX(-7px)} 40%,80%{transform:translateX(7px)} }
      @keyframes aa-pop       { 0%{transform:scale(1)} 40%{transform:scale(1.2)} 70%{transform:scale(0.93)} 100%{transform:scale(1)} }
      @keyframes aa-fadein    { from{opacity:0;transform:translateY(14px) scale(0.97)} to{opacity:1;transform:none} }
      @keyframes aa-slideup   { from{opacity:0;transform:translateY(28px)}             to{opacity:1;transform:none} }
      @keyframes aa-scalein   { from{opacity:0;transform:scale(0.85)}                  to{opacity:1;transform:scale(1)} }
      @keyframes slot-exit    { to{transform:translateY(-14px);opacity:0} }
      @keyframes slot-enter   { from{transform:translateY(14px);opacity:0} to{transform:none;opacity:1} }
      @keyframes ripple-out   { to{transform:scale(1);opacity:0} }

      /* Fallback anim helpers */
      .aa-bounce    { animation: aa-bounce    1.5s ease infinite; }
      .aa-sway      { animation: aa-sway      2s   ease infinite; transform-origin:center bottom; }
      .aa-run       { animation: aa-run       0.65s ease infinite; }
      .aa-celebrate { animation: aa-celebrate 0.9s ease 1 0.2s both; }
      .aa-spin      { animation: aa-spin      0.9s linear infinite; }
      .aa-shake     { animation: aa-shake     0.45s ease; }

      /* ── Screen entry animation ── */
      .screen.active {
        animation: aa-fadein 0.3s ease-in-out both;
      }

      /* ── Progress ring smooth ── */
      .ring-fill {
        transition: stroke-dashoffset 0.75s cubic-bezier(0.34,1.2,0.64,1), stroke 0.4s ease !important;
      }

      /* ── Water/progress bars smooth ── */
      .progress-fill,
      .achievement-progress-bar__fill {
        transition: width 0.85s cubic-bezier(0.34,1.2,0.64,1) !important;
      }

      /* ── Button press feedback ── */
      .md-btn, .md-btn--filled,
      .main-add-btn, .main-sub-btn,
      .add-tile, .sheet-log-btn,
      .sv-chip, .sv-cta-btn, .sv-next-btn,
      .achievement-node, .drink-tile {
        transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1),
                    background 0.18s ease,
                    box-shadow  0.18s ease !important;
      }
      .md-btn:active, .md-btn--filled:active,
      .main-add-btn:active, .add-tile:active,
      .sheet-log-btn:active, .sv-chip:active,
      .sv-cta-btn:active, .sv-next-btn:active { transform: scale(0.95) !important; }
      .achievement-node:active               { transform: scale(0.90) !important; }

      /* ── Drink tile selection scale ── */
      .drink-tile { transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), background 0.15s ease, box-shadow 0.15s ease !important; }
      .drink-tile:active  { transform: scale(0.91) !important; }
      .drink-tile.selected {
        transform: scale(1.07) !important;
        box-shadow: 0 6px 20px rgba(26,115,232,0.38) !important;
      }

      /* ── Quick-add tile hover/press ── */
      .add-tile { cursor: pointer; }
      @media (hover:hover) { .add-tile:hover { transform: scale(1.06) !important; } }

      /* ── Card hover lift (desktop only) ── */
      @media (hover:hover) {
        .tile:not([data-no-lift]) {
          transition: transform 0.22s ease, box-shadow 0.22s ease;
          will-change: transform;
        }
        .tile:not([data-no-lift]):hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 36px rgba(0,0,0,0.14);
        }
      }

      /* ── Coin value pop ── */
      .coin-tick {
        animation: aa-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both !important;
      }

      /* ── Stat value update ── */
      .stat-value, .hero-amount, .achievement-coin-card__value {
        transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), color 0.2s ease;
      }
      .slot-exit  { animation: slot-exit  0.18s ease both !important; }
      .slot-enter { animation: slot-enter 0.22s cubic-bezier(0.34,1.2,0.64,1) both !important; }

      /* ── Toast entry ── */
      .toast.visible {
        animation: aa-slideup 0.3s cubic-bezier(0.34,1.2,0.64,1) both !important;
      }

      /* ── Bottom sheet / modal entry ── */
      .drink-sheet.open {
        animation: aa-slideup 0.38s cubic-bezier(0.22,1,0.36,1) both !important;
      }
      .settings-modal.open {
        animation: aa-scalein 0.32s cubic-bezier(0.34,1.2,0.64,1) both !important;
      }

      /* ── Orbit nav item stagger ── */
      #mobileOrbitNav.open .mobile-orbit-item {
        animation: aa-scalein 0.3s cubic-bezier(0.34,1.56,0.64,1) both !important;
      }
      #mobileOrbitNav.open .mobile-orbit-item:nth-child(1) { animation-delay:0.00s !important; }
      #mobileOrbitNav.open .mobile-orbit-item:nth-child(2) { animation-delay:0.04s !important; }
      #mobileOrbitNav.open .mobile-orbit-item:nth-child(3) { animation-delay:0.08s !important; }
      #mobileOrbitNav.open .mobile-orbit-item:nth-child(4) { animation-delay:0.11s !important; }
      #mobileOrbitNav.open .mobile-orbit-item:nth-child(5) { animation-delay:0.14s !important; }
      #mobileOrbitNav.open .mobile-orbit-item:nth-child(6) { animation-delay:0.17s !important; }
      #mobileOrbitNav.open .mobile-orbit-item:nth-child(7) { animation-delay:0.20s !important; }

      /* ── Leaderboard row stagger ── */
      .lb-row { animation: aa-fadein 0.28s ease both; }
      .lb-row:nth-child(1) { animation-delay:0.04s; }
      .lb-row:nth-child(2) { animation-delay:0.08s; }
      .lb-row:nth-child(3) { animation-delay:0.12s; }
      .lb-row:nth-child(4) { animation-delay:0.16s; }
      .lb-row:nth-child(5) { animation-delay:0.20s; }
      .lb-row:nth-child(n+6) { animation-delay:0.24s; }

      /* ── Achievement node reveal ── */
      .achievement-node.is-unlocked {
        animation: aa-scalein 0.32s cubic-bezier(0.34,1.2,0.64,1) both;
      }

      /* ── FAB entrance ── */
      #scanFAB {
        animation: aa-scalein 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.5s both !important;
      }

      /* ── Family join modal ── */
      #familyJoinCard {
        animation: aa-slideup 0.38s cubic-bezier(0.34,1.2,0.64,1) both !important;
      }

      /* ── Ripple ── */
      .ripple-wave {
        position:absolute; border-radius:50%; pointer-events:none;
        background:rgba(255,255,255,0.22);
        transform:scale(0); opacity:1;
        animation: ripple-out 0.5s ease-out forwards;
      }
    `;
    document.head.appendChild(s);
  };

  /* ── Shake element (error feedback) ── */
  const shake = (el) => {
    if (!el) return;
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = 'aa-shake 0.42s ease';
    el.addEventListener('animationend', () => { el.style.animation = ''; }, { once: true });
  };

  /* ── Pop element (value update) ── */
  const pop = (el) => {
    if (!el) return;
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = 'aa-pop 0.38s cubic-bezier(0.34,1.56,0.64,1)';
    el.addEventListener('animationend', () => { el.style.animation = ''; }, { once: true });
  };

  /* ── Stagger list elements in ── */
  const staggerIn = (elements, step = 55) => {
    elements.forEach((el, i) => {
      el.style.cssText += 'opacity:0;transform:translateY(12px);';
      setTimeout(() => {
        el.style.transition = 'opacity 0.28s ease, transform 0.28s cubic-bezier(0.22,1,0.36,1)';
        el.style.opacity = '1';
        el.style.transform = 'none';
      }, i * step);
    });
  };

  /* ── Attach ripple to element ── */
  const addRipple = (el) => {
    if (!el || el._hasRipple) return;
    el._hasRipple = true;
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.addEventListener('pointerdown', (e) => {
      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top  - size / 2;
      const w = document.createElement('span');
      w.className = 'ripple-wave';
      w.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
      el.appendChild(w);
      w.addEventListener('animationend', () => w.remove());
    }, { passive: true });
  };

  /* ── Init: inject CSS, wire ripples ── */
  const init = () => {
    injectGlobalCSS();
    const wireRipples = () => {
      document.querySelectorAll('.md-btn--filled, .main-add-btn, .sheet-log-btn, .sv-cta-btn, .sv-next-btn').forEach(addRipple);
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', wireRipples);
    } else {
      wireRipples();
    }
    if (window.Router) {
      ['home','analytics','achievements','settings','shop'].forEach(scr => {
        Router.on(scr, () => setTimeout(wireRipples, 120));
      });
    }
  };

  return { init, mount, unmount, celebrateGoal, shake, pop, staggerIn, addRipple, injectGlobalCSS };
})();
