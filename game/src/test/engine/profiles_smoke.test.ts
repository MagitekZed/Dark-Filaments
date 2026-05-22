// Dark Filaments — profile catalog + harness smoke (Vitest port).
//
// Ported from Prototype/src/test/profiles_smoke.js (scaffold plan §5.2),
// byte-identical assertion values. require('../sim/X.js') side-effect loads
// replaced with engine imports; require('./harness.js') replaced with the
// ported test-support _harness module (CLI plumbing + report writers, sim core
// bound from engine/sweep). The check() accumulator collects every original
// check; a final test asserts the count == 396 (locked spec count, unchanged).
//
// Covers: catalog integrity (6 timing × 4 buyer × 17 pairings), lookup helpers,
// activePhaseForDay, CLI arg parsing, ENGAGED_TARGETS integrity, drift gating,
// RNG determinism, the 17-pairing end-to-end smoke (markdown + CSV), and the
// ad-hoc --timing/--buyer pairing path.

import { describe, it, expect } from 'vitest';
import * as profiles from '../../engine/profiles';
import * as harness from './_harness';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

interface CheckResult { name: string; ok: boolean; detail: string }
const RESULTS: CheckResult[] = [];
function check(name: string, ok: boolean, detail?: string): void {
  RESULTS.push({ name, ok: !!ok, detail: detail || '' });
}

// -----------------------------------------------------------------------
// 1. Catalog integrity
// -----------------------------------------------------------------------
{
  const timingNames = Object.keys(profiles.TIMING_PROFILES);
  const buyerNames = Object.keys(profiles.BUYER_PROFILES);
  check('catalog: 6 timing profiles', timingNames.length === 6, 'got ' + timingNames.length);
  check('catalog: 4 buyer profiles', buyerNames.length === 4, 'got ' + buyerNames.length);
  check('catalog: 17 realistic pairings', profiles.REALISTIC_PAIRINGS.length === 17,
    'got ' + profiles.REALISTIC_PAIRINGS.length);

  const VALID_WEIGHTS = ['primary', 'secondary', 'stress', 'floor', 'legacy'];
  for (const p of profiles.REALISTIC_PAIRINGS) {
    check('pairing ' + p.id + ': timing "' + p.timing + '" known',
      timingNames.indexOf(p.timing) !== -1);
    check('pairing ' + p.id + ': buyer "' + p.buyer + '" known',
      buyerNames.indexOf(p.buyer) !== -1);
    check('pairing ' + p.id + ': has positive N',
      Number.isFinite(p.n) && p.n > 0, 'n=' + p.n);
    check('pairing ' + p.id + ': has valid weight',
      VALID_WEIGHTS.indexOf(p.weight) !== -1, 'weight=' + p.weight);
  }

  check('catalog: exactly 4 primary pairings',
    profiles.REALISTIC_PAIRINGS.filter(p => p.weight === 'primary').length === 4);
  check('catalog: exactly 8 secondary pairings',
    profiles.REALISTIC_PAIRINGS.filter(p => p.weight === 'secondary').length === 8);
  check('catalog: exactly 2 stress pairings',
    profiles.REALISTIC_PAIRINGS.filter(p => p.weight === 'stress').length === 2);
  check('catalog: exactly 2 floor pairings',
    profiles.REALISTIC_PAIRINGS.filter(p => p.weight === 'floor').length === 2);
  check('catalog: exactly 1 legacy pairing',
    profiles.REALISTIC_PAIRINGS.filter(p => p.weight === 'legacy').length === 1);

  for (const name of timingNames) {
    const t = profiles.TIMING_PROFILES[name];
    if (t.continuous) {
      check('timing ' + name + ': continuous has cpm',
        Number.isFinite(t.cpm) && (t.cpm as number) > 0);
      check('timing ' + name + ': continuous has no phases', t.phases == null);
    } else {
      check('timing ' + name + ': trajectory has phases array',
        Array.isArray(t.phases) && (t.phases as Any[]).length > 0);
      for (const phase of (t.phases as Any[])) {
        check('timing ' + name + ' phase ' + phase.label + ': has fromDay',
          Number.isFinite(phase.fromDay));
        check('timing ' + name + ' phase ' + phase.label + ': has toDay',
          Number.isFinite(phase.toDay) || phase.toDay === Infinity);
        check('timing ' + name + ' phase ' + phase.label + ': has checkInsPerDay',
          Number.isFinite(phase.checkInsPerDay) && phase.checkInsPerDay >= 0);
        check('timing ' + name + ' phase ' + phase.label + ': has sessionMinutes',
          Number.isFinite(phase.sessionMinutes) && phase.sessionMinutes >= 0);
        check('timing ' + name + ' phase ' + phase.label + ': has cpm',
          Number.isFinite(phase.cpm) && phase.cpm >= 0);
        check('timing ' + name + ' phase ' + phase.label + ': fromDay <= toDay',
          phase.fromDay <= phase.toDay);
      }
    }
  }

  const VALID_PATHS = ['completion', 'threshold'];
  for (const name of buyerNames) {
    const b = profiles.BUYER_PROFILES[name] as Any;
    check('buyer ' + name + ': path in {completion, threshold}',
      VALID_PATHS.indexOf(b.path) !== -1, 'path=' + b.path);
    check('buyer ' + name + ': has saveVpcThreshold',
      Number.isFinite(b.saveVpcThreshold) && b.saveVpcThreshold > 0);
    check('buyer ' + name + ': no completionistAggressiveness',
      b.completionistAggressiveness == null);
    check('buyer ' + name + ': no inSessionPurchases',
      b.inSessionPurchases == null);
  }

  check('buyer comp-hoarder: saveVpc=2.5',
    profiles.BUYER_PROFILES['comp-hoarder'].saveVpcThreshold === 2.5);
  check('buyer comp-rusher: saveVpc=1.2',
    profiles.BUYER_PROFILES['comp-rusher'].saveVpcThreshold === 1.2);
  check('buyer thr-hoarder: saveVpc=2.5',
    profiles.BUYER_PROFILES['thr-hoarder'].saveVpcThreshold === 2.5);
  check('buyer thr-rusher: saveVpc=1.2',
    profiles.BUYER_PROFILES['thr-rusher'].saveVpcThreshold === 1.2);
}

