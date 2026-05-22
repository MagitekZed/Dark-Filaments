// ui/GameChrome.tsx — the running-game Edge-Vignette chrome shell (scaffold §3 G5).
//
// Composes the player-facing chrome OVER the CosmicCanvas scene, all driven by
// live engine state via selectors. The chrome root is pointer-events:none so
// taps fall through to the scene (CosmicCanvas owns the tap → firePull +
// sendClick); only the interactive children (gear, sheet, cards, upgrade-hit,
// consolidate button) re-enable pointer events and stopPropagation so a chrome
// tap never also fires scene income.
//
// Surfaces (z-order low → high inside the root):
//   ConsolidationBar (top edge) · MassReadout (top-left) · CausalConnections
//   (bottom-right, unlabeled static) · ClickVerb + upgrade hairline/hint
//   (bottom-center) · SettingsGear (top-right) · the upgrade-hit target ·
//   the Consolidate affordance (when the gate is ready) · UpgradeSheet
//   (bottom-rising) · NarratorSurface + ReturnSurface (fading narrator, fixed,
//   above the chrome root).
//
// Onboarding cues (absorbed from spike T1UIChrome, made engine-aware):
//   - first-tap center cue: shown until the player first taps the scene
//     (window-level small-movement pointer detection — does NOT fire income;
//     CosmicCanvas owns income, this only dismisses the cue).
//   - "upgrades" hint: fades in once any upgrade is affordable and stays until
//     the sheet is first opened.
//   - hairline breathe: after a few taps, until the sheet is first opened.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '../store';
import { selectAffordable, selectConsolidation } from '../store/selectors';
import { sendTierUp } from '../workers/engineClient';
import { MassReadout } from './MassReadout';
import { ConsolidationBar } from './ConsolidationBar';
import { CausalConnections } from './CausalConnections';
import { ClickVerb } from './ClickVerb';
import { useClickVerb } from './useClickVerb';
import { SettingsGear } from './SettingsGear';
import { UpgradeSheet } from './UpgradeSheet';
import { NarratorSurface } from './NarratorSurface';
import { ReturnSurface } from './ReturnSurface';
import './chrome.css';

const ONBOARDING_TAP_BREATHE = 3;

export function GameChrome() {
  const setSheetOpen = useStore((s) => s.setSheetOpen);
  const sheetEverOpenedRef = useRef(false);
  const affordable = useStore(useShallow(selectAffordable));
  const { ready } = useStore(useShallow(selectConsolidation));

  const [tapCount, setTapCount] = useState(0);
  const [hintEverShown, setHintEverShown] = useState(false);

  // Window-level tap detection — purely for dismissing the onboarding cue and
  // driving the hairline breathe. Income is fired by CosmicCanvas; this listener
  // only counts small-movement scene taps that are NOT on chrome elements.
  const downRef = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      downRef.current = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e: PointerEvent) => {
      const down = downRef.current;
      downRef.current = null;
      if (!down) return;
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      if (dx * dx + dy * dy >= 25) return; // drag, not tap
      const target = e.target as HTMLElement | null;
      if (target && target.closest('[data-ui]')) return; // chrome tap, skip
      setTapCount((c) => c + 1);
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  const openSheet = useCallback(() => {
    sheetEverOpenedRef.current = true;
    setHintEverShown(true);
    setSheetOpen(true);
  }, [setSheetOpen]);

  const onConsolidate = useCallback(() => {
    sendTierUp();
  }, []);

  const canAfford = affordable.length > 0;
  const showUpgradeHint = canAfford && !hintEverShown;
  const breathingActive = tapCount >= ONBOARDING_TAP_BREATHE && !hintEverShown;
  const showFirstCue = tapCount === 0;
  const firstCueVerb = useClickVerb();

  return (
    <>
      <div className="dfui-root" data-ui-root>
        <ConsolidationBar />
        <MassReadout />
        <CausalConnections />
        <SettingsGear />

        {/* Bottom-center: click verb + upgrade hairline/hint */}
        <div className={`dfui-bottom ${breathingActive ? 'dfui-breathing' : ''}`}>
          <ClickVerb />
          <div className="dfui-upgrade-hairline" />
          <div className={`dfui-upgrade-hint ${showUpgradeHint ? 'dfui-visible' : ''}`}>
            upgrades
          </div>
        </div>

        {/* Invisible hit target opens the sheet. */}
        <button
          type="button"
          className="dfui-upgrade-hit"
          data-ui
          aria-label="open upgrades"
          onClick={openSheet}
        />

        {/* Consolidate affordance — only when the gate is ready. Clinical verb. */}
        {ready && (
          <div className="dfui-consolidate" data-ui>
            <button
              type="button"
              className="dfui-consolidate-btn"
              onClick={onConsolidate}
            >
              Consolidate
            </button>
          </div>
        )}

        {/* First-tap onboarding cue. */}
        {showFirstCue && (
          <div className="dfui-first-cue">
            <div className="dfui-first-cue-point" />
            <div className="dfui-first-cue-verb">{firstCueVerb}</div>
          </div>
        )}

        {/* Upgrade sheet (rises from bottom). */}
        <UpgradeSheet />
      </div>

      {/* Fading narrator surfaces — fixed, above the chrome root. */}
      <NarratorSurface />
      <ReturnSurface />
    </>
  );
}
