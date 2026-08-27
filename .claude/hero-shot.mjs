export default async function run(page, ui) {
  await page.setViewportSize({ width: 1440, height: 900 })
  // Wait for the hero title to finish its entrance reveal (opacity 1)
  await page.waitForFunction(() => {
    const el = document.querySelector('p[aria-hidden="true"]')
    return el && getComputedStyle(el).opacity === '1'
  }, { timeout: 15000 }).catch(() => {})
  // Give the 3D row a moment to place cards
  await page.waitForTimeout(800)
  await page.screenshot({ path: 'hero-shot.png' })
  const title = await page.evaluate(() => {
    const t = document.querySelector('.titleInner')
    return t ? t.textContent.trim() : null
  })
  return { title, shot: 'hero-shot.png' }
}
