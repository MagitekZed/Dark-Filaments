// Dark Filaments — engine parity gate (scaffold plan §5.3).
//
// The proof that the TS port did not drift from the tuned prototype JS engine.
// Runs BOTH engines over a scenario battery and asserts byte-equality on the
// full returned objects (mass, levels, carry, consolidation, milestones).
//
// THIS IS THE GATE: it must be green before any Worker/store/scene/UI work
// proceeds. A red parity test means the TS port has a bug to find — not a
// tolerance to widen.
//
// The prototype JS engine is loaded once via createRequire (the prototype's UMD
// shims populate globalThis.DF.sim.* AND module.exports, so a CommonJS require
// resolves the whole dependency chain — data → core → strategy → runner →
// offline). Path from game/src/test/engine/ to Prototype/src/sim/ is four levels
// up: engine → test → src → game → repo-root.
//
// Tolerance (§5.3): EXACT toEqual first. The IIFE-strip did not reorder any
// operations — the TS bodies are line-for-line copies of the JS — so exact
// byte-equality is expected. No toBeCloseTo fallback was needed (see report).

import { describe, it, expect, beforeAll } from 'vitest';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';

// TS engine under test.
import * as tsRunner from '../../engine/runner';
import * as tsCore from '../../engine/core';
import { reconstructFromOfflineWindow as tsOffline } from '../../engine/offline';
import { UPGRADES as TS_UPGRADES } from '../../engine/data';
import type { Upgrade } from '../../engine/types';

// ---- Prototype JS engine fixture loader -------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

interface ProtoEngine {
  runner: Any;
  core: Any;
  offline: Any;
  data: Any;
}

let proto: ProtoEngine;

beforeAll(() => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const simDir = path.resolve(here, '..', '..', '..', '..', 'Prototype', 'src', 'sim');
  const require = createRequire(import.meta.url);
  // Load in dependency order; each UMD file attaches to globalThis.DF.sim.*
  // and returns its module.exports. data must load before save/runner/offline.
  require(path.join(simDir, 'data.js'));
  require(path.join(simDir, 'core.js'));
  require(path.join(simDir, 'strategy.js'));
  const runner = require(path.join(simDir, 'runner.js'));
  const offline = require(path.join(simDir, 'offline.js'));
  const core = require(path.join(simDir, 'core.js'));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (globalThis as any).DF.sim.data;
  proto = { runner, core, offline, data };
});

// A fresh canonical saved-state for the offline window scenario.
function freshT3SubhaloState(): Any {
  const levels = Object.fromEntries(TS_UPGRADES.map(u => [u.name, 0]));
  levels['Subhalo'] = 2;
  return {
    mass: 0,
    consolidation: 0,
    currentTier: 3,
    levels,
    carry: { allMps: 1.0, allMpc: 1.0, allAps: 1.0, carryMps: 50, carryMpc: 0, carryAps: 0 },
    consolidationThreshold: 6.25,
    consolidationHitMs: null,
    totalClicks: 0,
    sessionStart: 0,
    totalPausedMs: 0,
    massGainedClicks: 0,
    massGainedPassive: 0,
    massGainedAuto: 0,
    tickCount: 0,
    tierSnapshots: [{
      tier: 3, startMs: 0, thresholdHitMs: null, endMs: null,
      levelsAtEnd: null, massAtEnd: null, consolidationHitMs: null,
    }],
  };
}

const PARAMS = { cpm: 100, engagement: 1.0, saveVpcThreshold: 1.5 };

