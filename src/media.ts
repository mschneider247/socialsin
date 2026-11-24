/**
 * Phone screenshots and gameplay clips, shared by the gallery, the feature
 * cards and the D20 card.
 *
 * Screenshots live in public/img as 400w and 800w WebP. The 6.0.0 set was cut
 * from the app's store shoot (habitBeast/store-assets/6.0.0/tools/frames,
 * iPhone 1320×2868, the clean frames without the lab assistant's bubbles).
 * The three older ones came from 1080×2340 Android captures, so they're a hair
 * shorter.
 *
 * Clips live in public/clips (540×1080, silent, from store-assets/6.0.0/video/web)
 * with a WebP poster each in public/img/clip-<name>-poster.webp.
 */

export const SHOT_WIDTH = 800

const ANDROID_SHOTS = new Set(['monster-record', 'rivals-leaderboard', 'habit-history'])

/** The 800w cut's height, so the page reserves the right space before it loads. */
export const shotHeight = (name: string) => (ANDROID_SHOTS.has(name) ? 1734 : 1738)

export const shotSrc = (name: string, width: 400 | 800 = 800) => `/img/${name}-${width}.webp`
export const shotSrcSet = (name: string) => `${shotSrc(name, 400)} 400w, ${shotSrc(name, 800)} 800w`

export type ClipName =
  | 'habit-combo'
  | 'voice-timer'
  | 'termite-fight'
  | 'boss-fight'
  | 'escape-levelup'
  | 'd20'
  | 'closet'

export const CLIP_WIDTH = 540
export const CLIP_HEIGHT = 1080

export const clipSrc = (name: ClipName) => `/clips/${name}.mp4`
export const clipPoster = (name: ClipName) => `/img/clip-${name}-poster.webp`
