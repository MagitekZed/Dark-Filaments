// Dark Filaments — T2 v5 calibration harness (Node-only, exploration script)
// Run: node Prototype/src/test/t2_v5_proposal.js [tag]
//
// v5 goals:
//   1. Restore cross-stat synergy: Brown Dwarf → Roche Lobe Overflow ×1.10/level
//      (already in data.js but needs to survive any tuning we do).
//   2. Stellar Kinematics is exponential — keep baseMps=2, addMps=0, selfMps=1.1.
//      Levels: L1=2.0, L2=2.2, L3=2.42, L10=4.72, L20=12.23, L30=31.7.
//   3. Higher purchase cadence — target ~3-5 purchases/min average.
//      Levers: lower init costs, lower per-level effects, lower cost growth.
//   4. Time targets:
//      - T2 Threshold:  14-16 min (current 18:00 too long)
//      - T2 Completion: 25-30 min (current 28:54 OK; 33:01 from T1-thresh too long)
//      - Gap: +70-100% (was +90.5% / +90.7%; current v4-G ~+91%/+89%)
//
// All four scenarios at 100 cpm; T1 untouched.

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

const T2_NAMES = [
  "Stellar Kinematics", "Local Bubble", "Microlensing", "Roche Lobe Overflow", "Brown Dwarf",
  "Binary Partner", "Peculiar Velocity", "Open Cluster", "Moving Group",
];

function buildT1Upgrades() {
  return data.UPGRADES.filter(u => (u.tier == null ? 1 : u.tier) === 1);
}

function composeUpgrades(t2Set) {
  return [...buildT1Upgrades(), ...t2Set];
}

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
  let total = 0;
  for (const row of trace) {
    if (row.action === 'buy') {
      buys[row.upgrade] = (buys[row.upgrade] || 0) + 1;
      total++;
    }
  }
  return { buys, total };
}

function describeRow(label, t1Mode, t2Mode, cpm, allUpgrades) {
  const r = runOne(allUpgrades, cpm, t1Mode, t2Mode);
  const h = r.headline;
  const { buys, total } = buyCounts(r.trace);
  return {
    label, t1Mode, t2Mode, cpm,
    time_s: h.totalTime_s,
    time: fmtMmSs(h.totalTime_s),
    finalMass: h.finalMass,
    consolidation: h.consolidation,
    levels: h.levels,
    completionistDone: h.completionistDone,
    exitReason: h.exitReason,
    buys, totalBuys: total,
    cadence: total / Math.max(1, h.totalTime_s / 60),
  };
}

// ----------------------------------------------------------------------------
// CANDIDATE TABLES
// ----------------------------------------------------------------------------

// Helpers to make the candidate definitions readable (one row per upgrade).
function mk(name, init, growth, max, coh, fields, syn = []) {
  return {
    name, tier: 2, initCost: init, costGrowth: growth, maxLevels: max, consolidation: coh,
    baseMps: 0,   addMps: 0,   selfMps: 1.0,
    baseMpc: 0,   addMpc: 0,   selfMpc: 1.0,
    baseAps: 0,   addAps: 0,   selfAps: 1.0,
    allMps: 1.0,  allMpc: 1.0, allAps: 1.0,
    synergies: syn, completionist: false, desc: "",
    ...fields,
  };
}

// V4-G — current locked in data.js. Reproduced for baseline diff.
const T2_V4G = [
  mk("Stellar Kinematics",  180, 1.15, 99, 0.0, { addMps: 0.700 }),
  mk("Local Bubble",        525, 1.15, 99, 0.0, { addMps: 2.000 }),
  mk("Microlensing",        575, 1.40, 99, 0.0, { addMpc: 3.000 }),
  mk("Roche Lobe Overflow",1000, 1.50, 99, 0.0, { addAps: 0.110 }, [{ target: "Local Bubble", multiplier: 1.05 }]),
  mk("Brown Dwarf",        5000, 2.20,  5, 0.0, { addMps: 9.000, completionist: true }, [{ target: "Roche Lobe Overflow", multiplier: 1.10 }]),
  mk("Binary Partner",     3500, 1.00,  1, 0.6, {}, [{ target: "Microlensing", multiplier: 1.5 }]),
  mk("Peculiar Velocity",  5800, 1.00,  1, 0.9, { allMps: 1.350 }),
  mk("Open Cluster",       9000, 1.00,  1, 1.0, {}),
  mk("Moving Group",      48000, 1.00,  1, 0.0, { baseMps: 16.0, allMpc: 1.300, completionist: true }),
];
// Patch BD completionist flag on the entry above.
T2_V4G[4].completionist = true;
T2_V4G[8].completionist = true;

