// store/uiSlice.ts — sheet / modal / focus / narrator queue (§4.5).
//
// No engine knowledge. Real chrome lands in G5; for G2 the slice exists so the
// store shape is whole and the debug readout can toggle the sheet.

import type { StateCreator } from 'zustand';

export interface NarratorLine {
  id: string;
  text: string;
  // 'fading' = narrator voice (we / I); 'clinical' = persistent register.
  register: 'fading' | 'clinical';
}

export interface UiSlice {
  sheetOpen: boolean;
  activeModal: 'settings' | null;
  narratorQueue: NarratorLine[];
  // Which chrome the player sees. 'title' = main menu (the engine ticks
  // underneath, but the player has not begun); 'game' = the running game. Lifted
  // into the store (from App-local state) so the dev elapsed clock can count
  // real time only during actual play, not while sitting on the menu.
  appView: 'title' | 'game';

  setSheetOpen(open: boolean): void;
  setActiveModal(modal: 'settings' | null): void;
  pushNarrator(l: NarratorLine): void;
  shiftNarrator(): void;
  setAppView(v: 'title' | 'game'): void;
}

export const createUiSlice: StateCreator<UiSlice, [], [], UiSlice> = (set, get) => ({
  sheetOpen: false,
  activeModal: null,
  narratorQueue: [],
  appView: 'title',

  setSheetOpen(open) {
    set({ sheetOpen: open });
  },
  setActiveModal(modal) {
    set({ activeModal: modal });
  },
  pushNarrator(l) {
    set({ narratorQueue: [...get().narratorQueue, l] });
  },
  shiftNarrator() {
    set({ narratorQueue: get().narratorQueue.slice(1) });
  },
  setAppView(v) {
    set({ appView: v });
  },
});
