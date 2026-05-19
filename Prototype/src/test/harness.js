// Dark Filaments — calibration harness (Node CLI)
// Long-burn v1, Sim-Tuner Phase 1 (S1) — skeleton.
//
// Run via:
//   node src/test/harness.js --pairing engaged-steady-x-completionist --n 5 --target t4
//   node src/test/harness.js --primary-only --n 10
//   node src/test/harness.js --report                 (full sweep at default N)
//   node src/test/harness.js --list                   (list available pairings)
//
// What this file IS (S1):
//   - CLI argument parsing
//   - Pairing resolution + run-list construction
//   - For legacy bot pairings (continuous-time): real per-tier simulation via
//     runner.runSimulation — produces real headline numbers per run.
//   - For engagement-profile pairings: stubbed multi-window loop. S2 fills in
//     reconstructFromOfflineWindow integration; for now these pairings produce
//     placeholder DNF entries so the report-shape verification can pass.
//   - Reporting scaffold: writes report.md + raw.csv under
//     Simulator/reports/<timestamp>/.
//
// What this file IS NOT (deferred to later sim-tuner phases):
//   - S2: real multi-window simulation for engagement-profile pairings.
//   - S3: secondary-pairing coverage at correct N.
//   - S4: mass-target band + DNF rule.
//   - S5: top-down start states (mid-tier seeded runs).
//   - S6: baseline calibration run + retune recommendations.

'use strict';

const fs = require('fs');
const path = require('path');

require('../sim/data.js');
require('../sim/core.js');
require('../sim/strategy.js');
require('../sim/runner.js');
require('../sim/save.js');
require('../sim/offline.js');
const profiles = require('../sim/profiles.js');
const sweep = require('../sim/sweep.js');
const data = (typeof window !== 'undefined' ? window : globalThis).DF.sim.data;

// -----------------------------------------------------------------------
// Constants — re-exported from sweep.js so external scripts that referenced
// these from harness.js stay working without churn.
// -----------------------------------------------------------------------

const DEFAULT_MAX_DAYS = sweep.DEFAULT_MAX_DAYS;
const SEC_PER_DAY = sweep.SEC_PER_DAY;
const DRIFT_THRESHOLD = sweep.DRIFT_THRESHOLD;
const DEFAULT_MASS_BAND_LOW = sweep.DEFAULT_MASS_BAND_LOW;
const LOW_CONFIDENCE_DNF_RATE = sweep.LOW_CONFIDENCE_DNF_RATE;

// Sim-core functions now live in sweep.js. Bind them locally so the report
// writers (still in this file) call the same names as before.
const runPairing = sweep.runPairing;
const runContinuousBotRun = sweep.runContinuousBotRun;
const runEngagementProfileRun = sweep.runEngagementProfileRun;
const summarizeRuns = sweep.summarizeRuns;
const referenceMassForTier = sweep.referenceMassForTier;
const makeRunRng = sweep.makeRunRng;
const sampleIdleGapSec = sweep.sampleIdleGapSec;
const freshSavedState = sweep.freshSavedState;
const pct = sweep.pct;
const sortedAscending = sweep.sortedAscending;

// -----------------------------------------------------------------------
// Sim-core (mulberry32 RNG, makeRunRng, referenceMassForTier,
// referenceMassesThroughTier, sampleIdleGapSec, runPairing,
// runContinuousBotRun, runEngagementProfileRun, freshSavedState, pct,
// sortedAscending, summarizeRuns) is now in `src/sim/sweep.js`.
// Bound at module top so the report writers below see the same names.
// -----------------------------------------------------------------------

// -----------------------------------------------------------------------
// CLI argument parsing
// -----------------------------------------------------------------------

