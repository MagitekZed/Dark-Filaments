// Dark Filaments — sweep / sim-core
// Long-burn v1, S2-S4 refactor: the simulation core extracted from
// `test/harness.js` so it can be consumed by both the CLI and the browser
// Simulator tab. Pure functions; no CLI plumbing, no file I/O, no report
// writing.
//
// TS port (scaffold plan §5.1): IIFE wrapper + UMD shim stripped; the lazy
// deps()/require() resolution replaced with plain ES imports. Pure data +
// helpers — satisfies engine purity; lives under engine/ alongside profiles.ts.
// Not in the public barrel; the harnesses import it directly. Every numeric
// literal + computation preserved byte-identical.
//
// API surface:
//   runPairing(pairing, targetTier, args)
//   runEngagementProfileRun(pairing, timing, buyer, targetTier, mode, rng, maxDays)
//   runContinuousBotRun(pairing, timing, buyer, targetTier, mode)
//   summarizeRuns(runs, targetTier, mode, pairing, opts)
//   referenceMassForTier(targetTier, mode)
//   referenceMassesThroughTier(targetTier, mode)
//   resetReferenceMassCache()
//   makeRunRng(baseSeed, runIdx)
//   sampleIdleGapSec(timingOrPhase, rng)
//   freshSavedState()
//   sortedAscending(values), pct(sortedAsc, p)
//   Constants: DEFAULT_MASS_BAND_LOW, DRIFT_THRESHOLD,
//   LOW_CONFIDENCE_DNF_RATE, SEC_PER_DAY, DEFAULT_MAX_DAYS

import * as data from './data';
import * as runner from './runner';
import * as offline from './offline';
import * as profiles from './profiles';
import type { Pairing, Phase, TimingProfile, BuyerProfile } from './profiles';

type AnyState = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type Rng = () => number;

// ---- Constants -----------------------------------------------------

export const DEFAULT_MAX_DAYS = 365;
export const SEC_PER_DAY = 86400;
export const DRIFT_THRESHOLD = 0.15;
export const DEFAULT_MASS_BAND_LOW = 0.7;
// Upper threshold for the mass-band flag. Above this, runs are labeled
// `above-band` rather than `within-band` so the user can distinguish
// bot-aligned exits from offline-accumulation overshoots (which the
// long-burn pacing model produces routinely for low-cpm / drift profiles
// that idle for days mid-tier before the next session). Per CLAUDE.md
// "engagement-profile runs commonly overshoot at 100× to 9000× the bot
// reference" — above-band is informational, not a failure. 2.0 chosen
// so typical engaged profiles (which exit close to 1.0× bot reference)
// stay within-band, while accumulation overshoots are surfaced.
export const DEFAULT_MASS_BAND_HIGH = 2.0;
export const LOW_CONFIDENCE_DNF_RATE = 0.5;

// ---- Seedable RNG --------------------------------------------------

