import { D20_NUMBER_GREYS, D20_TEX_CORNERS } from '../dice/d20Geometry'
import type { D20TexCorners } from '../dice/d20Geometry'

/**
 * The three lab styles from the app: Steam, Chem and Bio. A lab sets the
 * page's background, colors, panel skins and chains (index.css, keyed off
 * <html data-lab>) and the D20's skin. index.html picks one at random for
 * each visit and every roll of the die moves to another.
 */
export type LabId = 'steam' | 'chem' | 'bio'

export const LAB_IDS: LabId[] = ['steam', 'chem', 'bio']

/** Browser chrome color per lab (the app's backgroundDark); index.html sets the first. */
const THEME_COLORS: Record<LabId, string> = { steam: '#120e08', chem: '#060a12', bio: '#0e1d0a' }

export function currentLab(): LabId {
  const lab = document.documentElement.dataset.lab
  return LAB_IDS.includes(lab as LabId) ? (lab as LabId) : 'steam'
}

export function setLab(lab: LabId) {
  document.documentElement.dataset.lab = lab
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[lab])
}

export function otherLab(lab: LabId): LabId {
  const others = LAB_IDS.filter((id) => id !== lab)
  return others[Math.floor(Math.random() * others.length)]
}

export const labBackground = (lab: LabId) => `/lab/bg/${lab}.webp`

/** Panel skins, 1–4 framed (buttons, chips), 5–8 frameless (cards). */
export const labPanel = (lab: LabId, size: 'small' | 'large') =>
  `/lab/panels/${lab}${(size === 'small' ? 1 : 5) + Math.floor(Math.random() * 4)}.webp`

/**
 * One lab's D20. Mirrors D20_SKINS in the app's src/constants/diceSkins.ts;
 * keep in sync.
 */
export interface D20Look {
  mid: string
  light: string
  shadow: string
  corners: D20TexCorners
  /** Inner light, RGB 0–1: the hot heart, the main color, the rim. */
  hot: [number, number, number]
  core: [number, number, number]
  rim: [number, number, number]
  /** Glow along the seams between faces, 0–1 (the opaque Bio and Chem art needs it). */
  seams: number
  /** Number greys, 0–255: [facing away from the light, square on, toward it]. */
  numberGreys: [number, number, number]
  /** Number size relative to the base size (sets with no disc have room to go bigger). */
  numberScale: number
}

/** Bio and Chem sets reach ~4px further right than Steam's. */
const WIDE_CORNERS: D20TexCorners = { apex: [301, 58.5], left: [18, 549], right: [584, 549] }

const dieArt = (lab: LabId) => ({
  mid: `/lab/dice/${lab}-mid.webp`,
  light: `/lab/dice/${lab}-light.webp`,
  shadow: `/lab/dice/${lab}-shadow.webp`,
})

export const D20_LOOKS: Record<LabId, D20Look> = {
  steam: {
    ...dieArt('steam'),
    corners: D20_TEX_CORNERS,
    hot: [1, 0.96, 0.72],
    core: [1, 0.8, 0.16],
    rim: [0.78, 0.32, 0.03],
    seams: 0,
    numberGreys: D20_NUMBER_GREYS,
    numberScale: 1,
  },
  bio: {
    ...dieArt('bio'),
    corners: WIDE_CORNERS,
    hot: [1, 0.86, 0.6],
    core: [1, 0.52, 0.06],
    rim: [0.78, 0.2, 0.02],
    seams: 0.7,
    // Solid black — the painted faces have no number disc to sit on.
    numberGreys: [0, 0, 0],
    numberScale: 1.25,
  },
  chem: {
    ...dieArt('chem'),
    corners: WIDE_CORNERS,
    hot: [0.94, 0.8, 1],
    core: [0.66, 0.26, 1],
    rim: [0.36, 0.06, 0.62],
    seams: 0.7,
    // Bright white, a touch dimmer turned away from the light.
    numberGreys: [215, 240, 255],
    numberScale: 1,
  },
}
