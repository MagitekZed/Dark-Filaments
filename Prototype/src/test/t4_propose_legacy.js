// Dark Filaments — T4 (was T3) proposal probe — LEGACY
// Renamed from `t3_propose.js` to `t4_propose_legacy.js` on 2026-05-13
// (T3 Dwarf Spheroidal insertion shifted old T3 to T4). Internal `tier: 3`
// references not updated — this harness's proposals targeted the pre-renumber
// T3 slate by name; under the new ladder, the same upgrade names live at T4,
// but the proposal-override semantics (override by upgrade name) still work
// because the names didn't change. The harness's chain-run logic still calls
// `tier: 3` which now resolves to the new T3 Dwarf Spheroidal — proposals
// would not apply correctly without further surgery. Use t4_calibrate_legacy.js
// for stale-but-working T4 chain evaluation; this probe is preserved for
// historical reference only.
//
// Reads a proposed-overrides JSON from disk and re-runs T3 with the overrides
// applied (in-memory only). Reports curve-shape metric + Completion gap.
//
// Usage: node Prototype/src/test/t4_propose_legacy.js [proposal-name]
//
// Embedded proposals (PROPOSALS map below) — pick by name on the CLI.

'use strict';

const runner = require('../sim/runner.js');
const data = require('../sim/data.js');

function fmtTime(s) {
  const t = Math.round(s);
  const m = Math.floor(t / 60);
  const r = t - m * 60;
  return m + ':' + (r < 10 ? '0' : '') + r;
}

function pct(p) { const s = p >= 0 ? '+' : ''; return s + p.toFixed(1) + '%'; }

function fmtNum(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'k';
  return n.toFixed(2);
}

