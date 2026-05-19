// Dark Filaments — engagement-profile + buyer-profile catalogs
//
// 2026-05-12 retune: profiles redesigned around realistic player trajectories
// (6-phase) + new buyer profiles axed on path × hoarding-preference.
// Old profiles archived in git; this file is the post-retune catalog.
//
// Source: post-T1-retune design discussion 2026-05-12 (user-locked).
//
// Loaded as a plain <script> from file://. Pattern: IIFE attaches to
// window.DF.sim.profiles. UMD shim at bottom for Node test harness use.

(function (global) {
  'use strict';
  global.DF = global.DF || {};
  global.DF.sim = global.DF.sim || {};

  // ----- Timing profiles (6) — trajectory-based -----
  //
  // 2026-05-12 redesign: timing profiles now represent player BEHAVIORAL
  // TRAJECTORIES, not single steady-state tuples. Real players hyper-engage
  // on day 0, settle into routine, and taper off over time. Each profile is
  // a sequence of phases; the harness picks the active phase by elapsed
  // calendar time at each iteration.
  //
  // Six phases capture the player's psychological arc:
  //   1. 0-60min:    First sit-down. Hyper-engaged, learning the loop.
  //   2. 60min-1day: Later that same day. Brief check-in.
  //   3. 1-3 days:   Peak engagement; player is hooked.
  //   4. 3-7 days:   Settled routine through the first week.
  //   5. 7-21 days:  Mild taper through weeks 2-3.
  //   6. 21+ days:   Long-burn drift; background play.
  //
  // Phase shape:
  //   fromDay         — start of phase, in calendar days (inclusive)
  //   toDay           — end of phase, in calendar days (exclusive; Infinity for last)
  //   checkInsPerDay  — fractional ok; 0 means no check-ins in this phase
  //   sessionMinutes  — minutes per check-in
  //   cpm             — clicks per minute during the active window
  //   label           — short tag for per-phase reporting
  //
  // Top-level profile fields:
  //   phases          — array (for trajectory profiles)
  //   continuous      — true for the bot-60cpm technical baseline (no phase scheduling)
  //   cpm             — set when continuous (for the bot path)
  //   notes           — provenance / role
  //
  // cpm interpretation: only applies DURING SESSIONS. Outside sessions the
  // player isn't clicking. Late-tier sessions at lower cpm (45-35) reflect
  // the player's attention drifting, but late-tier click power is so low
  // relative to the M☉ scale that the exact cpm matters little — the lower
  // bound at 35 cpm is just "still trying, intermittently."

  // Phase-level `oneShot: true` semantic (added 2026-05-12, long-burn v1
  // playtest-tab review): when a phase carries `oneShot: true`, the harness
  // loop fires exactly one session in that phase and then idle-skips the
  // remainder of the phase as pure-idle accrual before advancing. Without
  // this flag, the exponential idle-gap sampler can fire a second (or third)
  // session inside the same phase when sessionMinutes < (phase length).
  // For the 60-min onboarding window with shorter sessionMinutes (25/15
  // for casual/drift), this produced second-session-in-phase-1 in ~44-53%
  // of runs at checkInsPerDay=24. The design intent of "one onboarding
  // session of X minutes per profile" is now load-bearing semantically,
  // not statistically. `checkInsPerDay` is preserved on one-shot phases
  // as informational metadata describing the rate IF the phase weren't
  // capped — useful for documentation continuity and any future per-phase
  // analysis. Non-one-shot phases keep their natural Poisson behavior.
  const TIMING_PROFILES = {
    'realistic-engaged': {
      phases: [
        { fromDay: 0,      toDay: 1/24,     checkInsPerDay: 24,  sessionMinutes: 60, cpm: 60, label: 'onboard',  oneShot: true },
        // 2026-05-13 (T2 retune): checkInsPerDay 1 → 4. Prior 1×/same-day
        // was internally inconsistent with the profile's own "3× check-ins
        // per day" definition (CLAUDE.md long-burn lock); the 1× landed the
        // mean idle gap at 24h, which pushed engaged T2 p50 calendar to
        // ~17h — far above the locked 2-8h Engaged Comp target. 4×/day
        // mean idle gap = 6h, lets the player return same-day for a second
        // (and third) session and land T2 inside the design band.
        { fromDay: 1/24,   toDay: 1,        checkInsPerDay: 4,   sessionMinutes: 15, cpm: 60, label: 'same-day' },
        { fromDay: 1,      toDay: 3,        checkInsPerDay: 4,   sessionMinutes: 15, cpm: 60, label: 'peak' },
        { fromDay: 3,      toDay: 7,        checkInsPerDay: 3,   sessionMinutes: 15, cpm: 60, label: 'routine' },
        { fromDay: 7,      toDay: 21,       checkInsPerDay: 2,   sessionMinutes: 15, cpm: 55, label: 'taper' },
        { fromDay: 21,     toDay: Infinity, checkInsPerDay: 1,   sessionMinutes: 12, cpm: 45, label: 'drift' },
      ],
      notes: 'Most-engaged realistic player. 60-min onboarding day 0 (one session, then idle to phase end), peak engagement days 1-3, settled routine through week 1, mild taper through week 3, then drift.',
    },
    'realistic-moderate': {
      phases: [
        { fromDay: 0,      toDay: 1/24,     checkInsPerDay: 24,  sessionMinutes: 45, cpm: 60, label: 'onboard',  oneShot: true },
        { fromDay: 1/24,   toDay: 1,        checkInsPerDay: 1,   sessionMinutes: 10, cpm: 55, label: 'same-day' },
        { fromDay: 1,      toDay: 3,        checkInsPerDay: 3,   sessionMinutes: 15, cpm: 55, label: 'peak' },
        { fromDay: 3,      toDay: 7,        checkInsPerDay: 2,   sessionMinutes: 15, cpm: 50, label: 'routine' },
        { fromDay: 7,      toDay: 21,       checkInsPerDay: 1,   sessionMinutes: 15, cpm: 45, label: 'taper' },
        { fromDay: 21,     toDay: Infinity, checkInsPerDay: 0.5, sessionMinutes: 10, cpm: 35, label: 'drift' },
      ],
      notes: 'Typical engaged player. Moderate onboarding (one 45-min session, then idle), peak days 1-3, settles to once-twice a day by week 2, drift after week 3.',
    },
    'realistic-casual': {
      phases: [
        { fromDay: 0,      toDay: 1/24,     checkInsPerDay: 24,  sessionMinutes: 25, cpm: 50, label: 'onboard',  oneShot: true },
        { fromDay: 1/24,   toDay: 1,        checkInsPerDay: 0.5, sessionMinutes: 10, cpm: 45, label: 'same-day' },
        { fromDay: 1,      toDay: 3,        checkInsPerDay: 2,   sessionMinutes: 15, cpm: 50, label: 'peak' },
        { fromDay: 3,      toDay: 7,        checkInsPerDay: 1,   sessionMinutes: 15, cpm: 45, label: 'routine' },
        { fromDay: 7,      toDay: 21,       checkInsPerDay: 0.5, sessionMinutes: 10, cpm: 40, label: 'taper' },
        { fromDay: 21,     toDay: Infinity, checkInsPerDay: 0.3, sessionMinutes: 8,  cpm: 35, label: 'drift' },
      ],
      notes: 'Casual player. Short onboarding (one 25-min session, then idle), mild peak, once a day in week 1, sporadic by week 2+.',
    },
    'realistic-drift': {
      phases: [
        { fromDay: 0,      toDay: 1/24,     checkInsPerDay: 24,  sessionMinutes: 15, cpm: 50, label: 'onboard',  oneShot: true },
        { fromDay: 1/24,   toDay: 1,        checkInsPerDay: 0,   sessionMinutes: 0,  cpm: 0,  label: 'gone-same-day' },
        { fromDay: 1,      toDay: 3,        checkInsPerDay: 1,   sessionMinutes: 10, cpm: 40, label: 'occasional' },
        { fromDay: 3,      toDay: 7,        checkInsPerDay: 0.5, sessionMinutes: 10, cpm: 40, label: 'sporadic' },
        { fromDay: 7,      toDay: 21,       checkInsPerDay: 0.3, sessionMinutes: 8,  cpm: 35, label: 'rare' },
        { fromDay: 21,     toDay: Infinity, checkInsPerDay: 0.1, sessionMinutes: 5,  cpm: 35, label: 'forgotten' },
      ],
      notes: 'Drift player. Brief onboarding session (one 15-min session, then idle), doesn\'t come back same day, sporadic through week 1, essentially gone after week 3. Expected to DNF on late tiers.',
    },
    'hyper-onboard': {
      phases: [
        { fromDay: 0,      toDay: 1/24,     checkInsPerDay: 24,  sessionMinutes: 60, cpm: 60, label: 'onboard',  oneShot: true },
        // No further phases. Harness stops issuing sessions after the
        // onboarding window — if target tier isn't reached in the first 60
        // minutes, DNF. This is the "fastest possible time" test case for T1
        // floor measurement. With sessionMinutes=60 and phase length 60min,
        // the oneShot flag is functionally a no-op here (session fills the
        // window exactly) but kept for catalog uniformity.
      ],
      notes: 'Hyper-engaged 60-minute opening session at 60 cpm; player stops after that. T1 floor-time test case; expected to DNF on T2+.',
    },
    'bot-60cpm': {
      continuous: true,
      cpm: 60,
      notes: 'Technical baseline: 60 cpm continuous forever. What is mechanically possible. Not a realistic player; used as the absolute floor reference for all tiers.',
    },
  };

  // ----- Buyer profiles (4) — path × hoarding-preference -----
  //
  // 2026-05-12 redesign: buyer profiles now reflect TWO MEANINGFUL AXES.
  //   Path:               completion vs threshold (binary).
  //   Hoarding preference: stackable-hoarder vs progression-rusher.
  //                        Maps to strategy.decideAction's saveVpcThreshold:
  //                          HIGH (2.5) → save mode rarely fires → keep buying
  //                                       cheap stackables → stackable-hoarder
  //                          LOW (1.2)  → save mode triggers easily → save for
  //                                       the next big one-shot → progression-rusher
  //
  // Retired axes:
  //   inSessionPurchases — Without in-session buys you can't make tier progress
  //                        (consolidation only advances on purchase). A "never buys"
  //                        profile isn't a player; it's a degenerate case.
  //                        All realistic profiles buy in-session.
  //   completionistAggressiveness — Collapsed into the binary `path` field.
  //
  // Shape (per profile):
  //   path             — 'completion' | 'threshold' (maps to strategy mode)
  //   saveVpcThreshold — 2.5 (hoarder) or 1.2 (rusher); the hoarding-preference knob
  //   notes            — provenance / role.

  const BUYER_PROFILES = {
    'comp-hoarder': {
      path: 'completion',
      saveVpcThreshold: 2.5,
      notes: 'Completion path; stackable-heavy. Prefers a deep stackable build before pushing for one-shots.',
    },
    'comp-rusher': {
      path: 'completion',
      saveVpcThreshold: 1.2,
      notes: 'Completion path; progression-heavy. Rushes one-shots + completionists; idles to build for big saves.',
    },
    'thr-hoarder': {
      path: 'threshold',
      saveVpcThreshold: 2.5,
      notes: 'Threshold path; stackable-heavy. Deep stackable build before tier-out.',
    },
    'thr-rusher': {
      path: 'threshold',
      saveVpcThreshold: 1.2,
      notes: 'Threshold path; minimum-spend tier-out. Skips stackables for the gate.',
    },
  };

  // Helper: which timing profiles have a defined drift target?
  // ENGAGED_TARGETS is calibrated against the engaged trajectory shape.
  // Currently realistic-engaged is the primary; realistic-moderate also has
  // enough engagement for drift detection to be informative. Casual / drift /
  // hyper-onboard / bot-60cpm don't get drift comparisons (informational only).
  function timingHasDriftTarget(timingName) {
    return timingName === 'realistic-engaged' || timingName === 'realistic-moderate';
  }

  // Helper: get the active phase for a calendar-day timestamp. Returns null
  // if the profile is continuous (use the bot path instead) or if elapsed
  // days falls past all defined phases (player has stopped — e.g.,
  // hyper-onboard after day 1/24).
  function activePhaseForDay(profile, calendarDays) {
    if (!profile || !profile.phases) return null;
    for (const phase of profile.phases) {
      if (calendarDays >= phase.fromDay && calendarDays < phase.toDay) {
        return phase;
      }
    }
    return null;
  }

  // ----- Realistic pairings (17 entries) -----
  //
  // 4 primary + 4 secondary (moderate) + 4 secondary (casual) +
  // 2 stress (drift) + 2 floor (hyper-onboard) + 1 legacy (bot baseline).
  //
  // Weight semantics:
  //   primary    — calibration-deciding. Run at N=50.
  //   secondary  — informs but does not gate. N = 20-30.
  //   stress     — adversarial profile. N = 20. DNF-prone on late tiers.
  //   floor      — fastest-possible-time bounds. N = 10.
  //   legacy     — technical baseline reference. N = 10.

  const REALISTIC_PAIRINGS = [
    // Primary: realistic-engaged × all 4 buyers (the calibration deciders)
    { id: 'p1',  timing: 'realistic-engaged',  buyer: 'comp-hoarder', n: 50, weight: 'primary' },
    { id: 'p2',  timing: 'realistic-engaged',  buyer: 'comp-rusher',  n: 50, weight: 'primary' },
    { id: 'p3',  timing: 'realistic-engaged',  buyer: 'thr-hoarder',  n: 50, weight: 'primary' },
    { id: 'p4',  timing: 'realistic-engaged',  buyer: 'thr-rusher',   n: 50, weight: 'primary' },

    // Secondary: realistic-moderate × all 4 buyers
    { id: 'p5',  timing: 'realistic-moderate', buyer: 'comp-hoarder', n: 30, weight: 'secondary' },
    { id: 'p6',  timing: 'realistic-moderate', buyer: 'comp-rusher',  n: 30, weight: 'secondary' },
    { id: 'p7',  timing: 'realistic-moderate', buyer: 'thr-hoarder',  n: 30, weight: 'secondary' },
    { id: 'p8',  timing: 'realistic-moderate', buyer: 'thr-rusher',   n: 30, weight: 'secondary' },

    // Secondary: realistic-casual × all 4 buyers
    { id: 'p9',  timing: 'realistic-casual',   buyer: 'comp-hoarder', n: 20, weight: 'secondary' },
    { id: 'p10', timing: 'realistic-casual',   buyer: 'comp-rusher',  n: 20, weight: 'secondary' },
    { id: 'p11', timing: 'realistic-casual',   buyer: 'thr-hoarder',  n: 20, weight: 'secondary' },
    { id: 'p12', timing: 'realistic-casual',   buyer: 'thr-rusher',   n: 20, weight: 'secondary' },

    // Stress: realistic-drift on threshold-path only (completion is unrealistic for drift)
    { id: 'p13', timing: 'realistic-drift',    buyer: 'thr-hoarder',  n: 20, weight: 'stress', dnfExpected: 'late tiers' },
    { id: 'p14', timing: 'realistic-drift',    buyer: 'thr-rusher',   n: 20, weight: 'stress', dnfExpected: 'late tiers' },

    // Floor: hyper-onboard at strategic extremes (fastest possible T1 + onboarding-burst signal)
    { id: 'p15', timing: 'hyper-onboard',      buyer: 'comp-hoarder', n: 10, weight: 'floor' },
    { id: 'p16', timing: 'hyper-onboard',      buyer: 'thr-rusher',   n: 10, weight: 'floor' },

    // Legacy: bot-60cpm continuous baseline (one buyer is enough to anchor)
    { id: 'p17', timing: 'bot-60cpm',          buyer: 'comp-hoarder', n: 10, weight: 'legacy' },
  ];

  // Convenience: lookup by pairing id ("p1") OR by "timing-x-buyer" string
  // (e.g. "realistic-engaged-x-comp-hoarder"). The latter form is what the
  // CLI takes via `--pairing`.
  function lookupPairing(idOrName) {
    if (!idOrName) return null;
    for (const p of REALISTIC_PAIRINGS) {
      if (p.id === idOrName) return p;
      if ((p.timing + '-x-' + p.buyer) === idOrName) return p;
    }
    return null;
  }

  // Filter to weight === 'primary' — what `--primary-only` selects.
  function primaryPairings() {
    return REALISTIC_PAIRINGS.filter(p => p.weight === 'primary');
  }

  // ----- Per-tier calendar targets (Engaged profile baseline) -----
  //
  // From gameplay-design.md §1 — first locked 2026-05-11; T1/T2 revised
  // 2026-05-12; 11-tier renumber 2026-05-13 (new T2 Stellar Association
  // inserted between T1 Solar System and old-T2 Stellar Neighborhood).
  // All values in SECONDS for harness arithmetic. The Engaged profile is
  // the calibration baseline; Casual/Drift get derived bands (deferred to
  // later retunes). Sim-tuner's drift detection (decision C6) compares p50
  // against the midpoint of the per-tier range; ±15% flags HIGH.
  //
  // Shape (per mode per tier): { low, high, label } in seconds.
  //
  // 2026-05-13 11-tier ladder — reshape (afternoon pass, post creative-
  // director + science-director reconsideration). Phase 1 morning pass
  // inserted "Stellar Association" between Solar System and Stellar
  // Neighborhood; user flagged that Association/Neighborhood read as
  // semantically duplicative to a non-astronomer and that the actual
  // 10⁷× mass cliff was T3→T4 (Stellar Neighborhood → Galactic Arm).
  // Both directors confirmed the swap. New shape:
  //   T1  Solar System         — first-session hook (8-15 min)
  //   T2  Stellar Neighborhood — second day-1 milestone (2-8 h)
  //                              [keeps the day-1 retention slot;
  //                               name moved DOWN from old T3]
  //   T3  Dwarf Spheroidal     — first patient-universe return (24-48 h)
  //                              [NEW — fills the 10⁵-10⁷ M☉ gap between
  //                               Stellar Neighborhood (10³) and Galactic
  //                               Arm (10¹⁰); Draco/Ursa Minor scale;
  //                               dark-matter-dominated; hierarchical-
  //                               formation fossils]
  //   T4  Galactic Arm         — the climb begins (1-2 d)
  //   T5  Galaxy               — galaxy emerges (3-4 d)
  //   T6  Local Group          — THE PEAK (5-7 d)
  //   T7  Galactic Cluster     — descent begins / Eridanus Reach (4-6 d)
  //   T8  Supercluster         — descent body (5-7 d)
  //   T9  Filament             — approaching inversion (4-6 d)
  //   T10 Cosmic Web           — INVERSION (3-4 d)
  //   T11 Causal Horizon       — contemplative end (2-3 d)
  //
  // CAVEAT (Phase 1 only): data.js engine still has 10-tier shape; this
  // table reflects the new 11-tier DESIGN. Drift detection against T2-T11
  // is mismatched-but-not-broken until Phase 2 lands the engine renumber +
  // the new T3 Dwarf Spheroidal upgrade slate. The current T2-T4 numbers
  // in data.js were already declared stale, so this mismatch doesn't
  // regress anything; it just means new-T3 drift won't read as meaningful
  // until Phase 2.

  const M = 60;                    // 1 minute in seconds
  const H = 3600;                  // 1 hour in seconds
  const D = 86400;                 // 1 day in seconds

  const ENGAGED_TARGETS = {
    completion: {
      1:  { low: 8 * M,    high: 15 * M,   label: 'T1 Solar System (first-session hook)' },
      2:  { low: 2 * H,    high: 8 * H,    label: 'T2 Stellar Neighborhood (day-1 milestone bridge)' },
      3:  { low: 24 * H,   high: 48 * H,   label: 'T3 Dwarf Spheroidal (first patient-universe return)' },
      4:  { low: 1 * D,    high: 2 * D,    label: 'T4 Galactic Arm (the climb begins)' },
      5:  { low: 3 * D,    high: 4 * D,    label: 'T5 Galaxy (galaxy emerges)' },
      6:  { low: 5 * D,    high: 7 * D,    label: 'T6 Local Group PEAK' },
      7:  { low: 4 * D,    high: 6 * D,    label: 'T7 Galactic Cluster (descent begins / Eridanus Reach)' },
      8:  { low: 5 * D,    high: 7 * D,    label: 'T8 Supercluster (descent body)' },
      9:  { low: 4 * D,    high: 6 * D,    label: 'T9 Filament (approaching inversion)' },
      10: { low: 3 * D,    high: 4 * D,    label: 'T10 Cosmic Web INVERSION (Completion compresses)' },
      11: { low: 2 * D,    high: 3 * D,    label: 'T11 Causal Horizon (contemplative end)' },
    },
    threshold: {
      1:  { low: 7 * M,    high: 12 * M,   label: 'T1 Solar System (first-session hook)' },
      2:  { low: 1.5 * H,  high: 6 * H,    label: 'T2 Stellar Neighborhood (day-1 milestone bridge)' },
      3:  { low: 22 * H,   high: 44 * H,   label: 'T3 Dwarf Spheroidal (first patient-universe return)' },
      4:  { low: 1 * D,    high: 1.5 * D,  label: 'T4 Galactic Arm (the climb begins)' },
      5:  { low: 2 * D,    high: 3 * D,    label: 'T5 Galaxy (galaxy emerges)' },
      6:  { low: 3 * D,    high: 5 * D,    label: 'T6 Local Group PEAK' },
      7:  { low: 4 * D,    high: 6 * D,    label: 'T7 Galactic Cluster (descent begins / Eridanus Reach)' },
      8:  { low: 5 * D,    high: 7 * D,    label: 'T8 Supercluster (descent body)' },
      9:  { low: 6 * D,    high: 8 * D,    label: 'T9 Filament (approaching inversion)' },
      10: { low: 7 * D,    high: 10 * D,   label: 'T10 Cosmic Web INVERSION' },
      11: { low: 8 * D,    high: 12 * D,   label: 'T11 Causal Horizon (contemplative end)' },
    },
  };

  // Pretty total targets, for headline-line drift comparison.
  // Sums the per-tier ranges; engaged completion ~5-6 weeks, threshold ~7-8 weeks.
  function totalTargetSecondsThroughTier(mode, tier) {
    const m = ENGAGED_TARGETS[mode];
    if (!m) return null;
    let lo = 0, hi = 0;
    for (let t = 1; t <= tier; t++) {
      if (!m[t]) return null;
      lo += m[t].low;
      hi += m[t].high;
    }
    return { low: lo, high: hi };
  }

  // Helper for the harness's reporting layer.
  function describePairing(p) {
    const t = TIMING_PROFILES[p.timing];
    const b = BUYER_PROFILES[p.buyer];
    return {
      id: p.id,
      label: p.timing + ' × ' + p.buyer,
      n: p.n,
      weight: p.weight,
      dnfExpected: p.dnfExpected || null,
      timing: t || null,
      buyer: b || null,
    };
  }

  global.DF.sim.profiles = {
    TIMING_PROFILES,
    BUYER_PROFILES,
    REALISTIC_PAIRINGS,
    ENGAGED_TARGETS,
    lookupPairing,
    primaryPairings,
    describePairing,
    totalTargetSecondsThroughTier,
    timingHasDriftTarget,
    activePhaseForDay,
  };
})(typeof window !== 'undefined' ? window : globalThis);

// UMD shim — for Node test harness use (harness.js, profiles_smoke.js).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = (typeof window !== 'undefined' ? window : globalThis).DF.sim.profiles;
}
