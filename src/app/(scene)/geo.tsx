import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'

export default function Geo({
  configRef,
  phaseRef
}: {
  configRef: React.RefObject<any>
  phaseRef: React.RefObject<{ phase: number; gradientRot: number }>
}) {
  const cfg = configRef.current

  return (
    <FlowerBand
      configRef={configRef}
      phaseRef={phaseRef}
      baseRadius={0.5}
      segments={Math.max(32, Math.floor(cfg.petalSegments))}
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

function FlowerBand({
  baseRadius = 0.5,
  configRef,
  phaseRef,
  segments = 360
}: {
  baseRadius?: number
  configRef: React.RefObject<any>
  phaseRef?: React.RefObject<{ phase: number; gradientRot: number }>
  segments?: number
}) {
  const MAX_SEGMENTS = 512

  const trig = useMemo(() => {
    const cosTable = new Float32Array(MAX_SEGMENTS + 1)
    const sinTable = new Float32Array(MAX_SEGMENTS + 1)
    const twoPi = Math.PI * 2

    for (let i = 0; i <= MAX_SEGMENTS; i++) {
      const t = i / MAX_SEGMENTS
      const theta = t * twoPi
      cosTable[i] = Math.cos(theta)
      sinTable[i] = Math.sin(theta)
    }

    return { cosTable, sinTable }
  }, [])

  const { geom, positions } = useMemo(() => {
    // Create with max segments to avoid recreation
    const g = createFlowerBandGeometry({
      amplitude: 0.5,
      baseRadius,
      petals: 6,
      phaseDeg: 0,
      segments: MAX_SEGMENTS,
      width: 0.05
    })

    const pos = g.getAttribute('position') as THREE.BufferAttribute
    pos.setUsage(THREE.DynamicDrawUsage)

    return { geom: g, positions: pos }
  }, [baseRadius])

  useFrame(() => {
    const cfg = configRef.current

    if (!cfg) return
    const p = phaseRef?.current?.phase ?? 0

    // Update positions with current config (fast path)
    updateFlowerPositionsFast(positions, trig.cosTable, trig.sinTable, {
      amplitude: cfg.petalAmp,
      baseRadius,
      petals: Math.max(1, cfg.petals),
      phaseDeg: p,
      segments: MAX_SEGMENTS,
      width: cfg.petalWidth
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

function updateFlowerPositionsFast(
  positions: THREE.BufferAttribute,
  cosTable: Float32Array,
  sinTable: Float32Array,
  {
    amplitude,
    baseRadius,
    petals,
    phaseDeg,
    segments,
    width
  }: Required<FlowerParams>
) {
  const array = positions.array as Float32Array
  const phase = (phaseDeg * Math.PI) / 180
  const invRes = 1 / Math.max(segments, 1)

  for (let i = 0; i <= segments; i++) {
    const t = i * invRes
    const thetaIdx = Math.round(t * segments)
    const cos = cosTable[thetaIdx]
    const sin = sinTable[thetaIdx]

    const r =
      baseRadius *
      (1 + amplitude * Math.sin(petals * (t * Math.PI * 2) + phase))

    const inner = Math.max(0.0005, r - width)

    const ox = r * cos
    const oy = r * sin
    const ix = inner * cos
    const iy = inner * sin

    const oIndex = i * 2 * 3
    const iIndex = oIndex + 3

    array[oIndex + 0] = ox
    array[oIndex + 1] = oy
    array[oIndex + 2] = 0

    array[iIndex + 0] = ix
    array[iIndex + 1] = iy
    array[iIndex + 2] = 0
  }

  positions.needsUpdate = true
}
