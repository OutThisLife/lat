'use client'

import './material'

import {
  Center,
  Environment,
  Instance,
  Instances,
  OrbitControls,
  Stats
} from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { folder, useControls } from 'leva'
import { Suspense, useRef } from 'react'
import * as THREE from 'three'

import { FX as Effects } from './effects'
import Geo from './geo'
import { NoiseModulator } from './presets'

function FlowerInstances({
  animRef,
  configRef
}: {
  animRef: React.RefObject<{ phase: number; gradientRot: number }>
  configRef: React.RefObject<any>
}) {
  const materialRef = useRef<any>(null)
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const tempMatrix = useRef(new THREE.Matrix4()).current
  const tempEuler = useRef(new THREE.Euler()).current
  const tempQuat = useRef(new THREE.Quaternion()).current
  const tempScale = useRef(new THREE.Vector3()).current
  const tempPos = useRef(new THREE.Vector3(0, 0, 0)).current

  useFrame(() => {
    const cfg = configRef.current

    // Update material
    if (materialRef.current) {
      materialRef.current.gradientRotation = animRef.current!.gradientRot
      materialRef.current.fadeAlpha = cfg.fadeAlpha
      materialRef.current.fadeWidth = cfg.fadeWidth
      materialRef.current.metalness = cfg.metalness
      materialRef.current.opacity = cfg.opacity
      materialRef.current.roughness = cfg.roughness
    }

    // Update instance transforms efficiently (no popping)
    const mesh = meshRef.current

    if (mesh) {
      const count = Math.max(1, Math.min(50, Math.floor(cfg.instanceCount)))
      const safeRot = Math.abs(cfg.rot) < 0.001 ? 0.001 : cfg.rot
      mesh.count = 50

      for (let i = 0; i < 50; i++) {
        const active = i < count
        const rot = (i * Math.PI) / safeRot
        const s = active ? 1 - (i / count) * cfg.scale : 0
        tempEuler.set(0, 0, rot)
        tempQuat.setFromEuler(tempEuler)
        tempScale.set(s, s, s)
        tempMatrix.compose(tempPos, tempQuat, tempScale)
        mesh.setMatrixAt(i, tempMatrix)
      }

      mesh.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <>
      <Instances ref={meshRef as any} range={50}>
        <Geo configRef={configRef} phaseRef={animRef} />

        {/* @ts-expect-error - custom mat */}
        <gradientMaterial
          ref={materialRef}
          blending={THREE.NormalBlending}
          transparent
          side={THREE.DoubleSide}
        />

        {Array.from({ length: 50 }).map((_, i) => (
          <Instance key={i} />
        ))}
      </Instances>
    </>
  )
}

function Scene() {
  const modulator = useRef(new NoiseModulator())
  const configRef = useRef(modulator.current.getCurrent())
  const animRef = useRef({ gradientRot: 0, phase: 0 })

  const {
    metalnessCtl,
    opacity,
    rotCtl,
    roughnessCtl,
    scaleCtl,
    speed,
    ...ranges
  } = useControls('controls', {
    metalnessCtl: { max: 1, min: 0, step: 0.001, value: 0.27 },
    // static controls
    opacity: { max: 0.3, min: 0.005, step: 0.001, value: 0.04 },
    ranges: folder({
      fadeAlphaRange: { max: 1, min: 0, step: 0.01, value: [0.1, 1] },
      fadeWidthRange: { max: 1, min: 0, step: 0.001, value: [0, 0.8] },
      gradientDurationRange: {
        max: 120,
        min: 0.1,
        step: 0.1,
        value: [2, 80]
      },
      instanceCountRange: { max: 50, min: 1, step: 1, value: [5, 50] },
      // static: opacity/metalness handled above
      petalAmpRange: { max: 1, min: -1, step: 0.001, value: [-0.2, 1] },
      petalSegmentsRange: { max: 1024, min: 16, step: 1, value: [16, 1024] },
      petalWidthRange: {
        max: 0.2,
        min: 0.0001,
        step: 0.0001,
        value: [0.0005, 0.2]
      },
      petalsRange: { max: 40, min: 1, step: 1, value: [1, 30] },
      phaseDurationRange: { max: 60, min: 0.1, step: 0.1, value: [0.5, 40] }

      // static: rot/roughness/scale handled above
    }),
    rotCtl: { max: 1080, min: -1080, step: 1, value: -214 },
    roughnessCtl: { max: 1, min: 0, step: 0.001, value: 0.52 },
    scaleCtl: { max: 1, min: 0, step: 0.0001, value: 0.33 },

    speed: { max: 5, min: 0, step: 0.01, value: 1 }
  })

  // Single useFrame for all updates
  useFrame((_, dt) => {
    const deltaTime = dt * speed

    // Update config directly via ref (ranges only for animated params)
    // Apply UI ranges to modulator before update
    modulator.current.setRanges({
      fadeAlpha: {
        max: (ranges.fadeAlphaRange as number[])[1],
        min: (ranges.fadeAlphaRange as number[])[0]
      },
      fadeWidth: {
        max: (ranges.fadeWidthRange as number[])[1],
        min: (ranges.fadeWidthRange as number[])[0]
      },
      gradientDuration: {
        max: (ranges.gradientDurationRange as number[])[1],
        min: (ranges.gradientDurationRange as number[])[0]
      },
      instanceCount: {
        max: (ranges.instanceCountRange as number[])[1],
        min: (ranges.instanceCountRange as number[])[0]
      },
      petalAmp: {
        max: (ranges.petalAmpRange as number[])[1],
        min: (ranges.petalAmpRange as number[])[0]
      },
      petalSegments: {
        max: (ranges.petalSegmentsRange as number[])[1],
        min: (ranges.petalSegmentsRange as number[])[0]
      },
      petalWidth: {
        max: (ranges.petalWidthRange as number[])[1],
        min: (ranges.petalWidthRange as number[])[0]
      },
      petals: {
        max: (ranges.petalsRange as number[])[1],
        min: (ranges.petalsRange as number[])[0]
      },
      phaseDuration: {
        max: (ranges.phaseDurationRange as number[])[1],
        min: (ranges.phaseDurationRange as number[])[0]
      }
      // static params not modulated: rot, roughness, scale, metalness, opacity
    })

    configRef.current = modulator.current.update(deltaTime)

    // Override static controls from Leva
    configRef.current.opacity = opacity
    configRef.current.metalness = metalnessCtl
    configRef.current.roughness = roughnessCtl
    configRef.current.rot = rotCtl
    configRef.current.scale = scaleCtl

    // Update animations directly
    animRef.current.phase =
      (animRef.current.phase +
        (deltaTime * 360) / configRef.current.phaseDuration) %
      360
    animRef.current.gradientRot =
      (animRef.current.gradientRot +
        (deltaTime * 360) / configRef.current.gradientDuration) %
      360
  })

  const instances = <FlowerInstances animRef={animRef} configRef={configRef} />

  return (
    <Center scale={4}>
      <group position-x={-0.25}>
        {instances}
        <group scale-x={-1}>{instances}</group>
      </group>

      <group position-x={0.25} rotation-z={Math.PI / 1.45}>
        {instances}
        <group scale-x={-1}>{instances}</group>
      </group>
    </Center>
  )
}

export default function PageClient() {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1
        ;(gl as any).physicallyCorrectLights = true
        ;(gl as any).outputColorSpace = THREE.SRGBColorSpace
      }}
    >
      <Suspense>
        <fogExp2 attach="fog" args={[new THREE.Color('#000000'), 0.02]} />

        <Environment
          preset="studio"
          background
          blur={1}
          backgroundIntensity={0.005}
        />

        <Scene />
        <Effects />
      </Suspense>

      <OrbitControls />
      <Stats />
    </Canvas>
  )
}
