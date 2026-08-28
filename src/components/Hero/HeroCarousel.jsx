import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { createCarousel } from '../../utils/three-helpers'
import { carouselScreens } from '../../data/projects'
import styles from './Hero.module.css'

/*
  Mounts the Three.js screen wheel and feeds it scroll + pointer input.

  Rendering is driven from gsap.ticker (the same clock Lenis runs on) rather
  than a private requestAnimationFrame, so scroll position and the 3D frame are
  always from the same tick — otherwise the wheel visibly lags the scroll.

  `revealed` is the intro's signal that the wheel has just been uncovered; it
  starts the fast spin (see startIntroSpin in utils/three-helpers.js). It
  defaults to true so the wheel behaves normally if this ever renders without an
  intro in front of it.
*/
export default function HeroCarousel({ revealed = true, stageRef }) {
  const canvasRef = useRef(null)
  const carouselRef = useRef(null)
  /*
    The reveal can fire while the Three.js chunk is still downloading, so it is
    mirrored into a ref the setup below can read the moment the carousel is
    ready — otherwise a slow network would leave the intro spin unstarted.
  */
  const revealedRef = useRef(revealed)

  useEffect(() => {
    revealedRef.current = revealed
  }, [revealed])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let disposed = false
    let carousel = null

    const tick = (time, deltaMs) => carousel?.render(deltaMs / 1000)

    /*
      The hero is pinned (position: sticky; top: 0) and gets covered by the
      opaque case stack once the page has scrolled ~a full viewport. The canvas
      stays geometrically "in view" the whole way down, so an IntersectionObserver
      never reports it leaving — gate the render loop on scroll instead: draw while
      the hero is actually visible, drop the tick while an opaque section hides it.
      This is the single biggest mobile-GPU saving, and it's invisible: the wheel
      simply isn't being drawn while no one can see it.
    */
    let ticking = true
    const setTicking = (on) => {
      if (on && !ticking) {
        gsap.ticker.add(tick)
        ticking = true
      } else if (!on && ticking) {
        gsap.ticker.remove(tick)
        ticking = false
      }
    }

    const onScroll = () => {
      // Normalise hero scroll into 0→1 over the first viewport of travel.
      const p = Math.min(1, window.scrollY / window.innerHeight)
      carousel?.setScroll(p)
      setTicking(window.scrollY < window.innerHeight)
    }

    const onPointerMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = (e.clientY / window.innerHeight) * 2 - 1
      carousel?.setPointer(x, y)
    }

    // Leaving the viewport ends the hover: without this, cards keep lighting
    // up as they drift through the cursor's last known position.
    const onPointerLeave = () => carousel?.setPointerActive(false)

    const onResize = () => carousel?.resize()

    // Observe the container too: the canvas is sized from its parent, which can
    // change without a window resize (e.g. scrollbar appearing, font reflow).
    const ro = new ResizeObserver(onResize)

    const teardown = () => {
      gsap.ticker.remove(tick)
      ro.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener('pointerleave', onPointerLeave)
      window.removeEventListener('resize', onResize)
    }

    createCarousel(canvas, { images: carouselScreens })
      .then((c) => {
        if (disposed) {
          c.dispose()
          return
        }
        carousel = c
        carouselRef.current = c

        if (canvas.parentElement) ro.observe(canvas.parentElement)
        gsap.ticker.add(tick)
        window.addEventListener('scroll', onScroll, { passive: true })
        window.addEventListener('pointermove', onPointerMove, { passive: true })
        document.documentElement.addEventListener('pointerleave', onPointerLeave)
        window.addEventListener('resize', onResize)

        // The intro may have revealed the wheel while the chunk was still
        // loading — start the spin now that it exists. Idempotent, so the
        // dedicated effect below can also call it without a double start.
        if (revealedRef.current) c.startIntroSpin()
        onScroll()
      })
      .catch((err) => {
        // No WebGL (old browser, blocklisted driver, headless). The hero still
        // reads fine without it, so degrade instead of blanking the page.
        console.warn('WebGL unavailable — hero carousel disabled.', err)
      })

    return () => {
      disposed = true
      teardown()
      carousel?.dispose()
      carouselRef.current = null
    }
  }, [])

  /*
    Start the fast→slow spin at the moment the intro uncovers the wheel. Kept in
    its own effect rather than folded into the setup above: the carousel is built
    once on mount, and by then the reveal is still seconds away. startIntroSpin is
    idempotent, so a re-render that re-signals the reveal won't restart the decay.
  */
  useEffect(() => {
    if (revealed) carouselRef.current?.startIntroSpin()
  }, [revealed])

  return (
    <div className={styles.stage} ref={stageRef}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        aria-label="Rotating 3D project carousel"
        role="img"
      />
      {/* Lens blur at the edges so the wheel dissolves rather than hard-cropping. */}
      <div className={styles.lensLeft} aria-hidden="true" />
      <div className={styles.lensRight} aria-hidden="true" />
    </div>
  )
}
