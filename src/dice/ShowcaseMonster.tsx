import { useEffect, useState } from 'react'

const EYE_STATES = ['open', 'partial', 'partialLeft', 'partialRight', 'closed'] as const
type EyeState = (typeof EYE_STATES)[number]
const RESTING_EYES: EyeState[] = ['open', 'partial', 'partialLeft', 'partialRight']

/** One pre-rolled outfit from showcase.json (scripts/sync-app-art.mjs). */
export interface ShowcaseMonsterData {
  species: string
  wearing: string[]
  /** Bottom to top, everything but the eyes. Paths under /lab/a/. */
  layers: string[]
  eyes: Record<EyeState, string>
}

export const layerUrl = (path: string) => `/lab/a/${path}`

/** Every image a monster draws, for preloading before it appears. */
export const monsterUrls = (monster: ShowcaseMonsterData) =>
  [...monster.layers, ...Object.values(monster.eyes)].map(layerUrl)

const between = (min: number, max: number) => min + Math.random() * (max - min)
const pick = <T,>(pool: T[]) => pool[Math.floor(Math.random() * pool.length)]

/**
 * A dressed monster from the app, drawn the way the app stacks it: full-frame
 * layers, one on another. It blinks and looks around like the app's
 * login-screen parade (useFriendlyIdleFace): every eye state is stacked and
 * only one shows, so a blink never waits on an image load.
 */
export function ShowcaseMonster({ monster, still }: { monster: ShowcaseMonsterData; still: boolean }) {
  const [eyes, setEyes] = useState<EyeState>('partial')

  useEffect(() => {
    setEyes('partial')
    if (still) return
    let timer = 0
    const tick = () => {
      if (Math.random() < 0.4) {
        setEyes('closed')
        timer = window.setTimeout(() => {
          setEyes(pick(RESTING_EYES))
          timer = window.setTimeout(tick, between(1800, 3600))
        }, 140)
        return
      }
      setEyes(pick(RESTING_EYES))
      timer = window.setTimeout(tick, between(1800, 3600))
    }
    timer = window.setTimeout(tick, between(900, 1800))
    return () => window.clearTimeout(timer)
  }, [monster, still])

  return (
    <div className="specimen-figure">
      {monster.layers.map((layer) => (
        <img key={layer} src={layerUrl(layer)} alt="" decoding="async" />
      ))}
      {EYE_STATES.map((state) => (
        <img
          key={state}
          src={layerUrl(monster.eyes[state])}
          alt=""
          decoding="async"
          style={{ opacity: state === eyes ? 1 : 0 }}
        />
      ))}
    </div>
  )
}