function parseArgs(argv) {
  const out = {
    pairing: null,        // single-pairing override (string)
    timing: null,         // ad-hoc timing profile name (with --buyer; S3)
    buyer: null,          // ad-hoc buyer profile name (with --timing; S3)
    n: null,              // per-pairing run count override (number)
    target: null,         // highest tier to simulate (string, e.g. "t4" → 4)
    report: false,        // write report.md + raw.csv
    primaryOnly: false,   // restrict to weight === 'primary'
    seed: null,           // RNG seed (number; drives engagement-profile windowing)
    maxDays: null,        // calendar-time cap per run (days; default 365)
    massBandLow: null,    // S4: lower bound of mass-target band (default 0.7)
    list: false,          // print pairing catalog and exit
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === '--help' || a === '-h') { out.help = true; }
    else if (a === '--list') { out.list = true; }
    else if (a === '--report') { out.report = true; }
    else if (a === '--primary-only') { out.primaryOnly = true; }
    else if (a === '--pairing') { out.pairing = next; i++; }
    else if (a === '--timing')  { out.timing = next; i++; }
    else if (a === '--buyer')   { out.buyer = next; i++; }
    else if (a === '--n')        { out.n = parseInt(next, 10); i++; }
    else if (a === '--target')   { out.target = next; i++; }
    else if (a === '--seed')     { out.seed = parseInt(next, 10); i++; }
    else if (a === '--max-days') { out.maxDays = parseFloat(next); i++; }
    else if (a === '--mass-band-low') { out.massBandLow = parseFloat(next); i++; }
    else if (a.startsWith('--pairing='))  { out.pairing = a.slice('--pairing='.length); }
    else if (a.startsWith('--timing='))   { out.timing = a.slice('--timing='.length); }
    else if (a.startsWith('--buyer='))    { out.buyer = a.slice('--buyer='.length); }
    else if (a.startsWith('--n='))        { out.n = parseInt(a.slice('--n='.length), 10); }
    else if (a.startsWith('--target='))   { out.target = a.slice('--target='.length); }
    else if (a.startsWith('--seed='))     { out.seed = parseInt(a.slice('--seed='.length), 10); }
    else if (a.startsWith('--max-days=')) { out.maxDays = parseFloat(a.slice('--max-days='.length)); }
    else if (a.startsWith('--mass-band-low=')) { out.massBandLow = parseFloat(a.slice('--mass-band-low='.length)); }
  }
  return out;
}

function printHelp() {
  console.log([
    'Dark Filaments — calibration harness (long-burn v1, S1 skeleton)',
    '',
    'Usage:',
    '  node src/test/harness.js [options]',
    '',
    'Options:',
    '  --pairing <id|name>   Run a single pairing (id like "p1" or name like',
    '                        "engaged-steady-x-completionist").',
    '  --timing <name>       Ad-hoc pairing — combine with --buyer to run any',
    '  --buyer <name>        timing × buyer combination outside the 12 default',
    '                        pairings. Defaults to N=10 unless --n overrides.',
    '  --n <N>               Override per-pairing run count.',
    '  --target <tier>       Highest tier to simulate. Default = MAX_TIER from data.',
    '                        Format: "t4" or just "4".',
    '  --report              Write report.md + raw.csv under Simulator/reports/<ts>/.',
    '  --primary-only        Restrict to weight=primary pairings.',
    '  --seed <int>          RNG base seed (engagement-profile windowing).',
    '                        Per-run seeds derive deterministically from base.',
    '  --max-days <N>        Calendar budget cap per run (days; default 365).',
    '  --mass-band-low <F>   Lower bound of mass-target band (default 0.7).',
    '  --list                Print pairing catalog and exit.',
    '  --help                Show this help.',
    '',
    'Scope (S2): engagement-profile pairings run the real multi-window loop via',
    'reconstructFromOfflineWindow (alternating idle gaps + check-in sessions).',
    'Continuous bot pairings keep using runner.runSimulation chained across tiers',
    'for cross-checking T1-T4 calibration.',
  ].join('\n'));
}

