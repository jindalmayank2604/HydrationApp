const AchievementsScreen = (() => {
  let unsubscribe = null;

  function render() {
    const root = Utils.el('achievements-root');
    if (!root) return;
    const state = UserData.getState();
    const milestones = UserData.buildMilestones(state.currentStreak, 12);
    const nextMilestone = milestones.find((item) => !item.claimed) || milestones[milestones.length - 1];
    const progress = nextMilestone ? Math.min(100, Math.round((state.currentStreak / nextMilestone.streak) * 100)) : 100;

    root.innerHTML = `
      <div class="screen-stack">
        <section class="achievement-hero">
          <div class="achievement-hero__copy">
            <span class="achievement-pill">Achievements</span>
            <h2 class="achievement-hero__title">${state.currentStreak} day streak</h2>
            <p class="achievement-hero__sub">Monthly streaks reset every month, but your coins stay with you. Keep clearing your hydration goal to unlock the next reward.</p>
          </div>
          <div class="achievement-coin-card">
            <div class="achievement-coin-card__label">Coin balance</div>
            <div class="achievement-coin-card__value" id="achievementCoinBalance">${state.coinBalance}</div>
            <div class="achievement-coin-card__meta">Hydration goal: ${state.hydrationGoal} ml</div>
          </div>
        </section>

        <section class="tile achievement-progress-card">
          <div class="achievement-progress-card__top">
            <div>
              <div class="settings-section-title">Streak Progress</div>
              <div class="settings-section-sub">Current streak: ${state.currentStreak} days${state.lastActiveDate ? ` • Last goal hit ${Utils.formatDate(state.lastActiveDate, { month: 'short', day: 'numeric' })}` : ''}</div>
            </div>
            <div class="achievement-progress-card__badge">${progress}%</div>
          </div>
          <div class="achievement-progress-bar">
            <div class="achievement-progress-bar__fill" style="width:0%"></div>
          </div>
          <div class="achievement-progress-card__legend">
            <span>Next milestone: ${nextMilestone?.streak || state.currentStreak} days</span>
          </div>
          <div class="achievement-track">
            ${milestones.map((milestone) => `
              <button class="achievement-node ${milestone.claimed ? 'is-claimed' : milestone.unlocked ? 'is-unlocked' : ''}" data-streak="${milestone.streak}">
                <span class="achievement-node__spark"></span>
                <span class="achievement-node__day">${milestone.streak}</span>
                <span class="achievement-node__coin" style="display:flex;align-items:center;gap:2px;white-space:nowrap;">🪙 ${milestone.reward}<span style="opacity:0.4;font-size:10px;">|</span><span style="background:linear-gradient(135deg,#f59e0b,#fbbf24);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-weight:800;filter:drop-shadow(0 0 4px rgba(251,191,36,0.6));">${milestone.reward * 2}</span><span style="font-size:8px;opacity:0.5;-webkit-text-fill-color:var(--md-on-surface-med);">pro</span></span>
                <span class="achievement-node__status">${milestone.claimed ? 'Claimed' : milestone.unlocked ? 'Claim now' : 'Locked'}</span>
              </button>
            `).join('')}
          </div>
        </section>

        <section class="achievement-grid">
          <div class="tile achievement-tip-card">
            <div class="settings-section-title">Workout Boost</div>
            <div class="settings-section-sub">Your hydration target updates from age, height, gender, and workout intensity.</div>
            <div class="achievement-tip-card__metric">${state.hydrationGoal} ml</div>
            <div class="achievement-tip-card__note">${state.userProfile.workoutToday ? 'Workout day boost is active right now.' : 'Turn on workout mode in Settings to instantly raise your target.'}</div>
          </div>

          <div class="tile achievement-tip-card achievement-tip-card--soft">
            <div class="settings-section-title">Account Tier</div>
            <div class="settings-section-sub">${UserData.canUseFreeDrink().limit ? 'Free plan active.' : 'Pro features unlocked.'}</div>
            <div class="achievement-tip-card__metric" style="${!UserData.canUseFreeDrink().limit ? 'background:linear-gradient(135deg,#f59e0b,#fbbf24);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 8px rgba(251,191,36,0.4));' : ''}">${UserData.canUseFreeDrink().limit ? 'Free' : '⭐ Pro'}</div>
            <div class="achievement-tip-card__note">${UserData.canUseFreeDrink().limit ? 'Upgrade to Pro for 2× coins & unlimited drinks.' : 'Unlimited drinks • 2× coins on milestones.'}</div>
          </div>
        </section>
      </div>
    `;

    // Animate progress bar fill after render (needs RAF to trigger CSS transition)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const fill = root.querySelector('.achievement-progress-bar__fill');
        if (fill) fill.style.width = `${progress}%`;
      });
    });

    // Claim milestone on click
    root.querySelectorAll('.achievement-node.is-unlocked:not(.is-claimed)').forEach((button) => {
      button.addEventListener('click', async () => {
        const streak = Number(button.dataset.streak);

        // Haptic
        if (navigator.vibrate) navigator.vibrate([30, 20, 60]);

        const result = await UserData.claimMilestone(streak);
        if (!result) {
          Utils.showToast('Milestone already claimed or not unlocked yet.');
          return;
        }

        // Animate node
        button.classList.add('is-claimed', 'coin-burst');

        // Animate coin balance counter
        const coinEl = root.querySelector('#achievementCoinBalance');
        if (coinEl) {
          coinEl.classList.remove('coin-tick');
          void coinEl.offsetWidth; // reflow
          coinEl.classList.add('coin-tick');
        }

        Utils.showToast(`🪙 +${result.reward} coins added to your balance!`);
        // Bump header coin chip
        const chip = document.getElementById('headerCoinValue');
        if (chip) {
          chip.textContent = UserData.getState().coinBalance;
          chip.classList.remove('bump');
          void chip.offsetWidth;
          chip.classList.add('bump');
        }

        // Delay re-render slightly so animation plays
        setTimeout(() => render(), 650);
      });
    });
  }

  function init() {
    Router.on('achievements', render);
    unsubscribe = UserData.subscribe(() => {
      if (Router.getCurrent() === 'achievements') render();
    });
  }

  return { init, render };
})();
