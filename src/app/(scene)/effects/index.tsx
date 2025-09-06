import { Effects } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import { folder, useControls } from 'leva'
import { UnrealBloomPass } from 'three-stdlib'

import { DitheringPass } from './dithering'
import { GrainPass } from './grain'
import { VignettePass } from './vignette'

extend({
  DitheringPass,
  GrainPass,
  UnrealBloomPass,
  VignettePass
})

export function FX() {
  const config = useControls(
    'Effects',
    {
      bloom: folder({
        bloomRadius: {
          max: 2,
          min: 0,
          step: 0.01,
          value: 0.46
        },
        bloomStrength: {
          max: 3,
          min: 0,
          step: 0.01,
          value: 0.64
        },
        bloomThreshold: { max: 1, min: 0, step: 0.01, value: 0.56 },
        enableBloom: { value: true }
      }),
      dithering: folder({
        enableDithering: { value: false },
        grayscaleOnly: { value: true },
        gridSize: {
          max: 20,
          min: 1,
          step: 0.01,
          value: 1
        },
        pixelSizeRatio: {
          max: 10,
          min: 1,
          step: 0.01,
          value: 3.95
        },
        xRange: {
          max: 1,
          min: 0,

          step: 0.01,
          value: [0, 1]
        },
        yRange: {
          max: 1,
          min: 0,

          step: 0.01,
          value: [0, 1]
        }
      }),
      grain: folder({
        blendMode: {
          options: {
            Add: 0,
            Multiply: 1,
            Overlay: 2,
            Screen: 3,
            'Soft Light': 4
          },
          value: 0
        },
        enableGrain: { value: true },
        intensity: {
          max: 1,
          min: 0,
          step: 0.003,
          value: 0.02
        },
        size: {
          max: 5,
          min: 0.5,
          step: 0.1,
          value: 0.5
        },
        speed: {
          max: 60,
          min: 0,
          step: 1,
          value: 0
        }
      }),
      vignette: folder({
        enableVignette: { value: true },
        vignetteRoundness: { max: 3, min: 0.5, step: 0.01, value: 1.5 },
        vignetteSmoothness: { max: 1, min: 0, step: 0.01, value: 0.35 },
        vignetteStrength: { max: 1, min: 0, step: 0.01, value: 0.2 }
      })
    },
    { collapsed: true }
  )

  const anyEnabled =
    config.enableDithering ||
    config.enableBloom ||
    config.enableGrain ||
    config.enableVignette

  if (!anyEnabled) return null

  return (
    <Effects disableGamma multisamping={0} anisotropy={16}>
      {/* @ts-expect-error - custom pass */}
      <vignettePass
        enabled={config.enableVignette}
        args={[
          {
            roundness: config.vignetteRoundness,
            smoothness: config.vignetteSmoothness,
            strength: config.vignetteStrength
          }
        ]}
      />
      {/* @ts-expect-error - custom pass */}
      <ditheringPass
        enabled={config.enableDithering}
        args={[
          {
            grayscaleOnly: config.grayscaleOnly,
            gridSize: config.gridSize,
            pixelSizeRatio: config.pixelSizeRatio,
            xRange: config.xRange,
            yRange: config.yRange
          }
        ]}
      />

      {/* @ts-expect-error - custom pass */}
      <grainPass
        enabled={config.enableGrain}
        args={[
          {
            blendMode: config.blendMode,
            intensity: config.intensity,
            size: config.size,
            speed: config.speed
          }
        ]}
      />

      {/* @ts-expect-error - custom pass */}
      <unrealBloomPass
        enabled={config.enableBloom}
        args={[
          undefined,
          config.bloomStrength,
          config.bloomRadius,
          config.bloomThreshold
        ]}
      />
    </Effects>
  )
}
