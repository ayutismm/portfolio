/*
  Arc-surface QA. Proves the title and taglines lie on the SAME surface as the
  WebGL cards, numerically, instead of eyeballing a screenshot:

    1  every glyph's applied --dz matches a recomputation of surfaceAtPx from
       the shared constants, to <1px (the "same radius" claim);
    2  each tagline span PROJECTS back onto the spot it occupies with the arc
       vars cleared — i.e. placeOnSurface + preserve-3d really do land it where
       it sat before the arc existed — to <2px;
    3  the taglines' net rendered size is unchanged: shrunken font-size × the
       perspective magnification of its own depth ≈ the un-arc'd font-size, to
       <2% (the "match, then shrink the type" decision);
    4  both spans sit fully inside the viewport (the regression this exists to
       prevent: an uncorrected span at ~280px depth magnifies ~1.25× and flings
       itself off-screen).

  The constants are duplicated from src/utils/arc-surface.js because the bundled
  module is not reachable from the page context; they must match it exactly.
*/
export default async function run(page) {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.waitForSelector('[class*="titleChar"]', { timeout: 15000 })
  // useArcSurface measures in a rAF after mount; wait until the first glyph has
  // its --dz written before asserting anything.
  await page.waitForFunction(() => {
    const g = document.querySelector('[class*="titleChar"]')
    return g && g.style.getPropertyValue('--dz')
  }, { timeout: 5000 })

  const res = await page.evaluate(() => {
    // Duplicated from src/utils/arc-surface.js — keep in lockstep.
    const SLOT_W = 1.55
    const DEPTH = 0.9
    const DEPTH_POW = 1.3
    const FAN_RATIO = 0.7
    const CAM_FOV = 34
    const CAM_Z_WIDE = 11
    const CAM_Z_NARROW = 15

    const camZFor = (w, h) => (w / h < 1 ? CAM_Z_NARROW : CAM_Z_WIDE)
    const pxPerWorldUnit = (w, h) =>
      h / (2 * camZFor(w, h) * Math.tan((CAM_FOV * Math.PI) / 360))
    const depthAtSlot = (s) => DEPTH * Math.abs(s) ** DEPTH_POW
    const surfaceAtPx = (xPx, { w, h, perspective }) => {
      const k = pxPerWorldUnit(w, h)
      const s = xPx / k / SLOT_W
      const dz = (perspective * depthAtSlot(s)) / camZFor(w, h)
      return { dz }
    }

    const hero = document.querySelector('section')
    const heroRect = hero.getBoundingClientRect()
    const view = {
      w: hero.clientWidth,
      h: hero.clientHeight,
      perspective: parseFloat(getComputedStyle(hero).perspective),
    }
    const heroCentreX = heroRect.left + heroRect.width / 2
    const P = view.perspective

    // ---- 1. glyph depths ----
    const glyphs = [...document.querySelectorAll('[class*="titleChar"]')]
    const parent = glyphs[0]?.offsetParent ?? glyphs[0]?.parentElement
    const centre = (parent?.offsetWidth ?? 0) / 2
    const glyphChecks = glyphs.map((g) => {
      const xPx = g.offsetLeft + g.offsetWidth / 2 - centre
      const { dz } = surfaceAtPx(xPx, view)
      const appliedDz = parseFloat(g.style.getPropertyValue('--dz'))
      return {
        xPx: Math.round(xPx),
        dz: +dz.toFixed(2),
        appliedDz,
        dzErr: Math.abs(dz - appliedDz),
      }
    })
    const glyphsOnSurface = glyphChecks.every((c) => c.dzErr < 1)

    // ---- taglines ----
    const spans = [...document.querySelectorAll('[class*="asideLeft"], [class*="asideRight"]')]
    const aside = spans[0]?.parentElement
    const asideHalf = (aside?.offsetWidth ?? 0) / 2

    const withArc = spans.map((span) => {
      const rect = span.getBoundingClientRect()
      const dz = parseFloat(span.style.getPropertyValue('--dz'))
      return {
        renderedLeft: rect.left,
        renderedRight: rect.right,
        fontSize: parseFloat(getComputedStyle(span).fontSize),
        dz,
        scale: P / (P - dz),
      }
    })

    // Zero the surface-normal yaw before measuring the projected centre.
    // rotateY gives the span's near and far halves DIFFERENT magnification, so
    // the bounding-box centre of the yawed span is biased away from the span's
    // true centre. With the yaw off, rect centre == projection of the span's
    // local centre — which is the thing placeOnSurface is solving for.
    for (const span of spans) span.style.setProperty('--rotY', '0rad')
    const projected = spans.map((span) => {
      const rect = span.getBoundingClientRect()
      return rect.left + rect.width / 2 - heroCentreX
    })

    // Clear the hook's vars (this is the "spot they occupy today") and read the
    // natural layout. Synchronous within this evaluate, so the ResizeObserver's
    // re-measure cannot run between the clear and the read.
    for (const span of spans) {
      span.style.removeProperty('--ax')
      span.style.removeProperty('--dz')
      span.style.removeProperty('--rotY')
      span.style.removeProperty('--arc-shrink')
    }
    const natural = spans.map((span) => ({
      centreX: span.offsetLeft + span.offsetWidth / 2 - asideHalf,
      fontSize: parseFloat(getComputedStyle(span).fontSize),
    }))

    const tagChecks = withArc.map((w, i) => {
      const n = natural[i]
      return {
        centreErr: Math.abs(projected[i] - n.centreX),
        fontSizeErr: Math.abs(w.fontSize * w.scale - n.fontSize) / n.fontSize,
        inside: w.renderedLeft >= -1 && w.renderedRight <= innerWidth + 1,
        projectedCentreX: +projected[i].toFixed(2),
        naturalCentreX: +n.centreX.toFixed(2),
        shrunkenFont: +w.fontSize.toFixed(2),
        naturalFont: +n.fontSize.toFixed(2),
        scale: +w.scale.toFixed(4),
      }
    })

    const maxDzErr = Math.max(...glyphChecks.map((c) => c.dzErr))
    const outerGlyph = glyphChecks.reduce((a, b) => (Math.abs(b.xPx) > Math.abs(a.xPx) ? b : a))
    return {
      view,
      glyphsOnSurface,
      maxDzErr: +maxDzErr.toFixed(3),
      outerGlyph,
      tagChecks,
      pass:
        glyphsOnSurface &&
        tagChecks.every((t) => t.centreErr < 2 && t.fontSizeErr < 0.02 && t.inside),
    }
  })

  return res
}
