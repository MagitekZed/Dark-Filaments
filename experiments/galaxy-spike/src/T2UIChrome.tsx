import { useCallback, useEffect, useRef, useState } from 'react'
import { firePull } from './pullEvents'
import type { T2Controls } from './T2Scene'
import './T2UIChrome.css'

// ─── T2 UI chrome — same Edge Vignette shape as T1, T2 contents ──────
//
// Mounts over T2's Canvas. State is LIFTED to T2UITestScene so the dev
// T2ControlsPanel and the prose-first cards converge on the same upgrade
// state. The chrome reports buys via onBuy; T2UITestScene applies them
// to the lifted controls.
//
// Mock economy is derived from current controls (no real engine). All
// numbers are illustrative, not calibrated against the spreadsheet.
// The Mass counter ticks per-click from MPC and per-second from MPS.

// ─── Locked T2 tier-up line + first-purchase narrator copy ──────────
// Surfaced separately by T2NarratorSurface — the chrome doesn't render
// these strings. Source: voice-samples.md §T2, data.js T2 desc fields.

const CLICK_VERB = 'PULL' // visual-design.md §7 line 167: PULL covers T1-T3.
const CONSOLIDATION_THRESHOLD_T2 = 2.5 // BP 0.6 + PV 0.9 + OC 1.0
const PRIOR_TIER_BUDGET = 1.0 // T1 already consolidated → 1.0 carries over.
const CUMULATIVE_BUDGET = PRIOR_TIER_BUDGET + CONSOLIDATION_THRESHOLD_T2 // 3.5
const ONBOARDING_TAP_THRESHOLD = 3
// Hidden mystery number — STATIC throughout Act 1. Load-bearing rule:
// the number does not change until the first named-connection break
// (T7 Eridanus Reach pivot, start of Act 2). See CLAUDE.md "The hidden
// number is shown from minute one, unlabeled, and does not change
// during Act 1."
//
// PLACEHOLDER VALUE. The exact 13 digits below are a designer mock,
// not canonical. A scientifically sound value (cosmologically motivated,
// of an order of magnitude that matches what the digits are supposed to
// represent) is a TO-DO before any surface that displays this is treated
// as canon. Any mockup that hard-codes this string should expect the
// digits to change later.
const CAUSAL_NUMBER_STATIC = 8_419_302_776_043

// ─── Upgrade slate metadata (mockup-only; not the engine) ──────────
// Author-curated order per gameplay-design.md §3. Clinical placeholder
// lines per the Two-voice UI rule (real clinical copy is TO-WRITE).

type UpgradeKind = 'stackable' | 'oneshot'

interface T2UpgradeSpec {
  key: keyof T2Controls
  name: string
  /** Clinical one-liner. Placeholder until writing backlog clears. */
  clinical: string
  kind: UpgradeKind
  initCost: number
  costGrowth: number
  maxLevels: number
  consolidation: number
  /** True if this stackable is a max-N completionist (visual tag only here). */
  completionist?: boolean
}