function listPairings() {
  console.log('Realistic pairings (' + profiles.REALISTIC_PAIRINGS.length + '):');
  console.log('');
  console.log('  ID    Pairing                                                N    Weight     DNF');
  console.log('  ----  -----------------------------------------------------  ---  ---------  ---');
  for (const p of profiles.REALISTIC_PAIRINGS) {
    const label = (p.timing + '-x-' + p.buyer).padEnd(53);
    const id = p.id.padEnd(4);
    const n = String(p.n).padEnd(3);
    const weight = p.weight.padEnd(9);
    const dnf = p.dnfExpected || '';
    console.log('  ' + id + '  ' + label + '  ' + n + '  ' + weight + '  ' + dnf);
  }
  console.log('');
  console.log('Timing profiles:');
  for (const name of Object.keys(profiles.TIMING_PROFILES)) {
    const t = profiles.TIMING_PROFILES[name];
    if (t.continuous) {
      console.log('  ' + name.padEnd(20) + '  continuous @ ' + t.cpm + ' cpm');
    } else if (t.phases) {
      const ph = t.phases.length;
      const last = t.phases[ph - 1];
      const first = t.phases[0];
      console.log('  ' + name.padEnd(20) + '  ' + ph + ' phases: '
        + first.checkInsPerDay + '×/day @ ' + first.cpm + 'cpm onboard → '
        + (last.checkInsPerDay === 0 ? '(stops)' : last.checkInsPerDay + '×/day @ ' + last.cpm + 'cpm drift'));
    } else {
      console.log('  ' + name.padEnd(20) + '  (unknown shape)');
    }
  }
  console.log('');
  console.log('Buyer profiles:');
  for (const name of Object.keys(profiles.BUYER_PROFILES)) {
    const b = profiles.BUYER_PROFILES[name];
    console.log('  ' + name.padEnd(26) + '  path=' + b.path +
      '  saveVpc=' + b.saveVpcThreshold);
  }
}

// -----------------------------------------------------------------------
// Target-tier parsing
// -----------------------------------------------------------------------

function parseTargetTier(target) {
  if (!target) {
    return Math.max(...data.UPGRADES.map(u => (u.tier == null ? 1 : u.tier)));
  }
  const m = String(target).toLowerCase().match(/t?(\d+)/);
  if (!m) throw new Error('cannot parse --target: ' + target);
  return parseInt(m[1], 10);
}

// -----------------------------------------------------------------------
// Run-list construction
// -----------------------------------------------------------------------

function buildRunList(args) {
  let pairings;
  if (args.timing && args.buyer) {
    // Ad-hoc pairing — synthesize a one-off entry. Marked weight='ad-hoc'
    // so the report writer doesn't try to slot it into primary / secondary /
    // stress / legacy sections. Default N=10 unless overridden by --n.
    if (!profiles.TIMING_PROFILES[args.timing]) {
      throw new Error('unknown timing profile: ' + args.timing);
    }
    if (!profiles.BUYER_PROFILES[args.buyer]) {
      throw new Error('unknown buyer profile: ' + args.buyer);
    }
    pairings = [{
      id: 'ad-hoc',
      timing: args.timing,
      buyer: args.buyer,
      n: 10,
      weight: 'ad-hoc',
    }];
  } else if (args.pairing) {
    const p = profiles.lookupPairing(args.pairing);
    if (!p) throw new Error('unknown pairing: ' + args.pairing);
    pairings = [p];
  } else if (args.primaryOnly) {
    pairings = profiles.primaryPairings();
  } else {
    pairings = profiles.REALISTIC_PAIRINGS.slice();
  }
  return pairings.map(p => Object.assign({}, p, {
    n: (args.n != null && Number.isFinite(args.n)) ? args.n : p.n,
  }));
}

// -----------------------------------------------------------------------
// Pairing execution + run summarization now live in src/sim/sweep.js.
// runPairing / runContinuousBotRun / runEngagementProfileRun /
// freshSavedState / pct / sortedAscending / summarizeRuns are bound
// from sweep at the top of this file.
// -----------------------------------------------------------------------
// Report writers
// -----------------------------------------------------------------------

