// G3: boot the engine through the persistence path (store/persistence.ts) once
// at app mount — restore from a v5 localStorage save with the patient-universe
// offline accrual, or start a fresh universe. boot() is idempotent (guards the
// StrictMode double-mount), so the bare module-level call is safe; we keep it in
// an effect so it runs after the first render commit.
//
// The throwaway debug readout proves the loop end-to-end before any real UI
// exists. The title vs running-game route gate (plan §3) and the real chrome
// land in G4/G5; DebugReadout is removed then.
import { useEffect } from 'react'
import DebugReadout from './DebugReadout'
import { boot } from './store/persistence'

export default function App() {
  useEffect(() => {
    // Idempotent: under StrictMode this effect fires twice in dev, but boot()
    // no-ops on the second call (the `booted` guard), so the worker is INITed
    // exactly once.
    boot()
  }, [])

  return <DebugReadout />
}
