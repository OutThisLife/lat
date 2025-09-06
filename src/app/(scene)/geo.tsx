import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'

export default function Geo({
  petalAmp = 0.35,
  petalSegments = 360,
  petalWidth = 0.02,
  petals = 6,
  phaseRef
}: GeoProps) {
  return (
    <FlowerBand
      amplitude={petalAmp}
      baseRadius={0.5}
      petals={petals}
      phaseDeg={0}
      phaseRef={phaseRef}
      segments={Math.max(32, Math.floor(petalSegments))}
      width={petalWidth}
    />
  )
}

function createFlowerBandGeometry({
  amplitude = 0.3,
  baseRadius = 0.5,
  petals = 6,
  phaseDeg = 0,
  segments = 360,
  width = 0.02
}: FlowerParams) {
  const vertexCount = (segments + 1) * 2
  const positions = new Float32Array(vertexCount * 3)
  const normals = new Float32Array(vertexCount * 3)
  const uvs = new Float32Array(vertexCount * 2)
  const indices = new Uint32Array(segments * 6)

  const phase = (phaseDeg * Math.PI) / 180
  const invRes = 1 / Math.max(segments, 1)

  for (let i = 0; i <= segments; i++) {
    const t = i * invRes
    const theta = t * Math.PI * 2
    const r = baseRadius * (1 + amplitude * Math.sin(petals * theta + phase))
    const inner = Math.max(0.0005, r - width)

    const cos = Math.cos(theta)
    const sin = Math.sin(theta)

    const ox = r * cos
    const oy = r * sin
    const ix = inner * cos
    const iy = inner * sin

    const oIndex = i * 2
    const iIndex = oIndex + 1

    // outer
    positions[oIndex * 3 + 0] = ox
    positions[oIndex * 3 + 1] = oy
    positions[oIndex * 3 + 2] = 0
    normals[oIndex * 3 + 2] = 1
    uvs[oIndex * 2 + 0] = t
    uvs[oIndex * 2 + 1] = 1

    // inner
    positions[iIndex * 3 + 0] = ix
    positions[iIndex * 3 + 1] = iy
    positions[iIndex * 3 + 2] = 0
    normals[iIndex * 3 + 2] = 1
    uvs[iIndex * 2 + 0] = t
    uvs[iIndex * 2 + 1] = 0
  }

  let idx = 0

  for (let i = 0; i < segments; i++) {
    const a = i * 2
    const b = a + 1
    const c = ((i + 1) * 2) % vertexCount
    const d = (c + 1) % vertexCount

    // tri1
    indices[idx++] = a
    indices[idx++] = b
    indices[idx++] = c

    // tri2
    indices[idx++] = b
    indices[idx++] = d
    indices[idx++] = c
  }

  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geom.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geom.setIndex(new THREE.BufferAttribute(indices, 1))
  geom.computeBoundingBox()
  geom.computeBoundingSphere()

  return geom
}

interface FlowerParams {
  amplitude?: number
  baseRadius?: number
  phaseDeg?: number
  petals?: number
  segments?: number
  width?: number
}

interface GeoProps {
  petalAmp?: number
  petalSegments?: number
  petalWidth?: number
  petals?: number
  phaseRef?: { current: { phase: number; gradientRot: number } }
}

function FlowerBand({
  amplitude = 0.3,
  baseRadius = 0.5,
  petals = 6,
  phaseDeg = 0,
  phaseRef,
  segments = 360,
  width = 0.02
}: FlowerParams & { phaseRef?: { current: { phase: number; gradientRot: number } } }) {
  const { geom, positions } = useMemo(() => {
    const g = createFlowerBandGeometry({
      amplitude,
      baseRadius,
      petals,
      phaseDeg,
      segments,
      width
    })

    return {
      geom: g,
      positions: g.getAttribute('position') as THREE.BufferAttribute
    }
  }, [amplitude, baseRadius, petals, phaseDeg, segments, width])

  useFrame(() => {
    const p = phaseRef?.current?.phase ?? phaseDeg
    updateFlowerPositions(positions, {
      amplitude,
      baseRadius,
      petals,
      phaseDeg: p,
      segments,
      width
    })
  })

  return <primitive object={geom} />
}

function updateFlowerPositions(
  positions: THREE.BufferAttribute,
  {
    amplitude,
    baseRadius,
    petals,
    phaseDeg,
    segments,
    width
  }: Required<FlowerParams>
) {
  const phase = (phaseDeg * Math.PI) / 180
  const invRes = 1 / Math.max(segments, 1)

  for (let i = 0; i <= segments; i++) {
    const t = i * invRes
    const theta = t * Math.PI * 2
    const r = baseRadius * (1 + amplitude * Math.sin(petals * theta + phase))
    const inner = Math.max(0.0005, r - width)

    const cos = Math.cos(theta)
    const sin = Math.sin(theta)

    const ox = r * cos
    const oy = r * sin
    const ix = inner * cos
    const iy = inner * sin

    const oIndex = i * 2
    const iIndex = oIndex + 1

    positions.setXYZ(oIndex, ox, oy, 0)
    positions.setXYZ(iIndex, ix, iy, 0)
  }

  positions.needsUpdate = true
}
