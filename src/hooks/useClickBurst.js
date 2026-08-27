import { useEffect } from 'react'

/*
  Global click-burst effect. Any element carrying `data-click-burst` (or nested
  inside one) spawns a short-lived ink ripple at the pointer on click.

  Implemented as a single delegated listener on document rather than per-element
  handlers, so it costs nothing for the hundreds of elements that opt in and
  works for anything added later. The ripple node removes itself on animationend.
*/
export function useClickBurst() {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const onPointerDown = (e) => {
      const target = e.target.closest('[data-click-burst]')
      if (!target) return

      const burst = document.createElement('span')
      burst.className = 'click-burst'
      burst.style.left = `${e.clientX}px`
      burst.style.top = `${e.clientY}px`
      document.body.appendChild(burst)
      burst.addEventListener('animationend', () => burst.remove(), { once: true })
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])
}
