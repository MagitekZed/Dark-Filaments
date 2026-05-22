// store/engineSlice.ts — snapshot hydration + optimistic click reflection (§4.5).
//
// engineClient calls applySnapshot on every SNAPSHOT message. The slice keeps
// the latest snapshot plus an optimisticMass that the main thread bumps on each
// click for zero-latency tap feel. selectors.ts's selectMass takes
// max(optimisticMass, snapshot.mass) so the counter NEVER jumps backward when
// an authoritative snapshot lands (§12.2). BUY does NOT optimistically decrement
// mass — it waits for the authoritative snapshot, so a buy's spend always comes
// from the worker.
//
// This slice imports only TYPES from the engine barrel (EngineSnapshot) —
// type-only, so engine purity holds. It never imports engine runtime.

import type { StateCreator } from 'zustand';
import type { EngineSnapshot } from '../engine';

export interface EngineSlice {
  snapshot: EngineSnapshot | null;
  // Latest seq we have hydrated. Stale snapshots (lower seq) are dropped so an
  // out-of-order message never rolls the display back.
  lastSeq: number;
  // Main-thread click reflection — monotonic; reconciled by selectMass taking
  // the max against the authoritative snapshot.mass.
  optimisticMass: number;
  // Discrete events surfaced for UI/scene (set by engineClient routing).
  lastTransition: { fromTier: number; toTier: number } | null;
  lastRejection: { upgrade: string; reason: string } | null;

  applySnapshot(s: EngineSnapshot): void;
  reflectClick(mpc: number): void;
  setTransition(t: { fromTier: number; toTier: number }): void;
  setRejection(r: { upgrade: string; reason: string }): void;
  clearRejection(): void;
}

export const createEngineSlice: StateCreator<EngineSlice, [], [], EngineSlice> = (set, get) => ({
  snapshot: null,
  lastSeq: -1,
  optimisticMass: 0,
  lastTransition: null,
  lastRejection: null,

  applySnapshot(s) {
    // Drop stale snapshots (seq monotonic). A snapshot that predates one we
    // already applied is discarded.
    if (s.seq <= get().lastSeq) return;
    set({ snapshot: s, lastSeq: s.seq });
  },

  reflectClick(mpc) {
    // Bump optimisticMass off the best current reading so a click always shows
    // immediately, even between snapshots. We grow from max(optimistic,
    // authoritative) so the optimistic value tracks (never falls behind) the
    // authoritative one.
    const st = get();
    const authoritative = st.snapshot?.mass ?? 0;
    const base = Math.max(st.optimisticMass, authoritative);
    set({ optimisticMass: base + mpc });
  },

  setTransition(t) {
    set({ lastTransition: t });
  },

  setRejection(r) {
    set({ lastRejection: r });
  },

  clearRejection() {
    set({ lastRejection: null });
  },
});