function fmtTime(s) {
  if (s == null || !Number.isFinite(s)) return '—';
  // Calendar-scale formatter with explicit unit labels. Calendar-scale runs
  // span minutes → hours → days; using h:mm ambiguously could be misread as
  // mm:ss, so we tag every magnitude. Engagement-profile runs land in the
  // days range; a compact "5d 6h" is more readable than "5:06:00:00".
  const total = Math.round(s);
  if (total < 60) return total + 's';
  if (total < 3600) {
    const m = Math.floor(total / 60);
    const sec = total - m * 60;
    return m + 'm ' + sec + 's';
  }
  if (total < SEC_PER_DAY) {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total - h * 3600) / 60);
    return h + 'h ' + m + 'm';
  }
  // Days form. >=10 days: one decimal; <10 days: integer days + hours.
  const days = total / SEC_PER_DAY;
  if (days >= 10) return days.toFixed(1) + 'd';
  const d = Math.floor(days);
  const h = Math.floor((total - d * SEC_PER_DAY) / 3600);
  return d + 'd ' + h + 'h';
}

function fmtTargetRange(tgt) {
  if (!tgt) return '—';
  return fmtTime(tgt.low) + ' - ' + fmtTime(tgt.high);
}

function fmtDriftPct(pct) {
  if (pct == null) return '—';
  const sign = pct >= 0 ? '+' : '';
  return sign + (pct * 100).toFixed(1) + '%';
}

function fmtRatio(r) {
  if (r == null) return '—';
  return r.toFixed(2) + '×';
}

function fmtMass(m) {
  if (m == null || !Number.isFinite(m)) return '—';
  // Calendar-scale reference masses span 0 to 1e22+. Use scientific notation
  // for anything >= 1e6; integer for smaller.
  if (Math.abs(m) >= 1e6) {
    return m.toExponential(2);
  }
  return Math.round(m).toString();
}

