import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { discTexture } from './discTexture'

// Distant field of small galaxies + three "named" closer galaxies that
// have actual structure (small spiral, elliptical, edge-on disc).
//
// Everything renders as one points group → one draw call. The wrapping
// <group> drifts slowly counter to the foreground-stars layer, giving
// the layered field a sense of depth when the camera is held still.

const NUM_FIELD = 32
const SHELL_INNER = 70
const SHELL_OUTER = 150

const TINTS: Array<[string, string]> = [
  ['#fff0d6', '#ffaa70'],
  ['#ffe8c0', '#ff8060'],
  ['#ffd0a0', '#cc6040'],
  ['#fff5e0', '#ffc890'],
  ['#e8e8ff', '#aab0d0'],
  ['#ffe8d8', '#ff8090'],
  ['#ffe4d0', '#aa7050'],
  ['#fff5e0', '#d8a070'],
  ['#ffd8c0', '#c06848'],
]

type Sample = { x: number; y: number; z: number; r: number; g: number; b: number }

// --- generators for the named close galaxies -----------------------------

function genSmallSpiral(
  cx: number, cy: number, cz: number,
  radius: number,
  quat: THREE.Quaternion,
  inner: THREE.Color,
  outer: THREE.Color,
  brightness: number,
): Sample[] {
  const out: Sample[] = []
  const localPos = new THREE.Vector3()
  const color = new THREE.Color()
  const branches = 2
  const spin = 1.1
  // bulge — concentrated core
  const bulgeN = 240
  for (let i = 0; i < bulgeN; i++) {
    const r = Math.pow(Math.random(), 2.5) * radius * 0.35
    const phi = Math.random() * Math.PI * 2
    const cosTh = (Math.random() * 2 - 1)
    const sinTh = Math.sqrt(1 - cosTh * cosTh)
    localPos.set(
      r * sinTh * Math.cos(phi),
      r * cosTh * 0.4,
      r * sinTh * Math.sin(phi),
    )
    localPos.applyQuaternion(quat)
    color.copy(inner)
    out.push({
      x: cx + localPos.x, y: cy + localPos.y, z: cz + localPos.z,
      r: color.r * brightness, g: color.g * brightness, b: color.b * brightness,
    })
  }
  // arms
  const armN = 380
  for (let i = 0; i < armN; i++) {
    const branchIdx = i % branches
    const tRaw = Math.pow(Math.random(), 0.85)
    const r = radius * 0.3 + tRaw * radius * 0.7
    const spinAngle = r * spin
    const baseAngle = branchIdx * Math.PI
    const phase = baseAngle + spinAngle + (Math.random() - 0.5) * 0.15
    const width = 0.12 * r
    const perp = (Math.random() * 2 - 1) * width
    const cosP = Math.cos(phase), sinP = Math.sin(phase)
    const x = cosP * r + cosP * perp
    const z = sinP * r + sinP * perp
    const y = (Math.random() * 2 - 1) * width * 0.25
    localPos.set(x, y, z)
    localPos.applyQuaternion(quat)
    color.copy(inner).lerp(outer, tRaw)
    out.push({
      x: cx + localPos.x, y: cy + localPos.y, z: cz + localPos.z,
      r: color.r * brightness, g: color.g * brightness, b: color.b * brightness,
    })
  }
  return out
}

function genElliptical(
  cx: number, cy: number, cz: number,
  radius: number,
  quat: THREE.Quaternion,
  inner: THREE.Color,
  outer: THREE.Color,
  brightness: number,
): Sample[] {
  const out: Sample[] = []
  const localPos = new THREE.Vector3()
  const color = new THREE.Color()
  const n = 580
  // elongation ratios — slightly squashed sphere
  const a = 1.0, b = 0.78, c = 0.55
  for (let i = 0; i < n; i++) {
    const rN = Math.pow(Math.random(), 2.3)
    const phi = Math.random() * Math.PI * 2
    const cosTh = (Math.random() * 2 - 1)
    const sinTh = Math.sqrt(1 - cosTh * cosTh)
    localPos.set(
      rN * sinTh * Math.cos(phi) * radius * a,
      rN * cosTh * radius * c,
      rN * sinTh * Math.sin(phi) * radius * b,
    )
    localPos.applyQuaternion(quat)
    color.copy(inner).lerp(outer, rN)
    out.push({
      x: cx + localPos.x, y: cy + localPos.y, z: cz + localPos.z,
      r: color.r * brightness, g: color.g * brightness, b: color.b * brightness,
    })
  }
  return out
}

