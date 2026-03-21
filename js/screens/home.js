/* ══════════════════════════════════════════
   SCREEN: Home — daily tracking dashboard
   ══════════════════════════════════════════ */

const HomeScreen = (() => {
  const QUICK_AMOUNTS = [250, 500, 750, 1000];
  const RING_CIRC = 2 * Math.PI * 70;

  /* ── Render ── */
  const render = () => {
    const root = Utils.el('home-root');
    const userState = window.UserData ? UserData.getState() : { hydrationGoal: Storage.getGoal(), coinBalance: 0 };
    const usage = window.UserData ? UserData.canUseFreeDrink() : { limit: null, used: 0, remaining: 0 };
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
              <div class="hero-goal">of <span id="heroGoal">${userState.hydrationGoal || Storage.getGoal()}</span> ml goal</div>
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
              <span id="heroGoalLabel">${userState.hydrationGoal || Storage.getGoal()} ml</span>
            </div>
          </div>
          <div class="hero-motivation" id="heroMotivation">🌊 Start your hydration journey!</div>
        </div>

        <!-- streak + free drink strip -->
        <div class="home-strip">
          <div class="home-strip__item">
            <span class="home-strip__icon">🔥</span>
            <span class="home-strip__val" id="homeStreakVal">0</span>
            <span class="home-strip__label">day streak</span>
          </div>
          <div class="home-strip__divider"></div>
          <div class="home-strip__item" id="stepsStripItem">
            <span class="home-strip__icon">👟</span>
            <span class="home-strip__val" id="homeStepsVal">—</span>
            <span class="home-strip__label">steps today</span>
          </div>
        </div>

        <!-- Weather strip -->
        <div id="weatherStrip" style="display:none;"></div>

        <!-- Step count card (Android + workout mode only) -->
        <div id="stepsCard" style="display:none;">
          <div class="steps-card">
            <div class="steps-card__header">
              <div class="steps-card__left">
                <span class="steps-card__icon">👟</span>
                <div>
                  <div class="steps-card__title">Steps Today</div>
                  <div class="steps-card__sub" id="stepsCardSub">Syncing from Health Connect…</div>
                </div>
              </div>
              <div class="steps-card__right">
                <div class="steps-card__count" id="stepsCardCount">0</div>
                <div class="steps-card__unit">steps</div>
              </div>
            </div>
            <div class="steps-card__bar-wrap">
              <div class="steps-card__bar" id="stepsBar" style="width:0%"></div>
            </div>
            <div class="steps-card__footer">
              <span id="stepsLossLabel" class="steps-card__loss">Calculating…</span>
              <button class="steps-card__refresh" id="stepsRefreshBtn">↻ Sync</button>
            </div>
          </div>
        </div>

        <!-- Add row: water + other drink -->
        <div style="display:flex;gap:10px;">
          <button class="main-add-btn tile--full" id="mainAddBtn" style="flex:2;">
            <div class="main-add-left">
              <div class="main-add-title">+ Add 250 ml</div>
              <div class="main-add-sub">Tap to log water</div>
            </div>
            <div class="main-add-icon">💧</div>
          </button>
          <button class="main-sub-btn" id="mainSubBtn" title="Remove 250 ml">
            <span style="font-size:22px;">➖</span>
            <div style="font-size:11px;font-weight:700;margin-top:2px;">250ml</div>
          </button>
        </div>

        <!-- Other drink button -->
        <button class="other-drink-btn" id="otherDrinkBtn">
          <span style="font-size:18px;">🥤</span>
          <span>Log Other Drink</span>
          <span style="margin-left:auto;opacity:0.5;font-size:13px;">›</span>
        </button>

        <!-- AI Scan shortcut button -->
        <button class="other-drink-btn" id="homeScanBtn" style="
          background:linear-gradient(135deg,rgba(0,200,83,0.08),rgba(26,115,232,0.08));
          border-color:rgba(0,200,83,0.4);
          color:var(--md-on-background);
        ">
          <span style="font-size:18px;">🔬</span>
          <span>Scan a Drink <span style="font-size:11px;background:linear-gradient(135deg,#00C853,#1A73E8);color:#fff;padding:2px 7px;border-radius:99px;margin-left:4px;font-weight:700;">AI</span></span>
          <span style="margin-left:auto;opacity:0.5;font-size:13px;">›</span>
        </button>

        <!-- Quick add section -->
        <div class="section-header">
          <span class="section-label">Quick Add — Water</span>
          <span class="section-label" style="font-size:10px;opacity:0.6;">long-press to subtract</span>
        </div>
        <div class="add-tiles" id="quickAddTiles"></div>

        <!-- Stats -->
        <div class="section-header"><span class="section-label">Today</span></div>
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
      let pressTimer;
      btn.addEventListener('pointerdown', () => {
        pressTimer = setTimeout(() => {
          adjustWater(-amt);
          btn.style.background = '#FFE0E0';
          setTimeout(() => btn.style.background = '', 400);
        }, 500);
      });
      btn.addEventListener('pointerup',    () => clearTimeout(pressTimer));
      btn.addEventListener('pointerleave', () => clearTimeout(pressTimer));
      tilesEl.appendChild(btn);
    });

    Utils.el('mainAddBtn').addEventListener('click',  () => adjustWater(250));
    Utils.el('mainSubBtn').addEventListener('click',  () => adjustWater(-250));
    Utils.el('otherDrinkBtn').addEventListener('click', () => showDrinkSheet());
    Utils.el('homeScanBtn')?.addEventListener('click', () => {
      AIScan.showScanModal();
    });

    updateUI();
    fetchWeatherStrip();
    initStepsCard();
  };

  /* ── Weather strip ── */
  const fetchWeatherStrip = async () => {
    const strip = Utils.el('weatherStrip');
    if (!strip || !window.Weather) return;
    try {
      const w = await Weather.fetch();
      if (!w) return;
      const advice = Weather.getAdvice(w);
      if (!advice) return;

      const colors = {
        extreme: { bg:'#FCE8E6', border:'#EA4335', text:'#D93025' },
        hot:     { bg:'#FFF3E0', border:'#FF9800', text:'#E65100' },
        warm:    { bg:'#FFF8E1', border:'#FBBC04', text:'#E37400' },
        cold:    { bg:'#E3F2FD', border:'#2196F3', text:'#0D47A1' },
        cool:    { bg:'#E8F0FE', border:'#1A73E8', text:'#1557B0' },
        normal:  { bg:'#F1F3F4', border:'#DADCE0', text:'#5F6368' },
      };
      const col = colors[advice.level] || colors.normal;

      strip.style.display = 'block';
      strip.innerHTML = `
        <div style="
          background:${col.bg};border:1.5px solid ${col.border};
          border-radius:16px;padding:10px 14px;
          display:flex;align-items:center;gap:10px;
          animation:blurUp 0.4s var(--spring-enter,cubic-bezier(0.16,1,0.3,1)) both;
        ">
          <span style="font-size:22px;">${advice.emoji}</span>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:700;color:${col.text};">${advice.headline}</div>
            <div style="font-size:12px;color:${col.text};opacity:0.8;margin-top:1px;">${advice.detail}</div>
          </div>
          ${advice.extraMl > 0 ? `<div style="text-align:right;flex-shrink:0;">
            <div style="font-size:15px;font-weight:700;color:${col.text};">+${advice.extraMl}ml</div>
            <div style="font-size:10px;color:${col.text};opacity:0.7;">suggested</div>
          </div>` : ''}
        </div>
      `;
    } catch(e) {
      console.warn('[Weather] strip failed:', e.message);
    }
  };

  /* ══ DRINK SHEET ══ */
  const showDrinkSheet = () => {
    const drinks   = Drinks.getAll();
    let selectedDrink = drinks[0]; // local — no stale state between opens
    let amount     = 250;

    // Overlay
    const overlay  = document.createElement('div');
    overlay.id     = 'drinkOverlay';
    overlay.className = 'sheet-overlay';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeSheet();
    });

    // Escape key closes the sheet
    const _escHandler = (e) => {
      if (e.key === 'Escape') { closeSheet(); document.removeEventListener('keydown', _escHandler); }
    };
    document.addEventListener('keydown', _escHandler);

    overlay.innerHTML = `
      <div class="drink-sheet" id="drinkSheet">
        <div class="sheet-handle"></div>
        <div class="sheet-title">What did you drink?</div>

        <!-- Drink grid -->
        <div class="drink-grid" id="drinkGrid">
          ${drinks.map(d => `
            <button class="drink-tile ${d.id === selectedDrink.id ? 'selected' : ''}" data-id="${d.id}">
              <div class="drink-tile-emoji">${d.emoji}</div>
              <div class="drink-tile-name">${d.name}</div>
              <div class="drink-tile-pct">${d.hydration >= 0 ? d.hydration + '%' : '⚠️ dehydrating'}</div>
            </button>
          `).join('')}
        </div>

        <!-- Amount row -->
        <div class="sheet-amount-row">
          <button class="sheet-amt-btn" id="sheetMinus">−</button>
          <div class="sheet-amt-display">
            <input type="number" id="sheetAmtInput" value="${amount}" min="0" max="5000"
              style="width:70px;text-align:center;font-size:20px;font-weight:700;border:none;background:transparent;color:var(--md-on-surface);font-family:var(--font-body);" />
            <span class="sheet-amt-unit">ml</span>
          </div>
          <button class="sheet-amt-btn" id="sheetPlus">+</button>
        </div>

        <!-- Equivalent hint -->
        <div class="sheet-equiv" id="sheetEquiv">= 250 ml water equivalent</div>

        <!-- Log button -->
        <button class="sheet-log-btn" id="sheetLogBtn">💧 Log Drink</button>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.querySelector('.drink-sheet').classList.add('open'); overlay.classList.add('open'); });

    /* Bind drink tile clicks */
    overlay.querySelectorAll('.drink-tile').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.querySelectorAll('.drink-tile').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedDrink = Drinks.getById(btn.dataset.id);
        updateEquiv();
      });
    });

    /* Amount controls */
    const input = overlay.querySelector('#sheetAmtInput');
    const updateEquiv = () => {
      const val  = parseInt(input.value) || 0;
      const eq   = Drinks.waterEquivalent(selectedDrink.id, val);
      const hint = overlay.querySelector('#sheetEquiv');
      if (selectedDrink.id === 'water') {
        hint.textContent = '';
      } else if (selectedDrink.hydration < 0) {
        hint.textContent = `⚠️ Dehydrating — subtracts ${Math.abs(eq)} ml`;
        hint.style.color = 'var(--md-error)';
      } else {
        hint.textContent = `= ${eq} ml water equivalent`;
        hint.style.color = 'var(--md-on-surface-med)';
      }
    };

    input.addEventListener('input', updateEquiv);

    overlay.querySelector('#sheetMinus').addEventListener('click', () => {
      input.value = Math.max(0, (parseInt(input.value) || 0) - 50);
      updateEquiv();
    });
    overlay.querySelector('#sheetPlus').addEventListener('click', () => {
      input.value = (parseInt(input.value) || 0) + 50;
      updateEquiv();
    });

    updateEquiv();

    /* Log button */
    overlay.querySelector('#sheetLogBtn').addEventListener('click', async () => {
      const rawAmt = parseInt(input.value) || 0;
      if (rawAmt <= 0) { Utils.showToast('⚠️ Enter an amount'); return; }
      if (selectedDrink.id !== 'water' && window.UserData) {
        const allowance = UserData.canUseFreeDrink();
        if (!allowance.allowed) {
          Utils.showToast('Free users can log 5 non-water drinks per week.');
          return;
        }
      }

      const eq = Drinks.waterEquivalent(selectedDrink.id, rawAmt);
      const today = Utils.todayString();

      if (eq > 0) {
        await Storage.addEntry(eq, today);
        Utils.showToast(`${selectedDrink.emoji} ${rawAmt}ml ${selectedDrink.name} → +${eq}ml 💧`);
      } else if (selectedDrink.hydration < 0) {
        const current  = await Storage.getTotalForDate(today);
        const deduct   = Math.round(rawAmt * Math.abs(selectedDrink.hydration) / 100);
        const newTotal = Math.max(0, current - deduct);
        await Storage.setTotalForDate(today, newTotal);
        Utils.showToast(`${selectedDrink.emoji} ${rawAmt}ml ${selectedDrink.name} → −${deduct}ml 💧`);
      } else {
        Utils.showToast('⚠️ Zero hydration — nothing logged');
      }

      if (selectedDrink.id !== 'water' && window.UserData) {
        await UserData.registerDrinkUsage();
      }

      closeSheet();
      if (window.UserData) await UserData.recomputeProgress();
      if (window.Leaderboard && Firebase.getUserId()) Leaderboard.publishStreak(Firebase.getUserId()).catch(() => {});
      await updateUI();
    });
  };

  const closeSheet = () => {
    const overlay = Utils.el('drinkOverlay');
    if (!overlay) return; // already closed — guard against double-call
    const sheet = overlay.querySelector('.drink-sheet');
    if (sheet) sheet.classList.remove('open');
    setTimeout(() => {
      if (overlay.parentNode) overlay.remove();
    }, 300);
  };

  /* ── Update UI ── */
  const updateUI = async () => {
    const goal    = Storage.getGoal();
    const total   = await Storage.getTotalForDate(Utils.todayString());
    const pct     = Utils.clamp(total / goal, 0, 1);
    const pctInt  = Math.round(pct * 100);
    const remain  = Math.max(goal - total, 0);
    const offset  = RING_CIRC * (1 - pct);

    const ring = Utils.el('heroRing');
    if (ring) {
      ring.style.strokeDashoffset = offset.toFixed(1);
      ring.style.stroke = ''; // let CSS data-pct handle color
      const pctLevel = pct >= 1 ? 'full' : pct >= 0.6 ? 'good' : pct >= 0.3 ? 'mid' : 'low';
      ring.setAttribute('data-pct', pctLevel);
      // goal-reached glow
      if (pct >= 1) {
        ring.classList.add('goal-reached');
        ring.addEventListener('animationend', () => ring.classList.remove('goal-reached'), { once: true });
      }
    }

    const amtEl = Utils.el('heroAmount');
    if (amtEl && amtEl.textContent !== total.toLocaleString()) {
      amtEl.classList.add('slot-exit');
      amtEl.addEventListener('animationend', () => {
        amtEl.textContent = total.toLocaleString();
        amtEl.classList.remove('slot-exit');
        amtEl.classList.add('slot-enter');
        amtEl.addEventListener('animationend', () => amtEl.classList.remove('slot-enter'), { once: true });
      }, { once: true });
    }
    Utils.el('heroPct')      && (Utils.el('heroPct').textContent      = `${pctInt}%`);
    Utils.el('heroProgress') && (Utils.el('heroProgress').style.width = `${pctInt}%`);
    Utils.el('heroGoal')     && (Utils.el('heroGoal').textContent = goal);
    Utils.el('heroGoalLabel')&& (Utils.el('heroGoalLabel').textContent = `${goal} ml`);
    Utils.el('heroRemain')   && (Utils.el('heroRemain').textContent   = remain > 0 ? `${remain} ml to go` : '🎉 Goal reached!');
    Utils.el('heroMotivation') && (Utils.el('heroMotivation').textContent = Utils.getMotivation(pct));
    Utils.el('statTotal')   && (Utils.el('statTotal').textContent    = `${total} ml`);
    Utils.el('statRemain')  && (Utils.el('statRemain').textContent   = `${remain} ml`);
    Utils.el('statPct')     && (Utils.el('statPct').textContent      = `${pctInt}%`);
    if (window.UserData) {
      const userState = UserData.getState();
      Utils.el('homeCoinBalance') && (Utils.el('homeCoinBalance').textContent = userState.coinBalance || 0);
    }
  };

  /* ── Adjust water (pure water quick-add) ── */
  let isAdjusting = false;
  let _lastAddTime = 0;
  const ADD_COOLDOWN_MS = 1500; // min 1.5s between add taps
  const adjustWater = async (amount) => {
    if (isAdjusting) return;
    // Rate limit: prevent spam taps
    if (amount > 0) {
      const now = Date.now();
      if (now - _lastAddTime < ADD_COOLDOWN_MS) {
        Utils.showToast('⏳ Too fast! Wait a moment.');
        return;
      }
      _lastAddTime = now;
    }
    isAdjusting = true;
    const today  = Utils.todayString();
    const addBtn = Utils.el('mainAddBtn');
    if (addBtn && amount > 0) addBtn.style.opacity = '0.6';
    try {
      if (amount > 0) {
        await Storage.addEntry(amount, today);
        Utils.showToast(`+${amount} ml water 💧`);
      } else {
        const current  = await Storage.getTotalForDate(today);
        if (current === 0) { Utils.showToast('Already at 0 ml'); return; } // HOME-1 fix
        const newTotal = Math.max(0, current + amount);
        await Storage.setTotalForDate(today, newTotal);
        Utils.showToast(`${Math.abs(amount)} ml removed 📉`);
      }
      if (window.UserData) await UserData.recomputeProgress();
      if (window.Leaderboard && Firebase.getUserId()) Leaderboard.publishStreak(Firebase.getUserId()).catch(() => {});
      await updateUI();
    } catch (e) {
      Utils.showToast('❌ ' + e.message);
    } finally {
      isAdjusting = false;
      if (addBtn) addBtn.style.opacity = '';
    }
  };

  const init = () => {
    render();
    Router.on('home', () => {
      closeSheet(); // clean up any open sheet before re-render
      render();
    });
  };

  /* ── Steps Card ── */
  const initStepsCard = async () => {
    const card = document.getElementById('stepsCard');

    // Always update steps strip value (even if card hidden)
    await _refreshStepsStrip();

    if (!card) return;

    const st = window.UserData ? UserData.getState() : {};
    const workoutOn = !!(st.userProfile && st.userProfile.workoutToday);

    if (!workoutOn) {
      card.style.display = 'none';
      return;
    }

    // Workout mode is ON — show the card
    card.style.display = 'block';

    const isAndroid = window.StepTracker && StepTracker.isAndroid();
    const subEl     = document.getElementById('stepsCardSub');
    const refreshBtn = document.getElementById('stepsRefreshBtn');

    if (!isAndroid) {
      if (subEl)      subEl.textContent = 'Step tracking requires Android + Health Connect';
      if (refreshBtn) refreshBtn.style.display = 'none';
      const countEl = document.getElementById('stepsCardCount');
      const lossEl  = document.getElementById('stepsLossLabel');
      const barEl   = document.getElementById('stepsBar');
      if (countEl) countEl.textContent = '—';
      if (lossEl)  lossEl.textContent  = 'Open on Android to enable step tracking';
      if (barEl)   barEl.style.width   = '0%';
      return;
    }

    // Android: request Health Connect permission the FIRST time workout mode is turned on
    if (!StepTracker.hasPermission()) {
      if (subEl) subEl.textContent = 'Requesting Health Connect access…';
      const granted = await StepTracker.requestPermission();
      if (granted) {
        if (subEl) subEl.textContent = '✅ Health Connect connected!';
      } else {
        if (subEl) subEl.textContent = 'Permission denied — tap Sync to retry';
      }
    }

    await updateStepsDisplay();

    // Prevent duplicate listeners
    const btn = document.getElementById('stepsRefreshBtn');
    if (btn && !btn._stepsBound) {
      btn._stepsBound = true;
      btn.addEventListener('click', async () => {
        if (subEl) subEl.textContent = 'Syncing…';
        if (!StepTracker.hasPermission()) {
          const granted = await StepTracker.requestPermission();
          if (!granted) {
            if (subEl) subEl.textContent = 'Permission denied — grant in Health Connect settings';
            return;
          }
        }
        await updateStepsDisplay();
      });
    }
  };

  // Refresh the strip count without showing the full card
  const _refreshStepsStrip = async () => {
    const stepVal = document.getElementById('homeStepsVal');
    if (!stepVal) return;
    if (!window.StepTracker) { stepVal.textContent = '—'; return; }
    const steps = StepTracker.getTodaySteps();
    stepVal.textContent = steps > 0
      ? (steps >= 1000 ? (steps / 1000).toFixed(1) + 'k' : String(steps))
      : '—';
  };

  const updateStepsDisplay = async () => {
    if (!window.StepTracker) return;
    const steps = await StepTracker.sync();
    const stepVal = document.getElementById('homeStepsVal');
    if (stepVal) stepVal.textContent = steps > 0
      ? (steps >= 1000 ? (steps/1000).toFixed(1)+'k' : String(steps))
      : '—';
    const countEl = document.getElementById('stepsCardCount');
    const subEl   = document.getElementById('stepsCardSub');
    const lossEl  = document.getElementById('stepsLossLabel');
    const barEl   = document.getElementById('stepsBar');
    if (countEl) countEl.textContent = steps.toLocaleString();
    let temp = 22, humidity = 50;
    try {
      const w = window.Weather ? await Weather.fetch() : null;
      if (w) { temp = w.temp; humidity = w.humidity; }
    } catch(e) {}
    const lossml = StepTracker.calcHydrationLoss(steps, temp, humidity);
    const goal = 10000;
    const pct = Math.min(100, Math.round((steps / goal) * 100));
    if (subEl) subEl.textContent = steps.toLocaleString() + ' of 10,000 steps (' + pct + '%)';
    if (barEl) barEl.style.width = pct + '%';
    if (lossEl) {
      if (lossml > 0) {
        lossEl.textContent = '~' + lossml + ' ml hydration lost to activity';
        lossEl.style.color = lossml > 500 ? '#ff7043' : lossml > 200 ? '#ffb74d' : '#81c784';
      } else {
        lossEl.textContent = 'No significant hydration loss yet';
        lossEl.style.color = '#81c784';
      }
    }
  };

  return { init, updateUI, updateStepsDisplay };
})();
