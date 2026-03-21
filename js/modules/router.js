/* ══════════════════════════════════════════
   MODULE: Router — screen switching
   ══════════════════════════════════════════ */

const Router = (() => {
  const handlers = {};
  let current = 'home';

  const on = (screen, fn) => {
    handlers[screen] = handlers[screen] || [];
    handlers[screen].push(fn);
  };

  const navigate = (screen) => {
    // Always scroll to top when navigating
    window.scrollTo(0, 0);
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.mobile-orbit-item').forEach(b => {
      b.classList.remove('active', 'orbit-active');
    });

    const target = document.getElementById(`screen-${screen}`);
    if (target) target.classList.add('active');

    // Sync sidebar nav active
    document.querySelectorAll(`.nav-item[data-screen="${screen}"]`).forEach(b => b.classList.add('active'));
    // Sync orbit nav active
    document.querySelectorAll(`.mobile-orbit-item[data-screen="${screen}"]`).forEach(b => b.classList.add('orbit-active'));

    current = screen;
    (handlers[screen] || []).forEach(fn => fn());
  };

  const init = () => {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => navigate(btn.dataset.screen));
    });
    navigate('home');
  };

  return { init, on, navigate, getCurrent: () => current };
})();