// ============================================================================
// V5 candidates
// ============================================================================

// v5-A: Exponential SK only — minimal change from v4-G.
//   SK becomes baseMps=2, addMps=0, selfMps=1.1 (the user's locked shape).
//   All other v4-G numbers preserved. Establishes baseline for what changing SK
//   alone does (since SK exponential at L20 = 12.23 is much stronger than
//   linear L20 = 14.0 but L1 = 2.0 vs 0.7 means it's worth more out of the gate).
function buildT2_v5A() {
  return [
    mk("Stellar Kinematics",  180, 1.15, 99, 0.0, { baseMps: 2.0, selfMps: 1.1 }),
    ...T2_V4G.slice(1),
  ];
}

// v5-B: Exponential SK + cheaper inits across the board.
//   Targets ~3-4 buys/min on threshold by getting more level grind in early.
//   Lower per-level adds to compensate for higher cumulative buys.
function buildT2_v5B() {
  return [
    mk("Stellar Kinematics",  100, 1.13, 99, 0.0, { baseMps: 2.0, selfMps: 1.1 }),
    mk("Local Bubble",        300, 1.13, 99, 0.0, { addMps: 1.4 }),
    mk("Microlensing",        350, 1.35, 99, 0.0, { addMpc: 2.2 }),
    mk("Roche Lobe Overflow", 600, 1.42, 99, 0.0, { addAps: 0.085 }, [{ target: "Local Bubble", multiplier: 1.05 }]),
    mk("Brown Dwarf",        4000, 2.20,  5, 0.0, { addMps: 7.5, completionist: true }, [{ target: "Roche Lobe Overflow", multiplier: 1.10 }]),
    mk("Binary Partner",     2400, 1.00,  1, 0.6, {}, [{ target: "Microlensing", multiplier: 1.5 }]),
    mk("Peculiar Velocity",  4200, 1.00,  1, 0.9, { allMps: 1.350 }),
    mk("Open Cluster",       6500, 1.00,  1, 1.0, {}),
    mk("Moving Group",      36000, 1.00,  1, 0.0, { baseMps: 14.0, allMpc: 1.300, completionist: true }),
  ];
}

// v5-C: More aggressive on cost growth — 1.12 on the cheap stackables.
//   More buys per minute, less per-level value, slightly lower one-shot prices.
function buildT2_v5C() {
  return [
    mk("Stellar Kinematics",   90, 1.12, 99, 0.0, { baseMps: 2.0, selfMps: 1.1 }),
    mk("Local Bubble",        260, 1.12, 99, 0.0, { addMps: 1.2 }),
    mk("Microlensing",        320, 1.32, 99, 0.0, { addMpc: 2.0 }),
    mk("Roche Lobe Overflow", 550, 1.40, 99, 0.0, { addAps: 0.080 }, [{ target: "Local Bubble", multiplier: 1.05 }]),
    mk("Brown Dwarf",        3500, 2.15,  5, 0.0, { addMps: 7.0, completionist: true }, [{ target: "Roche Lobe Overflow", multiplier: 1.10 }]),
    mk("Binary Partner",     2200, 1.00,  1, 0.6, {}, [{ target: "Microlensing", multiplier: 1.5 }]),
    mk("Peculiar Velocity",  3800, 1.00,  1, 0.9, { allMps: 1.350 }),
    mk("Open Cluster",       6000, 1.00,  1, 1.0, {}),
    mk("Moving Group",      32000, 1.00,  1, 0.0, { baseMps: 13.0, allMpc: 1.300, completionist: true }),
  ];
}