function makeReportMarkdown(results, args, targetTier) {
  const lines = [];
  const ts = new Date().toISOString();
  lines.push('# Long-burn calibration — ' + ts);
  lines.push('');
  lines.push('- Build: long-burn-v1');
  lines.push('- Harness: S4 (mass-target band check + DNF-by-reason; engineering plan §4 decisions C1-C6 honored)');
  lines.push('- Target tier: T' + targetTier);
  lines.push('- Pairings: ' + results.length);
  const totalRuns = results.reduce((s, r) => s + r.runs.length, 0);
  const totalDnfs = results.reduce((s, r) => s + r.summary.dnfCount, 0);
  lines.push('- Total runs: ' + totalRuns + ', DNFs: ' + totalDnfs + ' (excluded from percentiles per plan §4 C2)');
  // S4: aggregate DNFs by reason across all pairings.
  const dnfTotalsByReason = {};
  for (const r of results) {
    for (const cat of Object.keys(r.summary.dnfByReason || {})) {
      dnfTotalsByReason[cat] = (dnfTotalsByReason[cat] || 0) + r.summary.dnfByReason[cat];
    }
  }
  if (Object.keys(dnfTotalsByReason).length > 0) {
    const parts = Object.keys(dnfTotalsByReason).sort().map(k => k + '=' + dnfTotalsByReason[k]);
    lines.push('- DNFs by reason: ' + parts.join(', '));
  }
  if (args && args.seed != null) lines.push('- Seed: ' + args.seed);
  if (args && args.maxDays != null) lines.push('- Max calendar budget: ' + args.maxDays + ' days');
  // S4: surface the mass-band-low threshold actually used.
  const usedMassBandLow = (args && args.massBandLow != null && Number.isFinite(args.massBandLow))
    ? args.massBandLow : DEFAULT_MASS_BAND_LOW;
  lines.push('- Mass-band-low: ' + usedMassBandLow + ' (per-tier exit mass / bot reference; below = below-band flag)');
  lines.push('');

  // Group by weight.
  const byWeight = { primary: [], secondary: [], stress: [], legacy: [], 'ad-hoc': [] };
  for (const r of results) {
    const w = r.pairing.weight || 'ad-hoc';
    if (!byWeight[w]) byWeight[w] = [];
    byWeight[w].push(r);
  }

  // ----- Primary pairings: full per-tier breakdown with drift detection -----
  if (byWeight.primary.length > 0) {
    lines.push('## Primary pairings (calibration-deciding)');
    lines.push('');
    lines.push('Drift detection: ±15% from per-tier target midpoint (engineering plan §4 C6). Primary pairings drive the retune; secondary / stress / legacy are informational.');
    lines.push('');
    for (const r of byWeight.primary) {
      writePrimaryPairingSection(lines, r, targetTier);
    }
  }

  // ----- Secondary pairings: percentiles + DNF, drift only for engaged timings -----
  if (byWeight.secondary.length > 0) {
    lines.push('## Secondary pairings (informational; primary is gating)');
    lines.push('');
    writeWeightSummaryTable(lines, byWeight.secondary, targetTier);
  }

  // ----- Stress pairings: lazy-stackable + idle-clicker; DNF-prone -----
  if (byWeight.stress.length > 0) {
    lines.push('## Stress pairings (adversarial profiles; high-DNF expected)');
    lines.push('');
    writeWeightSummaryTable(lines, byWeight.stress, targetTier);
  }

  // ----- Legacy pairings: continuous-bot cross-check against t3/t4 calibrate -----
  if (byWeight.legacy.length > 0) {
    lines.push('## Legacy reference (continuous-bot cross-check)');
    lines.push('');
    lines.push('Continuous bot pairings use runner.runSimulation chained across tiers — same path as `t3_calibrate.js` / `t4_calibrate.js`. Numbers should match prior calibration probes; deviation here means the engine has drifted from its T1-T4 baseline.');
    lines.push('');
    writeWeightSummaryTable(lines, byWeight.legacy, targetTier);
  }

  if (byWeight['ad-hoc'].length > 0) {
    lines.push('## Ad-hoc pairings (--timing / --buyer)');
    lines.push('');
    writeWeightSummaryTable(lines, byWeight['ad-hoc'], targetTier);
  }

  // Cross-pairing comparison (all results, one table).
  lines.push('## Cross-pairing comparison (all pairings)');
  lines.push('');
  lines.push('| Pairing | Mode | Weight | N | DNF | p10 | p50 | p90 | Total drift | T' + targetTier + ' band | Kind |');
  lines.push('|---|---|---|---|---|---|---|---|---|---|---|');
  for (const r of results) {
    const kind = (r.runs[0] && r.runs[0].kind) || '—';
    const driftStr = r.summary.driftApplies
      ? (r.summary.totalDriftFlag
          ? (fmtDriftPct(r.summary.totalDriftPct) + ' [' + r.summary.totalDriftFlag + ']')
          : '—')
      : 'n/a';
    const targetPt = r.summary.perTier[targetTier];
    const bandStr = (targetPt && targetPt.massRatioP50 != null)
      ? fmtRatio(targetPt.massRatioP50) + ' [' + (targetPt.bandFlag || '—') + ']'
      : '—';
    lines.push('| ' + r.pairing.timing + ' × ' + r.pairing.buyer
      + ' | ' + r.summary.mode
      + ' | ' + (r.pairing.weight || 'ad-hoc')
      + ' | ' + r.summary.n
      + ' | ' + r.summary.dnfCount + '/' + r.summary.n
      + ' | ' + fmtTime(r.summary.p10_s)
      + ' | ' + fmtTime(r.summary.p50_s)
      + ' | ' + fmtTime(r.summary.p90_s)
      + ' | ' + driftStr
      + ' | ' + bandStr
      + ' | ' + kind + ' |');
  }
  lines.push('');

  // Anomalies / flags — drift breaches surface only for pairings where drift applies.
  lines.push('## Anomalies / flags');
  lines.push('');
  const flags = [];
  for (const r of results) {
    const label = r.pairing.timing + ' × ' + r.pairing.buyer;
    if (r.summary.lowConfidence) {
      flags.push('- ' + label + ': low-confidence (DNF ' + (r.summary.dnfRate * 100).toFixed(0) + '% > 50%; percentiles read off <half the population)');
    }
    if (r.summary.driftApplies && r.summary.totalDriftFlag && r.summary.totalDriftFlag !== 'within' && r.summary.totalDriftFlag !== 'low-confidence') {
      flags.push('- ' + label + ' total: drift ' + fmtDriftPct(r.summary.totalDriftPct) + ' [' + r.summary.totalDriftFlag + ']');
    }
    if (r.summary.driftApplies) {
      for (let t = 1; t <= targetTier; t++) {
        const pt = r.summary.perTier[t];
        if (pt && pt.driftFlag && pt.driftFlag !== 'within' && pt.driftFlag !== 'low-confidence') {
          flags.push('- ' + label + ' T' + t + ': p50 ' + fmtTime(pt.p50) + ' vs target ' + fmtTargetRange(pt.target) + ' → ' + fmtDriftPct(pt.driftPct) + ' [' + pt.driftFlag + ']');
        }
      }
    }
    if (r.summary.dnfCount > 0 && !r.summary.lowConfidence) {
      // S4: include DNF-by-reason breakdown in the anomaly line so sim-tuner
      // can read "budget-exhausted=3, stuck-no-progress=1" at a glance.
      const reasons = r.summary.dnfByReason
        ? Object.keys(r.summary.dnfByReason).sort().map(k => k + '=' + r.summary.dnfByReason[k]).join(', ')
        : (r.runs.find(rr => rr.dnf) || {}).dnfReason;
      flags.push('- ' + label + ' DNFs: ' + r.summary.dnfCount + '/' + r.summary.n + '  (' + reasons + ')');
    }
    // S4: flag below-band tiers across ANY pairing (drift gating doesn't
    // apply here — mass-band is calibrated against bot reference, which is
    // defined for every mode regardless of timing profile).
    for (let t = 1; t <= targetTier; t++) {
      const pt = r.summary.perTier[t];
      if (pt && pt.bandFlag === 'below-band') {
        flags.push('- ' + label + ' T' + t + ' mass band: ratio p50 ' + fmtRatio(pt.massRatioP50)
          + ' < ' + r.summary.massBandLow + ' [below-band]');
      }
    }
  }
  if (flags.length === 0) {
    lines.push('- (none flagged)');
  } else {
    flags.forEach(f => lines.push(f));
  }
  lines.push('');

  lines.push('## What to do next');
  lines.push('');
  lines.push('- Drift signals on primary pairings drive sim-tuner retune (post-v1 workstream).');
  lines.push('- Secondary / stress / legacy pairings inform — they are not calibration targets.');
  lines.push('- S4 formalizes mass-target band + DNF rules.');
  lines.push('- S5 adds top-down/mid-tier-seeded runs (depends on E4).');
  lines.push('- S6 runs the baseline sweep + retune recommendations.');
  lines.push('');

  return lines.join('\n') + '\n';
}

