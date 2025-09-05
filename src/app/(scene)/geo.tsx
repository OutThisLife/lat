import { Base, Geometry, Subtraction } from '@react-three/csg'
import * as THREE from 'three'

const THICKNESS = 0.01

export default function Geo({
  type = 'box'
}: {
  type:
    | 'box'
    | 'sphere'
    | 'hexagon'
    | 'star'
    | 'cross'
    | 'diamond'
    | 'triangle'
    | 'octagon'
    | 'plus'
}) {
  switch (type) {
    case 'box':
      return (
        <Geometry>
          <Base geometry={new THREE.BoxGeometry(1, 1, THICKNESS)} />

          <Subtraction>
            <boxGeometry args={[0.99, 0.99, THICKNESS]} />
          </Subtraction>
        </Geometry>
      )

    case 'hexagon':
      return <ringGeometry args={[0.49, 0.5, 6, 1]} />

    case 'star':
      return <ringGeometry args={[0.49, 0.5, 5, 1]} />

    case 'octagon':
      return <ringGeometry args={[0.49, 0.5, 8, 1]} />

    case 'diamond':
      return <ringGeometry args={[0.49, 0.5, 4, 1]} />

    case 'triangle':
      return <ringGeometry args={[0.49, 0.5, 3, 1]} />
  }
}
