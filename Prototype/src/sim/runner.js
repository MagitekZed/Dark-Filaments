// Dark Filaments — sim runner
// runSimulation(params, scenario) → { headline, trace, finalState }
//
// 1 Hz tick loop matching the prototype's tick rate. Per tick:
//   1. Compute MPC, MPS, APS from current state.
//   2. Apply income for the tick: passive (mps) + click (mpc × cpm/60 × engagement) + auto (aps × mpc).
//   3. Call DF.sim.strategy.decideAction.
//   4. Apply the resulting action (buy / transition / save / none).
//   5. Append a trace row.
//
// Loaded as a plain <script> from file://. UMD shim for Node use.

(function (global) {
  'use strict';
  global.DF = global.DF || {};
  global.DF.sim = global.DF.sim || {};

  // Resolve dependencies. In the browser they're already on global.DF.sim.
  // In Node, we require() them lazily so the file is independently loadable.
  function deps() {
    const ns = global.DF && global.DF.sim ? global.DF.sim : null;
    if (ns && ns.core && ns.strategy && ns.data) return { core: ns.core, strategy: ns.strategy, data: ns.data };
    if (typeof require !== 'undefined') {
      const core = require('./core.js');
      const strategy = require('./strategy.js');
      const data = require('./data.js');
      return { core, strategy, data };
    }
    throw new Error("DF.sim dependencies not loaded (need core, strategy, data).");
  }

  // Per-tier configuration. Under the 2026-05-13 ladder renumber + the user's
  // locked decision "let the formula drive" (no hardcoded TIER_CONFIGS values):
  // consolidationThreshold is computed from the engine formula
  //   consolidationThreshold_T_n = base × growth^(n-1)
  // where base = DEFAULT_PARAMS.consolidationThreshold (1.0) and growth =
  // DEFAULT_PARAMS.consolidationGrowth (2.50). The dictionary still enumerates which
  // tiers are implemented (consumed by playtest.js + simulator.js to populate
  // tier-skip dropdowns), but the consolidationThreshold value is derived once at
  // module-load time so the formula is the single source of truth.
  //
  // Implemented tiers (post-renumber):
  //   T1 Solar System        consolidationThreshold = 1.0
  //   T2 Stellar Neighborhood              = 2.5
  //   T3 Dwarf Spheroidal                  = 6.25
  //   T4 Galactic Arm  (was T3)            = 15.625
  //   T5 Galaxy        (was T4)            = 39.0625
  function buildTierConfig(tier, data) {
    const base = (data && data.DEFAULT_PARAMS && data.DEFAULT_PARAMS.consolidationThreshold != null)
      ? data.DEFAULT_PARAMS.consolidationThreshold : 1.0;
    const growth = (data && data.DEFAULT_PARAMS && data.DEFAULT_PARAMS.consolidationGrowth != null)
      ? data.DEFAULT_PARAMS.consolidationGrowth : 2.5;
    return {
      consolidationThreshold: base * Math.pow(growth, tier - 1),
      // Carry-over is computed at runtime from the prior tier's exit state via
      // scenario.carryFrom (or auto-derived); these static defaults are only
      // used when a caller forgets to supply carryFrom (tests, malformed
      // scenarios). T1 has no carry by definition.
      carry: { allMps: 1.0, allMpc: 1.0, allAps: 1.0 },
      carryMps: 0, carryMpc: 0, carryAps: 0, startingMass: 0,
    };
  }

  // TIER_CONFIGS — built once at module load. Tiers 1..5 implemented today.
  // Adding a new tier (T6+) is just adding its key here and dropping new
  // upgrades into data.UPGRADES; the formula handles consolidationThreshold.
  const TIER_CONFIGS = (function () {
    // Pull data lazily so the order-of-load with data.js is tolerant. In Node
    // tests we re-resolve via deps() per-call inside runSimulation, but the
    // TIER_CONFIGS surface is read by external consumers (playtest.js,
    // simulator.js) at module-load time.
    let dataMod = null;
    try {
      const ns = global.DF && global.DF.sim ? global.DF.sim : null;
      if (ns && ns.data) dataMod = ns.data;
      else if (typeof require !== 'undefined') dataMod = require('./data.js');
    } catch (e) { dataMod = null; }
    const cfg = {};
    const TIERS_IMPLEMENTED = [1, 2, 3, 4, 5];
    for (const t of TIERS_IMPLEMENTED) cfg[t] = buildTierConfig(t, dataMod);
    return cfg;
  })();

  // Filter upgrades to those active in `tier`. Upgrades from earlier tiers
  // continue to apply through carryFrom (their effects are baked into the
  // carryover floor) but are NOT re-buyable. Upgrades without an explicit
  // `tier` field are treated as tier 1 (legacy data shape).
  function upgradesForTier(allUpgrades, tier) {
    return allUpgrades.filter(u => (u.tier == null ? 1 : u.tier) === tier);
  }

  // Compute the carryover income floor + global multiplier carries from an
  // exit-state of a prior tier. Used to seed T2 (and beyond) with the income
  // that the prior tier's upgrades continue to provide. Returns a payload
  // matching the shape of TIER_CONFIGS[t].carry / carryMps / carryMpc / carryAps
  // / startingMass, plus a `levels` snapshot for diagnostics.
  //
  // SINGLE-TIER primitive. Walks only the upgrades passed in via priorUpgrades.
  // Higher-level multi-tier composition is provided by composeCarryChain below.
  //
  // SEMANTIC (post 2026-05-10 "no frozen floors" fix):
  // The returned floors are the RAW Σ(self·syn) from the prior tier's owned
  // upgrades — NO `allMps`/`allMpc`/`allAps` multiplication is applied to them.
  // The runner re-multiplies floors by the LIVE cumulative all-mult product at
  // each tick, so new multipliers acquired in later tiers correctly amplify
  // earlier-tier contributions. Mirrors the load-bearing rule that every owned
  // ×all multiplier compounds across all owned stackable contributions.
  //
  // Equivalent rewrite of MPS at any time:
  //   mps_live = (Σ over ALL owned upgrades of self·syn) × Π(allMps^N over ALL owned)
  // Option C just splits the sum (carry floor + active tier) and the product
  // (carry allMult × active tier allMult), preserving the carry-payload shape.
  //
  // Deps: needs core for the rate computations. The `priorUpgrades` array
  // should be the prior tier's full upgrade slice (tier-filtered already).
  // Optional `allUpgrades` (5th arg) widens the synergy-provider list so
  // cross-tier synergy declarations (e.g. T2 Local Bubble providing
  // additive +0.04/lvl to T3 HII Region) resolve correctly when computing
  // a later-tier handoff. Falls back to priorUpgrades, preserving behavior
  // for legacy callers that only know about a single tier.
  function computeCarryover(priorState, priorUpgrades, priorParams, core, allUpgrades) {
    // Walk priorUpgrades directly: sum the raw self·syn for each (NO allMps
    // factor); separately accumulate the product of allMps^N. This is the
    // crux of the fix — previously we called core.computeMps which folds the
    // allMps factor into the floor, leaving the floor "frozen" at that level
    // when carried forward. Now floors are raw and allMults are stored
    // separately so they compose live.
    const synProviders = allUpgrades || priorUpgrades;
    let baseMps = 0, baseMpc = 0, baseAps = 0;
    let allMps = 1, allMpc = 1, allAps = 1;
    for (const u of priorUpgrades) {
      const N = priorState.levels[u.name] || 0;
      if (N === 0) continue;
      const syn = core.synergyMult(u.name, priorState.levels, priorUpgrades, synProviders);
      baseMps += core.selfContrib(N, u.baseMps, u.addMps, u.selfMps) * syn;
      baseMpc += core.selfContrib(N, u.baseMpc, u.addMpc, u.selfMpc) * syn;
      baseAps += core.selfContrib(N, u.baseAps, u.addAps, u.selfAps) * syn;
      allMps *= Math.pow(u.allMps, N);
      allMpc *= Math.pow(u.allMpc, N);
      allAps *= Math.pow(u.allAps, N);
    }

    // NOTE on baseMpc: previously we subtracted the new tier's +1 baseline
    // from the MPC floor to avoid double-counting. Under the new semantic,
    // the floor is the raw self·syn sum (no +1 baseline included), so there
    // is nothing to subtract — the runner adds the +1 baseline back as part
    // of the active-tier compute. This branch is retained as a no-op for
    // documentation; priorParams is unused now and may be removed in a future
    // cleanup.
    void priorParams;

    return {
      startingMass: priorState.mass,
      levels: Object.assign({}, priorState.levels),
      carryMps: baseMps,  // RAW: not multiplied by allMps. Runner applies all-mults at tick time.
      carryMpc: baseMpc,  // RAW: not multiplied by allMpc; no +1 baseline either.
      carryAps: baseAps,  // RAW: not multiplied by allAps.
      carry: { allMps, allMpc, allAps },
    };
  }

  // Compose carry cumulatively across ALL prior tiers. The load-bearing rule
  // "stats carry over between tiers" means every owned upgrade from every
  // prior tier continues to produce its contribution forever AND every owned
  // ×all multiplier compounds across all owned stackable contributions.
  //
  // SEMANTIC (post 2026-05-10 fix — Option C, "no frozen floors"):
  //   Floors are RAW Σ(self·syn) sums. They do NOT have any allMps/allMpc/allAps
  //   factors applied; the runner re-multiplies them at every tick by the LIVE
  //   cumulative product of allMults across ALL owned tiers (carry × active).
  //   This guarantees that new multipliers acquired in later tiers amplify
  //   prior-tier contributions exactly as the rule demands.
  //
  // Inputs:
  //   priorFinal     — the just-completed tier's finalState. Its `.levels`
  //                    must include owned levels for ALL prior tiers.
  //   currentTier    — the tier we're seeding (e.g. 3 for T3 startup).
  //   allUpgrades    — full upgrade list (data.UPGRADES or override).
  //   params         — unused under the new semantic (the +1 baseline no
  //                    longer needs subtracting). Retained for signature
  //                    compatibility with existing callers.
  //   core           — for synergyMult/selfContrib.
  //
  // Output: same shape as before — startingMass, levels, carryMps/Mpc/Aps,
  // carry: { allMps, allMpc, allAps } — but with floors now interpreted as
  // RAW base sums (Option C semantic).
  //
  // For each prior tier T_n we accumulate:
  //   baseFloor_n = Σ over T_n upgrades U of selfContrib(N_U) · synergyMult(U)
  //   allMult_n   = Π over T_n upgrades U of (u.allMps ^ N_U)   (and Mpc/Aps)
  //
  // synergyMult uses synergyProviders=allUpgrades so cross-tier synergy
  // providers resolve correctly. For example, a T2 Local Bubble level
  // declared as a provider for T3 HII Region only changes HII Region's
  // self·syn at T3 (a different tier than what we're summing here); the
  // synergyMult of any T_n upgrade still resolves against its own intra-tier
  // and cross-tier providers consistently.
  function composeCarryChain(priorFinal, currentTier, allUpgrades, params, core) {
    let allMps = 1, allMpc = 1, allAps = 1;
    let baseMps = 0, baseMpc = 0, baseAps = 0;
    void params;  // unused under new semantic; signature preserved for callers.
    const synProviders = allUpgrades;
    for (let priorT = 1; priorT < currentTier; priorT++) {
      const priorTUpgrades = upgradesForTier(allUpgrades, priorT);
      for (const u of priorTUpgrades) {
        const N = priorFinal.levels[u.name] || 0;
        if (N === 0) continue;
        const syn = core.synergyMult(u.name, priorFinal.levels, priorTUpgrades, synProviders);
        baseMps += core.selfContrib(N, u.baseMps, u.addMps, u.selfMps) * syn;
        baseMpc += core.selfContrib(N, u.baseMpc, u.addMpc, u.selfMpc) * syn;
        baseAps += core.selfContrib(N, u.baseAps, u.addAps, u.selfAps) * syn;
        allMps *= Math.pow(u.allMps, N);
        allMpc *= Math.pow(u.allMpc, N);
        allAps *= Math.pow(u.allAps, N);
      }
    }
    return {
      startingMass: priorFinal.mass,
      levels: Object.assign({}, priorFinal.levels),
      carryMps: baseMps,  // RAW Σ self·syn from all prior tiers. NOT multiplied by allMps.
      carryMpc: baseMpc,  // RAW Σ self·syn from all prior tiers' MPC stackables.
      carryAps: baseAps,
      carry: { allMps, allMpc, allAps },
    };
  }

  // Build initial sim state for a scenario.
  function initialState(scenario, upgrades, tierCfg) {
    const levels = {};
    for (const u of upgrades) levels[u.name] = 0;
    return {
      tick: 0,
      time_s: 0,
      mass: tierCfg.startingMass || 0,
      consolidation: 0,
      levels,
      totalClicks: 0,
      massFromClicks: 0,
      massFromPassive: 0,
      massFromAuto: 0,
      thresholdHitTick: null,
    };
  }

  function deepCopyLevels(levels) {
    const out = {};
    for (const k in levels) out[k] = levels[k];
    return out;
  }

  // Run a sim. Returns { headline, trace, finalState }.
  // params required keys: cpm, engagement, saveVpcThreshold, consolidationThreshold (optional, defaults from tier).
  // scenario required keys: tier (1 or 2), mode ("threshold" | "completion").
  // scenario optional keys:
  //   upgrades       — override upgrade list (Parameters-tab editor snapshot)
  //   carryFrom      — finalState of a prior tier's run (auto-derives carry params)
  //   handoffMode    — "threshold" | "completion" — which T1 mode to seed T2 from
  //                    when carryFrom is absent. The runner will execute T1 in this
  //                    mode internally and use its finalState as carryFrom. Default:
  //                    "completion".
  function runSimulation(params, scenario) {
    const { core, strategy, data } = deps();
    // Caller may pass an override upgrades array (e.g., the Parameters-tab editor's
    // store snapshot). Falls back to data.UPGRADES so legacy callers keep working.
    const allUpgrades = (scenario && scenario.upgrades) || data.UPGRADES;
    const tier = scenario.tier || 1;
    const upgrades = upgradesForTier(allUpgrades, tier);
    const cl = strategy.classify(upgrades);
    // Per the 2026-05-13 "let the formula drive" decision: if a tier is
    // outside the implemented set in TIER_CONFIGS (e.g., harness probing
    // T6+ before data lands), fall back to the live formula via data so the
    // runner still produces a valid consolidationThreshold rather than reverting
    // to T1's threshold.
    const tierCfg = TIER_CONFIGS[tier] || buildTierConfig(tier, data);

    // ---- Carry-over wiring ------------------------------------------------
    // For tier > 1, we need a prior-tier finalState. If the caller hasn't
    // supplied one via scenario.carryFrom, run the prior tier internally in
    // the requested handoff mode (default "completion") and use that exit
    // state. The prior run uses the same params (cpm, engagement, etc.).
    let carryPayload = null;
    if (tier > 1) {
      let priorFinal = scenario.carryFrom || null;
      if (!priorFinal) {
        const handoffMode = scenario.handoffMode || 'completion';
        const priorRun = runSimulation(params, {
          tier: tier - 1,
          mode: handoffMode,
          upgrades: allUpgrades,
        });
        priorFinal = priorRun.finalState;
      }
      // Compose carry across ALL prior tiers (T1..tier-1), not just the
      // immediate prior tier. Mirrors playtest.js transitionToNextTier's
      // tier-by-tier accumulation so the load-bearing "stats carry over
      // between tiers" rule is honored: T1's flat additives (Solar Wind, etc.)
      // and allMults (Orbital Resonance ×1.25) reach T3+ correctly, whereas
      // the single-tier computeCarryover call would silently drop them.
      // See current-state.md §3 / §9b for the full diagnosis.
      carryPayload = composeCarryChain(priorFinal, tier, allUpgrades, params, core);
    }

    // Effective params merge — caller can override anything. carryPayload (if
    // present) overrides the static tierCfg carry defaults.
    // synergyProviders is the unfiltered upgrade list — exposed to strategy / VPC
    // math so that prior-tier owned upgrades' synergies (e.g. T2 Local Bubble →
    // T3 HII Region) resolve into the active tier despite the active-tier filter.
    // baseMpc reads from DEFAULT_PARAMS so the M☉ retune (2026-05-12) flows
    // through: DEFAULT_PARAMS.baseMpc 1.0→0.02 actually takes effect here.
    // Prior to this fix, this slot hardcoded 1.0, silently overriding the
    // engine-wide default and bypassing the retune entirely.
    const defaultBaseMpc = (data.DEFAULT_PARAMS && data.DEFAULT_PARAMS.baseMpc != null)
      ? data.DEFAULT_PARAMS.baseMpc : 1.0;
    const p = Object.assign({}, {
      cpm: 100,
      engagement: 1.0,
      saveVpcThreshold: 1.5,
      consolidationThreshold: tierCfg.consolidationThreshold,
      baseMpc: defaultBaseMpc,
      baseMps: 0.0,
      maxTicks: 60000,
      carry: (carryPayload && carryPayload.carry) || tierCfg.carry,
      carryMps: (carryPayload && carryPayload.carryMps) || tierCfg.carryMps,
      carryMpc: (carryPayload && carryPayload.carryMpc) || tierCfg.carryMpc,
      carryAps: (carryPayload && carryPayload.carryAps) || tierCfg.carryAps,
      synergyProviders: allUpgrades,
      // Mode passed through to strategy so it can mask completionist purchases
      // in Threshold mode. T1/T2 callers omitting mode default to "completion"
      // semantics → byte-identical behavior preserved (the runner's own
      // threshold-exit was the only mode-aware logic before this).
      mode: scenario.mode || "completion",
      // Per-tier engagement curve — populated from data.DEFAULT_PARAMS so callers
      // that don't pass it still get the curve. If a tier is missing, fall back to
      // the global engagement value below.
      perTierEngagement: data.DEFAULT_PARAMS && data.DEFAULT_PARAMS.perTierEngagement
        ? data.DEFAULT_PARAMS.perTierEngagement
        : null,
    }, params);
    // params override of tier-derived carry/consolidationThreshold should not happen
    // by accident — re-apply our derived carry params after the merge so the
    // caller's params can't accidentally null them out (Object.assign keeps
    // params' values when both objects have the key, even when params has them
    // as undefined). We therefore copy them back deliberately here.
    if (tier > 1 && carryPayload) {
      p.carry = carryPayload.carry;
      p.carryMps = carryPayload.carryMps;
      p.carryMpc = carryPayload.carryMpc;
      p.carryAps = carryPayload.carryAps;
      p.consolidationThreshold = tierCfg.consolidationThreshold;
    }

    // Resolve effective engagement for this run.
    //   effEngagement = perTierEngagement[scenario.tier] × engagement
    // The per-tier curve (Parameters tab) is the baseline; engagement (Simulator quick-strip)
    // is a global multiplier on top — 1.0 means "use the curve as-is", 0.5 means "halve every
    // tier", 2.0 means "double every tier". When the per-tier value is missing (older callers
    // that pass only engagement), fall back to engagement alone. T1's curve defaults to 1.0,
    // so legacy validate.js callers passing { engagement: 1.0 } see byte-identical output.
    const perTier = (p.perTierEngagement && p.perTierEngagement[tier] != null
                     && isFinite(p.perTierEngagement[tier]))
      ? p.perTierEngagement[tier]
      : null;
    const effEngagement = (perTier != null) ? perTier * p.engagement : p.engagement;

    const state = initialState(scenario, upgrades, tierCfg);
    // Seed starting mass from carry-over (T2+).
    if (carryPayload) state.mass = carryPayload.startingMass;
    // Seed prior-tier levels into state.levels so cross-tier synergies can
    // resolve. The active tier's upgrades are still freshly zeroed; we just
    // bring forward levels for upgrades NOT in the active slice. A guard on
    // u.name being a known prior-tier upgrade keeps T3+ tiers from accidentally
    // overriding their own slice. T1/T2 carryPayload-less paths are unchanged.
    if (carryPayload && carryPayload.levels) {
      const activeNames = new Set(upgrades.map(u => u.name));
      for (const k in carryPayload.levels) {
        if (!activeNames.has(k)) state.levels[k] = carryPayload.levels[k];
      }
    }
    const trace = [];
    let transitioned = false;
    let exitReason = null;
    // Reading B anchor: peak in-tier mass at the moment the Consolidation gate is
    // crossed (NOT the exit-tick residual after the transition purchase). Tracks
    // the maximum mass observed during the tier; under the strategy's greedy-VPC
    // behavior, this lands at the tick the gate-crossing purchase decision was
    // made — just before the actual purchase debits the cost. Used by sweep.js's
    // mass-band check to compare like-with-like against engagement-profile runs.
    let peakMass = 0;

    // Carry payload — pulled into a single object so the new composed-rate
    // helper can read all of it in one pass. Under Option C (post 2026-05-10),
    // `carryMps/Mpc/Aps` are RAW Σ self·syn from prior tiers (NOT pre-multiplied
    // by allMps) and `allMps/Mpc/Aps` are the cumulative all-mult products. At
    // tick time, computeRates re-multiplies floors by the LIVE allMult product
    // (carry × active), so any new multiplier acquired in this tier amplifies
    // prior-tier contributions exactly as the load-bearing rule demands.
    // For T1 the carry is identity (allX=1, carryX=0) → byte-identical to the
    // legacy computeMps/Mpc/Aps path.
    const carryForCompute = {
      allMps: (p.carry && p.carry.allMps != null) ? p.carry.allMps : 1,
      allMpc: (p.carry && p.carry.allMpc != null) ? p.carry.allMpc : 1,
      allAps: (p.carry && p.carry.allAps != null) ? p.carry.allAps : 1,
      carryMps: p.carryMps || 0,
      carryMpc: p.carryMpc || 0,
      carryAps: p.carryAps || 0,
    };

    for (let tick = 0; tick <= p.maxTicks; tick++) {
      state.tick = tick;
      state.time_s = tick;

      // 1. Compute current rates from active-tier upgrades + carry. The new
      // computeRates helper folds (carry-floor + active-self·syn) and multiplies
      // by (carry-allMult × active-allMult), implementing the rule:
      //   mps = (Σ self·syn over ALL owned) × Π (allMps^N over ALL owned)
      // synergyProviders (allUpgrades) is passed through so cross-tier synergies
      // (e.g. T2 Local Bubble levels boosting T3 HII Region) resolve correctly.
      const rates = core.computeRates(state, upgrades, carryForCompute, p, allUpgrades);
      let mpc = rates.mpc, mps = rates.mps, aps = rates.aps;

      // 2. Apply income for this tick (1 second of game time).
      // At tick 0, no income has accrued yet.
      let clickInc = 0, passInc = 0, autoInc = 0;
      const massIn = state.mass;
      if (tick > 0 && !transitioned) {
        clickInc = mpc * p.cpm / 60 * effEngagement;
        passInc = mps;
        autoInc = aps * mpc;
        state.mass += clickInc + passInc + autoInc;
        state.massFromClicks += clickInc;
        state.massFromPassive += passInc;
        state.massFromAuto += autoInc;
        // Track total clicks for headline: cpm × effEngagement × seconds.
        state.totalClicks += p.cpm / 60 * effEngagement;
      }
      // Reading B peak-mass tracking: sample AFTER income, BEFORE purchase. The
      // pre-purchase peak is what the player would see on the counter at the
      // moment the gate-crossing purchase is committed.
      if (state.mass > peakMass) peakMass = state.mass;

      // Track threshold-hit tick (first tick where consolidation ≥ threshold).
      // Floating-point tolerance: T3's tiered consolidation (Bulge 7×0.30 + 0.90 + 3.25)
      // sums to 6.249999999999999 in IEEE 754, which trips a strict ≥ 6.25 compare.
      // 1e-9 is well below any meaningful design granularity (consolidation contributions
      // are 0.30 / 0.40 / 0.60 / 0.90 / 1.0 / 3.25 — orders of magnitude above eps).
      const CONSOLIDATION_EPS = 1e-9;
      if (state.consolidation + CONSOLIDATION_EPS >= p.consolidationThreshold && state.thresholdHitTick == null) {
        state.thresholdHitTick = tick;
      }

      // Threshold-mode early exit: as soon as consolidation ≥ threshold (not requiring completionists).
      if (scenario.mode === "threshold" && state.consolidation + CONSOLIDATION_EPS >= p.consolidationThreshold) {
        exitReason = "threshold_reached";
        trace.push(traceRow(tick, state, "exit_threshold", null, null, null, mpc, mps, aps,
                            clickInc, passInc, autoInc, massIn, state.mass));
        break;
      }

      // 3. Decide action.
      const action = strategy.decideAction(state, p, upgrades);

      // 4. Apply.
      let actionType = action.action;
      let upgradeBought = null, costPaid = null, target = null;

      if (action.action === "transition") {
        transitioned = true;
        exitReason = "transition";
        trace.push(traceRow(tick, state, "transition", null, null, null, mpc, mps, aps,
                            clickInc, passInc, autoInc, massIn, state.mass));
        break;
      } else if (action.action === "buy") {
        const u = upgrades.find(x => x.name === action.upgrade);
        if (u && state.mass >= action.cost) {
          state.mass -= action.cost;
          state.levels[u.name] = (state.levels[u.name] || 0) + 1;
          state.consolidation += u.consolidation;
          upgradeBought = u.name;
          costPaid = action.cost;
        }
      } else if (action.action === "save") {
        target = action.target;
      }
      // "none" → no-op

      // 5. Trace row.
      trace.push(traceRow(tick, state, actionType, upgradeBought, costPaid, target,
                          mpc, mps, aps, clickInc, passInc, autoInc, massIn, state.mass));
    }

    // Build headline.
    const completionistDone = cl.completionists.every(name => {
      const u = upgrades.find(x => x.name === name);
      return state.levels[name] >= u.maxLevels;
    });

    const headline = {
      totalTime_s: state.time_s,
      totalTicks: state.tick,
      finalMass: state.mass,
      peakMass,
      totalClicks: state.totalClicks,
      massFromClicks: state.massFromClicks,
      massFromPassive: state.massFromPassive,
      massFromAuto: state.massFromAuto,
      clickShare: (state.massFromClicks + state.massFromPassive + state.massFromAuto) > 0
        ? state.massFromClicks / (state.massFromClicks + state.massFromPassive + state.massFromAuto)
        : 0,
      levels: deepCopyLevels(state.levels),
      consolidation: state.consolidation,
      completionistDone,
      thresholdHitTick: state.thresholdHitTick,
      thresholdHit_s: state.thresholdHitTick,
      transitioned,
      exitReason,
    };

    return { headline, trace, finalState: state };
  }

  function traceRow(tick, state, action, upgradeBought, costPaid, target,
                    mpc, mps, aps, clickInc, passInc, autoInc, massIn, massOut) {
    const row = {
      tick,
      time_s: tick,
      mass_in: massIn,
      click_income: clickInc,
      passive_income: passInc,
      auto_income: autoInc,
      mpc, mps, aps,
      action,
      mass_out: massOut,
      consolidation: state.consolidation,
      levels: deepCopyLevels(state.levels),
    };
    if (upgradeBought != null) row.upgrade = upgradeBought;
    if (costPaid != null) row.cost = costPaid;
    if (target != null) row.target = target;
    return row;
  }

  global.DF.sim.runner = {
    runSimulation,
    TIER_CONFIGS,
    // Phase 6 helpers exposed for the playtest tab's multi-tier flow. Browser
    // callers should `require()` core/data themselves or pass them in; the
    // functions are pure and have no closure dependencies beyond their args.
    computeCarryover,
    composeCarryChain,
    upgradesForTier,
  };
})(typeof window !== 'undefined' ? window : globalThis);

// UMD shim — for Node test harness use. Harmless in browser.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = (typeof window !== 'undefined' ? window : globalThis).DF.sim.runner;
}