// -----------------------------------------------------------------------
// 2. Lookup helpers
// -----------------------------------------------------------------------
{
  check('lookupPairing: by id "p1"',
    !!profiles.lookupPairing('p1') && profiles.lookupPairing('p1')!.id === 'p1');
  check('lookupPairing: by name "realistic-engaged-x-comp-hoarder"',
    !!profiles.lookupPairing('realistic-engaged-x-comp-hoarder') &&
    profiles.lookupPairing('realistic-engaged-x-comp-hoarder')!.id === 'p1');
  check('lookupPairing: unknown -> null',
    profiles.lookupPairing('nope') === null);
  check('lookupPairing: empty -> null',
    profiles.lookupPairing('') === null);

  const prim = profiles.primaryPairings();
  check('primaryPairings: returns 4 entries', prim.length === 4);
  check('primaryPairings: all weight=primary',
    prim.every(p => p.weight === 'primary'));
  check('primaryPairings: all use realistic-engaged',
    prim.every(p => p.timing === 'realistic-engaged'));
}

// -----------------------------------------------------------------------
// 3. activePhaseForDay helper
// -----------------------------------------------------------------------
{
  const engaged = profiles.TIMING_PROFILES['realistic-engaged'];
  const ph1 = profiles.activePhaseForDay(engaged, 0);
  check('phase day 0: returns onboard', !!ph1 && ph1.label === 'onboard');
  const ph1b = profiles.activePhaseForDay(engaged, 1/48);
  check('phase day 30min: still onboard', !!ph1b && ph1b.label === 'onboard');

  const ph2 = profiles.activePhaseForDay(engaged, 0.5);
  check('phase day 0.5: same-day', !!ph2 && ph2.label === 'same-day');

  const ph3 = profiles.activePhaseForDay(engaged, 2);
  check('phase day 2: peak', !!ph3 && ph3.label === 'peak');

  const ph4 = profiles.activePhaseForDay(engaged, 5);
  check('phase day 5: routine', !!ph4 && ph4.label === 'routine');

  const ph5 = profiles.activePhaseForDay(engaged, 14);
  check('phase day 14: taper', !!ph5 && ph5.label === 'taper');

  const ph6 = profiles.activePhaseForDay(engaged, 30);
  check('phase day 30: drift', !!ph6 && ph6.label === 'drift');

  const hyper = profiles.TIMING_PROFILES['hyper-onboard'];
  const hyp0 = profiles.activePhaseForDay(hyper, 0);
  check('hyper-onboard day 0: onboard', !!hyp0 && hyp0.label === 'onboard');
  const hyp1 = profiles.activePhaseForDay(hyper, 0.5);
  check('hyper-onboard day 0.5: no active phase (player stopped)', hyp1 === null);

  const bot = profiles.TIMING_PROFILES['bot-60cpm'];
  check('bot-60cpm has continuous=true', bot.continuous === true);
  check('bot-60cpm has no phases', bot.phases == null);
  check('activePhaseForDay(bot, anything): null', profiles.activePhaseForDay(bot, 5) === null);
}

