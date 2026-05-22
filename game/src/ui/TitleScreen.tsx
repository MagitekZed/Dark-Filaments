// ui/TitleScreen.tsx — Dark Filaments landing chrome (scaffold §3 G5).
//
// Absorbed from the spike's TitleScene + TitleChrome. In game/, the cosmic
// scene (CosmicCanvas) is already the backdrop — the engine boots on app mount
// — so the title is a DOM overlay over the running scene, not its own canvas.
// A door, not a trailer: wordmark + CTA cluster (Begin / Return) + a settings
// gear placeholder + the rotating cosmological-fact ribbon (clinical constants).
//
// Begin → onBegin() (App reveals the GameChrome and dismisses the title). The
// engine is already running underneath; Begin only changes which chrome shows.
// Return → opens the stubbed save-code modal (token UX is OUT of v0.1 scope).
// Settings → non-functional placeholder for parity with in-game chrome.
//
// Player-facing text: the wordmark and the cosmological constants only — no
// second person, no exclamation, no editorializing.

import { useEffect, useState } from 'react';
import { CosmologicalFacts } from './CosmologicalFacts';
import { ReturnModal } from './ReturnModal';
import './chrome.css';

const TITLE = 'Dark Filaments';
const TITLE_CHROME_FADEOUT_MS = 900;

export interface TitleScreenProps {
  /** Called when Begin is clicked — App reveals the running-game chrome. */
  onBegin: () => void;
}

export function TitleScreen({ onBegin }: TitleScreenProps) {
  const [phase, setPhase] = useState<'mount' | 'title' | 'cta' | 'done'>('mount');
  const [fadingOut, setFadingOut] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  // Staggered entrance — title → CTA → gear+fact.
  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase('title'), 400);
    const t2 = window.setTimeout(() => setPhase('cta'), 1800);
    const t3 = window.setTimeout(() => setPhase('done'), 2800);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);

  const titleVisible = phase !== 'mount';
  const ctaVisible = phase === 'cta' || phase === 'done';
  const auxVisible = phase === 'done';

  const letters = TITLE.split('');
  const mid = (letters.length - 1) / 2;
  const letterStaggerMs = 35;

  const handleBegin = () => {
    if (fadingOut) return;
    setFadingOut(true);
    try {
      (navigator as Navigator & { vibrate?: (p: number) => boolean }).vibrate?.(8);
    } catch {
      /* noop */
    }
    // Let the chrome fade before App swaps to the game chrome.
    window.setTimeout(onBegin, TITLE_CHROME_FADEOUT_MS);
  };

  return (
    <div className={`titleui-root ${fadingOut ? 'titleui-fading-out' : ''}`} data-ui-root>
      {/* Top-right: settings gear placeholder (non-functional on the title). */}
      <button
        type="button"
        className={`titleui-settings ${auxVisible ? 'titleui-visible' : ''}`}
        aria-label="settings"
        title="settings"
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M19.4 14.6a7.7 7.7 0 0 0 .07-1.2 7.7 7.7 0 0 0-.07-1.2l2.0-1.55a.5.5 0 0 0 .12-.62l-1.9-3.28a.5.5 0 0 0-.6-.22l-2.36.95a7.4 7.4 0 0 0-2.07-1.2l-.36-2.5a.5.5 0 0 0-.5-.43h-3.78a.5.5 0 0 0-.5.43l-.36 2.5a7.4 7.4 0 0 0-2.07 1.2l-2.36-.95a.5.5 0 0 0-.6.22l-1.9 3.28a.5.5 0 0 0 .12.62l2.0 1.55a7.7 7.7 0 0 0-.07 1.2 7.7 7.7 0 0 0 .07 1.2l-2.0 1.55a.5.5 0 0 0-.12.62l1.9 3.28a.5.5 0 0 0 .6.22l2.36-.95a7.4 7.4 0 0 0 2.07 1.2l.36 2.5a.5.5 0 0 0 .5.43h3.78a.5.5 0 0 0 .5-.43l.36-2.5a7.4 7.4 0 0 0 2.07-1.2l2.36.95a.5.5 0 0 0 .6-.22l1.9-3.28a.5.5 0 0 0-.12-.62z" />
        </svg>
      </button>

      {/* Wordmark — inside-out letter-pair stagger. */}
      <h1 className={`titleui-title ${titleVisible ? 'titleui-visible' : ''}`}>
        {letters.map((ch, i) => {
          const distance = Math.abs(i - mid);
          const delayMs = Math.round(distance * letterStaggerMs);
          return (
            <span
              key={`${ch}-${i}`}
              className="titleui-title-letter"
              style={{ transitionDelay: titleVisible ? `${delayMs}ms` : '0ms' }}
            >
              {ch === ' ' ? ' ' : ch}
            </span>
          );
        })}
      </h1>

      {/* CTA cluster — Begin / Return. */}
      <div
        className={`titleui-cta-cluster ${ctaVisible ? 'titleui-visible' : ''} ${
          auxVisible ? 'titleui-breathing' : ''
        }`}
      >
        <button type="button" className="titleui-cta" onClick={handleBegin}>
          Begin
        </button>
        <button
          type="button"
          className="titleui-cta"
          onClick={() => {
            try {
              (navigator as Navigator & { vibrate?: (p: number) => boolean }).vibrate?.(8);
            } catch {
              /* noop */
            }
            setReturnOpen(true);
          }}
        >
          Return
        </button>
      </div>

      {/* Cosmological-fact ribbon. */}
      <div className="titleui-fact-slot">
        <CosmologicalFacts visible={auxVisible} />
      </div>

      <ReturnModal open={returnOpen} onClose={() => setReturnOpen(false)} />
    </div>
  );
}
