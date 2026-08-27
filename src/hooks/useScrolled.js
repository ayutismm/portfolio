import { useEffect, useState } from 'react'

/*
  True once the page has scrolled past `threshold` pixels.

  Deliberately a boolean rather than a continuous ratio: the header only needs
  to switch between two states, and a boolean re-renders twice over the whole
  page instead of on every frame.

  Reads scrollY on a rAF-throttled passive listener, and seeds from the current
  position so a reload partway down the page doesn't start in the wrong state.
*/
export function useScrolled(threshold = 40) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      setScrolled(window.scrollY > threshold)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [threshold])

  return scrolled
}
