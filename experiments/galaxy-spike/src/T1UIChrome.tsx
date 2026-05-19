import { useCallback, useEffect, useRef, useState } from 'react'
import { firePull } from './pullEvents'
import './T1UIChrome.css'

// ─── Mock game state for the UI test ──────────────────────────────────
//
// The chrome is interactive without engine wiring. Each scene-tap adds
// MPC mass and a little consolidation; after a few taps the breathing
// onboarding cues activate and the upgrade hairline starts to draw the
// eye. Three stub upgrade cards live inside the sheet so the prose-first
// card layout can be eyeballed too.

const MPC_VALUE = 0.12          // mass per click, M☉
const MPS_VALUE = 0.00          // mass per second — T1 has no autoclickers
const ACPS_VALUE = 0            // T1: zero. AC/s only shown when > 0.

// 13-digit cosmological-flavor mystery number (designer's mock value).
// Kept verbatim across sessions so the player sees the same number from
// minute one. Real placement decision deferred — for now we don't tick it.
const CAUSAL_NUMBER = '8,419,302,776,043'

const CONSOLIDATION_PER_TAP = 0.05  // 20 taps fills the bar — fast demo cadence
const ONBOARDING_TAP_THRESHOLD = 3  // breathing cue activates after this many taps

// Click verb is tier-rotating per the load-bearing rule. T1 = PULL.
const CLICK_VERB = 'PULL'

// Three stub upgrade cards — real T1 upgrade names. Prose-first per the
// canonical rule: name, one-line clinical description, cost, level.
const STUB_UPGRADES = [
  {
    name: 'Solar Wind',
    desc: 'a bright persistent pressure from your star',
    cost: 0.85,
    level: 0,
  },
  {
    name: 'Asteroid Belt',
    desc: 'rocky bodies bound on shared orbits',
    cost: 3.40,
    level: 0,
  },
  {
    name: 'Orbital Resonance',
    desc: 'periods locked in small whole-number ratios',
    cost: 12.0,
    level: 0,
  },
]

interface T1UIChromeProps {
  /** If true, mounts the first-time tap cue. Resets after first tap. */
  showOnboarding?: boolean
}

function fmtMass(n: number): string {
  if (n < 10) return n.toFixed(2) + ' M☉'
  if (n < 1000) return n.toFixed(1) + ' M☉'
  if (n < 1e6) return (n / 1e3).toFixed(2) + 'k M☉'
  return n.toExponential(2) + ' M☉'
}

function fmtRate(n: number, suffix: string): string {
  return n.toFixed(2) + ' M☉' + suffix
}

