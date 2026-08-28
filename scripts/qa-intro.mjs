/*
  Intro-loader QA. Samples the whole first-load sequence and asserts each beat is
  in the right state at the right time:

    logo (red, blank paper, wheel covered) → morph → subject alone
      → backdrop lifts AND wheel + title + chrome arrive on the SAME beat
        → sheet fades, figure handed off

  The last assertion is the single-reveal one: `onReveal` is one beat, so the
  first sample where the backdrop is no longer fully opaque must also be the
  first sample where the title is visible — no second beat ~1.3s later, no
  staggered glyphs.

  Written after two bugs that reading the source would not have caught: a
  `fromTo` whose from-state rendered at build time and shrank the morph target,
  and a StrictMode `from()` that tweened 0 → 0 because the killed first-pass
  timeline left inline opacity: 0 behind, so the mark never appeared at all.
*/
export default async function run(page) {
  const sample = () =>
    page.evaluate(() => {
      const loader = document.querySelector('[class*="loader"]')
      const logoWrap = loader?.querySelector('[class*="logoWrap"]')
      const logoSvg = loader?.querySelector('svg')
      const o = (el) => (el ? Number(getComputedStyle(el).opacity) : null)
      const h = (el) => (el ? Math.round(el.getBoundingClientRect().height) : null)
      return {
        logoH: h(logoWrap),
        logoOpacity: o(logoWrap),
        logoColor: logoSvg ? getComputedStyle(logoSvg).color : null,
        backdropOpacity: o(loader?.querySelector('[class*="backdrop"]')),
        loaderCharOpacity: o(loader?.querySelector('img')),
        sheetOpacity: o(loader),
        headerOpacity: o(document.querySelector('header')),
        heroCharOpacity: o(document.querySelector('section img')),
        titleOpacity: o(document.querySelector('[class*="titleChar"]')),
      }
    })

  await page.waitForSelector('[class*="loader"] svg', { timeout: 15000 })

  const series = []
  for (let i = 0; i <= 28; i++) {
    series.push({ tick: i, ...(await sample()) })
    await page.waitForTimeout(250)
  }

  const final = series.at(-1)
  // The mark must be painted red at natural size with the wheel fully covered,
  const logoAlone = series.some(
    (s) => s.logoOpacity === 1 && s.logoH > 0 && s.logoH < 120 && s.backdropOpacity === 1,
  )
  const morphed = series.some((s) => s.logoH > 400)
  // ...the subject must be fully established while the wheel is STILL covered,
  // which is the whole point of the backdrop — the wheel is revealed after the
  // figure, not spinning behind the logo from the first frame...
  const subjectBeforeWheel = series.some(
    (s) => s.loaderCharOpacity === 1 && s.backdropOpacity === 1,
  )
  // ...and no site chrome arrives while the backdrop is still fully opaque.
  const siteHeldBack = series.every(
    (s) => !(s.backdropOpacity === 1 && s.headerOpacity > 0),
  )
  // Single reveal: the backdrop lift and the first title opacity land on the
  // same sample tick (they would be ~5 samples apart under the old two-beat
  // intro).
  const backdropLift = series.findIndex((s) => s.backdropOpacity < 1)
  const titleArrive = series.findIndex((s) => s.titleOpacity > 0)
  const sameTickReveal =
    backdropLift !== -1 && titleArrive !== -1 && backdropLift === titleArrive

  return {
    pass:
      logoAlone &&
      morphed &&
      subjectBeforeWheel &&
      siteHeldBack &&
      sameTickReveal &&
      final.headerOpacity === 1 &&
      final.heroCharOpacity === 1 &&
      final.titleOpacity === 1,
    logoAlone,
    morphed,
    subjectBeforeWheel,
    siteHeldBack,
    sameTickReveal,
    backdropLift,
    titleArrive,
    logoColor: series[0].logoColor,
    final,
    series: series.map((s) => ({
      t: s.tick,
      logoH: s.logoH,
      backdrop: s.backdropOpacity,
      char: s.loaderCharOpacity,
      sheet: s.sheetOpacity,
      header: s.headerOpacity,
      title: s.titleOpacity,
    })),
  }
}
