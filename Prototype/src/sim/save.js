// Dark Filaments — save module
// Long-burn v1, Engineering Phase 1 (E1).
//
// Owns localStorage I/O + the SavePayload <-> live-state translation. The
// player's universe persists across browser sessions via a single key; on boot,
// playtest.js asks save.js for the saved payload, deserializes, and replaces
// its in-memory state. The E2 token codec (encodeToken / decodeToken) and the
// E3 offline-accrual call site (reconstructFromOfflineWindow) both consume
// the SavePayload shape this module produces.
//
// Loaded as a plain <script> from file://. Pattern: IIFE attaches to
// window.DF.sim.save. UMD shim at the bottom for Node test harness use
// (save_migration_test.js).
//
// SavePayload shape (per engineering-plan-long-burn-v1.md §3 — state schema):
//   {
//     version: 1,            // SAVE_VERSION at write time
//     savedAt: <ms>,         // Date.now() at write — E3 uses this for offline gap
//     schemaSig: <string>,   // content hash of UPGRADES (id + order)
//     game: {
//       mass, consolidation, currentTier, levels,
//       carry: { allMps, allMpc, allAps, carryMps, carryMpc, carryAps },
//       consolidationThreshold, consolidationHitMs,
//       totalClicks, sessionStart, totalPausedMs,
//       massGainedClicks, massGainedPassive, massGainedAuto,
//       tickCount,
//       tierSnapshots,
//     },
//     meta: { appBuild, devSkipsApplied, lastEngagementProfile },
//   }
//
// Translation note: the playtest's live state uses engine-relic field names
// `mpsFloor`/`mpcFloor`/`apsFloor` for the floor portion of carry; the
// engineering plan's canonical shape uses `carryMps`/`carryMpc`/`carryAps`.
// We translate at the boundary so future modules (offline.js, harness.js)
// see one canonical shape.

