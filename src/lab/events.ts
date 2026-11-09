/**
 * The D20 talking to the lab around it: while it tumbles the chains crank
 * (like the app's ChainSpeedContext going 'fast'), and when it moves the page
 * to a new lab a puff of steam goes off behind it.
 */
export type LabEvent = { kind: 'crank'; on: boolean } | { kind: 'steam'; x: number; y: number }

type Listener = (event: LabEvent) => void

const listeners = new Set<Listener>()

export function onLabEvent(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emitLabEvent(event: LabEvent) {
  listeners.forEach((listener) => listener(event))
}
