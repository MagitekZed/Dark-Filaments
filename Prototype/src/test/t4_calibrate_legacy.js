// ⚠️ STALE — pre-M☉-retune + pre-2026-05-13-ladder-renumber harness.
//
// Renamed from `t3_calibrate.js` to `t4_calibrate_legacy.js` on 2026-05-13
// as part of the ladder renumber (T3 Dwarf Spheroidal insertion shifted the
// old T3 Galactic Arm up to T4). The internal `tier: 4` references have been
// updated to `tier: 4` to keep the harness pointed at the same slate it was
// originally calibrating; the file otherwise documents the pre-renumber
// calibration history of what is now T4 Galactic Arm.
//
// This harness asserts numerical values calibrated against the pre-M☉
// arbitrary-mass-unit scale + the pre-renumber consolidation budget 6.25
// (old T3). After:
//   1. The T1 long-burn retune landed 2026-05-12 (DEFAULT_PARAMS.baseMpc
//      1.0→0.00120; perTierEngagement steep curve; T1 mass rescaled).
//   2. The 2026-05-13 ladder renumber bumped consolidation ×2.5 for the slate.
// the numbers in this harness are no longer valid.
//
// EXPECTED OUTCOME: this harness FAILS until the T4 retune lands against the
// M☉-denominated scale + new consolidation budget 15.625.
//
// Do NOT delete — the legacy assertions still document the prior calibration,
// useful as a reference point during the T4 retune.
//
// New canonical calibration apparatus: src/test/harness.js + profiles_smoke.js.
//
// Dark Filaments — T4 (was T3) calibration probe (Node-only)
// Run via: node Prototype/src/test/t4_calibrate_legacy.js
//
// Drives runSimulation through T1 → T2 → T3 → T4 in both Threshold and Completion
// modes, prints headline times, and computes the Completion-vs-Threshold gap
// of the T4 Galactic Arm tier.
//
// Pre-renumber calibration (post 2026-05-10 playtest-informed retune): both
// gap scenarios landed in the +65–75% band at 100 cpm engagement 1.0:
//   Comp-handoff: Comp 40:16 / Thr 23:13 → +73.4%
//   Thr-handoff:  Comp 57:03 / Thr 32:35 → +75.1%
// These values are PRE-RENUMBER (the chain ran T1→T2→T3 only). Under the new
// 11-tier ladder the chain now includes the inserted T3 Dwarf Spheroidal
// (placeholder values) before reaching T4 — gap numbers no longer comparable.
// Companion tools: t4_curve_shape_legacy.js, t4_propose_legacy.js.

'use strict';

const path = require('path');
const data = require('../sim/data.js');
const core = require('../sim/core.js');
const strategy = require('../sim/strategy.js');
const runner = require('../sim/runner.js');

function fmtTime(s) {
  const t = Math.round(s);
  const m = Math.floor(t / 60);
  const r = t - m * 60;
  return m + ':' + (r < 10 ? '0' : '') + r;
}

function pct(p) { const sign = p >= 0 ? '+' : ''; return sign + p.toFixed(1) + '%'; }

function runT3(handoffMode, t3Mode, label) {
  const params = {
    cpm: 100,
    engagement: 1.0,
    saveVpcThreshold: 1.5,
  };
  const scenario = { tier: 4, mode: t3Mode, handoffMode };
  const result = runner.runSimulation(params, scenario);
  const h = result.headline;
  console.log(label.padEnd(38) +
    ' time=' + fmtTime(h.totalTime_s).padStart(6) +
    '  exit=' + (h.exitReason || '?').padEnd(18) +
    '  consolidation=' + h.consolidation.toFixed(2).padStart(5) +
    '  comp=' + (h.completionistDone ? 'Y' : 'N'));
  return result;
}

function summarizeLevels(levels) {
  const order = [
    "Solar Wind", "Asteroid Belt", "Stellar Coupling", "Magnetosphere",
    "Orbital Resonance", "Heliopause", "First Photons",
    "Stellar Kinematics", "Local Bubble", "Microlensing", "Roche Lobe Overflow", "Brown Dwarf",
    "Binary Partner", "Peculiar Velocity", "Open Cluster", "Moving Group", "Wolf-Rayet Star",
    "Population II", "Subhalo", "RR Lyrae", "Velocity Dispersion",
    "Orphan Stream", "Sculptor Dwarf", "Draco Dwarf", "Sagittarius Stream",
    "Dust Lane Density", "HII Region", "Proper Motion", "Spiral Density Wave", "High-Velocity Cloud",
    "Galactic Bulge", "Sagittarius B2", "Globular Cluster", "Active Nucleus",
  ];
  return order.map(n => n + '=' + (levels[n] || 0)).join(' ');
}

