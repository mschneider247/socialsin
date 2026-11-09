/**
 * What a roll of the D20 shows: one corner of the app (a spotlight), in the
 * lab assistant's voice. Screenshots are the site's own WebP cuts in
 * public/img; add a spotlight here when new ones land.
 */

export type SpotlightMedia =
  | { kind: 'shot'; name: string; alt: string }
  | { kind: 'video'; src: string; poster: string; alt: string }

export interface Spotlight {
  id: string
  title: string
  line: string
  media: SpotlightMedia
}

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
    id: 'arsenal',
    title: 'ZE ARSENAL',
    line: 'Every habit you finish becomes a battle move. Harder tiers forge nastier ones. Zen you spend zem on your rivals.',
    media: { kind: 'shot', name: 'arsenal-attack', alt: 'The Arsenal screen, full of attack moves earned from habits' },
  },
  {
    id: 'heal',
    title: 'FIELD MEDICINE',
    line: 'Not every move is a punch. Heals and buffs, all earned ze honest vay: by doing ze habit.',
    media: { kind: 'shot', name: 'arsenal-heal', alt: 'The Arsenal screen filtered to healing moves' },
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
    line: 'Sixty habits, up to five tiers each. Ze log remembers every day you showed up... and every day you did not.',
    media: { kind: 'shot', name: 'habit-history', alt: 'A habit history calendar with every completed day marked' },
  },
  {
    id: 'rivals',
    title: 'RIVALS',
    line: 'Real Doctors and lab-bred bots, all climbing ze board vhile you read zis.',
    media: { kind: 'shot', name: 'rivals-leaderboard', alt: 'The Rivals leaderboard' },
  },
  {
    id: 'happy',
    title: 'GOOD MOOD',
    line: 'Finish ze habits and ze monster glows. Look at zat face, dahling.',
    media: { kind: 'shot', name: 'monster-happy', alt: 'A happy monster after a day of finished habits' },
  },
  {
    id: 'sad',
    title: 'BAD MOOD',
    line: 'Skip ze habits and ze monster sulks. It is a disgrace!',
    media: { kind: 'shot', name: 'monster-sad', alt: 'A sad monster with the day\'s habits still unchecked' },
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