// Detailed per-tier breakdown for a primary pairing.
function writePrimaryPairingSection(lines, r, targetTier) {
  lines.push('### ' + r.pairing.timing + ' × ' + r.pairing.buyer + ' (N=' + r.runs.length + ', mode=' + r.summary.mode + ')');
  lines.push('');
  const dnfLine = '- DNF: ' + r.summary.dnfCount + '/' + r.summary.n
    + (r.summary.lowConfidence ? '  **low-confidence (DNF > 50%)**' : '');
  // S4: append DNF-by-reason breakdown when there are DNFs.
  if (r.summary.dnfCount > 0 && r.summary.dnfByReason) {
    const reasons = Object.keys(r.summary.dnfByReason).sort()
      .map(k => k + '=' + r.summary.dnfByReason[k]).join(', ');
    lines.push(dnfLine + '  (' + reasons + ')');
  } else {
    lines.push(dnfLine);
  }
  lines.push('- Time to complete target tier p10 / p50 / p90: ' + fmtTime(r.summary.p10_s) + ' / ' + fmtTime(r.summary.p50_s) + ' / ' + fmtTime(r.summary.p90_s));
  if (r.summary.totalTarget) {
    lines.push('- Total target range: ' + fmtTargetRange(r.summary.totalTarget) + '  →  drift ' + fmtDriftPct(r.summary.totalDriftPct) + '  [' + (r.summary.totalDriftFlag || '—') + ']');
  }
  if (r.summary.activeP50_s != null) {
    lines.push('- Active engagement p10 / p50 / p90: ' + fmtTime(r.summary.activeP10_s) + ' / ' + fmtTime(r.summary.activeP50_s) + ' / ' + fmtTime(r.summary.activeP90_s));
  }
  lines.push('');
  lines.push('| Tier | p50 calendar | p10 / p90 | Target | Drift | Flag | Mass p50 / Ref | Ratio p50 | Band |');
  lines.push('|---|---|---|---|---|---|---|---|---|');
  for (let t = 1; t <= targetTier; t++) {
    const pt = r.summary.perTier[t];
    if (!pt || pt.n === 0) {
      lines.push('| T' + t + ' | — | — / — | ' + fmtTargetRange(pt && pt.target) + ' | — | (no data) | — | — | — |');
      continue;
    }
    // S4: per-tier exit-mass median (derived from runs with non-null
    // perTierExitMass[t]). For readability we show "p50_mass / reference".
    const refMass = pt.referenceMass;
    const massP50 = pt.massRatioP50 != null && refMass != null
      ? pt.massRatioP50 * refMass : null;
    lines.push('| T' + t + ' | ' + fmtTime(pt.p50) + ' | ' + fmtTime(pt.p10) + ' / ' + fmtTime(pt.p90)
      + ' | ' + fmtTargetRange(pt.target) + ' | ' + fmtDriftPct(pt.driftPct) + ' | ' + (pt.driftFlag || '—')
      + ' | ' + fmtMass(massP50) + ' / ' + fmtMass(refMass)
      + ' | ' + fmtRatio(pt.massRatioP50)
      + ' | ' + (pt.bandFlag || '—') + ' |');
  }
  lines.push('');
}

