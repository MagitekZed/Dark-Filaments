import { useMemo } from 'react'
import * as THREE from 'three'
import { discTexture } from './discTexture'

const COUNT = 2500
const INNER = 30
const OUTER = 60

export function Starfield() {
  const texture = useMemo(() => discTexture(), [])

  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      // rejection-sample a uniform direction on the unit sphere, then push to a random shell radius
      let x = 0, y = 0, z = 0, len = 0
      do {
        x = Math.random() * 2 - 1
        y = Math.random() * 2 - 1
        z = Math.random() * 2 - 1
        len = Math.sqrt(x * x + y * y + z * z)
      } while (len === 0 || len > 1)
      const r = INNER + Math.random() * (OUTER - INNER)
      arr[i * 3]     = (x / len) * r
      arr[i * 3 + 1] = (y / len) * r
      arr[i * 3 + 2] = (z / len) * r
    }
    return arr
  }, [])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.9}
        sizeAttenuation={false}
        color={'#9fb0d0'}
        map={texture}
        alphaMap={texture}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        transparent
        opacity={0.5}
      />
    </points>
  )
}