function genEdgeOnDisc(
  cx: number, cy: number, cz: number,
  length: number,
  quat: THREE.Quaternion,
  inner: THREE.Color,
  outer: THREE.Color,
  brightness: number,
): Sample[] {
  const out: Sample[] = []
  const localPos = new THREE.Vector3()
  const color = new THREE.Color()
  const n = 420
  for (let i = 0; i < n; i++) {
    // distribute along x (the long axis) with central density bias
    const xSign = Math.random() < 0.5 ? -1 : 1
    const xT = Math.pow(Math.random(), 0.65)
    const x = xSign * xT * length
    // thin in y, slightly less thin in z (disc edge-on)
    const y = (Math.random() * 2 - 1) * length * 0.05 * Math.pow(Math.random(), 0.5)
    const z = (Math.random() * 2 - 1) * length * 0.12 * Math.pow(Math.random(), 0.5)
    localPos.set(x, y, z)
    localPos.applyQuaternion(quat)
    color.copy(inner).lerp(outer, xT)
    out.push({
      x: cx + localPos.x, y: cy + localPos.y, z: cz + localPos.z,
      r: color.r * brightness, g: color.g * brightness, b: color.b * brightness,
    })
  }
  return out
}

// --- main component ------------------------------------------------------

export function BackgroundGalaxies() {
  const groupRef = useRef<THREE.Group>(null)
  const texture = useMemo(() => discTexture(), [])

  const { positions, colors } = useMemo(() => {
    const samples: Sample[] = []
    const inner = new THREE.Color()
    const outer = new THREE.Color()
    const quat = new THREE.Quaternion()
    const euler = new THREE.Euler()
    const color = new THREE.Color()
    const localPos = new THREE.Vector3()

    // --- named close galaxies ---
    // 1. small spiral, distance ~26, tilted ~55°
    inner.set('#ffeacb'); outer.set('#ff9070')
    euler.set(Math.PI * 0.32, Math.PI * 0.18, Math.PI * 0.05)
    quat.setFromEuler(euler)
    samples.push(...genSmallSpiral(-22, 9, -14, 2.6, quat, inner, outer, 0.75))

    // 2. clean elliptical, distance ~38
    inner.set('#fff2da'); outer.set('#d68e58')
    euler.set(0.4, 0.7, 0.2)
    quat.setFromEuler(euler)
    samples.push(...genElliptical(34, -6, -18, 2.0, quat, inner, outer, 0.70))

    // 3. edge-on disc, distance ~32
    inner.set('#ffe6d4'); outer.set('#c08070')
    euler.set(0.08, 1.1, -0.25)
    quat.setFromEuler(euler)
    samples.push(...genEdgeOnDisc(8, -22, 30, 3.4, quat, inner, outer, 0.65))

    // --- distant field of tiny galaxies ---
    for (let g = 0; g < NUM_FIELD; g++) {
      let dx = 0, dy = 0, dz = 0, dlen = 0
      do {
        dx = Math.random() * 2 - 1
        dy = Math.random() * 2 - 1
        dz = Math.random() * 2 - 1
        dlen = Math.sqrt(dx * dx + dy * dy + dz * dz)
      } while (dlen === 0 || dlen > 1)
      const dist = SHELL_INNER + Math.random() * (SHELL_OUTER - SHELL_INNER)
      const cx = (dx / dlen) * dist
      const cy = (dy / dlen) * dist
      const cz = (dz / dlen) * dist

      euler.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      )
      quat.setFromEuler(euler)

      const [iHex, oHex] = TINTS[Math.floor(Math.random() * TINTS.length)]
      inner.set(iHex)
      outer.set(oHex)

      const angularRadius = 0.8 + Math.random() * 2.2
      const flatten = 0.15 + Math.random() * 0.35
      const overallBrightness = 0.45 + Math.random() * 0.55

      const n = 35 + Math.floor(Math.random() * 80)
      for (let i = 0; i < n; i++) {
        const r = Math.pow(Math.random(), 1.4) * angularRadius
        const phi = Math.random() * Math.PI * 2
        localPos.set(
          r * Math.cos(phi),
          (Math.random() - 0.5) * angularRadius * flatten * 0.6,
          r * Math.sin(phi),
        )
        localPos.applyQuaternion(quat)
        color.copy(inner).lerp(outer, r / angularRadius)
        samples.push({
          x: cx + localPos.x, y: cy + localPos.y, z: cz + localPos.z,
          r: color.r * overallBrightness,
          g: color.g * overallBrightness,
          b: color.b * overallBrightness,
        })
      }
    }

    const positions = new Float32Array(samples.length * 3)
    const colors = new Float32Array(samples.length * 3)
    for (let i = 0; i < samples.length; i++) {
      positions[i * 3]     = samples[i].x
      positions[i * 3 + 1] = samples[i].y
      positions[i * 3 + 2] = samples[i].z
      colors[i * 3]     = samples[i].r
      colors[i * 3 + 1] = samples[i].g
      colors[i * 3 + 2] = samples[i].b
    }
    return { positions, colors }
  }, [])

  // slow drift in the opposite sense from ForegroundStars — parallax cue
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.0018
  })

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color"    args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={1.7}
          sizeAttenuation={false}
          vertexColors
          map={texture}
          alphaMap={texture}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.75}
        />
      </points>
    </group>
  )
}
