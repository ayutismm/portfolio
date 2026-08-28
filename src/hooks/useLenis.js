import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/*
  Boots Lenis smooth scrolling and hands its RAF loop to GSAP's ticker.

  Driving Lenis from gsap.ticker (rather than its own requestAnimationFrame)
  keeps scroll position and ScrollTrigger reads on the same frame — otherwise
  pinned/scroll-linked elements lag the scroll by a frame and visibly jitter.
  lagSmoothing(0) stops GSAP from time-warping after a long frame, which would
  otherwise make Lenis jump.

  Respects prefers-reduced-motion by skipping smoothing entirely.
*/
export function useLenis() {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Touch scrolling is left native (syncTouch is off, the OS applies its own
    // inertia), so on coarse-pointer devices Lenis would only run a useless RAF
    // loop — skip it entirely there, not just under reduced motion.
    const touchOnly = window.matchMedia('(pointer: coarse)').matches
    if (prefersReduced || touchOnly) return

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Let Lenis own in-page anchor jumps (e.g. the hero's Explore cue), so they
      // ease instead of teleporting and fighting the smooth-scroll loop.
      anchors: true,
      // Touch is left unsmoothed (syncTouch defaults off): the OS already applies
      // inertia there, and doubling it feels laggy.
      touchMultiplier: 1.6,
    })

    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, [])
}