// -----------------------------------------------------------------------
// 4. CLI arg parsing
// -----------------------------------------------------------------------
{
  const a1 = harness.parseArgs(['node', 'harness.js']);
  check('parseArgs: defaults', !a1.help && !a1.report && a1.pairing === null);

  const a2 = harness.parseArgs(['node', 'harness.js', '--report', '--n', '5', '--target', 't3']);
  check('parseArgs: --report true', a2.report === true);
  check('parseArgs: --n 5', a2.n === 5);
  check('parseArgs: --target t3', a2.target === 't3');

  const a3 = harness.parseArgs(['node', 'harness.js', '--pairing=p2', '--primary-only']);
  check('parseArgs: --pairing=p2 (equals form)', a3.pairing === 'p2');
  check('parseArgs: --primary-only', a3.primaryOnly === true);

  const a4 = harness.parseArgs(['node', 'harness.js', '--seed', '42']);
  check('parseArgs: --seed 42', a4.seed === 42);

  const a5 = harness.parseArgs(['node', 'harness.js', '--max-days', '7']);
  check('parseArgs: --max-days 7', a5.maxDays === 7);

  const a6 = harness.parseArgs(['node', 'harness.js', '--mass-band-low', '0.5']);
  check('parseArgs: --mass-band-low 0.5', a6.massBandLow === 0.5);

  check('parseTargetTier: t4 -> 4', harness.parseTargetTier('t4') === 4);
  check('parseTargetTier: 3 -> 3', harness.parseTargetTier('3') === 3);
  check('parseTargetTier: null defaults to MAX_TIER (5 today)',
    harness.parseTargetTier(null) === 5);
}

// -----------------------------------------------------------------------
// 5. ENGAGED_TARGETS catalog integrity
// -----------------------------------------------------------------------
{
  check('targets: completion + threshold modes',
    !!(profiles.ENGAGED_TARGETS.completion && profiles.ENGAGED_TARGETS.threshold));
  for (let t = 1; t <= 10; t++) {
    check('targets.completion T' + t + ': has low+high',
      !!profiles.ENGAGED_TARGETS.completion[t] &&
      Number.isFinite(profiles.ENGAGED_TARGETS.completion[t].low) &&
      Number.isFinite(profiles.ENGAGED_TARGETS.completion[t].high));
    check('targets.threshold T' + t + ': has low+high',
      !!profiles.ENGAGED_TARGETS.threshold[t] &&
      Number.isFinite(profiles.ENGAGED_TARGETS.threshold[t].low) &&
      Number.isFinite(profiles.ENGAGED_TARGETS.threshold[t].high));
    check('targets.completion T' + t + ': low <= high',
      profiles.ENGAGED_TARGETS.completion[t].low <= profiles.ENGAGED_TARGETS.completion[t].high);
  }
  check('targets.completion T6 PEAK = 5-7 days',
    profiles.ENGAGED_TARGETS.completion[6].low === 5 * 86400 &&
    profiles.ENGAGED_TARGETS.completion[6].high === 7 * 86400);
  check('targets: T10 inversion (Completion shorter than Threshold)',
    profiles.ENGAGED_TARGETS.completion[10].high < profiles.ENGAGED_TARGETS.threshold[10].low);
  check('targets.completion T2 Stellar Neighborhood = 2-8 hours (day-1 bridge slot, post 2026-05-13 afternoon reshape)',
    profiles.ENGAGED_TARGETS.completion[2].low === 2 * 3600 &&
    profiles.ENGAGED_TARGETS.completion[2].high === 8 * 3600);
  check('targets.completion T3 Dwarf Spheroidal = 24-48 hours (first patient-universe return; NEW insertion at ~10^6.5 M☉)',
    profiles.ENGAGED_TARGETS.completion[3].low === 24 * 3600 &&
    profiles.ENGAGED_TARGETS.completion[3].high === 48 * 3600);

  const totalCompT11 = profiles.totalTargetSecondsThroughTier('completion', 11);
  check('totalTargetSecondsThroughTier: completion T11 within 28-42 day band',
    !!totalCompT11 && totalCompT11.low >= 28 * 86400 && totalCompT11.high <= 42 * 86400,
    'low=' + (totalCompT11 && (totalCompT11.low / 86400).toFixed(1)) + 'd high=' + (totalCompT11 && (totalCompT11.high / 86400).toFixed(1)) + 'd');
  const totalThrT11 = profiles.totalTargetSecondsThroughTier('threshold', 11);
  check('totalTargetSecondsThroughTier: threshold T11 > completion T11 (inversion)',
    !!totalThrT11 && !!totalCompT11 && totalThrT11.low > totalCompT11.low);
}

