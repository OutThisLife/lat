import { extend } from '@react-three/fiber'
import * as THREE from 'three'

class GradientMaterial extends THREE.MeshStandardMaterial {
  _colorA = new THREE.Color('#fff')
  _colorB = new THREE.Color('#fff')
  _axis = new THREE.Vector3(1, 0, 0)
  _fadeWidth = 0.5
  _gradientRotation = 0
  _fadeAlpha = 1

  constructor() {
    super()
  }

  get colorA() {
    return this._colorA
  }
  set colorA(v) {
    this._colorA.set(v)
  }

  get colorB() {
    return this._colorB
  }
  set colorB(v) {
    this._colorB.set(v)
  }

  get axis() {
    return this._axis
  }
  set axis(v) {
    this._axis.copy(v)
  }

  get fadeWidth() {
    return this._fadeWidth
  }
  set fadeWidth(v) {
    this._fadeWidth = v
  }

  get fadeAlpha() {
    return this._fadeAlpha
  }
  set fadeAlpha(v) {
    this._fadeAlpha = v
  }

  get gradientRotation() {
    return this._gradientRotation
  }
  set gradientRotation(v) {
    this._gradientRotation = v
    const rad = (v * Math.PI) / 180
    this._axis.set(Math.cos(rad), Math.sin(rad), 0)
  }

  onBeforeCompile(shader: any) {
    shader.uniforms.uAxis = { value: this._axis }
    shader.uniforms.uColorA = { value: this._colorA }
    shader.uniforms.uColorB = { value: this._colorB }
    shader.uniforms.uFadeWidth = { value: this._fadeWidth }
    shader.uniforms.uFadeAlpha = { value: this._fadeAlpha }

    shader.vertexShader =
      /*glsl*/ `
      varying vec3 vObjectPos;
    ` +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        /*glsl*/ `
        vObjectPos = position;
        #include <begin_vertex>
        `
      )

    shader.fragmentShader =
      /*glsl*/ `
      uniform vec3 uAxis;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform float uFadeWidth;
      uniform float uFadeAlpha;
      varying vec3 vObjectPos;
    ` +
      shader.fragmentShader.replace(
        '#include <color_fragment>',
        /*glsl*/ `#include <color_fragment>
        
        float t = dot(normalize(vObjectPos), uAxis) * 0.5 + 0.5;
        float w = clamp(uFadeWidth, 0.0, 1.0);

        float fadeAmount = smoothstep(0.5 * (1.0 - w), 0.5, abs(t - 0.5));
        vec3 gradientColor = t < 0.5 ? uColorA : uColorB;
        
        diffuseColor.rgb = gradientColor;
        diffuseColor.a *= mix(1.0, fadeAmount, uFadeAlpha);
        `
      )
  }
}

extend({ GradientMaterial })
