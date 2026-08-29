// Two-phase probe on desktop:
//  (1) EARLY (~700ms, loader still up): computed drop-shadow on the loader's
//      character copy AND the hero character, to compare shadow parity.
//  (2) LATE (~settled): tagline rects vs the figure rect, to see how far the
//      left/right taglines sit from the subject horizontally. Plus a screenshot.
export default async function run(page) {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)

  const shadows = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img[src*="hero-character"]')]
    return imgs.map((img) => ({
      where: img.closest('[class*="loader"]') ? 'loader' : 'hero',
      filter: getComputedStyle(img).filter,
    }))
  })

  // Let the intro finish and the word settle.
  await page.waitForTimeout(5200)
  await page.screenshot({ path: '/tmp/hero-desktop.png' })

  const layout = await page.evaluate(() => {
    const q = (s) => document.querySelector(s)
    const char = [...document.querySelectorAll('img[src*="hero-character"]')].find(
      (i) => !i.closest('[class*="loader"]'),
    )
    const left = q('[class*="asideLeft"]')
    const right = q('[class*="asideRight"]')
    const r = (el) => {
      if (!el) return null
      const b = el.getBoundingClientRect()
      return {
        left: +b.left.toFixed(1),
        right: +b.right.toFixed(1),
        top: +b.top.toFixed(1),
        bottom: +b.bottom.toFixed(1),
      }
    }
    const c = char.getBoundingClientRect()
    return {
      vw: innerWidth,
      char: { left: +c.left.toFixed(1), right: +c.right.toFixed(1), top: +c.top.toFixed(1), bottom: +c.bottom.toFixed(1) },
      asideLeft: r(left),
      asideRight: r(right),
      // horizontal gaps between each tagline and the nearest figure edge
      gapLeftToChar: left ? +(c.left - r(left).right).toFixed(1) : null,
      gapCharToRight: right ? +(r(right).left - c.right).toFixed(1) : null,
    }
  })

  return { shadows, layout }
}
