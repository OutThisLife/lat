import { createNoise2D } from 'simplex-noise'

const defaults = {
  fadeAlpha: 0.93,
  fadeWidth: 0.16,
  gradientDuration: 40,
  instanceCount: 50,
  metalness: 0.27,
  opacity: 0.04,
  petalAmp: 0.36,
  petalSegments: 360,
  petalWidth: 0.02,
  petals: 4,
  phaseDuration: 15,
  rot: -214,
  roughness: 0.52,
  scale: 0.33
}

export type PresetConfig = typeof defaults

const noise2D = createNoise2D()

export class NoiseModulator {
  private time = 0
  private current: PresetConfig
  private target: PresetConfig
  private offsets: Record<keyof PresetConfig, number>
  private speeds: Record<keyof PresetConfig, number>
  private smoothing: Record<keyof PresetConfig, number>
  private ranges: Record<keyof PresetConfig, { min: number; max: number }>

  constructor() {
    this.current = { ...defaults }
    this.target = { ...defaults }

    // Random offset for each param to decorrelate noise
    this.offsets = Object.keys(defaults).reduce(
      (acc, k) => ({ ...acc, [k]: Math.random() * 1000 }),
      {} as Record<keyof PresetConfig, number>
    )

    // Different speeds for each param (smooth organic pace)
    this.speeds = {
      fadeAlpha: 0.08,
      fadeWidth: 0.06,
      gradientDuration: 0.02,
      instanceCount: 0.015,
      metalness: 0.04,
      opacity: 0.09, // Keep but will be overridden
      petalAmp: 0.03,
      petalSegments: 0.01,
      petalWidth: 0.12, // Visible pulsing
      petals: 0.025, // Slow morph between petal counts
      phaseDuration: 0.02,
      rot: 0.035,
      roughness: 0.045,
      scale: 0.028
    }

    // Per-parameter transition smoothing (1/sec). Higher = faster response
    this.smoothing = {
      fadeAlpha: 1.5,
      fadeWidth: 1.2,
      gradientDuration: 0.5,
      instanceCount: 1.0,
      metalness: 0.9,
      opacity: 2.0,
      petalAmp: 1.8,
      petalSegments: 0.6,
      petalWidth: 3.0,
      petals: 0.8,
      phaseDuration: 0.6,
      rot: 1.6,
      roughness: 1.0,
      scale: 1.4
    }

    // Ranges for modulation (EXTREME for visibility)
    this.ranges = {
      fadeAlpha: { max: 1, min: 0.1 },
      fadeWidth: { max: 0.8, min: 0 },
      gradientDuration: { max: 80, min: 2 },
      instanceCount: { max: 50, min: 5 },
      metalness: { max: 1, min: 0 },
      opacity: { max: 0.3, min: 0.005 },
      petalAmp: { max: 1, min: -0.2 }, // Can go negative!
      petalSegments: { max: 1024, min: 16 },
      petalWidth: { max: 0.2, min: 0.0005 }, // HUGE range for visibility
      petals: { max: 30, min: 1 }, // 1-30 petals!
      phaseDuration: { max: 40, min: 0.5 },
      rot: { max: 720, min: -720 },
      roughness: { max: 1, min: 0 },
      scale: { max: 0.95, min: 0.01 } // Nearly disappearing to huge
    }
  }

  update(deltaTime: number): PresetConfig {
    this.time += deltaTime

    Object.keys(defaults).forEach(key => {
      const k = key as keyof PresetConfig

      const noiseValue = noise2D(this.time * this.speeds[k], this.offsets[k])
      const normalized = (noiseValue + 1) * 0.5
      const range = this.ranges[k]
      this.target[k] = (range.min + normalized * (range.max - range.min)) as any

      const cur = this.current[k] as number
      const tgt = this.target[k] as number
      const s = this.smoothing[k]
      const a = 1 - Math.exp(-s * deltaTime)
      this.current[k] = (cur + (tgt - cur) * a) as any
    })

    return this.current
  }

  getCurrent(): PresetConfig {
    return this.current
  }

  setRanges(
    partial: Partial<Record<keyof PresetConfig, { min: number; max: number }>>
  ) {
    Object.entries(partial).forEach(([k, v]) => {
      if (!v) return
      const key = k as keyof PresetConfig
      const min = Math.min(v.min, v.max)
      const max = Math.max(v.min, v.max)
      this.ranges[key] = { max, min }
    })
  }
}
