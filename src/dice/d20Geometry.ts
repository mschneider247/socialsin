/**
 * The D20 as a real icosahedron: corners, faces, the number on each face and
 * the orientation that shows a face to the camera.
 *
 * Mirrors src/utils/d20Geometry.ts in the habitBeast app (the parts the
 * three.js die needs); keep in sync. The app draws each face with Skia; here
 * the same geometry becomes a three.js mesh (see d20Scene.ts).
 *
 * View space is right-handed: x right, y up, z toward the viewer. The camera
 * sits on the +z axis, D20_CAM_DIST die radii from the die's center.
 */

export type Vec3 = [number, number, number]
/** Unit quaternion [w, x, y, z]. */
export type Quat = [number, number, number, number]

const PHI = (1 + Math.sqrt(5)) / 2

/** Camera distance in die radii — sets how strong the perspective is. */
export const D20_CAM_DIST = 6

/** Off-screen key light, upper left and in front (unit vector, view space). */
export const D20_LIGHT: Vec3 = [-1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3)]

/** The 12 corners, scaled to unit distance from the center. */
export const D20_VERTS: Vec3[] = (
  [
    [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
    [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
    [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
  ] as Vec3[]
).map((v) => {
  const len = Math.hypot(v[0], v[1], v[2])
  return [v[0] / len, v[1] / len, v[2] / len] as Vec3
})

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]
const normalize = (a: Vec3): Vec3 => {
  const len = Math.hypot(a[0], a[1], a[2])
  return [a[0] / len, a[1] / len, a[2] / len]
}

/**
 * Faces as [apex, left, right] corner indices: counter-clockwise seen from
 * outside, so with the apex up the left corner is bottom-left. The texture's
 * apex, bottom-left and bottom-right corners map onto them in that order.
 */
export const D20_FACES: Array<[number, number, number]> = (() => {
  const edge2 = dot(sub(D20_VERTS[0], D20_VERTS[1]), sub(D20_VERTS[0], D20_VERTS[1]))
  const isEdge = (i: number, j: number) => {
    const d = sub(D20_VERTS[i], D20_VERTS[j])
    return Math.abs(dot(d, d) - edge2) < 1e-6
  }
  const faces: Array<[number, number, number]> = []
  for (let i = 0; i < 12; i++) {
    for (let j = i + 1; j < 12; j++) {
      for (let k = j + 1; k < 12; k++) {
        if (!isEdge(i, j) || !isEdge(j, k) || !isEdge(i, k)) continue
        const a = D20_VERTS[i]
        const n = cross(sub(D20_VERTS[j], a), sub(D20_VERTS[k], a))
        const outward = dot(n, a) > 0
        faces.push(outward ? [i, j, k] : [i, k, j])
      }
    }
  }
  return faces
})()

/** Outward unit normal of each face (its centroid direction). */
export const D20_FACE_NORMALS: Vec3[] = D20_FACES.map(([a, b, c]) =>
  normalize([
    D20_VERTS[a][0] + D20_VERTS[b][0] + D20_VERTS[c][0],
    D20_VERTS[a][1] + D20_VERTS[b][1] + D20_VERTS[c][1],
    D20_VERTS[a][2] + D20_VERTS[b][2] + D20_VERTS[c][2],
  ]),
)

/**
 * The number printed on each face (index = face). Opposite faces sum to 21,
 * like a real D20, and high and low numbers alternate around the die so no
 * side reads as loaded.
 */
export const D20_FACE_NUMBERS: number[] = (() => {
  const n = D20_FACE_NORMALS
  const opposite = n.map((a) => n.findIndex((b) => dot(a, b) < -0.999))
  const order = n
    .map((_, i) => i)
    .sort((i, j) => n[j][1] - n[i][1] || Math.atan2(n[i][0], n[i][2]) - Math.atan2(n[j][0], n[j][2]))
  const numbers = new Array<number>(20).fill(0)
  let next = 1
  for (const i of order) {
    if (numbers[i]) continue
    numbers[i] = next % 2 === 1 ? next : 21 - next
    numbers[opposite[i]] = 21 - numbers[i]
    next++
  }
  return numbers
})()

/** Face index showing number n is D20_FACE_FOR_NUMBER[n] (index 0 unused). */
export const D20_FACE_FOR_NUMBER: number[] = (() => {
  const out = new Array<number>(21).fill(-1)
  D20_FACE_NUMBERS.forEach((num, face) => {
    out[num] = face
  })
  return out
})()

function quatFromRows(r0: Vec3, r1: Vec3, r2: Vec3): Quat {
  const [m00, m01, m02] = r0
  const [m10, m11, m12] = r1
  const [m20, m21, m22] = r2
  const tr = m00 + m11 + m22
  if (tr > 0) {
    const s = Math.sqrt(tr + 1) * 2
    return [0.25 * s, (m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s]
  }
  if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1 + m00 - m11 - m22) * 2
    return [(m21 - m12) / s, 0.25 * s, (m01 + m10) / s, (m02 + m20) / s]
  }
  if (m11 > m22) {
    const s = Math.sqrt(1 + m11 - m00 - m22) * 2
    return [(m02 - m20) / s, (m01 + m10) / s, 0.25 * s, (m12 + m21) / s]
  }
  const s = Math.sqrt(1 + m22 - m00 - m11) * 2
  return [(m10 - m01) / s, (m02 + m20) / s, (m12 + m21) / s, 0.25 * s]
}

/**
 * Resting orientation for each number (index = number, 0 unused): that face
 * square to the camera with its apex up, so the number reads upright.
 */
export const D20_REST_QUATS: Quat[] = (() => {
  const out: Quat[] = [[1, 0, 0, 0]]
  for (let num = 1; num <= 20; num++) {
    const face = D20_FACE_FOR_NUMBER[num]
    const n = D20_FACE_NORMALS[face]
    const [a, b, c] = D20_FACES[face]
    const centroid: Vec3 = [
      (D20_VERTS[a][0] + D20_VERTS[b][0] + D20_VERTS[c][0]) / 3,
      (D20_VERTS[a][1] + D20_VERTS[b][1] + D20_VERTS[c][1]) / 3,
      (D20_VERTS[a][2] + D20_VERTS[b][2] + D20_VERTS[c][2]) / 3,
    ]
    const up = normalize(sub(D20_VERTS[a], centroid))
    const right = cross(up, n)
    // Rows are where the die's axes go: right → +x, up → +y, normal → +z.
    out.push(quatFromRows(right, up, n))
  }
  return out
})()

// ── Texture space ─────────────────────────────────────────────────────────
// The face art (public/lab/dice) is laid out on a 600×600 square: an
// equilateral triangle, apex up, with the number at its center. Each lab's
// set has its own corners (see labs.ts).

export const D20_TEX_SIZE = 600

export interface D20TexCorners {
  apex: [number, number]
  left: [number, number]
  right: [number, number]
}

/** Steam Lab's corners — the default. */
export const D20_TEX_CORNERS: D20TexCorners = { apex: [301, 58.5], left: [18, 549], right: [580, 549] }
/** Center of the number disc. */
export const D20_TEX_NUMBER_CENTER: [number, number] = [300, 386]

/** Steam's number greys (0–255): [facing away, square on, toward the light]. */
export const D20_NUMBER_GREYS: [number, number, number] = [58, 140, 228]

// ── Per-frame math ────────────────────────────────────────────────────────

/** Hamilton product a ⊗ b (apply b, then a). */
export function quatMul(a: Quat, b: Quat): Quat {
  return [
    a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
    a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
    a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
    a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
  ]
}

export function quatNormalize(q: Quat): Quat {
  const len = Math.hypot(q[0], q[1], q[2], q[3]) || 1
  return [q[0] / len, q[1] / len, q[2] / len, q[3] / len]
}

/** Rotate q by angular velocity w (rad/s, view space) for dt seconds. */
export function quatIntegrate(q: Quat, w: Vec3, dt: number): Quat {
  const speed = Math.hypot(w[0], w[1], w[2])
  if (speed < 1e-9) return q
  const half = (speed * dt) / 2
  const s = Math.sin(half) / speed
  return quatNormalize(quatMul([Math.cos(half), w[0] * s, w[1] * s, w[2] * s], q))
}

/** Rotation vector (axis × angle, view space) that turns q into target the short way. */
export function quatError(q: Quat, target: Quat): Vec3 {
  let d = quatMul(target, [q[0], -q[1], -q[2], -q[3]])
  if (d[0] < 0) d = [-d[0], -d[1], -d[2], -d[3]]
  const s = Math.hypot(d[1], d[2], d[3])
  if (s < 1e-6) return [2 * d[1], 2 * d[2], 2 * d[3]]
  const angle = 2 * Math.atan2(s, d[0])
  return [(d[1] / s) * angle, (d[2] / s) * angle, (d[3] / s) * angle]
}