// Each proposal is a map from upgrade name → field overrides.
const PROPOSALS = {
  baseline: {},

  // ---- v1: cheap-DLD/HII, expensive-PM, MPC-up/APS-down for clickfeel ----
  v1: {
    "Dust Lane Density":  { initCost: 3500 },
    "HII Region":         { initCost: 6000, baseMps: 50 },
    "Proper Motion":      { initCost: 18000, addMpc: 110 },
    "Spiral Density Wave":{ addAps: 0.6 },
    "High-Velocity Cloud":{ addAps: 1.5, initCost: 4000000, costGrowth: 1.85 },
    "Globular Cluster":   { initCost: 80000000, allMps: 1.35 },
  },

  // ---- v2: more aggressive opening cuts; HVC even cheaper, less growth ----
  v2: {
    "Dust Lane Density":  { initCost: 2500 },
    "HII Region":         { initCost: 5000, baseMps: 48 },
    "Proper Motion":      { initCost: 22000, addMpc: 100 },
    "Spiral Density Wave":{ addAps: 0.5 },
    "High-Velocity Cloud":{ addAps: 1.2, initCost: 3000000, costGrowth: 1.75 },
    "Globular Cluster":   { initCost: 60000000, allMps: 1.32 },
  },

  // ---- v3: Bulge has tiny addMps (open question) ----
  v3: {
    "Dust Lane Density":  { initCost: 3500 },
    "HII Region":         { initCost: 6000, baseMps: 50 },
    "Proper Motion":      { initCost: 18000, addMpc: 110 },
    "Spiral Density Wave":{ addAps: 0.6 },
    "High-Velocity Cloud":{ addAps: 1.5, initCost: 4000000, costGrowth: 1.85 },
    "Globular Cluster":   { initCost: 80000000, allMps: 1.35 },
    "Galactic Bulge":     { addMps: 12.0 },
  },

  // ---- v4: only late-wall fixes, no opening changes ----
  v4: {
    "Spiral Density Wave":{ addAps: 0.6 },
    "High-Velocity Cloud":{ addAps: 1.5, initCost: 4000000, costGrowth: 1.85 },
    "Proper Motion":      { addMpc: 110 },
    "Globular Cluster":   { initCost: 80000000, allMps: 1.35 },
  },

  // ---- v5: try harder on opening — really cheap DLD/HII, more lvls early ----
  v5: {
    "Dust Lane Density":  { initCost: 2200, baseMps: 36 },
    "HII Region":         { initCost: 4000, baseMps: 55 },
    "Proper Motion":      { initCost: 24000, addMpc: 110 },
    "Spiral Density Wave":{ addAps: 0.6, initCost: 30000 },
    "High-Velocity Cloud":{ addAps: 1.5, initCost: 4000000, costGrowth: 1.85 },
    "Globular Cluster":   { initCost: 80000000, allMps: 1.35 },
  },

  // ---- v6: keep big late-wall MASS burden but distribute via gentler growth and bigger HVC range ----
  // Keep HVC initCost at 6M (between 4M and 10.5M); growth 1.95 (gentler than 2.10).
  // Total HVC sum: 6 × (1 + 1.95 + 3.80 + 7.41 + 14.45) = 6 × 28.61 = 171.7M (was 380M).
  // GC stays at 130M, allMps 1.38 — middle ground.
  // Opening: DLD/HII slightly cheaper than baseline (3500/6000), PM dearer.
  v6: {
    "Dust Lane Density":  { initCost: 3500 },
    "HII Region":         { initCost: 6000 },
    "Proper Motion":      { initCost: 18000, addMpc: 100 },
    "Spiral Density Wave":{ addAps: 0.5 },
    "High-Velocity Cloud":{ addAps: 1.2, initCost: 6000000, costGrowth: 1.95 },
    "Globular Cluster":   { initCost: 130000000, allMps: 1.38 },
  },

  // ---- v7: even more conservative on opening costs (keep gap), but more aggressive HVC distribution ----
  v7: {
    "Dust Lane Density":  { initCost: 4000 },
    "HII Region":         { initCost: 7000 },
    "Proper Motion":      { initCost: 18000, addMpc: 100 },
    "Spiral Density Wave":{ addAps: 0.5 },
    "High-Velocity Cloud":{ addAps: 1.2, initCost: 6000000, costGrowth: 1.95 },
    "Globular Cluster":   { initCost: 150000000, allMps: 1.42 },  // GC unchanged
  },

  // ---- v8: minimal targeted — only click balance + late-wall growth ----
  // No opening changes; just fix the two issues at the source.
  v8: {
    "Proper Motion":      { addMpc: 100 },  // 40 → 100, raises click value 2.5x
    "Spiral Density Wave":{ addAps: 0.5 },  // 2.0 → 0.5, cuts auto rate 4x
    "High-Velocity Cloud":{ addAps: 1.2, costGrowth: 1.95 },  // 4.0 → 1.2; growth 2.10 → 1.95 softer late wall
  },

  // ---- v9: target the GC dead-zone directly. GC is the single 6-minute save.
  // Smash GC cost to 60M so it lands ~3 minutes earlier; HVC growth gentler.
  // Click rebalance same as v6/v8.
  v9: {
    "Proper Motion":      { addMpc: 100 },
    "Spiral Density Wave":{ addAps: 0.5 },
    "High-Velocity Cloud":{ addAps: 1.2, initCost: 8000000, costGrowth: 1.95 },
    "Globular Cluster":   { initCost: 60000000, allMps: 1.32 },
  },

  // ---- v10: same shape as v9 but slightly more aggressive: opening costs reduced too.
  v10: {
    "Dust Lane Density":  { initCost: 4000 },
    "HII Region":         { initCost: 6500 },
    "Proper Motion":      { addMpc: 100, initCost: 18000 },
    "Spiral Density Wave":{ addAps: 0.5 },
    "High-Velocity Cloud":{ addAps: 1.2, initCost: 7000000, costGrowth: 1.95 },
    "Globular Cluster":   { initCost: 80000000, allMps: 1.35 },
  },

  // ---- v11: GC even cheaper, HVC even gentler, more late-game distribution.
  // Target: kill the GC dead-zone entirely while preserving total HVC sum mass burden.
  // Current HVC sum at growth 2.10/initCost 10.5M: 380M.
  // New HVC at growth 1.85 / initCost 8M: 8 × (1 + 1.85 + 3.42 + 6.33 + 11.71) = 8 × 24.31 = 194M.
  // Old GC: 150M. Old HVC+GC: 530M. New: 194 + 60 = 254M. Significantly less.
  // Compensate via Bulge consolidation remaining (Bulge already eats 7×1.55^n which is small).
  v11: {
    "Dust Lane Density":  { initCost: 4000 },
    "HII Region":         { initCost: 6500 },
    "Proper Motion":      { addMpc: 100, initCost: 18000 },
    "Spiral Density Wave":{ addAps: 0.5 },
    "High-Velocity Cloud":{ addAps: 1.2, initCost: 8000000, costGrowth: 1.85 },
    "Globular Cluster":   { initCost: 60000000, allMps: 1.32 },
  },

  // ---- v12: balance HVC+GC total: HVC at gentler growth but slightly higher,
  // GC at midrange. Aim: total HVC+GC = ~400M (vs baseline 530M), enough cost
  // to preserve gap +65-75%.
  v12: {
    "Dust Lane Density":  { initCost: 4000 },
    "HII Region":         { initCost: 6500 },
    "Proper Motion":      { addMpc: 100, initCost: 18000 },
    "Spiral Density Wave":{ addAps: 0.5 },
    "High-Velocity Cloud":{ addAps: 1.2, initCost: 10000000, costGrowth: 1.95 },
    "Globular Cluster":   { initCost: 100000000, allMps: 1.38 },
  },

  // ---- v13: aggressive opening (very cheap DLD), aggressive late distribution ----
  // Goal: opening MPS lift WITHIN 4 minutes (vs current 8). Lower DLD/HII initCost
  // so they outrank PM/SDW immediately. Late-wall distributed.
  v13: {
    "Dust Lane Density":  { initCost: 2800 },
    "HII Region":         { initCost: 5000 },
    "Proper Motion":      { addMpc: 100, initCost: 20000 },
    "Spiral Density Wave":{ addAps: 0.5, initCost: 28000 },
    "High-Velocity Cloud":{ addAps: 1.2, initCost: 8000000, costGrowth: 1.95 },
    "Globular Cluster":   { initCost: 80000000, allMps: 1.35 },
  },

  // ---- v14: preserve total mass burden, redistribute. ----
  // Baseline HVC+GC = 380M + 150M = 530M.
  // v14: HVC 8M growth 2.10 → 290M; GC 240M → total 530M. GC bigger, HVC less brutal first.
  v14: {
    "Proper Motion":      { addMpc: 100 },
    "Spiral Density Wave":{ addAps: 0.5 },
    "High-Velocity Cloud":{ addAps: 1.2, initCost: 8000000, costGrowth: 2.10 },
    "Globular Cluster":   { initCost: 240000000, allMps: 1.42 },
  },

  // ---- v15: redistribute toward MORE HVC weight, LESS GC weight (opposite of v14).
  // Reduce GC dead-zone — make GC cheaper to land, lengthen HVC contribution.
  // HVC 10.5M growth 2.10 = 380M (unchanged); GC 100M (was 150M).
  // Compensate elsewhere — only ONE other mass-significant gate exists: the
  // game knows Bulge L1..L7 sum = 200k(1+1.55+1.55^2+...+1.55^6) = 200k*15.4 = 3.08M (negligible)
  // and AN at 8M (negligible). So we just save ~50M in burden. Gap should drop maybe 5%.
  v15: {
    "Proper Motion":      { addMpc: 100 },
    "Spiral Density Wave":{ addAps: 0.5 },
    "High-Velocity Cloud":{ addAps: 1.2 },
    "Globular Cluster":   { initCost: 100000000, allMps: 1.42 },
  },

  // ---- v16: preserve total mass burden, lower GC, raise HVC, gentler HVC growth. ----
  // HVC 13M growth 1.95 → 13 × (1+1.95+3.80+7.41+14.45) = 13 × 28.61 = 372M.
  // GC at 150M (unchanged). Total = 522M ≈ 530M baseline.
  // Net effect: HVC1 lands later (13M vs 10.5M); HVC5 is similar (304M vs 204M); growth gentler.
  // Plus click rebalance.
  v16: {
    "Proper Motion":      { addMpc: 100 },
    "Spiral Density Wave":{ addAps: 0.5 },
    "High-Velocity Cloud":{ addAps: 1.2, initCost: 13000000, costGrowth: 1.95 },
    // GC unchanged
  },

  // ---- v17: redistribute mass burden away from GC, into more HVC purchases ----
  // Keep total burden ~530M. HVC slightly higher initCost but gentler growth.
  // Bring GC down (less of a single dead-zone).
  // HVC 12M growth 1.95 → 12 × 28.61 = 343M.
  // GC at 180M = 523M total. Slight upshift.
  // Click rebalance.
  v17: {
    "Proper Motion":      { addMpc: 100 },
    "Spiral Density Wave":{ addAps: 0.5 },
    "High-Velocity Cloud":{ addAps: 1.2, initCost: 12000000, costGrowth: 1.95 },
    "Globular Cluster":   { initCost: 180000000, allMps: 1.42 },
  },

  // ---- v18: opening-only fix, leave late-wall alone ----
  // Just fix the flat 8-minute opening. Cheaper DLD/HII, more expensive PM,
  // plus click rebalance. Keep HVC/GC intact for gap preservation.
  v18: {
    "Dust Lane Density":  { initCost: 3500 },
    "HII Region":         { initCost: 5500 },
    "Proper Motion":      { addMpc: 100, initCost: 22000 },
    "Spiral Density Wave":{ addAps: 0.5 },
    "High-Velocity Cloud":{ addAps: 1.2 },
  },

  // ---- v19: v18 + HVC growth softer (2.10→2.00) keeping initCost same. ----
  // HVC mass burden at 10.5M / 2.00 → 10.5 × (1 + 2 + 4 + 8 + 16) = 10.5 × 31 = 325.5M (was 380M).
  // GC unchanged at 150M. Total 475.5M (vs 530M). Slight gap reduction.
  v19: {
    "Dust Lane Density":  { initCost: 3500 },
    "HII Region":         { initCost: 5500 },
    "Proper Motion":      { addMpc: 100, initCost: 22000 },
    "Spiral Density Wave":{ addAps: 0.5 },
    "High-Velocity Cloud":{ addAps: 1.2, costGrowth: 2.00 },
  },

  // ---- v20: v18 + HVC growth softer (2.10→2.00) + GC slightly bumped to preserve burden. ----
  // HVC mass burden 325.5M; GC at 170M = 495.5M (vs 530M).
  v20: {
    "Dust Lane Density":  { initCost: 3500 },
    "HII Region":         { initCost: 5500 },
    "Proper Motion":      { addMpc: 100, initCost: 22000 },
    "Spiral Density Wave":{ addAps: 0.5 },
    "High-Velocity Cloud":{ addAps: 1.2, costGrowth: 2.00 },
    "Globular Cluster":   { initCost: 170000000 },
  },

  // ---- v21: v18 + softer HVC (1.95) + bigger HVC initCost (12M) so total HVC ≈ 343M.
  // GC unchanged 150M = 493M total (vs 530M). About 7% reduction in burden.
  v21: {
    "Dust Lane Density":  { initCost: 3500 },
    "HII Region":         { initCost: 5500 },
    "Proper Motion":      { addMpc: 100, initCost: 22000 },
    "Spiral Density Wave":{ addAps: 0.5 },
    "High-Velocity Cloud":{ addAps: 1.2, initCost: 12000000, costGrowth: 1.95 },
  },

  // ---- v22: v18 + HVC moderate softening (2.05 growth, 11M initCost). ----
  // HVC = 11 × (1 + 2.05 + 4.20 + 8.62 + 17.66) = 11 × 33.5 = 369M.
  // GC 150M = 519M (vs 530M). Tiny burden reduction.
  v22: {
    "Dust Lane Density":  { initCost: 3500 },
    "HII Region":         { initCost: 5500 },
    "Proper Motion":      { addMpc: 100, initCost: 22000 },
    "Spiral Density Wave":{ addAps: 0.5 },
    "High-Velocity Cloud":{ addAps: 1.2, initCost: 11000000, costGrowth: 2.05 },
  },

  // ---- v23: CLICK ONLY (no opening or late changes). Pure isolation. ----
  v23: {
    "Proper Motion":      { addMpc: 100 },
    "Spiral Density Wave":{ addAps: 0.5 },
    "High-Velocity Cloud":{ addAps: 1.2 },
  },

  // ---- v24: OPENING ONLY (DLD/HII/PM cost), no click rebalance, no late changes. ----
  v24: {
    "Dust Lane Density":  { initCost: 3500 },
    "HII Region":         { initCost: 5500 },
    "Proper Motion":      { initCost: 22000 },
  },

  // ---- v25: gentle click rebalance (less aggressive APS cut) ----
  // SDW 2.0 → 1.0 (half, not quarter), HVC 4.0 → 2.0 (half).
  // PM 40 → 80 (double, not 2.5x).
  v25: {
    "Proper Motion":      { addMpc: 80 },
    "Spiral Density Wave":{ addAps: 1.0 },
    "High-Velocity Cloud":{ addAps: 2.0 },
  },

  // ---- v26: gentle click + softer late wall, no opening changes ----
  v26: {
    "Proper Motion":      { addMpc: 80 },
    "Spiral Density Wave":{ addAps: 1.0 },
    "High-Velocity Cloud":{ addAps: 2.0, initCost: 11000000, costGrowth: 2.05 },
  },

  // ---- v27: explore — opening fix combined with v25 click rebalance ----
  v27: {
    "Dust Lane Density":  { initCost: 3500 },
    "HII Region":         { initCost: 5500 },
    "Proper Motion":      { addMpc: 80, initCost: 22000 },
    "Spiral Density Wave":{ addAps: 1.0 },
    "High-Velocity Cloud":{ addAps: 2.0 },
  },

  // ---- v28: v25 + softer HVC growth + slight GC bump (compensate burden) ----
  // HVC at 10.5M / 2.00 → 325M; GC 170M = 495M (vs 530M). Slight burden reduction.
  v28: {
    "Proper Motion":      { addMpc: 80 },
    "Spiral Density Wave":{ addAps: 1.0 },
    "High-Velocity Cloud":{ addAps: 2.0, costGrowth: 2.00 },
    "Globular Cluster":   { initCost: 170000000 },
  },

  // ---- v29: targeted DEAD-ZONE fix — keep GC dead-zone shorter via cheaper GC,
  // compensate with bigger HVC growth (more late wall in many steps, not one). ----
  // HVC at 10.5M / 2.20 → 10.5 × (1+2.2+4.84+10.65+23.43) = 10.5 × 42.12 = 442M.
  // GC at 100M = 542M. Plus click rebalance.
  v29: {
    "Proper Motion":      { addMpc: 80 },
    "Spiral Density Wave":{ addAps: 1.0 },
    "High-Velocity Cloud":{ addAps: 2.0, costGrowth: 2.20 },
    "Globular Cluster":   { initCost: 100000000 },
  },

  // ---- v30: v25 with click ratio between baseline and v23 (looking for sweet spot) ----
  v30: {
    "Proper Motion":      { addMpc: 90 },  // 40 → 90 (2.25x)
    "Spiral Density Wave":{ addAps: 0.8 }, // 2.0 → 0.8 (cut to 40%)
    "High-Velocity Cloud":{ addAps: 1.6 }, // 4.0 → 1.6 (cut to 40%)
  },

  // ---- v31: v25 + more expensive PM (push DLD/HII to outrank PM early) ----
  // Click rebalance same as v25: PM 80 addMpc (2x), SDW 1.0 (half), HVC 2.0 (half).
  // PM cost 15000 → 22000 to push DLD/HII first.
  v31: {
    "Proper Motion":      { addMpc: 80, initCost: 22000 },
    "Spiral Density Wave":{ addAps: 1.0 },
    "High-Velocity Cloud":{ addAps: 2.0 },
  },

  // ---- v32: v31 + SDW more expensive too (push auto down further) ----
  v32: {
    "Proper Motion":      { addMpc: 80, initCost: 22000 },
    "Spiral Density Wave":{ addAps: 1.0, initCost: 28000 },
    "High-Velocity Cloud":{ addAps: 2.0 },
  },

  // ---- v33: just PM initCost adjustment, no addMpc change, no APS change ----
  // Isolate: what does just making PM more expensive do?
  v33: {
    "Proper Motion":      { initCost: 22000 },
  },

  // ---- v34: just PM initCost + addMpc reasonable, with everything else baseline.
  // Goal: fix opening without changing click ratio
  v34: {
    "Proper Motion":      { initCost: 22000, addMpc: 80 },
    "Spiral Density Wave":{ addAps: 1.0 },
    "High-Velocity Cloud":{ addAps: 2.0 },
  },

  // ---- v35: v25 click rebalance + softer HVC growth + slight HVC initCost bump ----
  // Click: PM 80, SDW 1.0, HVC 2.0 (v25 baseline).
  // HVC initCost 12M, growth 1.95 → 12 × (1+1.95+3.80+7.41+14.45) = 12 × 28.61 = 343M (was 380M).
  // GC slight bump 165M to compensate burden = 508M (was 530M). Small reduction.
  v35: {
    "Proper Motion":      { addMpc: 80 },
    "Spiral Density Wave":{ addAps: 1.0 },
    "High-Velocity Cloud":{ addAps: 2.0, initCost: 12000000, costGrowth: 1.95 },
    "Globular Cluster":   { initCost: 165000000 },
  },

  // ---- v36: v25 + HVC growth 2.00, initCost 11M ----
  // HVC = 11 × (1+2+4+8+16) = 11 × 31 = 341M.
  // GC 170M = 511M.
  v36: {
    "Proper Motion":      { addMpc: 80 },
    "Spiral Density Wave":{ addAps: 1.0 },
    "High-Velocity Cloud":{ addAps: 2.0, initCost: 11000000, costGrowth: 2.00 },
    "Globular Cluster":   { initCost: 170000000 },
  },

  // ---- v37: v25 + HVC 10.5M / 2.00 (only growth softened), GC kept at 150M ----
  // HVC = 10.5 × 31 = 325M. GC 150M = 475M (vs 530M baseline). Burden reduced ~10%.
  v37: {
    "Proper Motion":      { addMpc: 80 },
    "Spiral Density Wave":{ addAps: 1.0 },
    "High-Velocity Cloud":{ addAps: 2.0, costGrowth: 2.00 },
  },

  // ---- v38: v25 with HVC 13M / 1.85 (gentler) ----
  // HVC = 13 × (1+1.85+3.42+6.33+11.71) = 13 × 24.31 = 316M.
  // Plus GC bump to 180M = 496M.
  v38: {
    "Proper Motion":      { addMpc: 80 },
    "Spiral Density Wave":{ addAps: 1.0 },
    "High-Velocity Cloud":{ addAps: 2.0, initCost: 13000000, costGrowth: 1.85 },
    "Globular Cluster":   { initCost: 180000000 },
  },

  // ---- v39: focus on tuning DOWN GC dead-zone, leave HVC mostly alone ----
  // v25 + GC 100M (was 150M). Tradeoff: gap will tighten.
  v39: {
    "Proper Motion":      { addMpc: 80 },
    "Spiral Density Wave":{ addAps: 1.0 },
    "High-Velocity Cloud":{ addAps: 2.0 },
    "Globular Cluster":   { initCost: 100000000 },
  },

  // ---- v40: v25 + HVC slightly softened (2.00 growth, 11M cost), no GC change ----
  // HVC = 11 × 31 = 341M, slight decrease from 380M.
  v40: {
    "Proper Motion":      { addMpc: 80 },
    "Spiral Density Wave":{ addAps: 1.0 },
    "High-Velocity Cloud":{ addAps: 2.0, initCost: 11000000, costGrowth: 2.00 },
  },

  // ---- v41: v25 + lower GC cost AND lower GC multiplier (both proportional). ----
  // Baseline GC: 150M cost, ×1.42 allMps.
  // v41: 100M cost, ×1.30 allMps. Bot saves shorter time, gets smaller boost.
  // Net effect on Completion timeline: shorter save + smaller boost ≈ similar exit time.
  v41: {
    "Proper Motion":      { addMpc: 80 },
    "Spiral Density Wave":{ addAps: 1.0 },
    "High-Velocity Cloud":{ addAps: 2.0 },
    "Globular Cluster":   { initCost: 100000000, allMps: 1.30 },
  },

  // ---- v42: v25 + smaller GC + softer HVC growth ----
  v42: {
    "Proper Motion":      { addMpc: 80 },
    "Spiral Density Wave":{ addAps: 1.0 },
    "High-Velocity Cloud":{ addAps: 2.0, initCost: 11000000, costGrowth: 2.00 },
    "Globular Cluster":   { initCost: 100000000, allMps: 1.30 },
  },

  // ---- v43: v25 + cheaper GC (100M) keeping ×1.42 ----
  // GC drops in cost without losing power. Threshold doesn't pay it.
  // Compensate by making HVC harder (more cost, less growth) so Comp pays more later.
  v43: {
    "Proper Motion":      { addMpc: 80 },
    "Spiral Density Wave":{ addAps: 1.0 },
    "High-Velocity Cloud":{ addAps: 2.0, initCost: 14000000, costGrowth: 2.05 },
    "Globular Cluster":   { initCost: 100000000 },
  },

  // ---- v44: v25 + cheaper GC at 80M, allMps 1.30. HVC bumped to 12M / 2.10. ----
  v44: {
    "Proper Motion":      { addMpc: 80 },
    "Spiral Density Wave":{ addAps: 1.0 },
    "High-Velocity Cloud":{ addAps: 2.0, initCost: 12000000 },
    "Globular Cluster":   { initCost: 80000000, allMps: 1.30 },
  },

  // ---- v45: v25 + bump DLD baseMps (40→50). Each DLD lvl = more MPS. ----
  // Goal: make the DLD purchase feel bigger. Compensate by raising DLD initCost slightly.
  v45: {
    "Dust Lane Density":  { baseMps: 50 },
    "Proper Motion":      { addMpc: 80 },
    "Spiral Density Wave":{ addAps: 1.0 },
    "High-Velocity Cloud":{ addAps: 2.0 },
  },

  // ---- v46: v25 + DLD synergy strengthened (×1.05 → ×1.07/lvl). ----
  // Each DLD level boosts HII Region more. Curve grows faster in middle.
  v46: {
    "Dust Lane Density":  { synergies: [{ target: "HII Region", multiplier: 1.07 }] },
    "Proper Motion":      { addMpc: 80 },
    "Spiral Density Wave":{ addAps: 1.0 },
    "High-Velocity Cloud":{ addAps: 2.0 },
  },

  // ---- v47: v25 + raise both DLD/HII addMps so each buy lifts MPS more visibly ----
  v47: {
    "Dust Lane Density":  { baseMps: 55, initCost: 6000 },
    "HII Region":         { baseMps: 75, initCost: 10000 },
    "Proper Motion":      { addMpc: 80 },
    "Spiral Density Wave":{ addAps: 1.0 },
    "High-Velocity Cloud":{ addAps: 2.0 },
  },

  // ---- v48: v25 + HVC growth tightened (2.10 → 2.05) so late wall is gentler.
  // Plus DLD synergy slightly stronger (1.05 → 1.06).
  v48: {
    "Dust Lane Density":  { synergies: [{ target: "HII Region", multiplier: 1.06 }] },
    "Proper Motion":      { addMpc: 80 },
    "Spiral Density Wave":{ addAps: 1.0 },
    "High-Velocity Cloud":{ addAps: 2.0, costGrowth: 2.05 },
  },

  // ---- v49: FINAL CANDIDATE — comprehensive package ----
  // Click rebalance: PM addMpc 40→80, SDW addAps 2.0→1.0, HVC addAps 4.0→2.0.
  //   → 2x click value, half autoclicker rate; ratio shrinks from 29:1 to ~7:1.
  // Late wall distribution: HVC initCost 10.5M→8M, costGrowth 2.10→1.95.
  //   → HVC1 lands sooner; HVC sum 8 × (1+1.95+3.80+7.41+14.45) = 8×28.61 = 229M (was 380M).
  // GC compensation: 150M→180M, allMps 1.42→1.45.
  //   → Slightly more painful gate to compensate gap; slightly bigger boost.
  //   → Total HVC+GC = 229+180 = 409M (was 530M). About 22% reduction.
  // Mid-tier engagement: DLD synergy ×1.05→×1.06/lvl.
  //   → Each DLD buy lifts HII visibly more; gives mid-game more mass-flow growth.
  v49: {
    "Dust Lane Density":  { synergies: [{ target: "HII Region", multiplier: 1.06 }] },
    "Proper Motion":      { addMpc: 80 },
    "Spiral Density Wave":{ addAps: 1.0 },
    "High-Velocity Cloud":{ addAps: 2.0, initCost: 8000000, costGrowth: 1.95 },
    "Globular Cluster":   { initCost: 180000000, allMps: 1.45 },
  },

  // ---- v50: like v49 but slightly more conservative on HVC initCost ----
  // HVC 9M / 1.95 → 9 × 28.61 = 257M.
  // GC 170M = 427M. Total reduction ~19%.
  v50: {
    "Dust Lane Density":  { synergies: [{ target: "HII Region", multiplier: 1.06 }] },
    "Proper Motion":      { addMpc: 80 },
    "Spiral Density Wave":{ addAps: 1.0 },
    "High-Velocity Cloud":{ addAps: 2.0, initCost: 9000000, costGrowth: 1.95 },
    "Globular Cluster":   { initCost: 170000000, allMps: 1.42 },
  },

  // ---- v51: like v49 but HVC bigger initCost / gentler growth ----
  // HVC 10M / 1.90 → 10 × (1+1.9+3.61+6.86+13.03) = 10 × 26.4 = 264M.
  // GC 175M = 439M. Total reduction ~17%.
  v51: {
    "Dust Lane Density":  { synergies: [{ target: "HII Region", multiplier: 1.06 }] },
    "Proper Motion":      { addMpc: 80 },
    "Spiral Density Wave":{ addAps: 1.0 },
    "High-Velocity Cloud":{ addAps: 2.0, initCost: 10000000, costGrowth: 1.90 },
    "Globular Cluster":   { initCost: 175000000, allMps: 1.42 },
  },

  // ---- v52: v48 + GC tuned (cheaper, less boost) to shrink GC dead-zone. ----
  // GC 150M / ×1.42 → 100M / ×1.35. Save shorter, boost smaller. Net gap should be similar.
  v52: {
    "Dust Lane Density":  { synergies: [{ target: "HII Region", multiplier: 1.06 }] },
    "Proper Motion":      { addMpc: 80 },
    "Spiral Density Wave":{ addAps: 1.0 },
    "High-Velocity Cloud":{ addAps: 2.0, costGrowth: 2.05 },
    "Globular Cluster":   { initCost: 100000000, allMps: 1.35 },
  },

  // ---- v53: v48 + softer GC (120M / 1.38) ----
  v53: {
    "Dust Lane Density":  { synergies: [{ target: "HII Region", multiplier: 1.06 }] },
    "Proper Motion":      { addMpc: 80 },
    "Spiral Density Wave":{ addAps: 1.0 },
    "High-Velocity Cloud":{ addAps: 2.0, costGrowth: 2.05 },
    "Globular Cluster":   { initCost: 120000000, allMps: 1.38 },
  },

  // ---- v48+bulge: v48 + small Galactic Bulge addMps for steady mass-flow contribution
  // (FLAGGED TO USER as a design question — pure consolidation-only intent vs visible contribution)
  v48bulge: {
    "Dust Lane Density":  { synergies: [{ target: "HII Region", multiplier: 1.06 }] },
    "Proper Motion":      { addMpc: 80 },
    "Spiral Density Wave":{ addAps: 1.0 },
    "High-Velocity Cloud":{ addAps: 2.0, costGrowth: 2.05 },
    "Galactic Bulge":     { addMps: 15.0 },  // 7 levels × 15 = 105 raw MPS over the climb
  },

  // ---- v54: user's literal suggestion — PM 80-120, SDW 0.3-0.5, HVC 1.0-1.5 ----
  // PM 100, SDW 0.4, HVC 1.2.
  v54: {
    "Dust Lane Density":  { synergies: [{ target: "HII Region", multiplier: 1.06 }] },
    "Proper Motion":      { addMpc: 100 },
    "Spiral Density Wave":{ addAps: 0.4 },
    "High-Velocity Cloud":{ addAps: 1.2, costGrowth: 2.05 },
  },

  // ---- v55: v48 baseline + slight push on click value (PM 90) ----
  v55: {
    "Dust Lane Density":  { synergies: [{ target: "HII Region", multiplier: 1.06 }] },
    "Proper Motion":      { addMpc: 90 },
    "Spiral Density Wave":{ addAps: 0.8 },
    "High-Velocity Cloud":{ addAps: 1.6, costGrowth: 2.05 },
  },
};