// Compact summary table for a weight group (non-primary).
function writeWeightSummaryTable(lines, group, targetTier) {
  lines.push('| Pairing | Mode | N | DNF | p10 | p50 | p90 | Drift | T' + targetTier + ' mass ratio | Conf |');
  lines.push('|---|---|---|---|---|---|---|---|---|---|');
  for (const r of group) {
    const driftStr = r.summary.driftApplies
      ? (r.summary.totalDriftFlag
          ? fmtDriftPct(r.summary.totalDriftPct) + ' [' + r.summary.totalDriftFlag + ']'
          : '—')
      : 'n/a';
    const conf = r.summary.lowConfidence ? 'low' : 'ok';
    // S4: surface the target-tier mass ratio so non-primary pairings still
    // get a quick "did this player exit T_target with enough mass" read.
    const targetPt = r.summary.perTier[targetTier];
    const massRatio = (targetPt && targetPt.massRatioP50 != null)
      ? fmtRatio(targetPt.massRatioP50) + ' [' + (targetPt.bandFlag || '—') + ']'
      : '—';
    lines.push('| ' + r.pairing.timing + ' × ' + r.pairing.buyer
      + ' | ' + r.summary.mode
      + ' | ' + r.summary.n
      + ' | ' + r.summary.dnfCount + '/' + r.summary.n
      + ' | ' + fmtTime(r.summary.p10_s)
      + ' | ' + fmtTime(r.summary.p50_s)
      + ' | ' + fmtTime(r.summary.p90_s)
      + ' | ' + driftStr
      + ' | ' + massRatio
      + ' | ' + conf + ' |');
  }
  lines.push('');
}

