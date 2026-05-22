// G2: the throwaway debug readout proves the Worker + store + optimistic-click
// loop end-to-end before any real UI exists. The title vs running-game route
// gate (plan §3) and the real chrome land in G4/G5; DebugReadout is removed
// then.
import DebugReadout from './DebugReadout'

export default function App() {
  return <DebugReadout />
}
