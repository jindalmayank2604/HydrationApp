/* ══════════════════════════════════════════════════════════════
   MODULE: DataExport
   Monthly hydration PDF report — available to pro, admin, maggie.
   Shows a month picker first, then generates the PDF.
   ══════════════════════════════════════════════════════════════ */

const DataExport = (() => {

  /* ── Roles that get this feature ── */
  const _isAllowed = () => {
    const role = (Auth.getSession()?.role || '').toLowerCase();
    return ['pro', 'admin', 'maggie'].includes(role);
  };

  /* ── Load jsPDF from CDN on first use ── */
  const _loadJsPDF = () => new Promise((resolve, reject) => {
    if (window.jspdf && window.jspdf.jsPDF) { resolve(window.jspdf.jsPDF); return; }
    if (window.jsPDF) { resolve(window.jsPDF); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload = () => {
      const ctor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
      if (ctor) resolve(ctor);
      else reject(new Error('jsPDF loaded but constructor not found'));
    };
    s.onerror = () => reject(new Error('Failed to load PDF library. Check your connection.'));
    document.head.appendChild(s);
  });

  /* ── Fetch entries for exact calendar month ── */
  const _fetchMonth = async (uid, year, month) => {
    const db     = firebase.firestore();
    const mm     = String(month + 1).padStart(2, '0');
    const days   = new Date(year, month + 1, 0).getDate();
    const start  = `${year}-${mm}-01`;
    const end    = `${year}-${mm}-${String(days).padStart(2, '0')}`;

    const snap = await db.collection('users').doc(uid)
      .collection('water_entries')
      .where('date', '>=', start)
      .where('date', '<=', end)
      .orderBy('date', 'asc')
      .get();

    const byDate = {};
    snap.docs.forEach(doc => {
      const { date, amount } = doc.data();
      if (date && typeof amount === 'number') {
        byDate[date] = (byDate[date] || 0) + amount;
      }
    });
    return byDate;
  };

  const _fmtDate = (ds) =>
    new Date(ds + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  /* ── Month picker overlay ── */
  const _showMonthPicker = (onSelect) => {
    const now     = new Date();
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';

    /* Build last 12 months */
    const months = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth(),
        label: d.toLocaleString('en-IN', { month: 'long', year: 'numeric' }) });
    }

    overlay.innerHTML = `
      <div style="background:var(--md-surface,#1E2128);border-radius:24px;padding:24px;width:100%;max-width:340px;box-shadow:0 20px 60px rgba(0,0,0,0.5);border:1.5px solid rgba(251,188,4,0.3);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
          <div>
            <div style="font-size:17px;font-weight:800;color:var(--md-on-background);">📄 Download Report</div>
            <div style="font-size:12px;color:var(--md-on-surface-med);margin-top:3px;">Select a month to export</div>
          </div>
          <button id="pickerClose" style="background:var(--md-surface-2);border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:16px;color:var(--md-on-surface-med);">✕</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;max-height:320px;overflow-y:auto;">
          ${months.map((m, i) => `
            <button class="month-pick-btn" data-i="${i}" style="
              text-align:left;padding:12px 16px;border-radius:14px;border:none;cursor:pointer;
              background:${i === 0 ? 'rgba(251,188,4,0.12)' : 'var(--md-surface-2)'};
              border:1.5px solid ${i === 0 ? 'rgba(251,188,4,0.4)' : 'transparent'};
              color:var(--md-on-background);font-size:14px;font-weight:${i === 0 ? '700' : '500'};
              font-family:var(--font-body);transition:all 0.15s;">
              ${m.label}${i === 0 ? '  <span style="font-size:11px;color:#FBBC04;font-weight:700;">Current</span>' : ''}
            </button>
          `).join('')}
        </div>
      </div>`;

    document.body.appendChild(overlay);

    overlay.querySelector('#pickerClose').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelectorAll('.month-pick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const m = months[parseInt(btn.dataset.i)];
        overlay.remove();
        onSelect(m.year, m.month, m.label);
      });
    });
  };

  /* ── Build and save the PDF ── */
  const _buildPDF = async (year, month, monthLabel) => {
    const session = Auth.getSession();
    const uid     = Firebase.getUserId();
    const goal    = (window.LocalStorage ? LocalStorage.getGoal() : null)
                 || (window.Storage ? Storage.getGoal() : null)
                 || 2500;

    Utils.showToast('⏳ Building PDF…');

    const jsPDF      = await _loadJsPDF();
    const byDate     = await _fetchMonth(uid, year, month);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const now        = new Date();

    /* Stats */
    const totals     = Object.values(byDate);
    const daysLogged = totals.length;
    const daysHit    = totals.filter(v => v >= goal).length;
    const totalMl    = totals.reduce((s, v) => s + v, 0);
    const avgMl      = daysLogged ? Math.round(totalMl / daysLogged) : 0;
    const entries      = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b));
    const maxDay       = entries.length ? entries.reduce((mx, e) => e[1] > mx[1] ? e : mx, entries[0]) : null;
    const nonZero      = entries.filter(e => e[1] > 0);
    const minDay       = nonZero.length ? nonZero.reduce((mn, e) => e[1] < mn[1] ? e : mn, nonZero[0]) : null;
    let bestStreak = 0, cur = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      (byDate[ds] || 0) >= goal ? (cur++, bestStreak = Math.max(bestStreak, cur)) : (cur = 0);
    }

    /* Date range */
    const isCurrentMonth = (year === now.getFullYear() && month === now.getMonth());
    const lastDay = isCurrentMonth ? now.getDate() : daysInMonth;

    /* PDF */
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;
    const BLUE = [26, 115, 232], GOLD = [251, 188, 4];
    const DARK = [32, 33, 36],   MED  = [95, 99, 104], LITE = [241, 243, 244];
    const GREEN = [52, 168, 83], RED  = [234, 67, 53];

    /* Header */
    doc.setFillColor(...BLUE);
    doc.rect(0, 0, W, 38, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22); doc.setFont('helvetica', 'bold');
    doc.text('HydrationApp', 14, 16);
    doc.setFontSize(11); doc.setFont('helvetica', 'normal');
    doc.text(`Monthly Report  ·  ${monthLabel}`, 14, 25);
    doc.setFontSize(9);
    const rangeText = isCurrentMonth
      ? `1–${now.getDate()} ${new Date(year, month, 1).toLocaleString('en-IN', { month: 'long' })} ${year}`
      : `Full Month — ${monthLabel}`;
    doc.text(`${session?.displayName || session?.email?.split('@')[0] || 'User'}  ·  Goal: ${goal.toLocaleString()} ml/day  ·  ${rangeText}`, 14, 33);

    /* Stat boxes */
    let y = 48;
    const stats = [
      { label: 'Total Logged',  value: (totalMl / 1000).toFixed(1) + ' L' },
      { label: 'Days Hit Goal', value: `${daysHit} / ${daysInMonth}` },
      { label: 'Daily Average', value: avgMl.toLocaleString() + ' ml' },
      { label: 'Best Streak',   value: bestStreak + ' days' },
    ];
    const BW = 42, BH = 22, GAP = 4;
    stats.forEach((s, i) => {
      const x = 14 + i * (BW + GAP);
      doc.setFillColor(...LITE); doc.roundedRect(x, y, BW, BH, 3, 3, 'F');
      doc.setTextColor(...DARK); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text(s.value, x + BW / 2, y + 10, { align: 'center' });
      doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
      doc.setTextColor(...MED); doc.text(s.label, x + BW / 2, y + 17, { align: 'center' });
    });

    /* Highlights */
    y += BH + 10;
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK);
    doc.text('Highlights', 14, y); y += 5;
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...MED);
    const hl = [
      maxDay ? `Best day: ${_fmtDate(maxDay[0])} — ${maxDay[1].toLocaleString()} ml` : null,
      minDay ? `Lowest logged day: ${_fmtDate(minDay[0])} — ${minDay[1].toLocaleString()} ml` : null,
      `Days with data: ${daysLogged} of ${daysInMonth}`,
      `Goal hit rate: ${daysInMonth ? Math.round(daysHit / daysInMonth * 100) : 0}%`,
    ].filter(Boolean);
    hl.forEach(h => { doc.text(h, 14, y += 7); });

    /* Table */
    y += 12;
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK);
    doc.text('Daily Log', 14, y); y += 5;

    const drawTableHeader = (yy) => {
      doc.setFillColor(...BLUE); doc.rect(14, yy, W - 28, 8, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(8.5);
      doc.text('Date', 18, yy + 5.5);
      doc.text('Logged', 80, yy + 5.5, { align: 'right' });
      doc.text('% of Goal', 115, yy + 5.5, { align: 'right' });
      doc.text('Status', 145, yy + 5.5, { align: 'right' });
    };
    drawTableHeader(y); y += 8;

    for (let d = 1; d <= lastDay; d++) {
      const ds     = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const amt    = byDate[ds] || 0;
      const pct    = goal > 0 ? Math.round(amt / goal * 100) : 0;
      const hit    = amt >= goal;
      const isFuture = false; /* never future since we capped at today */

      if (d % 2 === 0) { doc.setFillColor(248, 249, 250); doc.rect(14, y, W - 28, 7, 'F'); }

      doc.setFontSize(8); doc.setFont('helvetica', isFuture ? 'italic' : 'normal');
      doc.setTextColor(...DARK); doc.text(_fmtDate(ds), 18, y + 5);

      if (amt > 0) { doc.setTextColor(...(hit ? GREEN : RED)); }
      else { doc.setTextColor(...MED); }
      doc.text(amt > 0 ? amt.toLocaleString() + ' ml' : '—', 80, y + 5, { align: 'right' });

      doc.setTextColor(...MED);
      doc.text(amt > 0 ? pct + '%' : '—', 115, y + 5, { align: 'right' });

      const statusColor = isFuture ? MED : hit ? GREEN : amt > 0 ? RED : MED;
      doc.setTextColor(...statusColor);
      const statusText = isFuture ? 'upcoming' : hit ? 'Goal met' : amt > 0 ? 'Below goal' : 'No data';
      doc.text(statusText, 145, y + 5, { align: 'right' });

      y += 7;
      if (y > 272) { doc.addPage(); y = 14; drawTableHeader(y); y += 8; }
    }

    /* Footer on every page */
    const pages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p);
      doc.setFillColor(...LITE); doc.rect(0, 287, W, 10, 'F');
      doc.setFontSize(7); doc.setTextColor(...MED);
      doc.text(`HydrationApp · ${monthLabel} · Generated ${now.toLocaleDateString('en-IN')}`, W / 2, 293, { align: 'center' });
      doc.text(`Page ${p} of ${pages}`, W - 14, 293, { align: 'right' });
    }

    doc.save(`HydrationApp_${year}_${String(month+1).padStart(2,'0')}_Report.pdf`);
    Utils.showToast('📄 Report downloaded!');
  };

  /* ── Public entry point ── */
  const downloadMonthlyPDF = () => {
    if (!_isAllowed()) {
      Utils.showToast('⭐ Pro feature — upgrade to download reports');
      return;
    }
    _showMonthPicker((year, month, label) => {
      _buildPDF(year, month, label).catch(err => {
        console.error('[DataExport]', err);
        Utils.showToast('❌ ' + err.message);
      });
    });
  };

  return { downloadMonthlyPDF };

})();
