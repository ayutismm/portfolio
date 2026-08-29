// Checks tagline↔figure gaps across several widths to prove the taglines stay
// close to the subject WITHOUT overlapping it at any width (the danger zone is
// ~960-1100px where the fixed-width figure is largest relative to the inset).
export default async function run(page) {
  const widths = [1440, 1280, 1100, 1000, 960]
  const out = []
  for (const w of widths) {
    await page.setViewportSize({ width: w, height: 850 })
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(700) // loader phase; taglines already laid out
    const row = await page.evaluate(() => {
      const q = (s) => document.querySelector(s)
      const char = [...document.querySelectorAll('img[src*="hero-character"]')].find(
        (i) => !i.closest('[class*="loader"]'),
      )
      const l = q('[class*="asideLeft"]')
      const r = q('[class*="asideRight"]')
      if (!char || !l || !r) return { error: 'missing node' }
      const c = char.getBoundingClientRect()
      const lb = l.getBoundingClientRect()
      const rb = r.getBoundingClientRect()
      return {
        gapLeft: +(c.left - lb.right).toFixed(1),
        gapRight: +(rb.left - c.right).toFixed(1),
      }
    })
    out.push({ w, ...row })
  }
  return out
}
