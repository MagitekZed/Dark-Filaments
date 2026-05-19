// Dark Filaments — Parameters tab UI
// Phase 4 of the JS sim migration. Surfaces every editable parameter from the
// project (engine, strategy, per-tier engagement, full upgrade table editor,
// synergy table view, reset-to-default) as form controls.
//
// Data flow:
//   * Reads + writes through DF.sim.getParamsStore() (the shared params store).
//   * The Simulator-tab quick-strip (cpm / engagement / saveVpcThreshold / tier)
//     also writes to the same store, so edits in either place propagate to the
//     other. Edits on this tab trigger the Simulator tab's debounced auto-rerun.
//
// Loaded as a plain <script> from file://. IIFE attaches to window.DF.ui.parameters.
// Browser-only — no Node shim needed.

(function (global) {
  'use strict';
  global.DF = global.DF || {};
  global.DF.ui = global.DF.ui || {};

  const $  = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  // Module state.
  const ui = {
    initialized: false,
    storeUnsub: null,
    suppressStoreSync: false,  // re-entrancy guard while applying external updates
    expandedRow: null,         // upgrade index of currently-expanded row, or null
    confirmResetVisible: false,
    exportPanelOpen: false,    // Parameters-tab export panel toggle
  };

  // Engine + strategy parameter schema. Each entry maps a store key to an input
  // descriptor used by render + apply.
  // step: 'any' on float fields lets the browser accept arbitrary decimals
  // regardless of the starting value (HTML5 step-validation otherwise rejects
  // values that aren't an exact multiple of step from the implicit base).
  // Integer fields keep step: 1.
  const ENGINE_FIELDS = [
    { key: 'tickIntervalMs',     label: 'tick rate (ms)',          min: 50,    max: 60000,  step: 1,     parse: (v) => parseInt(v, 10) },
    { key: 'baseMpc',            label: 'base click value',        min: 0,     max: 1000,   step: 'any', parse: parseFloat },
    { key: 'baseMps',            label: 'base mps',                min: 0,     max: 1000,   step: 'any', parse: parseFloat },
    { key: 'consolidationThreshold',  label: 'consolidation T1 → T2',        min: 0.01,  max: 100,    step: 'any', parse: parseFloat },
    { key: 'consolidationGrowth',     label: 'consolidation growth ^(n-1)',  min: 1.0,   max: 10.0,   step: 'any', parse: parseFloat },
    { key: 'cpmWindowMs',        label: 'live-cpm window (ms)',    min: 1000,  max: 600000, step: 100,   parse: (v) => parseInt(v, 10) },
  ];

  const STRATEGY_FIELDS = [
    { key: 'saveVpcThreshold',         label: 'save VPC ratio',          min: 0, max: 10,   step: 'any', parse: parseFloat },
    { key: 'longSaveTimeThresholdSec', label: 'long-save threshold (s)', min: 0, max: 3600, step: 'any', parse: parseFloat },
    { key: 'longSaveTolerance',        label: 'long-save tolerance ×',   min: 1, max: 5,    step: 'any', parse: parseFloat },
    { key: 'engagement',               label: 'engagement ×',            min: 0, max: 10,   step: 'any', parse: parseFloat },
    { key: 'cpm',                      label: 'cpm',                     min: 1, max: 6000, step: 1,     parse: (v) => parseInt(v, 10) },
  ];

  const SCENARIO_OPTIONS = [
    { value: 'completion', label: 'Completion' },
    { value: 'threshold',  label: 'Threshold'  },
  ];

  // Per-tier engagement — 10 tiers.
  const TIER_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Upgrade table column groups. Each group has a title and a list of fields.
  // Fields drive render + apply; numeric fields use type=number, bool fields a
  // checkbox, tier a select. Each row is rendered with the "summary" set always
  // visible and the rest behind an expand toggle.
  // 'num' fields use step: 'any' so the browser accepts free decimal entry
  // regardless of the starting value. 'int' fields stay on step 1.
  const UPGRADE_SUMMARY_FIELDS = [
    { key: 'name',       label: 'name',     kind: 'string', readonly: true, width: '160px' },
    { key: 'tier',       label: 'tier',     kind: 'tier',                   width: '60px'  },
    { key: 'maxLevels',  label: 'max lvl',  kind: 'int',    min: 1,         width: '64px'  },
    { key: 'initCost',   label: 'cost₀',    kind: 'num',    step: 'any',    width: '80px'  },
    { key: 'costGrowth', label: 'growth',   kind: 'num',    step: 'any',    width: '70px'  },
    { key: 'consolidation', label: 'consolidation', kind: 'num',    step: 'any',    width: '78px'  },
  ];

  const UPGRADE_GROUPS = [
    { title: 'cost / consolidation', fields: [
      { key: 'initCost',   label: 'init cost',        kind: 'num', step: 'any' },
      { key: 'costGrowth', label: 'cost growth',      kind: 'num', step: 'any' },
      { key: 'maxLevels',  label: 'max levels',       kind: 'int', min: 1      },
      { key: 'consolidation', label: 'consolidation +',  kind: 'num', step: 'any' },
    ]},
    { title: 'mass per second (passive)', fields: [
      { key: 'baseMps',    label: 'base mps',         kind: 'num', step: 'any' },
      { key: 'addMps',     label: '+ mps / lvl',      kind: 'num', step: 'any' },
      { key: 'selfMps',    label: 'self mps × ^lvl',  kind: 'num', step: 'any' },
    ]},
    { title: 'mass per click', fields: [
      { key: 'baseMpc',    label: 'base mpc',         kind: 'num', step: 'any' },
      { key: 'addMpc',     label: '+ mpc / lvl',      kind: 'num', step: 'any' },
      { key: 'selfMpc',    label: 'self mpc × ^lvl',  kind: 'num', step: 'any' },
    ]},
    { title: 'auto per second', fields: [
      { key: 'baseAps',    label: 'base aps',         kind: 'num', step: 'any' },
      { key: 'addAps',     label: '+ aps / lvl',      kind: 'num', step: 'any' },
      { key: 'selfAps',    label: 'self aps × ^lvl',  kind: 'num', step: 'any' },
    ]},
    { title: 'global multipliers', fields: [
      { key: 'allMps',     label: '× all mps',        kind: 'num', step: 'any' },
      { key: 'allMpc',     label: '× all mpc',        kind: 'num', step: 'any' },
      { key: 'allAps',     label: '× all aps',        kind: 'num', step: 'any' },
    ]},
    { title: 'flags', fields: [
      { key: 'completionist', label: 'completionist',  kind: 'bool' },
    ]},
  ];

  // ---- Build the Parameters tab DOM -----------------------------------

  function buildPanel() {
    const panel = document.querySelector('[data-tab-panel="parameters"]');
    if (!panel) return;
    if (panel.querySelector('.params-root')) return;

    panel.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'wrap params-root';
    panel.appendChild(wrap);

    wrap.innerHTML = `
      <div class="params-header">
        <div class="params-title">Parameters</div>
        <div class="params-sub">Engine, strategy, per-tier engagement, and the full upgrade table.
          Edits propagate to the Simulator tab and trigger an auto-rerun.</div>
      </div>

      <section class="params-section" id="params-engine">
        <h2 class="params-section-title">Engine</h2>
        <div class="params-section-sub">Tick rate, base values, consolidation gate parameters.</div>
        <div class="params-grid" id="params-engine-grid"></div>
      </section>

      <section class="params-section" id="params-strategy">
        <h2 class="params-section-title">Strategy &amp; default scenario</h2>
        <div class="params-section-sub">Algorithmic-player VPC ratio, default scenario for fresh sim runs.</div>
        <div class="params-grid" id="params-strategy-grid"></div>
        <div class="params-grid params-strategy-extras">
          <label class="params-field">
            <span>default scenario</span>
            <select id="params-scenario"></select>
          </label>
        </div>
      </section>

      <section class="params-section" id="params-pertier">
        <h2 class="params-section-title">Per-tier engagement curve</h2>
        <div class="params-section-sub">The expected engagement at each tier.
          The simulator multiplies this by the global engagement field (Strategy
          section above, also surfaced on the Simulator quick-strip).</div>
        <div class="params-pertier-grid" id="params-pertier-grid"></div>
      </section>

      <section class="params-section" id="params-upgrades">
        <h2 class="params-section-title">Upgrade table</h2>
        <div class="params-section-sub">Per-upgrade fields. Click a row to expand the full editor.</div>
        <div class="params-upgrades-table-wrap">
          <table class="params-upgrades-table">
            <thead>
              <tr id="params-upgrades-thead"></tr>
            </thead>
            <tbody id="params-upgrades-tbody"></tbody>
          </table>
        </div>
      </section>

      <section class="params-section" id="params-synergies">
        <h2 class="params-section-title">Synergy table (read-only)</h2>
        <div class="params-section-sub">Cross-cutting view of all synergies declared across upgrades.
          Edits happen via each provider's expanded row in the upgrade table.</div>
        <div class="params-synergies-wrap">
          <table class="params-synergies-table">
            <thead>
              <tr><th>provider</th><th>target</th><th>multiplier</th><th>kind</th></tr>
            </thead>
            <tbody id="params-synergies-tbody"></tbody>
          </table>
        </div>
      </section>

      <section class="params-section" id="params-import">
        <h2 class="params-section-title">Import settings</h2>
        <div class="params-section-sub">Paste a settings JSON exported from the Simulator tab.
          Missing keys fall back to defaults; the schema version is checked but unknown versions
          are imported with a warning. The Simulator tab re-runs automatically on apply.</div>
        <textarea class="params-import-ta" id="params-import-ta" spellcheck="false"
          placeholder='{ "version": "0.1.0", "params": { ... }, "upgrades": [ ... ] }'></textarea>
        <div class="params-import-row">
          <button class="params-import-btn" id="params-import-btn">Import</button>
          <div class="params-import-status" id="params-import-status"></div>
        </div>
      </section>

      <section class="params-section" id="params-export">
        <h2 class="params-section-title">Export settings</h2>
        <div class="params-section-sub">Export the current params, upgrades, and the latest Simulator-tab headline as JSON or Markdown.
          Mirrors the Simulator tab's export — same output, accessible from here while tuning.</div>
        <div class="params-export-row">
          <button class="params-export-btn" id="params-export-toggle"
            title="Open the export panel.">Export current settings</button>
        </div>
        <div class="params-export-panel hidden" id="params-export-panel">
          <div class="params-export-grid">
            <div class="params-export-col">
              <div class="params-export-collabel">JSON (machine-readable)</div>
              <textarea class="params-export-ta" id="params-export-json" readonly spellcheck="false"></textarea>
              <button class="params-export-secondary-btn" id="params-copy-json">Copy JSON</button>
            </div>
            <div class="params-export-col">
              <div class="params-export-collabel">Markdown (chat-pasteable)</div>
              <textarea class="params-export-ta" id="params-export-md" readonly spellcheck="false"></textarea>
              <button class="params-export-secondary-btn" id="params-copy-md">Copy Markdown</button>
            </div>
          </div>
        </div>
      </section>

      <section class="params-section params-reset-section">
        <h2 class="params-section-title">Reset</h2>
        <div class="params-reset-row">
          <button class="params-reset-btn" id="params-reset-btn">Reset all to defaults</button>
          <div class="params-reset-confirm hidden" id="params-reset-confirm">
            <span>This will discard all edits to engine, strategy, per-tier engagement, and the upgrade table.</span>
            <button class="params-confirm-yes" id="params-reset-yes">Yes, reset</button>
            <button class="params-confirm-no"  id="params-reset-no">Cancel</button>
          </div>
        </div>
        <div class="params-reset-row" style="margin-top: 10px;">
          <button class="params-reset-btn" id="params-universe-reset-btn"
            title="Wipe the persistent localStorage save and reload to a fresh T1 universe.">Reset universe</button>
          <div class="params-reset-confirm hidden" id="params-universe-reset-confirm">
            <span>This wipes the persistent save (mass, levels, carry, snapshots) and reloads the page. Parameter edits are unaffected.</span>
            <button class="params-confirm-yes" id="params-universe-reset-yes">Yes, wipe save</button>
            <button class="params-confirm-no"  id="params-universe-reset-no">Cancel</button>
          </div>
        </div>
      </section>
    `;

    injectStyles();
    renderEngineGrid();
    renderStrategyGrid();
    renderPerTierGrid();
    renderUpgradesTable();
    renderSynergyTable();
    wireResetControls();
    wireImportControls();
    wireExportControls();
  }

  function injectStyles() {
    if (document.getElementById('params-styles')) return;
    const css = `
      .params-root { padding-top: 8px; padding-bottom: 36px; }
      .params-header { margin-bottom: 18px; }
      .params-title {
        font-size: 18px;
        font-weight: 300;
        color: var(--fg);
        letter-spacing: 0.04em;
      }
      .params-sub {
        font-size: 11px;
        color: var(--fg-faint);
        margin-top: 4px;
        line-height: 1.5;
      }

      .params-section {
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 14px 16px 18px;
        margin-bottom: 16px;
      }
      .params-section-title {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--fg-dim);
        margin: 0 0 4px;
        font-weight: 500;
      }
      .params-section-sub {
        font-size: 11px;
        color: var(--fg-faint);
        margin-bottom: 12px;
        line-height: 1.5;
      }

      .params-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 10px 14px;
      }
      .params-strategy-extras { margin-top: 10px; }
      .params-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .params-field span {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--fg-faint);
      }
      .params-field input,
      .params-field select {
        background: var(--bg);
        color: var(--fg);
        border: 1px solid var(--border);
        border-radius: 3px;
        padding: 6px 8px;
        font-size: 13px;
        font-variant-numeric: tabular-nums;
        font-family: inherit;
        width: 100%;
        box-sizing: border-box;
      }
      .params-field input:focus,
      .params-field select:focus {
        outline: none;
        border-color: var(--accent-dim);
      }
      .params-field input[readonly] {
        opacity: 0.6;
        cursor: default;
      }

      .params-pertier-grid {
        display: grid;
        grid-template-columns: repeat(10, minmax(0, 1fr));
        gap: 8px;
      }
      .params-pertier-grid .params-field span {
        text-align: center;
      }
      @media (max-width: 720px) {
        .params-pertier-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
      }

      .params-upgrades-table-wrap {
        overflow-x: auto;
        border: 1px solid var(--border);
        border-radius: 4px;
      }
      .params-upgrades-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
        font-variant-numeric: tabular-nums;
        font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      }
      .params-upgrades-table th {
        text-align: left;
        padding: 8px 8px;
        background: var(--bg);
        color: var(--fg-faint);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-weight: 400;
        font-size: 10px;
        border-bottom: 1px solid var(--border);
        white-space: nowrap;
      }
      .params-upgrades-table td {
        padding: 4px 6px;
        border-bottom: 1px solid #161b2a;
        vertical-align: middle;
        color: var(--fg-dim);
      }
      .params-upgrades-table tr.upgrade-summary { cursor: pointer; }
      .params-upgrades-table tr.upgrade-summary:hover td {
        background: rgba(255,255,255,0.03);
      }
      .params-upgrades-table tr.upgrade-summary.expanded td {
        background: rgba(217, 181, 107, 0.05);
      }
      .params-upgrades-table input[type="number"],
      .params-upgrades-table input[type="text"],
      .params-upgrades-table select {
        background: var(--bg);
        color: var(--fg);
        border: 1px solid var(--border);
        border-radius: 2px;
        padding: 3px 5px;
        font-size: 11px;
        font-family: inherit;
        font-variant-numeric: tabular-nums;
        width: 100%;
        box-sizing: border-box;
      }
      .params-upgrades-table tr.expand-toggle-cell {
        text-align: center;
        color: var(--fg-faint);
      }
      .params-upgrades-table .upgrade-detail-row > td {
        background: #080c16;
        padding: 12px 16px;
        border-bottom: 2px solid var(--border);
      }
      .params-upgrade-detail {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 12px;
      }
      .params-upgrade-detail-group {
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 4px;
        padding: 10px 12px;
      }
      .params-upgrade-detail-group h3 {
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: var(--fg-faint);
        margin: 0 0 8px;
        font-weight: 400;
      }
      .params-upgrade-detail-group .params-field {
        margin-bottom: 6px;
      }
      .params-upgrade-detail-group label.params-bool {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        color: var(--fg-dim);
      }
      .params-upgrade-detail-group label.params-bool input { width: auto; }
      .params-upgrade-detail-group .params-desc {
        grid-column: 1 / -1;
      }
      .params-upgrade-detail-desc {
        background: var(--bg);
        color: var(--fg-dim);
        border: 1px solid var(--border);
        border-radius: 2px;
        padding: 6px 8px;
        font-size: 11px;
        font-family: inherit;
        font-style: italic;
        width: 100%;
        box-sizing: border-box;
        min-height: 56px;
        resize: vertical;
      }
      .params-synergies-section {
        grid-column: 1 / -1;
      }
      .params-synergies-section h3 {
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: var(--fg-faint);
        margin: 0 0 6px;
      }
      .params-synergy-row {
        display: grid;
        grid-template-columns: 1fr 90px 28px;
        gap: 6px;
        align-items: center;
        margin-bottom: 4px;
      }
      .params-synergy-row select,
      .params-synergy-row input {
        font-size: 11px;
      }
      .params-synergy-add {
        background: transparent;
        color: var(--fg-faint);
        border: 1px dashed var(--border);
        border-radius: 2px;
        padding: 4px 8px;
        font-size: 10px;
        cursor: pointer;
        font-family: inherit;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }
      .params-synergy-add:hover { color: var(--fg-dim); border-color: var(--accent-dim); }
      .params-synergy-remove {
        background: transparent;
        color: var(--fg-faint);
        border: none;
        cursor: pointer;
        font-size: 14px;
        line-height: 1;
        padding: 0 2px;
      }
      .params-synergy-remove:hover { color: #b07a7a; }

      .params-synergies-wrap {
        border: 1px solid var(--border);
        border-radius: 4px;
        overflow-x: auto;
      }
      .params-synergies-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
        font-variant-numeric: tabular-nums;
        font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      }
      .params-synergies-table th {
        text-align: left;
        padding: 8px 10px;
        background: var(--bg);
        color: var(--fg-faint);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-weight: 400;
        font-size: 10px;
        border-bottom: 1px solid var(--border);
      }
      .params-synergies-table td {
        padding: 5px 10px;
        border-bottom: 1px solid #161b2a;
        color: var(--fg-dim);
      }
      .params-synergies-empty {
        font-style: italic;
        color: var(--fg-faint);
        padding: 8px 10px;
        font-size: 11px;
      }

      .params-reset-section {
        background: transparent;
        border: none;
        padding: 0;
        margin-top: 8px;
      }
      .params-reset-row {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .params-reset-btn {
        background: transparent;
        color: var(--fg-dim);
        border: 1px solid var(--border);
        border-radius: 4px;
        padding: 7px 18px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        cursor: pointer;
        font-family: inherit;
      }
      .params-reset-btn:hover { color: #b07a7a; border-color: #b07a7a; }
      .params-reset-confirm {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 11px;
        color: var(--fg-dim);
        flex-wrap: wrap;
      }
      .params-confirm-yes,
      .params-confirm-no {
        background: transparent;
        border: 1px solid var(--border);
        border-radius: 3px;
        padding: 4px 12px;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        cursor: pointer;
        font-family: inherit;
      }
      .params-confirm-yes { color: #b07a7a; border-color: #b07a7a; }
      .params-confirm-no  { color: var(--fg-dim); }
      .params-confirm-no:hover { color: var(--fg); }

      .params-import-ta {
        width: 100%;
        min-height: 140px;
        background: var(--bg);
        color: var(--fg);
        border: 1px solid var(--border);
        border-radius: 3px;
        padding: 8px 10px;
        font-size: 11px;
        font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
        font-variant-numeric: tabular-nums;
        line-height: 1.5;
        resize: vertical;
        box-sizing: border-box;
        white-space: pre;
        overflow: auto;
      }
      .params-import-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 10px;
        flex-wrap: wrap;
      }
      .params-import-btn {
        background: transparent;
        color: var(--accent);
        border: 1px solid var(--accent-dim);
        border-radius: 4px;
        padding: 7px 18px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        cursor: pointer;
        font-family: inherit;
      }
      .params-import-btn:hover { background: rgba(217, 181, 107, 0.08); }
      .params-import-status {
        font-size: 11px;
        color: var(--fg-dim);
        font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
        flex: 1 1 220px;
        line-height: 1.5;
      }
      .params-import-status.error { color: #b07a7a; }
      .params-import-status.warn  { color: #c9a86a; }
      .params-import-status.ok    { color: var(--consolidation-high); }

      .params-export-row {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .params-export-btn {
        background: transparent;
        color: var(--accent);
        border: 1px solid var(--accent-dim);
        border-radius: 4px;
        padding: 7px 18px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        cursor: pointer;
        font-family: inherit;
      }
      .params-export-btn:hover { background: rgba(217, 181, 107, 0.08); }
      .params-export-btn.active {
        color: var(--fg);
        background: rgba(217, 181, 107, 0.06);
      }
      .params-export-panel {
        margin-top: 12px;
        background: var(--bg);
        border: 1px solid var(--border);
        border-radius: 4px;
        padding: 12px 14px;
      }
      .params-export-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .params-export-col {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .params-export-collabel {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: var(--fg-faint);
      }
      .params-export-ta {
        background: var(--bg);
        color: var(--fg);
        border: 1px solid var(--border);
        border-radius: 3px;
        padding: 8px 10px;
        font-size: 11px;
        font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
        font-variant-numeric: tabular-nums;
        line-height: 1.5;
        height: 220px;
        resize: vertical;
        white-space: pre;
        overflow: auto;
        box-sizing: border-box;
      }
      .params-export-secondary-btn {
        background: transparent;
        color: var(--fg-dim);
        border: 1px solid var(--border);
        border-radius: 3px;
        padding: 5px 12px;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        cursor: pointer;
        font-family: inherit;
        align-self: flex-start;
      }
      .params-export-secondary-btn:hover {
        color: var(--fg);
        border-color: var(--accent-dim);
      }
      @media (max-width: 720px) {
        .params-export-grid { grid-template-columns: 1fr; }
      }

      .hidden { display: none !important; }
    `;
    const style = document.createElement('style');
    style.id = 'params-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ---- Render: engine + strategy grids --------------------------------

  function buildField(field, value) {
    const lab = document.createElement('label');
    lab.className = 'params-field';
    const sp = document.createElement('span');
    sp.textContent = field.label;
    lab.appendChild(sp);
    const inp = document.createElement('input');
    inp.type = 'number';
    if (field.min != null) inp.min = field.min;
    if (field.max != null) inp.max = field.max;
    if (field.step != null) inp.step = field.step;
    inp.value = (value != null && isFinite(value)) ? value : '';
    inp.id = 'params-fld-' + field.key;
    inp.dataset.fieldKey = field.key;
    inp.addEventListener('input', () => onScalarFieldChange(field, inp));
    lab.appendChild(inp);
    return lab;
  }

  function renderEngineGrid() {
    const grid = $('params-engine-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const params = getStoreParams();
    for (const f of ENGINE_FIELDS) {
      grid.appendChild(buildField(f, params[f.key]));
    }
  }

  function renderStrategyGrid() {
    const grid = $('params-strategy-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const params = getStoreParams();
    for (const f of STRATEGY_FIELDS) {
      grid.appendChild(buildField(f, params[f.key]));
    }

    const sel = $('params-scenario');
    if (sel) {
      sel.innerHTML = '';
      for (const opt of SCENARIO_OPTIONS) {
        const o = document.createElement('option');
        o.value = opt.value;
        o.textContent = opt.label;
        sel.appendChild(o);
      }
      sel.value = params.scenario || 'completion';
      sel.addEventListener('change', () => {
        applyParamPatch({ scenario: sel.value });
      });
    }
  }

  function onScalarFieldChange(field, inp) {
    const raw = inp.value;
    if (raw === '' || raw == null) return;
    const v = field.parse(raw);
    if (!isFinite(v)) return;
    applyParamPatch({ [field.key]: v });
  }

  // ---- Render: per-tier engagement ------------------------------------

  function renderPerTierGrid() {
    const grid = $('params-pertier-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const params = getStoreParams();
    const curve = params.perTierEngagement || {};
    for (const t of TIER_NUMBERS) {
      const lab = document.createElement('label');
      lab.className = 'params-field';
      const sp = document.createElement('span');
      sp.textContent = 'T' + t;
      lab.appendChild(sp);
      const inp = document.createElement('input');
      inp.type = 'number';
      inp.min = 0;
      inp.max = 10;
      inp.step = 'any';
      inp.id = 'params-pertier-' + t;
      const v = curve[t];
      inp.value = (v != null && isFinite(v)) ? v : '';
      inp.addEventListener('input', () => {
        const raw = inp.value;
        if (raw === '' || raw == null) return;
        const n = parseFloat(raw);
        if (!isFinite(n)) return;
        const cur = (getStoreParams().perTierEngagement) || {};
        const next = Object.assign({}, cur, { [t]: n });
        applyParamPatch({ perTierEngagement: next });
      });
      lab.appendChild(inp);
      grid.appendChild(lab);
    }
  }

  // ---- Render: upgrade table ------------------------------------------

  function renderUpgradesTable() {
    const thead = $('params-upgrades-thead');
    const tbody = $('params-upgrades-tbody');
    if (!thead || !tbody) return;

    // Header.
    thead.innerHTML = '';
    const cExpand = document.createElement('th');
    cExpand.style.width = '24px';
    cExpand.textContent = '';
    thead.appendChild(cExpand);
    for (const f of UPGRADE_SUMMARY_FIELDS) {
      const th = document.createElement('th');
      th.textContent = f.label;
      if (f.width) th.style.width = f.width;
      thead.appendChild(th);
    }
    const cType = document.createElement('th');
    cType.style.width = '80px';
    cType.textContent = 'type';
    thead.appendChild(cType);
    const cCompl = document.createElement('th');
    cCompl.style.width = '40px';
    cCompl.textContent = 'comp';
    thead.appendChild(cCompl);

    // Body.
    tbody.innerHTML = '';
    const upgrades = getStoreUpgrades();
    for (let i = 0; i < upgrades.length; i++) {
      const u = upgrades[i];
      const tr = document.createElement('tr');
      tr.classList.add('upgrade-summary');
      tr.dataset.upgradeIndex = i;
      if (ui.expandedRow === i) tr.classList.add('expanded');

      const expandCell = document.createElement('td');
      expandCell.classList.add('expand-toggle-cell');
      expandCell.textContent = (ui.expandedRow === i) ? '▾' : '▸';
      tr.appendChild(expandCell);

      for (const f of UPGRADE_SUMMARY_FIELDS) {
        tr.appendChild(buildUpgradeCell(i, u, f));
      }
      tr.appendChild(buildUpgradeTypeCell(i, u));
      tr.appendChild(buildUpgradeBoolCell(i, u, 'completionist'));

      tr.addEventListener('click', (e) => {
        // Don't toggle expand when the click landed on an input/select inside the row.
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
        toggleExpand(i);
      });

      tbody.appendChild(tr);

      if (ui.expandedRow === i) {
        tbody.appendChild(buildUpgradeDetailRow(i, u));
      }
    }
  }

  function buildUpgradeCell(idx, u, field) {
    const td = document.createElement('td');
    if (field.kind === 'string') {
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.value = u[field.key] != null ? u[field.key] : '';
      if (field.readonly) inp.readOnly = true;
      if (field.width) inp.style.width = field.width;
      inp.addEventListener('input', () => applyUpgradePatch(idx, { [field.key]: inp.value }));
      td.appendChild(inp);
    } else if (field.kind === 'tier') {
      const sel = document.createElement('select');
      for (const t of TIER_NUMBERS) {
        const o = document.createElement('option');
        o.value = String(t);
        o.textContent = 'T' + t;
        sel.appendChild(o);
      }
      sel.value = String(u.tier || 1);
      sel.addEventListener('change', () => {
        applyUpgradePatch(idx, { tier: parseInt(sel.value, 10) });
        rerenderTables();
      });
      td.appendChild(sel);
    } else if (field.kind === 'int' || field.kind === 'num') {
      const inp = document.createElement('input');
      inp.type = 'number';
      if (field.min != null) inp.min = field.min;
      if (field.max != null) inp.max = field.max;
      if (field.step != null) inp.step = field.step;
      const v = u[field.key];
      inp.value = (v != null && isFinite(v)) ? v : 0;
      inp.addEventListener('input', () => {
        const raw = inp.value;
        if (raw === '' || raw == null) return;
        const n = (field.kind === 'int') ? parseInt(raw, 10) : parseFloat(raw);
        if (!isFinite(n)) return;
        applyUpgradePatch(idx, { [field.key]: n });
      });
      td.appendChild(inp);
    }
    return td;
  }

  function buildUpgradeTypeCell(idx, u) {
    // type is derived from maxLevels: 1 = one-shot, else stackable. Editing the
    // type sets maxLevels to 1 (one-shot) or 99 (stackable) as a sensible default.
    const td = document.createElement('td');
    const sel = document.createElement('select');
    const optS = document.createElement('option'); optS.value = 'stackable'; optS.textContent = 'stackable'; sel.appendChild(optS);
    const optO = document.createElement('option'); optO.value = 'one-shot';  optO.textContent = 'one-shot';  sel.appendChild(optO);
    const isOne = (u.maxLevels === 1);
    sel.value = isOne ? 'one-shot' : 'stackable';
    sel.addEventListener('change', () => {
      const next = (sel.value === 'one-shot') ? 1 : 99;
      applyUpgradePatch(idx, { maxLevels: next });
      rerenderTables();
    });
    td.appendChild(sel);
    return td;
  }

  function buildUpgradeBoolCell(idx, u, key) {
    const td = document.createElement('td');
    const inp = document.createElement('input');
    inp.type = 'checkbox';
    inp.checked = !!u[key];
    inp.addEventListener('change', () => {
      applyUpgradePatch(idx, { [key]: inp.checked });
      rerenderTables();
    });
    td.appendChild(inp);
    return td;
  }

  function buildUpgradeDetailRow(idx, u) {
    // Counts upgrade-summary cells +1 for the expand-toggle col + type + comp.
    const colSpan = UPGRADE_SUMMARY_FIELDS.length + 3;
    const tr = document.createElement('tr');
    tr.classList.add('upgrade-detail-row');
    const td = document.createElement('td');
    td.colSpan = colSpan;
    tr.appendChild(td);

    const detail = document.createElement('div');
    detail.className = 'params-upgrade-detail';
    td.appendChild(detail);

    for (const group of UPGRADE_GROUPS) {
      const card = document.createElement('div');
      card.className = 'params-upgrade-detail-group';
      const h = document.createElement('h3');
      h.textContent = group.title;
      card.appendChild(h);
      for (const f of group.fields) {
        if (f.kind === 'bool') {
          const wrap = document.createElement('label');
          wrap.className = 'params-bool';
          const inp = document.createElement('input');
          inp.type = 'checkbox';
          inp.checked = !!u[f.key];
          inp.addEventListener('change', () => {
            applyUpgradePatch(idx, { [f.key]: inp.checked });
            rerenderTables();
          });
          wrap.appendChild(inp);
          const sp = document.createElement('span');
          sp.textContent = f.label;
          wrap.appendChild(sp);
          card.appendChild(wrap);
        } else {
          const lab = document.createElement('label');
          lab.className = 'params-field';
          const sp = document.createElement('span');
          sp.textContent = f.label;
          lab.appendChild(sp);
          const inp = document.createElement('input');
          inp.type = 'number';
          if (f.min != null) inp.min = f.min;
          if (f.max != null) inp.max = f.max;
          if (f.step != null) inp.step = f.step;
          inp.value = (u[f.key] != null && isFinite(u[f.key])) ? u[f.key] : 0;
          inp.addEventListener('input', () => {
            const raw = inp.value;
            if (raw === '' || raw == null) return;
            const n = (f.kind === 'int') ? parseInt(raw, 10) : parseFloat(raw);
            if (!isFinite(n)) return;
            applyUpgradePatch(idx, { [f.key]: n });
          });
          lab.appendChild(inp);
          card.appendChild(lab);
        }
      }
      detail.appendChild(card);
    }

    // Synergies sub-block — add/remove targets per upgrade.
    const synSection = document.createElement('div');
    synSection.className = 'params-upgrade-detail-group params-synergies-section';
    const synH = document.createElement('h3');
    synH.textContent = 'synergies (this upgrade provides →)';
    synSection.appendChild(synH);
    const upgrades = getStoreUpgrades();
    const synergies = Array.isArray(u.synergies) ? u.synergies : [];
    if (synergies.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'params-synergies-empty';
      empty.textContent = 'no synergies declared';
      synSection.appendChild(empty);
    }
    for (let s = 0; s < synergies.length; s++) {
      synSection.appendChild(buildSynergyRow(idx, s, synergies[s], upgrades));
    }
    const addBtn = document.createElement('button');
    addBtn.className = 'params-synergy-add';
    addBtn.textContent = '+ add synergy';
    addBtn.addEventListener('click', () => {
      const cur = getStoreUpgrades();
      const arr = (cur[idx].synergies || []).slice();
      // Default target = first other upgrade, multiplier 1.0.
      const defaultTarget = (cur.find((x, j) => j !== idx) || cur[idx]).name;
      arr.push({ target: defaultTarget, multiplier: 1.0 });
      applyUpgradePatch(idx, { synergies: arr });
      rerenderTables();
    });
    synSection.appendChild(addBtn);
    detail.appendChild(synSection);

    // Description textarea.
    const descWrap = document.createElement('div');
    descWrap.className = 'params-upgrade-detail-group params-desc';
    const descH = document.createElement('h3');
    descH.textContent = 'description';
    descWrap.appendChild(descH);
    const descTa = document.createElement('textarea');
    descTa.className = 'params-upgrade-detail-desc';
    descTa.value = u.desc || '';
    descTa.addEventListener('input', () => applyUpgradePatch(idx, { desc: descTa.value }));
    descWrap.appendChild(descTa);
    detail.appendChild(descWrap);

    return tr;
  }

  function buildSynergyRow(idx, synIdx, syn, upgrades) {
    const row = document.createElement('div');
    row.className = 'params-synergy-row';

    const sel = document.createElement('select');
    for (const u of upgrades) {
      const o = document.createElement('option');
      o.value = u.name;
      o.textContent = u.name;
      sel.appendChild(o);
    }
    sel.value = syn.target || upgrades[0].name;
    sel.addEventListener('change', () => updateSynergy(idx, synIdx, { target: sel.value }));
    row.appendChild(sel);

    const inp = document.createElement('input');
    inp.type = 'number';
    inp.min = 0;
    inp.step = 'any';
    inp.value = (syn.multiplier != null && isFinite(syn.multiplier)) ? syn.multiplier : 1.0;
    inp.addEventListener('input', () => {
      const v = parseFloat(inp.value);
      if (!isFinite(v)) return;
      updateSynergy(idx, synIdx, { multiplier: v });
    });
    row.appendChild(inp);

    const rm = document.createElement('button');
    rm.className = 'params-synergy-remove';
    rm.textContent = '×';
    rm.title = 'remove synergy';
    rm.addEventListener('click', () => removeSynergy(idx, synIdx));
    row.appendChild(rm);

    return row;
  }

  function updateSynergy(idx, synIdx, patch) {
    const cur = getStoreUpgrades();
    const u = cur[idx];
    const arr = (u.synergies || []).slice();
    if (synIdx < 0 || synIdx >= arr.length) return;
    arr[synIdx] = Object.assign({}, arr[synIdx], patch);
    applyUpgradePatch(idx, { synergies: arr });
  }

  function removeSynergy(idx, synIdx) {
    const cur = getStoreUpgrades();
    const u = cur[idx];
    const arr = (u.synergies || []).slice();
    if (synIdx < 0 || synIdx >= arr.length) return;
    arr.splice(synIdx, 1);
    applyUpgradePatch(idx, { synergies: arr });
    rerenderTables();
  }

  function toggleExpand(idx) {
    ui.expandedRow = (ui.expandedRow === idx) ? null : idx;
    renderUpgradesTable();
  }

  // ---- Render: synergy table -----------------------------------------

  function renderSynergyTable() {
    const tbody = $('params-synergies-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const upgrades = getStoreUpgrades();
    let anyRows = false;
    for (const u of upgrades) {
      const syns = Array.isArray(u.synergies) ? u.synergies : [];
      for (const s of syns) {
        anyRows = true;
        const tr = document.createElement('tr');
        const isOneShot = (u.maxLevels === 1);
        const target = upgrades.find(x => x.name === s.target);
        const targetIsOneShot = target && target.maxLevels === 1;
        const kind = isOneShot
          ? 'flat one-shot'
          : (targetIsOneShot ? 'cross-stat' : 'stackable per-level');
        tr.innerHTML = `
          <td>${escapeHtml(u.name)}</td>
          <td>${escapeHtml(s.target)}</td>
          <td>${(s.multiplier != null) ? s.multiplier.toFixed(3) + '×' : '—'}</td>
          <td>${kind}</td>
        `;
        tbody.appendChild(tr);
      }
    }
    if (!anyRows) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 4;
      td.className = 'params-synergies-empty';
      td.textContent = 'no synergies declared in the upgrade table';
      tr.appendChild(td);
      tbody.appendChild(tr);
    }
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, ch => (
      ch === '&' ? '&amp;' :
      ch === '<' ? '&lt;'  :
      ch === '>' ? '&gt;'  :
      ch === '"' ? '&quot;' : '&#39;'
    ));
  }

  // ---- Reset confirm flow ---------------------------------------------

  function wireResetControls() {
    const btn = $('params-reset-btn');
    const cnf = $('params-reset-confirm');
    const yes = $('params-reset-yes');
    const no  = $('params-reset-no');
    if (!btn || !cnf || !yes || !no) return;
    btn.addEventListener('click', () => {
      ui.confirmResetVisible = true;
      cnf.classList.remove('hidden');
      btn.classList.add('hidden');
    });
    no.addEventListener('click', () => {
      ui.confirmResetVisible = false;
      cnf.classList.add('hidden');
      btn.classList.remove('hidden');
    });
    yes.addEventListener('click', () => {
      ui.confirmResetVisible = false;
      cnf.classList.add('hidden');
      btn.classList.remove('hidden');
      // Reset the store and re-render.
      global.DF.sim.resetParamsStore();
    });

    // Reset universe — wipes the persistent localStorage save and reloads.
    // Distinct from the params reset above: params are in-memory configuration
    // for sim runs; the universe save is the player's actual game state.
    const ubtn = $('params-universe-reset-btn');
    const ucnf = $('params-universe-reset-confirm');
    const uyes = $('params-universe-reset-yes');
    const uno  = $('params-universe-reset-no');
    if (!ubtn || !ucnf || !uyes || !uno) return;
    ubtn.addEventListener('click', () => {
      ucnf.classList.remove('hidden');
      ubtn.classList.add('hidden');
    });
    uno.addEventListener('click', () => {
      ucnf.classList.add('hidden');
      ubtn.classList.remove('hidden');
    });
    uyes.addEventListener('click', () => {
      ucnf.classList.add('hidden');
      ubtn.classList.remove('hidden');
      const pt = global.DF.ui && global.DF.ui.playtest;
      if (pt && typeof pt.resetUniverse === 'function') {
        pt.resetUniverse();
      } else {
        // Fallback: clear directly + reload, in case playtest module isn't
        // present (e.g. in a future React reuse of parameters.js).
        const save = global.DF.sim && global.DF.sim.save;
        if (save) save.clearLocalSave();
        if (typeof location !== 'undefined' && location.reload) location.reload();
      }
    });
  }

  // ---- Import-settings flow (Phase 5) ---------------------------------

  function wireImportControls() {
    const btn = $('params-import-btn');
    const ta  = $('params-import-ta');
    const status = $('params-import-status');
    if (!btn || !ta || !status) return;

    btn.addEventListener('click', () => {
      const settings = global.DF.ui.settings;
      if (!settings || !settings.importJson) {
        setImportStatus(status, 'error', 'settings module not loaded');
        return;
      }
      const result = settings.importJson(ta.value);
      if (!result.ok) {
        setImportStatus(status, 'error', 'Import failed: ' + (result.errors[0] || 'unknown'));
        return;
      }
      // Replace store state in one shot. Both Simulator and Parameters tabs
      // are subscribed and will re-render via the existing pull paths.
      const store = global.DF.sim.getParamsStore();
      store.setState({
        params: result.value.params,
        upgrades: result.value.upgrades,
      });

      const warnings = result.warnings || [];
      const tag = warnings.length > 0
        ? 'Imported with ' + warnings.length + ' warning' + (warnings.length === 1 ? '' : 's') + ': ' + warnings.join('; ')
        : 'Imported (' + (result.value.upgrades.length) + ' upgrades, schema ' + (result.value.version || '—') + ')';
      setImportStatus(status, warnings.length > 0 ? 'warn' : 'ok', tag);
    });
  }

  function setImportStatus(el, kind, msg) {
    el.classList.remove('error', 'warn', 'ok');
    if (kind) el.classList.add(kind);
    el.textContent = msg;
  }

  // ---- Export-settings flow (parallel affordance to Simulator tab) ----

  // The Parameters tab has no headline of its own — the Simulator tab owns the
  // run results. We pull the headline that the Simulator tab last published
  // (if any) so the JSON exported here matches what the Simulator tab would
  // produce. If the Simulator tab has not run yet, headline is omitted, which
  // matches DF.ui.settings.exportJson semantics.
  function wireExportControls() {
    const toggle = $('params-export-toggle');
    const panel = $('params-export-panel');
    const cpyJ = $('params-copy-json');
    const cpyM = $('params-copy-md');
    if (!toggle || !panel || !cpyJ || !cpyM) return;

    toggle.addEventListener('click', () => {
      if (ui.exportPanelOpen) {
        ui.exportPanelOpen = false;
        panel.classList.add('hidden');
        toggle.classList.remove('active');
        return;
      }
      ui.exportPanelOpen = true;
      panel.classList.remove('hidden');
      toggle.classList.add('active');
      refreshExportTextareas();
    });

    cpyJ.addEventListener('click', () => copyTextFromTextarea($('params-export-json'), cpyJ, 'Copy JSON'));
    cpyM.addEventListener('click', () => copyTextFromTextarea($('params-export-md'), cpyM, 'Copy Markdown'));
  }

  function refreshExportTextareas() {
    const settings = global.DF.ui.settings;
    if (!settings) return;
    const store = global.DF.sim.getParamsStore();
    const state = store.getState();

    // Pull whatever the Simulator tab last published (if anything).
    // DF.ui.simulator exposes getLastHeadline + getLastTier hooks added for this
    // export path; both are optional and tolerate the Simulator tab never having
    // run.
    const sim = global.DF.ui && global.DF.ui.simulator;
    const lastHeadline = (sim && typeof sim.getLastHeadline === 'function') ? sim.getLastHeadline() : null;
    const lastTier = (sim && typeof sim.getLastTier === 'function') ? sim.getLastTier() : null;

    const opts = {
      tier: (lastTier != null) ? lastTier : ((state.params && state.params.tier) || 1),
      mode: (state.params && state.params.scenario) || 'completion',
    };
    if (lastHeadline) opts.headline = lastHeadline;

    const json = settings.exportJson(state, opts);
    const md = settings.exportMarkdown(state, opts);
    if ($('params-export-json')) $('params-export-json').value = json;
    if ($('params-export-md')) $('params-export-md').value = md;
  }

  // Clipboard pattern mirrors the Simulator tab's copyTextFromTextarea, kept
  // local so the Parameters tab does not depend on the Simulator-tab module
  // being loaded first.
  function copyTextFromTextarea(ta, btn, originalLabel) {
    if (!ta || !btn) return;
    const text = ta.value;
    const restore = () => setTimeout(() => { btn.textContent = originalLabel; }, 1600);
    const success = () => { btn.textContent = 'Copied'; restore(); };
    const failure = (err) => {
      console.warn('Clipboard copy failed:', err);
      ta.select();
      btn.textContent = 'Copy failed — selected';
      restore();
    };
    const native = (navigator.clipboard && navigator.clipboard.writeText)
      ? navigator.clipboard.writeText(text)
      : Promise.reject(new Error('navigator.clipboard unavailable'));
    native.then(success, () => fallbackCopy(text).then(success, failure));
  }

  function fallbackCopy(text) {
    return new Promise((resolve, reject) => {
      try {
        const tmp = document.createElement('textarea');
        tmp.value = text;
        tmp.setAttribute('readonly', '');
        tmp.style.position = 'fixed';
        tmp.style.top = '0';
        tmp.style.left = '-9999px';
        document.body.appendChild(tmp);
        tmp.select();
        tmp.setSelectionRange(0, text.length);
        const ok = document.execCommand('copy');
        document.body.removeChild(tmp);
        ok ? resolve() : reject(new Error('execCommand returned false'));
      } catch (e) { reject(e); }
    });
  }

  // ---- Store integration ----------------------------------------------

  function getStoreParams() {
    const store = global.DF.sim.getParamsStore();
    return store.getState().params || {};
  }
  function getStoreUpgrades() {
    const store = global.DF.sim.getParamsStore();
    return store.getState().upgrades || [];
  }

  // Click-handlers that change row structure (add/remove synergy, type select,
  // tier select, completionist toggle) must trigger a re-render explicitly,
  // since self-originated setState calls suppress the subscriber's auto-render
  // (so text inputs don't lose focus / drop in-flight keystrokes mid-edit).
  function rerenderTables() {
    renderUpgradesTable();
    renderSynergyTable();
  }

  // Self-originated patches set suppressStoreSync around the setState call so
  // our own subscriber (syncFromStore) doesn't re-render the panel mid-edit.
  // Without this, every keystroke triggers a full renderUpgradesTable() that
  // blows away the focused input — the user types '0' '.' but the period
  // arrives at a freshly-recreated input that doesn't have the partial '0.'
  // value yet, so it gets dropped. Browsers don't preserve trailing '.' in
  // <input type=number> reflections.
  function applyParamPatch(patch) {
    if (ui.suppressStoreSync) return;
    const store = global.DF.sim.getParamsStore();
    const cur = store.getState().params || {};
    const next = Object.assign({}, cur, patch);
    ui.suppressStoreSync = true;
    try {
      store.setState({ params: next });
    } finally {
      ui.suppressStoreSync = false;
    }
  }

  function applyUpgradePatch(idx, patch) {
    if (ui.suppressStoreSync) return;
    const store = global.DF.sim.getParamsStore();
    const cur = (store.getState().upgrades || []).slice();
    if (idx < 0 || idx >= cur.length) return;
    cur[idx] = Object.assign({}, cur[idx], patch);
    ui.suppressStoreSync = true;
    try {
      store.setState({ upgrades: cur });
    } finally {
      ui.suppressStoreSync = false;
    }
  }

  // Apply external store updates to the form values without re-firing change events.
  function syncFromStore() {
    // Self-originated edits already updated the focused input; running a full
    // re-render here would steal focus and drop in-flight keystrokes (notably
    // '.' in decimal entry).
    if (ui.suppressStoreSync) return;
    ui.suppressStoreSync = true;
    try {
      const params = getStoreParams();

      // Engine + strategy scalar fields.
      const allFields = ENGINE_FIELDS.concat(STRATEGY_FIELDS);
      for (const f of allFields) {
        const inp = $('params-fld-' + f.key);
        if (!inp) continue;
        const v = params[f.key];
        const next = (v != null && isFinite(v)) ? String(v) : '';
        if (inp.value !== next) inp.value = next;
      }
      // Scenario.
      const sc = $('params-scenario');
      if (sc && params.scenario && sc.value !== params.scenario) sc.value = params.scenario;

      // Per-tier engagement.
      const curve = params.perTierEngagement || {};
      for (const t of TIER_NUMBERS) {
        const inp = $('params-pertier-' + t);
        if (!inp) continue;
        const v = curve[t];
        const next = (v != null && isFinite(v)) ? String(v) : '';
        if (inp.value !== next) inp.value = next;
      }

      // Upgrades + synergies — easier to fully re-render. The expanded row state
      // is preserved via ui.expandedRow.
      renderUpgradesTable();
      renderSynergyTable();

      // Keep the export panel in sync if it's open, so the textareas reflect
      // the latest store state without forcing a re-toggle.
      if (ui.exportPanelOpen) refreshExportTextareas();
    } finally {
      ui.suppressStoreSync = false;
    }
  }

  // ---- Public init ----------------------------------------------------

  function init() {
    if (ui.initialized) return;
    buildPanel();
    ui.initialized = true;

    // Subscribe to the shared store. Edits from the Simulator-tab quick-strip,
    // reset-to-default, and any future settings-import will fire this.
    if (ui.storeUnsub) ui.storeUnsub();
    ui.storeUnsub = global.DF.sim.getParamsStore().subscribe(syncFromStore);
  }

  global.DF.ui.parameters = { init };
})(typeof window !== 'undefined' ? window : globalThis);
