'use client'

import './material'

import { Center, Environment, OrbitControls, Stats } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import * as THREE from 'three'

import { useSmoothControls } from '@/hooks/use-smooth-controls'

import { FX as Effects } from './effects'
import Geo from './geo'

function Scene() {
  const cfg = useSmoothControls('shape', {
    fadeAlpha: { max: 1, min: 0, value: 0.93 },
    fadeWidth: { max: 1, min: 0, value: 0.38 },
    metalness: { max: 1, min: 0, value: 0.27 },
    opacity: { max: 1, min: 0, value: 0.5 },
    roughness: { max: 1, min: 0, value: 0.52 },
    type: {
      options: [
        'box',
        'sphere',
        'hexagon',
        'star',
        'cross',
        'diamond',
        'triangle',
        'octagon',
        'plus'
      ],
      value: 'triangle'
    }
  })

  const scalars = useSmoothControls('scalars', {
    gradientRot: { max: 360, min: -252, value: 0 },
    rot: { max: 360, min: -360, value: 38 },
    scale: { max: 1, min: 0, step: 0.0001, value: 0.63 }
  })

  const inner = (
    <>
      {Array.from({ length: 25 }).map((_, i, r) => (
        <mesh
          key={i}
          scale={1 - (i / r.length) * scalars.scale}
          rotation={[0, 0, (i * Math.PI) / scalars.rot]}
        >
          <Geo type={cfg.type as any} />

          {/* @ts-expect-error - custom mat */}
          <gradientMaterial
            bending={THREE.NormalBlending}
            fadeAlpha={cfg.fadeAlpha}
            fadeWidth={cfg.fadeWidth}
            fog
            gradientRotation={scalars.gradientRot}
            metalness={cfg.metalness}
            opacity={cfg.opacity}
            roughness={cfg.roughness}
            transparent
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </>
  )

  return (
    <Center scale={6} key={JSON.stringify(cfg)}>
      <group scale-x={1}>{inner}</group>
      {/* <group scale-x={-1}>{inner}</group> */}
    </Center>
  )
}

export default function PageClient() {
  return (
    <Canvas>
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
