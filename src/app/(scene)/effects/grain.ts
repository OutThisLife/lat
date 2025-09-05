import * as THREE from 'three'

import { QuadPass } from './pass'

const GrainShader = {
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float dpr;
    uniform float time;
    uniform float intensity;
    uniform float size;
    uniform int blendMode;
    uniform float speed;
    varying vec2 vUv;

    float hash(vec2 p, float t) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031 + t);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }
    
    vec3 blendGrain(vec3 base, float g, int mode) {
      if (mode == 0) return base + vec3(g) * intensity;          // add
      if (mode == 1) return base * (1.0 + g * intensity);        // multiply
      if (mode == 2) {                                           // overlay
        vec3 r;
        for (int i = 0; i < 3; i++) {
          float b = base[i];
          float f = 1.0 + g * intensity;
          r[i] = b < 0.5 ? 2.0 * b * f : 1.0 - 2.0 * (1.0 - b) * (1.0 - f);
        }
        return r;
      }
      if (mode == 3) return vec3(1.0) - (vec3(1.0) - base) * (1.0 - g * intensity); // screen
      if (mode == 4) {                                           // quadratic blend
        vec3 r;
        for (int i = 0; i < 3; i++) {
          float f = g * intensity;
          r[i] = (1.0 - 2.0 * f) * base[i] * base[i] + 2.0 * f * base[i];
        }
        return r;
      }
      return base;
    }

    void main() {
      vec3 color = texture2D(tDiffuse, vUv).rgb;
      vec2 scaledUV = vUv * resolution / (size * max(dpr, 1.0));
      vec2 coord = floor(scaledUV);
      vec2 subPixel = fract(scaledUV);
      float frameTime = floor(time * speed);
      
      float grain1 = hash(coord, frameTime * 0.1031) * 2.0 - 1.0;
      float grain2 = hash(coord + vec2(0.5), frameTime * 0.1031 + 0.3) * 2.0 - 1.0;
      float grain = mix(grain1, grain2, length(subPixel - 0.5));
      
      color = clamp(blendGrain(color, grain, blendMode), 0.0, 1.0);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  uniforms: {
    blendMode: { value: 0 },
    dpr: { value: 1 },
    intensity: { value: 0.02 },
    resolution: { value: new THREE.Vector2(1, 1) },
    size: { value: 1 },
    speed: { value: 24 },
    tDiffuse: { value: null as THREE.Texture | null },
    time: { value: 0 }
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `
}

export class GrainPass extends QuadPass {
  constructor(options: GrainOptions = {}) {
    super(GrainShader)

    if (options.intensity !== undefined)
      this.uniforms.intensity.value = options.intensity

    if (options.size !== undefined) this.uniforms.size.value = options.size

    if (options.blendMode !== undefined)
      this.uniforms.blendMode.value = options.blendMode

    if (options.speed !== undefined) this.uniforms.speed.value = options.speed
  }

  render(
    renderer: THREE.WebGLRenderer,
    writeBuffer: THREE.WebGLRenderTarget,
    readBuffer: THREE.WebGLRenderTarget,
    deltaTime: number
  ) {
    this.updateCommonUniforms(renderer, readBuffer)
    this.uniforms.time.value += deltaTime
    this.beginRender(renderer, writeBuffer)
    this.renderQuad(renderer)
  }
}

interface GrainOptions {
  blendMode?: number
  intensity?: number
  size?: number
  speed?: number
}
