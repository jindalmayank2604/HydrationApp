/* ══════════════════════════════════════════
   SCREEN: Reminder — notification scheduler
   ══════════════════════════════════════════ */

const ReminderScreen = (() => {
  const PRESETS = [15, 30, 60, 90, 120];

  /* ── Render ── */
  const render = () => {
    const prefs = Storage.getReminderPrefs();

    Utils.el('reminder-root').innerHTML = `
      <div class="screen-stack">

        <!-- Status tile -->
        <div class="reminder-status-tile ${prefs.enabled ? 'on' : 'off'}" id="reminderStatusTile">
          <div class="switch-row">
            <div class="switch-info">
              <div class="switch-title" id="switchTitle">
                ${prefs.enabled ? '🔔 Reminders Active' : '🔕 Reminders Off'}
              </div>
              <div class="switch-sub" id="switchSub">
                ${prefs.enabled ? `Notifying every ${prefs.interval} minutes` : 'Toggle to enable notifications'}
              </div>
            </div>
            <label class="md-switch">
              <input type="checkbox" id="reminderToggle" ${prefs.enabled ? 'checked' : ''} />
              <div class="md-switch-track"></div>
              <div class="md-switch-thumb"></div>
            </label>
          </div>
          ${prefs.enabled ? `
            <div class="reminder-active-info">
              <span>⏱</span> Next reminder in ~${prefs.interval} min after saving
            </div>
          ` : ''}
        </div>

        <!-- Interval tile -->
        <div class="tile">
          <div class="section-header" style="margin-bottom:var(--space-md)">
            <span class="section-label">Interval</span>
          </div>

          <div class="pill-row" id="pillRow">
            ${PRESETS.map(p => `
              <button class="pill ${p === prefs.interval ? 'active' : ''}" data-val="${p}">
                ${p < 60 ? p + ' min' : p === 60 ? '1 hr' : p + ' min'}
              </button>
            `).join('')}
          </div>

          <div style="margin-top:var(--space-md)">
            <label class="md-input-label" for="intervalInput">Custom (minutes)</label>
            <input class="md-input" type="number" id="intervalInput"
              value="${prefs.interval}" min="15" max="480" placeholder="e.g. 45" />
          </div>
        </div>

        <!-- Save button -->
        <button class="md-btn md-btn--filled md-btn--full" id="saveReminderBtn" style="border-radius:var(--radius-xl);padding:16px;">
          Save Settings
        </button>

        <div class="info-banner" id="notifStatusBanner">
          <div class="info-banner-icon">🔔</div>
          <div class="info-banner-text">
            <strong>Tip:</strong> Allow notifications when prompted.
            Reminders work while the app is open or in background.
            Minimum interval is 15 minutes.
          </div>
        </div>

      </div>
    `;

    bindEvents();
  };

  /* ── Bind events ── */
  const bindEvents = () => {
    // Pill presets
    Utils.qsa('.pill', Utils.el('reminder-root')).forEach(pill => {
      pill.addEventListener('click', () => {
        Utils.qsa('.pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        Utils.el('intervalInput').value = pill.dataset.val;
      });
    });

    // Input sync back to pills
    Utils.el('intervalInput').addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      Utils.qsa('.pill').forEach(p => {
        p.classList.toggle('active', parseInt(p.dataset.val) === val);
      });
    });

    // Toggle
    Utils.el('reminderToggle').addEventListener('change', handleToggle);

    // Save
    Utils.el('saveReminderBtn').addEventListener('click', handleSave);
  };

  /* ── Toggle ── */
  const handleToggle = async () => {
    const enabled  = Utils.el('reminderToggle').checked;
    const interval = getInterval();

    if (enabled && interval < 15) {
      Utils.showToast('⚠️ Set at least 15 minutes first');
      Utils.el('reminderToggle').checked = false;
      return;
    }

    if (enabled) {
      const ok = await Notifier.start(interval);
      if (!ok) {
        Utils.showToast('❌ Please allow notifications in your browser');
        Utils.el('reminderToggle').checked = false;
        return;
      }
      Utils.showToast('✅ Reminders active!');
    } else {
      Notifier.stop();
    }

    saveAndRefresh(enabled, interval);
  };

  /* ── Save ── */
  const handleSave = async () => {
    const interval = getInterval();
    if (isNaN(interval) || interval < 15) {
      Utils.showToast('⚠️ Minimum 15 minutes');
      return;
    }

    const enabled = Utils.el('reminderToggle').checked;
    if (enabled) {
      const ok = await Notifier.start(interval);
      if (!ok) { Utils.showToast('❌ Allow notifications first'); return; }
    }

    saveAndRefresh(enabled, interval);
    Utils.showToast('Settings saved 💾');
  };

  const getInterval = () =>
    parseInt(Utils.el('intervalInput')?.value || '60');

  const saveAndRefresh = (enabled, interval) => {
    Storage.setReminderPrefs({ enabled, interval });
    // Refresh status tile
    const tile = Utils.el('reminderStatusTile');
    if (!tile) return;
    tile.className = `reminder-status-tile ${enabled ? 'on' : 'off'}`;
    Utils.el('switchTitle').textContent = enabled ? '🔔 Reminders Active' : '🔕 Reminders Off';
    Utils.el('switchSub').textContent = enabled
      ? `Notifying every ${interval} minutes`
      : 'Toggle to enable notifications';
  };

  /* ── Init ── */
  const init = () => {
    Router.on('reminder', render);
  };

  return { init };
})();