// v5-D: Refine — dial threshold path UP (was probably under-target on v5-B/C),
//   keep cadence high. Slightly higher per-level effects than v5-C.
function buildT2_v5D() {
  return [
    mk("Stellar Kinematics",  100, 1.13, 99, 0.0, { baseMps: 2.0, selfMps: 1.1 }),
    mk("Local Bubble",        320, 1.13, 99, 0.0, { addMps: 1.3 }),
    mk("Microlensing",        360, 1.34, 99, 0.0, { addMpc: 2.1 }),
    mk("Roche Lobe Overflow", 650, 1.42, 99, 0.0, { addAps: 0.085 }, [{ target: "Local Bubble", multiplier: 1.05 }]),
    mk("Brown Dwarf",        4200, 2.20,  5, 0.0, { addMps: 7.5, completionist: true }, [{ target: "Roche Lobe Overflow", multiplier: 1.10 }]),
    mk("Binary Partner",     2400, 1.00,  1, 0.6, {}, [{ target: "Microlensing", multiplier: 1.5 }]),
    mk("Peculiar Velocity",  4400, 1.00,  1, 0.9, { allMps: 1.350 }),
    mk("Open Cluster",       7000, 1.00,  1, 1.0, {}),
    mk("Moving Group",      38000, 1.00,  1, 0.0, { baseMps: 14.0, allMpc: 1.300, completionist: true }),
  ];
}

// v5-E: Keep v5-D shape but tune to ~15-16 min Threshold and ~28 min Completion.
function buildT2_v5E() {
  return [
    mk("Stellar Kinematics",  110, 1.13, 99, 0.0, { baseMps: 2.0, selfMps: 1.1 }),
    mk("Local Bubble",        340, 1.13, 99, 0.0, { addMps: 1.3 }),
    mk("Microlensing",        380, 1.34, 99, 0.0, { addMpc: 2.1 }),
    mk("Roche Lobe Overflow", 700, 1.42, 99, 0.0, { addAps: 0.085 }, [{ target: "Local Bubble", multiplier: 1.05 }]),
    mk("Brown Dwarf",        4500, 2.20,  5, 0.0, { addMps: 7.5, completionist: true }, [{ target: "Roche Lobe Overflow", multiplier: 1.10 }]),
    mk("Binary Partner",     2600, 1.00,  1, 0.6, {}, [{ target: "Microlensing", multiplier: 1.5 }]),
    mk("Peculiar Velocity",  4600, 1.00,  1, 0.9, { allMps: 1.350 }),
    mk("Open Cluster",       7400, 1.00,  1, 1.0, {}),
    mk("Moving Group",      40000, 1.00,  1, 0.0, { baseMps: 14.0, allMpc: 1.300, completionist: true }),
  ];
}

// v5-F: From v5-B baseline (cadence good, threshold just over). Gap was 61-65%.
//   Push BD/MG more expensive AND more powerful to widen the Completion gap.
//   Bring threshold-path stackable inits up slightly to land threshold at 15-16.
function buildT2_v5F() {
  return [
    mk("Stellar Kinematics",   95, 1.13, 99, 0.0, { baseMps: 2.0, selfMps: 1.1 }),
    mk("Local Bubble",        290, 1.13, 99, 0.0, { addMps: 1.4 }),
    mk("Microlensing",        340, 1.34, 99, 0.0, { addMpc: 2.2 }),
    mk("Roche Lobe Overflow", 580, 1.42, 99, 0.0, { addAps: 0.085 }, [{ target: "Local Bubble", multiplier: 1.05 }]),
    // Brown Dwarf — make completion gating heavier: cost growth 2.30, addMps 9.0 (was 7.5 in v5-B).
    mk("Brown Dwarf",        4500, 2.30,  5, 0.0, { addMps: 9.0, completionist: true }, [{ target: "Roche Lobe Overflow", multiplier: 1.10 }]),
    mk("Binary Partner",     2300, 1.00,  1, 0.6, {}, [{ target: "Microlensing", multiplier: 1.5 }]),
    mk("Peculiar Velocity",  4100, 1.00,  1, 0.9, { allMps: 1.350 }),
    mk("Open Cluster",       6500, 1.00,  1, 1.0, {}),
    // Moving Group — more expensive, stronger
    mk("Moving Group",      45000, 1.00,  1, 0.0, { baseMps: 16.0, allMpc: 1.300, completionist: true }),
  ];
}

