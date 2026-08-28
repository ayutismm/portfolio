export default async function run(page, ui) {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload({ waitUntil: 'domcontentloaded' })

  // Mount signal: the fixed header is rendered by React.
  await page.waitForSelector('header', { timeout: 15000 }).catch(() => {})

  const title = await page.title()

  // Did the (now much smaller) hero character actually load + decode?
  const char = await page.evaluate(() => {
    const img = [...document.images].find((i) => (i.src || '').includes('hero-character'))
    return img ? { complete: img.complete, w: img.naturalWidth, h: img.naturalHeight } : null
  })

  const hasCanvas = await page.evaluate(() => !!document.querySelector('canvas'))

  const h1 = await page.evaluate(() => document.querySelector('h1')?.textContent?.trim() ?? null)

  // Let the intro (~4.5s of logo→character morph + backdrop lift) finish.
  await page.waitForTimeout(5600)

  // After reveal, the hero title glyphs get inline opacity 1 from GSAP.
  const revealedGlyph = await page.evaluate(() => {
    const glyphs = document.querySelectorAll('[class*="titleChar"]')
    let count = 0
    glyphs.forEach((g) => { if (getComputedStyle(g).opacity === '1') count++ })
    return { total: glyphs.length, opaque: count }
  })

  await page.screenshot({ path: 'D:/portfolio-website-mine/.claude/qa-smoke.png', fullPage: false })

  return { title, char, hasCanvas, h1, revealedGlyph, screenshot: 'D:/portfolio-website-mine/.claude/qa-smoke.png' }
}