export const T2_UPGRADES: T2UpgradeSpec[] = [
  {
    key: 'stellarKinematics', name: 'Stellar Kinematics',
    clinical: 'doppler-resolved motions of nearby stars',
    kind: 'stackable', initCost: 0.67, costGrowth: 1.135,
    maxLevels: 99, consolidation: 0,
  },
  {
    key: 'localBubble', name: 'Local Bubble',
    clinical: 'a cavity in the interstellar medium, swept by past supernovae',
    kind: 'stackable', initCost: 2.0, costGrowth: 1.135,
    maxLevels: 99, consolidation: 0,
  },
  {
    key: 'microlensing', name: 'Microlensing',
    clinical: 'brief brightening as foreground mass crosses background light',
    kind: 'stackable', initCost: 2.3, costGrowth: 1.34,
    maxLevels: 99, consolidation: 0,
  },
  {
    key: 'rocheLobeOverflow', name: 'Roche Lobe Overflow',
    clinical: 'mass transfer across the Lagrange point of a close binary',
    kind: 'stackable', initCost: 4.0, costGrowth: 1.42,
    maxLevels: 99, consolidation: 0,
  },
  {
    key: 'brownDwarf', name: 'Brown Dwarf',
    clinical: 'substellar object below the hydrogen-fusion threshold',
    kind: 'stackable', initCost: 37, costGrowth: 2.28,
    maxLevels: 5, consolidation: 0, completionist: true,
  },
  {
    key: 'binaryPartner', name: 'Binary Partner',
    clinical: 'gravitationally bound stellar companion',
    kind: 'oneshot', initCost: 16, costGrowth: 1.0,
    maxLevels: 1, consolidation: 0.6,
  },
  {
    key: 'peculiarVelocity', name: 'Peculiar Velocity',
    clinical: 'residual motion relative to the local standard of rest',
    kind: 'oneshot', initCost: 28, costGrowth: 1.0,
    maxLevels: 1, consolidation: 0.9,
  },
  {
    key: 'openCluster', name: 'Open Cluster',
    clinical: 'a young, gravitationally loose stellar grouping',
    kind: 'oneshot', initCost: 950, costGrowth: 1.0,
    maxLevels: 1, consolidation: 1.0,
  },
  {
    key: 'movingGroup', name: 'Moving Group',
    clinical: 'stars sharing common space velocity through the disk',
    kind: 'oneshot', initCost: 1000, costGrowth: 1.0,
    maxLevels: 1, consolidation: 0,
  },
  {
    key: 'wolfRayetStar', name: 'Wolf-Rayet Star',
    clinical: 'massive evolved star shedding outer layers in strong wind',
    kind: 'stackable', initCost: 1750, costGrowth: 1.0,
    maxLevels: 3, consolidation: 0, completionist: true,
  },
]

// ─── Derived mock economy from controls ─────────────────────────────

function levelOf(controls: T2Controls, key: keyof T2Controls): number {
  const v = controls[key]
  if (typeof v === 'boolean') return v ? 1 : 0
  return v
}

function nextCost(spec: T2UpgradeSpec, currentLevel: number): number {
  return spec.initCost * Math.pow(spec.costGrowth, currentLevel)
}

function computeMpc(controls: T2Controls): number {
  // Base MPC 0.00120 (DEFAULT_PARAMS) + Microlensing addMpc + Wolf-Rayet addMpc.
  const ml = controls.microlensing * 0.060
  const wr = controls.wolfRayetStar * 0.025
  // Binary Partner synergy boosts Microlensing ×1.5 multiplicatively.
  const mlEffective = controls.binaryPartner ? ml * 1.5 : ml
  return 0.00120 + mlEffective + wr
}

function computeMps(controls: T2Controls): number {
  // Stellar Kinematics is exponential intra-upgrade (selfMps 1.115^L) × baseMps.
  const sk = controls.stellarKinematics > 0
    ? 0.0148 * Math.pow(1.115, controls.stellarKinematics - 1) * controls.stellarKinematics
    : 0
  const lb = controls.localBubble * 0.0111
  const bd = controls.brownDwarf * 0.0741
  // Moving Group adds baseMps 0.358 once owned.
  const mg = controls.movingGroup ? 0.358 : 0
  let total = sk + lb + bd + mg
  // Peculiar Velocity all-mult ×1.40 applies to everything.
  if (controls.peculiarVelocity) total *= 1.40
  return total
}

function computeAps(controls: T2Controls): number {
  // Roche Lobe Overflow gated visually on Binary Partner.
  if (!controls.binaryPartner) return 0
  return controls.rocheLobeOverflow * 0.000667
}

function computeConsolidation(controls: T2Controls): number {
  let c = 0
  if (controls.binaryPartner) c += 0.6
  if (controls.peculiarVelocity) c += 0.9
  if (controls.openCluster) c += 1.0
  return c
}

function fmtMass(n: number): string {
  if (n < 10) return n.toFixed(2) + ' M☉'
  if (n < 1000) return n.toFixed(1) + ' M☉'
  if (n < 1e6) return (n / 1e3).toFixed(2) + 'k M☉'
  return n.toExponential(2) + ' M☉'
}

