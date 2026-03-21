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
          <div class="home-strip__divider"></div>
          <div class="home-strip__item" style="gap:4px;">
            <span class="home-strip__label" style="white-space:nowrap;">Step tracking</span>
            <button id="stepTrackToggle" class="step-track-toggle" title="Toggle step tracking">
              <span id="stepTrackToggleIcon">⚫</span>
            </button>
          </div>
        </div>

        <!-- Weather strip -->
        <div id="weatherStrip" style="display:none;"></div>

        <!-- Step count card (Android + workout mode only) -->
        <div id="stepsCard" style="display:none;">
          <div class="steps-card">
            <div class="steps-card__header">
              <div class="steps-card__left">
                <span class="steps-card__icon">🚶</span>
                <div>
                  <div class="steps-card__title" id="stepsCardTitle">Step Hydration</div>
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
              <span id="stepsLossLabel" class="steps-card__loss">Calculating water loss…</span>
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
      window._lastWeather = w; // cache for step hydration calc
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

  // Step tracking persistence key — per user, survives refreshes
  const _stepTrackKey = () => {
    const uid = (window.Firebase?.getUserId?.()) || (window.Auth?.getSession?.()?.uid)
      || (() => { try { return JSON.parse(localStorage.getItem('wt_session_v1')||'{}').uid||''; } catch(e){return '';} })();
    return uid ? 'wt_step_track_' + uid : 'wt_step_track_default';
  };
  const _isStepTrackOn = () => localStorage.getItem(_stepTrackKey()) === 'true';
  const _setStepTrack = (v) => localStorage.setItem(_stepTrackKey(), v ? 'true' : 'false');

  // Wire the step tracking toggle button (called after every render)
  const _initStepToggle = () => {
    const btn  = document.getElementById('stepTrackToggle');
    const icon = document.getElementById('stepTrackToggleIcon');
    if (!btn) return;

    const on = _isStepTrackOn();
    icon.textContent = on ? '🟢' : '⚫';
    btn.title = on ? 'Step tracking ON — tap to disable' : 'Step tracking OFF — tap to enable';

    btn.onclick = () => {
      const nowOn = !_isStepTrackOn();
      _setStepTrack(nowOn);
      icon.textContent = nowOn ? '🟢' : '⚫';
      btn.title = nowOn ? 'Step tracking ON — tap to disable' : 'Step tracking OFF — tap to enable';

      if (nowOn) {
        Utils.showToast('🚶 Step tracking ON');
        initStepsCard(); // start polling
      } else {
        Utils.showToast('Step tracking OFF');
        // Stop polling
        const card = document.getElementById('stepsCard');
        if (card && card._liveInterval) { clearInterval(card._liveInterval); card._liveInterval = null; }
        if (card) card.style.display = 'none';
      }
    };
  };

  const init = () => {
    render();
    _initStepToggle();
    Router.on('home', () => {
      closeSheet();
      render();
      _initStepToggle(); // re-wire after re-render
    });
  };

  /* ── Steps Card ── */
  const initStepsCard = async () => {
    const card = document.getElementById('stepsCard');

    // Always refresh strip count
    await _refreshStepsStrip();

    if (!card) return;

    // Respect the toggle — if OFF, hide card
    if (!_isStepTrackOn()) {
      card.style.display = 'none';
      if (card._liveInterval) { clearInterval(card._liveInterval); card._liveInterval = null; }
      return;
    }

    // Toggle ON — show card on all platforms
    card.style.display = 'block';

    const subEl      = document.getElementById('stepsCardSub');
    const refreshBtn = document.getElementById('stepsRefreshBtn');

    if (!window.StepTracker) {
      if (subEl) subEl.textContent = 'Step tracker unavailable';
      return;
    }

    // Request permission if not granted (DeviceMotion on browser, Health Connect on TWA)
    if (!StepTracker.hasPermission()) {
      if (subEl) subEl.textContent = 'Requesting access…';
      const granted = await StepTracker.requestPermission();
      if (granted) {
        if (subEl) subEl.textContent = '🟢 Live tracking active';
      } else {
        if (subEl) subEl.textContent = 'Enter steps manually below';
        _showManualStepInput(card);
        return;
      }
    } else {
      if (subEl) subEl.textContent = '🟢 Live tracking active';
      StepTracker.startMotionTracking?.(); // ensure motion listener is active
    }

    await _syncStepsAndLogWater();

    if (card._liveInterval) clearInterval(card._liveInterval);
    card._liveInterval = setInterval(() => _syncStepsAndLogWater(), 8000); // poll every 8s

    if (refreshBtn && !refreshBtn._bound) {
      refreshBtn._bound = true;
      refreshBtn.addEventListener('click', async () => {
        if (subEl) subEl.textContent = 'Syncing…';
        await _syncStepsAndLogWater();
        if (subEl) subEl.textContent = '🟢 Live tracking active';
      });
    }
  };


  const _showManualStepInput = (card) => {
    const footer = card.querySelector('.steps-card__footer');
    if (!footer || card._manualShown) return;
    card._manualShown = true;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:8px;margin-top:10px;align-items:center;';
    wrap.innerHTML = `
      <input id="manualStepInput" type="number" inputmode="numeric" placeholder="Enter today's steps"
        style="flex:1;padding:9px 12px;border-radius:10px;border:1.5px solid rgba(139,92,246,0.4);background:rgba(139,92,246,0.08);color:var(--md-on-background);font-size:14px;outline:none;">
      <button id="manualStepBtn" style="padding:9px 16px;background:#7c3aed;border:none;border-radius:10px;color:#fff;font-weight:700;cursor:pointer;font-size:13px;white-space:nowrap;">Log</button>`;
    footer.appendChild(wrap);
    document.getElementById('manualStepBtn')?.addEventListener('click', () => {
      const val = parseInt(document.getElementById('manualStepInput')?.value || '0');
      if (val > 0) {
        StepTracker.setTodaySteps(val);
        wrap.remove();
        card._manualShown = false;
        _syncStepsAndLogWater();
      }
    });
  };

  // Sync steps, calc water loss by formula, log difference as consumed water
  const _syncStepsAndLogWater = async () => {
    if (!window.StepTracker) return;
    const steps = await StepTracker.sync();

    const countEl = document.getElementById('stepsCardCount');
    const subEl   = document.getElementById('stepsCardSub');
    const lossEl  = document.getElementById('stepsLossLabel');
    const barEl   = document.getElementById('stepsBar');
    const stripEl = document.getElementById('homeStepsVal');

    if (countEl) countEl.textContent = steps > 0 ? steps.toLocaleString() : '0';
    if (stripEl) stripEl.textContent = steps >= 1000 ? (steps/1000).toFixed(1)+'k' : (steps > 0 ? String(steps) : '0');
    if (subEl && steps === 0) subEl.textContent = '🚶 Walk to see steps update live';

    // Get weather for dynamic calc
    let temp = 22, humidity = 50;
    try { const w = window._lastWeather||{}; temp=w.temp||w.temperature||22; humidity=w.humidity||50; } catch(e){}

    const totalLoss = StepTracker.calcHydrationLoss(steps, temp, humidity);

    // Step bar (10k steps = 100%)
    if (barEl) barEl.style.width = Math.min(100, (steps/10000)*100) + '%';

    // Loss label with colour coding
    const lossColor = totalLoss > 1000 ? '#f87171' : totalLoss > 500 ? '#fb923c' : '#4ade80';
    if (lossEl) {
      lossEl.textContent = totalLoss > 0
        ? `💧 ~${totalLoss} ml water loss from ${steps.toLocaleString()} steps`
        : 'Walk more to see hydration impact';
      lossEl.style.color = lossColor;
    }
    if (subEl) subEl.textContent = '🟢 Live — updates every minute';

    // Log only the NEW loss since last sync
    const today = new Date().toISOString().slice(0,10);
    const lastDate  = localStorage.getItem('wt_steps_log_date') || '';
    const lastLoss  = lastDate === today ? parseInt(localStorage.getItem('wt_steps_loss_today')||'0') : 0;
    const lastSteps = lastDate === today ? parseInt(localStorage.getItem('wt_steps_logged_today')||'0') : 0;
    const newLoss = Math.max(0, totalLoss - lastLoss);

    if (newLoss >= 10 && steps > lastSteps && window.Storage) {
      try {
        await Storage.addEntry(newLoss, today);
        localStorage.setItem('wt_steps_logged_today', String(steps));
        localStorage.setItem('wt_steps_loss_today', String(totalLoss));
        localStorage.setItem('wt_steps_log_date', today);
        console.log('[Steps] Logged', newLoss, 'ml from', steps, 'steps (temp:', temp, '°C)');
        await updateUI();
      } catch(e) { console.warn('[Steps] log failed:', e.message); }
    }
  };

  const _refreshStepsStrip = async () => {
    const stepVal = document.getElementById('homeStepsVal');
    if (!stepVal) return;
    if (!window.StepTracker) { stepVal.textContent = '—'; return; }
    const steps = StepTracker.getTodaySteps();
    stepVal.textContent = steps > 0
      ? (steps >= 1000 ? (steps / 1000).toFixed(1) + 'k' : String(steps))
      : '—';
  };

  const updateStepsDisplay = _syncStepsAndLogWater; // alias


  return { init, updateUI, updateStepsDisplay };
})();
