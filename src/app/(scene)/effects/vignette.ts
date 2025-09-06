import * as THREE from 'three'

import { QuadPass } from './pass'

const VignetteShader = {
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float strength;
    uniform float smoothness;
    uniform float roundness;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      vec3 color = texture2D(tDiffuse, uv).rgb;

      vec2 center = vec2(0.5);
      float aspect = resolution.x / max(resolution.y, 1.0);
      vec2 p = (uv - center) * vec2(aspect, 1.0);
      float dist = pow(length(p), roundness);
      float vig = smoothstep(0.8, smoothness, 1.0 - dist);
      color *= mix(1.0, vig, strength);

      gl_FragColor = vec4(color, 1.0);
    }
  `,
  uniforms: {
    resolution: { value: new THREE.Vector2(1, 1) },
    roundness: { value: 1.5 },
    smoothness: { value: 0.35 },
    strength: { value: 0.25 },
    tDiffuse: { value: null as THREE.Texture | null }
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `
}

export class VignettePass extends QuadPass {
  constructor(options: VignetteOptions = {}) {
    super(VignetteShader)

    if (options.strength !== undefined)
      this.uniforms.strength.value = options.strength

    if (options.smoothness !== undefined)
      this.uniforms.smoothness.value = options.smoothness

    if (options.roundness !== undefined)
      this.uniforms.roundness.value = options.roundness
  }

  render(
    renderer: THREE.WebGLRenderer,
    writeBuffer: THREE.WebGLRenderTarget,
    readBuffer: THREE.WebGLRenderTarget
  ) {
    this.updateCommonUniforms(renderer, readBuffer)
    this.beginRender(renderer, writeBuffer)
    this.renderQuad(renderer)
  }
}

interface VignetteOptions {
  roundness?: number
  smoothness?: number
  strength?: number
}
