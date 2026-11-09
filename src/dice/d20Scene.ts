import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  LinearSRGBColorSpace,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'
import type { Texture } from 'three'
import {
  D20_CAM_DIST,
  D20_FACES,
  D20_FACE_NORMALS,
  D20_FACE_NUMBERS,
  D20_LIGHT,
  D20_TEX_NUMBER_CENTER,
  D20_TEX_SIZE,
  D20_VERTS,
} from './d20Geometry'
import { D20_MODE_LAND, D20_MODE_REST, D20_MODE_TUMBLE, restingD20, stepD20 } from './d20Motion'
import type { D20Command, D20Sim } from './d20Motion'
import { D20_LOOKS } from '../lab/labs'
import type { LabId } from '../lab/labs'

/**
 * The app's Home D20 in three.js. The geometry and motion are the app's own
 * (d20Geometry, d20Motion); the shaders redo what the app's Skia renderer
 * (src/components/game/d20Render.ts) draws, back to front:
 *   1. a halo in the color of the die's inner light,
 *   2. the light inside it, a radial glow seen through the faces,
 *   3. the face art, each face a crossfade of the mid, light and shadow
 *      tones by how squarely it faces the upper-left key light, plus light
 *      leaking along the seams for the opaque Bio and Chem sets,
 *   4. the numbers, grey that brightens toward the light and darkens away.
 * It only draws while something moves; a die at rest costs nothing.
 */

/** Per radius of hop height: how far the die rises up the screen / comes toward the camera. */
const HOP_RISE = 0.55
const HOP_TOWARD = 0.9
/** Die radius as a share of the canvas side, leaving room for the halo and the hops. */
const RADIUS_SHARE = 0.22
/** Number size in texture space (the disc it sits on is ~270 across). */
const NUMBER_FONT_SIZE = 190
/** Each number's atlas cell stands for the whole 600×600 face texture. */
const ATLAS_CELL = 256
const NUMBER_FONT = '"Playfair Display", Georgia, serif'

export interface D20Handle {
  /** Start tumbling (a roll in flight just keeps going). */
  roll(): void
  /** Steer onto `face` and settle; `onSettled` fires once the flare is over. */
  land(face: number, onSettled?: () => void): void
  /** Turn straight to `face` without moving (reduced motion); the light still flares. */
  snap(face: number, onSettled?: () => void): void
  /** Re-skin for another lab. Resolves once its art has loaded. */
  setLab(lab: LabId): Promise<void>
  /** Load a lab's art ahead of time. */
  preload(lab: LabId): Promise<void>
  face(): number
  dispose(): void
}

const GLSL_COMMON = /* glsl */ `
  float ss(float e0, float e1, float x) {
    float t = clamp((x - e0) / (e1 - e0), 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
  }
  // Light level → color: 0 is out (embers), 1 the steady glow, above 1 runs white-hot.
  vec3 lit(vec3 c, float level, vec3 ember) {
    if (level <= 1.0) return mix(ember, c, max(level, 0.0));
    return mix(c, vec3(1.0), min(1.0, (level - 1.0) * 0.4));
  }
`

