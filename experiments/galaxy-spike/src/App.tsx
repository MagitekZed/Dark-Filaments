import { useEffect, useState } from 'react'
import { T1Scene } from './T1Scene'
import { T1UITestScene } from './T1UITestScene'
import { T2Scene } from './T2Scene'
import { T2UITestScene } from './T2UITestScene'
import { T5Scene } from './T5Scene'
import { T1ToT2Transition } from './T1ToT2Transition'

type Tier = 't1' | 't1ui' | 't2' | 't2ui' | 't5'

// Phase tracks the mount/unmount overlap so the destination Canvas is
// already rendering before the source Canvas tears down. Eliminates the
// black flash at the start and end of a transition.
//
// idle       → exactly one scene Canvas mounted
// starting   → T1Scene + Transition both mounted; Transition is on top.
//              After OVERLAP_MS, T1Scene unmounts.
// cinematic  → Transition Canvas alone, running the 10s pull-out.
// ending     → Transition + T2Scene both mounted; Transition is on top.
//              After OVERLAP_MS, Transition unmounts.
type Phase = 'idle' | 'starting' | 'cinematic' | 'ending'

// One animation frame at 60fps is ~16.67ms; we want a comfortable
// overlap that survives slower frames and the first-frame init cost
// of a freshly-mounted WebGL context.
const OVERLAP_MS = 300

const TIERS: Array<{ id: Tier; label: string }> = [
  { id: 't1', label: 'T1 — Solar System' },
  { id: 't1ui', label: 'T1 — UI Test' },
  { id: 't2', label: 'T2 — Stellar Neighborhood' },
  { id: 't2ui', label: 'T2 — UI Test' },
  { id: 't5', label: 'T5 — Galaxy' },
]

// Wrap each scene Canvas in a position:fixed div so multiple scenes can
// stack on top of each other during transition phases. Later-rendered
// wrappers naturally end up on top of earlier ones in the DOM.
const sceneLayerStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
}

export default function App() {
  const [tier, setTier] = useState<Tier>('t1')
  const [phase, setPhase] = useState<Phase>('idle')
  // resetCounter increments on every "Reset View" click. Each scene watches
  // it inside the Canvas tree and calls OrbitControls.reset() when it changes.
  const [resetCounter, setResetCounter] = useState(0)

  // Phase advancement timers — `starting` → `cinematic`, `ending` → `idle`
  useEffect(() => {
    if (phase === 'starting') {
      const tid = setTimeout(() => setPhase('cinematic'), OVERLAP_MS)
      return () => clearTimeout(tid)
    }
    if (phase === 'ending') {
      const tid = setTimeout(() => setPhase('idle'), OVERLAP_MS)
      return () => clearTimeout(tid)
    }
  }, [phase])

  const beginTransition = () => {
    setPhase('starting')
  }

  const handleTransitionComplete = () => {
    // Mount T2Scene NOW so it's rendering underneath the transition;
    // transition Canvas unmounts after OVERLAP_MS and reveals T2.
    setTier('t2')
    setPhase('ending')
  }

  const handleTabClick = (id: Tier) => {
    if (phase !== 'idle') {
      // Cancel — abort the cinematic, snap to the target tab.
      setPhase('idle')
    }
    setTier(id)
  }

  // What's mounted right now:
  const showT1Scene =
    (tier === 't1' && phase === 'idle') ||
    phase === 'starting'
  const showT1UIScene =
    tier === 't1ui' && phase === 'idle'
  const showT2Scene =
    (tier === 't2' && phase === 'idle') ||
    phase === 'ending'
  const showT2UIScene =
    tier === 't2ui' && phase === 'idle'
  const showT5Scene =
    tier === 't5' && phase === 'idle'
  const showTransition =
    phase === 'starting' || phase === 'cinematic' || phase === 'ending'

  const showTransitionButton = tier === 't1' && phase === 'idle'

  // Auto-hide the top dev nav (tabs + camera controls) on shipped-look
  // tabs so we can eyeball the chrome without the dev UI competing.
  // Currently scoped to T2 — UI Test; expand to other UI-Test tabs as
  // their chromes ship.
  const autoHideTopNav = tier === 't2ui'
  const topNavHiddenClass = autoHideTopNav ? ' auto-hidden' : ''

  return (
    <>
      {autoHideTopNav && <div className="top-hover-zone" aria-hidden />}
      <div className={`spike-tabs${topNavHiddenClass}`}>
        {TIERS.map(t => (
          <button
            key={t.id}
            className={tier === t.id ? 'active' : ''}
            onClick={() => handleTabClick(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={`spike-camera-controls${topNavHiddenClass}`}>
        <button
          className="reset"
          onClick={() => setResetCounter(c => c + 1)}
          disabled={phase !== 'idle'}
          title="Snap camera back to the default view"
        >
          Reset view
        </button>
        {showTransitionButton && (
          <button
            className="transition"
            onClick={beginTransition}
            title="Play the T1 → T2 pull-out cinematic"
          >
            Transition to T2
          </button>
        )}
        <div className="hint">drag to rotate · right-drag to pan · scroll to zoom</div>
      </div>

      {/* Each scene Canvas in its own fixed-position wrapper so they can
          overlap during transition phases. DOM order = stack order. */}
      {showT1Scene && (
        <div style={sceneLayerStyle}>
          <T1Scene resetVersion={resetCounter} />
        </div>
      )}
      {showT1UIScene && (
        <div style={sceneLayerStyle}>
          <T1UITestScene resetVersion={resetCounter} />
        </div>
      )}
      {showT2Scene && (
        <div style={sceneLayerStyle}>
          <T2Scene resetVersion={resetCounter} />
        </div>
      )}
      {showT2UIScene && (
        <div style={sceneLayerStyle}>
          <T2UITestScene resetVersion={resetCounter} />
        </div>
      )}
      {showT5Scene && (
        <div style={sceneLayerStyle}>
          <T5Scene resetVersion={resetCounter} />
        </div>
      )}
      {/* Transition rendered LAST so its Canvas is on top of any scene
          Canvas mounted underneath it during 'starting'/'ending'. */}
      {showTransition && (
        <div style={sceneLayerStyle}>
          <T1ToT2Transition onComplete={handleTransitionComplete} />
        </div>
      )}
    </>
  )
}
