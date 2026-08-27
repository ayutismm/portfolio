export default async function run(page, ui) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.waitForTimeout(1500)
  return await page.evaluate(() => {
    const title = document.querySelector('[aria-hidden="true"].title, p[aria-hidden="true"]')
    const chars = document.querySelectorAll('span[style*="--dz"]')
    const fs = title ? getComputedStyle(title).fontSize : null
    // Font-size token value
    const rootFs = getComputedStyle(document.documentElement).getPropertyValue('--fs-hero')
    const dzs = Array.from(chars).slice(0, 4).map(c => c.style.getPropertyValue('--dz'))
    return {
      titleText: title ? title.textContent.trim() : null,
      titleFontSize: fs,
      fsHeroToken: rootFs,
      sampleDz: dzs,
    }
  })
}
