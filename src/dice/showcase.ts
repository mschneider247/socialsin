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
 * (public/lab/showcase.json, from `npm run sync:art`), fetched once and
 * shared by the D20's card and the monsters on the chains. The static pages
 * read the same file (/theme/specimen.js).
 */
export function loadShowcase(): Promise<Showcase> {
  manifest ??= fetch('/lab/showcase.json').then((response) => {
    if (!response.ok) throw new Error(`showcase.json: ${response.status}`)
    return response.json() as Promise<Showcase>
  })
  // A failed fetch can be retried on the next roll.
  manifest.catch(() => {
    manifest = null
  })
  return manifest
}
