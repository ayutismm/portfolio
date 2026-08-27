// Hide the DOM overlay so the card arc can be judged unobstructed, and drop
// everything below the hero so the page screenshot is hero-sized (and therefore
// full resolution) rather than a scaled-down full-page shot.
// Runtime-only — touches nothing on disk.
export default async function run(page) {
  await page.setViewportSize({ width: 1536, height: 782 })
  await page.waitForTimeout(4500)

  await page.evaluate(() => {
    const hero = document.querySelector('section')

    // Drop the overlay (title + figure + taglines) and the explore cue.
    hero.querySelectorAll(':scope > div').forEach((d) => {
      if (!d.querySelector('canvas')) d.style.display = 'none'
    })
    const cue = hero.querySelector('a')
    if (cue) cue.style.display = 'none'

    // Drop the edge lens blur so it can't soften the cards we're measuring.
    hero.querySelectorAll('div').forEach((d) => {
      if (getComputedStyle(d).backdropFilter !== 'none') d.style.display = 'none'
    })

    // Everything after the hero goes, so the page is exactly one viewport tall.
    let el = hero.nextElementSibling
    while (el) {
      el.style.display = 'none'
      el = el.nextElementSibling
    }
  })

  await page.waitForTimeout(300)
  return { pageHeight: await page.evaluate(() => document.body.scrollHeight) }
}
