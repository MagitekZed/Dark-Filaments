import { useEffect, useState } from 'react'
import { CosmologicalFacts } from './CosmologicalFacts'
import { ReturnModal } from './ReturnModal'
import './TitleChrome.css'

// ─── Title chrome — DOM overlay over TitleScene's Canvas ─────────────
//
// A door, not a trailer. Title + CTA cluster (Begin / Return) + settings
// gear placeholder + rotating cosmological-fact slot. Entrance is paced
// like a tier-up — scene visible immediately, title fades inside-out,
// then CTA, then gear+fact.
//
// Begin → silent dispatch (resume if save exists, else new game). For
// the spike, that means firing the onBegin callback which the App owns;
// the App switches to the T1 tab via the 1200ms crossfade.
//
// Return → opens the stubbed save-code modal.
//
// Settings → non-functional placeholder for parity with in-game chrome.

export interface TitleChromeProps {
  /** Called when Begin is clicked. Owner is responsible for the page-to-
   *  game crossfade. */
  onBegin: () => void
  /** True during the page-to-game transition; chrome fades to black. */
  fadingOut: boolean
}

const TITLE = 'Dark Filaments'

export function TitleChrome({ onBegin, fadingOut }: TitleChromeProps) {
  const [phase, setPhase] = useState<'mount' | 'title' | 'cta' | 'done'>('mount')
  const [returnOpen, setReturnOpen] = useState(false)

  // Entrance pacing — staggered fades for title → CTA → gear+fact.
  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase('title'), 400)
    const t2 = window.setTimeout(() => setPhase('cta'), 1800)
    const t3 = window.setTimeout(() => setPhase('done'), 2800)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
    }
  }, [])

  const titleVisible = phase !== 'mount'
  const ctaVisible = phase === 'cta' || phase === 'done'
  const auxVisible = phase === 'done'

  // Letters with stagger from midpoint — letter pairs reveal outward.
  const letters = TITLE.split('')
  const mid = (letters.length - 1) / 2
  const letterStaggerMs = 35

  return (
    <div
      className={`titleui-root ${fadingOut ? 'titleui-fading-out' : ''}`}
      data-ui-root
    >
      {/* No DOM background layer here — the TitleScene canvas paints the
          full viewport with #000 as its WebGL background, and the solar
          system must remain visible behind the chrome. An opaque CSS
          gradient here would obscure the scene. */}

      {/* Top-right: Settings gear placeholder */}
      <button
        type="button"
        className={`titleui-settings ${auxVisible ? 'titleui-visible' : ''}`}
        aria-label="settings (not yet functional)"
        title="settings"
        // Non-functional in the spike; no onClick handler.
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M19.4 14.6a7.7 7.7 0 0 0 .07-1.2 7.7 7.7 0 0 0-.07-1.2l2.0-1.55a.5.5 0 0 0 .12-.62l-1.9-3.28a.5.5 0 0 0-.6-.22l-2.36.95a7.4 7.4 0 0 0-2.07-1.2l-.36-2.5a.5.5 0 0 0-.5-.43h-3.78a.5.5 0 0 0-.5.43l-.36 2.5a7.4 7.4 0 0 0-2.07 1.2l-2.36-.95a.5.5 0 0 0-.6.22l-1.9 3.28a.5.5 0 0 0 .12.62l2.0 1.55a7.7 7.7 0 0 0-.07 1.2 7.7 7.7 0 0 0 .07 1.2l-2.0 1.55a.5.5 0 0 0-.12.62l1.9 3.28a.5.5 0 0 0 .6.22l2.36-.95a7.4 7.4 0 0 0 2.07 1.2l.36 2.5a.5.5 0 0 0 .5.43h3.78a.5.5 0 0 0 .5-.43l.36-2.5a7.4 7.4 0 0 0 2.07-1.2l2.36.95a.5.5 0 0 0 .6-.22l1.9-3.28a.5.5 0 0 0-.12-.62z" />
        </svg>
      </button>

      {/* Title — inside-out letter-pair stagger */}
      <h1 className={`titleui-title ${titleVisible ? 'titleui-visible' : ''}`}>
        {letters.map((ch, i) => {
          const distance = Math.abs(i - mid)
          const delayMs = Math.round(distance * letterStaggerMs)
          return (
            <span
              key={`${ch}-${i}`}
              className="titleui-title-letter"
              style={{
                transitionDelay: titleVisible ? `${delayMs}ms` : '0ms',
              }}
            >
              {ch === ' ' ? ' ' : ch}
            </span>
          )
        })}
      </h1>

      {/* CTA cluster */}
      <div className={`titleui-cta-cluster ${ctaVisible ? 'titleui-visible' : ''} ${auxVisible ? 'titleui-breathing' : ''}`}>
        <button
          type="button"
          className="titleui-cta"
          onClick={() => {
            try { (navigator as Navigator & { vibrate?: (p: number) => boolean }).vibrate?.(8) } catch { /* noop */ }
            onBegin()
          }}
        >
          Begin
        </button>
        <button
          type="button"
          className="titleui-cta"
          onClick={() => {
            try { (navigator as Navigator & { vibrate?: (p: number) => boolean }).vibrate?.(8) } catch { /* noop */ }
            setReturnOpen(true)
          }}
        >
          Return
        </button>
      </div>

      {/* Cosmological-fact slot — corner on mobile, ribbon on desktop.
          CSS media queries swap the slot's positioning so we can render
          a single element and let CSS handle the responsive variant. */}
      <div className="titleui-fact-slot">
        <CosmologicalFacts visible={auxVisible} variant="ribbon" />
      </div>

      {/* Return modal — stubbed save-code restore */}
      <ReturnModal open={returnOpen} onClose={() => setReturnOpen(false)} />

      {/* No fade-to-black overlay — the Title → T1UI transition keeps
          the same scene canvas mounted (see MainScene) and crossfades
          chrome instead. The titleui-fading-out class still drives the
          chrome elements (title, CTAs, settings, fact) to fade out. */}
    </div>
  )
}
