// Dark Filaments — Playtest tab UI
// The original T1 prototype's inline UI script, lifted verbatim (semantically)
// from dark-filaments-t1.html as part of Phase 2 of the JS sim migration.
//
// Phase 2 is a pure UI restructure: behavior is preserved bit-for-bit.
// Math still lives in DF.sim.core / DF.sim.data — this file only renders state
// and wires DOM events. The exported boot fn is DF.ui.playtest.init().
//
// Loaded as a plain <script> from file://. Pattern: IIFE attaches to window.DF.ui.playtest.

(function (global) {
  'use strict';
  global.DF = global.DF || {};
  global.DF.ui = global.DF.ui || {};

  // ---- Module-scope state (was inline at file top) ----

  const UPGRADES = global.DF.sim.data.UPGRADES;
  const DEFAULT_PARAMS = global.DF.sim.data.DEFAULT_PARAMS;
  const fmt        = global.DF.ui.format.fmt;
  const fmtMass    = global.DF.ui.format.fmtMass;
  const fmtCost    = global.DF.ui.format.fmtCost;
  const fmtTime    = global.DF.ui.format.fmtTime;
  const fmtLogLine = global.DF.ui.format.fmtLogLine;

  // Highest tier with upgrades defined in data.UPGRADES. Computed once at boot
  // so the playtest naturally covers whatever tiers are populated. Upgrades
  // missing a `tier` field are treated as tier 1 (legacy data shape).
  const MAX_TIER = Math.max(...UPGRADES.map(u => (u.tier == null ? 1 : u.tier)));

  // Consolidation threshold for a given tier. Mirrors DEFAULT_PARAMS notes:
  //   consolidation_T_n_to_T_n+1 = consolidationThreshold × consolidationGrowth^(n-1)
  // Field name aligned with the player-facing label by the 2026-05-13
  // consolidation rename pass (previously the engine retained the legacy
  // `consolidation` identifier as a relic).
  function consolidationThresholdForTier(tier) {
    const base = DEFAULT_PARAMS.consolidationThreshold;
    const growth = DEFAULT_PARAMS.consolidationGrowth;
    return base * Math.pow(growth, tier - 1);
  }

  // Cumulative consolidation budget through tier N inclusive. Used by the
  // expanding-progress-bar (which never resets across tiers) — the bar fill
  // is `cumulative_so_far / cumulative_total_through_current_tier`, so at
  // each tier-up the filled portion compresses leftward (the denominator
  // grows). T1 = 1.0; T2 = 1.0 + 2.5 = 3.5; T3 = 3.5 + 6.25 = 9.75.
  function cumulativeBudgetThroughTier(tier) {
    let sum = 0;
    for (let t = 1; t <= tier; t++) sum += consolidationThresholdForTier(t);
    return sum;
  }

  // Filter the canonical upgrade list to those active at a given tier. Used
  // both for the live game (which upgrades are visible / buyable) and for
  // building the per-tier carryover payload at transitions.
  const upgradesForTier = (tier) =>
    UPGRADES.filter(u => (u.tier == null ? 1 : u.tier) === tier);

  const state = {
    mass: 0,
    consolidation: 0,
    levels: Object.fromEntries(UPGRADES.map(u => [u.name, 0])),
    ended: false,
    sessionStart: Date.now(),
    clicks: 0,
    log: [],
    clickTimestamps: [],
    tickCount: 0,
    massFromClicks: 0,
    massFromPassive: 0,
    // APS-from-upgrades income (continuous stream, aps × mpc per 1 Hz tick).
    // Separate channel from massFromClicks (manual clicks + dev autoclicker via
    // pull()) and massFromPassive (mps). Owning APS upgrades (T2 RLO, T3 SDW/HVC,
    // etc.) produces mass through this bucket; the dev-tool autoclicker still
    // produces click income exclusively.
    massFromAuto: 0,
    consolidationHitMs: null,
    // Multi-tier playtest flow (added when T2 came online via Phase 6 data).
    currentTier: 1,
    consolidationThreshold: consolidationThresholdForTier(1),
    // Carry payload from completed prior tiers. T1 starts with no carry
    // (1× multipliers, 0 floors). On End Tier N → T(N+1) we recompute via
    // DF.sim.runner.computeCarryover and replace this object wholesale.
    //   allMps/allMpc/allAps — multiplicative carries from prior-tier owned
    //                          one-shots (Orbital Resonance ×1.25 etc.).
    //   mpsFloor/mpcFloor/apsFloor — frozen-at-exit income floors. The new
    //                          tier's own +1 baseMpc still applies on top.
    carry: { allMps: 1.0, allMpc: 1.0, allAps: 1.0, mpsFloor: 0, mpcFloor: 0, apsFloor: 0 },
    // Per-tier timestamp + state snapshots for the multi-tier session report.
    // Index n-1 is the snapshot for tier n. Filled progressively as tiers
    // start / hit consolidation / end.
    tierSnapshots: [
      { tier: 1, startMs: 0, thresholdHitMs: null, endMs: null,
        levelsAtEnd: null, massAtEnd: null, consolidationHitMs: null },
    ],
    // Pause/resume — dev-tool-grade session control. Doesn't persist across
    // refresh; refresh = fresh session, same as the rest of T1 prototype.
    //   paused          — true while the session is frozen.
    //   totalPausedMs   — cumulative paused duration across the session;
    //                     subtracted from every wall-clock-derived elapsed
    //                     reading via getElapsedMs().
    //   pauseStartedAt  — wall-clock ms (Date.now) when the current pause
    //                     began. null when not paused.
    paused: false,
    totalPausedMs: 0,
    pauseStartedAt: null,
  };

  let tickInterval = null;
  // 10 s autosave timer (long-burn v1 / E1). Started in init() once the live
  // state object is ready to be serialized. beforeunload + endTier + skipToTier
  // also flush via saveNow(), independent of this interval.
  let autoSaveInterval = null;
  const AUTO_SAVE_INTERVAL_MS = 10000;
  // Tracks how many tier-skips have been applied during this universe (for
  // the SavePayload meta block; informational only). Bumped in skipToTier and
  // re-seeded from a restored save at boot.
  let devSkipsApplied = 0;
  // True only while restoreFromSave is mutating live state — suppresses any
  // logEvent emit during the splat so the restored log isn't double-stamped
  // with synthetic restore events (we emit one explicit "restore" event at
  // the end of the splat).
  let restoreInProgress = false;
  const upgradeRowRefs = {};

  // Wall-clock elapsed milliseconds since session start, EXCLUDING any time
  // spent paused. All session-relative timestamps (log events, snapshots,
  // CPM window, reports) flow through this helper so the math is consistent.
  // Equivalent to: Date.now() - sessionStart - totalPausedMs - currentPauseSoFar.
  function getElapsedMs() {
    const now = Date.now();
    let elapsed = now - state.sessionStart - state.totalPausedMs;
    if (state.paused && state.pauseStartedAt != null) {
      elapsed -= (now - state.pauseStartedAt);
    }
    return elapsed;
  }

  // Math primitives are implemented in src/sim/core.js. These thin local
  // wrappers adapt the call-sites (which read state.levels and UPGRADES from
  // closure) to the pure functions in DF.sim.core, layering the prior-tier
  // carry-over on top so completed-tier upgrades' effects continue to flow
  // through the live game.
  //
  // Option-C semantic (post 2026-05-10): the carry's mpsFloor/mpcFloor/apsFloor
  // are RAW Σ self·syn from prior tiers (NOT pre-multiplied by allMps/Mpc/Aps).
  // At each compute time, the cumulative all-mult product (carry × active) is
  // applied LIVE to (carryFloor + active self·syn). New multipliers acquired
  // in the active tier amplify prior-tier contributions exactly as the load-
  // bearing rule "every owned ×all multiplier compounds across all owned
  // contributions" demands.
  //
  // Mathematically the same as DF.sim.core.computeRates; computed inline here
  // to avoid an extra function-call layer and to keep state.carry shape
  // adapted (the runner's payload uses carry.carryMps; the playtest's uses
  // carry.mpsFloor — same numbers, different field name).
  function _composedRates() {
    const ups = upgradesForTier(state.currentTier);
    const carry = state.carry;
    return global.DF.sim.core.computeRates(
      state, ups,
      {
        allMps: carry.allMps, allMpc: carry.allMpc, allAps: carry.allAps,
        carryMps: carry.mpsFloor, carryMpc: carry.mpcFloor, carryAps: carry.apsFloor,
      },
      DEFAULT_PARAMS
    );
  }
  function computeMpc() { return _composedRates().mpc; }
  function computeMps() { return _composedRates().mps; }
  // APS (auto-clicks per second): same carry-over shape as MPS/MPC. T1 has no
  // APS sources so this is 0 there; T2's Roche Lobe Overflow (stackable) and
  // Binary Partner (one-shot) make it non-zero. Surfaced in the live stats line
  // via a stat-aps element that hides when the value is 0.
  function computeAps() { return _composedRates().aps; }
  function costToBuy(u) { return global.DF.sim.core.cost(u, state.levels[u.name]); }

  // ---- Save / Restore (long-burn v1, E1) -----------------------------
  //
  // saveNow() serializes the live state to localStorage. Called from:
  //   - the 10 s autosave interval (started in init())
  //   - beforeunload (tab close / refresh)
  //   - endTier() / transitionToNextTier() (immediately after tier handoff)
  //   - skipToTier() (after dev-tool tier-skip)
  //
  // restoreFromSave() splats a deserialized payload back into the live state
  // object, leaving the playtest module's other globals (UPGRADES, refs,
  // timers) untouched. Called once from init() before the tick loop starts.
  //
  // Offline-window handling (E1 behavior): the universe is FROZEN across the
  // away time — we add (now - savedAt) to totalPausedMs so getElapsedMs reads
  // continuously, but nothing accrues. E3 (sim/offline.js) will replace this
  // freeze with reconstructFromOfflineWindow at the same call site.

  function saveNow() {
    if (state.ended) return;  // do not autosave past the run-end
    const save = global.DF.sim && global.DF.sim.save;
    if (!save) return;
    const payload = save.serializeState(state, { devSkipsApplied });
    save.writeLocalSave(payload);
  }

  function restoreFromSave(payload) {
    if (!payload || !payload.game) return false;
    restoreInProgress = true;
    try {
      const g = payload.game;
      state.mass = g.mass;
      state.consolidation = g.consolidation;
      state.currentTier = g.currentTier;
      // levels: preserve current zero-default for unknown names, but overlay
      // every saved level so post-load buys + costs read correctly.
      state.levels = Object.fromEntries(UPGRADES.map(u => [u.name, 0]));
      for (const name of Object.keys(g.levels || {})) {
        if (name in state.levels) state.levels[name] = g.levels[name];
      }
      // Translate canonical (carryMps/...) → playtest's mpsFloor/... shape.
      const c = g.carry || {};
      state.carry = {
        allMps: c.allMps == null ? 1.0 : c.allMps,
        allMpc: c.allMpc == null ? 1.0 : c.allMpc,
        allAps: c.allAps == null ? 1.0 : c.allAps,
        mpsFloor: c.carryMps || 0,
        mpcFloor: c.carryMpc || 0,
        apsFloor: c.carryAps || 0,
      };
      state.consolidationThreshold = g.consolidationThreshold || consolidationThresholdForTier(state.currentTier);
      state.consolidationHitMs = g.consolidationHitMs == null ? null : g.consolidationHitMs;
      state.clicks = g.totalClicks || 0;
      state.massFromClicks = g.massGainedClicks || 0;
      state.massFromPassive = g.massGainedPassive || 0;
      state.massFromAuto = g.massGainedAuto || 0;
      state.tickCount = g.tickCount || 0;
      // tierSnapshots: drop the playtest's default T1 snapshot and adopt the
      // saved chain. Each saved entry already carries levelsAtEnd (cloned by
      // the serializer); we re-clone defensively to decouple from payload.
      state.tierSnapshots = (g.tierSnapshots || []).map(snap => Object.assign(
        {}, snap,
        { levelsAtEnd: snap && snap.levelsAtEnd ? Object.assign({}, snap.levelsAtEnd) : null },
      ));
      if (state.tierSnapshots.length === 0) {
        // Defensive: guarantee at least the current tier's open snapshot.
        state.tierSnapshots.push({
          tier: state.currentTier, startMs: 0, thresholdHitMs: null, endMs: null,
          levelsAtEnd: null, massAtEnd: null, consolidationHitMs: null,
        });
      }
      // Session clock + offline accrual (long-burn v1 / E3 replaces the
      // E1 freeze):
      //   1. Preserve sessionStart from the save.
      //   2. Compute offlineGapMs = (now - savedAt), capped at 24 h per
      //      engineering-plan §3 "24-hour offline cap applied at the call
      //      site (boot loader)".
      //   3. Run reconstructFromOfflineWindow in pure-idle mode (no purchases,
      //      cpm=0) — load-bearing rule: "Consolidation does not advance
      //      without active purchase decisions". The function advances mass
      //      from MPS + APS×MPC across the gap.
      //   4. Splat the offline-accrual result onto state.* so mass/income
      //      counters reflect the away time.
      //   5. Add the offline gap to totalPausedMs so getElapsedMs() reads
      //      continuously across the boundary (the away time is not session
      //      time — the player wasn't playing).
      state.sessionStart = g.sessionStart || Date.now();
      const savedAt = payload.savedAt || Date.now();
      const rawOfflineGapMs = Math.max(0, Date.now() - savedAt);
      const OFFLINE_CAP_MS = 24 * 60 * 60 * 1000;
      const offlineGapMs = Math.min(rawOfflineGapMs, OFFLINE_CAP_MS);
      const offlineGapSec = Math.floor(offlineGapMs / 1000);

      // Bring the SavePayload.game into a working seed for the offline runner.
      // We pass the payload's `game` directly — offline.js clones internally,
      // so this is non-mutating.
      const offlineMod = global.DF.sim && global.DF.sim.offline;
      let accrued = null;
      if (offlineMod && offlineGapSec > 0) {
        try {
          accrued = offlineMod.reconstructFromOfflineWindow(
            g, offlineGapSec,
            { cpm: 0, engagement: 1.0, allowPurchases: false },
          );
        } catch (e) {
          console.warn('offline accrual failed; falling back to freeze:', e && e.message);
          accrued = null;
        }
      }

      if (accrued && accrued.newState) {
        // Apply accrued mass + income breakdown back onto live state.
        state.mass = accrued.newState.mass;
        state.massFromClicks = accrued.newState.massGainedClicks;
        state.massFromPassive = accrued.newState.massGainedPassive;
        state.massFromAuto = accrued.newState.massGainedAuto;
        state.tickCount = accrued.newState.tickCount;
        // levels/carry/tier/consolidation: pure-idle mode never touches them, but
        // splat for forward-compat with future allowPurchases boot-time use.
        for (const name of Object.keys(accrued.newState.levels || {})) {
          if (name in state.levels) state.levels[name] = accrued.newState.levels[name];
        }
        state.carry = {
          allMps: accrued.newState.carry.allMps,
          allMpc: accrued.newState.carry.allMpc,
          allAps: accrued.newState.carry.allAps,
          mpsFloor: accrued.newState.carry.carryMps,
          mpcFloor: accrued.newState.carry.carryMpc,
          apsFloor: accrued.newState.carry.carryAps,
        };
        state.currentTier = accrued.newState.currentTier;
        state.consolidation = accrued.newState.consolidation;
        state.consolidationThreshold = accrued.newState.consolidationThreshold;
        state.consolidationHitMs = accrued.newState.consolidationHitMs;
      }
      // Whether or not offline accrual fired, the wall-clock gap is added to
      // totalPausedMs so getElapsedMs() stays continuous. The accrual is
      // mathematical "game time" inside the gap; for session-clock purposes
      // the player wasn't here.
      state.totalPausedMs = (g.totalPausedMs || 0) + offlineGapMs;
      state.paused = false;
      state.pauseStartedAt = null;
      state.clickTimestamps = [];
      // Live log resets on session restore — per §3 "Not persisted: log,
      // transient UI flags, pause state". The harness keeps its own buy log.
      state.log = [];
      state.ended = false;
      // Meta — propagate devSkipsApplied so the counter survives reloads.
      devSkipsApplied = (payload.meta && payload.meta.devSkipsApplied) || 0;
      // Stamp an offline_accrual entry on the live log so the user can see
      // what happened across the away window. Filtered the same way other
      // events are (renderLogPanel drops only click/tick).
      if (accrued && accrued.newState && offlineGapSec > 0) {
        state.log.push({
          t_ms: 0,
          type: 'offline_accrual',
          payload: {
            elapsed_sec: offlineGapSec,
            capped: rawOfflineGapMs > OFFLINE_CAP_MS,
            mass_before: g.mass,
            mass_after: state.mass,
            mass_gained: state.mass - g.mass,
          },
        });
      }
    } finally {
      restoreInProgress = false;
    }
    return true;
  }

  function cpmWindow() {
    const nowMs = getElapsedMs();
    const cutoff = nowMs - 30000;
    while (state.clickTimestamps.length && state.clickTimestamps[0] < cutoff) {
      state.clickTimestamps.shift();
    }
    const windowMs = Math.min(30000, Math.max(1, nowMs));
    return state.clickTimestamps.length * 60000 / windowMs;
  }

  function logEvent(type, payload) {
    const event = { t_ms: getElapsedMs(), type, payload };
    state.log.push(event);
    console.log(JSON.stringify(event));
    // Clicks and ticks are excluded from the live panel (see renderLogPanel);
    // skip the re-render for those event types — purely an efficiency match
    // for the display filter, not a behavioral one. `state.log` still gets
    // every event, so the live charts and session-end report stay accurate.
    if (type !== "click" && type !== "tick") renderLogPanel();
  }

  // ---- DOM init ----

  const $ = id => document.getElementById(id);

  function buildUpgrades() {
    const container = $("upgrades");
    // Build rows for every upgrade in every tier so we have stable refs for
    // the session report's per-tier table. Visibility per tier is governed
    // by the .hidden class, toggled in render() based on state.currentTier.
    for (const u of UPGRADES) {
      const row = document.createElement("div");
      row.className = "upgrade";
      row.dataset.tier = String(u.tier == null ? 1 : u.tier);

      // Per-level consolidation tooltip — load-bearing for tiered-consolidation upgrades
      // (today: T3 Galactic Bulge; any future upgrade matching the same
      // condition). Surfaces the per-level consolidation contribution that the level
      // counter alone (e.g. "3 / 7") doesn't communicate. Native title=
      // attribute matches the tooltip pattern used elsewhere in the prototype
      // (Parameters/Simulator panes).
      if (u.consolidation > 0 && u.maxLevels > 1) {
        row.title = "+" + u.consolidation.toFixed(2) + " consolidation / level";
      }

      const name = document.createElement("div");
      name.className = "u-name";
      name.textContent = u.name;

      const level = document.createElement("div");
      level.className = "u-level";

      const desc = document.createElement("div");
      desc.className = "u-desc";
      // Initial text routes through the flavor helper so an unowned tiered
      // upgrade (level 0) displays its L1 preview line. render() updates this
      // on every tick to keep per-level arcs and synergy-variant swaps in sync.
      // `state` is passed for synergy-variant resolution; at boot all levels
      // are 0 so no provider fires and behavior is identical to the pre-variant
      // path, but passing state keeps the call shape uniform with render().
      desc.textContent = global.DF.sim.core.getUpgradeFlavor(u, 0, state);

      const buyRow = document.createElement("div");
      buyRow.className = "u-buy-row";

      const cost = document.createElement("div");
      cost.className = "u-cost";

      const buyBtn = document.createElement("button");
      buyBtn.className = "buy-btn";
      buyBtn.textContent = "Buy";
      buyBtn.addEventListener("click", () => buy(u));

      buyRow.appendChild(cost);
      buyRow.appendChild(buyBtn);

      row.appendChild(name);
      row.appendChild(level);
      row.appendChild(desc);
      row.appendChild(buyRow);
      container.appendChild(row);

      upgradeRowRefs[u.name] = { row, level, desc, cost, buyBtn };
    }
  }

  // ---- Actions ----

  function pull() {
    if (state.ended || state.paused) return;
    const mpc = computeMpc();
    state.mass += mpc;
    state.massFromClicks += mpc;
    state.clicks++;
    state.clickTimestamps.push(getElapsedMs());
    logEvent("click", {
      mass_after: state.mass,
      mpc_at_click: mpc,
      cpm_window: cpmWindow(),
    });
    render();
  }

  function buy(u) {
    if (state.ended || state.paused) return;
    // Guard: only current-tier upgrades are buyable. Prior-tier upgrades stay
    // owned but their rows are hidden — this is just defensive in case a stale
    // ref ever fires (it shouldn't).
    const uTier = (u.tier == null ? 1 : u.tier);
    if (uTier !== state.currentTier) return;
    const cost = costToBuy(u);
    if (cost === null) return;
    if (state.mass < cost) return;
    state.mass -= cost;
    state.levels[u.name] += 1;
    state.consolidation += u.consolidation;
    // Track first consolidation-threshold hit per tier (for the session report)
    // and the legacy top-level consolidationHitMs field (still used by the report
    // and the chart trace builder for the "threshold hit" hash on the
    // consolidation chart).
    const snap = state.tierSnapshots[state.currentTier - 1];
    // Floating-point tolerance for tiered-consolidation totals (T3 Bulge etc.).
    if (snap && snap.consolidationHitMs == null && state.consolidation + 1e-9 >= state.consolidationThreshold) {
      snap.consolidationHitMs = getElapsedMs();
      // Also populate the legacy top-level field on the FIRST tier to hit
      // its threshold — the chart trace builder reads this to mark the
      // T1 gate. Subsequent tiers' threshold hits live only in the snapshot.
      if (state.consolidationHitMs === null) {
        state.consolidationHitMs = snap.consolidationHitMs;
      }
    }
    logEvent("purchase", {
      upgrade: u.name,
      new_level: state.levels[u.name],
      cost_paid: cost,
      mass_after: state.mass,
      consolidation_after: state.consolidation,
      completionist: u.completionist,
      tier: uTier,
    });
    render();
  }

  function tick() {
    if (state.ended || state.paused) return;
    // 1 Hz tick — mirrors sim/runner.js step 2 (income for this tick).
    // Two income streams accrue per tick:
    //   mps      — passive (Σ self·syn over all owned, × allMps product)
    //   aps·mpc  — auto, from owned APS upgrades (T2 RLO, T3 SDW/HVC, etc.).
    //              aps is "auto pulls per second" — multiplied by mpc to convert
    //              to mass per second, matching runner.js:387 exactly.
    // The dev-tool autoclicker is unrelated and feeds through pull() / clicks.
    const mps = computeMps();
    const aps = computeAps();
    const mpc = computeMpc();
    const autoInc = aps * mpc;
    state.mass += mps + autoInc;
    state.massFromPassive += mps;
    state.massFromAuto += autoInc;
    state.tickCount++;
    // Per-tick logging (1 Hz). Previously throttled to every 5th tick to
    // avoid log spam, which produced sawtooth artifacts in the post-run
    // income chart (5-bin spread of a single sampled mps). At ~480 tick
    // entries for an 8-min T1 run the log is still well under 1k events.
    // aps/auto_inc logged so the income chart can reconstruct the auto band.
    logEvent("tick", {
      mass_after: state.mass,
      mps,
      mpc,
      aps,
      auto_inc: autoInc,
      cpm_window: cpmWindow(),
    });
    render();
  }

  // End-tier dispatch. The button's enabled state is gated on consolidation ≥
  // current-tier threshold (see render). When clicked:
  //   - if currentTier < MAX_TIER → transition silently to the next tier.
  //   - if currentTier === MAX_TIER → end the run and fire the session report.
  function endTier() {
    // Floating-point tolerance — see sim/runner.js CONSOLIDATION_EPS comment.
    // T3's tiered Bulge sums to 6.249999999999999 in IEEE 754; without epsilon
    // the End Tier button would never enable even at "full" consolidation.
    const CONSOLIDATION_EPS = 1e-9;
    if (state.consolidation + CONSOLIDATION_EPS < state.consolidationThreshold || state.ended || state.paused) return;
    if (state.currentTier < MAX_TIER) {
      transitionToNextTier();
    } else {
      finalizeRun();
    }
  }

  // Transition from currentTier → currentTier + 1. Reuses
  // DF.sim.runner.computeCarryover so the carry math stays in one place.
  // Side effects: closes out the prior-tier snapshot, computes a fresh carry
  // payload, replaces state.carry, increments state.currentTier, resets
  // consolidation to 0 with the new threshold, opens a new snapshot, and triggers
  // a re-render (which swaps row visibility + button label). The tick loop
  // and autoclicker keep running — gameplay is uninterrupted.
  function transitionToNextTier() {
    const fromTier = state.currentTier;
    const toTier = fromTier + 1;
    const nowMs = getElapsedMs();

    // Close out the prior-tier snapshot.
    const oldSnap = state.tierSnapshots[fromTier - 1];
    if (oldSnap) {
      oldSnap.endMs = nowMs;
      oldSnap.massAtEnd = state.mass;
      oldSnap.levelsAtEnd = { ...state.levels };
    }

    // Compute the new carry payload from the just-completed tier's exit
    // state. We hand computeCarryover a "prior state" (current state seen
    // through the lens of the just-completed tier's upgrades) and the prior
    // tier's upgrade slice — it returns startingMass + floors + all-mults.
    const priorUpgrades = upgradesForTier(fromTier);
    const priorState = {
      mass: state.mass,
      levels: state.levels,
    };
    const priorParams = { baseMpc: DEFAULT_PARAMS.baseMpc };
    const carryPayload = global.DF.sim.runner.computeCarryover(
      priorState, priorUpgrades, priorParams, global.DF.sim.core, UPGRADES
    );

    // Compose the new carry shape with any pre-existing carry from earlier
    // tiers. allMps/allMpc/allAps multiply through; floors add (the prior
    // computeCarryover call already used the live computeMps/computeMpc that
    // included the existing carry, so its returned floors already encode the
    // chained prior carries — we replace, don't multiply). The cleanest model:
    // computeCarryover above ran against `priorState` using priorUpgrades only,
    // which means it does NOT see the chained prior-tier carry. So the floor
    // it returns is the just-completed tier's contribution alone, and we add
    // to the existing floors; allMults multiply.
    state.carry = {
      allMps: state.carry.allMps * carryPayload.carry.allMps,
      allMpc: state.carry.allMpc * carryPayload.carry.allMpc,
      allAps: state.carry.allAps * carryPayload.carry.allAps,
      // Floors: prior-carry floors continue to exist (they're frozen rates),
      // and the just-finished tier's contribution is added on top. The new
      // tier's own +1 baseMpc baseline is still applied inside core.computeMpc
      // via the new tier's upgrades.
      mpsFloor: state.carry.mpsFloor + carryPayload.carryMps,
      mpcFloor: state.carry.mpcFloor + carryPayload.carryMpc,
      apsFloor: state.carry.apsFloor + carryPayload.carryAps,
    };

    // Advance tier; reset consolidation; open a new snapshot.
    state.currentTier = toTier;
    state.consolidationThreshold = consolidationThresholdForTier(toTier);
    state.consolidation = 0;
    state.tierSnapshots.push({
      tier: toTier,
      startMs: nowMs,
      thresholdHitMs: null,
      endMs: null,
      levelsAtEnd: null,
      massAtEnd: null,
      consolidationHitMs: null,
    });

    logEvent("tier_transition", {
      from_tier: fromTier,
      to_tier: toTier,
      mass_at_transition: state.mass,
      carry: { ...state.carry },
      new_consolidation_threshold: state.consolidationThreshold,
    });

    // Tier-up animation hook for the consolidation bar.
    //
    // Pre-transition the bar reads 100% (the just-finished tier hit its gate
    // — fillRatio = priorBudgets+threshold over cumTotal-through-fromTier,
    // which is the same as 1.0). Post-transition render() will set the width
    // to the new entry ratio (1.0/3.5 = 28.6% at T2 entry; 3.5/9.75 = 35.9%
    // at T3 entry). The `.tier-up` class lengthens the width transition to
    // 1.4 s so the compress-and-extend reads as a deliberate gesture rather
    // than a snap. Cleared after the animation window so within-tier
    // purchases animate with the normal 240 ms transition again.
    const fillEl = $("consolidation-fill");
    if (fillEl) {
      fillEl.classList.add("tier-up");
      setTimeout(() => fillEl.classList.remove("tier-up"), 1600);
    }

    // Flush a save immediately after a tier transition so the new carry
    // shape lands in localStorage without waiting for the 10 s tick.
    saveNow();

    render();
  }

  // ---- Tier skip panel UI (data-driven) ------------------------------
  //
  // The tier-skip panel rebuilds its controls from runner.TIER_CONFIGS so
  // every tier that the runner knows about appears in the UI automatically.
  // When T5 is calibrated and added to TIER_CONFIGS, T5 becomes a target
  // without any UI edit — and the handoff selector row grows by one.
  //
  // Shape:
  //   [Target ▾]  [Handoff: T1 ▾ T2 ▾ ... T(target-1) ▾]  [Skip]
  //
  // The handoff selects only show for prior tiers (no T1→T0 row); they
  // collapse / expand as the target changes. Default: target = max tier,
  // all handoffs = Completion (the typical late-tier debug path).
  //
  // Past-T1 behavior (long-burn v1 / E4 follow-on, 2026-05-12): the panel
  // stays visible at any tier so a mid-run tester can jump forward without
  // resetting the universe first. The Target dropdown is filtered to tiers
  // STRICTLY > state.currentTier — backwards skipping isn't useful for
  // accelerated playtesting (Time skip is the non-destructive alternative
  // for advancing time at the current tier). When state.currentTier ==
  // MAX_TIER the panel hides (no forward target to offer). The "replaces
  // state" caveat from the dev label is the player-facing warning that
  // Tier skip and Time skip differ semantically — Tier skip is wholesale
  // state replacement; Time skip is non-destructive offline accrual.
  function initSkipPanel() {
    const runner = global.DF.sim.runner;
    if (!runner || !runner.TIER_CONFIGS) return;
    const target = $("skip-target");
    if (!target) return;

    // Initial dropdown population happens in renderSkipPanel so the option
    // list filters against state.currentTier on every render. Wire the
    // change handler + go button here; renderSkipPanel handles the rest.
    target.addEventListener("change", renderSkipPanel);
    const goBtn = $("skip-go");
    if (goBtn) goBtn.addEventListener("click", onSkipGoClicked);

    renderSkipPanel();
  }

  // Render the handoff-selector row to match the current target. Preserves
  // any existing selections for tiers that remain in range; new prior-tier
  // rows default to Completion (the typical debug-path default).
  function renderSkipPanel() {
    const panel = $("skip-panel");
    if (!panel) return;
    const runner = global.DF.sim.runner;
    if (!runner || !runner.TIER_CONFIGS) return;

    // Build the set of valid forward targets (tiers > currentTier). If
    // there are no forward tiers — i.e. player is at MAX_TIER — hide the
    // whole panel.
    const allTiers = Object.keys(runner.TIER_CONFIGS)
      .map(k => parseInt(k, 10))
      .filter(n => n >= 2)
      .sort((a, b) => a - b);
    const forwardTiers = allTiers.filter(t => t > state.currentTier);
    if (forwardTiers.length === 0) {
      panel.classList.add("hidden");
      return;
    }
    panel.classList.remove("hidden");

    const target = $("skip-target");
    const row = $("skip-handoff-row");
    if (!target || !row) return;

    // Rebuild the dropdown options each render so the available targets
    // track state.currentTier. Preserve the user's current selection if
    // it's still in range; otherwise default to the highest available
    // forward tier (the typical late-tier debug path).
    const priorSelection = parseInt(target.value, 10);
    target.innerHTML = "";
    for (const t of forwardTiers) {
      const opt = document.createElement("option");
      opt.value = String(t);
      opt.textContent = "T" + t;
      target.appendChild(opt);
    }
    if (Number.isFinite(priorSelection) && forwardTiers.indexOf(priorSelection) !== -1) {
      target.value = String(priorSelection);
    } else {
      target.value = String(forwardTiers[forwardTiers.length - 1]);
    }

    const targetTier = parseInt(target.value, 10);
    if (!Number.isFinite(targetTier) || targetTier < 2) return;

    // Capture existing per-tier selections so a target change doesn't blow
    // them away — the user's intent for T1/T2 should persist when they
    // switch the target between T3 and T4 etc.
    const existing = {};
    for (const sel of row.querySelectorAll("select")) {
      const t = parseInt(sel.dataset.tier, 10);
      if (Number.isFinite(t)) existing[t] = sel.value;
    }

    row.innerHTML = "";
    for (let t = 1; t < targetTier; t++) {
      const sel = document.createElement("select");
      sel.className = "cpm-input skip-mode-select";
      sel.dataset.tier = String(t);
      sel.title = "Handoff mode for T" + t +
        " (Threshold = stop at gate; Completion = also buy completionist).";
      const optThr = document.createElement("option");
      optThr.value = "threshold";
      optThr.textContent = "T" + t + " Threshold";
      const optCmp = document.createElement("option");
      optCmp.value = "completion";
      optCmp.textContent = "T" + t + " Completion";
      sel.appendChild(optThr);
      sel.appendChild(optCmp);
      // Preserve prior selection if it was set; otherwise default to
      // Completion (the more common late-tier debug-path scaffold).
      sel.value = existing[t] || "completion";
      row.appendChild(sel);
    }
  }

  // Click handler for the Skip button. Reads target + handoff selects,
  // builds the modeChain array, and delegates to skipToTier.
  function onSkipGoClicked() {
    const target = $("skip-target");
    const row = $("skip-handoff-row");
    if (!target || !row) return;
    const targetTier = parseInt(target.value, 10);
    if (!Number.isFinite(targetTier) || targetTier < 2) return;
    const modeChain = [];
    // Walk selects in DOM order — renderSkipPanel emits them in tier
    // order (T1, T2, ..., T(target-1)), which matches modeChain's
    // contract (modeChain[i] is the T(i+1) handoff mode).
    for (const sel of row.querySelectorAll("select")) {
      modeChain.push(sel.value);
    }
    if (modeChain.length !== targetTier - 1) {
      console.error("skip-panel mode-chain length mismatch:",
        modeChain.length, "vs expected", targetTier - 1);
      return;
    }
    skipToTier(targetTier, modeChain);
  }

  // ---- Tier skip (dev tool) ------------------------------------------
  //
  // Drops the player into the START of targetTier with a sim-derived carry-over.
  // Replaces all live state wholesale; does NOT try to simulate the rest of the
  // current tier from the player's actual state. Click counters / log / clock
  // reset to a clean session anchored at the moment of skip — the report after
  // a skip-then-play covers only the post-skip activity.
  //
  // tierSnapshots are rebuilt: synthetic zero-duration entries for skipped tiers
  // (with levelsAtEnd / massAtEnd populated from the sim) keep the per-tier
  // breakdown in the session report coherent. The skipped tiers' threshold-hit
  // times are null since no live play happened in them.
  //
  // modeChain: array of "threshold" | "completion" with length === targetTier - 1.
  //   targetTier=2 → modeChain[0] is the T1 mode.
  //   targetTier=3 → modeChain[0] is T1 mode, modeChain[1] is T2 mode.
  function skipToTier(targetTier, modeChain) {
    if (state.ended) return;
    if (state.paused) resumeSession();  // unfreeze before skipping
    if (targetTier < 2 || targetTier > MAX_TIER) return;
    if (!modeChain || modeChain.length !== targetTier - 1) return;

    const runner = global.DF.sim.runner;
    const core = global.DF.sim.core;

    // Run the sim chain through every prior tier, collecting each finalState.
    // We pass each prior tier's finalState as carryFrom to the next, mirroring
    // t3_calibrate.js's explicit chaining pattern.
    const simParams = { cpm: 100, engagement: 1.0, saveVpcThreshold: 1.5 };
    const finalStates = [];
    let priorFinal = null;
    try {
      for (let t = 1; t < targetTier; t++) {
        const scenario = { tier: t, mode: modeChain[t - 1] };
        if (priorFinal) scenario.carryFrom = priorFinal;
        const result = runner.runSimulation(simParams, scenario);
        finalStates.push(result.finalState);
        priorFinal = result.finalState;
      }
    } catch (e) {
      console.error("Tier-skip sim chain failed:", e);
      return;
    }

    // Carry composition. We use composeCarryChain, which walks every prior
    // tier (T1..targetTier-1) and accumulates their contributions — matching
    // the live transitionToNextTier semantics (per-tier floor add, per-tier
    // allMult multiply). This honors the load-bearing rule "stats carry over
    // between tiers": T1's Solar Wind contribution still produces its 0.8
    // M/sec at T10. The skip's starting state now matches the runner's chained
    // T3 starting state byte-for-byte, since the runner uses the same helper.
    const priorFinalForCarry = finalStates[finalStates.length - 1];
    const priorParams = { baseMpc: DEFAULT_PARAMS.baseMpc };
    const cp = runner.composeCarryChain(
      { mass: priorFinalForCarry.mass, levels: priorFinalForCarry.levels },
      targetTier, UPGRADES, priorParams, core
    );
    const carry = {
      allMps: cp.carry.allMps,
      allMpc: cp.carry.allMpc,
      allAps: cp.carry.allAps,
      mpsFloor: cp.carryMps,
      mpcFloor: cp.carryMpc,
      apsFloor: cp.carryAps,
    };

    // Replace live state wholesale.
    const exitFinal = finalStates[finalStates.length - 1];
    state.mass = exitFinal.mass;
    // Levels: copy prior-tier levels from the sim's exit state; zero out
    // current-and-future-tier levels (player will buy them live).
    const newLevels = {};
    for (const u of UPGRADES) {
      const uTier = (u.tier == null ? 1 : u.tier);
      if (uTier < targetTier && exitFinal.levels[u.name] != null) {
        newLevels[u.name] = exitFinal.levels[u.name];
      } else {
        newLevels[u.name] = 0;
      }
    }
    state.levels = newLevels;
    state.carry = carry;
    state.currentTier = targetTier;
    state.consolidation = 0;
    state.consolidationThreshold = consolidationThresholdForTier(targetTier);
    state.consolidationHitMs = null;

    // Reset session counters and clock — the post-skip session is what we want
    // the report and comparison-vs-sim chart to measure.
    state.clicks = 0;
    state.massFromClicks = 0;
    state.massFromPassive = 0;
    state.massFromAuto = 0;
    state.tickCount = 0;
    state.clickTimestamps = [];
    state.log = [];
    state.sessionStart = Date.now();
    state.totalPausedMs = 0;
    state.pauseStartedAt = null;
    state.paused = false;

    // Rebuild tierSnapshots: synthetic zero-duration entries for the skipped
    // tiers (so the per-tier breakdown table reads coherently if the player
    // continues all the way through), then a fresh open snapshot for the
    // target tier.
    const newSnapshots = [];
    for (let t = 1; t < targetTier; t++) {
      const fs = finalStates[t - 1];
      // Build a per-tier levels view that includes every upgrade (zero by
      // default), populated from the sim's exit state. The breakdown table
      // reads massAtEnd directly; per-tier level rendering is downstream.
      const levelsView = {};
      for (const u of UPGRADES) levelsView[u.name] = (fs.levels[u.name] || 0);
      newSnapshots.push({
        tier: t, startMs: 0, thresholdHitMs: null, endMs: 0,
        levelsAtEnd: levelsView, massAtEnd: fs.mass, consolidationHitMs: null,
        skipped: true,
        skipMode: modeChain[t - 1],
      });
    }
    newSnapshots.push({
      tier: targetTier, startMs: 0, thresholdHitMs: null, endMs: null,
      levelsAtEnd: null, massAtEnd: null, consolidationHitMs: null,
    });
    state.tierSnapshots = newSnapshots;

    // Clear autoclicker (a skip is a hard reset of the play session — let the
    // tester re-enable autoclick if they want it). Tick loop is restarted.
    if (autoTimer !== null) { clearInterval(autoTimer); autoTimer = null; }
    autoOn = false;
    wasAutoOnBeforePause = false;
    const autoBtn = $("auto-toggle");
    if (autoBtn) { autoBtn.textContent = "Off"; autoBtn.classList.remove("on"); }
    if (tickInterval !== null) { clearInterval(tickInterval); tickInterval = null; }
    tickInterval = setInterval(tick, 1000);

    devSkipsApplied++;
    logEvent("skip_to_tier", {
      target_tier: targetTier,
      mode_chain: modeChain.slice(),
      mass_after_skip: state.mass,
      carry_after_skip: { ...state.carry },
      consolidation_threshold: state.consolidationThreshold,
      levels_after_skip: { ...state.levels },
    });
    saveNow();
    render();
  }

  // ---- Dev time-skip (long-burn v1 / E4) -----------------------------
  //
  // Compress hours-to-weeks of patient-universe offline accrual into a
  // single command so the long-burn pacing model is testable without
  // waiting weeks of real calendar time. Per engineering-plan-long-burn-v1.md
  // §4.4: calls reconstructFromOfflineWindow against the current live state
  // in pure-idle mode (cpm = 0, allowPurchases = false) — matching the
  // boot-time offline-accrual semantic.
  //
  // Pure-idle is locked for E4. The load-bearing rule "Consolidation does
  // not advance without active purchase decisions" stays intact — purchases
  // require the player's deliberate choice, never the strategy AI's.
  // (S5 top-down mass tooling will use the same offline function in
  // allowPurchases=true mode from the simulator tab, not here.)
  //
  // totalPausedMs absorbs the skipped duration so getElapsedMs() reads
  // continuously and session-time / cpm-window stats don't gain phantom
  // hours. The skipped game-time IS real engine time (mass accrued, MPS
  // × seconds, APS × MPC × seconds all happened in the engine) but the
  // session-active clock stays anchored to wall-clock player presence.
  function applyDevTimeSkip(elapsedSeconds) {
    if (state.ended) return;
    if (state.paused) resumeSession();  // unfreeze before skipping (match skipToTier)

    const seconds = Math.floor(elapsedSeconds);
    if (!Number.isFinite(seconds) || seconds <= 0) return;

    const offlineMod = global.DF.sim && global.DF.sim.offline;
    const save = global.DF.sim && global.DF.sim.save;
    if (!offlineMod || !save) return;

    // Serialize live state to the SavePayload-shaped seed offline.js expects.
    // payload.game is non-mutated (offline.js clones internally).
    const payload = save.serializeState(state, { devSkipsApplied });
    const g = payload.game;
    const massBefore = state.mass;

    let accrued = null;
    try {
      accrued = offlineMod.reconstructFromOfflineWindow(
        g, seconds,
        { cpm: 0, engagement: 1.0, allowPurchases: false },
      );
    } catch (e) {
      console.warn('dev time-skip failed:', e && e.message);
      return;
    }
    if (!accrued || !accrued.newState) return;

    const ns = accrued.newState;
    // Splat accrued state back. Mirrors the restoreFromSave offline block.
    // Pure-idle mode never touches levels/carry/tier/consolidation in the
    // function body, but we splat for forward-compat and field parity.
    state.mass = ns.mass;
    state.massFromClicks = ns.massGainedClicks;
    state.massFromPassive = ns.massGainedPassive;
    state.massFromAuto = ns.massGainedAuto;
    state.tickCount = ns.tickCount;
    for (const name of Object.keys(ns.levels || {})) {
      if (name in state.levels) state.levels[name] = ns.levels[name];
    }
    state.carry = {
      allMps: ns.carry.allMps,
      allMpc: ns.carry.allMpc,
      allAps: ns.carry.allAps,
      mpsFloor: ns.carry.carryMps,
      mpcFloor: ns.carry.carryMpc,
      apsFloor: ns.carry.carryAps,
    };
    state.currentTier = ns.currentTier;
    state.consolidation = ns.consolidation;
    state.consolidationThreshold = ns.consolidationThreshold;
    state.consolidationHitMs = ns.consolidationHitMs;

    // Session clock absorbs the skipped duration. getElapsedMs() continues
    // to read player-active time only; the skipped time was AFK, not play.
    const skippedMs = seconds * 1000;
    state.totalPausedMs = (state.totalPausedMs || 0) + skippedMs;

    // Log the skip — pre/post mass + duration, per plan §4.4. endReason
    // surfaces if the offline runner hit max-ticks-exceeded or max-tier
    // (only reachable here if allowPurchases were true; logged for parity).
    devSkipsApplied++;
    logEvent('dev_time_skip', {
      elapsed_sec: seconds,
      mass_before: massBefore,
      mass_after: state.mass,
      mass_gained: state.mass - massBefore,
      end_reason: accrued.endReason,
      ticks_simulated: accrued.ticks,
    });

    updateTimeSkipStatus(seconds, massBefore, state.mass);

    saveNow();
    render();
  }

  // Render the human-readable status line below the time-skip controls.
  // Shows: "Skipped 6h 0m → +0.456 M☉ (total 1.234 M☉)."
  function updateTimeSkipStatus(seconds, before, after) {
    const el = $("time-skip-status");
    if (!el) return;
    const gained = after - before;
    el.textContent = "Skipped " + fmtTime(seconds * 1000) +
      " — +" + fmtMass(gained) + " M☉ (total " + fmtMass(after) + " M☉).";
  }

  function readTimeSkipSeconds() {
    const amountEl = $("time-skip-amount");
    const unitEl = $("time-skip-unit");
    if (!amountEl) return 0;
    const amount = parseFloat(amountEl.value);
    if (!Number.isFinite(amount) || amount <= 0) return 0;
    const unit = (unitEl && unitEl.value) || "h";
    const mult = unit === "d" ? 86400 : 3600;
    return Math.floor(amount * mult);
  }

  function initDevTimeSkipPanel() {
    const goBtn = $("time-skip-go");
    if (goBtn) goBtn.addEventListener("click", () => {
      applyDevTimeSkip(readTimeSkipSeconds());
    });
    // Quick-fire chips: 1h / 6h / 1d / 3d / 7d.
    const quick = {
      "time-skip-1h": 3600,
      "time-skip-6h": 21600,
      "time-skip-1d": 86400,
      "time-skip-3d": 86400 * 3,
      "time-skip-7d": 86400 * 7,
    };
    for (const id in quick) {
      const btn = $(id);
      if (btn) {
        const sec = quick[id];
        btn.addEventListener("click", () => applyDevTimeSkip(sec));
      }
    }
    // Force-save debug button. Same call path as autosave; lets the user
    // hit "save now" without waiting for the 10 s interval or beforeunload.
    const forceSaveBtn = $("force-save");
    if (forceSaveBtn) forceSaveBtn.addEventListener("click", () => {
      saveNow();
      const el = $("time-skip-status");
      if (el) el.textContent = "Saved at " + new Date().toLocaleTimeString() + ".";
    });
  }

  // Final end-of-run: fires when ending the highest implemented tier through
  // organic play, or any tier when the dev "End game now" button is clicked.
  // Terminates the tick loop, stops the autoclicker, closes the active tier's
  // snapshot (even mid-progress), builds the end log payload, and shows the
  // report.
  //
  // opts.early — true when invoked from the dev "End game now" button. Surfaced
  // in the end-event log payload + on the report header so a dev-ended run
  // doesn't masquerade as an organic finish.
  function finalizeRun(opts) {
    const early = !!(opts && opts.early);
    state.ended = true;
    if (tickInterval !== null) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
    if (autoTimer !== null) {
      clearInterval(autoTimer);
      autoTimer = null;
      autoOn = false;
      const autoBtn = $("auto-toggle");
      if (autoBtn) { autoBtn.textContent = "Off"; autoBtn.classList.remove("on"); }
    }
    const totalTime = getElapsedMs();

    // Close out the active tier's snapshot. For an organic end-of-run this is
    // the final tier reached. For a dev early-end this is the tier the player
    // was in when they clicked the button — consolidation may be mid-progress
    // (consolidationHitMs may still be null on the open snapshot, which is fine —
    // the per-tier breakdown table prints "—" for unhit thresholds).
    const finalSnap = state.tierSnapshots[state.currentTier - 1];
    if (finalSnap) {
      finalSnap.endMs = totalTime;
      finalSnap.massAtEnd = state.mass;
      finalSnap.levelsAtEnd = { ...state.levels };
    }

    const magUpgrade = UPGRADES.find(u => u.name === "Magnetosphere");
    const magComplete = state.levels["Magnetosphere"] === magUpgrade.maxLevels;
    const fpComplete  = state.levels["First Photons"] === 1;
    const totalGained = state.massFromClicks + state.massFromPassive + state.massFromAuto;
    const clickShare = totalGained > 0 ? state.massFromClicks / totalGained : 0;
    logEvent("end", {
      final_mass: state.mass,
      final_levels: { ...state.levels },
      total_clicks: state.clicks,
      total_time_ms: totalTime,
      consolidation_hit_ms: state.consolidationHitMs,
      completionist_extension_ms: state.consolidationHitMs !== null ? totalTime - state.consolidationHitMs : null,
      mass_gained_total: totalGained,
      mass_gained_clicks: state.massFromClicks,
      mass_gained_passive: state.massFromPassive,
      mass_gained_auto: state.massFromAuto,
      click_share: clickShare,
      completionist_complete: { magnetosphere: magComplete, firstPhotons: fpComplete },
      tier_snapshots: state.tierSnapshots.map(s => ({ ...s })),
      ended_at_tier: state.currentTier,
      ended_early: early,
    });
    showReport(totalTime, magComplete, fpComplete, { early: early });
  }

  // ---- Dev: End game early (2026-05-12, playtest-tab review) -------
  //
  // Bypasses endTier()'s consolidation gate; calls finalizeRun() directly so the
  // tester can jump to the end-game report from any tier at any progress.
  // The save isn't auto-wiped — the player chooses via the "Start a new
  // universe" button on the report screen (or the parameters-tab Reset).
  // Resumes the session first if paused, so the report-rendering pipeline
  // doesn't observe a frozen tick state.
  function endGameEarly() {
    if (state.ended) return;
    if (state.paused) resumeSession();
    if (typeof window !== 'undefined' && window.confirm) {
      const ok = window.confirm(
        "End the run now and jump to the report?\n\n" +
        "Your save isn't wiped — you can start a fresh universe from the report or the Parameters tab.",
      );
      if (!ok) return;
    }
    finalizeRun({ early: true });
  }

  // ---- Render ----

  function render() {
    const mpc = computeMpc();
    const mps = computeMps();
    const cpm = cpmWindow();
    const paused = state.paused;

    // Mass / MPC / MPS use fmtMass (adaptive M☉ precision) so fractional
    // T1-scale values render meaningfully. CPM stays as a whole click rate.
    $("mass").textContent = fmtMass(state.mass);
    $("mpc-display").textContent = fmtMass(mpc);
    $("stat-mpc").textContent = fmtMass(mpc);
    $("stat-mps").textContent = fmtMass(mps);
    $("stat-cpm").textContent = Math.round(cpm).toString();

    // Tier-skip dev panel: visibility tracks currentTier — once the player
    // advances past T1 organically, the skip tool hides for the rest of the
    // run. (No-op for the contents; only flips the panel's .hidden class.)
    renderSkipPanel();

    // AC/s — show only when the player has any APS source (current-tier APS
    // upgrades or carry-over from prior tiers). T1 has no APS sources, so the
    // entry stays hidden during T1 and appears the moment Roche Lobe Overflow
    // gains a level or Binary Partner is purchased in T2.
    const aps = computeAps();
    const apsWrap = $("stat-aps-wrap");
    const apsVal = $("stat-aps");
    if (apsWrap && apsVal) {
      if (aps > 0) {
        apsVal.textContent = fmtMass(aps);
        apsWrap.classList.remove("hidden");
      } else {
        apsWrap.classList.add("hidden");
      }
    }

    // Consolidation display.
    //
    // Both the numeric "N.NN / N.NN" readout AND the bar fill read cumulative
    // consolidation against the cumulative budget through the current tier:
    //   T1: starts 0.00 / 1.00 → ends 1.00 / 1.00
    //   T2: starts 1.00 / 3.50 → ends 3.50 / 3.50
    //   T3: starts 3.50 / 9.75 → ends 9.75 / 9.75
    // The bar NEVER resets across tiers; at each tier-up the denominator grows
    // (T1 total = 1.0; T2 total = 3.5; T3 total = 9.75) so the filled portion
    // compresses leftward and the empty extension represents the next gate.
    // Number and bar share the same math so they cannot disagree (the prior
    // tier-local readout looked like "0.00 / 6.25" while the bar was half full,
    // which read as a glitch).
    //
    // Tier-up animation is driven by the `.tier-up` CSS class applied in
    // transitionToNextTier() for ~1.5 s — the width transition lengthens from
    // 240 ms to 1400 ms so the compress-and-extend reads as a deliberate
    // gesture. After that window the class clears and within-tier purchases
    // animate with the normal 240 ms transition again.
    const threshold = state.consolidationThreshold;
    const cohClamped = Math.min(threshold, state.consolidation);
    const priorBudgets = cumulativeBudgetThroughTier(state.currentTier - 1);
    const cumTotal = cumulativeBudgetThroughTier(state.currentTier);
    const cumulative = priorBudgets + cohClamped;
    $("consolidation-num").textContent = fmt(cumulative, 2);
    const cohMaxEl = document.getElementById("consolidation-max");
    if (cohMaxEl) cohMaxEl.textContent = fmt(cumTotal, 2);

    // Cumulative-fill ratio: (prior-tier budgets fully complete) + current-tier
    // progress, divided by cumulative budget through the current tier. At T1
    // start this is 0; at T2 entry it is 1.0/3.5 = 28.6%; at T3 entry it is
    // 3.5/9.75 = 35.9%.
    const fillRatio = cumTotal > 0 ? Math.min(1, cumulative / cumTotal) : 0;
    $("consolidation-fill").style.width = (fillRatio * 100) + "%";

    const cohBlock = $("consolidation-block");
    if (state.consolidation + 1e-9 >= threshold) cohBlock.classList.add("full");
    else cohBlock.classList.remove("full");

    // Per-upgrade rows: only the current tier's upgrades are visible, even
    // though the DOM holds rows for every tier (so the report can read levels
    // off them later). Owned earlier-tier upgrades stay in state.levels and
    // continue to contribute via the carry payload — they just aren't shown.
    for (const u of UPGRADES) {
      const refs = upgradeRowRefs[u.name];
      const uTier = (u.tier == null ? 1 : u.tier);
      if (uTier !== state.currentTier) {
        refs.row.classList.add("hidden");
        continue;
      }
      refs.row.classList.remove("hidden");

      const L = state.levels[u.name];
      const cost = costToBuy(u);
      const maxed = cost === null;

      if (u.maxLevels === 1) {
        refs.level.textContent = L === 1 ? "Owned" : "—";
      } else if (u.maxLevels === 3) {
        refs.level.textContent = maxed ? "Maxed" : ("Lv " + L);
      } else if (u.consolidation > 0 && u.maxLevels > 1) {
        // Tiered consolidation (e.g. T3 Galactic Bulge): show explicit "N/M" counter
        // so the player can see progress against the gate. The per-level
        // consolidation contribution (+0.30 etc.) is surfaced via the row-level
        // title= tooltip set in buildUpgrades.
        refs.level.textContent = L + " / " + u.maxLevels;
      } else {
        refs.level.textContent = L > 0 ? ("Lv " + L) : "—";
      }

      // Flavor text: refresh from the helper every render so per-level arcs
      // (descByLevel — today: T3 Galactic Bulge's 7-line arc) follow the
      // current owned level, and synergy-variant text (synergyVariants —
      // today: T2 Roche Lobe Overflow B/C, T3 HII Region D) swaps in the
      // moment the relevant provider is owned. For upgrades with neither
      // field the helper is a no-op assignment of the same string.
      const flavor = global.DF.sim.core.getUpgradeFlavor(u, L, state);
      if (refs.desc.textContent !== flavor) refs.desc.textContent = flavor;

      if (maxed) {
        refs.cost.textContent = "Maxed";
        refs.cost.className = "u-cost maxed";
        refs.buyBtn.disabled = true;
        refs.buyBtn.className = "buy-btn";
        refs.row.classList.add("maxed");
      } else {
        const affordable = state.mass >= cost;
        refs.cost.textContent = fmtCost(cost) + " mass";
        refs.cost.className = "u-cost" + (affordable ? " affordable" : "");
        // While paused, buy buttons are disabled regardless of affordability
        // so a stray click can't spend mass on a frozen tick.
        refs.buyBtn.disabled = !affordable || paused;
        refs.buyBtn.className = "buy-btn" + (affordable ? " affordable" : "");
        refs.row.classList.remove("maxed");
      }
    }

    // End-tier button label depends on whether the current tier is the last
    // implemented tier. For non-final tiers the label reads "Advance to T(N+1)"
    // — clicking transitions tiers and play continues. For the final tier the
    // label reverts to "End Tier N" — clicking ends the run and fires the
    // session report.
    const endBtn = $("end-btn");
    if (state.currentTier < MAX_TIER) {
      endBtn.textContent = "Advance to T" + (state.currentTier + 1);
    } else {
      endBtn.textContent = "End Tier " + state.currentTier;
    }
    if (state.consolidation + 1e-9 >= threshold && !paused) {
      endBtn.disabled = false;
      endBtn.classList.add("ready");
    } else {
      endBtn.disabled = true;
      endBtn.classList.remove("ready");
    }

    // Pull button: disabled while paused so passive accumulation and active
    // pulls both freeze together (the function-level guard already prevents
    // any income, this is just the visible UX).
    const pullBtn = $("pull-btn");
    if (pullBtn) pullBtn.disabled = paused;

    // Pause button: label + accent state.
    const pauseBtn = $("pause-btn");
    if (pauseBtn) {
      pauseBtn.textContent = paused ? "Resume" : "Pause";
      pauseBtn.classList.toggle("paused", paused);
      pauseBtn.setAttribute("aria-pressed", paused ? "true" : "false");
    }

    // Faded-UI cue at the play-area level.
    const playEl = $("play");
    if (playEl) playEl.classList.toggle("is-paused", paused);

    // Autoclicker controls disabled while paused. The toggle button should
    // still be visible (so the user can see it's "Off" during pause), but
    // clicking it does nothing per the togglePause guard.
    const autoBtn = $("auto-toggle");
    if (autoBtn) autoBtn.disabled = paused;
  }

  function showReport(totalTime, magComplete, fpComplete, opts) {
    const early = !!(opts && opts.early);
    $("play").classList.add("hidden");
    $("report-wrap").classList.remove("hidden");

    // Update the report header to reflect the highest tier reached. For a
    // single-tier run (T1 only) this still reads "Tier 1 — session ended"
    // verbatim, preserving the pre-multi-tier appearance. A dev early-end
    // gets a " (early)" suffix so the report can't be mistaken for an
    // organic finish.
    const reportH1 = document.querySelector("#report-wrap .report h1");
    if (reportH1) {
      const base = state.currentTier === 1
        ? "Tier 1 — session ended"
        : "Tier " + state.currentTier + " — session ended";
      reportH1.textContent = early ? base + " (early)" : base;
    }

    // Per-tier breakdown block. Appears only when more than one tier was
    // played; for a T1-only run the report retains its pre-Phase-6 shape.
    renderTierBreakdown();

    $("r-time").textContent = fmtTime(totalTime);
    // Note: top-of-summary "Time to consolidation (Threshold)" row was removed in
    // the multi-tier polish pass — the per-tier breakdown table below shows
    // each tier's threshold-hit time separately, which is more legible across
    // multi-tier runs and not redundant on single-tier runs (the breakdown
    // table renders only when tierSnapshots.length > 1, but Completion-extension
    // still carries the headline "did the tail run long?" answer at the top).
    if (state.consolidationHitMs !== null) {
      const ext = totalTime - state.consolidationHitMs;
      $("r-completionist-extension").textContent = ext > 0 ? "+" + fmtTime(ext) : "0:00";
    } else {
      $("r-completionist-extension").textContent = "—";
    }
    $("r-mass").textContent = fmtMass(state.mass);

    const totalGained = state.massFromClicks + state.massFromPassive + state.massFromAuto;
    const clickPct   = totalGained > 0 ? (state.massFromClicks  / totalGained * 100) : 0;
    const passivePct = totalGained > 0 ? (state.massFromPassive / totalGained * 100) : 0;
    const autoPct    = totalGained > 0 ? (state.massFromAuto    / totalGained * 100) : 0;
    $("r-mass-gained").textContent  = fmtMass(totalGained);
    $("r-mass-click").textContent   = fmtMass(state.massFromClicks)  + "  (" + fmt(clickPct, 1)   + "%)";
    $("r-mass-passive").textContent = fmtMass(state.massFromPassive) + "  (" + fmt(passivePct, 1) + "%)";
    $("r-mass-auto").textContent    = fmtMass(state.massFromAuto)    + "  (" + fmt(autoPct, 1)    + "%)";

    $("r-clicks").textContent = state.clicks.toString();
    const avgCpm = totalTime > 0 ? (state.clicks * 60000 / totalTime) : 0;
    $("r-cpm").textContent = fmt(avgCpm, 1);

    const tbody = $("r-levels");
    tbody.innerHTML = "";
    for (const u of UPGRADES) {
      const tr = document.createElement("tr");
      const td1 = document.createElement("td");
      const td2 = document.createElement("td");
      td1.textContent = u.name;
      const L = state.levels[u.name];
      if (u.maxLevels === 1) td2.textContent = L === 1 ? "Owned" : "—";
      else td2.textContent = L + " / " + u.maxLevels;
      tr.appendChild(td1);
      tr.appendChild(td2);
      tbody.appendChild(tr);
    }

    // Completionist roll-up — generic over UPGRADES so future tiers' completionists
    // (Brown Dwarf, Moving Group, and onward) populate automatically. Stackable
    // (max > 1) → "<name> maxed" + Yes/No when level === maxLevels. One-shot
    // (max === 1) → "<name> owned" + Yes/No when level === 1.
    const completion = $("r-completion");
    completion.innerHTML = "";
    const completionistUpgrades = UPGRADES.filter(u => u.completionist);
    for (const u of completionistUpgrades) {
      const L = state.levels[u.name] || 0;
      const isStackable = u.maxLevels > 1;
      const ok = isStackable ? L === u.maxLevels : L === 1;
      const label = u.name + (isStackable ? " maxed" : " owned");
      const row = document.createElement("div");
      row.className = "row";
      const l = document.createElement("span");
      l.textContent = label;
      const v = document.createElement("span");
      v.textContent = ok ? "Yes" : "No";
      v.className = ok ? "yes" : "no";
      row.appendChild(l);
      row.appendChild(v);
      completion.appendChild(row);
    }

    const reportLog = $("report-log-content");
    const filtered = logEventsForDisplay();
    if (filtered.length === 0) {
      reportLog.innerHTML = '<span class="empty">(no purchases were recorded)</span>';
    } else {
      reportLog.textContent = filtered.map(fmtLogLine).join("\n");
    }

    // Charts — defer to after layout so canvases have non-zero dimensions
    // (same fix pattern as the simulator tab's hidden-canvas bug).
    requestAnimationFrame(() => renderReportCharts(totalTime, avgCpm));
  }

  // ---- Per-tier breakdown (multi-tier session report) ----------------

  // Renders a compact per-tier summary above the existing levels table.
  // Single-tier runs render nothing, preserving the pre-multi-tier report.
  function renderTierBreakdown() {
    // Locate / create the breakdown container. Inserted just before the
    // levels table so it reads above the cumulative level totals.
    const reportEl = document.querySelector("#report-wrap .report");
    if (!reportEl) return;
    let breakdown = document.getElementById("r-tier-breakdown");
    if (breakdown) breakdown.remove();
    if (state.tierSnapshots.length <= 1) return;

    breakdown = document.createElement("div");
    breakdown.id = "r-tier-breakdown";
    breakdown.style.cssText = "margin: 10px 0 18px; padding: 10px 12px; background: #0d1322; border: 1px solid var(--border); border-radius: 5px;";

    const heading = document.createElement("div");
    heading.style.cssText = "font-size: 11px; text-transform: uppercase; letter-spacing: 0.18em; color: var(--fg-faint); margin-bottom: 8px;";
    heading.textContent = "Per-tier breakdown";
    breakdown.appendChild(heading);

    const table = document.createElement("table");
    table.style.cssText = "width:100%; border-collapse: collapse; font-size: 13px; margin: 0;";
    const thead = document.createElement("thead");
    thead.innerHTML = "<tr>"
      + "<th>Tier</th>"
      + "<th>Threshold hit</th>"
      + "<th>Tier ended</th>"
      + "<th>Mass at end</th>"
      + "</tr>";
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    for (const snap of state.tierSnapshots) {
      const tr = document.createElement("tr");
      const tdTier = document.createElement("td");
      tdTier.textContent = "T" + snap.tier;
      const tdThreshold = document.createElement("td");
      // Threshold hit time is RELATIVE to the tier start. Snapshot stores
      // session-relative ms; subtract startMs for a tier-local figure.
      if (snap.consolidationHitMs != null) {
        tdThreshold.textContent = fmtTime(snap.consolidationHitMs - snap.startMs);
      } else {
        tdThreshold.textContent = "—";
      }
      const tdEnd = document.createElement("td");
      if (snap.endMs != null) {
        tdEnd.textContent = fmtTime(snap.endMs - snap.startMs);
      } else {
        tdEnd.textContent = "—";
      }
      const tdMass = document.createElement("td");
      tdMass.textContent = snap.massAtEnd != null ? fmtMass(snap.massAtEnd) : "—";
      tr.appendChild(tdTier);
      tr.appendChild(tdThreshold);
      tr.appendChild(tdEnd);
      tr.appendChild(tdMass);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    breakdown.appendChild(table);

    // Insert before the levels table.
    const levelsTable = reportEl.querySelector("table");
    if (levelsTable) reportEl.insertBefore(breakdown, levelsTable);
    else reportEl.appendChild(breakdown);
  }

  // ---- Session-report charts ------------------------------------------

  // Build chart-ready traces from state.log. The log carries clicks,
  // purchases, ticks (every tick — 1 Hz), and an end event. We sample mass
  // at every event for a dense curve, sample consolidation at purchase events
  // (consolidation only changes on buys), and build per-second income / level
  // traces by walking the log in order and bucketing into 1 s bins. The
  // cpm trace is sampled directly from each tick event's cpm_window field.
  //
  // Returns:
  //   {
  //     mass:    [{ x: t_s, y: mass }, ...],
  //     consolidation:[{ x: t_s, y: consolidation }, ...],   // includes start (0,0) and end
  //     consolidationHit_s: number | null,
  //     cpm:     [{ x: t_s, y: cpm_window }, ...], // sampled at every tick
  //     income:  { times, click, passive, auto },  // 1 s bins
  //     levels:  { times, perUpgrade: {name → [n,...]} },  // 1 s bins
  //     totalTime_s,
  //   }
  function traceFromPlaytestLog(log, totalTimeMs) {
    const totalTime_s = Math.max(0, totalTimeMs / 1000);

    const mass = [{ x: 0, y: 0 }];
    // Consolidation is now stored normalized to the per-tier threshold so the chart
    // can plot T1 and T2 (and beyond) on a single 0..1 ramp axis. Each tier
    // ramps 0 → 1 (its threshold met), drops to 0 at the transition, ramps
    // again. Tier metadata travels alongside so the chart can place separators
    // and per-tier threshold-hit labels.
    const consolidation = [{ x: 0, y: 0, tier: 1 }];
    const cpm = [];
    let lastMass = 0;
    let lastConsolidation = 0;        // raw consolidation value (matches log payload)
    let consolidationHit_s = null;     // first-tier threshold hit (legacy field, kept)
    // Per-tier metadata derived from tier_transition events. tierSegments[i]
    // describes tier (i+1)'s slot in time:
    //   { tier, startSec, endSec, threshold, thresholdHit_s }
    // endSec is filled when the next transition or the run-end is reached.
    const tierSegments = [
      { tier: 1, startSec: 0, endSec: null,
        threshold: consolidationThresholdForTier(1), thresholdHit_s: null },
    ];
    let curTier = 1;
    let curThreshold = consolidationThresholdForTier(1);

    // Per-second bins. Bin i covers seconds [i, i+1).
    const nBins = Math.max(1, Math.ceil(totalTime_s) + 1);
    const click   = new Array(nBins).fill(0);
    const passive = new Array(nBins).fill(0);
    const auto    = new Array(nBins).fill(0);

    // Track per-upgrade levels over time (sampled at every log event then
    // rebucketed to per-second). Final value of each bin = level at end of bin.
    const upgradeNames = UPGRADES.map(u => u.name);
    const perUpgrade = {};
    const levelState = {};
    for (const name of upgradeNames) {
      perUpgrade[name] = new Array(nBins).fill(0);
      levelState[name] = 0;
    }

    // Walk events in chronological order. Per the log schema, click and tick
    // events both record mass_after; purchases record mass_after (post-cost)
    // and the new consolidation + level. We bucket click income into 1 s bins by
    // mpc_at_click; passive income by the tick's mps reading (approximate —
    // ticks are logged every 5th, so each tick log represents 5 s of mps).
    for (const ev of log) {
      const t_s = ev.t_ms / 1000;
      const bin = Math.min(nBins - 1, Math.max(0, Math.floor(t_s)));

      if (ev.type === "click") {
        const mpc = ev.payload.mpc_at_click || 0;
        click[bin] += mpc;
        lastMass = ev.payload.mass_after;
        mass.push({ x: t_s, y: lastMass });
      } else if (ev.type === "purchase") {
        lastMass = ev.payload.mass_after;
        lastConsolidation = ev.payload.consolidation_after;
        mass.push({ x: t_s, y: lastMass });
        // Normalize consolidation to the current tier's threshold so the chart's
        // 0..1 axis represents "fraction of the gate met" regardless of which
        // tier is in play. Clamped at 1 — over-buying past the gate is
        // common and the chart should plateau cleanly.
        const cohNorm = curThreshold > 0
          ? Math.min(1, lastConsolidation / curThreshold)
          : 0;
        consolidation.push({ x: t_s, y: cohNorm, tier: curTier });
        // Per-tier threshold-hit tracking. tierSegments[curTier-1] always
        // exists by the time this runs (we seed T1 above and append on
        // transition). Record the FIRST timestamp where this tier's
        // consolidation meets its threshold.
        const seg = tierSegments[curTier - 1];
        if (seg && seg.thresholdHit_s == null && lastConsolidation >= curThreshold) {
          seg.thresholdHit_s = t_s;
        }
        // Legacy single-tier field — kept so any downstream consumer that
        // still reads consolidationHit_s sees the FIRST tier's threshold-hit.
        if (consolidationHit_s === null && curTier === 1 && lastConsolidation >= curThreshold) {
          consolidationHit_s = t_s;
        }
        const upName = ev.payload.upgrade;
        if (upName != null) {
          levelState[upName] = ev.payload.new_level;
        }
      } else if (ev.type === "tier_transition") {
        // Close out the prior segment and open the next one. Consolidation resets
        // to 0 in the live state — record explicit samples on both sides of
        // the boundary so the chart drops cleanly to the floor and rises
        // again from the new tier's start. Normalized space: prior segment
        // ends at 1.0 (threshold met), next segment starts at 0.
        const fromTier = ev.payload.from_tier || curTier;
        const toTier   = ev.payload.to_tier   || (curTier + 1);
        // Prior tier's last sample at this exact timestamp, normalized to
        // its OWN threshold (which is curThreshold pre-update).
        consolidation.push({ x: t_s, y: 1.0, tier: fromTier });
        const priorSeg = tierSegments[fromTier - 1];
        if (priorSeg) priorSeg.endSec = t_s;
        // Switch tier context.
        curTier = toTier;
        curThreshold = ev.payload.new_consolidation_threshold || consolidationThresholdForTier(toTier);
        // New tier's first sample at the same timestamp, normalized to ITS
        // threshold (which sees a 0 consolidation right at the transition).
        consolidation.push({ x: t_s, y: 0.0, tier: toTier });
        lastConsolidation = 0;
        tierSegments.push({
          tier: toTier, startSec: t_s, endSec: null,
          threshold: curThreshold, thresholdHit_s: null,
        });
      } else if (ev.type === "tick") {
        // Ticks fire every second (1 Hz). The mps reading from this tick
        // landed in a single 1 s bin — no spreading needed. This is the
        // smooth-passive-band fix that motivated the schema change to
        // per-tick logging in the first place. auto_inc is the per-tick
        // APS-from-upgrades mass contribution (aps × mpc), landed in the
        // same 1 s bin alongside passive.
        const mps = ev.payload.mps || 0;
        const autoInc = ev.payload.auto_inc || 0;
        passive[bin] += mps;
        auto[bin] += autoInc;
        lastMass = ev.payload.mass_after;
        mass.push({ x: t_s, y: lastMass });
        const cpmW = ev.payload.cpm_window;
        if (typeof cpmW === 'number' && isFinite(cpmW)) {
          cpm.push({ x: t_s, y: cpmW });
        }
      }

      // Snapshot per-upgrade levels into the current bin.
      for (const name of upgradeNames) {
        perUpgrade[name][bin] = levelState[name];
      }
    }

    // Forward-fill levels through bins with no event. The snapshot loop only
    // wrote the running level into bins that contained at least one event, so
    // empty bins are left at 0. Levels are monotonically non-decreasing in
    // T1, so a running-max ffill recovers the correct curve.
    for (const name of upgradeNames) {
      const arr = perUpgrade[name];
      let running = 0;
      for (let i = 0; i < nBins; i++) {
        if (arr[i] > running) running = arr[i];
        else arr[i] = running;
      }
    }

    // Append a final mass / consolidation sample at totalTime_s for clean end-edge.
    if (mass.length === 0 || mass[mass.length - 1].x < totalTime_s) {
      mass.push({ x: totalTime_s, y: lastMass });
    }
    if (consolidation.length === 0 || consolidation[consolidation.length - 1].x < totalTime_s) {
      const cohNormEnd = curThreshold > 0
        ? Math.min(1, lastConsolidation / curThreshold)
        : 0;
      consolidation.push({ x: totalTime_s, y: cohNormEnd, tier: curTier });
    }
    // Close out the final tier segment with the run's end timestamp.
    const lastSeg = tierSegments[tierSegments.length - 1];
    if (lastSeg && lastSeg.endSec == null) lastSeg.endSec = totalTime_s;

    // Build per-second time axis aligned with the income/levels bins.
    const times = [];
    for (let i = 0; i < nBins; i++) times.push(i);

    // Smooth the per-second income arrays with a 5 s trailing rolling average.
    // Click events are bursty (a single human click can drop ~1 unit of mpc
    // into a single bin), so the raw stacked area was visually a sawtooth.
    // The 5-s window matches the cpm-window's responsiveness without dragging
    // the curve — a click rate change shows up within ~5 s. Edge handling at
    // the start of the run averages over the available bins (1, 2, 3, 4, 5+),
    // which matches how cpmWindow() handles the warm-up period.
    function rollingAvg(arr, win) {
      const out = new Array(arr.length).fill(0);
      let sum = 0;
      for (let i = 0; i < arr.length; i++) {
        sum += arr[i];
        if (i >= win) sum -= arr[i - win];
        const denom = Math.min(i + 1, win);
        out[i] = sum / denom;
      }
      return out;
    }
    const SMOOTH_WIN = 5;
    const clickSmooth   = rollingAvg(click,   SMOOTH_WIN);
    const passiveSmooth = rollingAvg(passive, SMOOTH_WIN);
    const autoSmooth    = rollingAvg(auto,    SMOOTH_WIN);

    return {
      mass,
      consolidation,
      consolidationHit_s,
      tierSegments,        // [{ tier, startSec, endSec, threshold, thresholdHit_s }]
      cpm,
      income: { times, click: clickSmooth, passive: passiveSmooth, auto: autoSmooth },
      levels: { times, perUpgrade },
      totalTime_s,
    };
  }

  // Color palette to match the Simulator tab so the comparison chart reads
  // consistently across both contexts.
  const REPORT_COLORS = {
    you: '#d9b56b',   // gold = the player's run
    sim: '#6ec0d9',   // cyan = the algorithmic baseline
  };
  const REPORT_UPGRADE_COLORS = {
    // T1
    "Solar Wind":        '#d9b56b',
    "Asteroid Belt":     '#6ec0d9',
    "Stellar Coupling":  '#a07c4d',
    "Magnetosphere":     '#4a8db0',
    "Orbital Resonance": '#9988bb',
    "Heliopause":        '#7a6cae',
    "First Photons":     '#e8e6df',
    // T2 — slightly cooler / dimmer hues so a stacked all-tiers chart reads as
    // T1 (warm-leaning) → T2 (cool-leaning) at a glance. Re-uses the family of
    // mpc-stacker, mps-stacker, click-multiplier, completionist-stackable,
    // consolidation-one-shot, completionist-one-shot roles for visual continuity.
    "Stellar Kinematics":   '#c9a558',
    "Local Bubble":         '#5aa8c5',
    "Microlensing":         '#8a6a3d',
    "Roche Lobe Overflow":  '#3e7596',
    "Brown Dwarf":          '#3a749c',
    "Binary Partner":       '#8576a8',
    "Peculiar Velocity":    '#a39ac0',
    "Open Cluster":         '#6c5fa0',
    "Moving Group":         '#d4d0c4',
    // T3 — same family roles, shifted further toward the cool end so a
    // future cross-tier render would read T1 (warm) → T2 (mid) → T3 (cool).
    "Dust Lane Density":    '#b89548',
    "HII Region":           '#4d96b8',
    "Proper Motion":        '#7a5c34',
    "Spiral Density Wave":  '#2f6388',
    "High-Velocity Cloud":  '#2e6790',
    "Galactic Bulge":       '#79689c',
    "Sagittarius B2":       '#9690b8',
    "Globular Cluster":     '#5f548f',
    "Active Nucleus":       '#c2bdb0',
  };
  const REPORT_SHORT = {
    // T1
    "Solar Wind": "SW", "Asteroid Belt": "AB", "Stellar Coupling": "SC",
    "Magnetosphere": "Mag", "Orbital Resonance": "OR",
    "Heliopause": "HP", "First Photons": "FP",
    // T2
    "Stellar Kinematics": "SK", "Local Bubble": "LB", "Microlensing": "ML",
    "Roche Lobe Overflow": "RLO", "Brown Dwarf": "BD",
    "Binary Partner": "BP", "Peculiar Velocity": "PV",
    "Open Cluster": "OC", "Moving Group": "MG",
    // T3
    "Dust Lane Density": "DLD", "HII Region": "HII", "Proper Motion": "PM",
    "Spiral Density Wave": "SDW", "High-Velocity Cloud": "HVC",
    "Galactic Bulge": "GB", "Sagittarius B2": "SagB2",
    "Globular Cluster": "GC", "Active Nucleus": "AN",
  };

  function fmtMmSsSec(seconds) {
    if (seconds == null || !isFinite(seconds)) return '--:--';
    const total = Math.max(0, Math.round(seconds));
    const m = Math.floor(total / 60);
    const s = total - m * 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function renderReportCharts(totalTimeMs, avgCpm) {
    const charts = global.DF.ui.charts;
    if (!charts) return;

    const trace = traceFromPlaytestLog(state.log, totalTimeMs);
    const xMax = Math.max(trace.totalTime_s, 1);

    // 1. Mass over time — single gold series (the player's run).
    const massCanvas = $("r-chart-mass");
    if (massCanvas) {
      const yMax = Math.max(...trace.mass.map(p => p.y), 1);
      charts.massOverTime(massCanvas, {
        series: [{ name: "Your run", color: REPORT_COLORS.you, points: trace.mass }],
        xMax,
        yMax,
      });
    }

    // 2. Consolidation progress — multi-tier-aware. Consolidation is normalized per
    //    tier in the trace, so each tier ramps 0..1; tier transitions appear
    //    as a clean drop-and-restart pattern. Vertical dashed separators mark
    //    the transitions; each tier's threshold-hit gets its own dashed hash.
    const cohCanvas = $("r-chart-consolidation");
    if (cohCanvas) {
      const segs = trace.tierSegments || [];
      // One hit hash per tier that actually reached its threshold during the
      // playtest. Label includes the tier number for readability when multiple
      // hits land on the chart.
      const hits = segs
        .filter(s => s.thresholdHit_s != null)
        .map(s => ({
          x: s.thresholdHit_s,
          color: REPORT_COLORS.sim,
          label: 'T' + s.tier + ' threshold · ' + fmtMmSsSec(s.thresholdHit_s),
        }));
      // Separators at every transition point (i.e. the start of every segment
      // after the first). Labels for the tier badges sit over each segment.
      const separators = segs.slice(1).map(s => ({ x: s.startSec }));
      const tierBadges = segs.length > 1
        ? segs.map(s => ({
            startX: s.startSec,
            endX: s.endSec != null ? s.endSec : trace.totalTime_s,
            label: 'T' + s.tier,
          }))
        : [];
      charts.consolidationLine(cohCanvas, {
        series: [{ name: "Your run", color: REPORT_COLORS.sim, points: trace.consolidation }],
        xMax,
        hits,
        separators,
        tierBadges,
      });
    }

    // 3. Income breakdown — stacked.
    const incomeCanvas = $("r-chart-income");
    if (incomeCanvas) {
      const inc = trace.income;
      const yMax = Math.max(
        ...inc.times.map((_, i) => (inc.click[i] || 0) + (inc.passive[i] || 0) + (inc.auto[i] || 0)),
        0.5
      );
      // Auto band — show if any APS-from-upgrades income was earned. T1 has
      // no APS source so the band stays zero and is suppressed; T2+ tiers
      // with owned RLO/SDW/HVC etc. surface the band automatically.
      const autoMax = (inc.auto || []).reduce((a, b) => Math.max(a, b || 0), 0);
      charts.incomeStacked(incomeCanvas, {
        times: inc.times,
        click: inc.click,
        passive: inc.passive,
        auto: inc.auto,
        xMax,
        yMax,
        includeAuto: autoMax > 0,
      });
    }

    // 4. Levels stacked — filtered to the CURRENT (final) tier's upgrades
    //    only. Earlier-tier levels are still owned and still contribute
    //    income via carry, but they don't move during this tier's play —
    //    stacking them produced a 24+ band chart that read as visual noise
    //    past T2. Restricting to the current tier surfaces the actual
    //    purchase rhythm of the session being reported. Other charts
    //    (mass over time, income breakdown, consolidation ramp) are unaffected;
    //    they continue to show the full run including carry contributions.
    const levelsCanvas = $("r-chart-levels");
    if (levelsCanvas) {
      // Restrict to the current tier's upgrades only. UPGRADES is already
      // declared in tier order in data.js; we sort defensively and then
      // filter to the tier the session ended on.
      const order = UPGRADES.slice()
        .sort((a, b) => {
          const ta = a.tier == null ? 1 : a.tier;
          const tb = b.tier == null ? 1 : b.tier;
          return ta - tb;
        })
        .filter(u => (u.tier == null ? 1 : u.tier) === state.currentTier)
        .map(u => u.name);
      const series = order.map(name => ({
        name: REPORT_SHORT[name] || name,
        color: REPORT_UPGRADE_COLORS[name] || '#888',
        levels: trace.levels.perUpgrade[name] || [],
      }));
      let yMax = 0;
      for (let i = 0; i < trace.levels.times.length; i++) {
        let sum = 0;
        for (const s of series) sum += s.levels[i] || 0;
        if (sum > yMax) yMax = sum;
      }
      charts.levelsStacked(levelsCanvas, {
        times: trace.levels.times,
        series,
        xMax,
        yMax: Math.max(yMax, 1),
        legend: false,
      });
      // HTML legend below the levels chart. Wraps to multiple rows when the
      // upgrade count exceeds what fits in one line (T1 alone fits; T1+T2
      // wraps; further tiers will continue to wrap).
      const legEl = $("r-chart-levels-legend");
      if (legEl) {
        legEl.innerHTML = '';
        for (const name of order) {
          const finalLvl = state.levels[name] || 0;
          const item = document.createElement('span');
          item.className = 'leg-item' + (finalLvl === 0 ? ' leg-zero' : '');
          const sw = document.createElement('span');
          sw.className = 'leg-swatch';
          sw.style.background = REPORT_UPGRADE_COLORS[name] || '#888';
          const shortEl = document.createElement('span');
          shortEl.className = 'leg-name';
          shortEl.textContent = REPORT_SHORT[name] || name;
          const detail = document.createElement('span');
          detail.style.color = 'var(--fg-faint)';
          detail.textContent = ' ' + name + ' · ' + finalLvl;
          item.appendChild(sw);
          item.appendChild(shortEl);
          item.appendChild(detail);
          legEl.appendChild(item);
        }
      }
    }

    // 5. CPM over time — single gold series, sampled once per tick. Reads
    //    the player's actual clicking rhythm during the run (manual bursts,
    //    pauses, autoclicker periods at constant cpm). Playtest-only —
    //    the simulator side has constant cpm by definition so there's no
    //    analogous chart on the Simulator tab.
    const cpmCanvas = $("r-chart-cpm");
    if (cpmCanvas) {
      const cpmPoints = trace.cpm || [];
      const yMaxRaw = cpmPoints.length
        ? Math.max(...cpmPoints.map(p => p.y), 1)
        : 1;
      charts.massOverTime(cpmCanvas, {
        series: [{ name: "CPM", color: REPORT_COLORS.you, points: cpmPoints }],
        xMax,
        yMax: yMaxRaw,
        yLabel: "CPM",
        xLabel: "Time",
      });
    }

    // 6. Comparison chart — player run vs simulator at matching cpm, run
    //    through the SAME tiers as the player. Per-tier mode is detected
    //    from the snapshot's exit levels: a tier counts as "completion" when
    //    all of that tier's completionist upgrades are at max, else
    //    "threshold". The sim is then stitched together tier-by-tier so its
    //    trace covers the same wall-clock span as the player's, producing a
    //    delta that's actually meaningful for multi-tier runs.
    const cmpCanvas = $("r-chart-compare");
    if (cmpCanvas && global.DF.sim && global.DF.sim.runner) {
      const cpm = Math.max(1, Math.round(avgCpm || 1));

      // Per-tier mode detection from the player's snapshot levels. For each
      // tier the player COMPLETED (snapshot has levelsAtEnd populated), check
      // every completionist upgrade declared for that tier and collapse to
      // a single mode label.
      function detectModeForTier(tier, snapshotLevels) {
        const completionists = UPGRADES.filter(
          u => u.completionist && (u.tier == null ? 1 : u.tier) === tier
        );
        if (completionists.length === 0) return "completion";
        for (const u of completionists) {
          const need = u.maxLevels;
          const have = snapshotLevels[u.name] || 0;
          if (have < need) return "threshold";
        }
        return "completion";
      }

      // Build the per-tier mode list from snapshots that have levelsAtEnd
      // populated. The final tier's snapshot is closed in finalizeRun before
      // showReport runs, so all played tiers should have levels available.
      const playedModes = state.tierSnapshots
        .filter(s => s.levelsAtEnd != null)
        .map(s => ({ tier: s.tier, mode: detectModeForTier(s.tier, s.levelsAtEnd) }));
      // Defensive fallback for runs where snapshots are missing — degrade to
      // the legacy single-T1-completion call.
      const tiersToRun = playedModes.length > 0
        ? playedModes
        : [{ tier: 1, mode: "completion" }];

      // Stitch tier-by-tier. Each tier's sim runs against the previous tier's
      // exit state via carryFrom; trace timestamps are tier-local (each tier
      // resets to 0), so we offset them by the cumulative sim time as we go.
      // Skipped tiers (tierSnapshots[i].skipped === true) are tracked separately
      // so the comparison chart can prepend their sim mass trajectory onto the
      // player's run — a skip IS the sim's exit state from those tiers, so the
      // two timelines align if we share that prefix.
      let simPoints = [];
      let simTotalTime_s = 0;
      let simFinalMass = 0;
      let simFailed = false;
      let priorFinal = null;
      // Cumulative sim wall-clock at the boundary between skipped and played
      // tiers — i.e., the start of the player's live run on a shared timeline.
      // Zero if the player did NOT skip (organic T1 → T2 → T3 run).
      let skipPrefixTime_s = 0;
      const skippedTiers = new Set(
        state.tierSnapshots.filter(s => s.skipped).map(s => s.tier)
      );
      const simParams = { cpm, engagement: 1.0, saveVpcThreshold: 1.5 };
      try {
        for (const { tier, mode } of tiersToRun) {
          const scenario = { tier, mode };
          if (priorFinal) scenario.carryFrom = priorFinal;
          const result = global.DF.sim.runner.runSimulation(simParams, scenario);
          // Append this tier's trace, offsetting time by cumulative prior time.
          for (const row of result.trace) {
            simPoints.push({
              x: simTotalTime_s + row.time_s,
              y: row.mass_out,
            });
          }
          simTotalTime_s += result.headline.totalTime_s;
          simFinalMass = result.headline.finalMass;
          priorFinal = result.finalState;
          // If this tier was skipped, advance the prefix boundary. The player's
          // live run starts AFTER all skipped-tier sim time has elapsed.
          if (skippedTiers.has(tier)) {
            skipPrefixTime_s = simTotalTime_s;
          }
        }
      } catch (e) {
        console.warn("Comparison sim failed:", e);
        simFailed = true;
        simPoints = [];
        simTotalTime_s = 0;
        skipPrefixTime_s = 0;
      }

      // Build the "Your run" trace. When the player skipped tiers, prepend the
      // sim's mass trajectory across those skipped tiers (since the skip's
      // starting state IS the sim's exit state from those tiers — the player
      // and the sim share that prefix exactly), then offset the player's
      // actual mass samples by skipPrefixTime_s so the timelines align. The
      // two lines run identically through the skip prefix and diverge at the
      // first live-played tier boundary. When no skip happened, this is a
      // no-op: skipPrefixTime_s is 0 and the prepended slice is empty.
      //
      // Edge case: trace.mass seeds with (0, 0) before any tick samples land,
      // so a naive shift produces a downward spike at the join (sim ends at
      // high mass, player trace starts at 0). We drop the leading (0, 0) when
      // prepending to keep the curve continuous across the boundary.
      let youPoints;
      if (skipPrefixTime_s > 0 && !simFailed) {
        const prefix = simPoints.filter(p => p.x <= skipPrefixTime_s);
        const realSamples = (trace.mass.length > 0 && trace.mass[0].x === 0 && trace.mass[0].y === 0)
          ? trace.mass.slice(1)
          : trace.mass;
        const shifted = realSamples.map(p => ({
          x: p.x + skipPrefixTime_s,
          y: p.y,
        }));
        youPoints = prefix.concat(shifted);
      } else {
        youPoints = trace.mass;
      }

      const xMaxCmp = Math.max(
        trace.totalTime_s + skipPrefixTime_s,
        simTotalTime_s,
        1
      );
      const yMaxCmp = Math.max(
        ...youPoints.map(p => p.y),
        ...simPoints.map(p => p.y),
        1
      );

      // Build the legend label so the user can see what the sim was running.
      // Single-tier: "Sim at <cpm> cpm". Multi-tier: include the per-tier
      // mode list so the comparison is interpretable at a glance.
      const simLabel = tiersToRun.length === 1
        ? "Sim at " + cpm + " cpm"
        : "Sim at " + cpm + " cpm · " +
          tiersToRun.map(t => "T" + t.tier + " " + t.mode).join(" → ");

      charts.massOverTime(cmpCanvas, {
        series: [
          { name: "Your run", color: REPORT_COLORS.you, points: youPoints },
          { name: simLabel, color: REPORT_COLORS.sim, points: simPoints },
        ],
        xMax: xMaxCmp,
        yMax: yMaxCmp,
      });

      // Summary row: your time / sim time / delta.
      const yourEl = $("r-cmp-your");
      const simEl  = $("r-cmp-sim");
      const simLabelEl = $("r-cmp-sim-label");
      const deltaEl = $("r-cmp-delta");
      const yourTime_s = trace.totalTime_s;
      if (yourEl) yourEl.textContent = fmtMmSsSec(yourTime_s);
      if (simLabelEl) simLabelEl.textContent = simLabel;
      if (!simFailed && simTotalTime_s > 0) {
        if (simEl) simEl.textContent = fmtMmSsSec(simTotalTime_s);
        if (deltaEl) {
          // (you − sim) / sim. Positive = you took longer than the bot.
          const delta = (yourTime_s - simTotalTime_s) / simTotalTime_s;
          const sign = delta >= 0 ? '+' : '';
          deltaEl.textContent = sign + (delta * 100).toFixed(1) + '%';
          deltaEl.classList.remove('pos', 'neg', 'neutral');
          if (Math.abs(delta) < 0.005) deltaEl.classList.add('neutral');
          else if (delta > 0) deltaEl.classList.add('pos');
          else deltaEl.classList.add('neg');
        }
      } else {
        if (simEl) simEl.textContent = '--:--';
        if (deltaEl) deltaEl.textContent = '—';
      }
    }
  }

  // Exported log content (used by both copy-to-clipboard and download). Filters
  // out per-second `tick` events — at 1 Hz over a 10-15 minute T3 session,
  // ticks dominate the log size (often >90% of all events) and made the JSON
  // too large to share. Keeps every other event type: click, purchase,
  // tier_transition, skip_to_tier, pause, resume, end.
  //
  // Live in-memory ticks remain in state.log; the playtest tab's live charts
  // and the session-end report (traceFromPlaytestLog) still depend on them.
  // Per-tier-end snapshots are computed inside the live run, not at export
  // time, so they are unaffected by this filter.
  //
  // Set DF_LOG_VERBOSE_EXPORT = true via the dev console to bypass this filter
  // when ticks are actually needed for a debug session.
  function logText() {
    const verbose = global.DF_LOG_VERBOSE_EXPORT === true;
    const events = verbose
      ? state.log
      : state.log.filter(e => e.type !== "tick");
    return JSON.stringify(events, null, 2);
  }

  function fallbackCopyTextarea(text) {
    return new Promise((resolve, reject) => {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.top = "0";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, text.length);
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        ok ? resolve() : reject(new Error("execCommand returned false"));
      } catch (e) { reject(e); }
    });
  }

  function copyLog() {
    const text = logText();
    const btn = $("copy-btn");
    const restore = () => setTimeout(() => { btn.textContent = "Copy session log"; }, 2000);
    const success = () => { btn.textContent = "Copied"; restore(); };
    const failure = (err) => {
      console.warn("Clipboard copy failed:", err);
      console.log(text);
      btn.textContent = "Copy failed — log printed to console";
      restore();
    };

    const native = (navigator.clipboard && navigator.clipboard.writeText)
      ? navigator.clipboard.writeText(text)
      : Promise.reject(new Error("navigator.clipboard unavailable"));

    native.then(success, () => fallbackCopyTextarea(text).then(success, failure));
  }

  function downloadLog() {
    const text = logText();
    const btn = $("download-btn");
    const restore = () => setTimeout(() => { btn.textContent = "Download log (.json)"; }, 2000);
    try {
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dark-filaments-t1-" + stamp + ".json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      btn.textContent = "Downloaded";
      restore();
    } catch (e) {
      console.warn("Download failed:", e);
      console.log(text);
      btn.textContent = "Download failed — log in console";
      restore();
    }
  }

  // ---- Autoclicker (dev tool) ----

  const AUTO_CPM_MIN = 1;
  const AUTO_CPM_MAX = 6000;
  let autoOn = false;
  let autoCpm = 100;
  let autoTimer = null;
  // Remembers whether the autoclicker was running at the moment a pause
  // started, so resume can restart it without the user manually re-toggling.
  // Independent of `autoOn`, which is forced false during pause.
  let wasAutoOnBeforePause = false;

  function clampCpm(n) {
    if (!isFinite(n) || isNaN(n)) return AUTO_CPM_MIN;
    return Math.max(AUTO_CPM_MIN, Math.min(AUTO_CPM_MAX, Math.round(n)));
  }

  function applyAutoTimer() {
    if (autoTimer !== null) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
    if (autoOn && !state.ended) {
      const intervalMs = 60000 / autoCpm;
      autoTimer = setInterval(() => {
        if (!state.ended) pull();
      }, intervalMs);
    }
  }

  function setCpm(n, fromInput) {
    autoCpm = clampCpm(n);
    if (!fromInput) $("cpm-input").value = autoCpm;
    if (autoOn) applyAutoTimer();
  }

  function toggleAuto() {
    if (state.ended || state.paused) return;
    autoOn = !autoOn;
    const btn = $("auto-toggle");
    btn.textContent = autoOn ? "On" : "Off";
    btn.classList.toggle("on", autoOn);
    applyAutoTimer();
  }

  // ---- Pause / Resume (dev-grade session control) ----
  //
  // Freezes the session: tick interval cleared, autoclicker timer cleared,
  // session clock excludes the paused window via getElapsedMs(). Pull and
  // upgrade buy buttons disabled. UI dims (CSS .is-paused on #play). Resume
  // restores tick, restarts autoclicker if it had been on, and bumps
  // totalPausedMs so all subsequent timestamps stay continuous with what
  // came before. Pause state does NOT persist across refresh — refresh = a
  // fresh session, same as the rest of T1 prototype.

  function pauseSession() {
    if (state.ended || state.paused) return;

    // Stop tick.
    if (tickInterval !== null) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
    // Stop autoclicker if running; remember so resume can restart it.
    wasAutoOnBeforePause = autoOn;
    if (autoTimer !== null) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
    autoOn = false;
    const autoBtn = $("auto-toggle");
    if (autoBtn) {
      autoBtn.textContent = "Off";
      autoBtn.classList.remove("on");
    }

    state.pauseStartedAt = Date.now();
    state.paused = true;

    logEvent("pause", {
      mass_at_pause: state.mass,
      consolidation_at_pause: state.consolidation,
      tier: state.currentTier,
    });

    render();
  }

  function resumeSession() {
    if (state.ended || !state.paused) return;

    const pausedFor = (state.pauseStartedAt != null)
      ? Date.now() - state.pauseStartedAt
      : 0;
    state.totalPausedMs += pausedFor;
    state.pauseStartedAt = null;
    state.paused = false;

    // Restart tick.
    if (tickInterval === null) {
      tickInterval = setInterval(tick, 1000);
    }
    // Restart autoclicker if it had been running.
    if (wasAutoOnBeforePause) {
      autoOn = true;
      const autoBtn = $("auto-toggle");
      if (autoBtn) {
        autoBtn.textContent = "On";
        autoBtn.classList.add("on");
      }
      applyAutoTimer();
    }
    wasAutoOnBeforePause = false;

    logEvent("resume", {
      mass_at_resume: state.mass,
      paused_duration_ms: pausedFor,
    });

    render();
  }

  function togglePause() {
    if (state.ended) return;
    if (state.paused) resumeSession();
    else pauseSession();
  }

  // ---- Summary log viewer (dev tool) ----

  function logPanelOpen() {
    return !$("log-content").classList.contains("hidden");
  }

  // Shared display filter for both the live log panel and the session-end
  // report log. Drops `click` and `tick` events so the panel stays readable
  // and shareable. Mirrors the export filter in `logText()` (which only drops
  // ticks, since clicks are signal for after-the-fact analysis). `state.log`
  // itself is untouched — the live charts and traceFromPlaytestLog still see
  // every tick.
  function logEventsForDisplay() {
    return state.log.filter(e => e.type !== "click" && e.type !== "tick");
  }

  function renderLogPanel() {
    if (!logPanelOpen()) return;
    const content = $("log-content");
    const filtered = logEventsForDisplay();
    if (filtered.length === 0) {
      content.innerHTML = '<span class="empty">(no purchases yet — clicks and ticks are excluded)</span>';
      return;
    }
    const wasNearBottom = (content.scrollHeight - content.scrollTop - content.clientHeight) < 40;
    content.textContent = filtered.map(fmtLogLine).join("\n");
    if (wasNearBottom) content.scrollTop = content.scrollHeight;
  }

  function toggleLogPanel() {
    const panel = $("log-content");
    const btn = $("log-toggle");
    const nowHidden = panel.classList.toggle("hidden");
    btn.textContent = nowHidden ? "▸ Show summary log" : "▾ Hide summary log";
    if (!nowHidden) renderLogPanel();
  }

  // ---- Boot ----

  function init() {
    // Long-burn v1 / E1 — restore persisted state BEFORE building the upgrade
    // rows so they read levels off the restored state. The offline-window
    // (now - savedAt) is treated as paused time; E3 will replace this freeze
    // with reconstructFromOfflineWindow.
    const save = global.DF.sim && global.DF.sim.save;
    if (save) {
      const raw = save.readLocalSave();
      if (raw) {
        const payload = save.deserializeState(raw);
        if (payload && payload.game && !payload.error) {
          if (payload.schemaSigMismatch) {
            console.warn(
              'save: schema signature mismatch (saved=' + payload.schemaSig +
              ', current=' + payload.schemaSigCurrent +
              ') — loading anyway; check for upgrade-tree drift.'
            );
          }
          restoreFromSave(payload);
        } else if (payload && payload.error) {
          // v1 save under v2 build: clear the stale save so the fresh universe
          // we're about to start doesn't get overwritten by the v1 blob on
          // next autosave (10s setInterval reads state, serializes, writes).
          if (typeof payload.error === 'string' && payload.error.indexOf('pre_retune_save_version') === 0) {
            console.warn(
              'save: refusing pre-retune save (v1 → v2 M☉ unit shift is not migrateable) — starting a fresh universe.'
            );
            save.clearLocalSave();
          } else {
            console.warn('save: refusing to load payload — ' + payload.error);
          }
        }
      }
    }

    buildUpgrades();
    $("pull-btn").addEventListener("click", pull);
    $("end-btn").addEventListener("click", endTier);
    const pauseBtnEl = $("pause-btn");
    if (pauseBtnEl) pauseBtnEl.addEventListener("click", togglePause);
    $("copy-btn").addEventListener("click", copyLog);
    $("download-btn").addEventListener("click", downloadLog);

    // Dev — End game early (2026-05-12 playtest-tab review). Bypasses
    // endTier()'s consolidation gate; calls finalizeRun({ early: true }) directly.
    const endEarlyBtn = $("end-game-early-btn");
    if (endEarlyBtn) endEarlyBtn.addEventListener("click", endGameEarly);

    // Start-a-new-universe button on the report screen. Confirms, then runs
    // the same reset path as the Parameters tab's Reset Universe (clear save
    // + reload). Reachable only after the report shows — equally useful for
    // organic endings as for dev early-ends.
    const reportResetBtn = $("report-reset-btn");
    if (reportResetBtn) reportResetBtn.addEventListener("click", () => {
      if (typeof window !== 'undefined' && window.confirm) {
        const ok = window.confirm(
          "Start a new universe? This wipes the current save and reloads from T1.",
        );
        if (!ok) return;
      }
      resetUniverse();
    });

    // Autoclicker
    $("auto-toggle").addEventListener("click", toggleAuto);
    $("cpm-m10").addEventListener("click", () => setCpm(autoCpm - 10));
    $("cpm-m1").addEventListener("click",  () => setCpm(autoCpm - 1));
    $("cpm-p1").addEventListener("click",  () => setCpm(autoCpm + 1));
    $("cpm-p10").addEventListener("click", () => setCpm(autoCpm + 10));
    $("cpm-input").addEventListener("change", (e) => setCpm(parseInt(e.target.value, 10), true));
    $("cpm-input").addEventListener("blur",   (e) => setCpm(parseInt(e.target.value, 10)));
    $("cpm-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") { setCpm(parseInt(e.target.value, 10)); e.target.blur(); }
    });

    // Tier skip (dev tool) — see skipToTier for semantics. Modes encoded T/C.
    // Data-driven: target tier + per-prior-tier handoff selects are rebuilt
    // from runner.TIER_CONFIGS so adding a new tier (T5, T6, ...) requires no
    // UI work — just a new entry in runner.js's TIER_CONFIGS table.
    initSkipPanel();

    // Time skip (dev tool, long-burn v1 / E4) — pure-idle offline accrual.
    // Compresses calendar time into a single command. See applyDevTimeSkip.
    initDevTimeSkipPanel();

    // Log viewer
    $("log-toggle").addEventListener("click", toggleLogPanel);

    tickInterval = setInterval(tick, 1000);

    // 10 s autosave + beforeunload flush. Guarded so multiple init() calls
    // (none currently happen, but defensive) don't stack intervals.
    if (autoSaveInterval !== null) clearInterval(autoSaveInterval);
    autoSaveInterval = setInterval(() => {
      if (!state.paused && !state.ended) saveNow();
    }, AUTO_SAVE_INTERVAL_MS);
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        // beforeunload runs synchronously; saveNow uses localStorage.setItem
        // which is also synchronous, so the write completes before unload.
        saveNow();
      });
    }

    render();
  }

  // resetUniverse — wipe the persisted save and reload the page so the
  // playtest comes up at the fresh-T1 default. Exposed for parameters.js
  // (long-burn v1 / E1, "Reset universe" affordance).
  function resetUniverse() {
    const save = global.DF.sim && global.DF.sim.save;
    if (save) save.clearLocalSave();
    // Stop autosave so the wipe isn't immediately overwritten by the next
    // tick. The reload below replaces the entire JS world anyway.
    if (autoSaveInterval !== null) { clearInterval(autoSaveInterval); autoSaveInterval = null; }
    if (typeof location !== 'undefined' && location.reload) {
      location.reload();
    }
  }

  global.DF.ui.playtest = { init, resetUniverse };
})(typeof window !== 'undefined' ? window : globalThis);
