export default async function run(page, ui) {
  // Find the case stack and scroll its first card into view.
  await page.evaluate(() => {
    const h = Array.from(document.querySelectorAll('h2')).find(el => /Campus/.test(el.textContent))
    if (h) h.scrollIntoView({ block: 'center' })
  })
  await page.waitForTimeout(700)
  await page.screenshot({ path: 'D:/portfolio-website-mine/qa-card1-phone.png' })

  // Scroll down ~1.6 viewports so a laptop card (DHWANI) climbs up.
  await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.6))
  await page.waitForTimeout(700)
  await page.screenshot({ path: 'D:/portfolio-website-mine/qa-card2-laptop.png' })

  return { done: true, scrollY: await page.evaluate(() => Math.round(window.scrollY)) }
}
