/* ══════════════════════════════════════════
   SCREEN: History — calendar + edit past days
   ══════════════════════════════════════════ */

const HistoryScreen = (() => {
  let calYear, calMonth, selectedDate;
  let markedDatesCache = new Set();

  const MONTH_NAMES = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];
  const DAY_NAMES = ['Mo','Tu','We','Th','Fr','Sa','Su'];

  /* ── Render shell ── */
  const render = async () => {
    const now = new Date();
    calYear  = now.getFullYear();
    calMonth = now.getMonth();
    selectedDate = Utils.todayString();

    Utils.el('history-root').innerHTML = `
      <div class="screen-stack">

        <!-- Calendar tile -->
        <div class="tile">
          <div class="calendar-header">
            <button class="cal-nav-btn" id="calPrev">&#8249;</button>
            <div class="cal-month-title" id="calTitle"></div>
            <button class="cal-nav-btn" id="calNext">&#8250;</button>
          </div>
          <div class="cal-weekdays">
            ${DAY_NAMES.map(d => `<div class="cal-wd">${d}</div>`).join('')}
          </div>
          <div class="cal-days" id="calDays"></div>
        </div>

        <!-- Data tile -->
        <div class="tile hist-data-tile" id="histDataTile">
          <div class="hist-empty">
            <div class="hist-empty-icon">📅</div>
            <div class="hist-empty-text">Select a date to see your intake</div>
          </div>
        </div>

      </div>
    `;

    Utils.el('calPrev').addEventListener('click', () => changeMonth(-1));
    Utils.el('calNext').addEventListener('click', () => changeMonth(1));

    // Pre-load all dates for dot markers
    markedDatesCache = new Set(await Storage.getAllDates());

    renderCalendar();
    await showDataFor(selectedDate);
  };

  /* ── Render calendar ── */
  const renderCalendar = () => {
    Utils.el('calTitle').textContent = `${MONTH_NAMES[calMonth]} ${calYear}`;

    const todayStr  = Utils.todayString();
    const firstDow  = new Date(calYear, calMonth, 1).getDay();
    const leadDays  = firstDow === 0 ? 6 : firstDow - 1;
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const daysInPrev  = new Date(calYear, calMonth, 0).getDate();

    const grid = Utils.el('calDays');
    grid.innerHTML = '';

    for (let i = leadDays - 1; i >= 0; i--) {
      const btn = document.createElement('button');
      btn.className = 'cal-day other';
      btn.textContent = daysInPrev - i;
      grid.appendChild(btn);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const btn = document.createElement('button');
      btn.className = 'cal-day';
      if (ds === todayStr)     btn.classList.add('today');
      if (ds === selectedDate) btn.classList.add('selected');

      btn.innerHTML = d;
      if (markedDatesCache.has(ds)) {
        const dot = document.createElement('div');
        dot.className = 'cal-dot';
        btn.appendChild(dot);
      }

      btn.addEventListener('click', async () => {
        selectedDate = ds;
        renderCalendar();
        await showDataFor(ds);
      });
      grid.appendChild(btn);
    }
  };

  /* ── Change month ── */
  const changeMonth = (dir) => {
    const now = new Date();
    const newMonth = calMonth + dir;
    const newYear  = calYear + (newMonth > 11 ? 1 : newMonth < 0 ? -1 : 0);
    const adjMonth = ((newMonth % 12) + 12) % 12;
    // Block future months
    if (newYear > now.getFullYear() || (newYear === now.getFullYear() && adjMonth > now.getMonth())) return;
    calMonth = adjMonth; calYear = newYear;
    renderCalendar();
  };

  /* ── Show data + edit UI for a date ── */
  const showDataFor = async (dateStr) => {
    const tile   = Utils.el('histDataTile');
    const goal   = Storage.getGoal();
    const total  = await Storage.getTotalForDate(dateStr);
    const pct    = Utils.clamp(total / goal, 0, 1);
    const pctInt = Math.round(pct * 100);
    const display = Utils.formatDate(dateStr);
    const isToday = dateStr === Utils.todayString();

    const bc = Utils.badgeClass(pct);
    const bl = Utils.badgeLabel(pct);

    tile.innerHTML = `
      <div class="hist-date">${display}</div>

      ${total === 0 ? `
        <div class="hist-empty" style="margin:12px 0;">
          <div class="hist-empty-icon">💧</div>
          <div class="hist-empty-text">No data recorded for this day</div>
        </div>
      ` : `
        <div class="hist-amount-row">
          <div class="hist-label">Water Intake</div>
          <div class="hist-amount">${total} <span style="font-size:16px;font-weight:500;color:var(--md-on-surface-med)">ml</span></div>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-top">
            <span class="progress-bar-label">Progress toward ${goal} ml</span>
            <span class="progress-bar-pct">${pctInt}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${pctInt}%;background:${Utils.progressColor(pct)}"></div>
          </div>
        </div>
        <div style="margin-top:var(--space-md)">
          <span class="status-badge status-badge--${bc}">${bl}</span>
        </div>
      `}

      <!-- Edit section -->
      <div class="hist-edit-section">
        <div class="hist-edit-title">✏️ ${isToday ? 'Adjust Today' : 'Edit This Day'}</div>
        <div class="hist-edit-row">
          <button class="hist-edit-btn subtract" id="histSubtract" title="Remove 250 ml">
            <span>−</span><span style="font-size:11px">250ml</span>
          </button>
          <div class="hist-edit-input-wrap">
            <input class="hist-edit-input" type="number" id="histEditInput"
              value="${total}" min="0" max="99999" placeholder="ml" />
            <span class="hist-edit-unit">ml</span>
          </div>
          <button class="hist-edit-btn add" id="histAdd" title="Add 250 ml">
            <span>+</span><span style="font-size:11px">250ml</span>
          </button>
        </div>
        <button class="hist-save-btn" id="histSave">💾 Save Changes</button>
        ${total > 0 ? `<button class="hist-clear-btn" id="histClear">🗑 Clear Day</button>` : ''}
      </div>
    `;

    // Bind edit buttons
    const inputEl = Utils.el('histEditInput');

    Utils.el('histSubtract').addEventListener('click', () => {
      const v = Math.max(0, (parseInt(inputEl.value) || 0) - 250);
      inputEl.value = v;
    });
    Utils.el('histAdd').addEventListener('click', () => {
      const v = (parseInt(inputEl.value) || 0) + 250;
      inputEl.value = v;
    });
    Utils.el('histSave').addEventListener('click', async () => {
      const newVal = parseInt(inputEl.value);
      if (isNaN(newVal) || newVal < 0) {
        Utils.showToast('⚠️ Enter a valid amount'); return;
      }
      if (newVal > 9999) {
        Utils.showToast('⚠️ Maximum is 9999 ml per day'); return;
      }
      await Storage.setTotalForDate(dateStr, newVal);
      if (window.UserData) await UserData.recomputeProgress();
      if (window.Leaderboard && Firebase.getUserId()) Leaderboard.publishStreak(Firebase.getUserId()).catch(() => {});
      markedDatesCache = new Set(await Storage.getAllDates());
      renderCalendar();
      await showDataFor(dateStr);
      Utils.showToast('✅ Saved!');
    });

    const clearBtn = Utils.el('histClear');
    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        if (!confirm('Clear all water data for this day?')) return;
        await Storage.setTotalForDate(dateStr, 0);
        if (window.UserData) await UserData.recomputeProgress();
        if (window.Leaderboard && Firebase.getUserId()) Leaderboard.publishStreak(Firebase.getUserId()).catch(() => {});
        markedDatesCache = new Set(await Storage.getAllDates());
        renderCalendar();
        await showDataFor(dateStr);
        Utils.showToast('🗑 Day cleared');
      });
    }
  };

  /* ── Init ── */
  const init = () => {
    Router.on('history', () => render());
  };

  return { init };
})();
