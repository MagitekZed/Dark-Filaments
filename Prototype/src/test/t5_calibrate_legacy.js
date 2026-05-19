// ⚠️ STALE — pre-M☉-retune + pre-2026-05-13-ladder-renumber harness.
//
// Renamed from `t4_calibrate.js` to `t5_calibrate_legacy.js` on 2026-05-13
// as part of the ladder renumber (T3 Dwarf Spheroidal insertion shifted the
// old T4 Galaxy up to T5). Internal `tier: N` references updated; consolidation
// assertions stale-pending T5 retune.
//
// EXPECTED OUTCOME: this harness FAILS until the T5 retune lands against the
// M☉-denominated scale + new consolidation budget 39.0625.
//
// Do NOT delete — the legacy assertions document the prior calibration,
// useful as a reference point during the T5 retune.
//
// New canonical calibration apparatus: src/test/harness.js + profiles_smoke.js.
//
// Dark Filaments — T5 (was T4) calibration probe (Node-only)
// Run via: node Prototype/src/test/t5_calibrate_legacy.js
//
// Drives runSimulation through T1 → T2 → T3 → T4 → T5 in both Threshold and
// Completion modes, prints headline times, computes the gap of the T5 Galaxy
// tier. Pre-renumber numbers (target band +55–65%) are not comparable to the
// new ladder.

'use strict';

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
    "Galactic Rotation", "Stellar Halo", "Galactic Coupling", "Galactic Fountain", "Satellite Galaxies",
    "Bar Structure", "Fermi Bubbles", "Sagittarius A*", "Hot Coronal Halo", "Dark Matter Halo",
  ];
  return order.map(n => n + '=' + (levels[n] || 0)).join(' ');
}

function runChain(handoffMode, t5Mode) {
  const params = { cpm: 100, engagement: 1.0, saveVpcThreshold: 1.5 };

  // T1 → T2 → T3 → T4 → T5 chain. Post-2026-05-13 renumber, T3 is now the
  // inserted Dwarf Spheroidal slate (placeholder values); the old T4 Galaxy
  // is now T5. The carry chain composes across all four prior tiers.
  const t1 = runner.runSimulation(params, { tier: 1, mode: handoffMode });
  const t2 = runner.runSimulation(params, { tier: 2, mode: handoffMode, carryFrom: t1.finalState });
  const t3 = runner.runSimulation(params, { tier: 3, mode: handoffMode, carryFrom: t2.finalState });
  const t4 = runner.runSimulation(params, { tier: 4, mode: handoffMode, carryFrom: t3.finalState });
  const t5 = runner.runSimulation(params, { tier: 5, mode: t5Mode, carryFrom: t4.finalState });

  // Alias t5 as `t4` and t4 as `t3` so the rest of the harness's pre-renumber
  // reporting code keeps working without further surgery. Stale-pending
  // retune; labels are advisory.
  return { t1, t2, t3: t4, t4: t5 };
}

function reportRun(label, chain) {
  const { t1, t2, t3, t4 } = chain;
  const total = t1.headline.totalTime_s + t2.headline.totalTime_s + t3.headline.totalTime_s + t4.headline.totalTime_s;
  console.log('  ' + label.padEnd(40) +
    ' T1=' + fmtTime(t1.headline.totalTime_s).padStart(5) +
    '  T2=' + fmtTime(t2.headline.totalTime_s).padStart(6) +
    '  T3=' + fmtTime(t3.headline.totalTime_s).padStart(6) +
    '  T4=' + fmtTime(t4.headline.totalTime_s).padStart(6) +
    '  total=' + fmtTime(total).padStart(7) +
    '  T4 coh=' + t4.headline.consolidation.toFixed(2) +
    '  T4 comp=' + (t4.headline.completionistDone ? 'Y' : 'N') +
    '  exit=' + (t4.headline.exitReason || '?'));
  return { t1, t2, t3, t4, total };
}

