/* ══════════════════════════════════════════
   SCREEN: Analytics — weekly/monthly graphs
   ══════════════════════════════════════════ */

const AnalyticsScreen = (() => {
  let currentView = 'weekly'; // 'weekly' | 'monthly'
  let chartData   = [];       // { date, total } sorted asc

  /* ── Init ── */
  const init = () => {
    Router.on('analytics', () => render());
  };

  /* ── Render shell ── */
  const render = async () => {
    Utils.el('analytics-root').innerHTML = `
      <div class="screen-stack">

        <!-- Toggle pills -->
        <div class="an-toggle-row">
          <button class="an-pill ${currentView === 'weekly' ? 'active' : ''}" id="anWeekly">📅 Weekly</button>
          <button class="an-pill ${currentView === 'monthly' ? 'active' : ''}" id="anMonthly">📆 Monthly</button>
        </div>

        <!-- Chart tile -->
        <div class="tile an-chart-tile" id="anChartTile">
          <div class="an-loading">⏳ Loading data…</div>
        </div>

        <!-- Stats tile -->
        <div class="tile" id="anStatsTile">
          <div class="an-loading">⏳ Loading stats…</div>
        </div>

        <!-- Leaderboard -->
        <div class="tile" id="anLeaderboardTile">
          <div class="an-loading">⏳ Loading leaderboard…</div>
        </div>

      </div>
    `;

    Utils.el('anWeekly').addEventListener('click', () => {
      currentView = 'weekly';
      Utils.el('anWeekly').classList.add('active');
      Utils.el('anMonthly').classList.remove('active');
      renderChart();
      renderStats();
    });

    Utils.el('anMonthly').addEventListener('click', () => {
      currentView = 'monthly';
      Utils.el('anMonthly').classList.add('active');
      Utils.el('anWeekly').classList.remove('active');
      renderChart();
      renderStats();
    });

    await loadData();
    renderChart();
    renderStats();
    renderLeaderboard('daily');
  };

  /* ── Load all data from Storage ── */
  const loadData = async () => {
    const allDates = await Storage.getAllDates();
    const goal     = Storage.getGoal();

    // fetch totals for all dates in parallel
    const entries = await Promise.all(
      allDates.map(async date => ({
        date,
        total: await Storage.getTotalForDate(date)
      }))
    );
    // sort ascending
    // STREAK-1 fix: keep zero-total entries so streak engine sees broken days
    chartData = entries.sort((a, b) => a.date.localeCompare(b.date));
  };

  /* ── Get data for current view ── */
  const getViewData = () => {
    const today = new Date();
    if (currentView === 'weekly') {
      // Last 7 days always shown (including days with 0)
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const ds = formatDateKey(d);
        const found = chartData.find(e => e.date === ds);
        days.push({ date: ds, total: found ? found.total : 0, label: shortDayLabel(d) });
      }
      return days;
    } else {
      // Full current month — all days from 1 to last day of month
      // Future days show as 0 (grey) so chart always has context
      const year  = today.getFullYear();
      const month = today.getMonth();
      // Get total days in current month
      const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
      const days = [];
      for (let i = 1; i <= totalDaysInMonth; i++) {
        const d  = new Date(year, month, i);
        const ds = formatDateKey(d);
        const found = chartData.find(e => e.date === ds);
        const isFuture = i > today.getDate();
        days.push({ date: ds, total: found ? found.total : 0, label: String(i), isFuture });
      }
      return days;
    }
  };

  const formatDateKey = (d) =>
    `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  const shortDayLabel = (d) =>
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];

  const shortMonthLabel = (d) => {
    // Show date number, and month name on 1st
    if (d.getDate() === 1) return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
    return String(d.getDate());
  };

  /* ── Attach hover/tap tooltip events to bar groups ──────────
     CHANGE-1: Analytics graph hover effect + mobile tap support
     ────────────────────────────────────────────────────────── */
  const _attachChartTooltips = (tile, bars, barW, svgW) => {
    const svg     = tile.querySelector('#anChartSVG');
    const tooltip = tile.querySelector('#anBarTooltip');
    if (!svg || !tooltip) return;

    const goal = Storage.getGoal();
    let activeIdx = -1; // tracks which bar is tapped on mobile

    /* Show the tooltip above a given bar group */
    const showTooltip = (group, barData) => {
      if (barData.total === 0) { hideTooltip(); return; }

      // Glow: make the glow rect visible, slightly dim main bar
      const glowRect = group.querySelector('.an-bar-glow');
      const barRect  = group.querySelector('.an-bar-rect');
      if (glowRect) glowRect.setAttribute('opacity', '0.45');
      if (barRect)  barRect.setAttribute('opacity', '0.75');

      // Build tooltip content
      const pct = goal > 0 ? Math.round((barData.total / goal) * 100) : 0;
      const met = barData.total >= goal;
      tooltip.innerHTML =
        '<span class="an-tt-label">' + barData.label + '</span>' +
        '<span class="an-tt-val">' + barData.total.toLocaleString() + ' ml</span>' +
        '<span class="an-tt-pct" style="color:' + (met ? '#34A853' : '#FBBC04') + '">' + pct + '% of goal</span>';
      tooltip.style.display = 'flex';

      // Position tooltip horizontally over the bar centre, clamped inside wrapper
      const svgRect  = svg.getBoundingClientRect();
      const wrapRect = svg.closest('.an-chart-wrap').getBoundingClientRect();
      const scaleX   = svgRect.width / svgW;
      let   leftPx   = (svgRect.left - wrapRect.left) + (barData.x + barW / 2) * scaleX;
      const ttHalf   = tooltip.offsetWidth / 2 || 55;
      leftPx         = Math.max(ttHalf + 4, Math.min(wrapRect.width - ttHalf - 4, leftPx));
      tooltip.style.left      = leftPx + 'px';
      tooltip.style.transform = 'translateX(-50%)';
      tooltip.style.top       = '2px';
    };

    /* Hide tooltip and reset all bar visual states */
    const hideTooltip = () => {
      tooltip.style.display = 'none';
      svg.querySelectorAll('.an-bar-group').forEach(function(g) {
        var gl = g.querySelector('.an-bar-glow');
        var br = g.querySelector('.an-bar-rect');
        if (gl) gl.setAttribute('opacity', '0');
        if (br) br.setAttribute('opacity', Number(g.dataset.total) > 0 ? '1' : '0.3');
      });
      activeIdx = -1;
    };

    svg.querySelectorAll('.an-bar-group').forEach(function(group, i) {
      const barData = bars[i];

      // Desktop — mouse enter/leave
      group.addEventListener('mouseenter', function() { showTooltip(group, barData); });
      group.addEventListener('mouseleave', function() {
        if (activeIdx === i) return; // keep alive if also tapped
        hideTooltip();
      });

      // Mobile — tap toggles; second tap or outside tap dismisses
      group.addEventListener('touchstart', function(e) {
        e.preventDefault(); // prevent ghost click
        if (activeIdx === i) {
          hideTooltip();
        } else {
          hideTooltip();
          activeIdx = i;
          showTooltip(group, barData);
        }
      }, { passive: false });
    });

    // Tapping outside the SVG dismisses the tooltip
    const outsideTap = function(e) {
      if (activeIdx >= 0 && !svg.contains(e.target)) hideTooltip();
    };
    document.addEventListener('touchstart', outsideTap, { passive: true });
    // Clean up listener if tile is replaced (re-render)
    svg.dataset.tooltipBound = '1';
  };

    /* ── Render SVG bar chart — always renders for monthly, shows encouragement for empty weekly ── */
  const renderChart = () => {
    const tile  = Utils.el('anChartTile');
    const data  = getViewData();
    const goal  = Storage.getGoal();
    const hasAnyData = data.some(d => d.total > 0);
    // For weekly: only hide if truly no data AND no historical data at all
    // For monthly: never hide — always show the chart with 0 bars
    // Weekly: show empty state only if truly no data ever
    // Monthly: NEVER show empty — always render the full month chart
    if (!hasAnyData && currentView === 'weekly') {
      tile.innerHTML = `
        <div class="an-chart-title">Last 7 Days</div>
        <div class="an-empty">💧 No data yet — start logging!</div>
      `;
      return;
    }
    // Monthly always renders even with all zeros

    const max   = Math.max(...data.map(d => d.total), goal || 2500, 1); // always have a scale
    const W        = 320;
    const H        = 160;
    const padL     = 36;
    const padR     = 8;
    const padT     = 12;
    const padB     = 28;
    const chartW   = W - padL - padR;
    const chartH   = H - padT - padB;
    const n        = data.length;
    const barGap   = currentView === 'weekly' ? 6 : n > 20 ? 1 : 2;
    const barW     = Math.max(2, (chartW / n) - barGap);
    const goalY    = padT + chartH - (goal / max) * chartH;

    // Y-axis labels
    const yLabels = [0, Math.round(max * 0.5), max].map(v => ({
      v,
      y: padT + chartH - (v / max) * chartH
    }));

    const bars = data.map((d, i) => {
      const x   = padL + i * (barW + barGap);
      const pct = d.total / max;
      const bh  = Math.max(pct * chartH, d.total > 0 ? 3 : 0);
      const y   = padT + chartH - bh;
      const atGoal = d.total >= goal;
      const isFuture = d.isFuture;
      const color = isFuture ? 'var(--md-outline)'
                  : atGoal   ? '#1A73E8'
                  : d.total > goal * 0.6 ? '#34A853'
                  : d.total > goal * 0.3 ? '#FBBC04'
                  : d.total > 0          ? '#EA4335'
                  :                        'var(--md-surface-3)';
      return { x, y, bh, color, label: d.label, total: d.total, atGoal, isFuture };
    });

    // only show some x labels to avoid crowding
    const labelStep = currentView === 'weekly' ? 1 : 5;

    tile.innerHTML = `
      <div class="an-chart-title">${currentView === 'weekly' ? 'Last 7 Days' : new Date().toLocaleString('en',{month:'long',year:'numeric'})}</div>
      <div class="an-chart-wrap" style="position:relative;">
        <svg id="anChartSVG" viewBox="0 0 ${W} ${H}" width="100%" style="overflow:visible;display:block;">

          <!-- Grid lines + Y labels -->
          ${yLabels.map(l => `
            <line x1="${padL}" y1="${l.y}" x2="${W - padR}" y2="${l.y}"
              stroke="var(--md-outline)" stroke-width="0.5" stroke-dasharray="3,3"/>
            <text x="${padL - 4}" y="${l.y + 4}" text-anchor="end"
              font-size="8" fill="var(--md-on-surface-med)">${l.v >= 1000 ? (l.v/1000).toFixed(1)+'k' : l.v}</text>
          `).join('')}

          <!-- Goal line -->
          <line x1="${padL}" y1="${goalY}" x2="${W - padR}" y2="${goalY}"
            stroke="#1A73E8" stroke-width="1" stroke-dasharray="4,3" opacity="0.6"/>
          <text x="${W - padR + 2}" y="${goalY + 4}" font-size="7" fill="#1A73E8" opacity="0.8">Goal</text>

          <!-- Bars: each wrapped in a <g> for hover/tap events -->
          ${bars.map((b, i) => `
            <g class="an-bar-group"
               data-total="${b.total}"
               data-label="${b.label}"
               data-idx="${i}"
               style="cursor:${b.total > 0 ? 'pointer' : 'default'};">
              <!-- Wider transparent hit-target for easy touch -->
              <rect x="${b.x - 3}" y="${padT}" width="${barW + 6}" height="${chartH + 12}"
                fill="transparent"/>
              <!-- Glow layer (shown on hover/active) -->
              <rect class="an-bar-glow" x="${b.x - 2}" y="${b.y - 2}" width="${barW + 4}" height="${b.bh > 0 ? b.bh + 4 : 0}"
                rx="3" fill="${b.color}" opacity="0"
                style="transition:opacity 0.15s; filter:blur(4px);"/>
              <!-- Visible bar -->
              <rect class="an-bar-rect" x="${b.x}" y="${b.y}" width="${barW}" height="${b.bh}"
                rx="2" fill="${b.color}" opacity="${b.total > 0 ? '1' : '0.3'}"
                style="transition:opacity 0.15s;"/>
            </g>
          `).join('')}

          <!-- X labels -->
          ${bars.map((b, i) => i % labelStep === 0 ? `
            <text x="${b.x + barW/2}" y="${H - 4}" text-anchor="middle"
              font-size="${currentView === 'weekly' ? 9 : 7}" fill="var(--md-on-surface-med)">${b.label}</text>
          ` : '').join('')}

        </svg>

        <!-- Tooltip (absolutely positioned over the chart wrapper) -->
        <div id="anBarTooltip" class="an-bar-tooltip" style="display:none;" aria-live="polite"></div>
      </div>
      <!-- Legend -->
      <div class="an-legend">
        <span class="an-legend-dot" style="background:#1A73E8"></span><span>Goal reached</span>
        <span class="an-legend-dot" style="background:#34A853"></span><span>Good</span>
        <span class="an-legend-dot" style="background:#FBBC04"></span><span>Half</span>
        <span class="an-legend-dot" style="background:#EA4335"></span><span>Low</span>
      </div>
    `;

    /* ── Attach hover / tap tooltip behaviour ── */
    _attachChartTooltips(tile, bars, barW, W);
  };

  const renderStats = () => {
    const tile = Utils.el('anStatsTile');
    const data = getViewData().filter(d => d.total > 0);

    if (data.length === 0) {
      if (currentView === 'monthly') {
        // Monthly with no data — show month summary with zeros
        const goal = Storage.getGoal();
        tile.innerHTML = `
          <div class="an-stats-title">📊 ${new Date().toLocaleString('en',{month:'long'})} Summary</div>
          <div class="an-empty" style="padding:12px 0;">No data logged this month yet 💧<br>
          <span style="font-size:12px;opacity:0.7;">Start logging to build your streak!</span></div>
        `;
      } else {
        tile.innerHTML = `<div class="an-empty">No data this week 📊<br>
          <span style="font-size:12px;opacity:0.7;">Switch to Monthly to see all your history</span></div>`;
      }
      return;
    }

    const goal    = Storage.getGoal();
    const totals  = data.map(d => d.total);
    const avg     = Math.round(totals.reduce((a, b) => a + b, 0) / totals.length);
    const maxVal  = Math.max(...totals);
    const minVal  = Math.min(...totals);
    const maxDay  = data.find(d => d.total === maxVal);
    const minDay  = data.find(d => d.total === minVal);
    const daysHit = data.filter(d => d.total >= goal).length;
    const streak  = calcStreak(goal);

    const fmtDate = (ds) => {
      const d = new Date(ds + 'T12:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    tile.innerHTML = `
      <div class="an-stats-title">📊 ${currentView === 'weekly' ? 'This Week' : new Date().toLocaleString('en',{month:'long'})+' Summary'}</div>

      <div class="an-stats-grid">

        <div class="an-stat-card an-stat-best">
          <div class="an-stat-icon">🏆</div>
          <div class="an-stat-val">${maxVal.toLocaleString()} ml</div>
          <div class="an-stat-key">Highest Day</div>
          <div class="an-stat-sub">${fmtDate(maxDay.date)}</div>
        </div>

        <div class="an-stat-card an-stat-low">
          <div class="an-stat-icon">📉</div>
          <div class="an-stat-val">${minVal.toLocaleString()} ml</div>
          <div class="an-stat-key">Lowest Day</div>
          <div class="an-stat-sub">${fmtDate(minDay.date)}</div>
        </div>

        <div class="an-stat-card an-stat-avg">
          <div class="an-stat-icon">💧</div>
          <div class="an-stat-val">${avg.toLocaleString()} ml</div>
          <div class="an-stat-key">Daily Average</div>
          <div class="an-stat-sub">${avg >= goal ? '✅ Above goal' : `${goal - avg} ml below goal`}</div>
        </div>

        <div class="an-stat-card an-stat-streak">
          <div class="an-stat-icon">🔥</div>
          <div class="an-stat-val">${streak} day${streak !== 1 ? 's' : ''}</div>
          <div class="an-stat-key">Current Streak</div>
          <div class="an-stat-sub">Days hitting goal</div>
        </div>

      </div>

      <div class="an-goal-hit">
        <div class="an-goal-hit-label">Goal reached ${daysHit} of ${data.length} logged days</div>
        <div class="an-goal-bar-track">
          <div class="an-goal-bar-fill" style="width:${Math.round((daysHit/data.length)*100)}%"></div>
        </div>
      </div>
    `;
  };

  /* ── Calculate current consecutive streak ── */
  const calcStreak = (goal) => {
    if (goal === undefined) goal = Storage.getGoal(); // STREAK-3: use passed goal
    const today = formatDateKey(new Date());
    let streak  = 0;
    // Start from today, walk backwards day by day
    // If today has no data yet, start from yesterday (day still in progress)
    const todayEntry = chartData.find(e => e.date === today);
    const d = new Date();
    if (!todayEntry || todayEntry.total < goal) {
      // skip today, start from yesterday
      d.setDate(d.getDate() - 1);
    }
    while (true) {
      const ds    = formatDateKey(d);
      const found = chartData.find(e => e.date === ds);
      if (found && found.total >= goal) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  /* ── Render leaderboard ── */
  let _lbUnsub = null;
  let _lbType  = 'daily';

  const renderLeaderboard = (type = 'daily') => {
    _lbType = type;
    if (_lbUnsub) { _lbUnsub(); _lbUnsub = null; }
    const tile = Utils.el('anLeaderboardTile');
    if (!tile) return;

    const currentUid = Firebase.getUserId();

    tile.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
        <div style="font-size:15px;font-weight:700;color:var(--md-on-background);">🏆 Global Leaderboard</div>
        <div style="display:flex;gap:6px;">
          <button class="lb-tab ${type==='daily'?'lb-active':''}" data-t="daily"
            style="padding:5px 12px;border-radius:99px;border:1.5px solid ${type==='daily'?'var(--md-primary)':'var(--md-outline)'};background:${type==='daily'?'var(--md-primary)':'transparent'};color:${type==='daily'?'#fff':'var(--md-on-surface-med)'};font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font-body);transition:all 0.2s;">Daily</button>
          <button class="lb-tab ${type==='monthly'?'lb-active':''}" data-t="monthly"
            style="padding:5px 12px;border-radius:99px;border:1.5px solid ${type==='monthly'?'var(--md-primary)':'var(--md-outline)'};background:${type==='monthly'?'var(--md-primary)':'transparent'};color:${type==='monthly'?'#fff':'var(--md-on-surface-med)'};font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font-body);transition:all 0.2s;">Monthly</button>
        </div>
      </div>
      <div id="lbRows" style="display:flex;flex-direction:column;gap:8px;">
        <div style="text-align:center;padding:16px;color:var(--md-on-surface-med);font-size:13px;">⏳ Loading…</div>
      </div>
      <div style="font-size:11px;color:var(--md-on-surface-low);margin-top:10px;text-align:center;">
        Streaks verified from actual hydration data · Updated live
      </div>
    `;

    // Tab events
    tile.querySelectorAll('.lb-tab').forEach(btn => {
      btn.addEventListener('click', () => renderLeaderboard(btn.dataset.t));
    });

    // Real-time listener
    if (window.Leaderboard) {
      // First publish current user's streak
      if (currentUid) Leaderboard.publishStreak(currentUid).catch(()=>{});

      _lbUnsub = Leaderboard.subscribe(type, (rows) => {
        const container = Utils.el('lbRows');
        if (!container) return;
        if (!rows || rows.length === 0) {
          container.innerHTML = '<div style="text-align:center;padding:16px;color:var(--md-on-surface-med);font-size:13px;">No data yet — start your streak! 🔥</div>';
          return;
        }
        const field = type === 'daily' ? 'dailyStreak' : 'monthlyStreak';
        container.innerHTML = rows.map((r, i) => {
          const isMe  = r.uid === currentUid;
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`;
          const streak = r[field] || 0;
          return `
            <div style="
              display:flex;align-items:center;gap:10px;padding:10px 12px;
              border-radius:12px;
              background:${isMe ? 'var(--md-primary-light)' : 'var(--md-surface-2)'};
              border:${isMe ? '1.5px solid var(--md-primary)' : '1.5px solid transparent'};
              transition:all 0.2s;
            ">
              <div style="font-size:${i<3?'20px':'14px'};font-weight:700;min-width:28px;text-align:center;">${medal}</div>
              ${window.Profile ? Profile.avatarHTML(r.photoURL||null, r.displayName||'?', 36) : '<div style="width:36px;height:36px;border-radius:50%;background:var(--md-primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;flex-shrink:0;">' + (r.displayName||'?').charAt(0).toUpperCase() + '</div>'}
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:600;color:var(--md-on-background);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                  ${Utils.escapeHtml(r.displayName||'Anonymous')}${isMe?' (you)':''}${Utils.getMaggieTag ? Utils.getMaggieTag(r.email||'') : ''}
                </div>
                <div style="font-size:11px;color:var(--md-on-surface-med);">${type==='daily'?'daily streak':'days hit this month'}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:18px;font-weight:700;color:${streak>0?'var(--md-primary)':'var(--md-on-surface-low)'};">${streak}</div>
                <div style="font-size:10px;color:var(--md-on-surface-med);">🔥</div>
              </div>
            </div>
          `;
        }).join('');
      });
    } else {
      Utils.el('lbRows').innerHTML = '<div style="text-align:center;padding:16px;color:var(--md-on-surface-med);font-size:13px;">Leaderboard not available</div>';
    }
  };

  return { init };
})();
