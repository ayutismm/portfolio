// Drives the hero: waits past the intro reveal, then samples the cycling word's
// per-glyph opacities over time to prove the outline→fill flash cascade runs
// (glyphs flash between opacity 0 and 1; no clip-path wipe), and grabs two
// screenshots a beat apart to eyeball the word.
export default async function run(page) {
  // Past the intro loader (~3s reveal) and into the first cascade.
  await page.waitForTimeout(4500)

  const probe = () =>
    page.evaluate(() => {
      const chars = [...document.querySelectorAll('[class*="char_"], [class*="char "]')]
      const strokes = [...document.querySelectorAll('[class*="charStroke"]')]
      const fills = [...document.querySelectorAll('[class*="charFill"]')]
      return {
        charCount: chars.length,
        strokeCount: strokes.length,
        fillCount: fills.length,
        strokeWidth: strokes[0] && getComputedStyle(strokes[0]).webkitTextStrokeWidth,
        strokeColor: strokes[0] && getComputedStyle(strokes[0]).webkitTextStrokeColor,
        strokeFillColor: strokes[0] && getComputedStyle(strokes[0]).color, // transparent expected
        // A "clip-path" wipe must NOT be how this animates — should be 'none'.
        fillClip: fills[0] && getComputedStyle(fills[0]).clipPath,
        word: strokes.map((s) => s.textContent).join(''),
      }
    })

  const first = await probe()
  await page.screenshot({ path: '/tmp/hero-1.png' })

  // Sample per-glyph opacities across ~3.4s to catch a cascade in progress.
  const samples = []
  for (let i = 0; i < 17; i++) {
    samples.push(
      await page.evaluate(() => {
        const strokes = [...document.querySelectorAll('[class*="charStroke"]')]
        const fills = [...document.querySelectorAll('[class*="charFill"]')]
        return {
          word: strokes.map((s) => s.textContent).join(''),
          strokeOps: strokes.map((s) => +getComputedStyle(s).opacity),
          fillOps: fills.map((f) => +getComputedStyle(f).opacity),
        }
      }),
    )
    if (i === 3) await page.screenshot({ path: '/tmp/hero-2.png' })
    await page.waitForTimeout(200)
  }

  // A flash cascade means glyph opacities take intermediate/mixed values over
  // time — some lit, some dark within one frame — rather than all-0 or all-1.
  const sawPartial = samples.some((s) => {
    const ops = [...s.strokeOps, ...s.fillOps]
    return ops.some((o) => o > 0.02 && o < 0.98) || (ops.some((o) => o > 0.5) && ops.some((o) => o < 0.5))
  })
  // The word should change at least once across the sampling window.
  const wordsSeen = [...new Set(samples.map((s) => s.word).filter(Boolean))]

  return { first, sawPartial, wordsSeen }
}
