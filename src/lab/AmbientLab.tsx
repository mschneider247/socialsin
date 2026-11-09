import { memo, useCallback, useEffect, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import { loadShowcase } from '../dice/showcase'
import { ShowcaseMonster } from '../dice/ShowcaseMonster'
import type { ShowcaseMonsterData } from '../dice/ShowcaseMonster'
import { pickFresh } from '../dice/encounters'
import { onLabEvent } from './events'
import { useReducedMotion } from './useReducedMotion'
import './ambient.css'

/**
 * The app's ambient lab, behind the whole page:
 *  - three ropes, chains or vines (by lab), scrolling forever. Mirrors the
 *    app's ChainOverlay: same columns, directions and speed (one 4-link
 *    period per 3.8s, cranked to 1.2s while the D20 tumbles),
 *  - small dressed monsters riding them. Mirrors the app's ClothingOverlay:
 *    up to 3 at once, ±12° tilt, at the chain's own speed so they look stuck
 *    to it. They wear the clothing; a garment alone sits off-center (it's
 *    drawn where it would hang on a monster), so the app never floats one,
 *  - puffs of steam now and then (the app's SteamOverlay), and one behind
 *    the D20 whenever it moves the page to a new lab.
 * The chains are in the prerendered HTML; everything else starts after load.
 * With reduced motion the chains hold still and nothing drifts or puffs.
 */

/** Columns and directions — kept in sync with the app's ChainOverlay. */
const CHAINS: { pct: number; up: boolean }[] = [
  { pct: 12, up: false },
  { pct: 70, up: true },
  { pct: 80, up: false },
]
/** The app's CHAIN_SCROLL_MS: one period per this long, slow and cranked. */
const CHAIN_MS = { slow: 3800, fast: 1200 }

const PIECE_OPACITY = 0.6
const MAX_PIECES = 3
/** The app waits 6–14s between pieces; a site visit is short, so the first comes sooner. */
const FIRST_PIECE_MS = [1500, 3500]
const PIECE_GAP_MS = [6000, 14000]
/** The app's steam comes every 45–180s; on the site, once early, then every 25–60s. */
const FIRST_STEAM_MS = [6000, 12000]
const STEAM_GAP_MS = [25000, 60000]

const between = ([min, max]: number[]) => min + Math.random() * (max - min)

interface Piece {
  id: number
  monster: ShowcaseMonsterData
  pct: number
  up: boolean
  rotate: number
  /** At the chain's speed, across the viewport plus the piece's own height. */
  duration: number
}

interface Puff {
  id: number
  x: number
  y: number
}

/** Current px sizes from the CSS (--link, --piece, --puff change at the phone breakpoint). */
function cssPx(name: string) {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0
}

const DriftPiece = memo(function DriftPiece({
  piece,
  rate,
  onDone,
}: {
  piece: Piece
  rate: MutableRefObject<number>
  onDone: (id: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const pieceH = (cssPx('--piece') * 4) / 3
  const startY = piece.up ? window.innerHeight : -pieceH
  const endY = piece.up ? -pieceH : window.innerHeight
  const at = (y: number) => `translateY(${y}px) rotate(${piece.rotate}deg)`

  useEffect(() => {
    const anim = ref.current!.animate([{ transform: at(startY) }, { transform: at(endY) }], {
      duration: piece.duration,
      easing: 'linear',
      fill: 'forwards',
    })
    anim.playbackRate = rate.current
    anim.onfinish = () => onDone(piece.id)
    return () => anim.cancel()
    // Each piece runs its route once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={ref}
      className="drift-piece"
      style={{ left: `calc(${piece.pct}% - var(--piece) / 2 + var(--link) / 2)`, transform: at(startY), opacity: PIECE_OPACITY }}
    >
      <ShowcaseMonster monster={piece.monster} still={false} />
    </div>
  )
})

export default function AmbientLab() {
  const reducedMotion = useReducedMotion()
  const [pieces, setPieces] = useState<Piece[]>([])
  const [puffs, setPuffs] = useState<Puff[]>([])
  const rootRef = useRef<HTMLDivElement>(null)
  const rate = useRef(1)
  const nextId = useRef(0)
  const live = useRef({ count: 0, last: null as ShowcaseMonsterData | null })
  live.current.count = pieces.length

  const puffAt = useCallback((x: number, y: number) => {
    setPuffs((prev) => [...prev, { id: nextId.current++, x, y }])
  }, [])

  // Monsters on the chains.
  useEffect(() => {
    if (reducedMotion) return
    let cancelled = false
    let timer = 0
    const spawn = async () => {
      const { monsters } = await loadShowcase().catch(() => ({ monsters: [] as ShowcaseMonsterData[] }))
      if (cancelled) return
      if (!document.hidden && live.current.count < MAX_PIECES && monsters.length > 0) {
        const chain = CHAINS[Math.floor(Math.random() * CHAINS.length)]
        const monster = pickFresh(monsters, live.current.last)
        live.current.last = monster
        const distance = window.innerHeight + (cssPx('--piece') * 4) / 3
        const pxPerMs = (cssPx('--link') * 4) / CHAIN_MS.slow
        const piece: Piece = {
          id: nextId.current++,
          monster,
          pct: chain.pct,
          up: chain.up,
          rotate: Math.random() < 0.5 ? 12 : -12,
          duration: distance / pxPerMs,
        }
        setPieces((prev) => [...prev, piece])
      }
      timer = window.setTimeout(spawn, between(PIECE_GAP_MS))
    }
    timer = window.setTimeout(spawn, between(FIRST_PIECE_MS))
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      setPieces([])
    }
  }, [reducedMotion])

  // Ambient steam.
  useEffect(() => {
    if (reducedMotion) return
    let timer = 0
    const burst = () => {
      if (!document.hidden) {
        const size = cssPx('--puff')
        puffAt(Math.random() * Math.max(0, window.innerWidth - size), Math.random() * Math.max(0, window.innerHeight - (size * 4) / 3))
      }
      timer = window.setTimeout(burst, between(STEAM_GAP_MS))
    }
    timer = window.setTimeout(burst, between(FIRST_STEAM_MS))
    return () => window.clearTimeout(timer)
  }, [reducedMotion, puffAt])

  // The D20: crank the chains while it tumbles, steam where it lands a new lab.
  useEffect(
    () =>
      onLabEvent((event) => {
        if (event.kind === 'steam') {
          if (reducedMotion) return
          const size = cssPx('--puff')
          puffAt(event.x - size / 2, event.y - (size * 4) / 3 / 2)
          return
        }
        rate.current = event.on ? CHAIN_MS.slow / CHAIN_MS.fast : 1
        rootRef.current
          ?.getAnimations({ subtree: true })
          .filter((anim) => {
            const target = (anim.effect as KeyframeEffect | null)?.target
            return target instanceof Element && target.matches('.chain-strip, .drift-piece')
          })
          .forEach((anim) => anim.updatePlaybackRate(rate.current))
      }),
    [reducedMotion, puffAt],
  )

  const removePiece = useCallback((id: number) => setPieces((prev) => prev.filter((p) => p.id !== id)), [])
  const removePuff = (id: number) => setPuffs((prev) => prev.filter((p) => p.id !== id))

  return (
    <div ref={rootRef} className="ambient" aria-hidden="true">
      <div className="ambient-chains">
        {CHAINS.map((chain) => (
          <div key={chain.pct} className="chain" style={{ left: `${chain.pct}%` }}>
            <div className="chain-strip" data-dir={chain.up ? 'up' : 'down'} />
          </div>
        ))}
      </div>
      {pieces.map((piece) => (
        <DriftPiece key={piece.id} piece={piece} rate={rate} onDone={removePiece} />
      ))}
      {puffs.map((puff) => (
        <div
          key={puff.id}
          className="steam-puff"
          style={{ left: puff.x, top: puff.y }}
          onAnimationEnd={() => removePuff(puff.id)}
        >
          <div className="steam-puff__frames" />
        </div>
      ))}
    </div>
  )
}
