// Dark Filaments — calibration harness CLI-plumbing (test support, ported).
//
// The prototype's Prototype/src/test/harness.js is the Node CLI: argument
// parsing, run-list construction, and the markdown/CSV report writers. The
// scaffold does NOT port the calibration UI (scaffold plan §11 — the prototype
// keeps its calibration tool). But profiles_smoke.test.ts asserts against these
// functions (396 checks), so the pure CLI-plumbing + report writers port here
// as a test-support module. The simulation core (runPairing / summarizeRuns)
// binds from the engine's sweep.ts; file I/O (writeReport) is intentionally
// dropped — the tests only exercise makeReportMarkdown / makeRawCsv as strings.
//
// Every value/format preserved verbatim from harness.js so the smoke assertions
// (section headers, "no exclamation points", 17-row CSV, etc.) hold byte-for-byte.

import * as sweep from '../../engine/sweep';
import * as profiles from '../../engine/profiles';
import { UPGRADES } from '../../engine/data';
import type { Pairing } from '../../engine/profiles';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const DEFAULT_MASS_BAND_LOW = sweep.DEFAULT_MASS_BAND_LOW;
const SEC_PER_DAY = sweep.SEC_PER_DAY;

export const runPairing = sweep.runPairing;
export const summarizeRuns = sweep.summarizeRuns;

// -----------------------------------------------------------------------
// CLI argument parsing
// -----------------------------------------------------------------------

export interface HarnessArgs {
  pairing: string | null;
  timing: string | null;
  buyer: string | null;
  n: number | null;
  target: string | null;
  report: boolean;
  primaryOnly: boolean;
  seed: number | null;
  maxDays: number | null;
  massBandLow: number | null;
  list: boolean;
  help: boolean;
}

export function parseArgs(argv: string[]): HarnessArgs {
  const out: HarnessArgs = {
    pairing: null,
    timing: null,
    buyer: null,
    n: null,
    target: null,
    report: false,
    primaryOnly: false,
    seed: null,
    maxDays: null,
    massBandLow: null,
    list: false,
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

// -----------------------------------------------------------------------
// Target-tier parsing
// -----------------------------------------------------------------------

export function parseTargetTier(target: string | null): number {
  if (!target) {
    return Math.max(...UPGRADES.map(u => (u.tier == null ? 1 : u.tier)));
  }
  const m = String(target).toLowerCase().match(/t?(\d+)/);
  if (!m) throw new Error('cannot parse --target: ' + target);
  return parseInt(m[1], 10);
}

// -----------------------------------------------------------------------
// Run-list construction
// -----------------------------------------------------------------------

export function buildRunList(args: HarnessArgs): Pairing[] {
  let pairings: Pairing[];
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
// Report writers (preserved verbatim from harness.js)
// -----------------------------------------------------------------------

function fmtTime(s: number | null | undefined): string {
  if (s == null || !Number.isFinite(s)) return '—';
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
  const days = total / SEC_PER_DAY;
  if (days >= 10) return days.toFixed(1) + 'd';
  const d = Math.floor(days);
  const h = Math.floor((total - d * SEC_PER_DAY) / 3600);
  return d + 'd ' + h + 'h';
}

function fmtTargetRange(tgt: Any): string {
  if (!tgt) return '—';
  return fmtTime(tgt.low) + ' - ' + fmtTime(tgt.high);
}

function fmtDriftPct(p: number | null): string {
  if (p == null) return '—';
  const sign = p >= 0 ? '+' : '';
  return sign + (p * 100).toFixed(1) + '%';
}

function fmtRatio(r: number | null): string {
  if (r == null) return '—';
  return r.toFixed(2) + '×';
}

function fmtMass(m: number | null): string {
  if (m == null || !Number.isFinite(m)) return '—';
  if (Math.abs(m) >= 1e6) {
    return m.toExponential(2);
  }
  return Math.round(m).toString();
}

export function makeReportMarkdown(results: Any[], args: HarnessArgs, targetTier: number): string {
  const lines: string[] = [];
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
  const dnfTotalsByReason: Record<string, number> = {};
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
  const usedMassBandLow = (args && args.massBandLow != null && Number.isFinite(args.massBandLow))
    ? args.massBandLow : DEFAULT_MASS_BAND_LOW;
  lines.push('- Mass-band-low: ' + usedMassBandLow + ' (per-tier exit mass / bot reference; below = below-band flag)');
  lines.push('');

  const byWeight: Record<string, Any[]> = { primary: [], secondary: [], stress: [], legacy: [], 'ad-hoc': [] };
  for (const r of results) {
    const w = r.pairing.weight || 'ad-hoc';
    if (!byWeight[w]) byWeight[w] = [];
    byWeight[w].push(r);
  }

  if (byWeight.primary.length > 0) {
    lines.push('## Primary pairings (calibration-deciding)');
    lines.push('');
    lines.push('Drift detection: ±15% from per-tier target midpoint (engineering plan §4 C6). Primary pairings drive the retune; secondary / stress / legacy are informational.');
    lines.push('');
    for (const r of byWeight.primary) {
      writePrimaryPairingSection(lines, r, targetTier);
    }
  }

  if (byWeight.secondary.length > 0) {
    lines.push('## Secondary pairings (informational; primary is gating)');
    lines.push('');
    writeWeightSummaryTable(lines, byWeight.secondary, targetTier);
  }

  if (byWeight.stress.length > 0) {
    lines.push('## Stress pairings (adversarial profiles; high-DNF expected)');
    lines.push('');
    writeWeightSummaryTable(lines, byWeight.stress, targetTier);
  }

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

  lines.push('## Anomalies / flags');
  lines.push('');
  const flags: string[] = [];
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
      const reasons = r.summary.dnfByReason
        ? Object.keys(r.summary.dnfByReason).sort().map(k => k + '=' + r.summary.dnfByReason[k]).join(', ')
        : (r.runs.find((rr: Any) => rr.dnf) || {}).dnfReason;
      flags.push('- ' + label + ' DNFs: ' + r.summary.dnfCount + '/' + r.summary.n + '  (' + reasons + ')');
    }
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

function writePrimaryPairingSection(lines: string[], r: Any, targetTier: number): void {
  lines.push('### ' + r.pairing.timing + ' × ' + r.pairing.buyer + ' (N=' + r.runs.length + ', mode=' + r.summary.mode + ')');
  lines.push('');
  const dnfLine = '- DNF: ' + r.summary.dnfCount + '/' + r.summary.n
    + (r.summary.lowConfidence ? '  **low-confidence (DNF > 50%)**' : '');
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

function writeWeightSummaryTable(lines: string[], group: Any[], targetTier: number): void {
  lines.push('| Pairing | Mode | N | DNF | p10 | p50 | p90 | Drift | T' + targetTier + ' mass ratio | Conf |');
  lines.push('|---|---|---|---|---|---|---|---|---|---|');
  for (const r of group) {
    const driftStr = r.summary.driftApplies
      ? (r.summary.totalDriftFlag
          ? fmtDriftPct(r.summary.totalDriftPct) + ' [' + r.summary.totalDriftFlag + ']'
          : '—')
      : 'n/a';
    const conf = r.summary.lowConfidence ? 'low' : 'ok';
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

export function makeRawCsv(results: Any[]): string {
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
  for (let t = 1; t <= maxTier; t++) headerCols.push('t' + t + '_exit_mass');

  const rows = [headerCols.join(',')];
  for (const r of results) {
    const mode = (r.summary && r.summary.mode) || '';
    r.runs.forEach((run: Any, idx: number) => {
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
