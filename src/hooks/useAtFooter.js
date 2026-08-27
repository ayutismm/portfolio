import { useEffect, useState } from 'react'

/*
  True once the page has scrolled to the very bottom (the footer).
  Used to invert the header colors so it remains visible over the dark footer plate.
*/
export function useAtFooter(offset = 100) {
  const [atFooter, setAtFooter] = useState(false)

  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      // Check if we are at the bottom of the page
      const scrollPosition = window.scrollY + window.innerHeight
      const bottomPosition = document.body.offsetHeight
      setAtFooter(scrollPosition >= bottomPosition - offset)
    }
    
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [offset])

  return atFooter
}