function runChain(handoffMode, t4Mode) {
  const params = { cpm: 100, engagement: 1.0, saveVpcThreshold: 1.5 };

  // T1 → T2 → T3 → T4 chain. Post-2026-05-13 renumber, T3 is now the inserted
  // Dwarf Spheroidal slate (placeholder values); the old T3 Galactic Arm is
  // now T4. The carry composition automatically threads new-T3 levels into
  // T4's seed.
  const t1 = runner.runSimulation(params, { tier: 1, mode: handoffMode });
  const t2 = runner.runSimulation(params, { tier: 2, mode: handoffMode, carryFrom: t1.finalState });
  const t3 = runner.runSimulation(params, { tier: 3, mode: handoffMode, carryFrom: t2.finalState });
  const t4 = runner.runSimulation(params, { tier: 4, mode: t4Mode, carryFrom: t3.finalState });

  // Alias t4 as `t3` in the returned object name so the rest of the harness's
  // reporting code (still referring to "T3" labels from the pre-renumber era)
  // keeps working without further surgery — this harness is stale-pending
  // retune anyway, the labels are advisory.
  return { t1, t2, t3: t4 };
}

function reportRun(label, chain) {
  const { t1, t2, t3 } = chain;
  const total = t1.headline.totalTime_s + t2.headline.totalTime_s + t3.headline.totalTime_s;
  console.log('  ' + label.padEnd(40) +
    ' T1=' + fmtTime(t1.headline.totalTime_s).padStart(5) +
    '  T2=' + fmtTime(t2.headline.totalTime_s).padStart(6) +
    '  T3=' + fmtTime(t3.headline.totalTime_s).padStart(6) +
    '  total=' + fmtTime(total).padStart(7) +
    '  T3 consolidation=' + t3.headline.consolidation.toFixed(2) +
    '  T3 comp=' + (t3.headline.completionistDone ? 'Y' : 'N') +
    '  exit=' + (t3.headline.exitReason || '?'));
  return { t1, t2, t3, total };
}

function diagnose(label, chain) {
  const t3 = chain.t3;
  console.log('');
  console.log('--- ' + label + ' diagnostic ---');
  console.log('  T2 exit mass: ' + chain.t2.finalState.mass.toFixed(0)
    + '   T3 starting mass: ' + chain.t3.trace[0].mass_in.toFixed(0));
  console.log('  T3 final levels: ' + summarizeLevels(t3.headline.levels));
  console.log('  T3 final mass: ' + t3.headline.finalMass.toFixed(0));
  console.log('  T3 consolidation: ' + t3.headline.consolidation.toFixed(2));
  console.log('  T3 exit reason: ' + (t3.headline.exitReason || '?'));

  // Trace summary
  let buys = 0, saves = 0, transitions = 0;
  const buyOrder = [];
  for (const row of t3.trace) {
    if (row.action === 'buy') {
      buys++;
      if (buyOrder.length < 30) {
        buyOrder.push('t=' + row.tick + 's ' + row.upgrade + ' (cost=' + row.cost.toFixed(0) + ')');
      }
    }
    if (row.action === 'save') saves++;
    if (row.action === 'transition') transitions++;
  }
  console.log('  total T3 buys: ' + buys + '   save-ticks: ' + saves);
  console.log('  first ~30 buys:');
  for (const b of buyOrder) console.log('    ' + b);
}

