// Dark Filaments — T3 playtest diagnostic probe (Node-only)
// Run via: node Prototype/src/test/t3_playtest_diag.js
//
// Real playtest 2026-05-11: Comp-handoff, 60 cpm, 99:44 elapsed, T3 Threshold
// at 81:04, Completion NOT reached (Globular Cluster not bought). User
// hypothesis: dev-tool autoclicker was off, so in-game APS upgrades (SDW/HVC,
// also T2 RLO/BP carrying forward) did not contribute "autoclick" income.
//
// Additional issue found in playtest.js code review: tick() only adds MPS to
// mass — APS-derived income (aps * mpc per second) is NOT added in the live
// playtest. So in-game APS upgrades contribute zero mass income in the live
// game, while the simulator's runner.js DOES include autoInc = aps * mpc.
// That means the bot's predictions are systematically optimistic for any tier
// where APS is a real income source (T2 onward).
//
// This script runs four scenarios at 60 cpm Comp-handoff and prints headline
// times + level distributions for comparison against the playtest record.
//   A. APS ON  (simulator default — autoInc fires)
//   B. APS OFF (zero out the autoInc term — models live-playtest behavior)

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

function summarizeT3Levels(levels) {
  const order = [
    "Dust Lane Density", "HII Region", "Proper Motion", "Spiral Density Wave", "High-Velocity Cloud",
    "Galactic Bulge", "Sagittarius B2", "Globular Cluster", "Active Nucleus",
  ];
  return order.map(n => {
    const v = levels[n] || 0;
    const key = ({
      "Dust Lane Density": "DLD", "HII Region": "HII", "Proper Motion": "PM",
      "Spiral Density Wave": "SDW", "High-Velocity Cloud": "HVC",
      "Galactic Bulge": "Bulge", "Sagittarius B2": "SagB2",
      "Globular Cluster": "GC", "Active Nucleus": "AN"
    })[n];
    return key + '=' + v;
  }).join(' ');
}

function runChain(handoffMode, t3Mode, params) {
  const t1 = runner.runSimulation(params, { tier: 1, mode: handoffMode });
  const t2 = runner.runSimulation(params, { tier: 2, mode: handoffMode, carryFrom: t1.finalState });
  const t3 = runner.runSimulation(params, { tier: 3, mode: t3Mode, carryFrom: t2.finalState });
  return { t1, t2, t3 };
}

function reportT3(label, t3run) {
  const h = t3run.headline;
  console.log('  ' + label.padEnd(48) +
    ' T3=' + fmtTime(h.totalTime_s).padStart(7) +
    '  exit=' + (h.exitReason || '?').padEnd(18) +
    '  comp=' + (h.completionistDone ? 'Y' : 'N') +
    '  finalMass=' + h.finalMass.toExponential(2));
  console.log('    levels: ' + summarizeT3Levels(h.headline ? h.headline.levels : h.levels));
}

// ---- APS toggling ----
// Patch core.computeRates so the returned aps field can be zeroed.
// Safer than mutating UPGRADES because cross-tier APS providers (T2 RLO/BP)
// are also captured. We wrap the function in a way that respects a module-
// level flag.
let _apsEnabled = true;
const _origComputeRates = core.computeRates;
core.computeRates = function (state, upgrades, carry, params, allUpgrades) {
  const r = _origComputeRates(state, upgrades, carry, params, allUpgrades);
  if (!_apsEnabled) return { mpc: r.mpc, mps: r.mps, aps: 0 };
  return r;
};

function withAps(enabled, fn) {
  const prev = _apsEnabled;
  _apsEnabled = enabled;
  try { return fn(); } finally { _apsEnabled = prev; }
}