function mulberry32(seed: number): Rng {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRunRng(baseSeed: number, runIdx: number): Rng {
  const seed = (baseSeed ^ (runIdx * 0x9E3779B9)) >>> 0;
  return mulberry32(seed || 1);
}

// ---- Bot-reference mass cache (S4) ---------------------------------

const _referenceMassCache = new Map<string, number | null>();

export function resetReferenceMassCache(): void {
  _referenceMassCache.clear();
}

export function referenceMassForTier(targetTier: number, mode: string): number | null {
  const key = mode + ':' + targetTier;
  if (_referenceMassCache.has(key)) return _referenceMassCache.get(key) as number | null;

  const params = { cpm: 100, engagement: 1.0, saveVpcThreshold: 1.5 };
  let priorFinal: AnyState | null = null;
  let peakAtGate: number | null = null;
  for (let t = 1; t <= targetTier; t++) {
    const scenario: AnyState = { tier: t, mode };
    if (priorFinal) scenario.carryFrom = priorFinal;
    try {
      const result = runner.runSimulation(params, scenario);
      priorFinal = result.finalState;
      // Reading B (apparatus fix 2026-05-13): the bot reference is the peak
      // in-tier mass at the gate-crossing moment, NOT the post-transition
      // exit-tick residual on finalState.mass. headline.peakMass is sampled
      // each tick in runner.js after income, before purchase — so it lands
      // on the pre-commit peak. Both sides of the mass-band ratio now
      // measure the same quantity.
      peakAtGate = result.headline.peakMass;
    } catch {
      peakAtGate = null;
      break;
    }
  }
  _referenceMassCache.set(key, peakAtGate);
  return peakAtGate;
}

export function referenceMassesThroughTier(targetTier: number, mode: string): Record<number, number | null> {
  const out: Record<number, number | null> = {};
  for (let t = 1; t <= targetTier; t++) {
    out[t] = referenceMassForTier(t, mode);
  }
  return out;
}

// ---- Idle-gap sampler ---------------------------------------------

export function sampleIdleGapSec(timing: TimingProfile | Phase, rng: Rng): number {
  if ((timing as TimingProfile).continuous) return 0;
  const meanSec = SEC_PER_DAY / Math.max(0.01, (timing as Phase).checkInsPerDay);
  const u = Math.max(1e-12, rng());
  const raw = -meanSec * Math.log(u);
  const minGap = 5 * 60;
  const maxGap = 14 * SEC_PER_DAY;
  return Math.max(minGap, Math.min(maxGap, raw));
}

// ---- Fresh save state ---------------------------------------------

export function freshSavedState(): AnyState {
  return {
    mass: 0,
    consolidation: 0,
    currentTier: 1,
    levels: Object.fromEntries(data.UPGRADES.map(u => [u.name, 0])),
    carry: { allMps: 1.0, allMpc: 1.0, allAps: 1.0, carryMps: 0, carryMpc: 0, carryAps: 0 },
    consolidationThreshold: 1.0,
    consolidationHitMs: null,
    totalClicks: 0,
    sessionStart: 0,
    totalPausedMs: 0,
    massGainedClicks: 0,
    massGainedPassive: 0,
    massGainedAuto: 0,
    tickCount: 0,
    tierSnapshots: [{
      tier: 1, startMs: 0, thresholdHitMs: null, endMs: null,
      levelsAtEnd: null, massAtEnd: null, consolidationHitMs: null,
    }],
  };
}

// ---- Continuous-bot run (legacy / bot-60cpm cross-check) ----------

export function runContinuousBotRun(
  pairing: Pairing, timing: TimingProfile, buyer: BuyerProfile, targetTier: number, mode: string,
): AnyState {
  const params = {
    cpm: timing.cpm,
    engagement: 1.0,
    saveVpcThreshold: buyer.saveVpcThreshold,
  };
  const perTierEntrySec: Record<number, number> = { 1: 0 };
  const perTierExitMass: Record<number, number> = {};
  let priorFinal: AnyState | null = null;
  let totalSeconds = 0;
  let dnf = false;
  let dnfTier: number | null = null;
  let dnfReason: string | null = null;
  let dnfReasonCategory: string | null = null;

  for (let t = 1; t <= targetTier; t++) {
    const scenario: AnyState = { tier: t, mode };
    if (priorFinal) scenario.carryFrom = priorFinal;
    let result;
    try {
      result = runner.runSimulation(params, scenario);
    } catch (e) {
      dnf = true;
      dnfTier = t;
      dnfReason = 'runner error at T' + t + ': ' + ((e && (e as Error).message) || String(e));
      dnfReasonCategory = 'runner-error';
      break;
    }
    totalSeconds += result.headline.totalTime_s;
    priorFinal = result.finalState;
    // Reading B (apparatus fix 2026-05-13): per-tier mass is the peak-at-gate
    // sample tracked through the runner's tick loop, NOT finalState.mass
    // (which is the post-transition exit-tick residual). Both sides of the
    // mass-band ratio (this pairing's perTierExitMass[t] and the bot
    // reference returned by referenceMassForTier) now measure the same
    // quantity. The CSV column name `t<n>_exit_mass` is preserved for
    // backward compatibility; the semantic is peak-at-gate.
    perTierExitMass[t] = result.headline.peakMass;
    if (t < targetTier) {
      if (!result.headline.transitioned) {
        dnf = true;
        dnfTier = t;
        dnfReason = 'failed to transition out of T' + t + ' (' + result.headline.exitReason + ')';
        dnfReasonCategory = 'incomplete';
        break;
      }
      perTierEntrySec[t + 1] = totalSeconds;
    }
  }

  return {
    pairing: pairing.id,
    timing: pairing.timing,
    buyer: pairing.buyer,
    kind: 'continuous-bot',
    dnf,
    dnfReason,
    dnfReasonCategory,
    finalTier: dnf ? dnfTier : (targetTier + (priorFinal && totalSeconds > 0 ? 1 : 0)),
    totalCalendarSec: dnf ? null : totalSeconds,
    totalActiveSec: dnf ? null : totalSeconds,
    perTierEntrySec,
    perTierActiveSec: Object.assign({}, perTierEntrySec),
    perTierExitMass,
    finalMass: priorFinal ? priorFinal.mass : null,
    buyLog: [],
    milestones: [],
  };
}

// ---- Engagement-profile multi-window loop -------------------------

export function runEngagementProfileRun(
  pairing: Pairing, timing: TimingProfile, buyer: BuyerProfile, targetTier: number,
  mode: string, rng: Rng, maxDays: number,
): AnyState {
  const maxCalendarSec = maxDays * SEC_PER_DAY;
  const allowPurchases = true;

  let state = freshSavedState();
  let calendarSec = 0;
  let activeSec = 0;
  const perTierEntrySec: Record<number, number> = { 1: 0 };
  const perTierActiveSec: Record<number, number> = { 1: 0 };
  const perTierExitMass: Record<number, number> = {};
  const perPhaseCalendarSec: Record<string, number> = {};
  const perPhaseActiveSec: Record<string, number> = {};
  const buyLog: AnyState[] = [];
  const milestones: AnyState[] = [];

  // Browser-facing extra: track peak in-tier mass + per-session mass
  // snapshots so the UI can draw a calendar-time mass chart.
  let peakInTierMass = 0;
  const massTrace: AnyState[] = [{ calendarSec: 0, mass: 0, kind: 'start', tier: 1 }];

  let consecutiveZeroProgress = 0;
  const MAX_ZERO_PROGRESS = 200;
  let firstSession = true;

  while (state.currentTier <= targetTier && calendarSec < maxCalendarSec) {
    const calendarDays = calendarSec / SEC_PER_DAY;
    const phase = profiles.activePhaseForDay(timing, calendarDays);
    if (!phase) break;
    if (phase.checkInsPerDay <= 0 || phase.sessionMinutes <= 0) {
      const skipSec = Math.min(
        (phase.toDay - calendarDays) * SEC_PER_DAY,
        maxCalendarSec - calendarSec,
      );
      if (skipSec <= 0) break;
      const idleResult = offline.reconstructFromOfflineWindow(state, skipSec, {
        cpm: 0, engagement: 1.0, allowPurchases: false,
      });
      state = idleResult.newState;
      calendarSec += skipSec;
      perPhaseCalendarSec[phase.label] = (perPhaseCalendarSec[phase.label] || 0) + skipSec;
      if (state.mass > peakInTierMass) peakInTierMass = state.mass;
      massTrace.push({ calendarSec, mass: state.mass, kind: 'idle-end', tier: state.currentTier, phase: phase.label });
      continue;
    }

    const gapSec = firstSession ? 0 : sampleIdleGapSec(phase, rng);
    firstSession = false;
    if (calendarSec + gapSec >= maxCalendarSec) {
      const finalGap = Math.max(0, maxCalendarSec - calendarSec);
      if (finalGap > 0) {
        const r = offline.reconstructFromOfflineWindow(state, finalGap, {
          cpm: 0, engagement: 1.0, allowPurchases: false,
        });
        state = r.newState;
      }
      calendarSec = maxCalendarSec;
      perPhaseCalendarSec[phase.label] = (perPhaseCalendarSec[phase.label] || 0) + finalGap;
      if (state.mass > peakInTierMass) peakInTierMass = state.mass;
      massTrace.push({ calendarSec, mass: state.mass, kind: 'budget-end', tier: state.currentTier, phase: phase.label });
      break;
    }
    if (gapSec > 0) {
      const idleResult = offline.reconstructFromOfflineWindow(state, gapSec, {
        cpm: 0, engagement: 1.0, allowPurchases: false,
      });
      state = idleResult.newState;
      calendarSec += gapSec;
      perPhaseCalendarSec[phase.label] = (perPhaseCalendarSec[phase.label] || 0) + gapSec;
      if (state.mass > peakInTierMass) peakInTierMass = state.mass;
      massTrace.push({ calendarSec, mass: state.mass, kind: 'session-start', tier: state.currentTier, phase: phase.label });
    }

    if (state.currentTier > targetTier) break;

    const postIdleDays = calendarSec / SEC_PER_DAY;
    const sessionPhase = profiles.activePhaseForDay(timing, postIdleDays) || phase;
    const sessionSec = sessionPhase.sessionMinutes * 60;
    const tierAtStart = state.currentTier;
    const massAtStart = state.mass;
    const sessionResult = offline.reconstructFromOfflineWindow(state, sessionSec, {
      cpm: sessionPhase.cpm,
      engagement: 1.0,
      allowPurchases,
      mode: mode as 'completion' | 'threshold',
      saveVpcThreshold: buyer.saveVpcThreshold,
    });
    state = sessionResult.newState;
    activeSec += sessionSec;
    calendarSec += sessionSec;
    perTierActiveSec[state.currentTier] = (perTierActiveSec[state.currentTier] || 0) + sessionSec;
    perPhaseCalendarSec[sessionPhase.label] = (perPhaseCalendarSec[sessionPhase.label] || 0) + sessionSec;
    perPhaseActiveSec[sessionPhase.label] = (perPhaseActiveSec[sessionPhase.label] || 0) + sessionSec;
    if (state.mass > peakInTierMass) peakInTierMass = state.mass;
    massTrace.push({ calendarSec, mass: state.mass, kind: 'session-end', tier: state.currentTier, phase: sessionPhase.label });

    const sessionStartCalendar = calendarSec - sessionSec;
    for (const m of sessionResult.milestones) {
      const globalSec = sessionStartCalendar + m.tick;
      milestones.push({
        kind: m.kind,
        tier: m.tier,
        name: m.name,
        mass: m.mass != null ? m.mass : null,
        calendarSec: globalSec,
        activeSec: activeSec - sessionSec + m.tick,
        phase: sessionPhase.label,
      });
      if (m.kind === 'tier-up' && m.tier > 1 && perTierEntrySec[m.tier] == null) {
        perTierEntrySec[m.tier] = globalSec;
        if (m.mass != null) perTierExitMass[m.tier - 1] = m.mass;
        // Reset peak in-tier on tier-up so peakInTierMass tracks the
        // FINAL tier reached (or the target tier specifically).
        peakInTierMass = state.mass;
      }
    }
    for (const b of sessionResult.buyLog) {
      buyLog.push({
        kind: b.action,
        upgrade: b.upgrade || null,
        cost: b.cost == null ? null : b.cost,
        tier: b.tier,
        calendarSec: sessionStartCalendar + b.tick,
        phase: sessionPhase.label,
      });
    }

    const tierAdvanced = state.currentTier > tierAtStart;
    const purchaseCount = sessionResult.buyLog.filter(b => b.action === 'buy').length;
    const massDelta = state.mass - massAtStart;
    if (!tierAdvanced && purchaseCount === 0 && massDelta < 1e-6) {
      consecutiveZeroProgress++;
      if (consecutiveZeroProgress >= MAX_ZERO_PROGRESS) break;
    } else {
      consecutiveZeroProgress = 0;
    }

    // One-shot phase cap (2026-05-12): if the phase that just ran is
    // flagged oneShot AND the target tier hasn't been reached yet, idle-
    // skip the remainder of the phase as pure-idle accrual before
    // continuing the loop. This guarantees exactly one session per one-
    // shot phase regardless of where the exponential idle-gap sampler
    // would otherwise have landed, while still letting target-reached
    // runs report the cleanest calendar time (the cap is irrelevant if
    // the run is about to exit on the next while-check).
    //
    // Honors the load-bearing rule "Consolidation does not advance
    // without active purchase decisions" — the skipped time is pure-idle
    // (cpm=0, allowPurchases=false), so no tier transitions or purchases
    // occur. Used today by phase-1 onboarding across all realistic +
    // hyper profiles; can be applied to other phases later if needed.
    //
    // Order matters: this fires AFTER milestone/buyLog processing so the
    // sessionStartCalendar computation reads the pre-cap calendarSec.
    // Otherwise milestones would be globalSec-offset by the cap's idle
    // duration (the bug fixed in this same edit).
    if (sessionPhase.oneShot && state.currentTier <= targetTier) {
      const phaseEndSec = sessionPhase.toDay * SEC_PER_DAY;
      const remainingInPhase = Math.max(0, phaseEndSec - calendarSec);
      const skipSec = Math.min(remainingInPhase, maxCalendarSec - calendarSec);
      if (skipSec > 0) {
        const idleResult = offline.reconstructFromOfflineWindow(state, skipSec, {
          cpm: 0, engagement: 1.0, allowPurchases: false,
        });
        state = idleResult.newState;
        calendarSec += skipSec;
        perPhaseCalendarSec[sessionPhase.label] =
          (perPhaseCalendarSec[sessionPhase.label] || 0) + skipSec;
        if (state.mass > peakInTierMass) peakInTierMass = state.mass;
        massTrace.push({
          calendarSec, mass: state.mass,
          kind: 'oneshot-skip-end', tier: state.currentTier, phase: sessionPhase.label,
        });
      }
    }
  }

  const reachedTarget = state.currentTier > targetTier;
  const calendarBudgetExceeded = calendarSec >= maxCalendarSec;
  const playerStopped = !reachedTarget && !calendarBudgetExceeded
    && consecutiveZeroProgress < MAX_ZERO_PROGRESS;
  const dnf = !reachedTarget;
  let dnfReason: string | null = null;
  let dnfReasonCategory: string | null = null;
  if (dnf) {
    if (calendarBudgetExceeded) {
      dnfReason = 'calendar budget exhausted at T' + state.currentTier;
      dnfReasonCategory = 'budget-exhausted';
    } else if (consecutiveZeroProgress >= MAX_ZERO_PROGRESS) {
      dnfReason = 'stuck at T' + state.currentTier + ' (no progress)';
      dnfReasonCategory = 'stuck-no-progress';
    } else if (playerStopped) {
      dnfReason = 'player stopped checking in at T' + state.currentTier;
      dnfReasonCategory = 'player-stopped';
    } else {
      dnfReason = 'incomplete at T' + state.currentTier;
      dnfReasonCategory = 'incomplete';
    }
  }

  const finalTierForMass = Math.min(state.currentTier, targetTier);
  if (perTierExitMass[finalTierForMass] == null) {
    // Reading B (apparatus fix 2026-05-13): when no tier-up milestone fires
    // for this tier (e.g. DNF mid-tier, or target reached without further
    // transition), fall back to the in-tier peak rather than state.mass
    // (post-purchase exit-tick residual). peakInTierMass is reset on tier-up
    // so it tracks the peak observed in the final tier reached.
    perTierExitMass[finalTierForMass] = peakInTierMass;
  }

  return {
    pairing: pairing.id,
    timing: pairing.timing,
    buyer: pairing.buyer,
    kind: 'engagement-profile',
    dnf,
    dnfReason,
    dnfReasonCategory,
    finalTier: state.currentTier,
    totalCalendarSec: dnf ? null : calendarSec,
    totalActiveSec: dnf ? null : activeSec,
    perTierEntrySec,
    perTierActiveSec,
    perTierExitMass,
    perPhaseCalendarSec,
    perPhaseActiveSec,
    finalMass: state.mass,
    peakInTierMass,
    massTrace,
    buyLog,
    milestones,
  };
}

// ---- Top-level run dispatcher -------------------------------------

export function runPairing(pairing: Pairing, targetTier: number, args: AnyState): AnyState {
  const timing = profiles.TIMING_PROFILES[pairing.timing];
  const buyer = profiles.BUYER_PROFILES[pairing.buyer];
  if (!timing || !buyer) {
    throw new Error('pairing references unknown profile: ' + JSON.stringify(pairing));
  }

  const mode = buyer.path === 'threshold' ? 'threshold' : 'completion';
  const baseSeed = (args && args.seed != null && Number.isFinite(args.seed))
    ? args.seed
    : (Date.now() & 0xFFFFFFFF);
  const maxDays = (args && args.maxDays != null && Number.isFinite(args.maxDays))
    ? args.maxDays
    : DEFAULT_MAX_DAYS;
  const massBandLow = (args && args.massBandLow != null && Number.isFinite(args.massBandLow))
    ? args.massBandLow
    : DEFAULT_MASS_BAND_LOW;
  const massBandHigh = (args && args.massBandHigh != null && Number.isFinite(args.massBandHigh))
    ? args.massBandHigh
    : DEFAULT_MASS_BAND_HIGH;

  const runs: AnyState[] = [];
  for (let i = 0; i < pairing.n; i++) {
    if (timing.continuous) {
      runs.push(runContinuousBotRun(pairing, timing, buyer, targetTier, mode));
    } else {
      const rng = makeRunRng(baseSeed, i);
      runs.push(runEngagementProfileRun(pairing, timing, buyer, targetTier, mode, rng, maxDays));
    }
  }
  return {
    pairing,
    runs,
    summary: summarizeRuns(runs, targetTier, mode, pairing, { massBandLow, massBandHigh }),
  };
}

// ---- Run summarization --------------------------------------------

export function pct(sortedAsc: number[], p: number): number | null {
  if (sortedAsc.length === 0) return null;
  const idx = Math.min(sortedAsc.length - 1, Math.floor(sortedAsc.length * p));
  return sortedAsc[idx];
}

export function sortedAscending(values: Array<number | null | undefined>): number[] {
  return values.filter(v => v != null && Number.isFinite(v)).slice().sort((a, b) => (a as number) - (b as number)) as number[];
}

export function summarizeRuns(
  runs: AnyState[], targetTier: number, mode: string, pairing: Pairing | null, opts?: AnyState,
): AnyState {
  const massBandLow = (opts && opts.massBandLow != null && Number.isFinite(opts.massBandLow))
    ? opts.massBandLow
    : DEFAULT_MASS_BAND_LOW;
  const massBandHigh = (opts && opts.massBandHigh != null && Number.isFinite(opts.massBandHigh))
    ? opts.massBandHigh
    : DEFAULT_MASS_BAND_HIGH;

  const completed = runs.filter(r => !r.dnf);
  const dnfs = runs.filter(r => r.dnf);
  const dnfRate = runs.length > 0 ? dnfs.length / runs.length : 0;
  const lowConfidence = dnfRate > LOW_CONFIDENCE_DNF_RATE;

  const dnfByReason: Record<string, number> = {};
  for (const r of dnfs) {
    const cat = r.dnfReasonCategory || 'unspecified';
    dnfByReason[cat] = (dnfByReason[cat] || 0) + 1;
  }

  // Headline calendar-time percentiles. Semantic = "time to complete the
  // target tier" — measured as the moment `targetTier+1` is entered (a
  // tier-up milestone fires at the transition tick inside the offline
  // runner). This is what gameplay-design.md §1 calls "T_n calendar time"
  // and what the user asks when they set the sim target. For target =
  // MAX_TIER (no T_n+1 to enter), fall back to totalCalendarSec — the
  // last moment the loop observed the run. Earlier code used
  // totalCalendarSec unconditionally; that conflated "session length
  // that contained the transition" with "time to complete the tier" and
  // produced misleading flat percentiles at T1 target (every profile
  // showed its phase-1 session length, not its true T1 completion time).
  const totals = sortedAscending(completed.map(r => {
    const transition = r.perTierEntrySec && r.perTierEntrySec[targetTier + 1];
    return transition != null ? transition : r.totalCalendarSec;
  }));
  const totalActiveSeconds = sortedAscending(completed.map(r => r.totalActiveSec));

  const timingName = pairing && pairing.timing;
  const driftApplies = profiles.timingHasDriftTarget(timingName);

  const perTier: Record<number, AnyState> = {};
  for (let t = 1; t <= targetTier; t++) {
    const samples: number[] = [];
    const completedAtSamples: number[] = [];
    const massRatios: number[] = [];
    const refMass = referenceMassForTier(t, mode);
    for (const r of completed) {
      const entryT = r.perTierEntrySec ? r.perTierEntrySec[t] : null;
      const entryNext = r.perTierEntrySec ? r.perTierEntrySec[t + 1] : null;
      const exitT = (t === targetTier) ? r.totalCalendarSec : entryNext;
      if (entryT != null && exitT != null) samples.push(exitT - entryT);
      // Cumulative completed-at calendar-second — when this tier was crossed
      // (i.e. when tier t+1 was entered). For the target tier this equals
      // the run's total calendar time. Surfaces the per-tier P50 in the
      // Sweep view's cross-pairing comparison table (intermediate-tier
      // columns for sweeps targeting T>1).
      if (exitT != null) completedAtSamples.push(exitT);
      const exitMass = r.perTierExitMass ? r.perTierExitMass[t] : null;
      if (exitMass != null && refMass != null && refMass > 0) {
        massRatios.push(exitMass / refMass);
      }
    }
    const sorted = sortedAscending(samples);
    const p50 = pct(sorted, 0.50);
    const completedAtSorted = sortedAscending(completedAtSamples);
    const targetsForMode = profiles.ENGAGED_TARGETS[mode];
    const tgt = (driftApplies && targetsForMode && targetsForMode[t]) || null;
    let driftPct: number | null = null;
    let driftFlag: string | null = null;
    if (p50 != null && tgt) {
      const mid = (tgt.low + tgt.high) / 2;
      driftPct = (p50 - mid) / mid;
      if (lowConfidence) {
        driftFlag = 'low-confidence';
      } else if (Math.abs(driftPct) > DRIFT_THRESHOLD) {
        driftFlag = driftPct > 0 ? 'HIGH-over' : 'HIGH-under';
      } else {
        driftFlag = 'within';
      }
    }
    const ratioSorted = sortedAscending(massRatios);
    const ratioP50 = pct(ratioSorted, 0.50);
    let bandFlag: string | null = null;
    if (ratioP50 != null) {
      if (lowConfidence) {
        bandFlag = 'low-confidence';
      } else if (ratioP50 < massBandLow) {
        bandFlag = 'below-band';
      } else if (ratioP50 > massBandHigh) {
        bandFlag = 'above-band';
      } else {
        bandFlag = 'within-band';
      }
    }
    perTier[t] = {
      n: sorted.length,
      p10: pct(sorted, 0.10),
      p50,
      p90: pct(sorted, 0.90),
      completedAtP10: pct(completedAtSorted, 0.10),
      completedAtP50: pct(completedAtSorted, 0.50),
      completedAtP90: pct(completedAtSorted, 0.90),
      target: tgt,
      driftPct,
      driftFlag,
      referenceMass: refMass,
      massRatioP10: pct(ratioSorted, 0.10),
      massRatioP50: ratioP50,
      massRatioP90: pct(ratioSorted, 0.90),
      bandFlag,
    };
  }

  // Per-phase aggregate (browser-facing): calendar seconds + active seconds
  // per phase, p50 across completed runs.
  const phaseLabels = new Set<string>();
  for (const r of completed) {
    if (r.perPhaseCalendarSec) {
      Object.keys(r.perPhaseCalendarSec).forEach(k => phaseLabels.add(k));
    }
  }
  const perPhase: Record<string, AnyState> = {};
  for (const label of phaseLabels) {
    const cal = sortedAscending(completed.map(r => r.perPhaseCalendarSec && r.perPhaseCalendarSec[label]));
    const act = sortedAscending(completed.map(r => r.perPhaseActiveSec && r.perPhaseActiveSec[label]));
    perPhase[label] = {
      calendarP50: pct(cal, 0.50),
      activeP50: pct(act, 0.50),
    };
  }

  const totalP50 = pct(totals, 0.50);
  const totalTarget = driftApplies ? profiles.totalTargetSecondsThroughTier(mode, targetTier) : null;
  let totalDriftPct: number | null = null, totalDriftFlag: string | null = null;
  if (totalP50 != null && totalTarget != null) {
    const mid = (totalTarget.low + totalTarget.high) / 2;
    totalDriftPct = (totalP50 - mid) / mid;
    if (lowConfidence) {
      totalDriftFlag = 'low-confidence';
    } else if (Math.abs(totalDriftPct) > DRIFT_THRESHOLD) {
      totalDriftFlag = totalDriftPct > 0 ? 'HIGH-over' : 'HIGH-under';
    } else {
      totalDriftFlag = 'within';
    }
  }

  return {
    n: runs.length,
    dnfCount: dnfs.length,
    completedCount: completed.length,
    dnfRate,
    lowConfidence,
    driftApplies,
    dnfByReason,
    massBandLow,
    massBandHigh,
    p10_s: pct(totals, 0.10),
    p50_s: totalP50,
    p90_s: pct(totals, 0.90),
    activeP10_s: pct(totalActiveSeconds, 0.10),
    activeP50_s: pct(totalActiveSeconds, 0.50),
    activeP90_s: pct(totalActiveSeconds, 0.90),
    perTier,
    perPhase,
    totalTarget,
    totalDriftPct,
    totalDriftFlag,
    mode,
  };
}
