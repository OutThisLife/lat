// Noise removed; we use seeded uniform targets and lerp

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

function hashStringToInt(seed: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < seed.length; i++)
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619)

  return h >>> 0
}

function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class NoiseModulator {
  private time = 0
  private current: PresetConfig
  private target: PresetConfig
  private from: PresetConfig
  private offsets: Record<keyof PresetConfig, number>
  private speeds: Record<keyof PresetConfig, number>
  private ranges: Record<keyof PresetConfig, { min: number; max: number }>
  private elapsed: Record<keyof PresetConfig, number>
  private duration: Record<keyof PresetConfig, number>
  private rng: () => number
  private timeScale = 1

  constructor(opts?: { seed?: number | string; timeScale?: number }) {
    this.current = { ...defaults }
    this.target = { ...defaults }
    this.from = { ...defaults }

    const seedNum =
      typeof opts?.seed === 'string'
        ? hashStringToInt(opts.seed)
        : (opts?.seed ?? (Math.random() * 2 ** 32) >>> 0)

    this.rng = mulberry32(seedNum as number)
    this.timeScale = opts?.timeScale ?? 1

    // Random offset for each param to decorrelate noise
    this.offsets = Object.keys(defaults).reduce(
      (acc, k) => ({ ...acc, [k]: this.rng() * 1000 }),
      {} as Record<keyof PresetConfig, number>
    )

    // Different speeds for each param (smooth organic pace)
    this.speeds = {
      fadeAlpha: 0.05,
      fadeWidth: 0.05,
      gradientDuration: 0.015,
      instanceCount: 0.01,
      metalness: 0.04,
      opacity: 0.09,
      petalAmp: 0.02,
      petalSegments: 0.008,
      petalWidth: 0.05,
      petals: 0.02,
      phaseDuration: 0.015,
      rot: 0.03,
      roughness: 0.04,
      scale: 0.02
    }

    // Initialize tween state (targets sampled after ranges are defined)
    this.elapsed = Object.keys(defaults).reduce(
      (acc, k) => ({ ...acc, [k]: 0 }),
      {} as Record<keyof PresetConfig, number>
    )
    this.duration = Object.keys(defaults).reduce(
      (acc, k) => ({
        ...acc,
        [k]: this.computeDuration(k as keyof PresetConfig)
      }),
      {} as Record<keyof PresetConfig, number>
    )

    // Ranges for modulation (EXTREME for visibility)
    this.ranges = {
      fadeAlpha: { max: 0.96, min: 0.9 },
      fadeWidth: { max: 0.18, min: 0.14 },
      gradientDuration: { max: 20, min: 10 },
      instanceCount: { max: 50, min: 48 },
      metalness: { max: 1, min: 0 },
      opacity: { max: 0.3, min: 0.005 },
      petalAmp: { max: 0.39, min: 0.33 },
      petalSegments: { max: 400, min: 320 },
      petalWidth: { max: 0.024, min: 0.018 },
      petals: { max: 6, min: 4 },
      phaseDuration: { max: 12, min: 6 },
      rot: { max: 720, min: -720 },
      roughness: { max: 1, min: 0 },
      scale: { max: 0.95, min: 0.01 }
    }

    // First targets within ranges now that ranges exist
    Object.keys(defaults).forEach(key => {
      const k = key as keyof PresetConfig
      this.target[k] = this.sampleInRange(k) as any
    })
  }

  update(deltaTime: number): PresetConfig {
    const dt = deltaTime * this.timeScale
    this.time += dt

    Object.keys(defaults).forEach(key => {
      const k = key as keyof PresetConfig
      this.elapsed[k] += dt
      const d = Math.max(0.0001, this.duration[k])
      const t = Math.min(1, this.elapsed[k] / d)
      const a = this.from[k] as number
      const b = this.target[k] as number
      this.current[k] = (a + (b - a) * t) as any

      if (t >= 1) {
        this.from[k] = this.current[k]
        this.target[k] = this.sampleInRange(k) as any
        this.duration[k] = this.computeDuration(k)
        this.elapsed[k] = 0
      }
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

  private sampleInRange(key: keyof PresetConfig): number {
    const r = this.ranges[key]
    const u = this.rng()

    return r.min + u * (r.max - r.min)
  }

  private computeDuration(key: keyof PresetConfig): number {
    // Derive a pleasant range of durations from the per-param speed
    const s = Math.max(0.001, this.speeds[key])
    const base = 0.4 / s // ~3–40s depending on speed
    const varMul = 0.7 + this.rng() * 0.6 // 0.7–1.3 variation

    return (base * varMul) / Math.max(0.001, this.timeScale)
  }
}
