// Dark Filaments — T2 Phase 6 calibration probe (Node-only)
// Run via: node Prototype/src/test/t2_calibration.js
//
// Reports T2 sim times under both T1 handoff scenarios at 100 cpm.
// Surfaces level distribution, synergy fire status, Open Cluster purchase status,
// and delta vs the locked v5-L targets (T2 Threshold ≈ 15:30, T2 Completion ≈ 27:00,
// each with a ±10% advisory band). v5-L sub-target spread by handoff path:
//   T1-thresh → T2-thresh ≈ 16:05    T1-thresh → T2-comp ≈ 29:44 (+84.9%)
//   T1-comp   → T2-thresh ≈ 14:02    T1-comp   → T2-comp ≈ 26:42 (+90.3%)
// This is an exploration script — it does not gate Node-test exit codes.

'use strict';

const data = require('../sim/data.js');
const core = require('../sim/core.js');
const strategy = require('../sim/strategy.js');
const runner = require('../sim/runner.js');

function fmtMmSs(seconds) {
  if (seconds == null || !isFinite(seconds)) return '--:--';
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total - m * 60;
  return m.toString().padStart(2, ' ') + ':' + s.toString().padStart(2, '0');
}

function fmtPct(p) {
  if (!isFinite(p)) return 'n/a';
  const sign = p >= 0 ? '+' : '';
  return sign + (p * 100).toFixed(1) + '%';
}

function levelsLine(levels, names) {
  const out = [];
  for (const n of names) {
    const v = levels[n] || 0;
    out.push(n + '=' + v);
  }
  return out.join(' ');
}

function buyCounts(trace) {
  const buys = {};
  for (const row of trace) {
    if (row.action === 'buy') {
      buys[row.upgrade] = (buys[row.upgrade] || 0) + 1;
    }
  }
  return buys;
}

function firstBuyTick(trace, upgradeName) {
  for (const row of trace) {
    if (row.action === 'buy' && row.upgrade === upgradeName) return row.tick;
  }
  return null;
}

function transitionTick(trace) {
  for (const row of trace) {
    if (row.action === 'transition') return row.tick;
  }
  return null;
}

function thresholdTick(trace) {
  for (const row of trace) {
    if (row.action === 'exit_threshold') return row.tick;
  }
  return null;
}

const T2_NAMES = [
  "Stellar Kinematics", "Local Bubble", "Microlensing", "Roche Lobe Overflow", "Brown Dwarf",
  "Binary Partner", "Peculiar Velocity", "Open Cluster", "Moving Group",
];
const T1_NAMES = [
  "Solar Wind", "Asteroid Belt", "Stellar Coupling",
  "Magnetosphere", "Orbital Resonance", "Heliopause", "First Photons",
];

// v5-L locked target band (±10% advisory; central targets pulled from the
// strategic-completion lens — Threshold 14-16min, Completion 25-30min).
const TARGET_THRESHOLD_S = 15 * 60 + 30;     // 15:30 central, ±10% band (~13:57-17:03)
const TARGET_COMPLETION_S = 27 * 60;         // 27:00 central, ±10% band (~24:18-29:42)
const TARGET_BAND = 0.10;

function runScenario(t1Mode, t2Mode) {
  const params = {
    cpm: 100,
    engagement: 1.0,
    saveVpcThreshold: 1.5,
  };
  const result = runner.runSimulation(params, {
    tier: 2,
    mode: t2Mode,
    handoffMode: t1Mode,
  });
  return result;
}