const DIE_VERTEX = /* glsl */ `
  attribute vec3 aBary;
  attribute vec3 aFaceNormal;
  attribute float aNumber;
  uniform vec2 uApex;
  uniform vec2 uLeft;
  uniform vec2 uRight;
  uniform vec3 uLight;
  varying vec2 vTex;
  varying vec3 vBary;
  varying float vLambert;
  varying float vNumber;
  void main() {
    vBary = aBary;
    vNumber = aNumber;
    vTex = (aBary.x * uApex + aBary.y * uLeft + aBary.z * uRight) / ${D20_TEX_SIZE.toFixed(1)};
    vLambert = dot(normalize(normalMatrix * aFaceNormal), uLight);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const DIE_FRAGMENT = /* glsl */ `
  uniform sampler2D uMid;
  uniform sampler2D uLit;
  uniform sampler2D uShade;
  uniform sampler2D uNumbers;
  uniform vec3 uHot;
  uniform vec3 uCore;
  uniform vec3 uRim;
  uniform float uLevel;
  uniform float uSeams;
  uniform vec3 uGreys;
  uniform float uNumberScale;
  uniform vec2 uCenter;
  uniform float uRadius;
  varying vec2 vTex;
  varying vec3 vBary;
  varying float vLambert;
  varying float vNumber;
  ${GLSL_COMMON}

  float numberGrey(float l) {
    if (l >= 0.5) return uGreys.y + (uGreys.z - uGreys.y) * ss(0.5, 0.95, l);
    return uGreys.y + (uGreys.x - uGreys.y) * ss(0.5, -0.3, l);
  }

  void main() {
    vec3 ember = uRim * 0.18;

    // 2. The light inside.
    float d = length(gl_FragCoord.xy - uCenter) / (uRadius * 1.05);
    vec3 hot = lit(uHot, uLevel, ember);
    vec3 core = lit(uCore, uLevel, ember);
    vec3 rim = lit(uRim, uLevel, ember);
    vec3 color = d < 0.45 ? mix(hot, core, d / 0.45) : mix(core, rim, clamp((d - 0.45) / 0.55, 0.0, 1.0));

    // 3. Face art: premultiplied tones whose weights sum to 1, over the light.
    float wLight = ss(0.6, 0.9, vLambert);
    float wShadow = ss(0.32, -0.05, vLambert);
    vec4 art = (1.0 - wLight - wShadow) * texture2D(uMid, vTex)
      + wLight * texture2D(uLit, vTex)
      + wShadow * texture2D(uShade, vTex);
    color = art.rgb + color * (1.0 - art.a);

    // Opaque art: the light leaks out along the seams between faces.
    if (uSeams > 0.0 && uLevel > 0.02) {
      vec3 px = vBary / max(fwidth(vBary), vec3(1e-5));
      float e = min(min(px.x, px.y), px.z);
      float a = uSeams * min(uLevel, 1.3);
      float glow = 0.68 * exp(-pow(e / (uRadius * 0.048), 2.0));
      color = mix(color, core, min(1.0, a * 0.8) * glow);
      float crack = clamp(uRadius * 0.007 - e + 0.5, 0.0, 1.0);
      color = mix(color, lit(mix(uCore, uHot, 0.15), uLevel, ember), min(1.0, a) * crack);
    }

    // A flare washes the whole die in light for a moment (screen blend).
    if (uLevel > 1.05) {
      vec3 wash = lit(uCore, 1.0, ember);
      color = mix(color, 1.0 - (1.0 - color) * (1.0 - wash), min(0.35, (uLevel - 1.0) * 0.25));
    }

    // 4. The number.
    float num = floor(vNumber + 0.5);
    vec2 center = vec2(${(D20_TEX_NUMBER_CENTER[0] / D20_TEX_SIZE).toFixed(4)}, ${(D20_TEX_NUMBER_CENTER[1] / D20_TEX_SIZE).toFixed(4)});
    vec2 local = clamp(center + (vTex - center) / uNumberScale, 0.0, 1.0);
    vec2 cell = vec2(mod(num - 1.0, 5.0), floor((num - 1.0) / 5.0));
    float ink = texture2D(uNumbers, (cell + local) / vec2(5.0, 4.0)).a;
    color = mix(color, vec3(numberGrey(vLambert) / 255.0), ink);

    gl_FragColor = vec4(color, 1.0);
  }
