// Dark Filaments — save module
// Long-burn v1, Engineering Phase 1 (E1).
//
// Owns localStorage I/O + the SavePayload codec. The player's universe persists
// across browser sessions via a single key; on boot, persistence.ts asks save.ts
// for the saved payload, deserializes, and the engine restores from it.
//
// TS port (scaffold plan §5.1 + §4.6 clean break):
//   - IIFE wrapper + UMD shim stripped → ES exports.
//   - SAVE_VERSION = 5; deserializeState refuses anything != 5 (no migration
//     from the prototype's v1-v4 lineage — solo tester, breaking saves during
//     scaffold development is fine per scaffold plan §1).
//   - The prototype's mpsFloor/mpcFloor/apsFloor → carryMps/carryMpc/carryAps
//     translation is DROPPED: the React engine uses canonical carry.* names
//     natively (SavePayloadV5.game IS the canonical EngineState shape). This is
//     the genuine simplification the clean break buys (§12.6).
//   - FNV-1a computeSchemaSig + the `typeof localStorage` guards port verbatim.
//   - encodeToken / decodeToken port as pure synchronous functions (no
//     CompressionStream — kept simple per §4.6 so they don't fight typing).
//
// SavePayloadV5 shape (scaffold plan §4.6):
//   {
//     version: 5,
//     savedAt: <ms>,
//     schemaSig: <string>,   // FNV-1a content hash of UPGRADES (tier:name|…)
//     game: EngineState,     // canonical names throughout — no relic translation
//     meta: { appBuild, lastTier },
//   }

import * as data from './data';
import type { EngineState, SavePayloadV5, Upgrade } from './types';

// localStorage is a DOM global. The engine compiles under the worker tsconfig
// (WebWorker lib, no DOM), and these I/O helpers run on the MAIN thread (never
// in the Worker — see scaffold plan §12.5). The `typeof localStorage` runtime
// guard makes the helpers Worker- and Node-safe; this ambient declaration just
// gives TS the symbol so the no-DOM-lib build type-checks. Matches the
// prototype's `typeof localStorage === 'undefined'` guard exactly.
declare const localStorage: {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
} | undefined;

const LOCAL_KEY = 'dark-filaments:save:v1';

type AnyState = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

interface SerializeOpts {
  appBuild?: string;
  lastTier?: number;
}

interface DeserializeResult {
  version: number;
  savedAt: number;
  schemaSig: string;
  schemaSigCurrent: string;
  game: EngineState;
  meta: { appBuild: string; lastTier: number };
  schemaSigMismatch: boolean;
}

interface RefusalResult {
  error: string;
  payload: null;
}

// schemaSig — derived from UPGRADES (id + order) per §3. Detects upgrade-tree
// changes between save writes and reads. We use a lightweight join over names
// rather than a real hash; collision is not a security concern here, and a
// stable string is easier to eyeball during dev.
export function computeSchemaSig(upgrades: Upgrade[]): string {
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

// serializeState — projects a canonical EngineState into a SavePayloadV5.
// Inputs:
//   liveState : a canonical EngineState (carry.carryMps/carryMpc/carryAps +
//               carry.allMps/allMpc/allAps; no mpsFloor/mpcFloor/apsFloor
//               relics — the clean break removed them).
//   opts      : { appBuild, lastTier } — meta fields the caller can stamp.
export function serializeState(liveState: AnyState, opts?: SerializeOpts): SavePayloadV5 {
  const o = opts || {};
  const carry = liveState.carry || {};
  return {
    version: data.SAVE_VERSION as 5,
    savedAt: Date.now(),
    schemaSig: computeSchemaSig(data.UPGRADES),
    game: {
      mass: liveState.mass || 0,
      // Internal field renamed `cohesion` → `consolidation` 2026-05-13
      // (engine-wide consolidation rename pass).
      consolidation: liveState.consolidation || 0,
      currentTier: liveState.currentTier || 1,
      // Shallow clone — levels is { [name]: int }, no nested refs.
      levels: Object.assign({}, liveState.levels || {}),
      carry: {
        allMps: carry.allMps == null ? 1.0 : carry.allMps,
        allMpc: carry.allMpc == null ? 1.0 : carry.allMpc,
        allAps: carry.allAps == null ? 1.0 : carry.allAps,
        // Canonical names natively — no mpsFloor/mpcFloor/apsFloor translation
        // (the clean break removed the relic field names entirely; §4.6).
        carryMps: carry.carryMps || 0,
        carryMpc: carry.carryMpc || 0,
        carryAps: carry.carryAps || 0,
      },
      consolidationThreshold: liveState.consolidationThreshold || 0,
      consolidationHitMs: liveState.consolidationHitMs == null ? null : liveState.consolidationHitMs,
      totalClicks: liveState.totalClicks || 0,
      sessionStart: liveState.sessionStart || Date.now(),
      totalPausedMs: liveState.totalPausedMs || 0,
      massGainedClicks: liveState.massGainedClicks || 0,
      massGainedPassive: liveState.massGainedPassive || 0,
      massGainedAuto: liveState.massGainedAuto || 0,
      tickCount: liveState.tickCount || 0,
      // tierSnapshots: deep-ish clone — entries are flat objects with a
      // nested `levelsAtEnd` map. Spread + nested spread is sufficient.
      tierSnapshots: (liveState.tierSnapshots || []).map((snap: AnyState) => Object.assign(
        {}, snap,
        { levelsAtEnd: snap && snap.levelsAtEnd ? Object.assign({}, snap.levelsAtEnd) : null },
      )),
    },
    meta: {
      appBuild: o.appBuild || 'scaffold-v0.1',
      lastTier: o.lastTier != null ? o.lastTier : (liveState.currentTier || 1),
    },
  };
}

// deserializeState — round-trips a SavePayloadV5 back into a payload shape
// ready for the engine to restore. Returns null when the payload is unusable.
//
// Version handling (2026-05-21 clean break, §4.6):
//   anything != SAVE_VERSION (5) is REFUSED. < 5 → 'pre_retune_save_version_<v>'
//   (the prototype's v1-v4 lineage; no migration). > 5 → 'newer_save_version'.
//   The player gets a fresh universe. The clean break is a deliberate
//   simplification: solo tester, breaking saves during scaffold development
//   is always fine (scaffold plan §1 standing principle).
export function deserializeState(payload: unknown): DeserializeResult | RefusalResult | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as AnyState;
  if (p.version == null) return null;
  if (p.version > data.SAVE_VERSION) {
    // Future-version save loaded in older build: refuse, do not load.
    return { error: 'newer_save_version', payload: null };
  }
  if (p.version < data.SAVE_VERSION) {
    // Pre-current save (the prototype's v1-v4 lineage). Refuse — no migration
    // across the clean break. Player gets a fresh universe.
    return { error: 'pre_retune_save_version_' + p.version, payload: null };
  }
  // Defensive: copy `game` so callers can mutate without affecting the
  // canonical payload (which is also returned).
  const game = p.game || {};
  const out: DeserializeResult = {
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
      tierSnapshots: (game.tierSnapshots || []).map((snap: AnyState) => Object.assign(
        {}, snap,
        { levelsAtEnd: snap && snap.levelsAtEnd ? Object.assign({}, snap.levelsAtEnd) : null },
      )),
    },
    meta: Object.assign(
      { appBuild: '', lastTier: 1 },
      p.meta || {},
    ),
    schemaSigMismatch: false,
  };
  // schemaSig mismatch surfaces as a warning, not a refusal, per §10 open
  // item 2 (load with a warning — recommended for v1 dev tool).
  out.schemaSigMismatch = (out.schemaSig !== out.schemaSigCurrent);
  return out;
}