function diagnose(label, chain) {
  const t4 = chain.t4;
  console.log('');
  console.log('--- ' + label + ' diagnostic ---');
  console.log('  T3 exit mass: ' + chain.t3.finalState.mass.toFixed(0)
    + '   T4 starting mass: ' + (chain.t4.trace[0] ? chain.t4.trace[0].mass_in.toFixed(0) : '?'));
  console.log('  T4 final levels: ' + summarizeLevels(t4.headline.levels));
  console.log('  T4 final mass: ' + t4.headline.finalMass.toFixed(0));
  console.log('  T4 consolidation: ' + t4.headline.consolidation.toFixed(2));
  console.log('  T4 exit reason: ' + (t4.headline.exitReason || '?'));

  let buys = 0, saves = 0, transitions = 0;
  const buyOrder = [];
  for (const row of t4.trace) {
    if (row.action === 'buy') {
      buys++;
      if (buyOrder.length < 40) {
        buyOrder.push('t=' + row.tick + 's ' + row.upgrade + ' (cost=' + row.cost.toFixed(0) + ')');
      }
    }
    if (row.action === 'save') saves++;
    if (row.action === 'transition') transitions++;
  }
  console.log('  total T4 buys: ' + buys + '   save-ticks: ' + saves);
  console.log('  first ~40 buys:');
  for (const b of buyOrder) console.log('    ' + b);
}

