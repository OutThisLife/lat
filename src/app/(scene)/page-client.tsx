'use client'

import './material'

import {
  Environment,
  Instance,
  Instances,
  OrbitControls,
  Stats
} from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import { Canvas, useFrame } from '@react-three/fiber'
import { Leva, useControls } from 'leva'
import { useSearchParams } from 'next/navigation'
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

    if (!cfg) return

    // Update material
    if (materialRef.current) {
      materialRef.current.gradientRotation = animRef.current!.gradientRot
      materialRef.current.fadeAlpha = cfg.fadeAlpha
      materialRef.current.fadeWidth = cfg.fadeWidth
      materialRef.current.metalness = cfg.metalness
      materialRef.current.opacity = cfg.opacity
      materialRef.current.roughness = cfg.roughness
    }

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

function Scene({ initValues, seed, timeScale = 1, ...props }: SceneProps) {
  const uid = useRef((seed ?? Math.random().toString(36).slice(2)).toString())
  const modulator = useRef(new NoiseModulator({ seed: uid.current, timeScale }))
  const configRef = useRef(modulator.current.getCurrent())
  const animRef = useRef({ gradientRot: 0, phase: 0 })

  const { metalnessCtl, opacity, rotCtl, roughnessCtl, scaleCtl, speed } =
    useControls(`scene/${uid.current}`, {
      metalnessCtl: {
        max: 1,
        min: 0,
        step: 0.001,
        value: initValues?.metalnessCtl ?? 0.27
      },
      opacity: {
        max: 0.3,
        min: 0.005,
        step: 0.001,
        value: initValues?.opacity ?? 0.02
      },
      rotCtl: {
        max: 1080,
        min: -1080,
        step: 1,
        value: initValues?.rotCtl ?? -214
      },
      roughnessCtl: {
        max: 1,
        min: 0,
        step: 0.001,
        value: initValues?.roughnessCtl ?? 0.52
      },
      scaleCtl: {
        max: 1,
        min: 0,
        step: 0.0001,
        value: initValues?.scaleCtl ?? 0.33
      },
      speed: { max: 5, min: 0, step: 0.01, value: initValues?.speed ?? 0.48 }
    })

  // Single useFrame for all updates
  useFrame((_, dt) => {
    const deltaTime = dt * speed

    // No external ranges; use the modulator's internal defaults

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
        (deltaTime * 360) /
          (configRef.current.phaseDuration *
            (1 + (parseInt(uid.current, 36) % 5) * 0.15))) %
      360
    animRef.current.gradientRot =
      (animRef.current.gradientRot +
        (deltaTime * 360) /
          (configRef.current.gradientDuration *
            (1 + (parseInt(uid.current, 36) % 7) * 0.12))) %
      360
  })

  const instances = <FlowerInstances animRef={animRef} configRef={configRef} />

  return (
    <group {...props}>
      {instances}
      <group scale-x={-1}>{instances}</group>
    </group>
  )
}

export default function PageClient() {
  const params = useSearchParams()

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

        <group scale={4}>
          <Scene seed="A" rotation={[0, 0, Math.PI / -1.75]} />
          <Scene
            seed="B"
            rotation={[0, 0, Math.PI / 1.75]}
            initValues={{
              metalness: 0.77,
              opacity: 0.01,
              rotCtl: -100,
              roughness: 0.52,
              scaleCtl: 0.85,
              speed: 2
            }}
          />

          <Scene
            seed="D"
            position={[0, 0, 1]}
            rotation={[0, 0, Math.PI / 1.35]}
            initValues={{ opacity: 0.01 }}
          />
        </group>

        <Effects />
      </Suspense>

      <OrbitControls />
      {params.has('stats') || (params.has('dev') && <Stats />)}
      <Leva hidden={!params.get('dev')} />
    </Canvas>
  )
}

interface SceneProps extends Partial<ThreeElements['group']> {
  seed?: string | number
  timeScale?: number
  initValues?: Record<string, number>
}
