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
    chartData = entries.filter(e => e.total > 0).sort((a, b) => a.date.localeCompare(b.date));
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
      // Last 30 days
      const days = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const ds = formatDateKey(d);
        const found = chartData.find(e => e.date === ds);
        days.push({ date: ds, total: found ? found.total : 0, label: shortMonthLabel(d) });
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

  /* ── Render SVG bar chart ── */
  const renderChart = () => {
    const tile  = Utils.el('anChartTile');
    const data  = getViewData();
    const goal  = Storage.getGoal();
    const max   = Math.max(...data.map(d => d.total), goal);

    if (data.every(d => d.total === 0)) {
      tile.innerHTML = `
        <div class="an-chart-title">${currentView === 'weekly' ? 'Last 7 Days' : 'Last 30 Days'}</div>
        <div class="an-empty">💧 No data yet for this period</div>
      `;
      return;
    }

    const W        = 320;
    const H        = 160;
    const padL     = 36;
    const padR     = 8;
    const padT     = 12;
    const padB     = 28;
    const chartW   = W - padL - padR;
    const chartH   = H - padT - padB;
    const n        = data.length;
    const barGap   = currentView === 'weekly' ? 6 : 2;
    const barW     = Math.max(1, (chartW / n) - barGap);
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
      const color  = atGoal ? '#1A73E8' : d.total > goal * 0.6 ? '#34A853' : d.total > goal * 0.3 ? '#FBBC04' : d.total > 0 ? '#EA4335' : '#E8EAED';
      return { x, y, bh, color, label: d.label, total: d.total, atGoal };
    });

    // only show some x labels to avoid crowding
    const labelStep = currentView === 'weekly' ? 1 : 5;

    tile.innerHTML = `
      <div class="an-chart-title">${currentView === 'weekly' ? 'Last 7 Days' : 'Last 30 Days'}</div>
      <div class="an-chart-wrap">
        <svg viewBox="0 0 ${W} ${H}" width="100%" style="overflow:visible;">

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

          <!-- Bars -->
          ${bars.map((b, i) => `
            <rect x="${b.x}" y="${b.y}" width="${barW}" height="${b.bh}"
              rx="2" fill="${b.color}" opacity="${b.total > 0 ? '1' : '0.3'}"/>
          `).join('')}

          <!-- X labels -->
          ${bars.map((b, i) => i % labelStep === 0 ? `
            <text x="${b.x + barW/2}" y="${H - 4}" text-anchor="middle"
              font-size="${currentView === 'weekly' ? 9 : 7}" fill="var(--md-on-surface-med)">${b.label}</text>
          ` : '').join('')}

        </svg>
      </div>
      <!-- Legend -->
      <div class="an-legend">
        <span class="an-legend-dot" style="background:#1A73E8"></span><span>Goal reached</span>
        <span class="an-legend-dot" style="background:#34A853"></span><span>Good</span>
        <span class="an-legend-dot" style="background:#FBBC04"></span><span>Half</span>
        <span class="an-legend-dot" style="background:#EA4335"></span><span>Low</span>
      </div>
    `;
  };

  /* ── Render stats ── */
  const renderStats = () => {
    const tile = Utils.el('anStatsTile');
    const data = getViewData().filter(d => d.total > 0);

    if (data.length === 0) {
      tile.innerHTML = `<div class="an-empty">No data to analyse yet 📊</div>`;
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
    const streak  = calcStreak();

    const fmtDate = (ds) => {
      const d = new Date(ds + 'T12:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    tile.innerHTML = `
      <div class="an-stats-title">📊 ${currentView === 'weekly' ? 'Weekly' : 'Monthly'} Summary</div>

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
  const calcStreak = () => {
    const goal  = Storage.getGoal();
    const today = formatDateKey(new Date());
    let streak  = 0;
    let d       = new Date();
    while (true) {
      const ds    = formatDateKey(d);
      const found = chartData.find(e => e.date === ds);
      if (found && found.total >= goal) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else if (ds === today) {
        // today not yet complete — check yesterday onwards
        d.setDate(d.getDate() - 1);
        const yest = formatDateKey(d);
        const y    = chartData.find(e => e.date === yest);
        if (y && y.total >= goal) { streak++; d.setDate(d.getDate() - 1); }
        else break;
      } else {
        break;
      }
    }
    return streak;
  };

  return { init };
})();