function makeRawCsv(results) {
  // Determine the union of tiers seen across all runs to size per-tier columns.
  let maxTier = 0;
  for (const r of results) {
    for (const run of r.runs) {
      if (run.finalTier != null) maxTier = Math.max(maxTier, run.finalTier);
      if (run.perTierEntrySec) {
        for (const k of Object.keys(run.perTierEntrySec)) {
          maxTier = Math.max(maxTier, parseInt(k, 10));
        }
      }
    }
  }
  maxTier = Math.max(maxTier, 1);

  const headerCols = ['pairing_id', 'timing', 'buyer', 'mode', 'run_idx', 'kind',
    'total_calendar_s', 'total_active_s', 'final_tier', 'dnf', 'dnf_reason_category',
    'dnf_reason', 'final_mass'];
  for (let t = 1; t <= maxTier; t++) headerCols.push('t' + t + '_entry_s');
  for (let t = 1; t <= maxTier; t++) headerCols.push('t' + t + '_active_s');
  // S4: per-tier exit mass for spreadsheet drilling.
  for (let t = 1; t <= maxTier; t++) headerCols.push('t' + t + '_exit_mass');

  const rows = [headerCols.join(',')];
  for (const r of results) {
    const mode = r.summary && r.summary.mode || '';
    r.runs.forEach((run, idx) => {
      const cols = [
        r.pairing.id, r.pairing.timing, r.pairing.buyer, mode, idx,
        run.kind || '',
        run.totalCalendarSec == null ? '' : run.totalCalendarSec.toFixed(2),
        run.totalActiveSec == null ? '' : run.totalActiveSec.toFixed(2),
        run.finalTier == null ? '' : run.finalTier,
        run.dnf ? 'Y' : 'N',
        run.dnfReasonCategory || '',
        (run.dnfReason || '').replace(/,/g, ';'),
        run.finalMass == null ? '' : run.finalMass.toFixed(2),
      ];
      for (let t = 1; t <= maxTier; t++) {
        const v = run.perTierEntrySec ? run.perTierEntrySec[t] : null;
        cols.push(v == null ? '' : v.toFixed(2));
      }
      for (let t = 1; t <= maxTier; t++) {
        const v = run.perTierActiveSec ? run.perTierActiveSec[t] : null;
        cols.push(v == null ? '' : v.toFixed(2));
      }
      for (let t = 1; t <= maxTier; t++) {
        const v = run.perTierExitMass ? run.perTierExitMass[t] : null;
        cols.push(v == null ? '' : v.toExponential(4));
      }
      rows.push(cols.join(','));
    });
  }
  return rows.join('\n') + '\n';
}

function writeReport(results, args, targetTier) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.resolve(__dirname, '..', '..', '..', 'Simulator', 'reports', ts);
  fs.mkdirSync(dir, { recursive: true });
  const mdPath = path.join(dir, 'report.md');
  const csvPath = path.join(dir, 'raw.csv');
  fs.writeFileSync(mdPath, makeReportMarkdown(results, args, targetTier), 'utf8');
  fs.writeFileSync(csvPath, makeRawCsv(results), 'utf8');
  return { dir, mdPath, csvPath };
}

// -----------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv);
  if (args.help) { printHelp(); return 0; }
  if (args.list) { listPairings(); return 0; }

  const targetTier = parseTargetTier(args.target);
  let runList;
  try {
    runList = buildRunList(args);
  } catch (e) {
    console.error('ERROR: ' + (e && e.message || String(e)));
    return 2;
  }

  if (runList.length === 0) {
    console.error('No pairings selected.');
    return 2;
  }

  console.log('Long-burn harness — target T' + targetTier + ', pairings: ' + runList.length);
  if (args.seed != null) console.log('  seed: ' + args.seed);
  if (args.maxDays != null) console.log('  max-days: ' + args.maxDays);
  console.log('');

  const results = [];
  for (const pairing of runList) {
    const t0 = Date.now();
    const result = runPairing(pairing, targetTier, args);
    const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
    const s = result.summary;
    const kind = (result.runs[0] && result.runs[0].kind) || '—';
    console.log('  ' + pairing.id + '  ' +
      (pairing.timing + ' × ' + pairing.buyer).padEnd(50) +
      '  N=' + String(s.n).padStart(2) +
      '  DNF=' + String(s.dnfCount).padStart(2) +
      '  p50=' + (fmtTime(s.p50_s) || '—').padStart(8) +
      '  [' + kind + ', ' + elapsed + 's]');
    results.push(result);
  }
  console.log('');

  if (args.report) {
    const out = writeReport(results, args, targetTier);
    console.log('Report written:');
    console.log('  ' + out.mdPath);
    console.log('  ' + out.csvPath);
  } else {
    console.log('(--report omitted; numbers above are the only output)');
  }
  return 0;
}

if (require.main === module) {
  const code = main();
  process.exit(code);
}

module.exports = {
  parseArgs,
  parseTargetTier,
  buildRunList,
  runPairing,
  summarizeRuns,
  makeReportMarkdown,
  makeRawCsv,
};
