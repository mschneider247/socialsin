import { D20_REST_QUATS, quatError, quatIntegrate } from './d20Geometry'
import type { Quat, Vec3 } from './d20Geometry'

/**
 * How the Home D20 moves (Nov 2026). A roll is a string of hops: each time
 * the die comes down it bounces back up spinning about a fresh, mostly
 * screen-flat axis, so it tumbles end over end instead of spinning like a
 * top. When the roll ends, a damped spring steers it onto the landing face
 * from whatever it was doing, so the hand-off never jerks. It settles with a
 * small rock, then the inner light flares. stepD20 is pure, so Jest can run
 * whole rolls. d20Scene.ts calls it once a frame.
 *
 * Mirrors src/utils/d20Motion.ts in the habitBeast app; keep in sync.
 *
 * Distances are in die radii, time in seconds unless named *Ms.
 */

const GRAVITY = 70
/** Launch speed of each hop (~0.5 radii high, ~240ms in the air). */
const HOP_KICK = 8.5
/** Spin per hop, rad/s (~2.4 turns a second). */
const TUMBLE_SPIN = 15
/** Landing spring: stiffness and damping (slightly under-damped → one small rock). */
const LAND_K = 130
const LAND_C = 2 * 0.72 * Math.sqrt(LAND_K)
/** On landing, each bounce keeps this much of its speed, and the table eats spin. */
const RESTITUTION = 0.35
const LANDING_SPIN_KEPT = 0.5
/** The flare starts once the landing face is this close (rad) and the die is down. */
const FLARE_START_ERR = 0.2
export const D20_FLARE_MS = 700
/** Hard stop: a landing snaps home after this long, whatever the spring says. */
export const D20_LAND_MAX_MS = 1400

export const D20_MODE_REST = 0
export const D20_MODE_TUMBLE = 1
export const D20_MODE_LAND = 2

export interface D20Sim {
  q: Quat
  /** Angular velocity, rad/s, view space. */
  w: Vec3
  /** Hop height and its speed. */
  h: number
  vh: number
  mode: number
  /** Face being landed on (or last landed). */
  face: number
  /** Last command handled. */
  seq: number
  /** Timestamp of the previous step, ms; -1 before the first. */
  t: number
  landAt: number
  flareAt: number
  /** Inner light on top of its steady level: >0 brighter, <0 dimmer. */
  glow: number
}

/** Written by the JS thread; `seq` bumps on every new order. */
export interface D20Command {
  seq: number
  kind: number
  face: number
}

export function restingD20(face: number): D20Sim {
  return {
    q: D20_REST_QUATS[face],
    w: [0, 0, 0],
    h: 0,
    vh: 0,
    mode: D20_MODE_REST,
    face,
    seq: 0,
    t: -1,
    landAt: -1,
    flareAt: -1,
    glow: 0,
  }
}

/** A fresh tumble: about an axis mostly in the screen plane, so the die flips over. */
function tumbleSpin(rand: () => number): Vec3 {
  const a = rand() * Math.PI * 2
  const z = (rand() - 0.5) * 0.6
  const len = Math.hypot(1, z)
  const speed = TUMBLE_SPIN * (0.85 + 0.3 * rand())
  return [(Math.cos(a) / len) * speed, (Math.sin(a) / len) * speed, (z / len) * speed]
}

/** Landing flare envelope, 0 → 1 → 0 over D20_FLARE_MS. */
function flareEnvelope(ms: number): number {
  const t = ms / D20_FLARE_MS
  if (t <= 0 || t >= 1) return 0
  return t < 0.12 ? t / 0.12 : Math.exp(-(t - 0.12) * 5.5)
}

/** Flare strength by result: a natural 20 blazes, a natural 1 gutters. */
function flarePeak(face: number): number {
  if (face === 20) return 1.4
  if (face === 1) return -0.65
  return 0.6
}

export function stepD20(prev: D20Sim, cmd: D20Command, now: number, rand: () => number): D20Sim {
  const s: D20Sim = {...prev}
  const dt = prev.t < 0 ? 1 / 60 : Math.min(Math.max((now - prev.t) / 1000, 0), 1 / 30)
  s.t = now

  if (cmd.seq !== prev.seq) {
    s.seq = cmd.seq
    if (cmd.kind === D20_MODE_TUMBLE) {
      // A roll that takes over a roll in flight just keeps tumbling.
      if (s.mode !== D20_MODE_TUMBLE || s.h <= 0) {
        s.vh = HOP_KICK
        s.w = tumbleSpin(rand)
      }
      s.mode = D20_MODE_TUMBLE
      s.flareAt = -1
    } else if (cmd.kind === D20_MODE_LAND) {
      s.mode = D20_MODE_LAND
      s.face = cmd.face
      s.landAt = now
      s.flareAt = -1
    }
  }

  if (s.mode === D20_MODE_REST) {
    s.glow = 0
    return s
  }

  // Hops — only while airborne; a die sitting on the table stays put.
  if (s.h > 0 || s.vh > 0) {
    s.vh -= GRAVITY * dt
    s.h += s.vh * dt
    if (s.h <= 0) {
      s.h = 0
      if (s.mode === D20_MODE_TUMBLE) {
        s.vh = HOP_KICK * (0.85 + 0.3 * rand())
        s.w = tumbleSpin(rand)
      } else if (-s.vh > 1.5) {
        s.vh = -s.vh * RESTITUTION
        s.w = [s.w[0] * LANDING_SPIN_KEPT, s.w[1] * LANDING_SPIN_KEPT, s.w[2] * LANDING_SPIN_KEPT]
      } else {
        s.vh = 0
      }
    }
  }

  // Spin — free while tumbling, sprung toward the landing face after.
  const target = D20_REST_QUATS[s.face]
  let errLen = 0
  if (s.mode === D20_MODE_LAND) {
    const err = quatError(s.q, target)
    errLen = Math.hypot(err[0], err[1], err[2])
    s.w = [
      s.w[0] + (LAND_K * err[0] - LAND_C * s.w[0]) * dt,
      s.w[1] + (LAND_K * err[1] - LAND_C * s.w[1]) * dt,
      s.w[2] + (LAND_K * err[2] - LAND_C * s.w[2]) * dt,
    ]
  }
  s.q = quatIntegrate(s.q, s.w, dt)

  // Inner light: it burns brighter while the die is loose, flickering.
  let glow = 0
  if (s.mode === D20_MODE_TUMBLE) {
    glow = 0.3 + 0.12 * Math.sin(now / 37) * Math.sin(now / 59)
  } else {
    if (s.flareAt < 0 && errLen < FLARE_START_ERR && s.h < 0.05) s.flareAt = now
    if (s.flareAt >= 0) glow = flarePeak(s.face) * flareEnvelope(now - s.flareAt)
    const settled = errLen < 0.004 && Math.hypot(s.w[0], s.w[1], s.w[2]) < 0.05 && s.h === 0 && s.vh === 0
    const flareDone = s.flareAt >= 0 && now - s.flareAt >= D20_FLARE_MS
    if ((settled && flareDone) || now - s.landAt >= D20_LAND_MAX_MS) {
      return {...s, q: target, w: [0, 0, 0], h: 0, vh: 0, mode: D20_MODE_REST, glow: 0}
    }
  }
  s.glow = prev.glow + (glow - prev.glow) * Math.min(1, dt * 14)
  return s
}
