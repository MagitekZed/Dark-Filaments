// Dark Filaments — UI formatting helpers
// Display-side number/time/log formatters lifted verbatim from
// dark-filaments-t1.html as part of Phase 2 of the JS sim migration.
//
// Loaded as a plain <script> from file://. Pattern: IIFE attaches to window.DF.ui.format.
// UMD-style module.exports shim at the bottom for Node test harness use (Phase 3+).

(function (global) {
  'use strict';
  global.DF = global.DF || {};
  global.DF.ui = global.DF.ui || {};

  // Legacy fixed-precision formatter — kept for non-mass display (CPM,
  // percentages, MPS/MPC stat values) where the caller knows the right
  // precision. NOT for mass values; see fmtMass below.
  function fmt(n, d) { return n.toFixed(d); }

  // fmtMass — adaptive-precision mass renderer, M☉-aware.
  //
  // Mass spans 0 to ~5×10²² M☉ across the game. At T1 a single naked click
  // is worth ~0.00120 M☉; T1 exit peak is ~1.0 M☉; T2+ values explode.
  // Fixed-precision (e.g. fmt(n, 1)) renders early-T1 values as "0.0" or
  // "0.1" which is unreadable; this formatter picks precision per magnitude.
  //
  //   abs(n) < 1e-3     → "1.20e-3" (scientific; below readable decimal)
  //   abs(n) < 1        → "0.054"   (3 decimals; T1-scale clicks + saves)
  //   abs(n) < 100      → "1.23"    (2 decimals; late-T1 + early-T2)
  //   abs(n) < 1e5      → "12,345"  (integer + thousands separator)
  //   abs(n) >= 1e5     → "1.23e+5" (scientific; T3+ scale)
  function fmtMass(n) {
    if (n == null || !Number.isFinite(n)) return '—';
    const abs = Math.abs(n);
    if (abs === 0) return '0';
    if (abs < 1e-3) return n.toExponential(2);
    if (abs < 1) return n.toFixed(3);
    if (abs < 100) return n.toFixed(2);
    if (abs < 1e5) return Math.round(n).toLocaleString();
    return n.toExponential(2);
  }

  // fmtCost — adaptive-precision cost renderer. Same magnitude buckets as
  // fmtMass; was previously Math.ceil() which collapsed 0.012, 0.40, 0.96
  // all to "1". Now respects fractional M☉ costs honestly.
  function fmtCost(c) {
    if (c == null || !Number.isFinite(c)) return '—';
    const abs = Math.abs(c);
    if (abs === 0) return '0';
    if (abs < 1e-3) return c.toExponential(2);
    if (abs < 1) return c.toFixed(3);
    if (abs < 100) return c.toFixed(2);
    if (abs < 1e5) return Math.round(c).toLocaleString();
    return c.toExponential(2);
  }

  function fmtTime(ms) {
    const s = Math.floor(ms / 1000);
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return mm + ":" + (ss < 10 ? "0" : "") + ss;
  }

  // Renders a single log event into a single human-readable line.
  // Click events are typically filtered out by the caller.
  function fmtLogLine(e) {
    const t = (e.t_ms / 1000).toFixed(1);
    const stamp = "[" + t.padStart(7, " ") + "s]";
    const p = e.payload || {};
    switch (e.type) {
      case "purchase":
        return stamp + " BUY  " + p.upgrade.padEnd(18)
          + " -> Lv " + String(p.new_level).padStart(2)
          + "   cost " + fmtCost(p.cost_paid).padStart(8)
          + "   mass " + fmtMass(p.mass_after).padStart(10)
          + "   cons " + p.consolidation_after.toFixed(2);
      case "tick":
        return stamp + " TICK " + " ".repeat(24)
          + "  mass " + fmtMass(p.mass_after).padStart(10)
          + "   mps " + fmtMass(p.mps).padStart(8)
          + "   mpc " + fmtMass(p.mpc).padStart(8)
          + "   cpm " + String(Math.round(p.cpm_window)).padStart(3);
      case "end":
        return stamp + " END "
          + "  mass " + fmtMass(p.final_mass)
          + "   clicks " + p.total_clicks
          + "   time " + (p.total_time_ms / 1000).toFixed(1) + "s"
          + "   mag=" + (p.completionist_complete.magnetosphere ? "Y" : "N")
          + "   fp=" + (p.completionist_complete.firstPhotons ? "Y" : "N");
      default:
        return stamp + " " + e.type.toUpperCase();
    }
  }

  global.DF.ui.format = { fmt, fmtMass, fmtCost, fmtTime, fmtLogLine };
})(typeof window !== 'undefined' ? window : globalThis);

// UMD shim — for Node test harness use (Phase 3+). Harmless in browser.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = (typeof window !== 'undefined' ? window : globalThis).DF.ui.format;
}
