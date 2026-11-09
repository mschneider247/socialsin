/**
 * The hero's two lines under the title (TAGLINES and SUBHEADS in App.tsx).
 * Every version is in the page and <html data-tagline / data-subhead> says
 * which one shows (App.css). index.html picks the first pair for each visit;
 * every roll of the D20 deals a new pair here, never the one already showing.
 */
const LINES = [
  { attr: 'tagline', box: '.tagline' },
  { attr: 'subhead', box: '.hero-subheadline' },
] as const

export function rerollHeroLines(fadeIn: boolean) {
  const root = document.documentElement
  for (const { attr, box: selector } of LINES) {
    const box = document.querySelector<HTMLElement>(selector)
    const count = box?.querySelectorAll('.hero-line').length ?? 0
    if (!box || count < 2) continue
    const showing = Number(root.dataset[attr])
    let next = Math.floor(Math.random() * (count - 1))
    if (next >= showing) next += 1
    root.dataset[attr] = String(next)
    if (fadeIn) {
      // Up from nothing to the line's own opacity (the subhead sits at 0.7).
      const opacity = getComputedStyle(box).opacity
      box.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity, transform: 'none' }], {
        duration: 600,
        easing: 'ease-out',
      })
    }
  }
}
