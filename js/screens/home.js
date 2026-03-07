/* ══════════════════════════════════════════
   SCREEN: Home — daily tracking dashboard
   ══════════════════════════════════════════ */

const HomeScreen = (() => {
  const QUICK_AMOUNTS = [150, 250, 500, 750];
  const RING_CIRC = 2 * Math.PI * 70;

  /* ── Render ── */
  const render = () => {
    const root = Utils.el('home-root');
    root.innerHTML = `
      <div class="screen-stack">

        <!-- Hero tile -->
        <div class="home-hero">
          <div class="hero-top">
            <div>
              <div class="hero-amount">
                <span id="heroAmount">0</span>
                <span class="hero-unit">ml</span>
              </div>
              <div class="hero-goal">of <span id="heroGoal">${Storage.getGoal()}</span> ml goal</div>
            </div>
            <div class="hero-ring">
              <svg width="80" height="80" viewBox="0 0 160 160">
                <circle class="ring-track" cx="80" cy="80" r="70"/>
                <circle class="ring-fill" id="heroRing" cx="80" cy="80" r="70"
                  style="stroke-dasharray:${RING_CIRC.toFixed(1)};stroke-dashoffset:${RING_CIRC.toFixed(1)}"/>
              </svg>
              <div class="ring-center" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
                <div style="font-family:var(--font-display);font-size:18px;font-weight:700;color:#fff;" id="heroPct">0%</div>
              </div>
            </div>
          </div>

          <div class="hero-progress">
            <div class="progress-track">
              <div class="progress-fill" id="heroProgress" style="background:#fff;"></div>
            </div>
            <div class="hero-progress-labels">
              <span id="heroRemain">3000 ml to go</span>
              <span id="heroGoalLabel">${Storage.getGoal()} ml</span>
            </div>
          </div>
          <div class="hero-motivation" id="heroMotivation">🌊 Start your hydration journey!</div>
        </div>

        <!-- Add / Subtract row -->
        <div style="display:flex;gap:10px;">
          <button class="main-add-btn tile--full" id="mainAddBtn" style="flex:2;">
            <div class="main-add-left">
              <div class="main-add-title">+ Add 250 ml</div>
              <div class="main-add-sub">Tap to log a glass of water</div>
            </div>
            <div class="main-add-icon">💧</div>
          </button>
          <button class="main-sub-btn" id="mainSubBtn" title="Remove 250 ml">
            <span style="font-size:22px;">➖</span>
            <div style="font-size:11px;font-weight:700;margin-top:2px;">250ml</div>
          </button>
        </div>

        <!-- Quick add section -->
        <div class="section-header">
          <span class="section-label">Quick Add</span>
          <span class="section-label" style="font-size:10px;opacity:0.6;">long-press to subtract</span>
        </div>
        <div class="add-tiles" id="quickAddTiles"></div>

        <!-- Stats section -->
        <div class="section-header">
          <span class="section-label">Today</span>
        </div>
        <div class="tile">
          <div class="stat-row">
            <div class="stat-chip">
              <div class="stat-value" id="statTotal">0 ml</div>
              <div class="stat-key">Total intake</div>
            </div>
            <div class="stat-chip">
              <div class="stat-value" id="statRemain">3000 ml</div>
              <div class="stat-key">Remaining</div>
            </div>
            <div class="stat-chip">
              <div class="stat-value" id="statPct">0%</div>
              <div class="stat-key">Goal %</div>
            </div>
          </div>
        </div>

      </div>
    `;

    // Quick add tiles
    const tilesEl = Utils.el('quickAddTiles');
    QUICK_AMOUNTS.forEach(amt => {
      const btn = document.createElement('button');
      btn.className = 'add-tile';
      btn.innerHTML = `
        <div class="add-tile-icon">💧</div>
        <div class="add-tile-val">${amt}</div>
        <div class="add-tile-unit">ml</div>
      `;
      btn.addEventListener('click', () => adjustWater(amt));
      // Long press to subtract
      let pressTimer;
      btn.addEventListener('pointerdown', () => {
        pressTimer = setTimeout(() => {
          adjustWater(-amt);
          btn.style.background = '#FFE0E0';
          setTimeout(() => btn.style.background = '', 400);
        }, 500);
      });
      btn.addEventListener('pointerup', () => clearTimeout(pressTimer));
      btn.addEventListener('pointerleave', () => clearTimeout(pressTimer));
      tilesEl.appendChild(btn);
    });

    Utils.el('mainAddBtn').addEventListener('click', () => adjustWater(250));
    Utils.el('mainSubBtn').addEventListener('click', () => adjustWater(-250));

    updateUI();
  };

  /* ── Update UI ── */
  const updateUI = async () => {
    const goal  = Storage.getGoal();
    const total = await Storage.getTotalForDate(Utils.todayString());
    const pct   = Utils.clamp(total / goal, 0, 1);
    const pctInt = Math.round(pct * 100);
    const remain = Math.max(goal - total, 0);

    const offset = RING_CIRC * (1 - pct);
    const ring = Utils.el('heroRing');
    if (ring) {
      ring.style.strokeDashoffset = offset.toFixed(1);
      ring.style.stroke = '#fff';
    }

    Utils.el('heroAmount') && (Utils.el('heroAmount').textContent = total.toLocaleString());
    Utils.el('heroPct') && (Utils.el('heroPct').textContent = `${pctInt}%`);
    Utils.el('heroProgress') && (Utils.el('heroProgress').style.width = `${pctInt}%`);
    Utils.el('heroRemain') && (Utils.el('heroRemain').textContent =
      remain > 0 ? `${remain} ml to go` : '🎉 Goal reached!');
    Utils.el('heroMotivation') && (Utils.el('heroMotivation').textContent =
      Utils.getMotivation(pct));

    Utils.el('statTotal') && (Utils.el('statTotal').textContent = `${total} ml`);
    Utils.el('statRemain') && (Utils.el('statRemain').textContent = `${remain} ml`);
    Utils.el('statPct') && (Utils.el('statPct').textContent = `${pctInt}%`);
  };

  /* ── Adjust water (add or subtract) ── */
  let isAdjusting = false;
  const adjustWater = async (amount) => {
    if (isAdjusting) return; // Prevent double-tap
    isAdjusting = true;

    const today = Utils.todayString();
    const addBtn = Utils.el('mainAddBtn');
    if (addBtn && amount > 0) addBtn.style.opacity = '0.6';

    try {
      if (amount > 0) {
        await Storage.addEntry(amount, today);
        Utils.showToast(`+${amount} ml added 💧`);
      } else {
        const current = await Storage.getTotalForDate(today);
        const newTotal = Math.max(0, current + amount);
        await Storage.setTotalForDate(today, newTotal);
        Utils.showToast(`${Math.abs(amount)} ml removed 📉`);
      }
      await updateUI();
    } catch (e) {
      console.error('adjustWater error:', e.message);
      Utils.showToast('❌ Error: ' + e.message);
    } finally {
      isAdjusting = false;
      if (addBtn) addBtn.style.opacity = '';
    }
  };

  /* ── Init ── */
  const init = () => {
    render();
    Router.on('home', () => { render(); });
  };

  return { init, updateUI };
})();
