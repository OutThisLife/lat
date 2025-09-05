'use client'

import { Environment, OrbitControls, Stats } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'

export default function PageClient() {
  return (
    <Canvas>
      <Suspense>
        <Environment
          preset="studio"
          background
          blur={1}
          backgroundIntensity={0.005}
        />

        <mesh>
          <boxGeometry />
          <meshStandardMaterial />
        </mesh>
      </Suspense>

      <OrbitControls />
      <Stats />
    </Canvas>
  )
}