// -----------------------------------------------------------------------
// 6. timingHasDriftTarget gates drift detection
// -----------------------------------------------------------------------
{
  check('timingHasDriftTarget: realistic-engaged -> true',
    profiles.timingHasDriftTarget('realistic-engaged') === true);
  check('timingHasDriftTarget: realistic-moderate -> true',
    profiles.timingHasDriftTarget('realistic-moderate') === true);
  check('timingHasDriftTarget: realistic-casual -> false',
    profiles.timingHasDriftTarget('realistic-casual') === false);
  check('timingHasDriftTarget: realistic-drift -> false',
    profiles.timingHasDriftTarget('realistic-drift') === false);
  check('timingHasDriftTarget: hyper-onboard -> false',
    profiles.timingHasDriftTarget('hyper-onboard') === false);
  check('timingHasDriftTarget: bot-60cpm -> false',
    profiles.timingHasDriftTarget('bot-60cpm') === false);
  check('timingHasDriftTarget: empty / null -> false',
    profiles.timingHasDriftTarget('') === false &&
    profiles.timingHasDriftTarget(null) === false);
}

// -----------------------------------------------------------------------
// 7. RNG determinism (same seed -> same result)
// -----------------------------------------------------------------------
{
  const p = profiles.lookupPairing('p1')!;
  const args = harness.parseArgs(['node', 'h.js', '--seed', '12345', '--n', '1', '--target', 't1', '--max-days', '7']);
  const r1 = harness.runPairing(Object.assign({}, p, { n: 1 }), 1, args);
  const r2 = harness.runPairing(Object.assign({}, p, { n: 1 }), 1, args);
  check('determinism: same seed -> same totalCalendarSec',
    r1.runs[0].totalCalendarSec === r2.runs[0].totalCalendarSec,
    'r1=' + r1.runs[0].totalCalendarSec + ' r2=' + r2.runs[0].totalCalendarSec);
  check('determinism: same seed -> same finalTier',
    r1.runs[0].finalTier === r2.runs[0].finalTier);

  const args3 = harness.parseArgs(['node', 'h.js', '--seed', '99999', '--n', '1', '--target', 't1', '--max-days', '7']);
  const r3 = harness.runPairing(Object.assign({}, p, { n: 1 }), 1, args3);
  check('determinism: different seed -> result still well-formed',
    typeof r3.runs[0].totalCalendarSec === 'number' || r3.runs[0].totalCalendarSec === null);
}

