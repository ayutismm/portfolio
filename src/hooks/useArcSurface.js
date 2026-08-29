import { useEffect } from 'react'
import { surfaceAtPx, placeOnSurface, pxPerWorldUnit, STAGE_SLIDE_X, STAGE_SLIDE_Y } from '../utils/arc-surface'

/*
  Measures the hero's DOM type against the shared arc surface and writes the
  per-element CSS vars that put each glyph / tagline on it.

  The WebGL row computes its depth from a slot index in world units; the DOM
  side computes the SAME depth from a measured screen x, via the perspective
  bridge in surfaceAtPx (see utils/arc-surface.js). Measuring is what makes the
  two surfaces match instead of merely sharing constant names — the old code
  guessed a glyph advance of 0.6em, which put a 487px-wide title on a curve
  2.25× shallower than the cards at the same screen position.

  Title glyphs: measured offset from the line's centre → --dz (translateZ).
  They ride outward — the title is centred and grows symmetrically, so no
  positional correction is needed. Only the z-depth is applied, not the
  surface-normal yaw, so the letters stay upright rather than tilting along the
  curve.

  Tagline spans: they sit near the viewport edges, where the surface is ~280px
  deep — perspective would magnify them ~1.25× and fling them off-screen. So
  they are placed through the INVERSE (placeOnSurface): a corrected --ax pulls
  them inward so they project back onto the exact spot they occupy today, and
  --arc-shrink divides their font-size by their own magnification so the net
  rendered size is unchanged.

  All offsets are read from offsetLeft / offsetWidth, which ignore transforms —
  so this measures the layout frame, the same pre-tilt frame the card row's
  world positions live in. That is what keeps glyph and card on the same surface
  once the (now shared) pointer tilt rotates both by the same amount.

  This is layout, not motion: it runs once on mount and again on resize / after
  web fonts load, and it is NOT skipped under prefers-reduced-motion.
*/
export function useArcSurface(heroRef, { titleRef, asideRef, glyphSelector, asideLeftSelector, asideRightSelector }) {
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return

    let raf = 0
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    }

    const measure = () => {
      const perspective = parseFloat(getComputedStyle(hero).perspective)
      if (!Number.isFinite(perspective) || perspective <= 0) return
      const view = {
        w: hero.clientWidth,
        h: hero.clientHeight,
        perspective,
      }
      if (!view.w || !view.h) return

      // The stage's pointer slide, converted to screen px, so the DOM scene
      // shifts by exactly the same amount as the cards (see STAGE_SLIDE_X/Y).
      const slideX = pxPerWorldUnit(view.w, view.h) * STAGE_SLIDE_X
      const slideY = pxPerWorldUnit(view.w, view.h) * STAGE_SLIDE_Y
      hero.style.setProperty('--hero-slide-x', `${slideX.toFixed(2)}px`)
      hero.style.setProperty('--hero-slide-y', `${slideY.toFixed(2)}px`)

      // ---- title glyphs: ride outward, no correction ----
      const glyphs = glyphSelector ? titleRef.current?.querySelectorAll(glyphSelector) : null
      if (glyphs?.length) {
        const parent = glyphs[0].offsetParent ?? glyphs[0].parentElement
        const centre = (parent?.offsetWidth ?? 0) / 2
        for (const glyph of glyphs) {
          const xPx = glyph.offsetLeft + glyph.offsetWidth / 2 - centre
          const { dz } = surfaceAtPx(xPx, view)
          glyph.style.setProperty('--dz', `${dz.toFixed(2)}px`)
        }
      }

      // ---- taglines: project back onto their current spot, shrink to cancel
      // the magnification so the net rendered size is unchanged ----
      const spans = [asideLeftSelector, asideRightSelector]
        .map((sel) => asideRef.current?.querySelector(sel))
        .filter(Boolean)
      if (spans.length && asideRef.current) {
        const asideHalf = asideRef.current.offsetWidth / 2

        // 1. Clear our vars so offset* below read the true layout, not a stale
        //    run's transforms. offsetLeft/Width ignore transforms anyway, but
        //    --arc-shrink changes the font-size, which DOES change offsetWidth.
        for (const span of spans) {
          span.style.removeProperty('--ax')
          span.style.removeProperty('--dz')
          span.style.removeProperty('--rotY')
          span.style.removeProperty('--arc-shrink')
        }

        // 2. Baseline centre (in viewport-centre coords) → surface point and
        //    shrink factor. placeOnSurface solves backwards so the span, once
        //    magnified by its own depth, lands back on this centre.
        const plan = spans.map((span) => {
          const centre0 = span.offsetLeft + span.offsetWidth / 2 - asideHalf
          const surf = placeOnSurface(centre0, view)
          return { span, surf, shrink: 1 / surf.scale }
        })

        // 3. Shrink all spans first (font-size is layout, so it must settle
        //    before we re-measure), then…
        for (const { span, shrink } of plan) {
          span.style.setProperty('--arc-shrink', shrink.toFixed(4))
        }

        // 4. …re-measure the shrunken centre and compensate with --ax so the
        //    span's physical centre lands on the surface point from step 2.
        for (const { span, surf } of plan) {
          const centreShrunk = span.offsetLeft + span.offsetWidth / 2 - asideHalf
          const ax = surf.x - centreShrunk
          span.style.setProperty('--ax', `${ax.toFixed(2)}px`)
          span.style.setProperty('--dz', `${surf.dz.toFixed(2)}px`)
          span.style.setProperty('--rotY', `${surf.yaw.toFixed(5)}rad`)
        }
      }
    }

    measure()

    // Width drives --fs-hero (vw units) and height drives px-per-world-unit, so
    // both matter. Observing the hero (100vw × 100dvh) also catches dvh changes
    // when mobile browser chrome collapses.
    const ro = new ResizeObserver(schedule)
    ro.observe(hero)
    // The display face (Anton) sets glyph widths; re-measure once it is live.
    document.fonts?.ready?.then(schedule).catch(() => { })

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [heroRef, titleRef, asideRef, glyphSelector, asideLeftSelector, asideRightSelector])
}
