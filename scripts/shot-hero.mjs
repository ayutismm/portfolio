export default async function run(page) {
  await page.setViewportSize({ width: 1280, height: 720 })
  // Wait for the reveal (title opacity 1) so the shot shows the finished hero.
  await page.waitForFunction(() => {
    const t = document.querySelector('[class*="titleChar"]')
    return t && Number(getComputedStyle(t).opacity) === 1
  }, { timeout: 15000 })
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'D:/portfolio-website-mine/scripts/hero-final.png' })
  return { ok: true }
}