function main() {
  const cpm = 60;
  const params = { cpm, engagement: 1.0, saveVpcThreshold: 1.5 };

  console.log('Dark Filaments — T3 playtest diagnostic');
  console.log('========================================');
  console.log('Real playtest: 60 cpm Comp-handoff, 99:44 elapsed, T3 Threshold @ 81:04,');
  console.log('  Completion NOT reached. Final T3 levels:');
  console.log('  DLD=25 HII=21 PM=16 SDW=12 HVC=1 Bulge=7/7 SagB2=Y GC=N AN=Y');
  console.log('');
  console.log('Bot @ cpm=' + cpm + ' Comp-handoff (T1=Comp → T2=Comp → T3):');
  console.log('');

  // Scenario A: APS-ON (sim default — matches sim/runner.js as written)
  console.log('--- APS ON (sim default — autoInc = aps * mpc fires) ---');
  const A = withAps(true, () => runChain('completion', 'completion', params));
  const Athr = withAps(true, () => runChain('completion', 'threshold', params));
  reportT3('Comp-handoff T3-Threshold', Athr.t3);
  reportT3('Comp-handoff T3-Completion', A.t3);
  const gapA = (A.t3.headline.totalTime_s - Athr.t3.headline.totalTime_s) / Athr.t3.headline.totalTime_s * 100;
  console.log('  Gap Comp-vs-Thr: ' + pct(gapA));
  console.log('');

  // Scenario B: APS-OFF (models live-playtest behavior — in-game APS gives
  // no mass income because playtest.js tick() never adds aps*mpc)
  console.log('--- APS OFF (live-playtest behavior — APS contributes 0 income) ---');
  const B = withAps(false, () => runChain('completion', 'completion', params));
  const Bthr = withAps(false, () => runChain('completion', 'threshold', params));
  reportT3('Comp-handoff T3-Threshold', Bthr.t3);
  reportT3('Comp-handoff T3-Completion', B.t3);
  const gapB = (B.t3.headline.totalTime_s - Bthr.t3.headline.totalTime_s) / Bthr.t3.headline.totalTime_s * 100;
  console.log('  Gap Comp-vs-Thr: ' + pct(gapB));
  console.log('');

  // Side-by-side
  console.log('--- Side-by-side vs playtest ---');
  console.log('  Playtest T3 Threshold:        81:04');
  console.log('  APS-ON  bot T3 Threshold:    ' + fmtTime(Athr.t3.headline.totalTime_s).padStart(6));
  console.log('  APS-OFF bot T3 Threshold:    ' + fmtTime(Bthr.t3.headline.totalTime_s).padStart(6));
  console.log('');
  console.log('  Playtest T3 Completion:       (not reached, paused @ 99:44)');
  console.log('  APS-ON  bot T3 Completion:   ' + fmtTime(A.t3.headline.totalTime_s).padStart(6));
  console.log('  APS-OFF bot T3 Completion:   ' + fmtTime(B.t3.headline.totalTime_s).padStart(6));
  console.log('');

  // What did the bot have at the player's stopping time? Extract from trace.
  // For each scenario, find the trace row closest to ~99:44 = 5984 sec and
  // print levels there. (Trace rows are per-tick, 1 Hz.)
  function levelsAtTick(traceArr, targetSec) {
    let best = null;
    for (const row of traceArr) {
      if (row.tick != null && row.tick <= targetSec) best = row;
      else break;
    }
    return best;
  }
  console.log('--- Bot state at simulated t=5984s (= 99:44 wall) in Completion run ---');
  const targetT3SecA = 5984 - Athr.t1.headline.totalTime_s - Athr.t2.headline.totalTime_s;
  const targetT3SecB = 5984 - Bthr.t1.headline.totalTime_s - Bthr.t2.headline.totalTime_s;
  console.log('  APS-ON  comp-run: T1=' + fmtTime(A.t1.headline.totalTime_s) +
              ' T2=' + fmtTime(A.t2.headline.totalTime_s) +
              ' → T3 budget for 99:44 wall ≈ ' + Math.round(targetT3SecA) + 's');
  console.log('  APS-OFF comp-run: T1=' + fmtTime(B.t1.headline.totalTime_s) +
              ' T2=' + fmtTime(B.t2.headline.totalTime_s) +
              ' → T3 budget for 99:44 wall ≈ ' + Math.round(targetT3SecB) + 's');

  // Quick handoff diagnostics
  console.log('');
  console.log('--- T2 exit state (Comp-handoff) ---');
  console.log('  APS-ON:  T2 final mass=' + A.t2.finalState.mass.toExponential(2) +
              '   T1+T2 time=' + fmtTime(A.t1.headline.totalTime_s + A.t2.headline.totalTime_s));
  console.log('  APS-OFF: T2 final mass=' + B.t2.finalState.mass.toExponential(2) +
              '   T1+T2 time=' + fmtTime(B.t1.headline.totalTime_s + B.t2.headline.totalTime_s));
}

if (require.main === module) main();