// -----------------------------------------------------------------------
// 8. End-to-end smoke: all 17 pairings, N=1, target=T1, max-days=7
// -----------------------------------------------------------------------
{
  const args = harness.parseArgs(['node', 'harness.js', '--n', '1', '--seed', '7', '--target', 't1', '--max-days', '7']);
  const runList = harness.buildRunList(args);
  check('buildRunList: 17 pairings at default', runList.length === 17);

  const results: Any[] = [];
  let crashed = false;
  for (const p of runList) {
    try {
      const r = harness.runPairing(p, 1, args);
      results.push(r);
    } catch (e) {
      crashed = true;
      console.error('CRASH on pairing ' + p.id + ': ' + (e && (e as Error).message) + '\n' + (e && (e as Error).stack));
    }
  }
  check('smoke: no pairing crashed', !crashed);
  check('smoke: all 17 pairings produced a result', results.length === 17);

  const p17 = results.find(r => r.pairing.id === 'p17');
  check('smoke: p17 bot-60cpm ran via continuous-bot path',
    p17 && p17.runs[0] && p17.runs[0].kind === 'continuous-bot');
  check('smoke: p17 produced totalCalendarSec',
    p17 && p17.runs[0] && p17.runs[0].totalCalendarSec != null && p17.runs[0].totalCalendarSec > 0);

  const epRuns = results.filter(r => r.runs[0] && r.runs[0].kind === 'engagement-profile');
  check('smoke: 16 engagement-profile pairings ran', epRuns.length === 16);

  const primaryRuns = results.filter(r => r.pairing.weight === 'primary');
  check('smoke: all 4 primary pairings completed T1',
    primaryRuns.every(r => !r.runs[0].dnf));

  for (const r of primaryRuns) {
    check('smoke: ' + r.pairing.id + ' has perPhaseCalendarSec',
      r.runs[0].perPhaseCalendarSec && typeof r.runs[0].perPhaseCalendarSec === 'object');
    check('smoke: ' + r.pairing.id + ' first phase is onboard',
      r.runs[0].perPhaseCalendarSec.onboard != null);
  }

  for (const r of results) {
    check('summary ' + r.pairing.id + ': has counts',
      Number.isFinite(r.summary.n) && Number.isFinite(r.summary.dnfCount));
    check('summary ' + r.pairing.id + ': has perTier object',
      r.summary.perTier && typeof r.summary.perTier === 'object');
  }

  const md = harness.makeReportMarkdown(results, args, 1);
  check('report: markdown nonempty', typeof md === 'string' && md.length > 200);
  check('report: markdown has Headline', md.indexOf('# Long-burn calibration') !== -1);
  check('report: markdown has Primary pairings section',
    md.indexOf('## Primary pairings') !== -1);
  check('report: no exclamation points', md.indexOf('!') === -1);

  const csv = harness.makeRawCsv(results);
  check('report: CSV nonempty', typeof csv === 'string' && csv.length > 100);
  check('report: CSV has header', csv.split('\n')[0].indexOf('pairing_id,timing,buyer') === 0);
  check('report: CSV has 17 data rows (1 per pairing at N=1)',
    csv.split('\n').filter(l => l.length > 0).length === 18);   // 1 header + 17
}

// -----------------------------------------------------------------------
// 9. Drift detection gating
// -----------------------------------------------------------------------
{
  const eArgs = harness.parseArgs(['node', 'h.js', '--seed', '1', '--n', '1', '--target', 't1', '--max-days', '7']);
  const eResult = harness.runPairing(
    Object.assign({}, profiles.lookupPairing('p1')!, { n: 1 }), 1, eArgs);
  check('drift gating: realistic-engaged has driftApplies=true',
    eResult.summary.driftApplies === true);

  const cResult = harness.runPairing(
    Object.assign({}, profiles.lookupPairing('p9')!, { n: 1 }), 1, eArgs);
  check('drift gating: realistic-casual has driftApplies=false',
    cResult.summary.driftApplies === false);

  const mResult = harness.runPairing(
    Object.assign({}, profiles.lookupPairing('p5')!, { n: 1 }), 1, eArgs);
  check('drift gating: realistic-moderate has driftApplies=true',
    mResult.summary.driftApplies === true);
}

// -----------------------------------------------------------------------
// 10. Ad-hoc --timing + --buyer pairing
// -----------------------------------------------------------------------
{
  const args = harness.parseArgs(['node', 'h.js', '--timing', 'realistic-moderate', '--buyer', 'thr-hoarder', '--n', '2']);
  check('parseArgs: --timing realistic-moderate', args.timing === 'realistic-moderate');
  check('parseArgs: --buyer thr-hoarder', args.buyer === 'thr-hoarder');

  const runList = harness.buildRunList(args);
  check('buildRunList: ad-hoc produces 1 pairing', runList.length === 1);
  check('buildRunList: ad-hoc weight is "ad-hoc"', runList[0].weight === 'ad-hoc');

  let threw = false;
  try { harness.buildRunList(harness.parseArgs(['node', 'h.js', '--timing', 'nope', '--buyer', 'comp-hoarder'])); }
  catch { threw = true; }
  check('buildRunList: unknown --timing throws', threw);
  threw = false;
  try { harness.buildRunList(harness.parseArgs(['node', 'h.js', '--timing', 'realistic-engaged', '--buyer', 'nope'])); }
  catch { threw = true; }
  check('buildRunList: unknown --buyer throws', threw);
}

// -----------------------------------------------------------------------
// Surface every collected check as a Vitest test + assert the locked count.
// -----------------------------------------------------------------------
describe('profiles_smoke (ported, locked count 396)', () => {
  it('runs exactly 396 checks (locked spec count, unchanged from prototype)', () => {
    expect(RESULTS.length).toBe(396);
  });
  it.each(RESULTS.map((r, i) => [i, r] as const))('%i: %o', (_i, r) => {
    expect(r.ok, r.name + (r.detail ? '  — ' + r.detail : '')).toBe(true);
  });
});
