import type { ShowcaseMonsterData } from './ShowcaseMonster'

/** One of the app's Closet backgrounds. `image` is a path under /lab/a/. */
export interface ShowcaseBackground {
  name: string
  image: string
}

export interface Showcase {
  monsters: ShowcaseMonsterData[]
  backgrounds: ShowcaseBackground[]
}

let manifest: Promise<Showcase> | null = null

/**
 * The pre-rolled showcase monsters and the Closet's backgrounds
 * (showcase.json, from `npm run sync:art`), fetched once and shared by the
 * D20's card and the monsters on the chains.
 */
export function loadShowcase(): Promise<Showcase> {
  manifest ??= import('./showcase.json').then((m) => m.default as Showcase)
  return manifest
}