// --- Token codec (encodeToken / decodeToken) ---------------------------
// Pure, synchronous, no CompressionStream (kept simple per §4.6). Format:
//   DF5.<base64-of-json>.<crc>
// A convenience for handing dev saves between machines. localStorage round-trip
// is the real gate; the token is optional. CRC is a sanity check, not security.

function crc32(str: string): string {
  let crc = 0xffffffff >>> 0;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) & 0xff;
    for (let b = 0; b < 8; b++) {
      crc = (crc & 1) ? ((crc >>> 1) ^ 0xedb88320) >>> 0 : (crc >>> 1) >>> 0;
    }
  }
  return ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, '0');
}

// base64 encode/decode that works in browser, Worker, and Node (no Buffer
// dependency). btoa/atob handle Latin-1; we percent-encode to survive UTF-8.
function b64encode(str: string): string {
  const bytes = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_m, h) =>
    String.fromCharCode(parseInt(h, 16)),
  );
  if (typeof btoa !== 'undefined') return btoa(bytes);
  // Node fallback (no btoa in older runtimes).
  return globalThisAsAny().Buffer.from(bytes, 'binary').toString('base64');
}

function b64decode(b64: string): string {
  let bytes: string;
  if (typeof atob !== 'undefined') bytes = atob(b64);
  else bytes = globalThisAsAny().Buffer.from(b64, 'base64').toString('binary');
  return decodeURIComponent(
    bytes.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''),
  );
}

function globalThisAsAny(): AnyState {
  return globalThis as unknown as AnyState;
}

export function encodeToken(payload: SavePayloadV5): string {
  const json = JSON.stringify(payload);
  const b64 = b64encode(json);
  return 'DF5.' + b64 + '.' + crc32(json);
}

export function decodeToken(token: string): SavePayloadV5 | null {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'DF5') return null;
  let json: string;
  try {
    json = b64decode(parts[1]);
  } catch {
    return null;
  }
  if (crc32(json) !== parts[2]) return null;
  try {
    return JSON.parse(json) as SavePayloadV5;
  } catch {
    return null;
  }
}

// localStorage I/O — wrap with try/catch because Safari private mode + some
// sandboxed file:// contexts throw on access. Main-thread only (§12.5).

export function writeLocalSave(payload: SavePayloadV5): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    const json = JSON.stringify(payload);
    localStorage.setItem(LOCAL_KEY, json);
    return true;
  } catch (e) {
    console.warn('save.writeLocalSave failed:', e && (e as Error).message);
    return false;
  }
}

export function readLocalSave(): SavePayloadV5 | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const json = localStorage.getItem(LOCAL_KEY);
    if (!json) return null;
    const payload = JSON.parse(json);
    return payload as SavePayloadV5;
  } catch (e) {
    console.warn('save.readLocalSave failed:', e && (e as Error).message);
    return null;
  }
}

export function clearLocalSave(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    localStorage.removeItem(LOCAL_KEY);
    return true;
  } catch (e) {
    console.warn('save.clearLocalSave failed:', e && (e as Error).message);
    return false;
  }
}

export { LOCAL_KEY };