(function (global) {
  'use strict';
  global.DF = global.DF || {};
  global.DF.sim = global.DF.sim || {};

  const LOCAL_KEY = 'dark-filaments:save:v1';
  // Pull SAVE_VERSION + UPGRADES from data.js lazily inside serialize/deserialize
  // — data.js is loaded before save.js in the HTML bootstrap, so both globals
  // are always available at call time. Pulling lazily keeps the module
  // tolerant of test harnesses that require save.js without window.

  function getDataModule() {
    return (global.DF && global.DF.sim && global.DF.sim.data) || null;
  }

  // schemaSig — derived from UPGRADES (id + order) per §3. Detects upgrade-tree
  // changes between save writes and reads. We use a lightweight join over names
  // rather than a real hash; collision is not a security concern here, and a
  // stable string is easier to eyeball during dev.
  function computeSchemaSig(upgrades) {
    if (!upgrades || !upgrades.length) return 'empty';
    // Join names with a separator that cannot occur in upgrade names.
    const joined = upgrades.map(u => (u.tier == null ? 1 : u.tier) + ':' + u.name).join('|');
    // FNV-1a 32-bit hash → 8-char hex. Stable across Node + browser without
    // depending on crypto APIs.
    let hash = 0x811c9dc5 >>> 0;
    for (let i = 0; i < joined.length; i++) {
      hash ^= joined.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
  }

  // serializeState — projects the playtest's live state into a SavePayload.
  // Inputs:
  //   liveState : the playtest module's `state` object (see ui/playtest.js).
  //   opts      : { appBuild, devSkipsApplied, lastEngagementProfile } — meta
  //               fields the caller can stamp. All optional.
  function serializeState(liveState, opts) {
    const data = getDataModule();
    if (!data) {
      throw new Error('save.serializeState: DF.sim.data not loaded');
    }
    const o = opts || {};
    const carry = liveState.carry || {};
    return {
      version: data.SAVE_VERSION,
      savedAt: Date.now(),
      schemaSig: computeSchemaSig(data.UPGRADES),
      game: {
        mass: liveState.mass || 0,
        // Internal field renamed `cohesion` → `consolidation` 2026-05-13
        // (engine-wide consolidation rename pass; SAVE_VERSION bumped 3→4
        // because v3 payloads carry the legacy key and would silently fail
        // to round-trip the value).
        consolidation: liveState.consolidation || 0,
        currentTier: liveState.currentTier || 1,
        // Shallow clone — levels is { [name]: int }, no nested refs.
        levels: Object.assign({}, liveState.levels || {}),
        carry: {
          allMps: carry.allMps == null ? 1.0 : carry.allMps,
          allMpc: carry.allMpc == null ? 1.0 : carry.allMpc,
          allAps: carry.allAps == null ? 1.0 : carry.allAps,
          // Translate playtest's mpsFloor/mpcFloor/apsFloor → canonical names.
          carryMps: carry.mpsFloor || 0,
          carryMpc: carry.mpcFloor || 0,
          carryAps: carry.apsFloor || 0,
        },
        consolidationThreshold: liveState.consolidationThreshold || 0,
        consolidationHitMs: liveState.consolidationHitMs == null ? null : liveState.consolidationHitMs,
        totalClicks: liveState.clicks || 0,
        sessionStart: liveState.sessionStart || Date.now(),
        totalPausedMs: liveState.totalPausedMs || 0,
        massGainedClicks: liveState.massFromClicks || 0,
        massGainedPassive: liveState.massFromPassive || 0,
        massGainedAuto: liveState.massFromAuto || 0,
        tickCount: liveState.tickCount || 0,
        // tierSnapshots: deep-ish clone — entries are flat objects with a
        // nested `levelsAtEnd` map. Spread + nested spread is sufficient.
        tierSnapshots: (liveState.tierSnapshots || []).map(snap => Object.assign(
          {}, snap,
          { levelsAtEnd: snap && snap.levelsAtEnd ? Object.assign({}, snap.levelsAtEnd) : null },
        )),
      },
      meta: {
        appBuild: o.appBuild || 'long-burn-v1',
        devSkipsApplied: o.devSkipsApplied || 0,
        lastEngagementProfile: o.lastEngagementProfile || null,
      },
    };
  }

  // deserializeState — round-trips a SavePayload back into a payload shape
  // ready for playtest.js to splat into its `state`. Applies version migration
  // when the persisted payload predates current SAVE_VERSION. Returns null
  // when the payload is unusable.
  //
  // Version handling (2026-05-13 consolidation rename):
  //   v1 saves: pre-M☉-retune; mass values in arbitrary units. REFUSED at
  //     load — applying v1 mass values under v4 calibration would put the
  //     player wildly past their intended tier (mass was ~600× larger in
  //     arbitrary units than the equivalent M☉ value). No automatic migration
  //     (the unit-scale shift is ambiguous to invert).
  //   v2 saves: pre-ladder-renumber. Tier numbers above T2 shifted up by one
  //     in v3 (old T3 Galactic Arm → new T4; old T4 Galaxy → new T5; new T3
  //     Dwarf Spheroidal inserted). A v2 save's `currentTier: 3` would refer
  //     to the old Galactic Arm slate but resolves under v4 to the new Dwarf
  //     Spheroidal slate; the levels map keyed by upgrade name would survive
  //     but `currentTier`, `consolidationThreshold`, and carry composition all
  //     become incoherent. REFUSED at load; the player starts a fresh universe.
  //   v3 saves: pre-consolidation-rename. SavePayload carried the legacy
  //     `cohesion` / `cohesionThreshold` / `cohesionHitMs` keys; v4 readers
  //     look for `consolidation` / `consolidationThreshold` / `consolidationHitMs`
  //     and would silently default each to 0. REFUSED at load; the player
  //     starts a fresh universe. The rename is structural-only (no numeric
  //     shift); a v3→v4 migration would be a simple key-rename pass, but no
  //     prior playtest saves are expected to exist at the v4 cutover, so the
  //     dev-tool path mirrors v1/v2 behavior.
  //   v4 saves: current; loaded as-is.
  //   Future v5+: refused (newer-version-than-build).
  function deserializeState(payload) {
    if (!payload || typeof payload !== 'object') return null;
    const data = getDataModule();
    if (!data) {
      throw new Error('save.deserializeState: DF.sim.data not loaded');
    }
    let p = payload;
    if (p.version == null) return null;
    if (p.version > data.SAVE_VERSION) {
      // Future-version save loaded in older build: refuse, do not load.
      return { error: 'newer_save_version', payload: null };
    }
    if (p.version < data.SAVE_VERSION) {
      // Pre-current save (v1: pre-M☉-retune; v2: pre-ladder-renumber;
      // v3: pre-consolidation-rename). Refuse — v1's unit-scale shift, v2's
      // tier renumber, and v3's legacy `cohesion*` keys each make the
      // persisted payload incoherent under the v4 engine. Player gets a
      // fresh universe.
      return { error: 'pre_retune_save_version_' + p.version, payload: null };
    }
    // Defensive: copy `game` so callers can mutate without affecting the
    // canonical payload (which is also returned).
    const game = p.game || {};
    const out = {
      version: p.version,
      savedAt: p.savedAt || 0,
      schemaSig: p.schemaSig || '',
      schemaSigCurrent: computeSchemaSig(data.UPGRADES),
      game: {
        mass: game.mass || 0,
        consolidation: game.consolidation || 0,
        currentTier: game.currentTier || 1,
        levels: Object.assign({}, game.levels || {}),
        carry: Object.assign(
          { allMps: 1.0, allMpc: 1.0, allAps: 1.0, carryMps: 0, carryMpc: 0, carryAps: 0 },
          game.carry || {},
        ),
        consolidationThreshold: game.consolidationThreshold || 0,
        consolidationHitMs: game.consolidationHitMs == null ? null : game.consolidationHitMs,
        totalClicks: game.totalClicks || 0,
        sessionStart: game.sessionStart || Date.now(),
        totalPausedMs: game.totalPausedMs || 0,
        massGainedClicks: game.massGainedClicks || 0,
        massGainedPassive: game.massGainedPassive || 0,
        massGainedAuto: game.massGainedAuto || 0,
        tickCount: game.tickCount || 0,
        tierSnapshots: (game.tierSnapshots || []).map(snap => Object.assign(
          {}, snap,
          { levelsAtEnd: snap && snap.levelsAtEnd ? Object.assign({}, snap.levelsAtEnd) : null },
        )),
      },
      meta: Object.assign(
        { appBuild: '', devSkipsApplied: 0, lastEngagementProfile: null },
        p.meta || {},
      ),
    };
    // schemaSig mismatch surfaces as a warning, not a refusal, per §10 open
    // item 2 (load with a warning — recommended for v1 dev tool).
    out.schemaSigMismatch = (out.schemaSig !== out.schemaSigCurrent);
    return out;
  }

  // localStorage I/O — wrap with try/catch because Safari private mode + some
  // sandboxed file:// contexts throw on access.

  function writeLocalSave(payload) {
    if (typeof localStorage === 'undefined') return false;
    try {
      const json = JSON.stringify(payload);
      localStorage.setItem(LOCAL_KEY, json);
      return true;
    } catch (e) {
      console.warn('save.writeLocalSave failed:', e && e.message);
      return false;
    }
  }

  function readLocalSave() {
    if (typeof localStorage === 'undefined') return null;
    try {
      const json = localStorage.getItem(LOCAL_KEY);
      if (!json) return null;
      const payload = JSON.parse(json);
      return payload;
    } catch (e) {
      console.warn('save.readLocalSave failed:', e && e.message);
      return null;
    }
  }

  function clearLocalSave() {
    if (typeof localStorage === 'undefined') return false;
    try {
      localStorage.removeItem(LOCAL_KEY);
      return true;
    } catch (e) {
      console.warn('save.clearLocalSave failed:', e && e.message);
      return false;
    }
  }

  global.DF.sim.save = {
    LOCAL_KEY,
    serializeState,
    deserializeState,
    writeLocalSave,
    readLocalSave,
    clearLocalSave,
    computeSchemaSig,
  };
})(typeof window !== 'undefined' ? window : globalThis);

// UMD shim — for Node test harness use (save_migration_test.js).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = (typeof window !== 'undefined' ? window : globalThis).DF.sim.save;
}
