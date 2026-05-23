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

// Live camera orientation captured in free-look mode (written by the in-Canvas
// CameraReporter, read by the dev panel's camera-capture readout). Lets the dev
// orbit to a good static framing and copy the exact numbers to set as a tier's
// default view. Cleared (null) when free-look is off.
export interface CameraReadout {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  distance: number;
}

export interface DevSlice {
  panelOpen: boolean;
  showInspector: boolean;
  freeOrbit: boolean;
  forcedTier: number | null;
  timeSkipSeconds: number;
  paramPatch: Partial<Params>;
  // Live-speed multiplier (1× = real-time 1 Hz; >1 accelerates the core tick via
  // SET_TICK_HZ so a tier can be watched unfolding). Tracked for button highlight.
  liveSpeed: number;
  // Real wall-clock ms at which the current universe began (this dev session, or
  // last Restart). Real elapsed = Date.now() - universeStartMs.
  universeStartMs: number;
  // Free-look camera capture (see CameraReadout). null when not in free-look.
  cameraReadout: CameraReadout | null;

  setPanelOpen(v: boolean): void;
  togglePanel(): void;
  setShowInspector(v: boolean): void;
  setFreeOrbit(v: boolean): void;
  setForcedTier(t: number | null): void;
  setTimeSkipSeconds(s: number): void;
  recordParamPatch(patch: Partial<Params>): void;
  clearParamPatch(): void;
  setLiveSpeed(n: number): void;
  markUniverseStart(): void;
  setCameraReadout(r: CameraReadout | null): void;
}

export const createDevSlice: StateCreator<DevSlice, [], [], DevSlice> = (set) => ({
  // Collapsed by default so the scene loads unobstructed — DevRoute shows a small
  // "dev" chip in the corner; click it or press the backtick key to expand. (Only
  // meaningful in dev mode; DevRoute is import.meta.env.DEV-gated, so in prod this
  // is inert store shape.)
  panelOpen: false,
  showInspector: false,
  freeOrbit: false,
  forcedTier: null,
  timeSkipSeconds: 3600,
  paramPatch: {},
  liveSpeed: 1,
  // Seeded at store-creation time (≈ app load). Restart re-stamps it so real
  // elapsed reads "time in this universe", not "since the tab opened".
  universeStartMs: Date.now(),
  cameraReadout: null,

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
  setLiveSpeed(n) {
    set({ liveSpeed: n });
  },
  markUniverseStart() {
    set({ universeStartMs: Date.now() });
  },
  setCameraReadout(r) {
    set({ cameraReadout: r });
  },
});
