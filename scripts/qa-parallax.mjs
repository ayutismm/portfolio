// Verify the pointer parallax: which nodes move, by how much, and that the
// fixed header is not among them.
export default async function run(page) {
  await page.setViewportSize({ width: 1536, height: 782 })
  await page.waitForTimeout(4500)

  const read = () =>
    page.evaluate(() => {
      const hero = document.querySelector('section')
      const header = document.querySelector('header')
      const rows = []
      // Every div inside the hero, tagged with its class so we can tell the
      // parallax wrappers from the stage and the lens blurs.
      hero.querySelectorAll('div').forEach((d) => {
        const t = getComputedStyle(d).transform
        if (t !== 'none') rows.push({ cls: d.className, transform: t })
      })
      return {
        cursor: [
          getComputedStyle(hero).getPropertyValue('--hero-cursor-x').trim(),
          getComputedStyle(hero).getPropertyValue('--hero-cursor-y').trim(),
        ],
        movers: rows,
        headerTransform: header ? getComputedStyle(header).transform : 'no header',
        headerVarX:
          header
            ? getComputedStyle(header).getPropertyValue('--hero-cursor-x').trim() || '(unset)'
            : 'n/a',
      }
    })

  const atRest = await read()

  await page.mouse.move(1400, 120) // hard to the top-right
  await page.waitForTimeout(1500)
  const deflected = await read()

  return { atRest, deflected }
}
