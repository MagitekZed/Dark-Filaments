import { useEffect, useState } from 'react'
import { T1Scene } from './T1Scene'
import { T1UITestScene } from './T1UITestScene'
import { T2Scene } from './T2Scene'
import { T2UITestScene } from './T2UITestScene'
import { T5Scene } from './T5Scene'
import { T1ToT2Transition } from './T1ToT2Transition'
import { MainScene, type MainScenePhase } from './MainScene'
import { TitleChrome } from './TitleChrome'
import { T1UIChrome } from './T1UIChrome'

type Tier = 'title' | 't1' | 't1ui' | 't2' | 't2ui' | 't5'

// Title → T1UI smooth-transition durations. TitleChrome elements fade
// out as T1UIChrome fades in and MainScene's extras spawn. The
// transition does NOT route through a black frame — the Canvas stays
// mounted with planets, sun, and prominence cycle all preserved.
const TITLE_CHROME_FADEOUT_MS = 900
const T1UI_CHROME_FADEIN_MS = 1100

// Phase tracks the mount/unmount overlap so the destination Canvas is
// already rendering before the source Canvas tears down. Eliminates the
// black flash at the start and end of a T1→T2 transition.
//
// idle       → exactly one scene Canvas mounted
// starting   → T1Scene + Transition both mounted; Transition is on top.
//              After OVERLAP_MS, T1Scene unmounts.
// cinematic  → Transition Canvas alone, running the 10s pull-out.
// ending     → Transition + T2Scene both mounted; Transition is on top.
//              After OVERLAP_MS, Transition unmounts.
type Phase = 'idle' | 'starting' | 'cinematic' | 'ending'

const OVERLAP_MS = 300

const TIERS: Array<{ id: Tier; label: string }> = [
  { id: 'title', label: 'Title — Landing' },
  { id: 't1', label: 'T1 — Solar System' },
  { id: 't1ui', label: 'T1 — UI Test' },
  { id: 't2', label: 'T2 — Stellar Neighborhood' },
  { id: 't2ui', label: 'T2 — UI Test' },
  { id: 't5', label: 'T5 — Galaxy' },
]

const sceneLayerStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
}

export default function App() {
  const [tier, setTier] = useState<Tier>('title')
  const [phase, setPhase] = useState<Phase>('idle')
  const [resetCounter, setResetCounter] = useState(0)

  // Title-tier sub-state. The title tier renders MainScene; titleScenePhase
  // controls whether MainScene shows the contemplative title baseline or
  // the full T1UI content (extras fading in). titleTransitionStartMs is a
  // wall-clock timestamp MainScene uses to drive its internal opacity
  // tween and camera-drift decay.
  const [titleScenePhase, setTitleScenePhase] = useState<MainScenePhase>('title')
  const [titleTransitionStartMs, setTitleTransitionStartMs] = useState<number | null>(null)
  // Whether TitleChrome is still in the DOM. Stays mounted while it fades
  // out; unmounts after TITLE_CHROME_FADEOUT_MS so it doesn't intercept
  // taps once T1UIChrome takes over.
  const [titleChromeMounted, setTitleChromeMounted] = useState(true)
  // Trigger TitleChrome's chrome-elements fade-out.
  const [titleChromeFadingOut, setTitleChromeFadingOut] = useState(false)
  // Whether T1UIChrome is mounted (in the title-tier context).
  const [t1uiChromeMounted, setT1uiChromeMounted] = useState(false)
  // Drives the CSS opacity transition on the T1UIChrome wrapper. Set
  // after a two-rAF delay following mount so the browser has a 0 → 1
  // change to animate (a same-tick mount-at-1 would skip the transition).
  const [t1uiChromeFadingIn, setT1uiChromeFadingIn] = useState(false)

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
    setTier('t2')
    setPhase('ending')
  }

  // Reset title sub-state to fresh pre-Begin landing. Used on tab changes
  // away from title (so re-entering title is fresh) and on initial mount.
  const resetTitleSubState = () => {
    setTitleScenePhase('title')
    setTitleTransitionStartMs(null)
    setTitleChromeMounted(true)
    setTitleChromeFadingOut(false)
    setT1uiChromeMounted(false)
    setT1uiChromeFadingIn(false)
  }

  const handleTabClick = (id: Tier) => {
    if (phase !== 'idle') {
      setPhase('idle')
    }
    // Always reset the title sub-state on tab navigation; if we're entering
    // title from elsewhere, the user expects the fresh pre-Begin landing,
    // and if we're leaving title (whether pre- or post-Begin), we don't
    // want stale sub-state lingering.
    resetTitleSubState()
    setTier(id)
  }

  const handleTitleBegin = () => {
    if (titleScenePhase !== 'title') return // ignore double-clicks
    const now = performance.now()
    setTitleScenePhase('t1ui')
    setTitleTransitionStartMs(now)
    setTitleChromeFadingOut(true)
    setT1uiChromeMounted(true)
    // Wait two animation frames before flipping the fade-in flag so the
    // browser actually animates the 0 → 1 opacity change rather than
    // jumping to 1 on first paint.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setT1uiChromeFadingIn(true))
    })
    // TitleChrome's chrome elements fade out via its own CSS. After the
    // fade completes, unmount TitleChrome entirely so it doesn't intercept
    // pointer events.
    window.setTimeout(() => {
      setTitleChromeMounted(false)
    }, TITLE_CHROME_FADEOUT_MS)
  }

  // What's mounted right now:
  const showTitleTier = tier === 'title' && phase === 'idle'
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

  // Auto-hide dev nav on shipped-look tabs (title + T2 UI Test).
  const autoHideTopNav = tier === 't2ui' || tier === 'title'
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

      {/* Title tier — MainScene canvas + crossfading chromes. The Canvas
          stays mounted across the Title → T1UI transition (no remount),
          preserving the solar system's animation state. */}
      {showTitleTier && (
        <div style={sceneLayerStyle}>
          <MainScene
            phase={titleScenePhase}
            transitionStartMs={titleTransitionStartMs}
            resetVersion={resetCounter}
          />
          {titleChromeMounted && (
            <TitleChrome onBegin={handleTitleBegin} fadingOut={titleChromeFadingOut} />
          )}
          {t1uiChromeMounted && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: t1uiChromeFadingIn ? 1 : 0,
                transition: `opacity ${T1UI_CHROME_FADEIN_MS}ms ease-out`,
                pointerEvents: t1uiChromeFadingIn ? 'auto' : 'none',
              }}
            >
              <T1UIChrome />
            </div>
          )}
        </div>
      )}
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
      {showTransition && (
        <div style={sceneLayerStyle}>
          <T1ToT2Transition onComplete={handleTransitionComplete} />
        </div>
      )}
    </>
  )
}
