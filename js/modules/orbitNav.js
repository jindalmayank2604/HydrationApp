/* ══════════════════════════════════════════════════════════
   MODULE: OrbitNav — mobile circular gradient menu
   ══════════════════════════════════════════════════════════ */

const OrbitNav = (() => {

  let _open = false;
  let _nav, _trigger, _items, _backdrop;

  /* ── Sync active item with current route ── */
  const _syncActive = () => {
    const current = Router.getCurrent();
    document.querySelectorAll('.mobile-orbit-item').forEach(btn => {
      btn.classList.toggle('orbit-active', btn.dataset.screen === current);
    });
  };

  /* ── Open / close ── */
  const open = () => {
    _open = true;
    _nav.classList.add('open');
    _backdrop.classList.add('active');
    _trigger.setAttribute('aria-expanded', 'true');
    // Haptic feedback on supported devices
    if (navigator.vibrate) navigator.vibrate(8);
  };

  const close = () => {
    _open = false;
    _nav.classList.remove('open');
    _backdrop.classList.remove('active');
    _trigger.setAttribute('aria-expanded', 'false');
  };

  const toggle = () => _open ? close() : open();

  /* ── Init ── */
  const init = () => {
    _nav      = document.getElementById('mobileOrbitNav');
    _trigger  = document.getElementById('orbitTrigger');
    _items    = document.getElementById('orbitItems');
    _backdrop = document.getElementById('orbitBackdrop');

    if (!_nav || !_trigger) return;

    _trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      toggle();
    });

    // Item clicks — navigate and close
    _items.querySelectorAll('.mobile-orbit-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const screen = btn.dataset.screen;
        if (screen) {
          close();
          // Small delay so close animation plays before nav
          setTimeout(() => Router.navigate(screen), 80);
        }
      });
    });

    // Backdrop closes menu
    _backdrop.addEventListener('click', close);

    // Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && _open) close();
    });

    // Sync active on route change
    Router.on('*', () => {
      _syncActive();
      if (_open) close();
    });

    _syncActive();
  };

  return { init, open, close, toggle };
})();