export function T1UIChrome({ showOnboarding = true }: T1UIChromeProps) {
  const [mass, setMass] = useState(0)
  const [consolidation, setConsolidation] = useState(0)
  const [tapCount, setTapCount] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [hintEverShown, setHintEverShown] = useState(false)

  // Window-level tap detection: pointerdown → pointerup with < 5px
  // movement registers as a tap. OrbitControls' drag (larger movement)
  // is ignored. Clicks on chrome elements (carrying data-ui) are skipped
  // so the gear and upgrade-hit area don't double-fire.
  const downPosRef = useRef<{ x: number; y: number } | null>(null)

  const handleTap = useCallback((screenX: number, screenY: number) => {
    setMass(m => m + MPC_VALUE)
    setConsolidation(c => Math.min(c + CONSOLIDATION_PER_TAP, 1.0))
    setTapCount(c => c + 1)
    // Spawn a particle burst at the tap point. The burst's particles
    // each drift in a random direction; gravity from the Sun curves
    // their paths inward. PullParticles (mounted inside the Canvas)
    // consumes this event on the next frame.
    firePull(screenX, screenY)
  }, [])

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      downPosRef.current = { x: e.clientX, y: e.clientY }
    }
    const onPointerUp = (e: PointerEvent) => {
      const down = downPosRef.current
      downPosRef.current = null
      if (!down) return
      const dx = e.clientX - down.x
      const dy = e.clientY - down.y
      if (dx * dx + dy * dy >= 25) return  // drag, not tap
      const target = e.target as HTMLElement | null
      if (!target) return
      // Skip clicks on chrome surfaces (gear, sheet, upgrade hit).
      if (target.closest('[data-ui]')) return
      // Skip clicks outside this tab's scene-layer (e.g., the spike-tabs).
      if (!target.closest('canvas, .t1ui-tap-zone')) return
      handleTap(e.clientX, e.clientY)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [handleTap])

  // The "upgrades" hint fades in once the player can afford any upgrade
  // for the first time, then stays visible only until the sheet first
  // opens. Per the designer's spec.
  const canAffordAnything = STUB_UPGRADES.some(u => mass >= u.cost)
  const showUpgradeHint = canAffordAnything && !hintEverShown

  // Hairline breathes after 3 taps and continues until first sheet open.
  const breathingActive = tapCount >= ONBOARDING_TAP_THRESHOLD && !hintEverShown

  // First-tap cue fades on first tap.
  const showFirstCue = showOnboarding && tapCount === 0

  return (
    <div className="t1ui-root" data-ui-root>
      {/* Invisible full-viewport tap surface — captures clicks that
          aren't on chrome elements. OrbitControls' drag still works
          because the window-level handler only fires on small-movement
          pointer-up events. */}
      <button
        className="t1ui-tap-zone"
        aria-label={CLICK_VERB.toLowerCase()}
      />

      {/* Top edge: Consolidation bar */}
      <div className="t1ui-consolidation">
        <div className="t1ui-consolidation-track" />
        <div
          className="t1ui-consolidation-fill"
          style={{ width: `${consolidation * 100}%` }}
        >
          <div className="t1ui-consolidation-glow" />
        </div>
      </div>

      {/* Top-left: Mass counter */}
      <div className="t1ui-mass">
        <div className="t1ui-mass-scrim" />
        <div className="t1ui-mass-text">{fmtMass(mass)}</div>
      </div>

      {/* Top-left below Mass: Stats line */}
      <div className="t1ui-stats">
        <span>{fmtRate(MPS_VALUE, '/s')}</span>
        <span className="sep">·</span>
        <span>{fmtRate(MPC_VALUE, '/click')}</span>
        {ACPS_VALUE > 0 && (
          <>
            <span className="sep">·</span>
            <span>{ACPS_VALUE.toFixed(2)} AC/s</span>
          </>
        )}
      </div>

      {/* Top-right: Settings gear */}
      <button
        className="t1ui-settings"
        data-ui
        aria-label="settings"
        title="settings"
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M19.4 14.6a7.7 7.7 0 0 0 .07-1.2 7.7 7.7 0 0 0-.07-1.2l2.0-1.55a.5.5 0 0 0 .12-.62l-1.9-3.28a.5.5 0 0 0-.6-.22l-2.36.95a7.4 7.4 0 0 0-2.07-1.2l-.36-2.5a.5.5 0 0 0-.5-.43h-3.78a.5.5 0 0 0-.5.43l-.36 2.5a7.4 7.4 0 0 0-2.07 1.2l-2.36-.95a.5.5 0 0 0-.6.22l-1.9 3.28a.5.5 0 0 0 .12.62l2.0 1.55a7.7 7.7 0 0 0-.07 1.2 7.7 7.7 0 0 0 .07 1.2l-2.0 1.55a.5.5 0 0 0-.12.62l1.9 3.28a.5.5 0 0 0 .6.22l2.36-.95a7.4 7.4 0 0 0 2.07 1.2l.36 2.5a.5.5 0 0 0 .5.43h3.78a.5.5 0 0 0 .5-.43l.36-2.5a7.4 7.4 0 0 0 2.07-1.2l2.36.95a.5.5 0 0 0 .6-.22l1.9-3.28a.5.5 0 0 0-.12-.62z" />
        </svg>
        <span className="t1ui-settings-label">settings</span>
      </button>

      {/* Bottom-right: Causal Connections (unlabeled mystery number) */}
      <div className="t1ui-causal">
        <div className="t1ui-causal-scrim" />
        <div className="t1ui-causal-text">{CAUSAL_NUMBER}</div>
      </div>

      {/* Bottom-center: Upgrade affordance */}
      <div className={`t1ui-upgrade ${breathingActive ? 'breathing' : ''}`}>
        <div className="t1ui-click-verb">{CLICK_VERB}</div>
        <div className="t1ui-upgrade-hairline" />
        <div className={`t1ui-upgrade-hint ${showUpgradeHint ? 'visible' : ''}`}>
          upgrades
        </div>
      </div>
      <button
        className="t1ui-upgrade-hit"
        data-ui
        aria-label="open upgrades"
        onClick={() => {
          setSheetOpen(true)
          setHintEverShown(true)
        }}
      />

      {/* First-tap onboarding cue — center point + click verb */}
      {showFirstCue && (
        <div className="t1ui-first-cue">
          <div className="t1ui-first-cue-point" />
          <div className="t1ui-first-cue-verb">{CLICK_VERB}</div>
        </div>
      )}

      {/* Upgrade sheet — rises from the bottom on hairline tap */}
      <div className={`t1ui-sheet ${sheetOpen ? 'open' : ''}`} data-ui>
        <div className="t1ui-sheet-grid">
          {STUB_UPGRADES.map((u, i) => {
            const affordable = mass >= u.cost
            return (
              <div key={i} className={`t1ui-card ${affordable ? 'affordable' : ''}`}>
                <div className="t1ui-card-name">{u.name}</div>
                <div className="t1ui-card-desc">{u.desc}</div>
                <div className="t1ui-card-row">
                  <div className="t1ui-card-cost">
                    {u.cost.toFixed(2)} M☉
                  </div>
                  <div className="t1ui-card-level">L{u.level}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tap-outside-to-close — invisible scrim above the scene, below
          the sheet, only active when the sheet is open. */}
      {sheetOpen && (
        <button
          data-ui
          className="t1ui-sheet-close-zone"
          aria-label="close upgrades"
          onClick={() => setSheetOpen(false)}
          style={{
            position: 'absolute',
            left: 0, right: 0, top: 0, bottom: '55%',
            background: 'transparent',
            border: 0,
            cursor: 'default',
            pointerEvents: 'auto',
            zIndex: 4,
          }}
        />
      )}
    </div>
  )
}
