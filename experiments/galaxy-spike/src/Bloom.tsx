import { useEffect, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import * as THREE from 'three'

interface BloomProps {
  strength?: number  // bloom intensity multiplier
  radius?: number    // bloom radius (softness)
  threshold?: number // luminance threshold — pixels brighter than this bloom
}

// Direct UnrealBloomPass wrapper — bypasses @react-three/postprocessing
// (which is currently incompatible with R3F 9 + React 19).
//
// Uses useFrame with priority > 0 to take over rendering from R3F's default
// render loop. Returns null since it has no visual element of its own.
export function Bloom({
  strength = 0.45,
  radius = 0.6,
  threshold = 0.45,
}: BloomProps) {
  const { gl, scene, camera, size } = useThree()

  const { composer, bloomPass } = useMemo(() => {
    const c = new EffectComposer(gl)
    c.addPass(new RenderPass(scene, camera))
    const bp = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      strength,
      radius,
      threshold,
    )
    c.addPass(bp)
    c.addPass(new OutputPass())
    return { composer: c, bloomPass: bp }
    // strength/radius/threshold are mutated live via the useEffect below.
    // Do NOT add them as deps here — rebuilding the composer on every tween
    // tick would tear down the render pipeline mid-frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera])

  useEffect(() => {
    composer.setSize(size.width, size.height)
  }, [composer, size])

  useEffect(() => {
    bloomPass.strength = strength
    bloomPass.radius = radius
    bloomPass.threshold = threshold
  }, [bloomPass, strength, radius, threshold])

  useFrame(() => {
    composer.render()
  }, 1)

  return null
}
