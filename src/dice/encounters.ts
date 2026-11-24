/**
 * What a roll of the D20 shows: one corner of the app (a spotlight), in the
 * lab assistant's voice. Screenshots and clips are the site's own cuts
 * (src/media.ts); add a spotlight here when new ones land.
 */
import { clipPoster, clipSrc } from '../media'
import type { ClipName } from '../media'

export type SpotlightMedia =
  | { kind: 'shot'; name: string; alt: string }
  | { kind: 'video'; src: string; poster: string; alt: string }

export interface Spotlight {
  id: string
  title: string
  line: string
  media: SpotlightMedia
}

const clip = (name: ClipName, alt: string): SpotlightMedia => ({
  kind: 'video',
  src: clipSrc(name),
  poster: clipPoster(name),
  alt,
})

export const SPOTLIGHTS: Spotlight[] = [
  {
    id: 'dig',
    title: 'ZE DIG',
    line: 'Your monster tunnels up a pitch-black silo by ze light of one lamp. Termites eat ze ladders, bosses sleep in ze dirt. Keep your habits and ze silo goes easy, dahling.',
    media: {
      kind: 'video',
      src: '/DigDemoShort.mp4',
      poster: '/img/dig-demo-poster.jpg',
      alt: 'A monster digging up through a dark silo by lamplight',
    },
  },
  {
    id: 'termites',
    title: 'TERMITE PACK',
    line: 'Zey chew ze ladders, zey chew ze supports, and zen zey come for ze monster. Build a loadout and squash zem, dahling.',
    media: clip('termite-fight', 'A termite pack fight in the dig, won by knockout'),
  },
  {
    id: 'buried-six',
    title: 'ZE BURIED SIX',
    line: 'Six bosses sleep under ze silo. Vake one and it is a real ranked battle, so bring your best moves.',
    media: clip('boss-fight', 'A buried boss awakens and the monster beats it turn by turn'),
  },
  {
    id: 'escaped',
    title: 'ESCAPED!',
    line: 'Climb ze last ladder and ze monster keeps everyzing it dug. Tomorrow it vants out again.',
    media: clip('escape-levelup', 'The monster climbs out of the silo, escapes and levels up'),
  },
  {
    id: 'boulders',
    title: 'MORE BOULDERS',
    line: 'One ladder from freedom and ze silo starts shaking loose. Climb faster, Doctor.',
    media: { kind: 'shot', name: 'dig-top-ladder', alt: 'The monster at the top of the last ladder as boulders shake loose' },
  },
  {
    id: 'slug',
    title: 'BRAIN SLUG',
    line: 'Hidden in ze trash, deep in ze silo. Brain slugs power your monster\'s class, and zey cannot be bought.',
    media: { kind: 'shot', name: 'dig-brain-slug', alt: 'BRAIN SLUG SECURED: a brain slug found deep in the silo' },
  },
  {
    id: 'combo',
    title: 'HABIT COMBO',
    line: 'Finish a few habits in one stat and ze XP stacks up. Ze monster likes zis very much.',
    media: clip('habit-combo', 'A habit is logged and a HABIT COMBO bursts over the home screen'),
  },
  {
    id: 'voice',
    title: 'ZE TIMER LISTENS',
    line: 'Say START, STOP or LOG and ze habit timer obeys. Your hands stay on ze kettlebell, dahling.',
    media: clip('voice-timer', 'A habit timer started and stopped by voice'),
  },
  {
    id: 'closet',
    title: 'ZE CLOSET',
    line: 'Hats, silo suits, a bone saw. Every stitch drawn by hand, and ze monster vears it all into battle.',
    media: clip('closet', 'Swapping hats and outfits in the closet'),
  },
  {
    id: 'app-d20',
    title: 'ZE OTHER D20',
    line: 'Ze app has a D20 too. Roll it on Home for mimics, ambushes, and a forge zat fuses two habits into one move.',
    media: clip('d20', 'Rolling the in-app D20 and landing ZE FORGE IS HOT'),
  },
  {
    id: 'shield',
    title: 'STORM SHIELD',
    line: 'Save a habit before it slips and ze monster valks into its next fight behind a shield. Ze termites hate zis.',
    media: { kind: 'shot', name: 'storm-shield', alt: 'A battle replay opening with a Storm Shield: the monster entered with +5 shield' },
  },
  {
    id: 'specimen',
    title: 'ZE SPECIMEN',
    line: 'Your monster, its six stats and today\'s habits. It is vatching you, Doctor.',
    media: { kind: 'shot', name: 'home-bio', alt: 'A monster on the home screen, ringed by its six stats' },
  },
  {
    id: 'record',
    title: 'ZE RECORD',
    line: 'Every streak, every battle. Ze lab keeps a file on your monster, and it is getting thick.',
    media: { kind: 'shot', name: 'monster-record', alt: "A monster's full record: stats, streaks and battles" },
  },
  {
    id: 'history',
    title: 'HABIT LOG',
    line: 'Over seventy habits, up to five tiers each. Ze log remembers every day you showed up... and every day you did not.',
    media: { kind: 'shot', name: 'habit-history', alt: 'A habit history calendar with every completed day marked' },
  },
  {
    id: 'rivals',
    title: 'RIVALS',
    line: 'Only real Doctors on ze board, and it remembers every lab-bred bot zey have flattened.',
    media: { kind: 'shot', name: 'rivals-leaderboard', alt: 'The Rivals leaderboard' },
  },
]

/** The line over the result: the number, or what a natural 20 or 1 means in the app. */
export function rollHeadline(face: number): { kicker: string; aside?: string } {
  if (face === 20) {
    return {
      kicker: 'NAT 20 · CRITICAL SUCCESS',
      aside: 'In ze app, a natural 20 puts a bounty on one of your habits. Finish it vithin ze hour for a brain slug.',
    }
  }
  if (face === 1) {
    return {
      kicker: 'NAT 1 · CRITICAL FAIL',
      aside: 'In ze app, a 1 grows teeth. Count your fingers, Doctor.',
    }
  }
  return { kicker: `ROLLED ${face}` }
}

/** A random item that isn't `last`, so two rolls in a row never repeat. */
export function pickFresh<T>(pool: T[], last: T | null): T {
  const fresh = pool.length > 1 ? pool.filter((item) => item !== last) : pool
  return fresh[Math.floor(Math.random() * fresh.length)]
}