describe('engine parity — TS port vs prototype JS, byte-for-byte', () => {
  // --- runSimulation across the tier battery (T1..T4, both modes) -------
  // Generous timeout: T3/T4 full runs span tens of thousands of 1 Hz ticks and
  // we run BOTH engines per scenario, so each can take several seconds. These
  // are deterministic, not flaky — the timeout just needs headroom.
  const HEAVY_RUN_TIMEOUT_MS = 60000;

  for (const tier of [1, 2, 3, 4]) {
    for (const mode of ['completion', 'threshold']) {
      it(`runSimulation T${tier} ${mode}: headline + finalState identical`, () => {
        const ts = tsRunner.runSimulation(PARAMS, { tier, mode });
        const js = proto.runner.runSimulation(PARAMS, { tier, mode });
        // Full headline object: mass, peak, levels, consolidation, exitReason,
        // transitioned, clickShare, mass-by-source, threshold tick.
        expect(ts.headline).toEqual(js.headline);
        // finalState: mass, levels, consolidation, counters, threshold tick.
        expect(ts.finalState).toEqual(js.finalState);
      }, HEAVY_RUN_TIMEOUT_MS);
    }
  }

  // --- T2 with explicit carry-from a completed T1 -----------------------
  it('runSimulation T2 with carryFrom a completed T1: identical', () => {
    const tsT1 = tsRunner.runSimulation(PARAMS, { tier: 1, mode: 'completion' });
    const jsT1 = proto.runner.runSimulation(PARAMS, { tier: 1, mode: 'completion' });
    const ts = tsRunner.runSimulation(PARAMS, { tier: 2, mode: 'completion', carryFrom: tsT1.finalState });
    const js = proto.runner.runSimulation(PARAMS, { tier: 2, mode: 'completion', carryFrom: jsT1.finalState });
    expect(ts.headline).toEqual(js.headline);
    expect(ts.finalState).toEqual(js.finalState);
  });

  // --- T3 hidden-channel (Subhalo carryMpsMult) full run ----------------
  it('runSimulation T3 completion exercises Subhalo carryMpsMult: identical', () => {
    const ts = tsRunner.runSimulation(PARAMS, { tier: 3, mode: 'completion' });
    const js = proto.runner.runSimulation(PARAMS, { tier: 3, mode: 'completion' });
    // Subhalo must be owned for the hidden channel to have fired.
    expect(ts.finalState.levels['Subhalo']).toBeGreaterThan(0);
    expect(ts.finalState.levels['Subhalo']).toBe(js.finalState.levels['Subhalo']);
    expect(ts.headline).toEqual(js.headline);
    expect(ts.finalState).toEqual(js.finalState);
  }, HEAVY_RUN_TIMEOUT_MS);

  // --- computeRates direct: T3 state with Subhalo + synergy providers ---
  it('computeRates T3 with Subhalo + Pop II + Brown Dwarf: identical mps/mpc/aps', () => {
    const levels = Object.fromEntries(TS_UPGRADES.map(u => [u.name, 0]));
    levels['Subhalo'] = 3;
    levels['Population II'] = 7;
    levels['Brown Dwarf'] = 4;
    const state = { mass: 0, consolidation: 0, levels };
    const carry = { allMps: 1.5, allMpc: 1.2, allAps: 1.0, carryMps: 200, carryMpc: 5, carryAps: 1 };
    const params = { baseMpc: 0.00120 };
    const t3ts = TS_UPGRADES.filter((u: Upgrade) => u.tier === 3);
    const t3js = proto.data.UPGRADES.filter((u: Any) => u.tier === 3);
    const tsRates = tsCore.computeRates(state, t3ts, carry, params, TS_UPGRADES);
    const jsRates = proto.core.computeRates(state, t3js, carry, params, proto.data.UPGRADES);
    expect(tsRates).toEqual(jsRates);
  });

  // --- reconstructFromOfflineWindow pure-idle window --------------------
  it('reconstructFromOfflineWindow pure-idle (Subhalo hidden channel): identical', () => {
    const tsState = freshT3SubhaloState();
    const jsState = freshT3SubhaloState();
    const tsRes = tsOffline(tsState, 600, { cpm: 0, allowPurchases: false });
    const jsRes = proto.offline.reconstructFromOfflineWindow(jsState, 600, { cpm: 0, allowPurchases: false });
    expect(tsRes.newState).toEqual(jsRes.newState);
    expect(tsRes.milestones).toEqual(jsRes.milestones);
    expect(tsRes.buyLog).toEqual(jsRes.buyLog);
    expect(tsRes.endReason).toEqual(jsRes.endReason);
    expect(tsRes.ticks).toEqual(jsRes.ticks);
  });

  // --- reconstructFromOfflineWindow active window (allowPurchases) ------
  it('reconstructFromOfflineWindow active window crosses T1->T2: identical', () => {
    const tsState = (() => {
      const levels = Object.fromEntries(TS_UPGRADES.map(u => [u.name, 0]));
      return {
        mass: 0, consolidation: 0, currentTier: 1, levels,
        carry: { allMps: 1.0, allMpc: 1.0, allAps: 1.0, carryMps: 0, carryMpc: 0, carryAps: 0 },
        consolidationThreshold: 1.0, consolidationHitMs: null,
        totalClicks: 0, sessionStart: 0, totalPausedMs: 0,
        massGainedClicks: 0, massGainedPassive: 0, massGainedAuto: 0, tickCount: 0,
        tierSnapshots: [{ tier: 1, startMs: 0, thresholdHitMs: null, endMs: null, levelsAtEnd: null, massAtEnd: null, consolidationHitMs: null }],
      };
    })();
    const jsState = JSON.parse(JSON.stringify(tsState));
    const pp = { cpm: 100, engagement: 1.0, allowPurchases: true, mode: 'completion' as const, saveVpcThreshold: 1.5 };
    const tsRes = tsOffline(tsState, 900, pp);
    const jsRes = proto.offline.reconstructFromOfflineWindow(jsState, 900, pp);
    expect(tsRes.newState.currentTier).toBeGreaterThanOrEqual(2);
    expect(tsRes.newState).toEqual(jsRes.newState);
    expect(tsRes.milestones).toEqual(jsRes.milestones);
    expect(tsRes.buyLog).toEqual(jsRes.buyLog);
  });

  // --- composeCarryChain identical across a T1->T3 chain ----------------
  it('composeCarryChain at T3 from a completed T2: identical', () => {
    const tsT2 = tsRunner.runSimulation(PARAMS, { tier: 2, mode: 'completion' });
    const jsT2 = proto.runner.runSimulation(PARAMS, { tier: 2, mode: 'completion' });
    const tsCarry = tsRunner.composeCarryChain(tsT2.finalState, 3, TS_UPGRADES, { baseMpc: 1.0 }, tsCore);
    const jsCarry = proto.runner.composeCarryChain(jsT2.finalState, 3, proto.data.UPGRADES, { baseMpc: 1.0 }, proto.core);
    expect(tsCarry).toEqual(jsCarry);
  });

  // --- data parity: UPGRADES + DEFAULT_PARAMS + SAVE_VERSION lineage ----
  it('UPGRADES array is byte-identical to the prototype', () => {
    expect(TS_UPGRADES).toEqual(proto.data.UPGRADES);
  });
});