// v5-G: From v5-F. Push completionists harder still — BD growth 2.40, MG much heavier.
function buildT2_v5G() {
  return [
    mk("Stellar Kinematics",  100, 1.13, 99, 0.0, { baseMps: 2.0, selfMps: 1.1 }),
    mk("Local Bubble",        300, 1.13, 99, 0.0, { addMps: 1.4 }),
    mk("Microlensing",        350, 1.34, 99, 0.0, { addMpc: 2.2 }),
    mk("Roche Lobe Overflow", 600, 1.42, 99, 0.0, { addAps: 0.085 }, [{ target: "Local Bubble", multiplier: 1.05 }]),
    mk("Brown Dwarf",        5500, 2.40,  5, 0.0, { addMps: 11.0, completionist: true }, [{ target: "Roche Lobe Overflow", multiplier: 1.10 }]),
    mk("Binary Partner",     2400, 1.00,  1, 0.6, {}, [{ target: "Microlensing", multiplier: 1.5 }]),
    mk("Peculiar Velocity",  4200, 1.00,  1, 0.9, { allMps: 1.350 }),
    mk("Open Cluster",       6800, 1.00,  1, 1.0, {}),
    mk("Moving Group",      55000, 1.00,  1, 0.0, { baseMps: 18.0, allMpc: 1.300, completionist: true }),
  ];
}

// v5-H: Strategic-completion mid-zone. Gap target +85%. Cadence target ~4/min.
//   Threshold stackables a bit cheaper than v5-G, completionists similar.
function buildT2_v5H() {
  return [
    mk("Stellar Kinematics",   95, 1.13, 99, 0.0, { baseMps: 2.0, selfMps: 1.1 }),
    mk("Local Bubble",        290, 1.13, 99, 0.0, { addMps: 1.4 }),
    mk("Microlensing",        330, 1.34, 99, 0.0, { addMpc: 2.2 }),
    mk("Roche Lobe Overflow", 580, 1.42, 99, 0.0, { addAps: 0.085 }, [{ target: "Local Bubble", multiplier: 1.05 }]),
    mk("Brown Dwarf",        5000, 2.35,  5, 0.0, { addMps: 10.0, completionist: true }, [{ target: "Roche Lobe Overflow", multiplier: 1.10 }]),
    mk("Binary Partner",     2300, 1.00,  1, 0.6, {}, [{ target: "Microlensing", multiplier: 1.5 }]),
    mk("Peculiar Velocity",  4000, 1.00,  1, 0.9, { allMps: 1.350 }),
    mk("Open Cluster",       6500, 1.00,  1, 1.0, {}),
    mk("Moving Group",      50000, 1.00,  1, 0.0, { baseMps: 17.0, allMpc: 1.300, completionist: true }),
  ];
}

// v5-I: From v5-H. Reduce threshold-path overshoot.
//   Strategy: bump early stackable values modestly (more income per level)
//   while keeping cost growth low. Keep BD/MG strong+expensive for gap.
function buildT2_v5I() {
  return [
    mk("Stellar Kinematics",   95, 1.13, 99, 0.0, { baseMps: 2.0, selfMps: 1.1 }),
    mk("Local Bubble",        280, 1.13, 99, 0.0, { addMps: 1.5 }),
    mk("Microlensing",        320, 1.34, 99, 0.0, { addMpc: 2.3 }),
    mk("Roche Lobe Overflow", 560, 1.42, 99, 0.0, { addAps: 0.090 }, [{ target: "Local Bubble", multiplier: 1.05 }]),
    mk("Brown Dwarf",        5200, 2.35,  5, 0.0, { addMps: 10.0, completionist: true }, [{ target: "Roche Lobe Overflow", multiplier: 1.10 }]),
    mk("Binary Partner",     2200, 1.00,  1, 0.6, {}, [{ target: "Microlensing", multiplier: 1.5 }]),
    mk("Peculiar Velocity",  3900, 1.00,  1, 0.9, { allMps: 1.350 }),
    mk("Open Cluster",       6300, 1.00,  1, 1.0, {}),
    mk("Moving Group",      52000, 1.00,  1, 0.0, { baseMps: 17.0, allMpc: 1.300, completionist: true }),
  ];
}