function describeRun(title, t1Mode, t2Mode, result, target_s) {
  console.log('');
  console.log('=== ' + title + ' ===');
  console.log('   T1 handoff mode: ' + t1Mode + '   T2 mode: ' + t2Mode);

  const h = result.headline;
  const trace = result.trace;
  console.log('   T2 total time: ' + fmtMmSs(h.totalTime_s) + '   exitReason: ' + h.exitReason);
  const delta = (h.totalTime_s - target_s) / target_s;
  const inBand = Math.abs(delta) <= TARGET_BAND;
  console.log('   v5-L target:   ' + fmtMmSs(target_s) + '   delta: ' + fmtPct(delta)
            + '   ' + (inBand ? '(in ±' + (TARGET_BAND * 100).toFixed(0) + '% band)' : '(outside band)'));
  console.log('   T2 levels:  ' + levelsLine(h.levels, T2_NAMES));
  console.log('   final mass: ' + h.finalMass.toFixed(1) + '   consolidation: ' + h.consolidation.toFixed(2)
            + '   completionistDone: ' + h.completionistDone);

  // First-buy ticks (for synergy diagnostics).
  const firstRLO = firstBuyTick(trace, 'Roche Lobe Overflow');
  const firstBD  = firstBuyTick(trace, 'Brown Dwarf');
  const firstOC  = firstBuyTick(trace, 'Open Cluster');
  const firstMG  = firstBuyTick(trace, 'Moving Group');
  const firstBP  = firstBuyTick(trace, 'Binary Partner');
  const firstPV  = firstBuyTick(trace, 'Peculiar Velocity');
  console.log('   first buys: BP@' + firstBP + 's PV@' + firstPV + 's OC@' + firstOC + 's MG@' + firstMG + 's');
  console.log('               RLO@' + firstRLO + 's BD@' + firstBD + 's');

  const buys = buyCounts(trace);
  let totalBuys = 0;
  for (const k in buys) totalBuys += buys[k];
  console.log('   total buys: ' + totalBuys);

  // Synergy verification at end-state.
  const finalLevels = h.levels;
  const rloLvl = finalLevels['Roche Lobe Overflow'] || 0;
  const bdLvl  = finalLevels['Brown Dwarf'] || 0;
  const bpLvl  = finalLevels['Binary Partner'] || 0;
  const synB_LB = Math.pow(1.05, rloLvl); // RLO → Local Bubble
  const synC_RLO = Math.pow(1.10, bdLvl); // BD → RLO
  const synA_ML = bpLvl > 0 ? 1.5 : 1.0;  // BP → Microlensing
  console.log('   synergies: BP→Microlensing ×' + synA_ML.toFixed(2)
            + '   RLO→LocalBubble ×' + synB_LB.toFixed(4)
            + '   BD→RLO ×' + synC_RLO.toFixed(4));

  // Open Cluster stranding check.
  if (firstOC == null) {
    console.log('   *** OPEN CLUSTER NEVER BOUGHT *** (T3 transition gate stranded)');
  }
  // Brown Dwarf max check.
  if (bdLvl < 5 && t2Mode === 'completion') {
    console.log('   *** Brown Dwarf not maxed: ' + bdLvl + '/5 ***');
  }
  // Moving Group purchase check.
  const mgOwned = (finalLevels['Moving Group'] || 0) > 0;
  if (t2Mode === 'completion' && !mgOwned) {
    console.log('   *** Moving Group not bought on completion path ***');
  }
  if (t2Mode === 'threshold' && mgOwned) {
    console.log('   note: Moving Group bought on threshold path (unexpected — threshold should exit before)');
  }

  // Save-mode ticks (sanity).
  let saveCount = 0;
  for (const row of trace) if (row.action === 'save') saveCount++;
  console.log('   save-mode ticks: ' + saveCount);

  return result;
}

function main() {
  console.log('Dark Filaments T2 Phase 6 calibration probe');
  console.log('===========================================');
  console.log('cpm=100 engagement=1.0 saveVpcThreshold=1.5');

  // Always-run T1 anchor to print exit values for context.
  const t1Threshold = runner.runSimulation({ cpm: 100, engagement: 1.0, saveVpcThreshold: 1.5 },
                                           { tier: 1, mode: 'threshold' });
  const t1Completion = runner.runSimulation({ cpm: 100, engagement: 1.0, saveVpcThreshold: 1.5 },
                                            { tier: 1, mode: 'completion' });

  console.log('');
  console.log('--- T1 anchor (100 cpm) ---');
  console.log('   T1 threshold exit:  time=' + fmtMmSs(t1Threshold.headline.totalTime_s)
            + '   mass=' + t1Threshold.finalState.mass.toFixed(1)
            + '   levels: ' + levelsLine(t1Threshold.headline.levels, T1_NAMES));
  console.log('   T1 completion exit: time=' + fmtMmSs(t1Completion.headline.totalTime_s)
            + '   mass=' + t1Completion.finalState.mass.toFixed(1)
            + '   levels: ' + levelsLine(t1Completion.headline.levels, T1_NAMES));

  describeRun('T1 Threshold-exit → T2 Completion', 'threshold', 'completion', runScenario('threshold', 'completion'), TARGET_COMPLETION_S);
  describeRun('T1 Threshold-exit → T2 Threshold', 'threshold', 'threshold', runScenario('threshold', 'threshold'), TARGET_THRESHOLD_S);
  describeRun('T1 Completion-exit → T2 Completion', 'completion', 'completion', runScenario('completion', 'completion'), TARGET_COMPLETION_S);
  describeRun('T1 Completion-exit → T2 Threshold', 'completion', 'threshold', runScenario('completion', 'threshold'), TARGET_THRESHOLD_S);

  console.log('');
  console.log('--- v5-L locked targets (±' + (TARGET_BAND * 100).toFixed(0) + '% advisory band) ---');
  console.log('   T2 Threshold central:  ' + fmtMmSs(TARGET_THRESHOLD_S) + '   range 14-16min');
  console.log('   T2 Completion central: ' + fmtMmSs(TARGET_COMPLETION_S) + '   range 25-30min');
  console.log('   v5-L gap (T1-thresh): +84.9%   gap (T1-comp): +90.3%');
  console.log('   For exact per-scenario projections, see Prototype/src/test/t2_v5_proposal.js');
}

if (require.main === module) main();
