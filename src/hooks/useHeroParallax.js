import { useEffect } from 'react'
import gsap from 'gsap'

/*
  Pointer parallax for the hero.

  Writes the smoothed pointer position to --hero-cursor-x / --hero-cursor-y on
  the given element as -1 → 1 across the viewport. Layers inside the hero
  translate off those two numbers, which is what makes the whole composition —
  the 3D cards, the display title, the figure and the side taglines — swing
  together as one scene instead of the cards moving under flat, pinned type.

  The vars are set on the hero element rather than :root on purpose: the header
  is fixed and lives outside the hero, so scoping the vars here means the nav
  can never inherit them and stays put.

  Smoothing runs on gsap.ticker — the same clock Lenis and the WebGL render loop
  use — with the same lerp factor the 3D stage applies to its own tilt, so the
  DOM layers and the cards never drift out of step.
*/

// Kept in sync with the stage tilt's lerp in utils/three-helpers.js.
const LERP = 0.06

export function useHeroParallax(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const calmMedia = window.matchMedia('(prefers-reduced-motion: reduce)')
    const target = { x: 0, y: 0 }
    const current = { x: 0, y: 0 }

    const onPointerMove = (e) => {
      target.x = (e.clientX / window.innerWidth) * 2 - 1
      target.y = (e.clientY / window.innerHeight) * 2 - 1
    }

    const tick = () => {
      // Reduced motion eases the layers home rather than snapping them.
      const tx = calmMedia.matches ? 0 : target.x
      const ty = calmMedia.matches ? 0 : target.y
      current.x = current.x + (tx - current.x) * LERP
      current.y = current.y + (ty - current.y) * LERP
      el.style.setProperty('--hero-cursor-x', current.x.toFixed(4))
      el.style.setProperty('--hero-cursor-y', current.y.toFixed(4))
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    gsap.ticker.add(tick)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      gsap.ticker.remove(tick)
    }
  }, [ref])
}
