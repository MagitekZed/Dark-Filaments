// Dark Filaments — Simulator tab UI (trajectory-profile edition)
//
// 2026-05-12 rebuild: the simulator tab now drives the long-burn v1 trajectory
// profile catalog (DF.sim.profiles + DF.sim.sweep) instead of the legacy bot-
// mode params. Two sub-views:
//   - Single-Run: pick a trajectory profile × buyer × target tier, get a
//     headline + per-phase + per-tier breakdown + mass-over-time chart.
//   - Sweep:      run the full 17-pairing REALISTIC_PAIRINGS matrix and surface
//     aggregate cards + cross-pairing comparison + anomaly list.
//
// The old bot-mode UI (cpm / engagement / saveVpcThreshold / tier / handoff,
// per-tick trace table, four detailed charts, comparison panel, export panel)
// has been retired. The Parameters tab still owns the underlying engine knobs;
// the Simulator tab now reads them indirectly through the buyer/timing
// profile dispatch in sweep.js.
//
// Loaded as a plain <script> from file://. IIFE attaches to
// window.DF.ui.simulator. Browser-only — no Node shim needed.

(function (global) {
  'use strict';
  global.DF = global.DF || {};
  global.DF.ui = global.DF.ui || {};

  const $ = id => document.getElementById(id);

  // ---- Module state ---------------------------------------------------

  const ui = {
    view: 'single',                    // 'single' | 'sweep'
    initialized: false,
    debounceTimer: null,

    // Single-Run panel state.
    single: {
      profileA: 'realistic-engaged',
      buyerA:   'comp-hoarder',
      tierA:    1,
      seedA:    1,
      maxDaysA: 30,
      resultA:  null,                  // { pairing, runs, summary }

      compareOn: false,
      profileB: 'realistic-engaged',
      buyerB:   'comp-rusher',
      tierB:    1,
      seedB:    1,
      maxDaysB: 30,
      resultB:  null,
    },

    // Sweep state.
    sweep: {
      tier:     1,
      seed:     1,
      maxDays:  30,
      results:  null,                  // Array<{ pairing, runs, summary }>
      running:  false,
    },
  };

  // ---- Formatting helpers --------------------------------------------

  const SEC_PER_DAY = 86400;

  function fmtTime(s) {
    if (s == null || !Number.isFinite(s)) return '—';
    const total = Math.round(s);
    if (total < 60) return total + 's';
    if (total < 3600) {
      const m = Math.floor(total / 60);
      const sec = total - m * 60;
      return m + 'm ' + sec + 's';
    }
    if (total < SEC_PER_DAY) {
      const h = Math.floor(total / 3600);
      const m = Math.floor((total - h * 3600) / 60);
      return h + 'h ' + m + 'm';
    }
    const days = total / SEC_PER_DAY;
    if (days >= 10) return days.toFixed(1) + 'd';
    const d = Math.floor(days);
    const h = Math.floor((total - d * SEC_PER_DAY) / 3600);
    return d + 'd ' + h + 'h';
  }

  function fmtTargetRange(tgt) {
    if (!tgt) return '—';
    return fmtTime(tgt.low) + ' - ' + fmtTime(tgt.high);
  }

  function fmtDriftPct(p) {
    if (p == null) return '—';
    const sign = p >= 0 ? '+' : '';
    return sign + (p * 100).toFixed(1) + '%';
  }

  function fmtRatio(r) {
    if (r == null) return '—';
    return r.toFixed(2) + 'x';
  }

  function fmtMass(m) {
    if (m == null || !Number.isFinite(m)) return '—';
    const f = global.DF && global.DF.ui && global.DF.ui.format;
    if (f && f.fmtMass) return f.fmtMass(m);
    const abs = Math.abs(m);
    if (abs === 0) return '0';
    if (abs < 1e-3) return m.toExponential(2);
    if (abs < 1) return m.toFixed(3);
    if (abs < 100) return m.toFixed(2);
    if (abs < 1e5) return Math.round(m).toLocaleString();
    return m.toExponential(2);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ---- DOM building ---------------------------------------------------

  function buildPanel() {
    const panel = document.querySelector('[data-tab-panel="simulator"]');
    if (!panel) return;
    if (panel.querySelector('.sim-root')) return;

    panel.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'wrap sim-root';
    panel.appendChild(wrap);

    wrap.innerHTML = `
      <div class="sim-subtabs">
        <button class="sim-subtab active" data-subtab="single">Single-Run</button>
        <button class="sim-subtab" data-subtab="sweep">Sweep</button>
      </div>

      <div class="sim-view sim-view-single" id="sim-view-single">
        ${renderSingleControls('a')}
        <div class="sim-result" id="sim-result-a"></div>

        <div class="sim-compare-wrap">
          <button class="sim-secondary-btn" id="sim-compare-toggle">Compare against another scenario</button>
        </div>

        <div class="sim-compare-panel hidden" id="sim-compare-panel">
          <div class="sim-compare-header">
            <div class="sim-compare-title">Comparison scenario</div>
            <button class="sim-secondary-btn" id="sim-compare-close">Close comparison</button>
          </div>
          ${renderSingleControls('b')}
          <div class="sim-result" id="sim-result-b"></div>
          <div class="sim-compare-chart-wrap">
            <div class="sim-chart-title">Mass over calendar time — overlaid</div>
            <canvas class="sim-chart sim-chart-overlay" id="sim-chart-mass-overlay" aria-label="Overlaid mass chart"></canvas>
          </div>
        </div>
      </div>

      <div class="sim-view sim-view-sweep hidden" id="sim-view-sweep">
        <div class="sim-strip">
          <div class="sim-strip-title">Sweep — 17-pairing matrix</div>
          <div class="sim-strip-row">
            <label class="sim-field">
              <span>target tier</span>
              <select id="sweep-tier"></select>
            </label>
            <label class="sim-field">
              <span>seed</span>
              <input type="number" id="sweep-seed" min="0" step="1" value="1">
            </label>
            <label class="sim-field">
              <span>max days</span>
              <input type="number" id="sweep-maxdays" min="1" step="1" value="30">
            </label>
            <button class="sim-run-btn" id="sweep-run">Run sweep</button>
            <span class="sim-sweep-status" id="sweep-status"></span>
          </div>
          <div class="sim-strip-hint">
            17 pairings (4 primary + 8 secondary + 2 stress + 2 floor + 1 legacy bot) at catalog N
            = 50 / 30 / 20 / 10. Full sweep at target T3+ may take a minute or more.
          </div>
        </div>

        <div class="sim-sweep-output" id="sweep-output"></div>
      </div>
    `;

    injectStyles();
    populateTierDropdowns();
    wireControls();
  }

  function renderSingleControls(slot) {
    const idPrefix = 'single-' + slot;
    return `
      <div class="sim-strip">
        <div class="sim-strip-title">Trajectory ${slot === 'a' ? 'A' : 'B'}</div>
        <div class="sim-strip-row">
          <label class="sim-field">
            <span>profile</span>
            <select id="${idPrefix}-profile"></select>
          </label>
          <label class="sim-field">
            <span>buyer</span>
            <select id="${idPrefix}-buyer"></select>
          </label>
          <label class="sim-field">
            <span>target tier</span>
            <select id="${idPrefix}-tier"></select>
          </label>
          <label class="sim-field">
            <span>seed</span>
            <input type="number" id="${idPrefix}-seed" min="0" step="1" value="1">
          </label>
          <label class="sim-field">
            <span>max days</span>
            <input type="number" id="${idPrefix}-maxdays" min="1" step="1" value="30">
          </label>
          <button class="sim-run-btn" id="${idPrefix}-run">Run</button>
        </div>
      </div>
    `;
  }

  // ---- Style injection -----------------------------------------------

  function injectStyles() {
    if (document.getElementById('sim-styles')) return;
    const css = `
      .sim-root { padding-top: 8px; }

      .sim-subtabs {
        display: flex;
        gap: 4px;
        margin-bottom: 18px;
        border-bottom: 1px solid var(--border);
      }
      .sim-subtab {
        background: transparent;
        color: var(--fg-faint);
        border: 1px solid transparent;
        border-bottom: none;
        border-radius: 4px 4px 0 0;
        padding: 8px 16px;
        font-size: 11px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        cursor: pointer;
        font-family: inherit;
        position: relative;
        bottom: -1px;
      }
      .sim-subtab:hover { color: var(--fg-dim); }
      .sim-subtab.active {
        color: var(--fg);
        border-color: var(--border);
        background: var(--bg);
      }

      .sim-view.hidden { display: none; }

      .sim-strip {
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 12px 14px;
        margin-bottom: 18px;
      }
      .sim-strip-title {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--fg-faint);
        margin-bottom: 10px;
      }
      .sim-strip-hint {
        font-size: 11px;
        color: var(--fg-faint);
        margin-top: 8px;
        font-style: italic;
      }
      .sim-strip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        align-items: flex-end;
      }
      .sim-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .sim-field span {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: var(--fg-faint);
      }
      .sim-field input, .sim-field select {
        background: var(--bg);
        color: var(--fg);
        border: 1px solid var(--border);
        border-radius: 3px;
        padding: 6px 8px;
        font-size: 13px;
        font-variant-numeric: tabular-nums;
        font-family: inherit;
        min-width: 140px;
      }
      .sim-field input:focus, .sim-field select:focus {
        outline: none;
        border-color: var(--accent-dim);
      }
      .sim-run-btn {
        background: transparent;
        color: var(--accent);
        border: 1px solid var(--accent-dim);
        border-radius: 4px;
        padding: 7px 18px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        cursor: pointer;
        font-family: inherit;
      }
      .sim-run-btn:hover { background: rgba(217, 181, 107, 0.08); }
      .sim-run-btn:disabled { opacity: 0.5; cursor: default; }
      .sim-secondary-btn {
        background: transparent;
        color: var(--fg-dim);
        border: 1px solid var(--border);
        border-radius: 4px;
        padding: 7px 14px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        cursor: pointer;
        font-family: inherit;
      }
      .sim-secondary-btn:hover {
        color: var(--fg);
        border-color: var(--accent-dim);
      }

      .sim-result { margin-bottom: 18px; }
      .sim-result-empty {
        padding: 36px 12px;
        text-align: center;
        color: var(--fg-faint);
        font-style: italic;
      }

      .sim-headline {
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 16px 18px;
        margin-bottom: 14px;
        border-left: 3px solid var(--accent-dim);
      }
      .sim-headline-title {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--fg-dim);
        margin-bottom: 10px;
      }
      .sim-headline-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 10px 18px;
      }
      .sim-headline-stat .lbl {
        display: block;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: var(--fg-faint);
      }
      .sim-headline-stat .val {
        display: block;
        font-size: 18px;
        color: var(--fg);
        font-variant-numeric: tabular-nums;
        margin-top: 2px;
      }
      .sim-headline-stat .val.dim { color: var(--fg-dim); font-size: 14px; }
      .sim-headline-stat .val.warn { color: #b07a7a; }
      .sim-headline-stat .val.good { color: var(--consolidation-high); }

      .sim-table {
        width: 100%;
        border-collapse: collapse;
        font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
        font-size: 11px;
        color: var(--fg-dim);
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 4px;
        margin-bottom: 14px;
      }
      .sim-table th, .sim-table td {
        padding: 5px 8px;
        text-align: right;
        border-bottom: 1px solid #161b2a;
        font-variant-numeric: tabular-nums;
      }
      .sim-table th {
        background: var(--bg);
        color: var(--fg-faint);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-weight: 400;
        font-size: 10px;
      }
      .sim-table th:first-child, .sim-table td:first-child { text-align: left; }
      .sim-table td.flag-within   { color: var(--consolidation-high); }
      .sim-table td.flag-high     { color: #b07a7a; }
      .sim-table td.flag-low      { color: var(--fg-faint); font-style: italic; }
      .sim-table td.flag-below    { color: #b07a7a; }
      .sim-table td.flag-band     { color: var(--consolidation-high); }
      .sim-table td.flag-above    { color: #c9a26b; }
      .sim-sweep-card .val.muted-warn { color: #c9a26b; }
      .sim-section-title {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--fg-faint);
        margin: 14px 0 6px;
      }

      .sim-chart-wrap {
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 4px;
        padding: 10px;
        margin-bottom: 14px;
      }
      .sim-chart-title {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: var(--fg-faint);
        margin-bottom: 6px;
      }
      .sim-chart {
        width: 100%;
        height: 220px;
        display: block;
      }

      .sim-compare-wrap { margin-bottom: 14px; }
      .sim-compare-panel {
        background: var(--bg-2);
        border: 1px solid var(--accent-dim);
        border-radius: 6px;
        padding: 14px 16px 18px;
        margin-bottom: 24px;
      }
      .sim-compare-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }
      .sim-compare-title {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--fg-dim);
      }
      .sim-compare-chart-wrap {
        background: var(--bg);
        border: 1px solid var(--border);
        border-radius: 4px;
        padding: 10px;
      }
      .hidden { display: none; }

      .sim-sweep-status {
        font-size: 11px;
        color: var(--fg-dim);
        font-style: italic;
      }
      .sim-sweep-output { display: flex; flex-direction: column; gap: 18px; }
      .sim-sweep-group {
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 12px 14px;
      }
      .sim-sweep-group-title {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--fg-dim);
        margin-bottom: 10px;
      }
      .sim-sweep-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 10px;
      }
      .sim-sweep-card {
        background: var(--bg);
        border: 1px solid var(--border);
        border-left: 3px solid var(--accent-dim);
        border-radius: 4px;
        padding: 10px 12px;
        font-size: 12px;
      }
      .sim-sweep-card.card-low-conf { border-left-color: var(--fg-faint); }
      .sim-sweep-card.card-drift    { border-left-color: #b07a7a; }
      .sim-sweep-card.card-band     { border-left-color: #b07a7a; }
      .sim-sweep-card .card-title {
        font-size: 11px;
        color: var(--fg);
        margin-bottom: 4px;
        letter-spacing: 0.04em;
      }
      .sim-sweep-card .card-line {
        font-size: 11px;
        color: var(--fg-dim);
        font-variant-numeric: tabular-nums;
        line-height: 1.5;
      }
      .sim-sweep-card .card-line .lbl { color: var(--fg-faint); margin-right: 6px; }
      .sim-sweep-card .card-line .val.warn  { color: #b07a7a; }
      .sim-sweep-card .card-line .val.good  { color: var(--consolidation-high); }
      .sim-sweep-card .card-line .val.muted { color: var(--fg-faint); }

      /* Horizontal-scroll wrapper for wide tables (cross-pairing comparison
         picks up new intermediate-tier columns at higher target tiers). The
         table is allowed to overflow horizontally; the leftmost Pairing
         column stays put via position:sticky so row identity is preserved
         while the user scrolls right to inspect later columns. */
      .sim-table-scroll {
        overflow-x: auto;
        margin-bottom: 14px;
        border: 1px solid var(--border);
        border-radius: 4px;
      }
      .sim-table-scroll > .sim-table {
        margin-bottom: 0;
        border: none;
        border-radius: 0;
      }
      .sim-table.sim-table-cross th:first-child,
      .sim-table.sim-table-cross td:first-child {
        position: sticky;
        left: 0;
        background: var(--bg-2);
        z-index: 1;
      }
      .sim-table.sim-table-cross thead th:first-child {
        background: var(--bg);
        z-index: 2;
      }

      .sim-anomalies {
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 12px 14px;
        font-size: 12px;
        color: var(--fg-dim);
      }
      .sim-anomalies ul { margin: 6px 0; padding-left: 20px; }
      .sim-anomalies li { margin-bottom: 3px; }
      .sim-anomalies .empty { color: var(--fg-faint); font-style: italic; }

      @media (max-width: 720px) {
        .sim-headline-grid { grid-template-columns: 1fr 1fr; }
        .sim-field input, .sim-field select { min-width: 100px; }
      }
    `;
    const style = document.createElement('style');
    style.id = 'sim-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ---- Dropdowns -----------------------------------------------------

  function populateTierDropdowns() {
    const runner = global.DF && global.DF.sim && global.DF.sim.runner;
    const tiers = runner && runner.TIER_CONFIGS
      ? Object.keys(runner.TIER_CONFIGS).map(t => parseInt(t, 10)).filter(n => !isNaN(n)).sort((a, b) => a - b)
      : [1, 2, 3, 4];
    const optionsHtml = tiers.map(t => `<option value="${t}">T${t}</option>`).join('');
    ['single-a-tier', 'single-b-tier', 'sweep-tier'].forEach(id => {
      const sel = $(id);
      if (sel) sel.innerHTML = optionsHtml;
    });

    const prof = global.DF.sim.profiles;
    const timingOpts = Object.keys(prof.TIMING_PROFILES).map(name => {
      const t = prof.TIMING_PROFILES[name];
      const tag = t.continuous ? ' (continuous)' : '';
      return `<option value="${name}">${name}${tag}</option>`;
    }).join('');
    const buyerOpts = Object.keys(prof.BUYER_PROFILES).map(name => {
      return `<option value="${name}">${name}</option>`;
    }).join('');
    ['single-a-profile', 'single-b-profile'].forEach(id => {
      const sel = $(id);
      if (sel) sel.innerHTML = timingOpts;
    });
    ['single-a-buyer', 'single-b-buyer'].forEach(id => {
      const sel = $(id);
      if (sel) sel.innerHTML = buyerOpts;
    });

    // Set defaults from state.
    $('single-a-profile').value = ui.single.profileA;
    $('single-a-buyer').value   = ui.single.buyerA;
    $('single-a-tier').value    = ui.single.tierA;
    $('single-a-seed').value    = ui.single.seedA;
    $('single-a-maxdays').value = ui.single.maxDaysA;

    $('single-b-profile').value = ui.single.profileB;
    $('single-b-buyer').value   = ui.single.buyerB;
    $('single-b-tier').value    = ui.single.tierB;
    $('single-b-seed').value    = ui.single.seedB;
    $('single-b-maxdays').value = ui.single.maxDaysB;

    $('sweep-tier').value    = ui.sweep.tier;
    $('sweep-seed').value    = ui.sweep.seed;
    $('sweep-maxdays').value = ui.sweep.maxDays;
  }

  // ---- Wiring --------------------------------------------------------

  function wireControls() {
    document.querySelectorAll('.sim-subtab').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.getAttribute('data-subtab');
        switchView(v);
      });
    });

    // Slot A.
    ['single-a-profile', 'single-a-buyer', 'single-a-tier',
     'single-a-seed', 'single-a-maxdays'].forEach(id => {
      const el = $(id);
      if (!el) return;
      el.addEventListener('input', () => onSingleParamChange('a'));
      el.addEventListener('change', () => onSingleParamChange('a'));
    });
    $('single-a-run').addEventListener('click', () => {
      clearTimeout(ui.debounceTimer);
      runSingleAndRender('a');
    });

    // Slot B.
    ['single-b-profile', 'single-b-buyer', 'single-b-tier',
     'single-b-seed', 'single-b-maxdays'].forEach(id => {
      const el = $(id);
      if (!el) return;
      el.addEventListener('input', () => onSingleParamChange('b'));
      el.addEventListener('change', () => onSingleParamChange('b'));
    });
    $('single-b-run').addEventListener('click', () => {
      clearTimeout(ui.debounceTimer);
      runSingleAndRender('b');
    });

    $('sim-compare-toggle').addEventListener('click', () => {
      ui.single.compareOn = !ui.single.compareOn;
      $('sim-compare-panel').classList.toggle('hidden', !ui.single.compareOn);
      if (ui.single.compareOn && !ui.single.resultB) {
        runSingleAndRender('b');
      }
    });
    $('sim-compare-close').addEventListener('click', () => {
      ui.single.compareOn = false;
      $('sim-compare-panel').classList.add('hidden');
    });

    // Sweep.
    $('sweep-run').addEventListener('click', () => {
      if (ui.sweep.running) return;
      runSweepAndRender();
    });
    ['sweep-tier', 'sweep-seed', 'sweep-maxdays'].forEach(id => {
      const el = $(id);
      if (!el) return;
      el.addEventListener('input', readSweepInputs);
      el.addEventListener('change', readSweepInputs);
    });
  }

  function switchView(v) {
    ui.view = v;
    document.querySelectorAll('.sim-subtab').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-subtab') === v);
    });
    $('sim-view-single').classList.toggle('hidden', v !== 'single');
    $('sim-view-sweep').classList.toggle('hidden', v !== 'sweep');
  }

  function readSweepInputs() {
    ui.sweep.tier    = parseInt($('sweep-tier').value, 10) || 1;
    ui.sweep.seed    = parseInt($('sweep-seed').value, 10);
    if (!Number.isFinite(ui.sweep.seed)) ui.sweep.seed = 1;
    ui.sweep.maxDays = parseFloat($('sweep-maxdays').value);
    if (!Number.isFinite(ui.sweep.maxDays) || ui.sweep.maxDays <= 0) ui.sweep.maxDays = 30;
  }

  function onSingleParamChange(slot) {
    const s = ui.single;
    if (slot === 'a') {
      s.profileA = $('single-a-profile').value;
      s.buyerA   = $('single-a-buyer').value;
      s.tierA    = parseInt($('single-a-tier').value, 10) || 1;
      s.seedA    = parseInt($('single-a-seed').value, 10);
      if (!Number.isFinite(s.seedA)) s.seedA = 1;
      s.maxDaysA = parseFloat($('single-a-maxdays').value);
      if (!Number.isFinite(s.maxDaysA) || s.maxDaysA <= 0) s.maxDaysA = 30;
    } else {
      s.profileB = $('single-b-profile').value;
      s.buyerB   = $('single-b-buyer').value;
      s.tierB    = parseInt($('single-b-tier').value, 10) || 1;
      s.seedB    = parseInt($('single-b-seed').value, 10);
      if (!Number.isFinite(s.seedB)) s.seedB = 1;
      s.maxDaysB = parseFloat($('single-b-maxdays').value);
      if (!Number.isFinite(s.maxDaysB) || s.maxDaysB <= 0) s.maxDaysB = 30;
    }
    clearTimeout(ui.debounceTimer);
    ui.debounceTimer = setTimeout(() => runSingleAndRender(slot), 300);
  }

  // ---- Single-Run execution + render ---------------------------------

  function runSingleAndRender(slot) {
    const sweep = global.DF.sim.sweep;
    const s = ui.single;
    const profile = (slot === 'a') ? s.profileA : s.profileB;
    const buyer   = (slot === 'a') ? s.buyerA   : s.buyerB;
    const tier    = (slot === 'a') ? s.tierA    : s.tierB;
    const seed    = (slot === 'a') ? s.seedA    : s.seedB;
    const maxDays = (slot === 'a') ? s.maxDaysA : s.maxDaysB;

    const pairing = {
      id: 'ad-hoc-' + slot,
      timing: profile,
      buyer: buyer,
      n: 1,
      weight: 'ad-hoc',
    };
    let result;
    try {
      result = sweep.runPairing(pairing, tier, { seed, maxDays });
    } catch (e) {
      const target = $('sim-result-' + slot);
      target.innerHTML = `<div class="sim-result-empty">Error: ${escapeHtml(e && e.message || String(e))}</div>`;
      return;
    }
    if (slot === 'a') s.resultA = result; else s.resultB = result;
    renderSingleResult(slot, result);
    if (ui.single.compareOn && s.resultA && s.resultB) {
      renderOverlayChart();
    }
  }

  function renderSingleResult(slot, result) {
    const target = $('sim-result-' + slot);
    if (!result || !result.runs || result.runs.length === 0) {
      target.innerHTML = `<div class="sim-result-empty">No data.</div>`;
      return;
    }
    const run = result.runs[0];
    const summary = result.summary;
    const pairing = result.pairing;
    const targetTier = parseInt((slot === 'a' ? ui.single.tierA : ui.single.tierB), 10) || 1;

    const dnfStr = run.dnf
      ? `<span class="val warn">DNF (${escapeHtml(run.dnfReasonCategory || 'unknown')})</span>`
      : `<span class="val good">completed</span>`;
    const peak = run.peakInTierMass != null ? run.peakInTierMass : run.finalMass;

    const targetPt = summary.perTier[targetTier];
    const driftCell = summary.driftApplies && summary.totalDriftFlag
      ? `${fmtDriftPct(summary.totalDriftPct)} [${summary.totalDriftFlag}]`
      : 'n/a';
    const bandCell = (targetPt && targetPt.massRatioP50 != null)
      ? `${fmtRatio(targetPt.massRatioP50)} [${targetPt.bandFlag || '—'}]`
      : '—';

    const headline = `
      <div class="sim-headline">
        <div class="sim-headline-title">${escapeHtml(pairing.timing)} × ${escapeHtml(pairing.buyer)} — target T${targetTier} (${escapeHtml(summary.mode)})</div>
        <div class="sim-headline-grid">
          <div class="sim-headline-stat"><span class="lbl">Calendar</span><span class="val">${fmtTime(run.totalCalendarSec)}</span></div>
          <div class="sim-headline-stat"><span class="lbl">Active</span><span class="val">${fmtTime(run.totalActiveSec)}</span></div>
          <div class="sim-headline-stat"><span class="lbl">Peak mass</span><span class="val">${fmtMass(peak)}</span></div>
          <div class="sim-headline-stat"><span class="lbl">Final mass</span><span class="val dim">${fmtMass(run.finalMass)}</span></div>
          <div class="sim-headline-stat"><span class="lbl">Final tier</span><span class="val">T${run.finalTier}</span></div>
          <div class="sim-headline-stat"><span class="lbl">Status</span>${dnfStr}</div>
          <div class="sim-headline-stat"><span class="lbl">Total drift</span><span class="val dim">${escapeHtml(driftCell)}</span></div>
          <div class="sim-headline-stat"><span class="lbl">T${targetTier} mass band</span><span class="val dim">${escapeHtml(bandCell)}</span></div>
        </div>
      </div>
    `;

    const phaseTable = renderPhaseTable(run);
    const tierTable = renderTierTable(summary, targetTier);
    const chartHtml = `
      <div class="sim-chart-wrap">
        <div class="sim-chart-title">Mass over calendar time</div>
        <canvas class="sim-chart" id="sim-chart-mass-${slot}" aria-label="Mass over calendar time"></canvas>
      </div>
    `;

    target.innerHTML = headline + phaseTable + tierTable + chartHtml;
    drawMassChart($('sim-chart-mass-' + slot), [{ run, color: getSlotColor(slot), label: slot.toUpperCase() }]);
  }

  function renderPhaseTable(run) {
    if (!run.perPhaseCalendarSec || Object.keys(run.perPhaseCalendarSec).length === 0) {
      return '';
    }
    // Phase ordering — derive from the profile definition if available.
    const prof = global.DF.sim.profiles;
    const timing = prof.TIMING_PROFILES[run.timing];
    let phaseOrder = [];
    if (timing && timing.phases) {
      phaseOrder = timing.phases.map(p => p.label);
    } else {
      phaseOrder = Object.keys(run.perPhaseCalendarSec);
    }
    // Aggregate purchases per phase.
    const buysPerPhase = {};
    const massAtPhaseEnd = {};
    for (const b of (run.buyLog || [])) {
      if (b.kind === 'buy' && b.phase) {
        buysPerPhase[b.phase] = (buysPerPhase[b.phase] || 0) + 1;
      }
    }
    // Trace the final mass observed within each phase by walking massTrace.
    if (run.massTrace) {
      for (const point of run.massTrace) {
        if (point.phase) massAtPhaseEnd[point.phase] = point.mass;
      }
    }

    const rows = [];
    for (const label of phaseOrder) {
      const cal = run.perPhaseCalendarSec[label];
      const act = run.perPhaseActiveSec ? (run.perPhaseActiveSec[label] || 0) : 0;
      if (cal == null) continue;
      const buys = buysPerPhase[label] || 0;
      const mass = massAtPhaseEnd[label];
      rows.push(`<tr>
        <td>${escapeHtml(label)}</td>
        <td>${fmtTime(cal)}</td>
        <td>${fmtTime(act)}</td>
        <td>${buys}</td>
        <td>${fmtMass(mass)}</td>
      </tr>`);
    }
    if (rows.length === 0) return '';
    return `
      <div class="sim-section-title">Per-phase breakdown</div>
      <table class="sim-table">
        <thead><tr><th>Phase</th><th>Calendar</th><th>Active</th><th>Buys</th><th>Mass at end</th></tr></thead>
        <tbody>${rows.join('')}</tbody>
      </table>
    `;
  }

  function renderTierTable(summary, targetTier) {
    const rows = [];
    for (let t = 1; t <= targetTier; t++) {
      const pt = summary.perTier[t];
      if (!pt) continue;
      const flag = pt.driftFlag;
      const flagClass =
        flag === 'within' ? 'flag-within' :
        flag === 'low-confidence' ? 'flag-low' :
        flag ? 'flag-high' : '';
      const bandClass =
        pt.bandFlag === 'within-band' ? 'flag-band' :
        pt.bandFlag === 'below-band' ? 'flag-below' :
        pt.bandFlag === 'above-band' ? 'flag-above' :
        pt.bandFlag === 'low-confidence' ? 'flag-low' : '';
      rows.push(`<tr>
        <td>T${t}</td>
        <td>${fmtTime(pt.p50)}</td>
        <td>${fmtTime(pt.p10)} / ${fmtTime(pt.p90)}</td>
        <td>${fmtTargetRange(pt.target)}</td>
        <td class="${flagClass}">${fmtDriftPct(pt.driftPct)} ${flag ? '[' + flag + ']' : ''}</td>
        <td class="${bandClass}">${fmtRatio(pt.massRatioP50)} ${pt.bandFlag ? '[' + pt.bandFlag + ']' : ''}</td>
      </tr>`);
    }
    return `
      <div class="sim-section-title">Per-tier breakdown</div>
      <table class="sim-table">
        <thead><tr><th>Tier</th><th>p50 calendar</th><th>p10 / p90</th><th>Target</th><th>Drift</th><th>Mass band</th></tr></thead>
        <tbody>${rows.join('')}</tbody>
      </table>
    `;
  }

  // ---- Mass chart (calendar-time x axis) -----------------------------

  function getSlotColor(slot) { return slot === 'a' ? '#d9b56b' : '#6ec0d9'; }

  function drawMassChart(canvas, series) {
    if (!canvas) return;
    // Canvas sizing depends on clientWidth/Height — both are 0 when the
    // canvas (or any ancestor) is display:none. The simulator tab is
    // hidden on app boot (defaultTab='playtest'), but init() still fires
    // a setTimeout(0) auto-run for the first chart — landing it on a
    // hidden canvas. Without this guard, clientWidth=0 fell back to the
    // 600px default, set canvas.width=600, then later when the tab
    // becomes visible the browser stretches that 600px buffer to fit
    // the real ~1200px container (the "stretched chart on first load"
    // bug). Skip drawing here; the tab-show callback registered in init()
    // will redraw at correct dimensions when the simulator becomes
    // visible. The canvas remains empty until then — no visual artifact.
    if (!canvas.clientWidth || !canvas.clientHeight) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0a0e1a';
    const fg = getComputedStyle(document.documentElement).getPropertyValue('--fg-dim').trim() || '#8a8a96';
    const faint = getComputedStyle(document.documentElement).getPropertyValue('--fg-faint').trim() || '#4a4d5a';
    const border = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#20263a';

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const PAD = { L: 56, R: 14, T: 14, B: 30 };

    // Collect all traces. Filter null masses.
    let maxX = 0, maxY = 0;
    const traces = [];
    for (const s of series) {
      const t = (s.run && s.run.massTrace) || [];
      const pts = t.map(p => ({ x: p.calendarSec, y: p.mass, phase: p.phase }));
      if (pts.length > 0) {
        traces.push({ pts, color: s.color, label: s.label });
        for (const p of pts) {
          if (p.x > maxX) maxX = p.x;
          if (p.y > maxY) maxY = p.y;
        }
      }
    }
    if (traces.length === 0 || maxX === 0) {
      ctx.fillStyle = faint;
      ctx.font = '11px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No mass trace data', w / 2, h / 2);
      return;
    }

    const plotW = w - PAD.L - PAD.R;
    const plotH = h - PAD.T - PAD.B;
    const x2px = x => PAD.L + (x / maxX) * plotW;
    const y2px = y => PAD.T + plotH - (y / Math.max(maxY, 1e-12)) * plotH;

    // Grid + frame.
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.strokeRect(PAD.L, PAD.T, plotW, plotH);
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillStyle = fg;
    ctx.textAlign = 'right';
    // Y ticks
    const yTicks = 4;
    for (let i = 0; i <= yTicks; i++) {
      const yv = (maxY * i) / yTicks;
      const py = y2px(yv);
      ctx.fillText(fmtMass(yv), PAD.L - 6, py + 3);
      if (i > 0 && i < yTicks) {
        ctx.strokeStyle = '#161b2a';
        ctx.beginPath(); ctx.moveTo(PAD.L, py); ctx.lineTo(PAD.L + plotW, py); ctx.stroke();
      }
    }
    // X ticks
    ctx.textAlign = 'center';
    const xTicks = 5;
    for (let i = 0; i <= xTicks; i++) {
      const xv = (maxX * i) / xTicks;
      const px = x2px(xv);
      ctx.fillText(fmtTime(xv), px, h - PAD.B + 14);
      if (i > 0 && i < xTicks) {
        ctx.strokeStyle = '#161b2a';
        ctx.beginPath(); ctx.moveTo(px, PAD.T); ctx.lineTo(px, PAD.T + plotH); ctx.stroke();
      }
    }

    // Phase boundary overlays — based on the first trace's profile.
    // Pull from active profile definition.
    if (traces.length > 0 && series[0].run && series[0].run.timing) {
      const prof = global.DF.sim.profiles;
      const timing = prof.TIMING_PROFILES[series[0].run.timing];
      if (timing && timing.phases) {
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = faint;
        for (const ph of timing.phases) {
          if (ph.fromDay > 0 && ph.fromDay * SEC_PER_DAY < maxX) {
            const px = x2px(ph.fromDay * SEC_PER_DAY);
            ctx.beginPath();
            ctx.moveTo(px, PAD.T);
            ctx.lineTo(px, PAD.T + plotH);
            ctx.stroke();
          }
        }
        ctx.setLineDash([]);
      }
    }

    // Series lines.
    for (const tr of traces) {
      ctx.strokeStyle = tr.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let first = true;
      for (const p of tr.pts) {
        const px = x2px(p.x);
        const py = y2px(p.y);
        if (first) { ctx.moveTo(px, py); first = false; }
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Legend.
    if (series.length > 1) {
      let lx = PAD.L + 8, ly = PAD.T + 6;
      ctx.font = '10px ui-monospace, monospace';
      for (const tr of traces) {
        ctx.fillStyle = tr.color;
        ctx.fillRect(lx, ly, 10, 10);
        ctx.fillStyle = fg;
        ctx.textAlign = 'left';
        ctx.fillText(tr.label, lx + 14, ly + 9);
        lx += 60;
      }
    }
  }

  function renderOverlayChart() {
    const a = ui.single.resultA && ui.single.resultA.runs[0];
    const b = ui.single.resultB && ui.single.resultB.runs[0];
    const series = [];
    if (a) series.push({ run: a, color: '#d9b56b', label: 'A: ' + ui.single.profileA + ' × ' + ui.single.buyerA });
    if (b) series.push({ run: b, color: '#6ec0d9', label: 'B: ' + ui.single.profileB + ' × ' + ui.single.buyerB });
    drawMassChart($('sim-chart-mass-overlay'), series);
  }

  // ---- Sweep ---------------------------------------------------------

  function runSweepAndRender() {
    readSweepInputs();
    const sweep = global.DF.sim.sweep;
    const prof = global.DF.sim.profiles;
    const tier = ui.sweep.tier;
    const seed = ui.sweep.seed;
    const maxDays = ui.sweep.maxDays;

    ui.sweep.running = true;
    ui.sweep.results = [];
    $('sweep-run').disabled = true;
    $('sweep-status').textContent = 'starting sweep…';
    $('sweep-output').innerHTML = '';

    const pairings = prof.REALISTIC_PAIRINGS.slice();
    let idx = 0;

    function runNext() {
      if (idx >= pairings.length) {
        ui.sweep.running = false;
        $('sweep-run').disabled = false;
        $('sweep-status').textContent = 'done — ' + pairings.length + ' pairings';
        renderSweepOutput();
        return;
      }
      const p = pairings[idx];
      $('sweep-status').textContent =
        'running pairing ' + (idx + 1) + ' of ' + pairings.length +
        ' — ' + p.id + ' (' + p.timing + ' × ' + p.buyer + ', N=' + p.n + ')';
      // Yield to the browser so the status text paints.
      setTimeout(() => {
        try {
          const result = sweep.runPairing(p, tier, { seed, maxDays });
          ui.sweep.results.push(result);
        } catch (e) {
          ui.sweep.results.push({
            pairing: p,
            runs: [],
            summary: { n: 0, dnfCount: 0, completedCount: 0, dnfRate: 0,
              lowConfidence: false, driftApplies: false, dnfByReason: {},
              perTier: {}, perPhase: {}, mode: 'unknown',
              error: e && e.message || String(e) },
          });
        }
        idx++;
        runNext();
      }, 0);
    }
    runNext();
  }

  function renderSweepOutput() {
    const out = $('sweep-output');
    const results = ui.sweep.results || [];
    const targetTier = ui.sweep.tier;

    // Group by weight.
    const byWeight = { primary: [], secondary: [], stress: [], floor: [], legacy: [] };
    for (const r of results) {
      const w = (r.pairing && r.pairing.weight) || 'other';
      if (!byWeight[w]) byWeight[w] = [];
      byWeight[w].push(r);
    }

    const sections = [];
    const orderedWeights = ['primary', 'secondary', 'stress', 'floor', 'legacy'];
    for (const wt of orderedWeights) {
      const group = byWeight[wt] || [];
      if (group.length === 0) continue;
      sections.push(renderSweepGroup(wt, group, targetTier));
    }

    // Cross-pairing comparison table.
    sections.push(renderCrossPairingTable(results, targetTier));

    // Anomalies.
    sections.push(renderAnomalies(results, targetTier));

    out.innerHTML = sections.join('');
  }

  function renderSweepGroup(weight, group, targetTier) {
    const cards = group.map(r => renderSweepCard(r, targetTier)).join('');
    return `
      <div class="sim-sweep-group">
        <div class="sim-sweep-group-title">${escapeHtml(weight)} pairings (${group.length})</div>
        <div class="sim-sweep-cards">${cards}</div>
      </div>
    `;
  }

  function renderSweepCard(r, targetTier) {
    const s = r.summary;
    const p = r.pairing;
    if (s.error) {
      return `<div class="sim-sweep-card card-low-conf">
        <div class="card-title">${escapeHtml(p.timing)} × ${escapeHtml(p.buyer)}</div>
        <div class="card-line"><span class="lbl">error</span><span class="val warn">${escapeHtml(s.error)}</span></div>
      </div>`;
    }
    const targetPt = s.perTier[targetTier];
    const driftStr = s.driftApplies && s.totalDriftFlag
      ? `${fmtDriftPct(s.totalDriftPct)} <span class="val ${s.totalDriftFlag === 'within' ? 'good' : s.totalDriftFlag === 'low-confidence' ? 'muted' : 'warn'}">[${s.totalDriftFlag}]</span>`
      : '<span class="val muted">n/a</span>';
    const bandCssTone = targetPt && (
      targetPt.bandFlag === 'within-band' ? 'good'
      : targetPt.bandFlag === 'below-band' ? 'warn'
      : targetPt.bandFlag === 'above-band' ? 'muted-warn'
      : 'muted'
    );
    const bandStr = (targetPt && targetPt.massRatioP50 != null)
      ? `${fmtRatio(targetPt.massRatioP50)} <span class="val ${bandCssTone}">[${targetPt.bandFlag || '—'}]</span>`
      : '—';
    let cardClass = '';
    if (s.lowConfidence) cardClass = 'card-low-conf';
    else if (s.driftApplies && s.totalDriftFlag && s.totalDriftFlag !== 'within') cardClass = 'card-drift';
    else if (targetPt && targetPt.bandFlag === 'below-band') cardClass = 'card-band';

    return `<div class="sim-sweep-card ${cardClass}">
      <div class="card-title">${escapeHtml(p.timing)} × ${escapeHtml(p.buyer)} <span class="val muted">(${escapeHtml(p.id)}, ${escapeHtml(s.mode)})</span></div>
      <div class="card-line"><span class="lbl">N</span><span class="val">${s.n}</span>  <span class="lbl">DNF</span><span class="val ${s.dnfCount > 0 ? 'warn' : ''}">${s.dnfCount}/${s.n}</span>${s.lowConfidence ? '  <span class="val muted">low-confidence</span>' : ''}</div>
      <div class="card-line"><span class="lbl">p10/p50/p90</span>${fmtTime(s.p10_s)} / ${fmtTime(s.p50_s)} / ${fmtTime(s.p90_s)}</div>
      <div class="card-line"><span class="lbl">total drift</span>${driftStr}</div>
      <div class="card-line"><span class="lbl">T${targetTier} band</span>${bandStr}</div>
    </div>`;
  }

  function renderCrossPairingTable(results, targetTier) {
    // Per-tier P50 calendar columns for tiers 1..(targetTier-1). Surfaces the
    // intermediate-tier milestones a sweep run produces so the user can see
    // when P50 crossed each gate, not just the target. Each cell shows the
    // P50 of `perTier[t].completedAtP50` — calendar second at which tier t
    // was completed (tier t+1 entered, or total time for the target tier).
    // Pairings that DNF before reaching tier t show '—' in that column.
    const interTiers = [];
    for (let t = 1; t < targetTier; t++) interTiers.push(t);
    // Total column count = fixed-base (10) + intermediate tier columns.
    const totalCols = 10 + interTiers.length;

    const rows = results.map(r => {
      const s = r.summary;
      const p = r.pairing;
      if (s.error) {
        return `<tr><td>${escapeHtml(p.timing + ' × ' + p.buyer)}</td><td colspan="${totalCols - 1}">error: ${escapeHtml(s.error)}</td></tr>`;
      }
      const targetPt = s.perTier[targetTier];
      const driftStr = s.driftApplies && s.totalDriftFlag
        ? `${fmtDriftPct(s.totalDriftPct)} [${s.totalDriftFlag}]`
        : 'n/a';
      const bandStr = (targetPt && targetPt.massRatioP50 != null)
        ? `${fmtRatio(targetPt.massRatioP50)} [${targetPt.bandFlag || '—'}]`
        : '—';
      const driftClass = s.totalDriftFlag === 'within' ? 'flag-within'
        : s.totalDriftFlag === 'low-confidence' ? 'flag-low'
        : s.totalDriftFlag ? 'flag-high' : '';
      const bandClass = targetPt && targetPt.bandFlag === 'within-band' ? 'flag-band'
        : targetPt && targetPt.bandFlag === 'below-band' ? 'flag-below'
        : targetPt && targetPt.bandFlag === 'above-band' ? 'flag-above'
        : targetPt && targetPt.bandFlag === 'low-confidence' ? 'flag-low'
        : '';
      const lowConfClass = s.lowConfidence ? ' flag-low' : '';
      const interCells = interTiers.map(t => {
        const pt = s.perTier[t];
        const v = pt && pt.completedAtP50 != null ? pt.completedAtP50 : null;
        return `<td class="${lowConfClass}">${fmtTime(v)}</td>`;
      }).join('');
      return `<tr>
        <td>${escapeHtml(p.timing + ' × ' + p.buyer)}</td>
        <td>${escapeHtml(s.mode)}</td>
        <td>${escapeHtml(p.weight || 'ad-hoc')}</td>
        <td>${s.n}</td>
        <td>${s.dnfCount}/${s.n}</td>
        ${interCells}
        <td class="${lowConfClass}">${fmtTime(s.p10_s)}</td>
        <td class="${lowConfClass}">${fmtTime(s.p50_s)}</td>
        <td class="${lowConfClass}">${fmtTime(s.p90_s)}</td>
        <td class="${driftClass}">${driftStr}</td>
        <td class="${bandClass}">${bandStr}</td>
      </tr>`;
    }).join('');

    const interHeaders = interTiers.map(t => `<th>T${t} p50</th>`).join('');
    return `
      <div class="sim-sweep-group">
        <div class="sim-sweep-group-title">Cross-pairing comparison</div>
        <div class="sim-table-scroll">
          <table class="sim-table sim-table-cross">
            <thead><tr>
              <th>Pairing</th><th>Mode</th><th>Weight</th><th>N</th><th>DNF</th>
              ${interHeaders}
              <th>T${targetTier} p10</th><th>T${targetTier} p50</th><th>T${targetTier} p90</th>
              <th>Total drift</th><th>T${targetTier} band</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderAnomalies(results, targetTier) {
    const flags = [];
    for (const r of results) {
      const s = r.summary;
      const p = r.pairing;
      const label = (p.timing + ' × ' + p.buyer);
      if (s.error) {
        flags.push(`${label}: error — ${s.error}`);
        continue;
      }
      if (s.lowConfidence) {
        flags.push(`${label}: low-confidence (DNF ${(s.dnfRate * 100).toFixed(0)}%)`);
      }
      if (s.driftApplies && s.totalDriftFlag && s.totalDriftFlag !== 'within' && s.totalDriftFlag !== 'low-confidence') {
        flags.push(`${label} total: drift ${fmtDriftPct(s.totalDriftPct)} [${s.totalDriftFlag}]`);
      }
      if (s.dnfCount > 0 && !s.lowConfidence) {
        const reasons = Object.keys(s.dnfByReason || {}).sort()
          .map(k => k + '=' + s.dnfByReason[k]).join(', ');
        flags.push(`${label} DNFs: ${s.dnfCount}/${s.n} (${reasons})`);
      }
      for (let t = 1; t <= targetTier; t++) {
        const pt = s.perTier[t];
        if (pt && pt.bandFlag === 'below-band') {
          flags.push(`${label} T${t} mass band: ratio p50 ${fmtRatio(pt.massRatioP50)} below threshold`);
        }
      }
    }
    const body = flags.length === 0
      ? '<div class="empty">No anomalies flagged.</div>'
      : '<ul>' + flags.map(f => '<li>' + escapeHtml(f) + '</li>').join('') + '</ul>';
    return `
      <div class="sim-anomalies">
        <div class="sim-sweep-group-title">Anomalies / flags</div>
        ${body}
      </div>
    `;
  }

  // ---- Init -----------------------------------------------------------

  function init() {
    if (ui.initialized) return;
    buildPanel();
    ui.initialized = true;
    // Register a tab-show callback so charts that couldn't render on a
    // hidden canvas (clientWidth=0; see drawMassChart) get a clean redraw
    // when the simulator becomes visible. Idempotent — also covers tab
    // switches back to simulator after window-resize while elsewhere.
    const tabs = global.DF.ui.tabs;
    if (tabs && tabs.onShow) {
      tabs.onShow('simulator', () => {
        if (ui.single.resultA) renderSingleResult('a', ui.single.resultA);
        if (ui.single.resultB) renderSingleResult('b', ui.single.resultB);
        if (ui.single.compareOn && ui.single.resultA && ui.single.resultB) {
          renderOverlayChart();
        }
      });
    }
    // Auto-run the default Single-Run scenario so the page is not blank
    // on first open of the Simulator tab. Cheap (N=1 at T1 takes a few hundred ms).
    setTimeout(() => runSingleAndRender('a'), 0);
  }

  global.DF.ui.simulator = { init };
})(window);
