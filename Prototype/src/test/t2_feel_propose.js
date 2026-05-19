// Dark Filaments — T2 feel-tuning proposal harness
// Run via: node Prototype/src/test/t2_feel_propose.js [proposal-name]
//
// Investigates the "T2 reads as T1 but longer" feel observation. Drives
// T1→T2 chains in all four scenarios (Comp-handoff Comp/Thr, Thr-handoff
// Comp/Thr), prints curve-shape deciles, and also drives T1→T2→T3 to verify
// T3 gaps stay in band.
//
// Proposals live in PROPOSALS below; rerun any proposal by name. baseline is
// the live data.js values.

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

// T2 feel-tuning candidates. Constraint: never touch T1 values.
const PROPOSALS = {
  baseline: {},

  // ---- A1: bump Moving Group allMps 1.30 → 1.42 ----
  // Mirrors T3's GC kick. Late-T2 spike from the completionist one-shot.
  A1: {
    "Moving Group":       { allMps: 1.42 },
  },

  // ---- A2: bump Moving Group allMps 1.30 → 1.50 ----
  A2: {
    "Moving Group":       { allMps: 1.50 },
  },

  // ---- A3: bump Moving Group allMps 1.30 → 1.45 + small Stellar Kinematics base bump ----
  A3: {
    "Stellar Kinematics": { baseMps: 2.4 },
    "Moving Group":       { allMps: 1.45 },
  },

  // ---- A4: strengthen Brown Dwarf → Roche Lobe Overflow cross-stat synergy ----
  // 1.10 → 1.15 per level — Brown Dwarf becomes a bigger lift on RLO's autoclick.
  // But Brown Dwarf is Completion-only. So this lifts late-Comp without
  // touching Threshold. Pairs naturally with strategic-completion intent.
  A4: {
    "Brown Dwarf":        { synergies: [{ target: "Roche Lobe Overflow", multiplier: 1.15 }] },
  },

  // ---- A5: strengthen Binary Partner → Microlensing synergy 1.5 → 2.0 ----
  // Binary Partner is a Threshold one-shot (consolidation 0.6, lands on both paths).
  // This lifts late-T2 MPC for both — a clearer "click feels different now" moment.
  A5: {
    "Binary Partner":     { synergies: [{ target: "Microlensing", multiplier: 2.0 }] },
  },

  // ---- A6: Stellar Kinematics selfMps 1.1 → 1.12 ----
  // Real exponential growth steepening — late-tier SK gets noticeably bigger.
  A6: {
    "Stellar Kinematics": { selfMps: 1.12 },
  },

  // ---- A7: Moving Group baseMps 16 → 28 + allMps 1.30 → 1.42 ----
  // Late-tier spike from both the flat MPS injection AND the multiplier.
  A7: {
    "Moving Group":       { baseMps: 28.0, allMps: 1.42 },
  },

  // ---- A8: Push Roche Lobe Overflow → Local Bubble per-level synergy 1.05 → 1.07 ----
  // Each RLO level lifts LB more — mid/late T2 climbs faster as RLO levels stack.
  A8: {
    "Roche Lobe Overflow": { synergies: [{ target: "Local Bubble", multiplier: 1.07 }] },
  },

  // ---- A9: combination — Moving Group allMps 1.42 + DLD-style synergy bump ----
  // Same MG bump as A1 (completionist spike) + RLO→LB synergy strengthened
  // (visible mid-curve compounding for both Thr and Comp paths).
  A9: {
    "Roche Lobe Overflow": { synergies: [{ target: "Local Bubble", multiplier: 1.07 }] },
    "Moving Group":       { allMps: 1.42 },
  },

  // ---- A10: A9 + Stellar Kinematics baseMps bump (2.0 → 2.6) ----
  // The dominant stackable buy in T2 — bigger base means each SK level lifts
  // more in absolute terms. SK is bought ~13-15 times so the lift compounds.
  A10: {
    "Stellar Kinematics": { baseMps: 2.6 },
    "Roche Lobe Overflow": { synergies: [{ target: "Local Bubble", multiplier: 1.07 }] },
    "Moving Group":       { allMps: 1.42 },
  },

  // ---- A11: Push Peculiar Velocity allMps 1.40 → 1.50 ----
  // PV is a Threshold one-shot (consolidation 0.9, both paths buy it). A bigger
  // mid-tier kick visible to all players.
  A11: {
    "Peculiar Velocity":  { allMps: 1.50 },
  },

  // ---- A12: PV 1.50 + MG 1.42 (compound bumps to both ×all sources) ----
  A12: {
    "Peculiar Velocity":  { allMps: 1.50 },
    "Moving Group":       { allMps: 1.42 },
  },

  // ---- A13: PV 1.50 + MG 1.42 + RLO→LB 1.07 (the rich package) ----
  A13: {
    "Peculiar Velocity":  { allMps: 1.50 },
    "Roche Lobe Overflow": { synergies: [{ target: "Local Bubble", multiplier: 1.07 }] },
    "Moving Group":       { allMps: 1.42 },
  },

  // ---- A14: lift Microlensing MPC from 2.4 → 3.0 ----
  // Click value bigger — late-T2 clicking visibly more rewarding.
  A14: {
    "Microlensing":       { addMpc: 3.0 },
  },

  // ---- A15: Stellar Kinematics base bump + selfMps 1.11 ----
  // Steepens the exponential dominant-stackable curve.
  A15: {
    "Stellar Kinematics": { baseMps: 2.4, selfMps: 1.11 },
  },

  // ---- A16: A9 baseline (MG + RLO synergy) + SK selfMps 1.11 ----
  A16: {
    "Stellar Kinematics": { selfMps: 1.11 },
    "Roche Lobe Overflow": { synergies: [{ target: "Local Bubble", multiplier: 1.07 }] },
    "Moving Group":       { allMps: 1.42 },
  },

  // ---- ROUND 2: SK-steepen + Completion-cost compensation ----
  // Goal: hit the late-T2 curve via SK exponent (lifts both paths late), then
  // compensate with raised Completion-only costs to preserve the gap.

  // ---- B1: SK selfMps 1.11 + BD initCost 5000 → 6500 ----
  // Slows Comp's BD save. Doesn't affect Thr.
  B1: {
    "Stellar Kinematics": { selfMps: 1.11 },
    "Brown Dwarf":        { initCost: 6500 },
  },

  // ---- B2: SK selfMps 1.11 + MG initCost 45000 → 60000 ----
  // Slows Comp's MG save. Doesn't affect Thr.
  B2: {
    "Stellar Kinematics": { selfMps: 1.11 },
    "Moving Group":       { initCost: 60000 },
  },

  // ---- B3: SK selfMps 1.115 + BD and MG cost bumps (medium dose) ----
  B3: {
    "Stellar Kinematics": { selfMps: 1.115 },
    "Brown Dwarf":        { initCost: 6500 },
    "Moving Group":       { initCost: 60000 },
  },

  // ---- B4: SK selfMps 1.11 + Moving Group cost bump 45k → 55k ----
  // More moderate Comp cost bump.
  B4: {
    "Stellar Kinematics": { selfMps: 1.11 },
    "Moving Group":       { initCost: 55000 },
  },

  // ---- B5: SK selfMps 1.115 + MG cost 55k (single Comp-side cost bump) ----
  B5: {
    "Stellar Kinematics": { selfMps: 1.115 },
    "Moving Group":       { initCost: 55000 },
  },

  // ---- B6: SK selfMps 1.115, no cost bumps. Just to see the size of selfMps 1.115 effect alone.
  B6: {
    "Stellar Kinematics": { selfMps: 1.115 },
  },

  // ---- B7: SK selfMps 1.11 alone. Probe scaling.
  B7: {
    "Stellar Kinematics": { selfMps: 1.11 },
  },

  // ---- B8: SK selfMps 1.105 alone. Even more conservative.
  B8: {
    "Stellar Kinematics": { selfMps: 1.105 },
  },

  // ---- B9: B5 + RLO→LB synergy 1.05 → 1.06 (mid-curve nudge) ----
  B9: {
    "Stellar Kinematics": { selfMps: 1.115 },
    "Roche Lobe Overflow": { synergies: [{ target: "Local Bubble", multiplier: 1.06 }] },
    "Moving Group":       { initCost: 55000 },
  },

  // ---- B10: B5 + Binary Partner → Microlensing 1.5 → 1.75 ----
  // Mid-tier visible click-feel lift, both paths.
  B10: {
    "Stellar Kinematics": { selfMps: 1.115 },
    "Binary Partner":     { synergies: [{ target: "Microlensing", multiplier: 1.75 }] },
    "Moving Group":       { initCost: 55000 },
  },

  // ---- B11: SK selfMps 1.115 + MG cost 55k + small MG bump baseMps 16 → 22 ----
  // Adds late-tier mass kick *and* compensates with cost.
  B11: {
    "Stellar Kinematics": { selfMps: 1.115 },
    "Moving Group":       { initCost: 55000, baseMps: 22 },
  },

  // ---- B12: SK selfMps 1.115 + MG cost 65k (bigger compensation) ----
  B12: {
    "Stellar Kinematics": { selfMps: 1.115 },
    "Moving Group":       { initCost: 65000 },
  },

  // ---- B13: SK selfMps 1.12 + MG cost 65k (max steepening) ----
  B13: {
    "Stellar Kinematics": { selfMps: 1.12 },
    "Moving Group":       { initCost: 65000 },
  },

  // ---- B14: B5 final candidate variant — slightly heavier MG cost ----
  B14: {
    "Stellar Kinematics": { selfMps: 1.115 },
    "Moving Group":       { initCost: 58000 },
  },

  // ---- B15: SK selfMps 1.12 + MG cost 80000 + BD cost 6500 ----
  // Biggest steepening with strongest Comp-side compensation.
  B15: {
    "Stellar Kinematics": { selfMps: 1.12 },
    "Brown Dwarf":        { initCost: 6500 },
    "Moving Group":       { initCost: 80000 },
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

function runT2Chain(overrides, handoffMode, t2Mode) {
  const params = { cpm: 100, engagement: 1.0, saveVpcThreshold: 1.5 };
  const t1 = runner.runSimulation(params, { tier: 1, mode: handoffMode, upgrades: overrides });
  const t2 = runner.runSimulation(params, { tier: 2, mode: t2Mode, carryFrom: t1.finalState, upgrades: overrides });
  return { t1, t2 };
}

function runT3Chain(overrides, t1Mode, t2Mode, t3Mode) {
  const params = { cpm: 100, engagement: 1.0, saveVpcThreshold: 1.5 };
  const t1 = runner.runSimulation(params, { tier: 1, mode: t1Mode, upgrades: overrides });
  const t2 = runner.runSimulation(params, { tier: 2, mode: t2Mode, carryFrom: t1.finalState, upgrades: overrides });
  const t3 = runner.runSimulation(params, { tier: 3, mode: t3Mode, carryFrom: t2.finalState, upgrades: overrides });
  return { t1, t2, t3 };
}

// Decile MPS sampler — for T2 specifically.
function curveShape(trace) {
  const total = trace.length - 1;
  if (total <= 0) return null;
  const sample = function (pct) {
    const idx = Math.min(trace.length - 1, Math.floor(total * pct / 100));
    return trace[idx];
  };
  const deciles = [];
  for (let p = 0; p <= 100; p += 10) {
    const row = sample(p);
    deciles.push({
      pct: p,
      t: row.time_s,
      mps: row.mps,
      mass: row.mass_out,
    });
  }
  const m0 = trace[0].mps + 1;
  const m25 = sample(25).mps;
  const m50 = sample(50).mps;
  const m75 = sample(75).mps;
  const m100 = sample(100).mps;
  return { deciles, m0, m25, m50, m75, m100,
    ratio_75_100: m100 / Math.max(m75, 1),
    ratio_0_75: m75 / Math.max(m0, 1) };
}

function printDeciles(label, trace) {
  const cs = curveShape(trace);
  console.log('');
  console.log('  ' + label);
  console.log('    Decile | time   | mps         | mass        | growth-vs-prev');
  let prev = null;
  for (const d of cs.deciles) {
    const g = prev != null && prev > 0 ? (d.mps / prev) : null;
    console.log('    ' + (d.pct + '%').padStart(6) + ' | ' +
      fmtTime(d.t).padStart(5) + '  | ' +
      fmtNum(d.mps).padStart(11) + ' | ' +
      fmtNum(d.mass).padStart(11) + ' | ' +
      (g != null ? g.toFixed(2) + 'x' : '—'));
    prev = d.mps;
  }
  console.log('    curve metric: 0→75 ' + cs.ratio_0_75.toFixed(1) + 'x   75→100 ' + cs.ratio_75_100.toFixed(1) + 'x');
  return cs;
}

function reportT2(label, t1, t2, opts) {
  console.log('');
  console.log(label);
  console.log('  T1 time: ' + fmtTime(t1.headline.totalTime_s) +
    '   T2 time: ' + fmtTime(t2.headline.totalTime_s) +
    '   T2 exit: ' + t2.headline.exitReason +
    '   coh=' + t2.headline.consolidation.toFixed(2) +
    '   comp=' + (t2.headline.completionistDone ? 'Y' : 'N'));
  if (opts && opts.deciles) printDeciles('T2 deciles:', t2.trace);
  return { t1, t2 };
}

function main() {
  const name = process.argv[2] || 'baseline';
  const skipT3 = process.argv.includes('--skip-t3');
  console.log('### T2 feel proposal: ' + name + ' ###');
  const overrides = applyOverrides(name);

  // T2 scenarios
  const compHC = runT2Chain(overrides, 'completion', 'completion');
  const compHT = runT2Chain(overrides, 'completion', 'threshold');
  const thrHC = runT2Chain(overrides, 'threshold', 'completion');
  const thrHT = runT2Chain(overrides, 'threshold', 'threshold');

  const verbose = process.argv.includes('--verbose');
  reportT2('T2 Comp-handoff Comp', compHC.t1, compHC.t2, { deciles: true });
  reportT2('T2 Comp-handoff Thr', compHT.t1, compHT.t2, { deciles: verbose });
  reportT2('T2 Thr-handoff Comp', thrHC.t1, thrHC.t2, { deciles: verbose });
  reportT2('T2 Thr-handoff Thr', thrHT.t1, thrHT.t2, { deciles: verbose });

  // T2 inversion gaps
  console.log('');
  console.log('--- T2 Completion-vs-Threshold gaps (target band +80-100%) ---');
  const gap_compH = (compHC.t2.headline.totalTime_s - compHT.t2.headline.totalTime_s) / compHT.t2.headline.totalTime_s * 100;
  const gap_thrH = (thrHC.t2.headline.totalTime_s - thrHT.t2.headline.totalTime_s) / thrHT.t2.headline.totalTime_s * 100;
  console.log('  Comp-handoff: ' + fmtTime(compHC.t2.headline.totalTime_s) + ' vs ' + fmtTime(compHT.t2.headline.totalTime_s) + ' → ' + pct(gap_compH));
  console.log('  Thr-handoff:  ' + fmtTime(thrHC.t2.headline.totalTime_s) + ' vs ' + fmtTime(thrHT.t2.headline.totalTime_s) + ' → ' + pct(gap_thrH));

  if (!skipT3) {
    console.log('');
    console.log('--- T3 ripple check (target band +65-75%) ---');
    // Chain through to T3 in all four scenarios that t3_calibrate.js reports.
    const A = runT3Chain(overrides, 'threshold', 'threshold', 'threshold');
    const B = runT3Chain(overrides, 'completion', 'completion', 'completion');
    const C = runT3Chain(overrides, 'completion', 'completion', 'threshold');
    const D = runT3Chain(overrides, 'threshold', 'threshold', 'completion');
    const gap_t3_compH = (B.t3.headline.totalTime_s - C.t3.headline.totalTime_s) / C.t3.headline.totalTime_s * 100;
    const gap_t3_thrH = (D.t3.headline.totalTime_s - A.t3.headline.totalTime_s) / A.t3.headline.totalTime_s * 100;
    console.log('  T3 Comp-handoff: ' + fmtTime(B.t3.headline.totalTime_s) + ' vs ' + fmtTime(C.t3.headline.totalTime_s) + ' → ' + pct(gap_t3_compH));
    console.log('  T3 Thr-handoff:  ' + fmtTime(D.t3.headline.totalTime_s) + ' vs ' + fmtTime(A.t3.headline.totalTime_s) + ' → ' + pct(gap_t3_thrH));
  }
}

if (require.main === module) main();
