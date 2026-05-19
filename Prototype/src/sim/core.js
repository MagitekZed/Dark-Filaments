// Dark Filaments — sim core math
// Pure functions. No DOM, no timers, no closure over UI state.
// Lifted verbatim (semantically) from dark-filaments-t1.html as part of Phase 1.
// Mirror of dark-filaments-t1-current-state.md section 3.
//
// Loaded as a plain <script> from file://. Pattern: IIFE attaches to window.DF.sim.core.
// UMD-style module.exports shim at the bottom for Node test harness use (Phase 3+).
//
// Contract: every function takes its inputs as arguments. The HTML's previous
// implementations closed over `state.levels` and `UPGRADES`; here those are explicit.

(function (global) {
  'use strict';
  global.DF = global.DF || {};
  global.DF.sim = global.DF.sim || {};

  // selfContrib(N, B, A, S) = 0                     if N == 0
  //                         = (B + N·A) · S^(N-1)   otherwise
  // L1 = base (selfMult not yet applied); L2+ apply the multiplier each level
  // beyond the first. For S=1 (the T1/T2 default) S^(N-1) = 1, so the formula
  // collapses to (B + N·A) and current calibrations are unaffected.
  function selfContrib(N, B, A, S) {
    if (N === 0) return 0;
    return (B + N * A) * Math.pow(S, N - 1);
  }

  // synergyMult(target, levels, upgrades, synergyProviders?): product over providers
  // of multiplier^providerLevel.
  // `levels` is the same shape as state.levels: { [upgradeName]: number }.
  // `upgrades` is the active-tier upgrade slice (used as synergy provider list when
  // the optional synergyProviders argument is omitted).
  // `synergyProviders` (optional) — wider provider list, used to support cross-tier
  // synergies (e.g. T3 HII Region targeted by T2 Local Bubble levels carried over).
  // When provided, prior-tier owned upgrades' synergy declarations resolve into the
  // current tier even though they are no longer in the buyable upgrade slice. Default:
  // synergyProviders = upgrades, preserving T1/T2 byte-identical behavior.
  //
  // Synergy kinds:
  //   - default (multiplicative):  mult *= multiplier ^ N            (unchanged)
  //   - kind === "additive":       mult *= 1 + (multiplier - 1) × N   (linear in N;
  //     used by cross-tier synergies where the design spec is `× (1 + addPerLvl × N)`).
  //     `multiplier` here represents (1 + addPerLvl), so 1.04 → "+0.04 per level".
  function synergyMult(targetName, levels, upgrades, synergyProviders) {
    const providers = synergyProviders || upgrades;
    let mult = 1;
    for (const u of providers) {
      const N = levels[u.name];
      if (!N || N === 0 || !u.synergies || u.synergies.length === 0) continue;
      for (const syn of u.synergies) {
        if (syn.target !== targetName) continue;
        if (syn.kind === "additive") {
          mult *= 1 + (syn.multiplier - 1) * N;
        } else {
          mult *= Math.pow(syn.multiplier, N);
        }
      }
    }
    return mult;
  }

  // computeMpc(state, upgrades, synergyProviders?): mass per click given current state.
  // (1.0 + Σ selfContrib_mpc(U) · synergyMult(U)) · Π allMpc^N
  // synergyProviders defaults to upgrades; pass the wider all-upgrades list to
  // resolve cross-tier synergies (T3+).
  function computeMpc(state, upgrades, synergyProviders) {
    const providers = synergyProviders || upgrades;
    let sum = 0, mult = 1;
    for (const u of upgrades) {
      const N = state.levels[u.name];
      const syn = synergyMult(u.name, state.levels, upgrades, providers);
      sum  += selfContrib(N, u.baseMpc, u.addMpc, u.selfMpc) * syn;
      mult *= Math.pow(u.allMpc, N);
    }
    return (1.0 + sum) * mult;
  }

  // computeMps(state, upgrades, synergyProviders?): mass per second given current state.
  // (0   + Σ selfContrib_mps(U) · synergyMult(U)) · Π allMps^N
  function computeMps(state, upgrades, synergyProviders) {
    const providers = synergyProviders || upgrades;
    let sum = 0, mult = 1;
    for (const u of upgrades) {
      const N = state.levels[u.name];
      const syn = synergyMult(u.name, state.levels, upgrades, providers);
      sum  += selfContrib(N, u.baseMps, u.addMps, u.selfMps) * syn;
      mult *= Math.pow(u.allMps, N);
    }
    return sum * mult;
  }

  // computeAps(state, upgrades, synergyProviders?): autoclick income per second.
  // T1 unused (every upgrade has 0/0/1 for APS fields). Stub for forward compat
  // following the same shape as MPS — no synergy contribution today, but the
  // structure is identical so future tiers slot in cleanly.
  function computeAps(state, upgrades, synergyProviders) {
    const providers = synergyProviders || upgrades;
    let sum = 0, mult = 1;
    for (const u of upgrades) {
      const N = state.levels[u.name];
      const syn = synergyMult(u.name, state.levels, upgrades, providers);
      sum  += selfContrib(N, u.baseAps, u.addAps, u.selfAps) * syn;
      mult *= Math.pow(u.allAps, N);
    }
    return sum * mult;
  }

  // computeRates(state, upgrades, carry, params, synergyProviders?) — single-pass
  // composed-rate computation. Returns { mpc, mps, aps } where every owned ×all
  // multiplier across BOTH the carry payload AND the active tier applies to the
  // sum of every owned self·syn contribution.
  //
  // This is the Option-C "no frozen floors" implementation of the load-bearing
  // rule "every owned ×all multiplier compounds across all owned stackable
  // contributions". Equivalent algebraic rewrite:
  //   mps = (carry.carryMps × hidden_mps_factor + Σ_active selfContrib·syn) × carry.allMps × Π_active(allMps^N)
  //   mpc = (1 + carry.carryMpc + Σ_active selfContrib·syn) × carry.allMpc × Π_active(allMpc^N)
  //   aps = (carry.carryAps + Σ_active selfContrib·syn) × carry.allAps × Π_active(allAps^N)
  //
  // `carry` shape: { allMps, allMpc, allAps, carryMps, carryMpc, carryAps }.
  // All fields optional; defaults: allX=1, carryX=0. T1 (no prior tier) passes
  // an empty carry → mps = Σ·Π exactly matches legacy computeMps output.
  // The +1 MPC baseline is sourced from params.baseMpc (default 1.0).
  //
  // Hidden MPS channel (`carryMpsMult`): any owned upgrade in `synergyProviders`
  // that declares `carryMpsMult` contributes a per-level exponentiated multiplier
  // applied to `carryMps` ONLY. The per-level coefficient compounds the
  // upgrade's incoming synergies before exponentiation, so synergy providers
  // amplify the hidden factor the same way they amplify any other self·syn
  // contribution. The visible per-upgrade MPS/MPC/APS rows are untouched —
  // Subhalo declares zero base/add/all, so its row reads 0 while carryMps
  // rises faster than the visible sum predicts. Introduced 2026-05-13 for the
  // T3 Subhalo upgrade (Dwarf Spheroidal slate, hidden-channel mechanic).
  function computeRates(state, upgrades, carry, params, synergyProviders) {
    const providers = synergyProviders || upgrades;
    const c = carry || {};
    const allMpsCarry = (c.allMps != null) ? c.allMps : 1;
    const allMpcCarry = (c.allMpc != null) ? c.allMpc : 1;
    const allApsCarry = (c.allAps != null) ? c.allAps : 1;
    const carryMps = c.carryMps || 0;
    const carryMpc = c.carryMpc || 0;
    const carryAps = c.carryAps || 0;
    const baseMpc = (params && params.baseMpc != null) ? params.baseMpc : 1.0;

    let sumMps = 0, sumMpc = 0, sumAps = 0;
    let allMps = 1, allMpc = 1, allAps = 1;
    for (const u of upgrades) {
      const N = state.levels[u.name];
      if (!N) continue;
      const syn = synergyMult(u.name, state.levels, upgrades, providers);
      sumMps += selfContrib(N, u.baseMps, u.addMps, u.selfMps) * syn;
      sumMpc += selfContrib(N, u.baseMpc, u.addMpc, u.selfMpc) * syn;
      sumAps += selfContrib(N, u.baseAps, u.addAps, u.selfAps) * syn;
      allMps *= Math.pow(u.allMps, N);
      allMpc *= Math.pow(u.allMpc, N);
      allAps *= Math.pow(u.allAps, N);
    }

    // Hidden-channel walk: any owned upgrade across ALL tiers (the providers
    // list, not just active-tier slice) with `carryMpsMult` exponentiates its
    // synergy-boosted per-level coefficient by owned levels and multiplies the
    // carryMps floor. Walks providers because Subhalo (T3) must continue to
    // amplify the carry once the player advances into T4+.
    let hiddenMpsFactor = 1;
    for (const u of providers) {
      const a = u.carryMpsMult;
      if (a == null || a === 1) continue;
      const N = state.levels[u.name];
      if (!N) continue;
      // Compound synergies into the per-level coefficient BEFORE exponentiation.
      // Math contract: α_eff_per_level = α × synergyMult(u). Then total factor
      // is α_eff^N. This matches design intent: each Subhalo level multiplies
      // carryMps by α_eff, so N levels stack multiplicatively to α_eff^N.
      const syn = synergyMult(u.name, state.levels, upgrades, providers);
      const aEff = a * syn;
      hiddenMpsFactor *= Math.pow(aEff, N);
    }

    return {
      mps: (carryMps * hiddenMpsFactor + sumMps) * allMps * allMpsCarry,
      mpc: (baseMpc + carryMpc + sumMpc) * allMpc * allMpcCarry,
      aps: (carryAps + sumAps) * allAps * allApsCarry,
    };
  }

  // cost(upgrade, level): cost to buy the next level when currently at `level`.
  // Returns null if at or above maxLevels.
  // Matches the previous costToBuy(u) which read level off state.levels[u.name].
  function cost(upgrade, level) {
    if (level >= upgrade.maxLevels) return null;
    return upgrade.initCost * Math.pow(upgrade.costGrowth, level);
  }

  // getUpgradeFlavor(upgrade, level, state): resolve which flavor line to display
  // for an upgrade at the given owned level. Tiered upgrades (T3 Galactic
  // Bulge — and any future upgrade with a per-level arc) carry a
  // `descByLevel` array of strings; flat upgrades carry a single `desc`.
  // Upgrades that swap their flavor when a synergy provider is owned carry a
  // `synergyVariants: [{ provider, text }]` array (today: T2 Roche Lobe
  // Overflow, T3 HII Region — see current-state.md §2 / §9b for the locked
  // variants).
  //
  // Resolution rule (in order):
  //   1. If `state` is provided AND `upgrade.synergyVariants` is non-empty AND
  //      any entry's `provider` has `state.levels[provider] > 0`, return that
  //      variant's `text` (first match wins if multiple providers fire).
  //   2. Else: descByLevel arc.
  //        - level === 0 (not yet purchased): show descByLevel[0] if present
  //          (the "first level" preview), else fall back to desc.
  //        - level >= 1: show descByLevel[level - 1] if present and in range,
  //          else fall back to desc.
  //   3. Else: the upgrade's flat `desc`.
  //
  // `state` is optional — pass `null` from contexts without a live state
  // (simulator card hover, design-doc previews). When `state` is null only
  // rules 2 and 3 apply, preserving the pre-synergy-variant behavior.
  //
  // Returns "" if the upgrade has none of the three fields. Pure; no side effects.
  function getUpgradeFlavor(upgrade, level, state) {
    if (!upgrade) return "";
    if (state && state.levels && upgrade.synergyVariants && upgrade.synergyVariants.length > 0) {
      for (const variant of upgrade.synergyVariants) {
        if (variant && variant.provider && state.levels[variant.provider] > 0) {
          return variant.text || "";
        }
      }
    }
    const arr = upgrade.descByLevel;
    if (arr && arr.length > 0) {
      const idx = level <= 0 ? 0 : Math.min(level - 1, arr.length - 1);
      return arr[idx];
    }
    return upgrade.desc || "";
  }

  global.DF.sim.core = {
    selfContrib,
    synergyMult,
    computeMpc,
    computeMps,
    computeAps,
    computeRates,
    cost,
    getUpgradeFlavor,
  };
})(typeof window !== 'undefined' ? window : globalThis);

// UMD shim — for Node test harness use (Phase 3+). Harmless in browser.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = (typeof window !== 'undefined' ? window : globalThis).DF.sim.core;
}