function fmtRate(n: number, suffix: string): string {
  if (n < 0.001) return '0.00 M☉' + suffix
  if (n < 10) return n.toFixed(3) + ' M☉' + suffix
  return n.toFixed(2) + ' M☉' + suffix
}

function fmtCost(n: number): string {
  if (n < 100) return n.toFixed(2) + ' M☉'
  if (n < 10000) return Math.round(n).toString() + ' M☉'
  return (n / 1e3).toFixed(1) + 'k M☉'
}

function fmtCausal(n: number): string {
  return n.toLocaleString('en-US')
}

// ─── Component ──────────────────────────────────────────────────────

export interface T2UIChromeProps {
  controls: T2Controls
  onBuy: (key: keyof T2Controls) => void
}

export function T2UIChrome({ controls, onBuy }: T2UIChromeProps) {
  const [mass, setMass] = useState(0)
  const [tapCount, setTapCount] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [hintEverShown, setHintEverShown] = useState(false)

  // Mock idle MPS accrual — 1 Hz tick adds MPS to mass.
  const mpsRef = useRef(0)
  mpsRef.current = computeMps(controls)
  useEffect(() => {
    const id = window.setInterval(() => {
      if (mpsRef.current > 0) setMass(m => m + mpsRef.current)
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  // ─── Tap handling ────────────────────────────────────────────────
  const downPosRef = useRef<{ x: number; y: number } | null>(null)
  const mpcRef = useRef(0)
  mpcRef.current = computeMpc(controls)

  const handleTap = useCallback((screenX: number, screenY: number) => {
    setMass(m => m + mpcRef.current)
    setTapCount(c => c + 1)
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
      if (dx * dx + dy * dy >= 25) return
      const target = e.target as HTMLElement | null
      if (!target) return
      if (target.closest('[data-ui]')) return
      if (!target.closest('canvas, .t2ui-tap-zone')) return
      handleTap(e.clientX, e.clientY)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [handleTap])

  // ─── Derived display values ──────────────────────────────────────
  const mps = computeMps(controls)
  const mpc = computeMpc(controls)
  const aps = computeAps(controls)
  const consolidationProgress = PRIOR_TIER_BUDGET + computeConsolidation(controls)
  const consolidationFill = Math.min(1.0, consolidationProgress / CUMULATIVE_BUDGET)

  // Any-card-affordable hint logic
  const canAffordAnything = T2_UPGRADES.some(u => {
    const lvl = levelOf(controls, u.key)
    if (lvl >= u.maxLevels) return false
    return mass >= nextCost(u, lvl)
  })
  const showUpgradeHint = canAffordAnything && !hintEverShown
  const breathingActive = tapCount >= ONBOARDING_TAP_THRESHOLD && !hintEverShown

  // ─── Buy interaction ─────────────────────────────────────────────
  const onCardClick = (spec: T2UpgradeSpec) => {
    const lvl = levelOf(controls, spec.key)
    if (lvl >= spec.maxLevels) return
    const cost = nextCost(spec, lvl)
    if (mass < cost) return
    setMass(m => m - cost)
    onBuy(spec.key)
  }

  return (
    <div className="t2ui-root" data-ui-root>
      <button
        className="t2ui-tap-zone"
        aria-label={CLICK_VERB.toLowerCase()}
      />

      {/* Top edge: Consolidation bar */}
      <div className="t2ui-consolidation">
        <div className="t2ui-consolidation-track" />
        <div
          className="t2ui-consolidation-fill"
          style={{ width: `${consolidationFill * 100}%` }}
        >
          <div className="t2ui-consolidation-glow" />
        </div>
      </div>

      {/* Top-left: Mass counter */}
      <div className="t2ui-mass">
        <div className="t2ui-mass-scrim" />
        <div className="t2ui-mass-text">{fmtMass(mass)}</div>
      </div>

      {/* Top-left below Mass: Stats line */}
      <div className="t2ui-stats">
        <span>{fmtRate(mps, '/s')}</span>
        <span className="sep">·</span>
        <span>{fmtRate(mpc, '/click')}</span>
        {aps > 0 && (
          <>
            <span className="sep">·</span>
            <span>{aps.toFixed(3)} AC/s</span>
          </>
        )}
      </div>

      {/* Top-right: Settings gear */}
      <button
        className="t2ui-settings"
        data-ui
        aria-label="settings"
        title="settings"
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M19.4 14.6a7.7 7.7 0 0 0 .07-1.2 7.7 7.7 0 0 0-.07-1.2l2.0-1.55a.5.5 0 0 0 .12-.62l-1.9-3.28a.5.5 0 0 0-.6-.22l-2.36.95a7.4 7.4 0 0 0-2.07-1.2l-.36-2.5a.5.5 0 0 0-.5-.43h-3.78a.5.5 0 0 0-.5.43l-.36 2.5a7.4 7.4 0 0 0-2.07 1.2l-2.36-.95a.5.5 0 0 0-.6.22l-1.9 3.28a.5.5 0 0 0 .12.62l2.0 1.55a7.7 7.7 0 0 0-.07 1.2 7.7 7.7 0 0 0 .07 1.2l-2.0 1.55a.5.5 0 0 0-.12.62l1.9 3.28a.5.5 0 0 0 .6.22l2.36-.95a7.4 7.4 0 0 0 2.07 1.2l.36 2.5a.5.5 0 0 0 .5.43h3.78a.5.5 0 0 0 .5-.43l.36-2.5a7.4 7.4 0 0 0 2.07-1.2l2.36.95a.5.5 0 0 0 .6-.22l1.9-3.28a.5.5 0 0 0-.12-.62z" />
        </svg>
        <span className="t2ui-settings-label">settings</span>
      </button>

      {/* Bottom-right: Causal Connections (unlabeled mystery number).
          STATIC throughout Act 1 per load-bearing rule — the number
          appears from minute one but does not tick until the first
          named-connection break (Act 2). */}
      <div className="t2ui-causal">
        <div className="t2ui-causal-scrim" />
        <div className="t2ui-causal-text">{fmtCausal(CAUSAL_NUMBER_STATIC)}</div>
      </div>

      {/* Bottom-center: Upgrade affordance */}
      <div className={`t2ui-upgrade ${breathingActive ? 'breathing' : ''}`}>
        <div className="t2ui-click-verb">{CLICK_VERB}</div>
        <div className="t2ui-upgrade-hairline" />
        <div className={`t2ui-upgrade-hint ${showUpgradeHint ? 'visible' : ''}`}>
          upgrades
        </div>
      </div>
      <button
        className="t2ui-upgrade-hit"
        data-ui
        aria-label="open upgrades"
        onClick={() => {
          setSheetOpen(true)
          setHintEverShown(true)
        }}
      />

      {/* Upgrade sheet — rises from the bottom on hairline tap */}
      <div className={`t2ui-sheet ${sheetOpen ? 'open' : ''}`} data-ui>
        <div className="t2ui-sheet-grid">
          {T2_UPGRADES.map(spec => {
            const lvl = levelOf(controls, spec.key)
            const maxed = lvl >= spec.maxLevels
            const owned = spec.kind === 'oneshot' && lvl > 0
            const cost = nextCost(spec, lvl)
            const affordable = !maxed && mass >= cost
            const classes = [
              't2ui-card',
              affordable ? 'affordable' : '',
              maxed && !owned ? 'maxed' : '',
              owned ? 'owned' : '',
            ].filter(Boolean).join(' ')
            return (
              <button
                key={spec.key}
                className={classes}
                disabled={maxed}
                onClick={() => onCardClick(spec)}
                aria-label={`Buy ${spec.name}`}
              >
                <div className="t2ui-card-name">{spec.name}</div>
                <div className="t2ui-card-desc">{spec.clinical}</div>
                <div className="t2ui-card-row">
                  <div className="t2ui-card-cost">
                    {owned ? 'Owned' : maxed ? 'Maxed' : fmtCost(cost)}
                  </div>
                  <div className="t2ui-card-level">
                    {spec.kind === 'oneshot'
                      ? (owned ? '' : '—')
                      : `L${lvl}${spec.maxLevels < 99 ? `/${spec.maxLevels}` : ''}`}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tap-outside-to-close scrim */}
      {sheetOpen && (
        <button
          data-ui
          className="t2ui-sheet-close-zone"
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