`

const HALO_VERTEX = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const HALO_FRAGMENT = /* glsl */ `
  uniform vec3 uCore;
  uniform vec3 uRim;
  uniform float uLevel;
  uniform vec2 uCenter;
  uniform float uRadius;
  ${GLSL_COMMON}

  void main() {
    if (uLevel <= 0.02) discard;
    vec3 ember = uRim * 0.18;
    float reach = uRadius * 1.6 * (1.0 + 0.2 * max(0.0, uLevel - 1.0));
    // A dimmer light fades the halo out rather than darkening it.
    float a = min(0.85, 0.5 * uLevel);
    float level = max(1.0, uLevel);
    vec4 inner = vec4(lit(uCore, level, ember), a);
    vec4 mid = vec4(lit(uCore, level, ember), a * 0.35);
    vec4 outer = vec4(lit(uRim, level, ember), 0.0);
    float t = length(gl_FragCoord.xy - uCenter) / reach;
    vec4 c = t < 0.35 ? inner : t < 0.65 ? mix(inner, mid, (t - 0.35) / 0.3) : mix(mid, outer, clamp((t - 0.65) / 0.35, 0.0, 1.0));
    gl_FragColor = vec4(c.rgb * c.a, c.a);
  }
`

/** The die's corners per face, with what each face needs to shade itself. */
function buildGeometry(): BufferGeometry {
  const position = new Float32Array(20 * 9)
  const bary = new Float32Array(20 * 9)
  const normal = new Float32Array(20 * 9)
  const number = new Float32Array(20 * 3)
  D20_FACES.forEach((corners, face) => {
    corners.forEach((corner, k) => {
      const i = face * 3 + k
      position.set(D20_VERTS[corner], i * 3)
      bary.set([k === 0 ? 1 : 0, k === 1 ? 1 : 0, k === 2 ? 1 : 0], i * 3)
      normal.set(D20_FACE_NORMALS[face], i * 3)
      number[i] = D20_FACE_NUMBERS[face]
    })
  })
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(position, 3))
  geometry.setAttribute('aBary', new BufferAttribute(bary, 3))
  geometry.setAttribute('aFaceNormal', new BufferAttribute(normal, 3))
  geometry.setAttribute('aNumber', new BufferAttribute(number, 1))
  return geometry
}

/** Playfair Display Bold, the app's number font (index.html loads it for the site's headings too). */
async function loadNumberFont() {
  // Georgia stands in if the font never arrives.
  const timeout = new Promise((resolve) => setTimeout(resolve, 2500))
  await Promise.race([document.fonts.load(`700 ${NUMBER_FONT_SIZE}px "Playfair Display"`, '0123456789'), timeout]).catch(() => {})
}

/**
 * 1–20 in a 5×4 grid, white on clear. Each cell is the face texture shrunk
 * to ATLAS_CELL, with its number centered on the disc like the app's
 * buildD20Labels (6 and 9 get a bar under them, like a real die).
 */
function buildNumberAtlas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = ATLAS_CELL * 5
  canvas.height = ATLAS_CELL * 4
  const ctx = canvas.getContext('2d')!
  ctx.font = `700 ${NUMBER_FONT_SIZE}px ${NUMBER_FONT}`
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#fff'
  const [cx, cy] = D20_TEX_NUMBER_CENTER
  const scale = ATLAS_CELL / D20_TEX_SIZE
  for (let n = 1; n <= 20; n++) {
    const text = String(n)
    const m = ctx.measureText(text)
    const inkLeft = -m.actualBoundingBoxLeft
    const inkWidth = m.actualBoundingBoxLeft + m.actualBoundingBoxRight
    const inkTop = -m.actualBoundingBoxAscent
    const inkHeight = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
    const marked = n === 6 || n === 9
    const barGap = NUMBER_FONT_SIZE * 0.07
    const barH = NUMBER_FONT_SIZE * 0.07
    // Center the ink (plus the bar, when there is one) on the disc.
    const lift = marked ? (barGap + barH) / 2 : 0
    const x = cx - (inkLeft + inkWidth / 2)
    const y = cy - (inkTop + inkHeight / 2) - lift
    ctx.save()
    ctx.translate(((n - 1) % 5) * ATLAS_CELL, Math.floor((n - 1) / 5) * ATLAS_CELL)
    ctx.scale(scale, scale)
    ctx.fillText(text, x, y)
    if (marked) ctx.fillRect(cx - inkWidth * 0.45, y + inkTop + inkHeight + barGap, inkWidth * 0.9, barH)
    ctx.restore()
  }
  return canvas
}

function prepare<T extends Texture>(texture: T, anisotropy: number): T {
  texture.flipY = false
  texture.premultiplyAlpha = true
  texture.minFilter = LinearMipmapLinearFilter
  texture.magFilter = LinearFilter
  texture.anisotropy = anisotropy
  texture.needsUpdate = true
  return texture
}

/** Throws when WebGL is unavailable; the caller falls back to a flat die. */
export async function createD20(canvas: HTMLCanvasElement, lab: LabId, startFace: number): Promise<D20Handle> {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true })
  // Shader math stays in the art's own sRGB values, like the app's Skia canvas.
  renderer.outputColorSpace = LinearSRGBColorSpace
  renderer.setClearColor(0x000000, 0)
  const anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy())

  const camera = new PerspectiveCamera(
    (2 * Math.atan(0.5 / (RADIUS_SHARE * D20_CAM_DIST)) * 180) / Math.PI,
    1,
    0.1,
    100,
  )
  camera.position.set(0, 0, D20_CAM_DIST)

  const loader = new TextureLoader()
  const labArt = new Map<LabId, Promise<{ mid: Texture; light: Texture; shadow: Texture }>>()
  const loadLab = (id: LabId) => {
    let art = labArt.get(id)
    if (!art) {
      const look = D20_LOOKS[id]
      art = Promise.all([look.mid, look.light, look.shadow].map((url) => loader.loadAsync(url))).then(
        ([mid, light, shadow]) => ({
          mid: prepare(mid, anisotropy),
          light: prepare(light, anisotropy),
          shadow: prepare(shadow, anisotropy),
        }),
      )
      art.catch(() => labArt.delete(id))
      labArt.set(id, art)
    }
    return art
  }

  const [art] = await Promise.all([loadLab(lab), loadNumberFont()])
  const numbers = prepare(new CanvasTexture(buildNumberAtlas()), anisotropy)

  const shared = {
    uCore: { value: new Vector3() },
    uRim: { value: new Vector3() },
    uLevel: { value: 1 },
    uCenter: { value: new Vector2() },
    uRadius: { value: 1 },
  }
  const dieUniforms = {
    ...shared,
    uMid: { value: art.mid },
    uLit: { value: art.light },
    uShade: { value: art.shadow },
    uNumbers: { value: numbers },
    uHot: { value: new Vector3() },
    uSeams: { value: 0 },
    uGreys: { value: new Vector3() },
    uNumberScale: { value: 1 },
    uApex: { value: new Vector2() },
    uLeft: { value: new Vector2() },
    uRight: { value: new Vector2() },
    uLight: { value: new Vector3(...D20_LIGHT) },
  }
  const dieMaterial = new ShaderMaterial({ uniforms: dieUniforms, vertexShader: DIE_VERTEX, fragmentShader: DIE_FRAGMENT })
  const haloMaterial = new ShaderMaterial({
    uniforms: shared,
    vertexShader: HALO_VERTEX,
    fragmentShader: HALO_FRAGMENT,
    transparent: true,
    premultipliedAlpha: true,
    depthTest: false,
    depthWrite: false,
  })

  const geometry = buildGeometry()
  const die = new Mesh(geometry, dieMaterial)
  const haloQuad = new PlaneGeometry(2, 2)
  const halo = new Mesh(haloQuad, haloMaterial)
  halo.frustumCulled = false
  halo.renderOrder = -1
  const scene = new Scene()
  scene.add(halo, die)

  function applyLook(id: LabId, textures: { mid: Texture; light: Texture; shadow: Texture }) {
    const look = D20_LOOKS[id]
    dieUniforms.uMid.value = textures.mid
    dieUniforms.uLit.value = textures.light
    dieUniforms.uShade.value = textures.shadow
    dieUniforms.uHot.value.set(...look.hot)
    shared.uCore.value.set(...look.core)
    shared.uRim.value.set(...look.rim)
    dieUniforms.uSeams.value = look.seams
    dieUniforms.uGreys.value.set(...look.numberGreys)
    dieUniforms.uNumberScale.value = look.numberScale
    dieUniforms.uApex.value.set(...look.corners.apex)
    dieUniforms.uLeft.value.set(...look.corners.left)
    dieUniforms.uRight.value.set(...look.corners.right)
  }
  applyLook(lab, art)

  let sim: D20Sim = restingD20(startFace)
  let cmd: D20Command = { seq: 0, kind: D20_MODE_REST, face: startFace }
  let onSettle: (() => void) | null = null
  let raf = 0
  let disposed = false

  function fitCanvas() {
    const side = canvas.clientWidth
    if (!side) return
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(side, side, false)
  }

  function draw() {
    const [w, x, y, z] = sim.q
    die.quaternion.set(x, y, z, w)
    const rise = sim.h * HOP_RISE
    const toward = sim.h * HOP_TOWARD
    die.position.set(0, rise, toward)
    // Screen position and size of the die's center, in drawing-buffer pixels
    // (what gl_FragCoord counts), for the screen-space glows.
    const side = renderer.domElement.width
    const radius = RADIUS_SHARE * side
    const perspective = D20_CAM_DIST / (D20_CAM_DIST - toward)
    shared.uCenter.value.set(side / 2, side / 2 + radius * rise * perspective)
    shared.uRadius.value = radius * perspective
    shared.uLevel.value = 1 + sim.glow
    renderer.render(scene, camera)
  }

  function frame(now: number) {
    raf = 0
    if (disposed) return
    const wasMoving = sim.mode !== D20_MODE_REST
    sim = stepD20(sim, cmd, now, Math.random)
    draw()
    if (sim.mode !== D20_MODE_REST) {
      raf = requestAnimationFrame(frame)
    } else if (wasMoving) {
      const settled = onSettle
      onSettle = null
      settled?.()
    }
  }

  function wake() {
    if (!raf && !disposed) raf = requestAnimationFrame(frame)
  }

  const resize = new ResizeObserver(() => {
    fitCanvas()
    if (!raf) draw()
  })
  resize.observe(canvas)
  fitCanvas()
  draw()

  return {
    roll() {
      cmd = { seq: cmd.seq + 1, kind: D20_MODE_TUMBLE, face: sim.face }
      wake()
    },
    land(face, onSettled) {
      cmd = { seq: cmd.seq + 1, kind: D20_MODE_LAND, face }
      onSettle = onSettled ?? null
      wake()
    },
    snap(face, onSettled) {
      const seq = cmd.seq + 1
      cmd = { seq, kind: D20_MODE_LAND, face }
      sim = { ...restingD20(face), seq, mode: D20_MODE_LAND, landAt: performance.now() }
      onSettle = onSettled ?? null
      wake()
    },
    async setLab(id) {
      const textures = await loadLab(id)
      if (disposed) return
      applyLook(id, textures)
      if (!raf) draw()
    },
    async preload(id) {
      await loadLab(id)
    },
    face: () => sim.face,
    dispose() {
      disposed = true
      if (raf) cancelAnimationFrame(raf)
      resize.disconnect()
      geometry.dispose()
      haloQuad.dispose()
      dieMaterial.dispose()
      haloMaterial.dispose()
      numbers.dispose()
      labArt.forEach((p) => p.then((t) => Object.values(t).forEach((tex) => tex.dispose())).catch(() => {}))
      renderer.dispose()
    },
  }
}
