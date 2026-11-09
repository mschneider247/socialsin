import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { D20Handle } from './d20Scene'
import { SPOTLIGHTS, pickFresh, rollHeadline } from './encounters'
import type { Spotlight } from './encounters'
import { emitLabEvent } from '../lab/events'
import { D20_LOOKS, currentLab, labBackground, labPanel, otherLab, setLab } from '../lab/labs'
import type { LabId } from '../lab/labs'
import { ShowcaseMonster, layerUrl, monsterUrls } from './ShowcaseMonster'
import type { ShowcaseMonsterData } from './ShowcaseMonster'
import { loadShowcase } from './showcase'
import type { Showcase, ShowcaseBackground } from './showcase'
import { useReducedMotion } from '../lab/useReducedMotion'
import './dice.css'

/**
 * Ze D20: the app's Home die, under the site header a third of the way
 * across. It pops up a moment after the page loads. Each roll cranks the
 * chains (src/lab/AmbientLab) and moves the page to another lab (background,
 * colors, chains, panel skins, die skin) in a puff of steam while the die is
 * still a blur, lands, then opens a card with a random dressed monster and a
 * random corner of the app.
 *
 * Everything heavy (three.js, the monster manifest) loads after the page
 * has, and nothing here is in the prerendered HTML.
 */

/** After the page has loaded, the die waits this long before it pops up. */
const POP_DELAY_MS = 1800
/** The pop-in tumble before the die first comes to rest. */
const POP_TUMBLE_MS = 900
/** A roll's tumble before the landing (the app's DICE_TUMBLE_MS). */
const TUMBLE_MS = 950
/** From the landing order to the card: the die is down and its light flaring. */
const LAND_TO_CARD_MS = 550
/** Until the first roll, the die hops now and then to say it's there. */
const NUDGE_EVERY_MS = 9000
const NUDGE_TUMBLE_MS = 380
/** Longest a roll waits for the next lab's art before landing anyway. */
const PRELOAD_CAP_MS = 2500

/** Screenshot sizes in the card: the 400w cut covers it even on 2× screens. */
const SHOT_SIZES = '(max-width: 600px) 40vw, 160px'

interface Result {
  face: number
  spotlight: Spotlight
  monster: ShowcaseMonsterData
  /** One of the app's Closet backgrounds, behind the monster. */
  background: ShowcaseBackground | null
  cardSkin: string
  buttonSkin: string
}

const randomFace = () => 1 + Math.floor(Math.random() * 20)
const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

function loadImage(src: string, srcSet?: string, sizes?: string) {
  return new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    if (sizes) img.sizes = sizes
    if (srcSet) img.srcset = srcSet
    img.src = src
  })
}

const shotSrc = (name: string) => `/img/${name}-400.webp`
const shotSrcSet = (name: string) => `/img/${name}-400.webp 400w, /img/${name}-800.webp 800w`

