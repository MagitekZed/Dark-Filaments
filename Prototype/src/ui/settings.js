// Dark Filaments — settings export/import + comparison store
// Phase 5 of the JS sim migration.
//
// Two roles, both UI-side (no math here):
//
// 1. Settings serialization. Exports a JSON snapshot of the shared params
//    store + upgrades + (optionally) the headline numbers from the most recent
//    sim run, and a chat-pasteable Markdown summary. Importing parses JSON,
//    falls back defensively to DEFAULT_PARAMS for missing keys, and replaces
//    the params store state in one shot.
//
// 2. Comparison store. A second, independent copy of the params store shape,
//    used by the Simulator tab's "Compare against…" panel. Lives alongside
//    UI state rather than in src/sim/store.js so the math layer stays
//    md5-identical for Phase 5.
//
// Loaded as a plain <script> from file://. IIFE attaches to window.DF.ui.settings.
// UMD shim at the bottom for Node test-harness use.

(function (global) {
  'use strict';
  global.DF = global.DF || {};
  global.DF.ui = global.DF.ui || {};

  const SETTINGS_VERSION = '0.1.0';

  // Deep clone for the params + upgrades snapshot. Sufficient for our value
  // shapes (numbers, strings, booleans, plain objects, arrays). Mirrors the
  // helper in src/sim/store.js so we don't introduce a cross-module dep
  // beyond DF.sim.data + DF.sim.createStore.
  function clone(value) {
    if (value === null || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(clone);
    const out = {};
    for (const k in value) {
      if (Object.prototype.hasOwnProperty.call(value, k)) out[k] = clone(value[k]);
    }
    return out;
  }

  // ---- Comparison store -----------------------------------------------

  // Independent params store for the Simulator tab's comparison panel. Seeded
  // from the live main store on first access (or from DEFAULT_PARAMS if the
  // main store has not been touched), so the comparison panel spawns matching
  // the user's current view. clearComparisonStore() drops the singleton so the
  // next access re-seeds — used when the panel is closed.
  let _comparisonStore = null;
  function getComparisonStore() {
    if (_comparisonStore) return _comparisonStore;
    const data = global.DF && global.DF.sim && global.DF.sim.data;
    const createStore = global.DF && global.DF.sim && global.DF.sim.createStore;
    if (!data || !createStore) {
      throw new Error("DF.sim.data + DF.sim.createStore must load before DF.ui.settings.getComparisonStore().");
    }
    let seedParams, seedUpgrades;
    const main = global.DF.sim.getParamsStore && global.DF.sim.getParamsStore();
    if (main) {
      const cur = main.getState();
      seedParams = clone(cur.params || data.DEFAULT_PARAMS);
      seedUpgrades = clone(cur.upgrades || data.UPGRADES);
    } else {
      seedParams = clone(data.DEFAULT_PARAMS);
      seedUpgrades = clone(data.UPGRADES);
    }
    _comparisonStore = createStore({
      params: seedParams,
      upgrades: seedUpgrades,
    });
    return _comparisonStore;
  }

  function clearComparisonStore() {
    _comparisonStore = null;
  }

  // ---- Stable JSON ----------------------------------------------------

  // Sort object keys recursively so JSON.stringify produces a deterministic
  // output. Arrays preserve order; primitives pass through unchanged.
  function sortKeys(value) {
    if (value === null || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(sortKeys);
    const out = {};
    const keys = Object.keys(value).sort();
    for (const k of keys) out[k] = sortKeys(value[k]);
    return out;
  }

  // Build a stable export snapshot from a params-store state and (optionally)
  // a headline pair from the most recent simulator run. Pure function — does
  // not touch the DOM, does not read the live store, and accepts an explicit
  // timestamp for round-trip identity tests.
  function buildSnapshot(state, opts) {
    opts = opts || {};
    const params = clone((state && state.params) || {});
    const upgrades = clone((state && state.upgrades) || []);

    // Scenario block summarizes the headline-relevant strip values. The
    // tier is held by the Simulator-tab UI state; the caller passes it in.
    const scenario = {
      tier: (opts.tier != null ? opts.tier : (params.tier != null ? params.tier : 1)),
      mode: (opts.mode != null ? opts.mode : (params.scenario || 'completion')),
    };

    const snapshot = {
      version: SETTINGS_VERSION,
      timestamp: opts.timestamp || new Date().toISOString(),
      scenario,
      params,
      upgrades,
    };
    if (opts.headline) {
      snapshot.headline = opts.headline;
    }
    return sortKeys(snapshot);
  }

  // Pretty-printed JSON — 2-space indent, sorted keys.
  function exportJson(state, opts) {
    return JSON.stringify(buildSnapshot(state, opts), null, 2);
  }

  // ---- Markdown export ------------------------------------------------

  function fmtMmSs(seconds) {
    if (seconds == null || !isFinite(seconds)) return '--:--';
    const total = Math.round(seconds);
    const m = Math.floor(total / 60);
    const s = total - m * 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function fmtNum(n, d) {
    if (n == null || !isFinite(n)) return '—';
    return Number(n).toFixed(d != null ? d : 2);
  }

  function fmtPct(n, d) {
    if (n == null || !isFinite(n)) return '—';
    const sign = n >= 0 ? '+' : '';
    return sign + (n * 100).toFixed(d != null ? d : 1) + '%';
  }

  function fmtDateShort(iso) {
    // YYYY-MM-DD slice of an ISO timestamp.
    if (!iso) return '';
    return String(iso).slice(0, 10);
  }

  // Markdown export — chat-pasteable, compact, technical. Mirrors the prototype's
  // existing tone (no exclamation points, no second person).
  function exportMarkdown(state, opts) {
    opts = opts || {};
    const snap = buildSnapshot(state, opts);
    const params = snap.params || {};
    const tier = snap.scenario.tier;
    const mode = snap.scenario.mode;
    const dateShort = fmtDateShort(snap.timestamp);

    const lines = [];
    lines.push('**T' + tier + ' settings · ' + dateShort + '**');
    lines.push('');
    lines.push('Scenario: Tier ' + tier + ' · ' + mode);
    const cpm = (params.cpm != null) ? params.cpm : '—';
    const eng = (params.engagement != null) ? fmtNum(params.engagement, 2) : '—';
    const svt = (params.saveVpcThreshold != null) ? fmtNum(params.saveVpcThreshold, 2) : '—';
    lines.push('cpm: ' + cpm + ' · engagement: ' + eng + ' · save_vpc: ' + svt);
    lines.push('');

    // Headline block — only if provided + has a real-playtest reference for
    // the cpm in question (so the output stays honest about what is sim-only
    // vs sim-vs-real).
    if (snap.headline) {
      const refs = global.DF && global.DF.sim && global.DF.sim.playtestRefs;
      const lookup = refs && refs.lookupReference ? refs.lookupReference : null;
      const ts = snap.headline.threshold;
      const cs = snap.headline.completion;
      if (ts && ts.totalTime_s != null) {
        let line = 'Threshold: ' + fmtMmSs(ts.totalTime_s);
        if (lookup) {
          const r = lookup(params.cpm, 'threshold');
          if (r) {
            const realT = r.time_s;
            const delta = (ts.totalTime_s - realT) / realT;
            const refTag = r.exact
              ? ' (real ' + fmtMmSs(realT) + ' @ ' + (Number(r.refCpm).toFixed(0)) + ' cpm, ' + fmtPct(delta) + ')'
              : ' (real ~' + fmtMmSs(realT) + ' interp, ' + fmtPct(delta) + ')';
            line += refTag;
          }
        }
        lines.push(line);
      }
      if (cs && cs.totalTime_s != null) {
        let line = 'Completion: ' + fmtMmSs(cs.totalTime_s);
        if (lookup) {
          const r = lookup(params.cpm, 'completion');
          if (r) {
            const realT = r.time_s;
            const delta = (cs.totalTime_s - realT) / realT;
            const refTag = r.exact
              ? ' (real ' + fmtMmSs(realT) + ' @ ' + (Number(r.refCpm).toFixed(0)) + ' cpm, ' + fmtPct(delta) + ')'
              : ' (real ~' + fmtMmSs(realT) + ' interp, ' + fmtPct(delta) + ')';
            line += refTag;
          }
        }
        lines.push(line);
      }
      lines.push('');
    }

    // Per-tier engagement curve — compact one-liner.
    const curve = params.perTierEngagement || {};
    const tierKeys = Object.keys(curve).map(n => parseInt(n, 10)).filter(n => isFinite(n)).sort((a, b) => a - b);
    if (tierKeys.length > 0) {
      const parts = tierKeys.map(t => 'T' + t + '=' + fmtNum(curve[t], 2));
      lines.push('Per-tier engagement: ' + parts.join(' '));
    }
    if (params.consolidationThreshold != null || params.consolidationGrowth != null) {
      const tt = (params.consolidationThreshold != null) ? fmtNum(params.consolidationThreshold, 2) : '—';
      const cg = (params.consolidationGrowth != null) ? fmtNum(params.consolidationGrowth, 2) : '—';
      lines.push('Consolidation: T1→T2 = ' + tt + ', growth = ' + cg);
    }

    return lines.join('\n');
  }

  // ---- Import ----------------------------------------------------------

  // Validate + decode an exported JSON string. Returns {ok, errors, value} where
  // value is the snapshot to apply (already merged against DEFAULT_PARAMS for
  // missing keys). Defensive: returns ok=true with warnings for unknown
  // version stamps; returns ok=false for unparseable JSON.
  function importJson(text) {
    const out = { ok: false, errors: [], warnings: [], value: null };
    if (text == null || String(text).trim() === '') {
      out.errors.push('empty input');
      return out;
    }
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      out.errors.push('invalid JSON: ' + (e && e.message ? e.message : String(e)));
      return out;
    }
    if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      out.errors.push('expected a JSON object at the top level');
      return out;
    }

    // Schema-version sanity check.
    if (parsed.version != null && parsed.version !== SETTINGS_VERSION) {
      out.warnings.push('unknown schema version "' + parsed.version + '" (expected "' + SETTINGS_VERSION + '"); attempting to import anyway');
    }

    const data = global.DF && global.DF.sim && global.DF.sim.data;
    const defaults = (data && data.DEFAULT_PARAMS) || {};
    const defaultUpgrades = (data && data.UPGRADES) || [];

    // Merge params: imported values overlay the defaults so missing keys
    // fall back rather than leaving the runner with an undefined.
    const importedParams = (parsed.params && typeof parsed.params === 'object') ? parsed.params : {};
    const mergedParams = Object.assign({}, clone(defaults), clone(importedParams));

    // Per-tier engagement merges per-tier so partial curves don't drop tiers.
    if (defaults.perTierEngagement) {
      mergedParams.perTierEngagement = Object.assign(
        {},
        clone(defaults.perTierEngagement),
        clone(importedParams.perTierEngagement || {})
      );
    }

    // Upgrades: if the import has a full array, use it; otherwise fall back to
    // the defaults. We do not attempt name-based merging — exports are
    // expected to round-trip the full array.
    let mergedUpgrades;
    if (Array.isArray(parsed.upgrades) && parsed.upgrades.length > 0) {
      mergedUpgrades = clone(parsed.upgrades);
    } else {
      mergedUpgrades = clone(defaultUpgrades);
      if (parsed.upgrades != null) {
        out.warnings.push('upgrades field present but empty or invalid; falling back to defaults');
      }
    }

    out.ok = true;
    out.value = {
      params: mergedParams,
      upgrades: mergedUpgrades,
      scenario: parsed.scenario || null,
      headline: parsed.headline || null,
      version: parsed.version || null,
      timestamp: parsed.timestamp || null,
    };
    return out;
  }

  // ---- Public API ----------------------------------------------------

  global.DF.ui.settings = {
    SETTINGS_VERSION,
    buildSnapshot,
    exportJson,
    exportMarkdown,
    importJson,
    sortKeys,
    getComparisonStore,
    clearComparisonStore,
  };
})(typeof window !== 'undefined' ? window : globalThis);

// UMD shim — for Node test harness use. Harmless in browser.
if (typeof module !== 'undefined' && module.exports) {
  const ns = (typeof window !== 'undefined' ? window : globalThis).DF.ui.settings;
  module.exports = ns;
}
