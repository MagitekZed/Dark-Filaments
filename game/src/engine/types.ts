// engine/types.ts — engine type surface (scaffold plan §4.2).
//
// Types are added OVER the existing prototype shapes — the data model is NOT
// redesigned. These are the exact field names the prototype uses (verified
// against core.js, save.js, offline.js, runner.js). No computation lives here.

export interface Synergy {
  target: string;
  multiplier: number;
  kind?: 'additive';
}

export interface SynergyVariant {
  provider: string;
  text: string;
}

export interface Upgrade {
  name: string;
  tier: number;
  initCost: number;
  costGrowth: number;
  maxLevels: number;
  consolidation: number;
  baseMps: number;
  addMps: number;
  selfMps: number;
  baseMpc: number;
  addMpc: number;
  selfMpc: number;
  baseAps: number;
  addAps: number;
  selfAps: number;
  allMps: number;
  allMpc: number;
  allAps: number;
  synergies: Synergy[];
  carryMpsMult?: number; // hidden channel (Subhalo, T3)
  completionist: boolean;
  desc?: string;
  descByLevel?: string[];
  synergyVariants?: SynergyVariant[];
}

export interface Carry {
  allMps: number;
  allMpc: number;
  allAps: number;
  carryMps: number;
  carryMpc: number;
  carryAps: number;
}

export interface EngineState {
  // canonical (SavePayload.game) names
  mass: number;
  consolidation: number;
  currentTier: number;
  levels: Record<string, number>;
  carry: Carry;
  consolidationThreshold: number;
  consolidationHitMs: number | null;
  totalClicks: number;
  sessionStart: number;
  totalPausedMs: number;
  massGainedClicks: number;
  massGainedPassive: number;
  massGainedAuto: number;
  tickCount: number;
  tierSnapshots: Array<{
    tier: number;
    levelsAtEnd: Record<string, number> | null;
    [k: string]: unknown;
  }>;
}

export interface Params {
  // mirrors DEFAULT_PARAMS
  tickIntervalMs: number;
  baseMpc: number;
  baseMps: number;
  consolidationThreshold: number;
  consolidationGrowth: number;
  cpm: number;
  saveVpcThreshold: number;
  longSaveTimeThresholdSec: number;
  longSaveTolerance: number;
  engagement: number;
  scenario: 'completion' | 'threshold';
  perTierEngagement: Record<number, number>;
  // worker-runtime additions (not persisted):
  autoCpm?: number;
  autoclickerOn?: boolean;
  // Live auto-buy ("self-play"): when on, the worker runs strategy.decideAction
  // on the LIVE tick and applies buys/transitions — the same strategy the
  // offline/fast-forward auto-buy uses, but watchable in real time / at Live
  // speed. mode gates completionist purchases; saveVpc is the strategy's save
  // threshold. Pair with the autoclicker for click income.
  autoBuyOn?: boolean;
  autoBuyMode?: 'completion' | 'threshold';
  autoBuySaveVpc?: number;
}

export interface TierMeta {
  name: string;
  act: number;
  peak: boolean;
}

// The snapshot the Worker posts. Display-shaped — derived, not the raw state.
export interface EngineSnapshot {
  seq: number; // monotonic; client drops stale snapshots
  mass: number;
  mps: number;
  mpc: number;
  aps: number;
  currentTier: number;
  consolidation: number;
  consolidationThreshold: number;
  consolidationReady: boolean; // consolidation >= threshold (tier-up gate open)
  levels: Record<string, number>;
  affordable: string[]; // upgrade names the player can afford right now
  recentPurchase: { name: string; tier: number; level: number } | null;
  recentTierUp: { fromTier: number; toTier: number } | null;
  causalConnections: number; // static placeholder in Act 1
  paused: boolean;
  // Total simulated in-game seconds (1 tick = 1 s; advanced by live ticks AND
  // by the offline/time-skip accrual). The sim second the current tier began
  // (from the active tierSnapshot). Both feed dev elapsed-time tracking and are
  // harmless data in prod — 1 sim second is 1 in-game calendar second, so these
  // compare directly against the per-tier calendar targets.
  tickCount: number;
  tierStartSec: number;
  // Welcome-back, set once after a boot offline-accrual window:
  offlineReturn: { elapsedSec: number; massGained: number } | null;
}

// Main → Worker action (scaffold plan §4.3). Defined here so the engine type
// surface is complete per the barrel's export list; the Worker (G2) consumes it.
export interface ProfileParams {
  cpm?: number;
  engagement?: number;
  allowPurchases?: boolean;
  mode?: 'completion' | 'threshold';
  saveVpcThreshold?: number;
  longSaveTimeThresholdSec?: number;
  longSaveTolerance?: number;
  perTierEngagement?: Record<number, number> | null;
  upgrades?: Upgrade[];
}

export type Action =
  | { type: 'INIT'; state: EngineState | null; params: Params; offlineSec: number }
  | { type: 'BUY'; upgrade: string }
  | { type: 'CLICK'; count?: number }
  | { type: 'SET_PARAMS'; patch: Partial<Params> }
  | { type: 'TIER_UP' }
  | { type: 'SKIP_TO_TIER'; tier: number }
  | { type: 'TIME_SKIP'; seconds: number; profileParams: ProfileParams }
  | { type: 'PAUSE'; paused: boolean }
  | { type: 'REQUEST_SAVE' }
  | { type: 'SET_TICK_HZ'; coreHz: number; snapshotHz: number };

export interface BuyLogEntry {
  tick: number;
  time_s: number;
  action: string;
  upgrade?: string;
  cost?: number;
  target?: string;
  tier: number;
}

export interface Milestone {
  tick: number;
  time_s: number;
  kind: string;
  tier?: number;
  name?: string;
  mass?: number;
}

// Save v5 payload (scaffold plan §4.6). Clean break from the prototype's v4:
// canonical carry.* names throughout — no mpsFloor/mpcFloor/apsFloor relics.
export interface SavePayloadV5 {
  version: 5;
  savedAt: number;
  schemaSig: string;
  game: EngineState;
  meta: { appBuild: string; lastTier: number };
}