export default function D20Dock({ links }: { links: { ios: string; android: string } }) {
  const [mounted, setMounted] = useState(false)
  const [shown, setShown] = useState(false)
  // No WebGL: a flat face of the die stands in, and rolling still works.
  const [flat, setFlat] = useState(false)
  const [flatLab, setFlatLab] = useState<LabId>('steam')
  const [rolling, setRolling] = useState(false)
  const [hasRolled, setHasRolled] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [fadeFrom, setFadeFrom] = useState<{ lab: LabId; key: number } | null>(null)
  const reducedMotion = useReducedMotion()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dieButtonRef = useRef<HTMLButtonElement>(null)
  const cardRef = useRef<HTMLElement>(null)
  const die = useRef<D20Handle | null>(null)
  const last = useRef<{
    spotlight: Spotlight | null
    monster: ShowcaseMonsterData | null
    background: ShowcaseBackground | null
  }>({ spotlight: null, monster: null, background: null })
  const busy = useRef(false)
  const still = useRef(false)
  still.current = reducedMotion

  useEffect(() => setMounted(true), [])

  // Pop up once the page has finished loading.
  useEffect(() => {
    if (!mounted) return
    let cancelled = false
    let timer = 0
    const start = () => {
      timer = window.setTimeout(async () => {
        loadShowcase().catch(() => {})
        const lab = currentLab()
        try {
          const { createD20 } = await import('./d20Scene')
          const handle = await createD20(canvasRef.current!, lab, randomFace())
          if (cancelled) {
            handle.dispose()
            return
          }
          die.current = handle
        } catch {
          if (cancelled) return
          setFlat(true)
        }
        setFlatLab(lab)
        setShown(true)
        if (die.current && !still.current) {
          die.current.roll()
          window.setTimeout(() => die.current?.land(randomFace()), POP_TUMBLE_MS)
        }
      }, POP_DELAY_MS)
    }
    if (document.readyState === 'complete') start()
    else window.addEventListener('load', start, { once: true })
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      window.removeEventListener('load', start)
      die.current?.dispose()
      die.current = null
    }
  }, [mounted])

  // Until the visitor rolls, a little hop every so often.
  useEffect(() => {
    if (!shown || flat || reducedMotion || hasRolled) return
    const id = window.setInterval(() => {
      if (busy.current || document.hidden || !die.current) return
      die.current.roll()
      window.setTimeout(() => {
        if (!busy.current) die.current?.land(randomFace())
      }, NUDGE_TUMBLE_MS)
    }, NUDGE_EVERY_MS)
    return () => window.clearInterval(id)
  }, [shown, flat, reducedMotion, hasRolled])

  const roll = useCallback(async () => {
    if (busy.current) return
    busy.current = true
    setHasRolled(true)
    setRolling(true)
    setResult(null)
    const handle = die.current
    const instant = still.current || !handle
    if (handle && !instant) handle.roll()
    if (!instant) emitLabEvent({ kind: 'crank', on: true })

    const face = randomFace()
    const fromLab = currentLab()
    const lab = otherLab(fromLab)
    const spotlight = pickFresh(SPOTLIGHTS, last.current.spotlight)
    const showcase = await loadShowcase().catch((): Showcase => ({ monsters: [], backgrounds: [] }))
    const monster = pickFresh(showcase.monsters, last.current.monster)
    const background = showcase.backgrounds.length > 0 ? pickFresh(showcase.backgrounds, last.current.background) : null
    last.current = { spotlight, monster, background }
    const cardSkin = labPanel(lab, 'large')
    const buttonSkin = labPanel(lab, 'small')

    // Fetch the next lab and the card's art while the die tumbles.
    const preload = Promise.all([
      handle?.preload(lab).catch(() => {}),
      loadImage(labBackground(lab)),
      loadImage(cardSkin),
      loadImage(buttonSkin),
      ...(monster ? monsterUrls(monster).map((url) => loadImage(url)) : []),
      background ? loadImage(layerUrl(background.image)) : null,
      spotlight.media.kind === 'shot'
        ? loadImage(shotSrc(spotlight.media.name), shotSrcSet(spotlight.media.name), SHOT_SIZES)
        : loadImage(spotlight.media.poster),
    ])
    await Promise.all([Promise.race([preload, wait(PRELOAD_CAP_MS)]), wait(instant ? 0 : TUMBLE_MS / 2)])

    // The lab changes while the die is still a blur, in a puff of steam.
    setFadeFrom({ lab: fromLab, key: Date.now() })
    setLab(lab)
    setFlatLab(lab)
    const at = dieButtonRef.current?.getBoundingClientRect()
    if (at) emitLabEvent({ kind: 'steam', x: at.left + at.width / 2, y: at.top + at.height / 2 })
    await handle?.setLab(lab).catch(() => {})
    await wait(instant ? 0 : TUMBLE_MS / 2)

    if (handle) {
      if (still.current) handle.snap(face)
      else handle.land(face)
    }
    await wait(instant ? 0 : LAND_TO_CARD_MS)
    emitLabEvent({ kind: 'crank', on: false })
    if (monster) setResult({ face, spotlight, monster, background, cardSkin, buttonSkin })
    setRolling(false)
    busy.current = false
  }, [])

  const close = useCallback(() => {
    setResult(null)
    dieButtonRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    if (!result) return
    cardRef.current?.focus({ preventScroll: true })
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [result, close])

  if (!mounted) return null

  const headline = result ? rollHeadline(result.face) : null
  const media = result?.spotlight.media

  return (
    <>
      {fadeFrom && (
        <div
          key={fadeFrom.key}
          className="lab-fade"
          style={{ backgroundImage: `url(${labBackground(fadeFrom.lab)})` }}
          onAnimationEnd={() => setFadeFrom(null)}
          aria-hidden="true"
        />
      )}

      {result && headline && media && (
        <section
          ref={cardRef}
          className="d20-card"
          role="dialog"
          aria-labelledby="d20-card-title"
          tabIndex={-1}
          data-nat={result.face === 20 ? '20' : result.face === 1 ? '1' : undefined}
          style={{ '--skin': `url(${result.cardSkin})` } as CSSProperties}
        >
          <header className="d20-card__head">
            <p className="d20-card__kicker">{headline.kicker}</p>
            <h2 id="d20-card-title" className="d20-card__title">
              {result.spotlight.title}
            </h2>
            <button type="button" className="d20-card__close" onClick={close} aria-label="Close">
              ×
            </button>
          </header>

          <div className="d20-card__body">
            <figure className="d20-card__specimen">
              <div
                className="specimen-stage"
                role="img"
                aria-label={`${result.monster.species}, a HabitBeast monster${result.background ? ` in the ${result.background.name}` : ''}`}
              >
                {result.background && <img className="specimen-bg" src={layerUrl(result.background.image)} alt="" />}
                <ShowcaseMonster monster={result.monster} still={reducedMotion} />
              </div>
              <figcaption>
                <span className="specimen-label">SPECIMEN</span>
                <span className="specimen-name">{result.monster.species.toUpperCase()}</span>
                {result.monster.wearing.length > 0 && (
                  <span className="specimen-wearing">{result.monster.wearing.join(' · ')}</span>
                )}
              </figcaption>
            </figure>

            <figure className="d20-card__shot">
              {media.kind === 'shot' ? (
                <img
                  src={shotSrc(media.name)}
                  srcSet={shotSrcSet(media.name)}
                  sizes={SHOT_SIZES}
                  width={800}
                  height={1734}
                  alt={media.alt}
                />
              ) : (
                <video
                  src={media.src}
                  poster={media.poster}
                  autoPlay={!reducedMotion}
                  controls={reducedMotion}
                  muted
                  loop
                  playsInline
                  aria-label={media.alt}
                />
              )}
            </figure>
          </div>

          <p className="d20-card__line">{result.spotlight.line}</p>
          {headline.aside && <p className="d20-card__aside">{headline.aside}</p>}

          <div className="d20-card__actions">
            <button
              type="button"
              className="d20-again"
              onClick={roll}
              style={{ '--skin': `url(${result.buttonSkin})` } as CSSProperties}
            >
              ROLL AGAIN
            </button>
            <a href={links.ios} className="d20-store" target="_blank" rel="noopener noreferrer">
              App Store
            </a>
            <a href={links.android} className="d20-store" target="_blank" rel="noopener noreferrer">
              Google Play
            </a>
          </div>
        </section>
      )}

      <div className="d20-dock" data-shown={shown} data-rolling={rolling}>
        {flat ? (
          <img className="d20-flat" src={D20_LOOKS[flatLab].mid} alt="" />
        ) : (
          <canvas ref={canvasRef} className="d20-canvas" aria-hidden="true" />
        )}
        {shown && !hasRolled && (
          <span className="d20-hint" aria-hidden="true">
            ROLL ZE D20
          </span>
        )}
        <button
          ref={dieButtonRef}
          type="button"
          className="d20-die"
          onClick={roll}
          disabled={!shown}
          aria-label="Roll ze D20"
        />
      </div>
    </>
  )
}