// v5-J: More aggressive — stronger effects and slightly cheaper.
function buildT2_v5J() {
  return [
    mk("Stellar Kinematics",   90, 1.13, 99, 0.0, { baseMps: 2.0, selfMps: 1.1 }),
    mk("Local Bubble",        260, 1.13, 99, 0.0, { addMps: 1.5 }),
    mk("Microlensing",        300, 1.34, 99, 0.0, { addMpc: 2.4 }),
    mk("Roche Lobe Overflow", 540, 1.42, 99, 0.0, { addAps: 0.092 }, [{ target: "Local Bubble", multiplier: 1.05 }]),
    mk("Brown Dwarf",        5500, 2.35,  5, 0.0, { addMps: 10.5, completionist: true }, [{ target: "Roche Lobe Overflow", multiplier: 1.10 }]),
    mk("Binary Partner",     2100, 1.00,  1, 0.6, {}, [{ target: "Microlensing", multiplier: 1.5 }]),
    mk("Peculiar Velocity",  3700, 1.00,  1, 0.9, { allMps: 1.350 }),
    mk("Open Cluster",       6000, 1.00,  1, 1.0, {}),
    mk("Moving Group",      52000, 1.00,  1, 0.0, { baseMps: 17.0, allMpc: 1.300, completionist: true }),
  ];
}

// v5-L: Pull v5-K threshold path slightly tighter — slight cost cuts.
//   Aim: 15-16 Threshold T1-thresh, 14-15 Threshold T1-comp.
function buildT2_v5L() {
  return [
    mk("Stellar Kinematics",   90, 1.13, 99, 0.0, { baseMps: 2.0, selfMps: 1.1 }),
    mk("Local Bubble",        270, 1.13, 99, 0.0, { addMps: 1.5 }),
    mk("Microlensing",        310, 1.34, 99, 0.0, { addMpc: 2.4 }),
    mk("Roche Lobe Overflow", 545, 1.42, 99, 0.0, { addAps: 0.090 }, [{ target: "Local Bubble", multiplier: 1.05 }]),
    mk("Brown Dwarf",        5200, 2.32,  5, 0.0, { addMps: 10.0, completionist: true }, [{ target: "Roche Lobe Overflow", multiplier: 1.10 }]),
    mk("Binary Partner",     2150, 1.00,  1, 0.6, {}, [{ target: "Microlensing", multiplier: 1.5 }]),
    mk("Peculiar Velocity",  3800, 1.00,  1, 0.9, { allMps: 1.400 }),
    mk("Open Cluster",       6200, 1.00,  1, 1.0, {}),
    mk("Moving Group",      50000, 1.00,  1, 0.0, { baseMps: 17.0, allMpc: 1.300, completionist: true }),
  ];
}