function applyOverrides(name) {
  const proposal = PROPOSALS[name];
  if (!proposal) {
    console.error('Unknown proposal: ' + name + '. Available: ' + Object.keys(PROPOSALS).join(', '));
    process.exit(1);
  }
  const overrides = JSON.parse(JSON.stringify(data.UPGRADES));
  for (const upgrade of overrides) {
    const o = proposal[upgrade.name];
    if (!o) continue;
    Object.assign(upgrade, o);
  }
  return overrides;
}

function runChain(overrides, handoffMode, t3Mode) {
  const params = { cpm: 100, engagement: 1.0, saveVpcThreshold: 1.5 };
  const t1 = runner.runSimulation(params, { tier: 1, mode: handoffMode, upgrades: overrides });
  const t2 = runner.runSimulation(params, { tier: 2, mode: handoffMode, carryFrom: t1.finalState, upgrades: overrides });
  const t3 = runner.runSimulation(params, { tier: 3, mode: t3Mode, carryFrom: t2.finalState, upgrades: overrides });
  return { t1, t2, t3 };
}

function curveShape(trace) {
  const total = trace.length - 1;
  if (total <= 0) return null;
  const mpsAtP = function (pct) {
    const idx = Math.min(trace.length - 1, Math.floor(total * pct / 100));
    return trace[idx].mps;
  };
  const m0 = mpsAtP(0) + 1;
  const m25 = mpsAtP(25);
  const m50 = mpsAtP(50);
  const m75 = mpsAtP(75);
  const m100 = mpsAtP(100);
  const ratio_75_100 = m100 / Math.max(m75, 1);
  const ratio_0_75 = m75 / Math.max(m0, 1);
  return { m0, m25, m50, m75, m100, ratio_75_100, ratio_0_75, lateWall: ratio_75_100 / ratio_0_75 };
}

