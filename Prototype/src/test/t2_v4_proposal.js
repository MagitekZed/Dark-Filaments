// Dark Filaments — T2 v4 calibration harness (Node-only, exploration script)
// Run: node Prototype/src/test/t2_v4_proposal.js
//
// Iterates candidate v4 T2 number sets through the JS sim and reports completion
// times across all four scenarios (Threshold/Completion x T1 Threshold/Completion
// handoff) at 60/100/150 cpm. T1 numbers are LOCKED — we only override T2 entries
// via scenario.upgrades. data.js is never mutated by this script.
//
// This is a proposal/exploration harness; it doesn't gate exit codes.

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

// T1 entries copied verbatim from data.js (locked; do not edit).
function buildT1Upgrades() {
  return data.UPGRADES.filter(u => (u.tier == null ? 1 : u.tier) === 1);
}

// Compose a full upgrades array given a T2 candidate set.
function composeUpgrades(t2Set) {
  return [...buildT1Upgrades(), ...t2Set];
}

const T2_NAMES = [
  "Stellar Kinematics", "Local Bubble", "Microlensing", "Roche Lobe Overflow", "Brown Dwarf",
  "Binary Partner", "Peculiar Velocity", "Open Cluster", "Moving Group",
];

function runOne(allUpgrades, cpm, t1Mode, t2Mode) {
  const params = { cpm, engagement: 1.0, saveVpcThreshold: 1.5 };
  return runner.runSimulation(params, {
    tier: 2,
    mode: t2Mode,
    handoffMode: t1Mode,
    upgrades: allUpgrades,
  });
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

function describeRow(label, t1Mode, t2Mode, cpm, allUpgrades) {
  const r = runOne(allUpgrades, cpm, t1Mode, t2Mode);
  const h = r.headline;
  const buys = buyCounts(r.trace);
  return {
    label, t1Mode, t2Mode, cpm,
    time_s: h.totalTime_s,
    time: fmtMmSs(h.totalTime_s),
    finalMass: h.finalMass,
    consolidation: h.consolidation,
    levels: h.levels,
    completionistDone: h.completionistDone,
    exitReason: h.exitReason,
    buys,
  };
}

function printScenarioBlock(title, allUpgrades) {
  console.log('');
  console.log('=========================================================');
  console.log(' ' + title);
  console.log('=========================================================');

  const cpms = [60, 100, 150];
  const handoffs = ['threshold', 'completion'];
  const modes = ['threshold', 'completion'];

  for (const cpm of cpms) {
    console.log('');
    console.log('  --- ' + cpm + ' cpm ---');
    for (const t1Mode of handoffs) {
      for (const t2Mode of modes) {
        const r = describeRow('s', t1Mode, t2Mode, cpm, allUpgrades);
        const tag = 'T1=' + t1Mode.padEnd(10) + ' T2=' + t2Mode.padEnd(10);
        const lvls = T2_NAMES.map(n => n.split(' ').map(w => w[0]).join('') + (r.levels[n] || 0)).join(' ');
        console.log('    ' + tag + ' ' + r.time
                    + '  exit=' + r.exitReason
                    + '  consolidation=' + r.consolidation.toFixed(2)
                    + '  done=' + (r.completionistDone ? 'Y' : 'N'));
        console.log('         levels: ' + lvls);
      }
    }
    // Gap calculation at this cpm
    const tT_T = describeRow('', 'threshold', 'threshold', cpm, allUpgrades).time_s;
    const tT_C = describeRow('', 'threshold', 'completion', cpm, allUpgrades).time_s;
    const tC_T = describeRow('', 'completion', 'threshold', cpm, allUpgrades).time_s;
    const tC_C = describeRow('', 'completion', 'completion', cpm, allUpgrades).time_s;
    console.log('    gaps:  T1-thresh:  Comp/Thresh = ' + fmtPct((tT_C - tT_T) / tT_T)
                + '   T1-comp:  Comp/Thresh = ' + fmtPct((tC_C - tC_T) / tC_T));
  }
}

// ============================================================================
// CANDIDATE NUMBER SETS
// ============================================================================

// V3 — current locked (baseline reproduce)
const T2_V3 = [
  { name: "Stellar Kinematics", tier: 2, initCost:   60, costGrowth: 1.15, maxLevels: 99, consolidation: 0.0,
    baseMps: 0,   addMps: 0.650, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [], completionist: false, desc: "" },
  { name: "Local Bubble",       tier: 2, initCost:  180, costGrowth: 1.15, maxLevels: 99, consolidation: 0.0,
    baseMps: 0,   addMps: 1.800, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [], completionist: false, desc: "" },
  { name: "Microlensing",       tier: 2, initCost:  200, costGrowth: 1.40, maxLevels: 99, consolidation: 0.0,
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 2.800, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [], completionist: false, desc: "" },
  { name: "Roche Lobe Overflow", tier: 2, initCost: 350, costGrowth: 1.50, maxLevels: 99, consolidation: 0.0,
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.100, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [{ target: "Local Bubble", multiplier: 1.05 }],
    completionist: false, desc: "" },
  { name: "Brown Dwarf",        tier: 2, initCost: 2000, costGrowth: 2.00, maxLevels: 5, consolidation: 0.0,
    baseMps: 0,   addMps: 4.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [{ target: "Roche Lobe Overflow", multiplier: 1.10 }],
    completionist: true, desc: "" },
  { name: "Binary Partner",     tier: 2, initCost: 1400, costGrowth: 1.00, maxLevels: 1, consolidation: 0.6,
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [{ target: "Microlensing", multiplier: 1.5 }],
    completionist: false, desc: "" },
  { name: "Peculiar Velocity",  tier: 2, initCost: 2200, costGrowth: 1.00, maxLevels: 1, consolidation: 0.9,
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.300, allMpc: 1.0,  allAps: 1.0,
    synergies: [], completionist: false, desc: "" },
  { name: "Open Cluster",       tier: 2, initCost: 3400, costGrowth: 1.00, maxLevels: 1, consolidation: 1.0,
    baseMps: 0,   addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0,   allAps: 1.0,
    synergies: [], completionist: false, desc: "" },
  { name: "Moving Group",       tier: 2, initCost: 14000, costGrowth: 1.00, maxLevels: 1, consolidation: 0.0,
    baseMps: 6.0, addMps: 0.000, selfMps: 1.0,
    baseMpc: 0,   addMpc: 0.000, selfMpc: 1.0,
    baseAps: 0,   addAps: 0.000, selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.200, allAps: 1.0,
    synergies: [], completionist: false, desc: "" },
];

// ============================================================================
// PROPOSAL ITERATIONS — labeled v4-A, v4-B, ... so we can compare
// ============================================================================

// v4-A: Direct 2.5x cost scale-up across the board, slight effect bump.
//   Goal: validate the "double everything" naive approach lands near v3 spec target.
//   Expect: ~17-20 min Threshold, gap stays at v3 ~67-76%.
function buildT2_v4A() {
  return [
    { ...T2_V3[0], initCost:  150 },                                    // Stellar Kinematics
    { ...T2_V3[1], initCost:  450 },                                    // Local Bubble
    { ...T2_V3[2], initCost:  500 },                                    // Microlensing
    { ...T2_V3[3], initCost:  900 },                                    // Roche Lobe Overflow
    { ...T2_V3[4], initCost: 5000, addMps: 6.000 },                     // Brown Dwarf (effect +50%)
    { ...T2_V3[5], initCost: 3500 },                                    // Binary Partner
    { ...T2_V3[6], initCost: 5500 },                                    // Peculiar Velocity
    { ...T2_V3[7], initCost: 8500 },                                    // Open Cluster
    { ...T2_V3[8], initCost: 35000, baseMps: 9.0 },                     // Moving Group (effect +50%)
  ];
}

// v4-B: Strategic-completion lens — completionist costs much steeper, effects
// noticeably stronger; non-completionist stackables/one-shots slightly cheaper
// to keep threshold path under the new target (~17-19 min).
function buildT2_v4B() {
  return [
    { ...T2_V3[0], initCost:  140, addMps: 0.700 },                                   // Stellar Kinematics
    { ...T2_V3[1], initCost:  420, addMps: 1.900 },                                   // Local Bubble
    { ...T2_V3[2], initCost:  500, addMpc: 3.000 },                                   // Microlensing
    { ...T2_V3[3], initCost:  850, addAps: 0.110 },                                   // Roche Lobe Overflow
    // Brown Dwarf — completionist; cost steeper (initCost much higher), max 6 instead of 5
    { ...T2_V3[4], initCost: 7000, costGrowth: 2.20, maxLevels: 6, addMps: 8.000 },   // Brown Dwarf
    { ...T2_V3[5], initCost: 3000 },                                                  // Binary Partner
    { ...T2_V3[6], initCost: 5000, allMps: 1.400 },                                   // Peculiar Velocity (×1.30 → ×1.40)
    { ...T2_V3[7], initCost: 8000 },                                                  // Open Cluster
    // Moving Group — completionist; cost much higher, effect much stronger
    { ...T2_V3[8], initCost: 50000, baseMps: 14.0, allMpc: 1.300 },                   // Moving Group
  ];
}

// v4-C: Aggressive strategic-completion lens — push the gap to ~+85-100%.
//   Brown Dwarf and Moving Group both significantly more expensive AND more powerful.
//   Threshold path bumped up moderately so it lands ~18 min absolute.
function buildT2_v4C() {
  return [
    { ...T2_V3[0], initCost:  130, addMps: 0.700 },
    { ...T2_V3[1], initCost:  400, addMps: 1.900 },
    { ...T2_V3[2], initCost:  475, addMpc: 3.000 },
    { ...T2_V3[3], initCost:  800, addAps: 0.110 },
    // Brown Dwarf — completionist; max 6, cost steeper, effect bigger
    { ...T2_V3[4], initCost: 9000, costGrowth: 2.30, maxLevels: 6, addMps: 10.000 },
    { ...T2_V3[5], initCost: 2800 },
    { ...T2_V3[6], initCost: 4500, allMps: 1.400 },
    { ...T2_V3[7], initCost: 7500 },
    // Moving Group — completionist; very high cost, very strong effect
    { ...T2_V3[8], initCost: 75000, baseMps: 18.0, allMpc: 1.350 },
  ];
}

// v4-D: Refined — keep Brown Dwarf max=5 (less wall), bring threshold-path
// stackables up so threshold isn't too fast, target +90-100% gap.
function buildT2_v4D() {
  return [
    { ...T2_V3[0], initCost:  170, addMps: 0.700 },                                   // Stellar Kinematics
    { ...T2_V3[1], initCost:  500, addMps: 2.000 },                                   // Local Bubble
    { ...T2_V3[2], initCost:  550, addMpc: 3.000 },                                   // Microlensing
    { ...T2_V3[3], initCost:  950, addAps: 0.110 },                                   // Roche Lobe Overflow
    // Brown Dwarf — completionist; max 5 (no change to schema), cost moderately higher,
    // effect substantially stronger (4.0 → 8.0 = 2x).
    { ...T2_V3[4], initCost: 4500, costGrowth: 2.20, maxLevels: 5, addMps: 8.000 },
    { ...T2_V3[5], initCost: 3500 },                                                  // Binary Partner
    { ...T2_V3[6], initCost: 5500, allMps: 1.350 },                                   // Peculiar Velocity (1.30 → 1.35)
    { ...T2_V3[7], initCost: 8500 },                                                  // Open Cluster
    // Moving Group — completionist; significantly higher cost, much stronger effect
    { ...T2_V3[8], initCost: 40000, baseMps: 14.0, allMpc: 1.300 },                   // Moving Group
  ];
}

// v4-E: From v4-D, fine-tune. Push gap a bit wider, threshold a bit longer.
function buildT2_v4E() {
  return [
    { ...T2_V3[0], initCost:  180, addMps: 0.700 },
    { ...T2_V3[1], initCost:  525, addMps: 2.000 },
    { ...T2_V3[2], initCost:  575, addMpc: 3.000 },
    { ...T2_V3[3], initCost: 1000, addAps: 0.110 },
    { ...T2_V3[4], initCost: 5500, costGrowth: 2.30, maxLevels: 5, addMps: 9.000 },
    { ...T2_V3[5], initCost: 3500 },
    { ...T2_V3[6], initCost: 5800, allMps: 1.350 },
    { ...T2_V3[7], initCost: 9000 },
    { ...T2_V3[8], initCost: 50000, baseMps: 16.0, allMpc: 1.300 },
  ];
}

// v4-F: From v4-E observations — calibrate to ~17 min Threshold and ~32 min Completion.
function buildT2_v4F() {
  return [
    { ...T2_V3[0], initCost:  175, addMps: 0.700 },
    { ...T2_V3[1], initCost:  500, addMps: 2.000 },
    { ...T2_V3[2], initCost:  560, addMpc: 3.000 },
    { ...T2_V3[3], initCost:  975, addAps: 0.110 },
    { ...T2_V3[4], initCost: 5000, costGrowth: 2.25, maxLevels: 5, addMps: 8.500 },
    { ...T2_V3[5], initCost: 3500 },
    { ...T2_V3[6], initCost: 5700, allMps: 1.350 },
    { ...T2_V3[7], initCost: 8800 },
    { ...T2_V3[8], initCost: 45000, baseMps: 15.0, allMpc: 1.300 },
  ];
}

// v4-G: Sweet spot — moderate BD cost growth (2.20), strong BD effect (9.0),
// stronger Moving Group (baseMps 16, allMpc 1.30, cost 48k), threshold-path
// stackables tuned to land ~18 min Threshold @100cpm.
function buildT2_v4G() {
  return [
    { ...T2_V3[0], initCost:  180, addMps: 0.700 },                                 // Stellar Kinematics
    { ...T2_V3[1], initCost:  525, addMps: 2.000 },                                 // Local Bubble
    { ...T2_V3[2], initCost:  575, addMpc: 3.000 },                                 // Microlensing
    { ...T2_V3[3], initCost: 1000, addAps: 0.110 },                                 // Roche Lobe Overflow
    // Brown Dwarf — completionist; cost growth 2.20 (same as v3); 5000 init, addMps 9.0 (v3 was 4.0).
    { ...T2_V3[4], initCost: 5000, costGrowth: 2.20, maxLevels: 5, addMps: 9.000 },
    { ...T2_V3[5], initCost: 3500 },                                                // Binary Partner
    { ...T2_V3[6], initCost: 5800, allMps: 1.350 },                                 // Peculiar Velocity
    { ...T2_V3[7], initCost: 9000 },                                                // Open Cluster
    // Moving Group — completionist; 48k cost, baseMps 16 (v3 was 6), allMpc 1.30 (v3 was 1.20).
    { ...T2_V3[8], initCost: 48000, baseMps: 16.0, allMpc: 1.300 },
  ];
}

// ============================================================================
// MAIN
// ============================================================================

function compactRun(label, allUpgrades) {
  // Single-line summary across all 4 scenarios at 100 cpm.
  console.log('');
  console.log('---- ' + label + ' (100 cpm) ----');
  const handoffs = ['threshold', 'completion'];
  const modes = ['threshold', 'completion'];
  const cells = [];
  for (const t1 of handoffs) {
    for (const m of modes) {
      const r = describeRow('', t1, m, 100, allUpgrades);
      const tag = 'T1=' + t1.charAt(0).toUpperCase() + ' T2=' + m.charAt(0).toUpperCase();
      cells.push({ tag, time_s: r.time_s, time: r.time, done: r.completionistDone, lvls: r.levels });
    }
  }
  for (const c of cells) console.log('   ' + c.tag + '  ' + c.time + '  done=' + (c.done ? 'Y' : 'N'));
  // gap at T1-completion-handoff
  const tCT = cells[2].time_s; // T1=C T2=T
  const tCC = cells[3].time_s; // T1=C T2=C
  const tTT = cells[0].time_s; // T1=T T2=T
  const tTC = cells[1].time_s; // T1=T T2=C
  console.log('   gap T1-thresh:  Comp/Thresh = ' + fmtPct((tTC - tTT) / tTT));
  console.log('   gap T1-comp:    Comp/Thresh = ' + fmtPct((tCC - tCT) / tCT));
}

function main() {
  const onlyTag = process.argv[2] || 'all';
  console.log('Dark Filaments T2 v4 calibration harness');
  console.log('=========================================');
  console.log('cpm=100 engagement=1.0 saveVpcThreshold=1.5');

  // Always reproduce v3 baseline so we have a stable anchor in the same output.
  if (onlyTag === 'all' || onlyTag === 'v3') compactRun('v3 (baseline)', composeUpgrades(T2_V3));
  if (onlyTag === 'all' || onlyTag === 'a')  compactRun('v4-A (uniform 2.5x scale)', composeUpgrades(buildT2_v4A()));
  if (onlyTag === 'all' || onlyTag === 'b')  compactRun('v4-B (strategic-completion lens)', composeUpgrades(buildT2_v4B()));
  if (onlyTag === 'all' || onlyTag === 'c')  compactRun('v4-C (aggressive strategic)', composeUpgrades(buildT2_v4C()));
  if (onlyTag === 'all' || onlyTag === 'd')  compactRun('v4-D (BD max=5, gap target +85-95)', composeUpgrades(buildT2_v4D()));
  if (onlyTag === 'all' || onlyTag === 'e')  compactRun('v4-E (push gap wider)', composeUpgrades(buildT2_v4E()));
  if (onlyTag === 'all' || onlyTag === 'f')  compactRun('v4-F (target 17/32)', composeUpgrades(buildT2_v4F()));
  if (onlyTag === 'all' || onlyTag === 'g')  compactRun('v4-G (sweet-spot proposal)', composeUpgrades(buildT2_v4G()));
  if (onlyTag === 'full-g') printScenarioBlock('FULL: v4-G', composeUpgrades(buildT2_v4G()));
  if (onlyTag === 'timeline-g') {
    const allUpgrades = composeUpgrades(buildT2_v4G());
    for (const t1Mode of ['threshold', 'completion']) {
      for (const t2Mode of ['threshold', 'completion']) {
        console.log('');
        console.log('===== TIMELINE-G :: T1-' + t1Mode + ' -> T2-' + t2Mode + ' @100cpm =====');
        const r = runOne(allUpgrades, 100, t1Mode, t2Mode);
        const seen = {}; const lastBuy = {};
        for (const row of r.trace) {
          if (row.action === 'buy') { if (!seen[row.upgrade]) seen[row.upgrade] = row.tick; lastBuy[row.upgrade] = row.tick; }
        }
        for (const n of T2_NAMES) {
          console.log('   ' + n.padEnd(22) + ' first=' + (seen[n]||'-').toString().padStart(6) + 's   last=' + (lastBuy[n]||'-').toString().padStart(6) + 's   final lvl=' + (r.headline.levels[n]||0));
        }
        console.log('   Total time: ' + fmtMmSs(r.headline.totalTime_s) + '  finalMass=' + r.headline.finalMass.toFixed(0));
      }
    }
  }

  if (onlyTag === 'timeline-e' || onlyTag === 'timeline-f') {
    const set = onlyTag === 'timeline-e' ? buildT2_v4E() : buildT2_v4F();
    const allUpgrades = composeUpgrades(set);
    console.log('');
    console.log('===== ' + onlyTag.toUpperCase() + ' :: T1-thresh -> T2-completion @100cpm timeline =====');
    const r = runOne(allUpgrades, 100, 'threshold', 'completion');
    // Print first buy of each upgrade and last buys of stackables
    const seen = {};
    const lastBuy = {};
    for (const row of r.trace) {
      if (row.action === 'buy') {
        if (!seen[row.upgrade]) { seen[row.upgrade] = row.tick; }
        lastBuy[row.upgrade] = row.tick;
      }
    }
    for (const n of T2_NAMES) {
      console.log('   ' + n.padEnd(22) + ' first=' + (seen[n]||'-').toString().padStart(6) + 's   last=' + (lastBuy[n]||'-').toString().padStart(6) + 's   final lvl=' + (r.headline.levels[n]||0));
    }
    console.log('   Total time: ' + fmtMmSs(r.headline.totalTime_s) + '  finalMass=' + r.headline.finalMass.toFixed(0));
    // Save-mode behavior
    let saveTicks = 0; const saveTargets = {};
    for (const row of r.trace) {
      if (row.action === 'save') { saveTicks++; saveTargets[row.target] = (saveTargets[row.target]||0)+1; }
    }
    console.log('   Save ticks: ' + saveTicks + '  targets: ' + JSON.stringify(saveTargets));
  }

  // For the chosen winner (set this after iterating), print full scenario block.
  if (onlyTag === 'full-d') printScenarioBlock('FULL: v4-D', composeUpgrades(buildT2_v4D()));
  if (onlyTag === 'full-e') printScenarioBlock('FULL: v4-E', composeUpgrades(buildT2_v4E()));
  if (onlyTag === 'full-f') printScenarioBlock('FULL: v4-F', composeUpgrades(buildT2_v4F()));
  if (onlyTag === 'full-c') printScenarioBlock('FULL: v4-C', composeUpgrades(buildT2_v4C()));
  if (onlyTag === 'full-b') printScenarioBlock('FULL: v4-B', composeUpgrades(buildT2_v4B()));
}

if (require.main === module) main();

// Export for ad-hoc use
module.exports = {
  T2_V3, buildT2_v4A, buildT2_v4B, buildT2_v4C, buildT2_v4D,
  composeUpgrades, runOne, describeRow, printScenarioBlock, compactRun,
};