// v5-M (post-strategy-softening). The softened post-consolidation focus
// (marginal-save-time tolerance 1.05, gated on long saves > 90s) lets
// the bot interleave ~17 extra stackable buys during long BD saves —
// improving cadence from v5-L's 2.79-3.11/min to 3.02-3.37/min on the
// completion path. To compensate for the time stretch and keep gap
// inside 80-100%, costs are retuned modestly:
//
//   - SK costGrowth: 1.13 → 1.135 (tiny late-level cost bump; trims
//     SK interleave depth slightly without changing threshold cadence).
//   - LB costGrowth: 1.13 → 1.135 (same idea on LB).
//   - BD initCost: 5200 → 5000 (cheaper BD-1; completion-path opens
//     sooner, offsetting the time the interleaves cost).
//   - BD costGrowth: 2.32 → 2.28 (lower BD-5 wall — 5000×2.28^4 = 134k
//     vs 5200×2.32^4 = 150k. Completion path shortens.).
//   - MG cost: 50000 → 45000 (cheaper terminal completionist).
//   - All other v5-L numbers preserved (Microlensing, RLO, BP, PV, OC
//     init costs all match).
function buildT2_v5M() {
  return [
    mk("Stellar Kinematics",   90, 1.135, 99, 0.0, { baseMps: 2.0, selfMps: 1.1 }),
    mk("Local Bubble",        270, 1.135, 99, 0.0, { addMps: 1.5 }),
    mk("Microlensing",        310, 1.34,  99, 0.0, { addMpc: 2.4 }),
    mk("Roche Lobe Overflow", 545, 1.42,  99, 0.0, { addAps: 0.090 }, [{ target: "Local Bubble", multiplier: 1.05 }]),
    mk("Brown Dwarf",        5000, 2.28,   5, 0.0, { addMps: 10.0, completionist: true }, [{ target: "Roche Lobe Overflow", multiplier: 1.10 }]),
    mk("Binary Partner",     2150, 1.00,   1, 0.6, {}, [{ target: "Microlensing", multiplier: 1.5 }]),
    mk("Peculiar Velocity",  3800, 1.00,   1, 0.9, { allMps: 1.400 }),
    mk("Open Cluster",       6200, 1.00,   1, 1.0, {}),
    mk("Moving Group",      45000, 1.00,   1, 0.0, { baseMps: 16.0, allMpc: 1.300, completionist: true }),
  ];
}

// v5-K: Hybrid. Slightly stronger Peculiar Velocity (allMps 1.40), Microlensing
//   bumped, BD/MG strong but tuned to land 25-30 Completion T1-comp.
function buildT2_v5K() {
  return [
    mk("Stellar Kinematics",   95, 1.13, 99, 0.0, { baseMps: 2.0, selfMps: 1.1 }),
    mk("Local Bubble",        280, 1.13, 99, 0.0, { addMps: 1.5 }),
    mk("Microlensing",        320, 1.34, 99, 0.0, { addMpc: 2.4 }),
    mk("Roche Lobe Overflow", 560, 1.42, 99, 0.0, { addAps: 0.090 }, [{ target: "Local Bubble", multiplier: 1.05 }]),
    mk("Brown Dwarf",        5000, 2.30,  5, 0.0, { addMps: 9.5, completionist: true }, [{ target: "Roche Lobe Overflow", multiplier: 1.10 }]),
    mk("Binary Partner",     2200, 1.00,  1, 0.6, {}, [{ target: "Microlensing", multiplier: 1.5 }]),
    mk("Peculiar Velocity",  3900, 1.00,  1, 0.9, { allMps: 1.400 }),
    mk("Open Cluster",       6300, 1.00,  1, 1.0, {}),
    mk("Moving Group",      48000, 1.00,  1, 0.0, { baseMps: 16.0, allMpc: 1.300, completionist: true }),
  ];
}

const CANDIDATES = {
  'v4g':  { label: 'v4-G (current data.js — linear SK)',  build: () => T2_V4G        },
  'v5a':  { label: 'v5-A (exponential SK only)',           build: buildT2_v5A          },
  'v5b':  { label: 'v5-B (exp SK + cheaper inits)',        build: buildT2_v5B          },
  'v5c':  { label: 'v5-C (aggressive cost-growth drop)',   build: buildT2_v5C          },
  'v5d':  { label: 'v5-D (refine threshold path up)',      build: buildT2_v5D          },
  'v5e':  { label: 'v5-E (target 15/28)',                  build: buildT2_v5E          },
  'v5f':  { label: 'v5-F (widen gap, BD/MG heavier)',      build: buildT2_v5F          },
  'v5g':  { label: 'v5-G (BD growth 2.40, MG 55k)',        build: buildT2_v5G          },
  'v5h':  { label: 'v5-H (strategic-completion mid)',      build: buildT2_v5H          },
  'v5i':  { label: 'v5-I (stronger effects, lower cost)',  build: buildT2_v5I          },
  'v5j':  { label: 'v5-J (aggressive)',                    build: buildT2_v5J          },
  'v5k':  { label: 'v5-K (hybrid PV 1.40)',                build: buildT2_v5K          },
  'v5l':  { label: 'v5-L (tighter threshold)',             build: buildT2_v5L          },
  'v5m':  { label: 'v5-M (gap dial-back)',                 build: buildT2_v5M          },
};

