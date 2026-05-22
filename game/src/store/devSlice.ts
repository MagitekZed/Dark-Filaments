// store/devSlice.ts — debug toggles + dev time-skip params (§4.5).
//
// Only meaningful on the dev route (G6). The slice exists in the store shape
// regardless so persistence/engineClient never branch on dev-ness; the dev
// panel (dev/DevRoute.tsx) is the only consumer, and it is import.meta.env.DEV-
// gated so the whole dev surface tree-shakes out of the production build.
//
// State here is plain UI/authoring state — it never reaches the engine save.
//   panelOpen      — dev panel visibility (toggled by the backtick key).
//   showInspector  — SnapshotInspector sub-panel visibility.
//   freeOrbit      — mount drei OrbitControls (cameraRig.DevOrbitControls reads it).
//   forcedTier     — SceneSwitcher force-mount: when non-null, CosmicCanvas
//                    mounts this tier's scene instead of the live engine tier
//                    (authoring/inspection without progressing the game).
//   timeSkipSeconds— FastForward's current duration input (last value used).
//   paramPatch     — the last SET_PARAMS patch the dev applied, kept so
//                    ParamOverrides can show what is currently overridden
//                    (the engine snapshot does not echo params back).

import type { StateCreator } from 'zustand';
import type { Params } from '../engine';

export interface DevSlice {
  panelOpen: boolean;
  showInspector: boolean;
  freeOrbit: boolean;
  forcedTier: number | null;
  timeSkipSeconds: number;
  paramPatch: Partial<Params>;

  setPanelOpen(v: boolean): void;
  togglePanel(): void;
  setShowInspector(v: boolean): void;
  setFreeOrbit(v: boolean): void;
  setForcedTier(t: number | null): void;
  setTimeSkipSeconds(s: number): void;
  recordParamPatch(patch: Partial<Params>): void;
  clearParamPatch(): void;
}

export const createDevSlice: StateCreator<DevSlice, [], [], DevSlice> = (set) => ({
  // Open by default — DevRoute (the only consumer) is import.meta.env.DEV-gated,
  // so this matters only in dev mode, where having the tools visible on first
  // load (without hunting for the backtick toggle) is the right default. The
  // backtick key toggles it; in production DevRoute never mounts so this is
  // inert store shape.
  panelOpen: true,
  showInspector: false,
  freeOrbit: false,
  forcedTier: null,
  timeSkipSeconds: 3600,
  paramPatch: {},

  setPanelOpen(v) {
    set({ panelOpen: v });
  },
  togglePanel() {
    set((s) => ({ panelOpen: !s.panelOpen }));
  },
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
  recordParamPatch(patch) {
    set((s) => ({ paramPatch: { ...s.paramPatch, ...patch } }));
  },
  clearParamPatch() {
    set({ paramPatch: {} });
  },
});
