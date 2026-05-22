// store/audioSlice.ts — mute + master volume (§4.5).
//
// Slice only — no audio engine in v0.1 (scaffold §11 out-of-scope). The Web
// Audio chain attaches later and reads these flags.

import type { StateCreator } from 'zustand';

export interface AudioSlice {
  muted: boolean;
  masterVolume: number;

  setMuted(v: boolean): void;
  setMasterVolume(v: number): void;
}

export const createAudioSlice: StateCreator<AudioSlice, [], [], AudioSlice> = (set) => ({
  muted: false,
  masterVolume: 0.8,

  setMuted(v) {
    set({ muted: v });
  },
  setMasterVolume(v) {
    set({ masterVolume: Math.max(0, Math.min(1, v)) });
  },
});
