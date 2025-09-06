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
import gsap from 'gsap'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

import { useSmoothControls } from '@/hooks/use-smooth-controls'

import { FX as Effects } from './effects'
import Geo from './geo'

// Animation system hook
function useAnimations(config: AnimationConfig) {
  const animRef = useRef({ gradientRot: 0, phase: 0 })

  useEffect(() => {
    const tl = gsap.timeline()

    // Phase animation
    tl.to(
      animRef.current,
      {
        duration: config.phaseDuration,
        ease: 'none',
        onRepeat: () => {
          animRef.current.phase = 0
        },
        phase: 360,
        repeat: -1
      },
      0
    )

    // Gradient rotation animation
    tl.to(
      animRef.current,
      {
        duration: config.gradientDuration,
        ease: 'none',
        gradientRot: 360,
        onRepeat: () => {
          animRef.current.gradientRot = 0
        },
        repeat: -1
      },
      0
    )

    return () => {
      tl.kill()
    }
  }, [config.phaseDuration, config.gradientDuration])

  return animRef
}

// Instanced flower system
function FlowerInstances({
  animRef,
  cfg,
  count = 25,
  scalars
}: FlowerInstancesProps) {
  const materialRef = useRef<any>(null)

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.gradientRotation = animRef.current.gradientRot
    }
  })

  const transforms = useMemo(
    () =>
      Array.from({ length: count }).map((_, i, r) => ({
        rotation: (i * Math.PI) / scalars.rot,
        scale: 1 - (i / r.length) * scalars.scale
      })),
    [count, scalars.scale, scalars.rot]
  )

  return (
    <Instances range={count} key={Math.random()}>
      <Geo
        petalAmp={scalars.petalAmp}
        petalSegments={scalars.petalSegments}
        petalWidth={scalars.petalWidth}
        petals={scalars.petals}
        phaseRef={animRef as any}
      />

      {/* @ts-expect-error - custom mat */}
      <gradientMaterial
        ref={materialRef}
        bending={THREE.NormalBlending}
        fadeAlpha={cfg.fadeAlpha}
        fadeWidth={cfg.fadeWidth}
        fog
        metalness={cfg.metalness}
        opacity={cfg.opacity}
        roughness={cfg.roughness}
        transparent
        side={THREE.DoubleSide}
      />

      {transforms.map((t, i) => (
        <Instance key={i} scale={t.scale} rotation={[0, 0, t.rotation]} />
      ))}
    </Instances>
  )
}

function Scene() {
  const animation = useSmoothControls('animation', {
    gradientDuration: { max: 30, min: 1, step: 0.1, value: 12 },
    phaseDuration: { max: 30, min: 1, step: 0.1, value: 8 }
  })

  const animRef = useAnimations({
    gradientDuration: animation.gradientDuration,
    phaseDuration: animation.phaseDuration
  })

  const cfg = useSmoothControls('shape', {
    fadeAlpha: { max: 1, min: 0, value: 0.93 },
    fadeWidth: { max: 1, min: 0, value: 0.38 },
    metalness: { max: 1, min: 0, value: 0.27 },
    opacity: { max: 1, min: 0, value: 0.5 },
    roughness: { max: 1, min: 0, value: 0.52 }
  })

  const scalars = useSmoothControls('scalars', {
    instanceCount: { max: 50, min: 5, step: 1, value: 25 },
    // flower params
    petalAmp: { max: 1, min: 0, step: 0.001, value: 0.35 },
    petalSegments: { max: 1024, min: 64, step: 1, value: 360 },
    petalWidth: { max: 0.2, min: 0.001, step: 0.001, value: 0.02 },
    petals: { max: 24, min: 2, step: 1, value: 6 },
    rot: { max: 360, min: -360, value: 38 },
    scale: { max: 1, min: 0, step: 0.0001, value: 0.63 }
  })

  const instances = (
    <FlowerInstances
      count={scalars.instanceCount}
      animRef={animRef}
      cfg={cfg}
      scalars={scalars}
    />
  )

  return (
    <Center
      scale={6}
      key={JSON.stringify({ ...cfg, count: scalars.instanceCount })}
    >
      <group scale-x={1}>{instances}</group>
      <group scale-x={-1}>{instances}</group>
    </Center>
  )
}

interface AnimationConfig {
  phaseDuration: number
  gradientDuration: number
}

interface FlowerInstancesProps {
  animRef: React.MutableRefObject<{ phase: number; gradientRot: number }>
  cfg: any
  count?: number
  scalars: any
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

        <Scene key={Math.random()} />

        <Effects />
      </Suspense>

      <OrbitControls />
      <Stats />
    </Canvas>
  )
}
