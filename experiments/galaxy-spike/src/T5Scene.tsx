import { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Galaxy } from './Galaxy'
import { Starfield } from './Starfield'
import { DeepStarfield } from './DeepStarfield'
import { BackgroundGalaxies } from './BackgroundGalaxies'
import { ForegroundStars } from './ForegroundStars'
import { TwinklingStars } from './TwinklingStars'
import { Bloom } from './Bloom'
import { BlackHole } from './BlackHole'
import { BlackHoleAccretionDisc } from './BlackHoleAccretionDisc'
import { BlackHoleJets } from './BlackHoleJets'
import { BlackHoleLensing } from './BlackHoleLensing'
import { BlackHoleInfall } from './BlackHoleInfall'

type OrbitControlsImpl = { reset: () => void }

interface T5SceneProps {
  resetVersion?: number
}

function CameraResetWatcher({
  version,
  controlsRef,
}: {
  version: number
  controlsRef: React.RefObject<OrbitControlsImpl | null>
}) {
  useEffect(() => {
    if (version > 0) controlsRef.current?.reset()
  }, [version, controlsRef])
  return null
}

// T5 — Galaxy scene.
// This is the original galaxy-spike scene, extracted from App.tsx so the
// app shell can host multiple per-tier scenes side by side.
export function T5Scene({ resetVersion = 0 }: T5SceneProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  return (
    <Canvas camera={{ position: [3.0, 2.2, 4.8], fov: 55 }}>
      <color attach="background" args={['#000']} />
      <DeepStarfield />
      <BackgroundGalaxies />
      <Starfield />
      <ForegroundStars />
      <TwinklingStars />
      {/* tilt the galaxy so we view it 3/4 from above */}
      <group rotation={[-0.45, 0, 0.18]}>
        <Galaxy />
        <BlackHole />
        <BlackHoleAccretionDisc />
        <BlackHoleInfall />
        <BlackHoleLensing />
        <BlackHoleJets />
      </group>
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        enablePan
      />
      <CameraResetWatcher version={resetVersion} controlsRef={controlsRef} />
      <Bloom strength={0.45} radius={0.6} threshold={0.45} />
    </Canvas>
  )
}
