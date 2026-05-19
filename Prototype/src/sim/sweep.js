// Dark Filaments — sweep / sim-core (browser + Node)
// Long-burn v1, S2-S4 refactor: the simulation core extracted from
// `test/harness.js` so it can be consumed by both the CLI and the browser
// Simulator tab. Pure functions; no CLI plumbing, no file I/O, no report
// writing.
//
// API surface (attached to global.DF.sim.sweep, and exposed as module.exports
// for Node):
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
//
// Loaded as a plain <script> from file://. IIFE attaches to
// window.DF.sim.sweep. UMD shim at bottom for Node test/harness use.

(function (global) {
  'use strict';
  global.DF = global.DF || {};
  global.DF.sim = global.DF.sim || {};

  // ---- Dependency resolution -----------------------------------------
  // Browser side: deps already on global.DF.sim (data, core, strategy,
  // runner, offline, profiles). Node side: lazy require.
  function deps() {
    const ns = global.DF && global.DF.sim ? global.DF.sim : null;
    if (ns && ns.data && ns.runner && ns.offline && ns.profiles) {
      return {
        data: ns.data,
        runner: ns.runner,
        offline: ns.offline,
        profiles: ns.profiles,
      };
    }
    if (typeof require !== 'undefined') {
      // Make sure dependencies are loaded; each file attaches to globals
      // as a side effect when loaded.
      require('./data.js');
      require('./core.js');
      require('./strategy.js');
      const runner = require('./runner.js');
      const offline = require('./offline.js');
      const profiles = require('./profiles.js');
      const data = (typeof window !== 'undefined' ? window : globalThis).DF.sim.data;
      return { data, runner, offline, profiles };
    }
    throw new Error('DF.sim.sweep dependencies not loaded');
  }

  // ---- Constants -----------------------------------------------------

  const DEFAULT_MAX_DAYS = 365;
  const SEC_PER_DAY = 86400;
  const DRIFT_THRESHOLD = 0.15;
  const DEFAULT_MASS_BAND_LOW = 0.7;
  // Upper threshold for the mass-band flag. Above this, runs are labeled
  // `above-band` rather than `within-band` so the user can distinguish
  // bot-aligned exits from offline-accumulation overshoots (which the
  // long-burn pacing model produces routinely for low-cpm / drift profiles
  // that idle for days mid-tier before the next session). Per CLAUDE.md
  // "engagement-profile runs commonly overshoot at 100× to 9000× the bot
  // reference" — above-band is informational, not a failure. 2.0 chosen
  // so typical engaged profiles (which exit close to 1.0× bot reference)
  // stay within-band, while accumulation overshoots are surfaced.
  const DEFAULT_MASS_BAND_HIGH = 2.0;
  const LOW_CONFIDENCE_DNF_RATE = 0.5;

  // ---- Seedable RNG --------------------------------------------------

  function mulberry32(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeRunRng(baseSeed, runIdx) {
    const seed = (baseSeed ^ (runIdx * 0x9E3779B9)) >>> 0;
    return mulberry32(seed || 1);
  }

  // ---- Bot-reference mass cache (S4) ---------------------------------

  const _referenceMassCache = new Map();

  function resetReferenceMassCache() {
    _referenceMassCache.clear();
  }

  function referenceMassForTier(targetTier, mode) {
    const key = mode + ':' + targetTier;
    if (_referenceMassCache.has(key)) return _referenceMassCache.get(key);

    const { runner } = deps();
    const params = { cpm: 100, engagement: 1.0, saveVpcThreshold: 1.5 };
    let priorFinal = null;
    let peakAtGate = null;
    for (let t = 1; t <= targetTier; t++) {
      const scenario = { tier: t, mode };
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
      } catch (e) {
        peakAtGate = null;
        break;
      }
    }
    _referenceMassCache.set(key, peakAtGate);
    return peakAtGate;
  }

  function referenceMassesThroughTier(targetTier, mode) {
    const out = {};
    for (let t = 1; t <= targetTier; t++) {
      out[t] = referenceMassForTier(t, mode);
    }
    return out;
  }

  // ---- Idle-gap sampler ---------------------------------------------

  function sampleIdleGapSec(timing, rng) {
    if (timing.continuous) return 0;
    const meanSec = SEC_PER_DAY / Math.max(0.01, timing.checkInsPerDay);
    const u = Math.max(1e-12, rng());
    const raw = -meanSec * Math.log(u);
    const minGap = 5 * 60;
    const maxGap = 14 * SEC_PER_DAY;
    return Math.max(minGap, Math.min(maxGap, raw));
  }

  // ---- Fresh save state ---------------------------------------------

  function freshSavedState() {
    const { data } = deps();
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

  function runContinuousBotRun(pairing, timing, buyer, targetTier, mode) {
    const { runner } = deps();
    const params = {
      cpm: timing.cpm,
      engagement: 1.0,
      saveVpcThreshold: buyer.saveVpcThreshold,
    };
    const perTierEntrySec = { 1: 0 };
    const perTierExitMass = {};
    let priorFinal = null;
    let totalSeconds = 0;
    let dnf = false;
    let dnfTier = null;
    let dnfReason = null;
    let dnfReasonCategory = null;

    for (let t = 1; t <= targetTier; t++) {
      const scenario = { tier: t, mode };
      if (priorFinal) scenario.carryFrom = priorFinal;
      let result;
      try {
        result = runner.runSimulation(params, scenario);
      } catch (e) {
        dnf = true;
        dnfTier = t;
        dnfReason = 'runner error at T' + t + ': ' + (e && e.message || String(e));
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

  function runEngagementProfileRun(pairing, timing, buyer, targetTier, mode, rng, maxDays) {
    const { offline, profiles } = deps();
    const maxCalendarSec = maxDays * SEC_PER_DAY;
    const allowPurchases = true;

    let state = freshSavedState();
    let calendarSec = 0;
    let activeSec = 0;
    const perTierEntrySec = { 1: 0 };
    const perTierActiveSec = { 1: 0 };
    const perTierExitMass = {};
    const perPhaseCalendarSec = {};
    const perPhaseActiveSec = {};
    const buyLog = [];
    const milestones = [];

    // Browser-facing extra: track peak in-tier mass + per-session mass
    // snapshots so the UI can draw a calendar-time mass chart.
    let peakInTierMass = 0;
    const massTrace = [{ calendarSec: 0, mass: 0, kind: 'start', tier: 1 }];

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
        mode,
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
    let dnfReason = null;
    let dnfReasonCategory = null;
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

  function runPairing(pairing, targetTier, args) {
    const { profiles } = deps();
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

    const runs = [];
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

  function pct(sortedAsc, p) {
    if (sortedAsc.length === 0) return null;
    const idx = Math.min(sortedAsc.length - 1, Math.floor(sortedAsc.length * p));
    return sortedAsc[idx];
  }

  function sortedAscending(values) {
    return values.filter(v => v != null && Number.isFinite(v)).slice().sort((a, b) => a - b);
  }

  function summarizeRuns(runs, targetTier, mode, pairing, opts) {
    const { profiles } = deps();
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

    const dnfByReason = {};
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

    const perTier = {};
    for (let t = 1; t <= targetTier; t++) {
      const samples = [];
      const completedAtSamples = [];
      const massRatios = [];
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
      let driftPct = null;
      let driftFlag = null;
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
      let bandFlag = null;
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
    const phaseLabels = new Set();
    for (const r of completed) {
      if (r.perPhaseCalendarSec) {
        Object.keys(r.perPhaseCalendarSec).forEach(k => phaseLabels.add(k));
      }
    }
    const perPhase = {};
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
    let totalDriftPct = null, totalDriftFlag = null;
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

  // ---- Export -------------------------------------------------------

  global.DF.sim.sweep = {
    // Constants
    DEFAULT_MAX_DAYS,
    SEC_PER_DAY,
    DRIFT_THRESHOLD,
    DEFAULT_MASS_BAND_LOW,
    DEFAULT_MASS_BAND_HIGH,
    LOW_CONFIDENCE_DNF_RATE,
    // Core
    runPairing,
    runEngagementProfileRun,
    runContinuousBotRun,
    summarizeRuns,
    referenceMassForTier,
    referenceMassesThroughTier,
    resetReferenceMassCache,
    // Helpers
    makeRunRng,
    sampleIdleGapSec,
    freshSavedState,
    sortedAscending,
    pct,
  };
})(typeof window !== 'undefined' ? window : globalThis);

// UMD shim — for Node test/harness use.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = (typeof window !== 'undefined' ? window : globalThis).DF.sim.sweep;
}