// Sum the income share of click vs passive vs auto.
function incomeShare(state) {
  const total = state.massFromClicks + state.massFromPassive + state.massFromAuto;
  if (total <= 0) return { click: 0, passive: 0, auto: 0 };
  return {
    click: state.massFromClicks / total,
    passive: state.massFromPassive / total,
    auto: state.massFromAuto / total,
  };
}

function actionsByDecile(trace) {
  const buckets = [];
  for (let i = 0; i < 10; i++) buckets.push({ buys: 0, saves: 0, none: 0 });
  for (let i = 0; i < trace.length; i++) {
    const decile = Math.min(9, Math.floor(i / trace.length * 10));
    const r = trace[i];
    if (r.action === 'buy') buckets[decile].buys++;
    else if (r.action === 'save') buckets[decile].saves++;
    else if (r.action === 'none') buckets[decile].none++;
  }
  return buckets.map(b => b.buys);
}

function report(label, chain) {
  const t3 = chain.t3;
  const cs = curveShape(t3.trace);
  const sh = incomeShare(t3.finalState);
  const buys = actionsByDecile(t3.trace);
  console.log('');
  console.log(label);
  console.log('  T3 time: ' + fmtTime(t3.headline.totalTime_s) +
    '   exit=' + t3.headline.exitReason +
    '   coh=' + t3.headline.consolidation.toFixed(2) +
    '   comp=' + (t3.headline.completionistDone ? 'Y' : 'N'));
  console.log('  MPS curve: ' + fmtNum(cs.m0) + ' → ' + fmtNum(cs.m25) + ' → ' +
    fmtNum(cs.m50) + ' → ' + fmtNum(cs.m75) + ' → ' + fmtNum(cs.m100));
  console.log('  0→75: ' + cs.ratio_0_75.toFixed(1) + 'x   75→100: ' + cs.ratio_75_100.toFixed(1) +
    'x   late-wall: ' + cs.lateWall.toFixed(3));
  console.log('  Income share: click ' + (sh.click * 100).toFixed(1) + '%' +
    '   passive ' + (sh.passive * 100).toFixed(1) + '%' +
    '   auto ' + (sh.auto * 100).toFixed(1) + '%');
  console.log('  Buys per decile: [' + buys.join(', ') + ']');
  return { t3, cs, sh, buys };
}