// ----------------------------------------------------------------------------
// REPORTING
// ----------------------------------------------------------------------------

function compactRun(label, allUpgrades) {
  console.log('');
  console.log('---- ' + label + ' (100 cpm) ----');
  const handoffs = ['threshold', 'completion'];
  const modes = ['threshold', 'completion'];
  const cells = [];
  for (const t1 of handoffs) {
    for (const m of modes) {
      const r = describeRow('', t1, m, 100, allUpgrades);
      cells.push({
        tag: 'T1=' + t1.charAt(0).toUpperCase() + ' T2=' + m.charAt(0).toUpperCase(),
        time_s: r.time_s, time: r.time, done: r.completionistDone,
        levels: r.levels, totalBuys: r.totalBuys, cadence: r.cadence,
      });
    }
  }
  for (const c of cells) {
    console.log('   ' + c.tag + '  ' + c.time
              + '  buys=' + c.totalBuys.toString().padStart(3)
              + '  cadence=' + c.cadence.toFixed(2) + '/min'
              + '  done=' + (c.done ? 'Y' : 'N'));
  }
  // Gaps
  const tTT = cells[0].time_s, tTC = cells[1].time_s;
  const tCT = cells[2].time_s, tCC = cells[3].time_s;
  console.log('   gap T1-thresh:  Comp/Thresh = ' + fmtPct((tTC - tTT) / tTT));
  console.log('   gap T1-comp:    Comp/Thresh = ' + fmtPct((tCC - tCT) / tCT));
}

function detailRun(label, allUpgrades) {
  console.log('');
  console.log('=========================================================');
  console.log(' DETAIL: ' + label);
  console.log('=========================================================');
  const handoffs = ['threshold', 'completion'];
  const modes = ['threshold', 'completion'];
  for (const t1 of handoffs) {
    for (const m of modes) {
      const r = describeRow('', t1, m, 100, allUpgrades);
      const tag = 'T1=' + t1 + ' / T2=' + m;
      console.log('');
      console.log('  --- ' + tag + ' ---');
      console.log('    time:        ' + r.time + '   exitReason: ' + r.exitReason);
      console.log('    buys:        ' + r.totalBuys + '   cadence: ' + r.cadence.toFixed(2) + '/min');
      console.log('    final mass:  ' + r.finalMass.toFixed(0) + '   consolidation: ' + r.consolidation.toFixed(2));
      console.log('    completionistDone: ' + r.completionistDone);
      const levelsLine = T2_NAMES.map(n => n + '=' + (r.levels[n] || 0)).join('  ');
      console.log('    levels: ' + levelsLine);
      // synergy verification at end
      const rloLvl = r.levels['Roche Lobe Overflow'] || 0;
      const bdLvl  = r.levels['Brown Dwarf'] || 0;
      const bpLvl  = r.levels['Binary Partner'] || 0;
      const synBd_Rlo = Math.pow(1.10, bdLvl);
      const synRlo_Lb = Math.pow(1.05, rloLvl);
      const synBp_Ml  = bpLvl > 0 ? 1.5 : 1.0;
      console.log('    synergies: BP→ML ×' + synBp_Ml.toFixed(2)
                + '   RLO→LB ×' + synRlo_Lb.toFixed(4)
                + '   BD→RLO ×' + synBd_Rlo.toFixed(4));
      // per-upgrade buys
      const counts = T2_NAMES.map(n => n + ':' + (r.buys[n] || 0)).join('  ');
      console.log('    buy counts: ' + counts);
    }
  }
}

