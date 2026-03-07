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
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));

    const target = document.getElementById(`screen-${screen}`);
    if (target) target.classList.add('active');

    const navBtn = document.querySelector(`.nav-item[data-screen="${screen}"]`);
    if (navBtn) navBtn.classList.add('active');

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