function main() {
  const name = process.argv[2] || 'baseline';
  console.log('### Proposal: ' + name + ' ###');
  const overrides = applyOverrides(name);

  const compResult = report('T3 Completion-handoff Comp', runChain(overrides, 'completion', 'completion'));
  const thrResult = report('T3 Completion-handoff Thr', runChain(overrides, 'completion', 'threshold'));
  const thrHThr = report('T3 Threshold-handoff Thr', runChain(overrides, 'threshold', 'threshold'));
  const thrHComp = report('T3 Threshold-handoff Comp', runChain(overrides, 'threshold', 'completion'));

  console.log('');
  console.log('--- T3 Completion-vs-Threshold gap (inversion curve target: +65–75%) ---');
  const gap_compHandoff = (compResult.t3.headline.totalTime_s - thrResult.t3.headline.totalTime_s) / thrResult.t3.headline.totalTime_s * 100;
  const gap_thrHandoff = (thrHComp.t3.headline.totalTime_s - thrHThr.t3.headline.totalTime_s) / thrHThr.t3.headline.totalTime_s * 100;
  console.log('  Completion-handoff: ' + fmtTime(compResult.t3.headline.totalTime_s) + ' vs ' + fmtTime(thrResult.t3.headline.totalTime_s) + ' → ' + pct(gap_compHandoff));
  console.log('  Threshold-handoff:  ' + fmtTime(thrHComp.t3.headline.totalTime_s) + ' vs ' + fmtTime(thrHThr.t3.headline.totalTime_s) + ' → ' + pct(gap_thrHandoff));
}

if (require.main === module) main();