function timeline(label, allUpgrades) {
  console.log('');
  console.log('=========================================================');
  console.log(' TIMELINE: ' + label);
  console.log('=========================================================');
  for (const t1 of ['threshold', 'completion']) {
    for (const m of ['threshold', 'completion']) {
      console.log('');
      console.log('  ===== T1-' + t1 + ' → T2-' + m + ' @100cpm =====');
      const r = runOne(allUpgrades, 100, t1, m);
      const seen = {};
      const lastBuy = {};
      for (const row of r.trace) {
        if (row.action === 'buy') {
          if (!seen[row.upgrade]) seen[row.upgrade] = row.tick;
          lastBuy[row.upgrade] = row.tick;
        }
      }
      for (const n of T2_NAMES) {
        console.log('    ' + n.padEnd(22)
                  + ' first=' + (seen[n] || '-').toString().padStart(6) + 's'
                  + '   last=' + (lastBuy[n] || '-').toString().padStart(6) + 's'
                  + '   final lvl=' + (r.headline.levels[n] || 0));
      }
      console.log('    Total time: ' + fmtMmSs(r.headline.totalTime_s) + '  finalMass=' + r.headline.finalMass.toFixed(0));
    }
  }
}

function multiCpmRun(label, allUpgrades) {
  console.log('');
  console.log('---- ' + label + ' (multi-cpm) ----');
  for (const cpm of [60, 100, 150]) {
    console.log('  cpm=' + cpm + ':');
    const handoffs = ['threshold', 'completion'];
    const modes = ['threshold', 'completion'];
    for (const t1 of handoffs) {
      for (const m of modes) {
        const r = describeRow('', t1, m, cpm, allUpgrades);
        const tag = '   T1=' + t1.charAt(0).toUpperCase() + ' T2=' + m.charAt(0).toUpperCase();
        console.log(tag + '  ' + r.time
                  + '  buys=' + r.totalBuys.toString().padStart(3)
                  + '  cadence=' + r.cadence.toFixed(2) + '/min'
                  + '  done=' + (r.completionistDone ? 'Y' : 'N'));
      }
    }
  }
}

function main() {
  const arg = process.argv[2] || 'all';
  console.log('Dark Filaments T2 v5 calibration harness');
  console.log('=========================================');
  console.log('cpm=100 engagement=1.0 saveVpcThreshold=1.5');
  console.log('Targets: T2 Threshold 14-16min, T2 Completion 25-30min, gap 70-100%, cadence 3-5/min');

  if (arg === 'all') {
    for (const k of Object.keys(CANDIDATES)) {
      compactRun(CANDIDATES[k].label, composeUpgrades(CANDIDATES[k].build()));
    }
    return;
  }
  if (CANDIDATES[arg]) {
    compactRun(CANDIDATES[arg].label, composeUpgrades(CANDIDATES[arg].build()));
    return;
  }
  // detail-X / timeline-X
  if (arg.startsWith('detail-')) {
    const tag = arg.slice('detail-'.length);
    if (CANDIDATES[tag]) {
      detailRun(CANDIDATES[tag].label, composeUpgrades(CANDIDATES[tag].build()));
      return;
    }
  }
  if (arg.startsWith('timeline-')) {
    const tag = arg.slice('timeline-'.length);
    if (CANDIDATES[tag]) {
      timeline(CANDIDATES[tag].label, composeUpgrades(CANDIDATES[tag].build()));
      return;
    }
  }
  if (arg.startsWith('multicpm-')) {
    const tag = arg.slice('multicpm-'.length);
    if (CANDIDATES[tag]) {
      multiCpmRun(CANDIDATES[tag].label, composeUpgrades(CANDIDATES[tag].build()));
      return;
    }
  }
  console.log('Unknown tag: ' + arg);
  console.log('Tags: ' + Object.keys(CANDIDATES).join(', '));
  console.log('Modes: <tag>, all, detail-<tag>, timeline-<tag>');
}

if (require.main === module) main();

module.exports = { CANDIDATES, composeUpgrades, runOne, describeRow };