function main() {
  console.log('Dark Filaments T5 (was T4) calibration probe — LEGACY');
  console.log('=====================================================');
  console.log('Stackable / one-shot data (T5 Galaxy, post-2026-05-13 renumber):');
  for (const u of data.UPGRADES.filter(x => x.tier === 5)) {
    const kind = u.maxLevels === 1 ? 'one-shot' : (u.completionist ? 'compl-stk' : 'stack    ');
    console.log('  ' + u.name.padEnd(22) + ' ' + kind +
      '  initCost=' + u.initCost.toString().padStart(11) +
      '  growth=' + u.costGrowth.toFixed(3) +
      '  maxLvl=' + u.maxLevels.toString().padStart(2) +
      '  consolidation=' + u.consolidation.toFixed(2) +
      '  addMps=' + u.addMps + '  addMpc=' + u.addMpc + '  addAps=' + u.addAps +
      '  baseMps=' + u.baseMps +
      '  allMps=' + u.allMps + '  allMpc=' + u.allMpc);
  }
  console.log('');

  // 4 permutations matter:
  //   (a) All-Threshold (T1+T2+T3+T4=thr)
  //   (b) All-Completion (T1+T2+T3+T4=comp)
  //   (c) Comp-handoff, T4-thr (T1+T2+T3=comp → T4=thr)
  //   (d) Thr-handoff, T4-comp (T1+T2+T3=thr → T4=comp)
  console.log('Multi-tier chain runs at 100 cpm, engagement 1.0:');
  console.log('');

  const A = reportRun('All-Threshold (T1+T2+T3+T4=thr)', runChain('threshold', 'threshold'));
  const B = reportRun('All-Completion (T1+T2+T3+T4=comp)', runChain('completion', 'completion'));
  const C = reportRun('Comp-handoff, T4-thr', runChain('completion', 'threshold'));
  const D = reportRun('Thr-handoff, T4-comp', runChain('threshold', 'completion'));

  console.log('');
  console.log('--- T4 Completion-vs-Threshold gap (T4-only) ---');
  const gap_compHandoff = (B.t4.headline.totalTime_s - C.t4.headline.totalTime_s) / C.t4.headline.totalTime_s * 100;
  console.log('  Completion-handoff: T4-comp ' + fmtTime(B.t4.headline.totalTime_s) +
    ' vs T4-thr ' + fmtTime(C.t4.headline.totalTime_s) +
    ' → ' + pct(gap_compHandoff));
  const gap_thrHandoff = (D.t4.headline.totalTime_s - A.t4.headline.totalTime_s) / A.t4.headline.totalTime_s * 100;
  console.log('  Threshold-handoff:  T4-comp ' + fmtTime(D.t4.headline.totalTime_s) +
    ' vs T4-thr ' + fmtTime(A.t4.headline.totalTime_s) +
    ' → ' + pct(gap_thrHandoff));
  console.log('  Target band: +55 to +65% (per per-tier inversion curve; T3 was +65–75%).');

  // T3 gap for ripple check (should remain in T3 band +65–75%).
  // The T3 portion of the chain is computed in modes matching the chain's handoff
  // mode (T1+T2+T3 all run in handoffMode). To measure T3-only Completion-vs-
  // Threshold gap, re-run the T3 chains in mixed modes — same shape as
  // t3_calibrate.js does at the top level. This guards against T4 changes
  // accidentally rippling into T3 carry math.
  console.log('');
  console.log('--- T3 ripple check (should still be in +65–75% band) ---');
  const params3 = { cpm: 100, engagement: 1.0, saveVpcThreshold: 1.5 };
  const t1_comp = runner.runSimulation(params3, { tier: 1, mode: 'completion' });
  const t1_thr  = runner.runSimulation(params3, { tier: 1, mode: 'threshold' });
  const t2_comp_compH = runner.runSimulation(params3, { tier: 2, mode: 'completion', carryFrom: t1_comp.finalState });
  const t2_thr_thrH   = runner.runSimulation(params3, { tier: 2, mode: 'threshold', carryFrom: t1_thr.finalState });
  const t3_compH_comp = runner.runSimulation(params3, { tier: 3, mode: 'completion', carryFrom: t2_comp_compH.finalState });
  const t3_compH_thr  = runner.runSimulation(params3, { tier: 3, mode: 'threshold', carryFrom: t2_comp_compH.finalState });
  const t3_thrH_comp  = runner.runSimulation(params3, { tier: 3, mode: 'completion', carryFrom: t2_thr_thrH.finalState });
  const t3_thrH_thr   = runner.runSimulation(params3, { tier: 3, mode: 'threshold', carryFrom: t2_thr_thrH.finalState });
  const t3_gap_compH = (t3_compH_comp.headline.totalTime_s - t3_compH_thr.headline.totalTime_s) / t3_compH_thr.headline.totalTime_s * 100;
  const t3_gap_thrH  = (t3_thrH_comp.headline.totalTime_s - t3_thrH_thr.headline.totalTime_s) / t3_thrH_thr.headline.totalTime_s * 100;
  console.log('  T3 Completion-handoff gap: ' + pct(t3_gap_compH));
  console.log('  T3 Threshold-handoff gap:  ' + pct(t3_gap_thrH));

  // Sanity: did T4 transition? did completionist purchases land?
  console.log('');
  console.log('--- T4 Threshold sanity ---');
  for (const [lbl, run] of [['Comp-handoff Thr', C], ['Thr-handoff Thr', A]]) {
    const lvl = run.t4.headline.levels;
    console.log('  ' + lbl + ': Bar=' + (lvl["Bar Structure"] ? 'Y' : 'N') +
      ' FB=' + (lvl["Fermi Bubbles"] ? 'Y' : 'N') +
      ' SgrA=' + (lvl["Sagittarius A*"] ? 'Y' : 'N') +
      ' HCH=' + (lvl["Hot Coronal Halo"] ? 'Y' : 'N') +
      ' DMH=' + (lvl["Dark Matter Halo"] ? 'Y' : 'N') +
      ' SAT=' + (lvl["Satellite Galaxies"] || 0) + '/5' +
      ' GR=' + (lvl["Galactic Rotation"] || 0) +
      ' SH=' + (lvl["Stellar Halo"] || 0) +
      ' GCo=' + (lvl["Galactic Coupling"] || 0) +
      ' GFo=' + (lvl["Galactic Fountain"] || 0));
  }
  console.log('');
  console.log('--- T4 Completion sanity ---');
  for (const [lbl, run] of [['Comp-handoff Comp', B], ['Thr-handoff Comp', D]]) {
    const lvl = run.t4.headline.levels;
    console.log('  ' + lbl + ': Bar=' + (lvl["Bar Structure"] ? 'Y' : 'N') +
      ' FB=' + (lvl["Fermi Bubbles"] ? 'Y' : 'N') +
      ' SgrA=' + (lvl["Sagittarius A*"] ? 'Y' : 'N') +
      ' HCH=' + (lvl["Hot Coronal Halo"] ? 'Y' : 'N') +
      ' DMH=' + (lvl["Dark Matter Halo"] ? 'Y' : 'N') +
      ' SAT=' + (lvl["Satellite Galaxies"] || 0) + '/5' +
      ' GR=' + (lvl["Galactic Rotation"] || 0) +
      ' SH=' + (lvl["Stellar Halo"] || 0) +
      ' GCo=' + (lvl["Galactic Coupling"] || 0) +
      ' GFo=' + (lvl["Galactic Fountain"] || 0));
  }

  if (process.argv.includes('--verbose')) {
    diagnose('All-Threshold', A);
    diagnose('All-Completion', B);
    diagnose('Comp-handoff Thr', C);
    diagnose('Thr-handoff Comp', D);
  }
}

if (require.main === module) main();
