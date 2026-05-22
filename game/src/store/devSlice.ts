// store/devSlice.ts — debug toggles + dev time-skip params (§4.5).
//
// Only meaningful on the dev route (G6). Slice exists now so the store shape is
// complete and the throwaway debug readout (G2) can flip toggles.

import type { StateCreator } from 'zustand';

export interface DevSlice {
  showInspector: boolean;
  freeOrbit: boolean;
  forcedTier: number | null;
  timeSkipSeconds: number;

  setShowInspector(v: boolean): void;
  setFreeOrbit(v: boolean): void;
  setForcedTier(t: number | null): void;
  setTimeSkipSeconds(s: number): void;
}

export const createDevSlice: StateCreator<DevSlice, [], [], DevSlice> = (set) => ({
  showInspector: false,
  freeOrbit: false,
  forcedTier: null,
  timeSkipSeconds: 3600,

  setShowInspector(v) {
    set({ showInspector: v });
  },
  setFreeOrbit(v) {
    set({ freeOrbit: v });
  },
  setForcedTier(t) {
    set({ forcedTier: t });
  },
  setTimeSkipSeconds(s) {
    set({ timeSkipSeconds: s });
  },
});
