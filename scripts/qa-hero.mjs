// Load the hero, let the intro loader clear, then look at it.
export default async function run(page) {
  await page.setViewportSize({ width: 1536, height: 782 })

  // The hero entrance is gated on the intro loader finishing; wait for the
  // title chars to have actually settled rather than a bare fixed delay.
  await page.waitForTimeout(4500)

  const info = await page.evaluate(() => {
    const canvas = document.querySelector('canvas')
    const hero = document.querySelector('section')
    const cs = hero ? getComputedStyle(hero) : null
    return {
      canvasSize: canvas ? `${canvas.width}x${canvas.height}` : 'no canvas',
      cursorX: cs ? cs.getPropertyValue('--hero-cursor-x').trim() : 'n/a',
      cursorY: cs ? cs.getPropertyValue('--hero-cursor-y').trim() : 'n/a',
      heroH: hero ? hero.getBoundingClientRect().height : 0,
    }
  })

  // Move the pointer off-centre so the parallax is visibly engaged, then let
  // the lerp catch up before the shot.
  await page.mouse.move(1200, 250)
  await page.waitForTimeout(1200)

  const after = await page.evaluate(() => {
    const hero = document.querySelector('section')
    const cs = getComputedStyle(hero)
    const layer = document.querySelector('section > div > div')
    return {
      cursorX: cs.getPropertyValue('--hero-cursor-x').trim(),
      cursorY: cs.getPropertyValue('--hero-cursor-y').trim(),
      layerTransform: layer ? getComputedStyle(layer).transform : 'n/a',
    }
  })

  return { atRest: info, afterPointerMove: after }
}