function main() {
  console.log('Dark Filaments T4 (was T3) calibration probe — LEGACY');
  console.log('=====================================================');
  console.log('Stackable / one-shot data (T4 Galactic Arm, post-2026-05-13 renumber):');
  for (const u of data.UPGRADES.filter(x => x.tier === 4)) {
    const kind = u.maxLevels === 1 ? 'one-shot' : (u.completionist ? 'compl-stk' : 'stack    ');
    console.log('  ' + u.name.padEnd(22) + ' ' + kind +
      '  initCost=' + u.initCost.toString().padStart(9) +
      '  growth=' + u.costGrowth.toFixed(3) +
      '  maxLvl=' + u.maxLevels.toString().padStart(2) +
      '  consolidation=' + u.consolidation.toFixed(2) +
      '  addMps=' + u.addMps + '  addMpc=' + u.addMpc + '  addAps=' + u.addAps +
      '  allMps=' + u.allMps);
  }
  console.log('');

  // Two scenarios that matter most:
  //   (a) T1+T2+T3 all Threshold  → minimum-time path
  //   (b) T1+T2+T3 all Completion → maximum-grind path
  // Plus mixed: T1+T2 Completion → T3 Threshold (Completion handoff, T3 path skip)
  // Plus mixed: T1+T2 Threshold  → T3 Completion (Threshold handoff, late completion attempt)
  console.log('Multi-tier chain runs at 100 cpm, engagement 1.0:');
  console.log('');

  const A = reportRun('All-Threshold (T1+T2+T3=thr)', runChain('threshold', 'threshold'));
  const B = reportRun('All-Completion (T1+T2+T3=comp)', runChain('completion', 'completion'));
  const C = reportRun('Comp-handoff, T3-thr', runChain('completion', 'threshold'));
  const D = reportRun('Thr-handoff, T3-comp', runChain('threshold', 'completion'));

  // Inversion-curve target: T3 Completion vs T3 Threshold gap +65–75%.
  // The natural pairing is fixed-handoff → measure T3-only completion vs threshold.
  // Use Completion-handoff for both (matches "completion-style player at T3").
  console.log('');
  console.log('--- T3 Completion-vs-Threshold gap (T3-only) ---');
  const gap_compHandoff = (B.t3.headline.totalTime_s - C.t3.headline.totalTime_s) / C.t3.headline.totalTime_s * 100;
  console.log('  Completion-handoff: T3-comp ' + fmtTime(B.t3.headline.totalTime_s) +
    ' vs T3-thr ' + fmtTime(C.t3.headline.totalTime_s) +
    ' → ' + pct(gap_compHandoff));
  const gap_thrHandoff = (D.t3.headline.totalTime_s - A.t3.headline.totalTime_s) / A.t3.headline.totalTime_s * 100;
  console.log('  Threshold-handoff:  T3-comp ' + fmtTime(D.t3.headline.totalTime_s) +
    ' vs T3-thr ' + fmtTime(A.t3.headline.totalTime_s) +
    ' → ' + pct(gap_thrHandoff));
  console.log('  Target band: +65 to +75%.');

  // Sanity: did T3 transition? did Bulge max? did completionist purchases land?
  console.log('');
  console.log('--- T3 Threshold sanity ---');
  for (const [lbl, run] of [['Comp-handoff Thr', C], ['Thr-handoff Thr', A]]) {
    const lvl = run.t3.headline.levels;
    console.log('  ' + lbl + ': Bulge=' + (lvl["Galactic Bulge"] || 0) + '/7' +
      ' SagB2=' + (lvl["Sagittarius B2"] ? 'Y' : 'N') +
      ' AN=' + (lvl["Active Nucleus"] ? 'Y' : 'N') +
      ' GC=' + (lvl["Globular Cluster"] ? 'Y' : 'N') +
      ' HVC=' + (lvl["High-Velocity Cloud"] || 0) + '/5' +
      ' DLD=' + (lvl["Dust Lane Density"] || 0) +
      ' HII=' + (lvl["HII Region"] || 0) +
      ' PM=' + (lvl["Proper Motion"] || 0) +
      ' SDW=' + (lvl["Spiral Density Wave"] || 0));
  }
  console.log('');
  console.log('--- T3 Completion sanity ---');
  for (const [lbl, run] of [['Comp-handoff Comp', B], ['Thr-handoff Comp', D]]) {
    const lvl = run.t3.headline.levels;
    console.log('  ' + lbl + ': Bulge=' + (lvl["Galactic Bulge"] || 0) + '/7' +
      ' SagB2=' + (lvl["Sagittarius B2"] ? 'Y' : 'N') +
      ' AN=' + (lvl["Active Nucleus"] ? 'Y' : 'N') +
      ' GC=' + (lvl["Globular Cluster"] ? 'Y' : 'N') +
      ' HVC=' + (lvl["High-Velocity Cloud"] || 0) + '/5' +
      ' DLD=' + (lvl["Dust Lane Density"] || 0) +
      ' HII=' + (lvl["HII Region"] || 0) +
      ' PM=' + (lvl["Proper Motion"] || 0) +
      ' SDW=' + (lvl["Spiral Density Wave"] || 0));
  }

  if (process.argv.includes('--verbose')) {
    diagnose('All-Threshold', A);
    diagnose('All-Completion', B);
    diagnose('Comp-handoff Thr', C);
    diagnose('Thr-handoff Comp', D);
  }
}

if (require.main === module) main();
