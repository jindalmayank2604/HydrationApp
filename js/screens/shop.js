/* ═══════════════════════════════════════════════════════
   SCREEN: Shop — Avatar Frames + Admin Frame Manager
   ═══════════════════════════════════════════════════════ */

const ShopScreen = (() => {

  /* ── Robust admin check (works even before full auth hydration) ── */
  function _isAdmin() {
    // Method 1: Auth session
    const session = window.Auth?.getSession?.();
    const role  = (session?.role  || '').toLowerCase().trim();
    const email = (session?.email || '').toLowerCase().trim();
    if (role === 'admin' || role === 'maggie') return true;
    if (email.startsWith('sampadagupta') && email.endsWith('@gmail.com')) return true;
    // Method 2: Utils.getRole (may differ)
    const utilRole = window.Utils?.getRole?.() || '';
    if (utilRole === 'admin') return true;
    // Method 3: DOM badge as last resort
    if (document.querySelector('.admin-badge, [data-role="admin"]')) return true;
    const headerText = document.querySelector('.header-role, .role-badge')?.textContent || '';
    if (headerText.toLowerCase().includes('admin')) return true;
    return false;
  }

  /* ── Main render ── */
  function render() {
    const root = Utils.el('shop-root');
    if (!root) return;

    const state   = window.UserData ? UserData.getState() : { coinBalance: 0 };
    const role    = Utils.getRole ? Utils.getRole() : 'user';
    const isPro   = ['pro','admin','maggie'].includes(role);

    root.innerHTML = `
      <div class="screen-stack">

        <!-- Hero -->
        <section class="shop-hero">
          <span class="achievement-pill achievement-pill--shop">Shop</span>
          <h2 class="shop-hero__title">Spend coins on future unlocks</h2>
          <p class="shop-hero__sub">Earn coins by hitting hydration milestones. Spend them here.</p>
          <div class="shop-hero__coins">🪙 ${state.coinBalance || 0} coins available</div>
        </section>

        <!-- Pro status -->
        ${!isPro ? `
        <section class="tile pro-offer-card">
          <div class="pro-offer-card__header">
            <div>
              <div class="pro-offer-card__eyebrow">⭐ HydrationApp Pro</div>
              <div class="pro-offer-card__title">Unlock your full potential</div>
            </div>
            <div class="pro-offer-card__badge">COMING SOON</div>
          </div>
          <div class="pro-offer-features">
            <div class="pro-offer-feature"><span class="pro-offer-check">✓</span><div><div class="pro-offer-feature__name">450 AI drink scans <span class="pro-offer-feature__note">/ month</span></div><div class="pro-offer-feature__compare">2/day free</div></div></div>
            <div class="pro-offer-feature"><span class="pro-offer-check">✓</span><div><div class="pro-offer-feature__name">Unlimited custom drinks</div><div class="pro-offer-feature__compare">5 free</div></div></div>
            <div class="pro-offer-feature pro-offer-feature--dim"><span class="pro-offer-check">✓</span><div><div class="pro-offer-feature__name">Advanced analytics <span class="pro-offer-feature__soon">— soon</span></div></div></div>
          </div>
          <button class="pro-offer-btn" onclick="Utils.showToast('Pro is coming soon — stay tuned! 🚀')">✨ Upgrade to Pro — Coming Soon</button>
          <div class="pro-offer-note">Premium pricing will be announced soon</div>
        </section>
        ` : `
        <section class="tile" style="text-align:center;padding:28px;">
          <div style="font-size:32px;margin-bottom:8px;">⭐</div>
          <div style="font-size:16px;font-weight:700;color:var(--md-on-background);">You're on Pro</div>
          <div style="font-size:13px;color:var(--md-on-surface-med);margin-top:4px;">All Pro features are unlocked for your account.</div>
        </section>
        `}

        <!-- Avatar Frames -->
        <section class="tile" id="frameShopSection" style="overflow:visible;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:8px;">
            <div>
              <div style="font-size:15px;font-weight:700;color:var(--md-on-background);">🖼️ Avatar Frames</div>
              <div style="font-size:12px;color:var(--md-on-surface-med);margin-top:2px;">Buy with coins · Equip to show on leaderboard &amp; profile</div>
            </div>
            <div style="font-size:13px;font-weight:700;color:#c88000;background:rgba(251,188,4,0.12);border:1.5px solid rgba(251,188,4,0.3);padding:5px 14px;border-radius:99px;">
              🪙 ${state.coinBalance || 0}
            </div>
          </div>
          <div id="framesGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:16px;overflow:visible;padding:4px 2px;">
            <div style="grid-column:1/-1;text-align:center;padding:32px 0;color:var(--md-on-surface-med);font-size:13px;">
              <div style="font-size:28px;margin-bottom:8px;">⏳</div>Loading frames...
            </div>
          </div>
        </section>

        <!-- Admin panel placeholder — injected after auth confirmed -->
        <div id="adminPanelSlot"></div>

        <!-- Coming soon -->
        <div class="shop-placeholder-grid">
          <div class="tile shop-placeholder-card">
            <div class="shop-placeholder-card__badge">Coming Soon</div>
            <div class="settings-section-title">🎨 Drink Themes</div>
            <div class="settings-section-sub">Unlock themed logging visuals and seasonal bundles.</div>
          </div>
          <div class="tile shop-placeholder-card">
            <div class="shop-placeholder-card__badge">Coming Soon</div>
            <div class="settings-section-title">💪 Motivation Packs</div>
            <div class="settings-section-sub">Guided challenges and collectible achievement sets.</div>
          </div>
        </div>

      </div>`;

    // Load catalog + inject admin panel once auth is confirmed
    _loadAndRender(root, state);
  }

  /* ── Load catalog, render grid, inject admin panel ── */
  function _loadAndRender(root, state) {
    if (!window.Frames) {
      setTimeout(() => { if (window.Frames) _loadAndRender(root, state); }, 300);
      return;
    }
    Frames.loadCatalog().then(() => {
      _renderFrameGrid(root, state);
      // Inject admin panel — retry loop handles auth timing
      _tryInjectAdmin(root, 0);
    });
  }

  /* ── Retry admin injection until session is available (max ~3s) ── */
  function _tryInjectAdmin(root, attempt) {
    if (!root.isConnected) return;
    if (_isAdmin()) {
      const slot = root.querySelector('#adminPanelSlot');
      if (slot && !slot.querySelector('#adminFramePanel')) {
        slot.innerHTML = _adminPanelHTML();
        _bindAdminEvents(root);
      }
      return;
    }
    if (attempt < 15) {
      setTimeout(() => _tryInjectAdmin(root, attempt + 1), 200);
    }
  }

  /* ── Frame grid ── */
  function _renderFrameGrid(root, state) {
    const grid = root.querySelector('#framesGrid');
    if (!grid || !window.Frames) return;
    const catalog = Frames.CATALOG;
    if (!catalog || catalog.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px 0;color:var(--md-on-surface-med);">
        <div style="font-size:36px;margin-bottom:12px;">🖼️</div>
        <div style="font-size:14px;font-weight:600;">No frames in the shop yet</div>
        <div style="font-size:12px;margin-top:4px;">Check back soon!</div>
      </div>`;
      return;
    }
    grid.innerHTML = catalog.map(f => _frameTileHTML(f, state)).join('');
    _bindFrameBtns(root, state);
  }

  /* ── Frame tile ── */
  function _frameTileHTML(frame, state) {
    if (!window.Frames) return '';
    // Check admin directly here too since isAdmin() timing can be unreliable
    const session  = window.Auth?.getSession?.() || {};
    const fbEmail  = (window.firebase?.auth?.()?.currentUser?.email || '').toLowerCase();
    const sesEmail = (session.email || '').toLowerCase();
    const sesRole  = (session.role  || '').toLowerCase();
    const isAdm = sesRole==='admin' || sesRole==='maggie' ||
      fbEmail==='jindalmayank2604@gmail.com' || sesEmail==='jindalmayank2604@gmail.com' ||
      fbEmail==='mayankjindal2604@gmail.com' || sesEmail==='mayankjindal2604@gmail.com';
    const owned    = isAdm || Frames.isPurchased(frame.id);
    const equipped = Frames.isEquipped(frame.id);
    const coins    = state.coinBalance || 0;
    const canAfford = coins >= frame.cost;
    const RARITY = Frames.RARITY || {};
    const r = RARITY[frame.rarity] || { bg:'rgba(100,100,100,0.1)', border:'rgba(100,100,100,0.3)', label:'#999', text:'Common', glow:'rgba(100,100,100,0.2)' };

    const btnStyle = `width:100%;padding:8px 0;border-radius:10px;border:none;cursor:pointer;font-size:12px;font-weight:700;font-family:var(--font-body);transition:all 0.15s;margin-top:auto;`;
    let btn = '';
    if (owned && equipped) {
      btn = `<button class="frame-btn" data-action="unequip" data-id="${frame.id}" style="${btnStyle}background:rgba(217,48,37,0.12);color:#D93025;">✕ Remove</button>`;
    } else if (owned) {
      btn = `<button class="frame-btn" data-action="equip" data-id="${frame.id}" style="${btnStyle}background:rgba(52,168,83,0.15);color:#34A853;">✓ Equip</button>`;
    } else {
      btn = `<button class="frame-btn" data-action="buy" data-id="${frame.id}" style="${btnStyle}background:${canAfford?'rgba(251,188,4,0.2)':'rgba(100,100,100,0.12)'};color:${canAfford?'#c88000':'var(--md-on-surface-low)'};cursor:${canAfford?'pointer':'not-allowed'};">
        🪙 ${frame.cost}${!canAfford?' · Need more':''}
      </button>`;
    }

    return `
      <div style="background:${r.bg};border:1.5px solid ${equipped?'#34A853':r.border};border-radius:18px;
        padding:14px 10px 12px;display:flex;flex-direction:column;align-items:center;gap:8px;
        position:relative;overflow:visible;min-height:200px;transition:transform 0.18s,box-shadow 0.18s;
        ${equipped?`box-shadow:0 0 16px ${r.glow};`:''}"
        onmouseenter="this.style.transform='translateY(-3px) scale(1.02)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.3)'"
        onmouseleave="this.style.transform='';this.style.boxShadow='${equipped?`0 0 16px ${r.glow}`:''}'" >

        ${equipped ? `<div style="position:absolute;top:8px;right:8px;background:#34A853;color:#fff;font-size:9px;font-weight:800;padding:2px 7px;border-radius:99px;">ON</div>` : ''}
        ${owned && !equipped ? `<div style="position:absolute;top:8px;right:8px;background:rgba(59,130,246,0.8);color:#fff;font-size:9px;font-weight:800;padding:2px 7px;border-radius:99px;">OWNED</div>` : ''}

        <div style="width:120px;height:120px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <div style="position:relative;width:72px;height:72px;overflow:visible;">
            <div style="position:absolute;top:0;left:0;width:72px;height:72px;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,#1a73e8,#0d47a1);display:flex;align-items:center;justify-content:center;font-size:28px;z-index:1;">💧</div>
            <img src="${frame.file}" alt="${frame.name}"
              style="${Frames.getFrameOverlayStyle(frame.id, 72, 'object-fit:contain;z-index:2;', 'preview')}"
              onerror="this.style.display='none'" />
          </div>
        </div>

        <div style="text-align:center;width:100%;">
          <div style="font-size:13px;font-weight:700;color:var(--md-on-background);">${frame.emoji||'🖼️'} ${frame.name}</div>
          <div style="font-size:10px;font-weight:700;color:${r.label};margin-top:2px;text-transform:uppercase;letter-spacing:.5px;">${r.text}</div>
        </div>
        ${btn}
      </div>`;
  }

  /* ── Buy/equip button handlers ── */
  function _bindFrameBtns(root, state) {
    root.querySelectorAll('.frame-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const { action, id } = btn.dataset;
        try {
          btn.disabled = true; btn.textContent = '⏳';
          if (action === 'buy') {
            await Frames.purchase(id);
            const newState = window.UserData ? UserData.getState() : state;
            _renderFrameGrid(root, newState);
            const frame = Frames.getFrame(id);
            if (frame) _showEquipToast(root, frame, newState);
            return;
          }
          if (action === 'equip')   await Frames.equip(id);
          if (action === 'unequip') await Frames.equip(null);
          // Diagnostic
          const _uid = window.Firebase?.getUserId?.() || window.Auth?.getSession?.()?.uid || '';
          console.log('[Shop] After equip — uid:', _uid,
            '| wt_frame_'+_uid+':', localStorage.getItem('wt_frame_'+_uid),
            '| getEquipped():', Frames.getEquipped(),
            '| isEquipped(id):', Frames.isEquipped(id),
            '| state.equippedFrame:', window.UserData?.getState?.()?.equippedFrame);
          _renderFrameGrid(root, window.UserData ? UserData.getState() : state);
          if (window.App) App.updateHeaderAvatar?.(Auth.getSession());
        } catch (err) {
          Utils.showToast('❌ ' + err.message);
          btn.disabled = false;
          _renderFrameGrid(root, window.UserData ? UserData.getState() : state);
        }
      });
    });
  }

  function _showEquipToast(root, frame, state) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:var(--md-surface-2);border:2px solid var(--md-primary);border-radius:20px;padding:16px 18px;z-index:9999;display:flex;align-items:center;gap:12px;box-shadow:0 8px 32px rgba(0,0,0,0.4);font-family:var(--font-body);width:calc(100% - 48px);max-width:340px;box-sizing:border-box;';
    toast.innerHTML = `
      <div style="position:relative;width:48px;height:48px;flex-shrink:0;overflow:visible;">
        <div style="position:absolute;top:0;left:0;width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#1a73e8,#0d47a1);display:flex;align-items:center;justify-content:center;font-size:20px;z-index:1;overflow:hidden;">💧</div>
        <img src="${frame.file}" style="${Frames.getFrameOverlayStyle(frame.id,48,'object-fit:contain;z-index:2;','preview')}" onerror="this.style.display='none'"/>
      </div>
      <div style="flex:1;"><div style="font-size:13px;font-weight:700;color:var(--md-on-background);">${frame.emoji||'🖼️'} ${frame.name} unlocked!</div><div style="font-size:11px;color:var(--md-on-surface-med);margin-top:2px;">Equip it now?</div></div>
      <button id="_equipNow" style="padding:7px 14px;border-radius:99px;border:none;background:var(--md-primary);color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--font-body);white-space:nowrap;">Equip ✓</button>`;
    document.body.appendChild(toast);
    toast.querySelector('#_equipNow').onclick = async () => {
      await Frames.equip(frame.id);
      _renderFrameGrid(root, window.UserData ? UserData.getState() : state);
      toast.remove();
      if (window.App) App.updateHeaderAvatar?.(Auth.getSession());
    };
    setTimeout(() => toast.parentNode && toast.remove(), 8000);
  }

  /* ══════════════════════════════════════════════
     ADMIN FRAME MANAGER PANEL
     ══════════════════════════════════════════════ */
  /* ═══════════════════════════════════════════
     ADMIN FRAME MANAGER — HTML
     ═══════════════════════════════════════════ */
  function _adminPanelHTML() {
    return `
    <section class="tile admin-frame-panel" id="adminFramePanel">
      <div class="admin-panel-header">
        <div class="admin-panel-icon">🔑</div>
        <div>
          <div class="admin-panel-title">Frame Manager</div>
          <div class="admin-panel-sub">Admin only · Drag &amp; pinch to position · Uploads to Cloudinary</div>
        </div>
      </div>

      <div class="admin-tabs">
        <button class="admin-tab admin-tab--active" data-tab="upload">📤 Upload New</button>
        <button class="admin-tab" data-tab="manage">🗂 Manage</button>
      </div>

      <div id="adminTabUpload" class="admin-tab-content">

        <!-- Step 1: basic info -->
        <div class="admin-upload-grid">
          <div class="admin-field">
            <label class="admin-label">Frame Name</label>
            <input id="aName" class="admin-input" placeholder="e.g. Dragon Fire" />
          </div>
          <div class="admin-field">
            <label class="admin-label">Frame ID <span class="admin-hint">(auto)</span></label>
            <input id="aId" class="admin-input" placeholder="e.g. dragon_fire" />
          </div>
          <div class="admin-field">
            <label class="admin-label">Emoji</label>
            <input id="aEmoji" class="admin-input admin-input--sm" placeholder="🐉" />
          </div>
          <div class="admin-field">
            <label class="admin-label">Coin Cost</label>
            <input id="aCost" type="number" class="admin-input admin-input--sm" placeholder="300" min="0" />
          </div>
          <div class="admin-field admin-field--full">
            <label class="admin-label">Rarity</label>
            <div class="admin-rarity-picker" id="aRarityPicker">
              <button class="admin-rarity-btn admin-rarity-btn--active" data-rarity="common">⚪ Common</button>
              <button class="admin-rarity-btn" data-rarity="rare">🔵 Rare</button>
              <button class="admin-rarity-btn" data-rarity="epic">🟣 Epic</button>
              <button class="admin-rarity-btn" data-rarity="legendary">🟡 Legendary</button>
              <button class="admin-rarity-btn" data-rarity="event">🩷 Event</button>
            </div>
          </div>
        </div>

        <!-- Step 2: file drop -->
        <div class="admin-field admin-field--full" style="margin-bottom:16px;">
          <label class="admin-label">Frame Image (PNG — transparent background)</label>
          <div class="admin-dropzone" id="aDropzone">
            <div id="aDropzoneInner" class="admin-dropzone-inner">
              <div style="font-size:36px;">🖼️</div>
              <div style="font-size:13px;font-weight:600;margin-top:8px;">Drop PNG here or click to browse</div>
              <div style="font-size:11px;color:var(--md-on-surface-med);margin-top:4px;">Transparent PNG recommended</div>
            </div>
            <input type="file" id="aFile" accept="image/png,image/webp" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;" />
          </div>
        </div>

        <!-- Step 3: interactive positioning editor -->
        <div id="aEditorWrap" style="display:none;">
          <label class="admin-label" style="margin-bottom:8px;display:block;">
            Adjust Position &amp; Scale — drag to move, pinch or scroll to resize
          </label>

          <!-- The editor: fixed 200×200 avatar preview with draggable frame overlay -->
          <div style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap;">

            <!-- Main editor canvas -->
            <div style="flex-shrink:0;">
              <div style="font-size:10px;color:var(--md-on-surface-med);margin-bottom:6px;text-align:center;">EDITOR (drag &amp; scroll)</div>
              <div id="aEditor" style="position:relative;width:160px;height:160px;border-radius:50%;overflow:visible;cursor:move;touch-action:none;flex-shrink:0;">
                <!-- Avatar circle -->
                <div style="position:absolute;top:0;left:0;width:160px;height:160px;border-radius:50%;background:linear-gradient(135deg,#1a73e8,#0d47a1);display:flex;align-items:center;justify-content:center;font-size:56px;z-index:1;overflow:hidden;">💧</div>
                <!-- Frame overlay — draggable -->
                <img id="aEditorFrame" draggable="false"
                  style="position:absolute;z-index:2;pointer-events:none;object-fit:contain;transform-origin:center center;"
                  onerror="this.style.display='none'" />
              </div>
              <div style="font-size:10px;color:var(--md-on-surface-med);margin-top:8px;text-align:center;">↕ Scroll to scale · Drag to move</div>
            </div>

            <!-- Small size previews -->
            <div style="display:flex;flex-direction:column;gap:16px;flex:1;">
              <div style="font-size:10px;color:var(--md-on-surface-med);margin-bottom:4px;">LIVE PREVIEWS</div>

              <div style="display:flex;align-items:center;gap:12px;">
                <div style="position:relative;width:72px;height:72px;overflow:visible;flex-shrink:0;">
                  <div style="position:absolute;top:0;left:0;width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#1a73e8,#0d47a1);display:flex;align-items:center;justify-content:center;font-size:26px;z-index:1;overflow:hidden;">💧</div>
                  <img id="aPrev72" style="position:absolute;z-index:2;pointer-events:none;object-fit:contain;" onerror="this.style.display='none'" />
                </div>
                <div style="font-size:11px;color:var(--md-on-surface-med);">Shop card (72px)</div>
              </div>

              <div style="display:flex;align-items:center;gap:12px;">
                <div style="position:relative;width:40px;height:40px;overflow:visible;flex-shrink:0;">
                  <div style="position:absolute;top:0;left:0;width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#1a73e8,#0d47a1);display:flex;align-items:center;justify-content:center;font-size:16px;z-index:1;overflow:hidden;">💧</div>
                  <img id="aPrev40" style="position:absolute;z-index:2;pointer-events:none;object-fit:contain;" onerror="this.style.display='none'" />
                </div>
                <div style="font-size:11px;color:var(--md-on-surface-med);">Header / leaderboard (40px)</div>
              </div>

              <div style="display:flex;align-items:center;gap:12px;">
                <div style="position:relative;width:36px;height:36px;overflow:visible;flex-shrink:0;">
                  <div style="position:absolute;top:0;left:0;width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#1a73e8,#0d47a1);display:flex;align-items:center;justify-content:center;font-size:14px;z-index:1;overflow:hidden;">💧</div>
                  <img id="aPrev36" style="position:absolute;z-index:2;pointer-events:none;object-fit:contain;" onerror="this.style.display='none'" />
                </div>
                <div style="font-size:11px;color:var(--md-on-surface-med);">Leaderboard row (36px)</div>
              </div>
            </div>
          </div>

          <!-- Numeric controls -->
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:16px;">
            <div class="admin-field">
              <label class="admin-label">Scale</label>
              <input id="aScaleNum" type="number" class="admin-input" value="1.75" min="0.5" max="5" step="0.05" />
            </div>
            <div class="admin-field">
              <label class="admin-label">Offset X</label>
              <input id="aOffsetX" type="number" class="admin-input" value="0" step="1" />
            </div>
            <div class="admin-field">
              <label class="admin-label">Offset Y</label>
              <input id="aOffsetY" type="number" class="admin-input" value="0" step="1" />
            </div>
          </div>
          <button id="aResetTransform" style="margin-top:8px;padding:6px 14px;border-radius:8px;border:1px solid var(--md-outline);background:transparent;color:var(--md-on-surface-med);font-size:12px;font-family:var(--font-body);cursor:pointer;">↺ Reset</button>
        </div>

        <div id="aStatus" class="admin-status"></div>
        <button id="aUploadBtn" class="admin-upload-btn" style="margin-top:16px;">
          <span id="aUploadBtnText">📤 Upload Frame</span>
        </button>
      </div>

      <div id="adminTabManage" class="admin-tab-content" style="display:none;">
        <button id="aClearAll" style="width:100%;margin-bottom:14px;padding:10px;border-radius:12px;border:1.5px solid rgba(217,48,37,0.4);background:rgba(217,48,37,0.08);color:#D93025;font-size:13px;font-weight:700;font-family:var(--font-body);cursor:pointer;transition:all 0.15s;">
          🗑️ Clear ALL Frames from Database
        </button>
        <div id="adminManageGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:12px;overflow:visible;padding:4px 2px;">
          <div style="grid-column:1/-1;text-align:center;padding:32px 0;color:var(--md-on-surface-med);">
            <div style="font-size:28px;margin-bottom:8px;">⏳</div>Loading…
          </div>
        </div>
      </div>
    </section>`;
  }

  /* ═══════════════════════════════════════════
     ADMIN EVENT BINDING
     ═══════════════════════════════════════════ */
  function _bindAdminEvents(root) {
    const panel = root.querySelector('#adminFramePanel');
    if (!panel) return;

    // Tabs
    panel.querySelectorAll('.admin-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        panel.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('admin-tab--active'));
        tab.classList.add('admin-tab--active');
        const show = tab.dataset.tab;
        panel.querySelector('#adminTabUpload').style.display = show === 'upload' ? '' : 'none';
        panel.querySelector('#adminTabManage').style.display = show === 'manage' ? '' : 'none';
        if (show === 'manage') _renderManageGrid(panel);
      });
    });

    // Rarity picker
    panel.querySelectorAll('.admin-rarity-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('.admin-rarity-btn').forEach(b => b.classList.remove('admin-rarity-btn--active'));
        btn.classList.add('admin-rarity-btn--active');
      });
    });

    // Auto-generate ID from name
    const nameEl = panel.querySelector('#aName');
    const idEl   = panel.querySelector('#aId');
    nameEl?.addEventListener('input', () => {
      if (!idEl._manual) idEl.value = nameEl.value.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');
    });
    idEl?.addEventListener('input', () => { idEl._manual = true; });

    // ── Transform state ──
    let _imgURL = null;
    let _scale  = 1.75;
    let _offX   = 0;   // offset in editor pixels (160px editor)
    let _offY   = 0;
    const EDITOR_SIZE = 160;

    const applyTransform = () => {
      const frameEl = panel.querySelector('#aEditorFrame');
      if (!frameEl || !_imgURL) return;
      const w = Math.round(EDITOR_SIZE * _scale);
      const h = Math.round(EDITOR_SIZE * _scale);
      const baseLeft = -Math.round((w - EDITOR_SIZE) / 2);
      const baseTop  = -Math.round((h - EDITOR_SIZE) / 2);
      frameEl.style.width  = w + 'px';
      frameEl.style.height = h + 'px';
      frameEl.style.left   = (baseLeft + _offX) + 'px';
      frameEl.style.top    = (baseTop  + _offY) + 'px';
      frameEl.src = _imgURL;

      // Sync numeric inputs
      panel.querySelector('#aScaleNum').value = _scale.toFixed(2);
      panel.querySelector('#aOffsetX').value  = Math.round(_offX);
      panel.querySelector('#aOffsetY').value  = Math.round(_offY);

      // Update size previews proportionally
      [72, 40, 36].forEach(size => {
        const ratio = size / EDITOR_SIZE;
        const img   = panel.querySelector(`#aPrev${size}`);
        if (!img) return;
        const pw = Math.round(size * _scale);
        const ph = Math.round(size * _scale);
        const pl = -Math.round((pw - size) / 2) + Math.round(_offX * ratio);
        const pt = -Math.round((ph - size) / 2) + Math.round(_offY * ratio);
        img.style.width  = pw + 'px';
        img.style.height = ph + 'px';
        img.style.left   = pl + 'px';
        img.style.top    = pt + 'px';
        img.src = _imgURL;
      });
    };

    // Numeric input controls
    panel.querySelector('#aScaleNum')?.addEventListener('input', e => {
      _scale = Math.max(0.5, Math.min(5, parseFloat(e.target.value) || 1.75));
      applyTransform();
    });
    panel.querySelector('#aOffsetX')?.addEventListener('input', e => {
      _offX = parseInt(e.target.value) || 0; applyTransform();
    });
    panel.querySelector('#aOffsetY')?.addEventListener('input', e => {
      _offY = parseInt(e.target.value) || 0; applyTransform();
    });
    panel.querySelector('#aResetTransform')?.addEventListener('click', () => {
      _scale = 1.75; _offX = 0; _offY = 0; applyTransform();
    });

    // ── Drag to move ──
    const editor = panel.querySelector('#aEditor');
    let _dragging = false, _dragStartX = 0, _dragStartY = 0, _dragOffX0 = 0, _dragOffY0 = 0;

    editor?.addEventListener('pointerdown', e => {
      _dragging = true;
      _dragStartX = e.clientX; _dragStartY = e.clientY;
      _dragOffX0 = _offX; _dragOffY0 = _offY;
      editor.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    editor?.addEventListener('pointermove', e => {
      if (!_dragging) return;
      _offX = _dragOffX0 + (e.clientX - _dragStartX);
      _offY = _dragOffY0 + (e.clientY - _dragStartY);
      applyTransform();
    });
    editor?.addEventListener('pointerup', () => { _dragging = false; });

    // ── Scroll to scale ──
    editor?.addEventListener('wheel', e => {
      e.preventDefault();
      _scale = Math.max(0.5, Math.min(5, _scale - e.deltaY * 0.005));
      applyTransform();
    }, { passive: false });

    // ── Pinch to scale (touch) ──
    let _lastPinchDist = 0;
    editor?.addEventListener('touchstart', e => {
      if (e.touches.length === 2) {
        _lastPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });
    editor?.addEventListener('touchmove', e => {
      if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (_lastPinchDist > 0) {
          _scale = Math.max(0.5, Math.min(5, _scale * (dist / _lastPinchDist)));
          applyTransform();
        }
        _lastPinchDist = dist;
        e.preventDefault();
      }
    }, { passive: false });

    // ── File processing ──
    const fileEl      = panel.querySelector('#aFile');
    const dropzone    = panel.querySelector('#aDropzone');
    const editorWrap  = panel.querySelector('#aEditorWrap');

    const processFile = (file) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        _imgURL = e.target.result;
        _scale = 1.75; _offX = 0; _offY = 0;
        panel.querySelector('#aDropzoneInner').innerHTML =
          `<div style="font-size:28px;">✅</div>
           <div style="font-size:13px;font-weight:600;margin-top:6px;">${file.name}</div>
           <div style="font-size:11px;color:var(--md-on-surface-med);margin-top:3px;">Loaded · Adjust below</div>`;
        editorWrap.style.display = '';
        // Small delay so DOM is ready
        setTimeout(() => {
          const frameEl = panel.querySelector('#aEditorFrame');
          if (frameEl) frameEl.src = _imgURL;
          applyTransform();
        }, 50);
      };
      reader.readAsDataURL(file);
    };

    fileEl?.addEventListener('change', () => processFile(fileEl.files?.[0]));
    dropzone?.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('admin-dropzone--drag'); });
    dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('admin-dropzone--drag'));
    dropzone?.addEventListener('drop', e => {
      e.preventDefault(); dropzone.classList.remove('admin-dropzone--drag');
      const file = e.dataTransfer.files?.[0];
      if (file) { const dt = new DataTransfer(); dt.items.add(file); fileEl.files = dt.files; processFile(file); }
    });

    // ── Upload ──
    const uploadBtn  = panel.querySelector('#aUploadBtn');
    const statusEl   = panel.querySelector('#aStatus');
    const btnText    = panel.querySelector('#aUploadBtnText');

    uploadBtn?.addEventListener('click', async () => {
      const name   = panel.querySelector('#aName')?.value?.trim();
      const id     = panel.querySelector('#aId')?.value?.trim();
      const emoji  = panel.querySelector('#aEmoji')?.value?.trim() || '🖼️';
      const cost   = parseInt(panel.querySelector('#aCost')?.value) || 0;
      const rarity = panel.querySelector('.admin-rarity-btn--active')?.dataset?.rarity || 'common';

      if (!name || !id)  { _setStatus(statusEl,'⚠️ Name and ID required.','warn'); return; }
      if (!_imgURL)      { _setStatus(statusEl,'⚠️ Please select a frame image.','warn'); return; }

      uploadBtn.disabled = true;
      btnText.textContent = '⏳ Uploading…';
      _setStatus(statusEl, '⏳ Uploading to Cloudinary…', 'info');

      try {
        // Upload the original image file directly (no canvas baking).
        // Scale + offsets are stored in Firestore and applied at render time.
        const fileEl2 = panel.querySelector('#aFile');
        const rawFile = fileEl2?.files?.[0];
        if (!rawFile) throw new Error('Original file not found — please re-select the image');

        const blob = rawFile;
        const formData = new FormData();
        formData.append('file', blob, id + '.png');
        formData.append('upload_preset', 'hydration_avatars');
        formData.append('public_id', `hydration-app/frames/${id}`);
        formData.append('folder', 'hydration-app/frames');

        const resp = await fetch(`https://api.cloudinary.com/v1_1/du5uifnlf/image/upload`, { method:'POST', body:formData });
        const data = await resp.json();
        if (!data.secure_url) throw new Error(data.error?.message || 'Upload failed');

        _setStatus(statusEl, '✅ Uploaded! Saving to catalog…', 'ok');

        // Save scale + offset so rendering is pixel-perfect everywhere
        const frameDoc = {
          id, name, emoji, cost, rarity,
          file: data.secure_url,
          scale: parseFloat(_scale.toFixed(3)),
          offsetX: Math.round(_offX),
          offsetY: Math.round(_offY),
          addedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        await firebase.firestore().collection('app').doc('frameCatalog').set({ [id]: frameDoc }, { merge: true });

        const idx = Frames.CATALOG.findIndex(f => f.id === id);
        if (idx >= 0) Frames.CATALOG[idx] = frameDoc; else Frames.CATALOG.push(frameDoc);
        await Frames.reloadCatalog();

        _setStatus(statusEl, `✅ "${name}" is now live in the shop!`, 'ok');
        btnText.textContent = '📤 Upload Frame';
        _imgURL = null; _scale = 1.75; _offX = 0; _offY = 0;

        // Reset form
        ['#aName','#aId','#aEmoji','#aCost'].forEach(s => { const el=panel.querySelector(s); if(el) el.value=''; });
        idEl._manual = false;
        if (fileEl) fileEl.value = '';
        panel.querySelector('#aDropzoneInner').innerHTML =
          `<div style="font-size:36px;">🖼️</div>
           <div style="font-size:13px;font-weight:600;margin-top:8px;">Drop PNG here or click to browse</div>
           <div style="font-size:11px;color:var(--md-on-surface-med);margin-top:4px;">Transparent PNG recommended</div>`;
        editorWrap.style.display = 'none';
        panel.querySelectorAll('.admin-rarity-btn').forEach(b => b.classList.remove('admin-rarity-btn--active'));
        panel.querySelector('.admin-rarity-btn[data-rarity="common"]')?.classList.add('admin-rarity-btn--active');

        _renderFrameGrid(root, window.UserData ? UserData.getState() : {coinBalance:0});

      } catch(e) {
        _setStatus(statusEl, '❌ ' + e.message, 'err');
        btnText.textContent = '📤 Upload Frame';
      } finally {
        uploadBtn.disabled = false;
      }
    });
  }

  /* ── Manage grid ── */
  function _renderManageGrid(panel) {
    const grid = panel.querySelector('#adminManageGrid');
    if (!grid || !window.Frames) return;

    // Bind clear-all button (safe to re-bind each time)
    const clearBtn = panel.querySelector('#aClearAll');
    if (clearBtn && !clearBtn._bound) {
      clearBtn._bound = true;
      clearBtn.addEventListener('click', async () => {
        if (!confirm('Delete ALL frames from the database? This cannot be undone.')) return;
        clearBtn.disabled = true;
        clearBtn.textContent = '⏳ Clearing…';
        try {
          await firebase.firestore().collection('app').doc('frameCatalog').delete();
          await Frames.reloadCatalog();
          Utils.showToast('🗑️ All frames cleared');
          _renderManageGrid(panel);
          const r2 = Utils.el('shop-root');
          if (r2) _renderFrameGrid(r2, window.UserData ? UserData.getState() : {coinBalance:0});
        } catch(e) {
          Utils.showToast('❌ ' + e.message);
        } finally {
          clearBtn.disabled = false;
          clearBtn.textContent = '🗑️ Clear ALL Frames from Database';
        }
      });
    }

    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:32px 0;color:var(--md-on-surface-med);"><div style="font-size:28px;margin-bottom:8px;">⏳</div>Loading…</div>';
    Frames.reloadCatalog().then(() => {
      const catalog = Frames.CATALOG;
      if (!catalog || catalog.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--md-on-surface-med);"><div style="font-size:36px;margin-bottom:8px;">🖼️</div>No frames yet</div>';
        return;
      }
      grid.innerHTML = catalog.map(f => {
        const r = (Frames.RARITY||{})[f.rarity] || { bg:'rgba(100,100,100,0.1)', border:'rgba(100,100,100,0.3)', label:'#999', text:f.rarity||'?' };
        return `<div style="background:${r.bg};border:1.5px solid ${r.border};border-radius:14px;padding:10px 8px;display:flex;flex-direction:column;align-items:center;gap:6px;position:relative;overflow:visible;">
          <div style="position:relative;width:56px;height:56px;overflow:visible;margin-top:6px;flex-shrink:0;">
            <div style="position:absolute;top:0;left:0;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#1a73e8,#0d47a1);display:flex;align-items:center;justify-content:center;font-size:22px;z-index:1;overflow:hidden;">💧</div>
            <img src="${f.file}" style="${Frames.getFrameOverlayStyle(f.id,56,'object-fit:contain;z-index:2;')}" onerror="this.style.display='none'" />
          </div>
          <div style="font-size:11px;font-weight:700;color:var(--md-on-background);text-align:center;">${f.emoji||'🖼️'} ${f.name}</div>
          <div style="font-size:9px;font-weight:700;color:${r.label};text-transform:uppercase;">${r.text} · 🪙${f.cost}</div>
          <a href="${f.file}" target="_blank" style="font-size:9px;color:var(--md-primary);text-decoration:none;">🔗 Cloudinary</a>
          <button class="admin-delete-btn" data-id="${f.id}" data-name="${f.name}"
            style="width:100%;padding:5px;border-radius:8px;border:none;cursor:pointer;font-size:11px;font-weight:700;font-family:var(--font-body);background:rgba(217,48,37,0.12);color:#D93025;">
            🗑️ Delete
          </button>
        </div>`;
      }).join('');

      grid.querySelectorAll('.admin-delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm(`Delete "${btn.dataset.name}"?`)) return;
          btn.disabled = true; btn.textContent = '⏳';
          try {
            // Delete directly — we're already inside the admin panel (admin-only section)
            await firebase.firestore().collection('app').doc('frameCatalog').update({
              [btn.dataset.id]: firebase.firestore.FieldValue.delete()
            });
            await Frames.reloadCatalog();
            Utils.showToast('🗑️ Deleted');
            _renderManageGrid(panel);
            const r2 = Utils.el('shop-root');
            if (r2) _renderFrameGrid(r2, window.UserData ? UserData.getState() : {coinBalance:0});
          } catch(e) { Utils.showToast('❌ ' + e.message); btn.disabled=false; btn.textContent='🗑️ Delete'; }
        });
      });
    });
  }

  function _setStatus(el, msg, type) {
    if (!el) return;
    el.textContent = msg;
    el.style.color = type==='ok'?'#34A853':type==='warn'?'#F9AB00':type==='err'?'#EA4335':'var(--md-on-surface-med)';
    el.style.display = 'block';
  }

  function init() { Router.on('shop', render); }
  return { init, render };
})();
