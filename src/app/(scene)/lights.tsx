import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type * as THREE from 'three'

export default function Lights() {
  return (
    <group>
      <MovingLight color="#ffd6a5" intensity={35} offset={0} radius={3.4} />
      <MovingLight color="#fdffb6" intensity={40} offset={1.2} radius={3.2} />
      <MovingLight color="#ffb5a7" intensity={25} offset={2.6} radius={2.8} />
      <MovingLight color="#fec89a" intensity={30} offset={4.1} radius={3.6} />
      <MovingLight color="#f8edeb" intensity={28} offset={5.8} radius={2.4} />
    </group>
  )
}

function MovingLight({
  color = '#fff',
  height = 0.6,
  intensity = 40,
  offset = 0,
  radius = 3,
  speed = 0.15
}: MovingLightProps) {
  const g = useRef<THREE.Group>(null)

  useFrame(st => {
    const t = st.clock.elapsedTime * speed + offset
    const x = Math.cos(t) * radius
    const y = Math.sin(t * 0.8) * height
    const z = Math.sin(t) * radius * 0.6

    const p = g.current?.position

    if (!p) return
    p.x += (x - p.x) * 0.12
    p.y += (y - p.y) * 0.12
    p.z += (z - p.z) * 0.12
  })

  return (
    <group ref={g}>
      <pointLight color={color} intensity={intensity} distance={30} decay={2} />
    </group>
  )
}

interface MovingLightProps {
  color?: THREE.ColorRepresentation
  decay?: number
  height?: number
  intensity?: number
  offset?: number
  radius?: number
  speed?: number
}
