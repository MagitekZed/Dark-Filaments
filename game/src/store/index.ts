// store/index.ts — create + combine the sliced Zustand store (§4.5).
//
// Four slices: engine / ui / dev / audio. Sliced so an engine tick touching
// mass does not re-render the upgrade sheet — components subscribe via the
// narrow selectors in selectors.ts. The store imports snapshot/action TYPES
// from the engine barrel (type-only via the slices); it never imports engine
// runtime modules. Engine purity holds.

import { create } from 'zustand';
import { createEngineSlice, type EngineSlice } from './engineSlice';
import { createUiSlice, type UiSlice } from './uiSlice';
import { createDevSlice, type DevSlice } from './devSlice';
import { createAudioSlice, type AudioSlice } from './audioSlice';

export type GameStore = EngineSlice & UiSlice & DevSlice & AudioSlice;

export const useStore = create<GameStore>()((...a) => ({
  ...createEngineSlice(...a),
  ...createUiSlice(...a),
  ...createDevSlice(...a),
  ...createAudioSlice(...a),
}));

// Non-React access for engineClient (it hydrates the store from worker
// snapshots outside the React tree).
export const storeApi = useStore;

export * from './selectors';
