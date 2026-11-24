import { useEffect, useRef } from 'react'
import { CLIP_HEIGHT, CLIP_WIDTH, clipPoster, clipSrc } from './media'
import type { ClipName } from './media'
import { useReducedMotion } from './lab/useReducedMotion'

/**
 * A short silent gameplay loop. Nothing downloads until it scrolls into view
 * (preload="none" + the poster), it plays only while on screen, and with
 * reduced motion it stays on the poster with controls instead of autoplaying.
 */
export default function LoopClip({ name, alt, className }: { name: ClipName; alt: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const still = useReducedMotion()

  useEffect(() => {
    const video = ref.current
    if (!video || still || typeof IntersectionObserver === 'undefined') return
    // React doesn't always reflect `muted` onto the element, and browsers only
    // autoplay muted video.
    video.muted = true
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {})
        else video.pause()
      },
      { threshold: 0.35 },
    )
    observer.observe(video)
    return () => {
      observer.disconnect()
      video.pause()
    }
  }, [still])

  return (
    <video
      ref={ref}
      className={className}
      src={clipSrc(name)}
      poster={clipPoster(name)}
      width={CLIP_WIDTH}
      height={CLIP_HEIGHT}
      preload="none"
      controls={still}
      muted
      loop
      playsInline
      aria-label={alt}
    />
  )
}
