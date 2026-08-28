import { mkdirSync } from 'node:fs'

export default async function run(page) {
  const dir = 'D:/portfolio-website-mine/scripts/shots'
  try { mkdirSync(dir, { recursive: true }) } catch {}
  await page.waitForSelector('[class*="loader"] svg', { timeout: 15000 })
  const beats = [
    [600, '1-logo-only'],
    [900, '2-hold'],
    [800, '3-subject-alone'],
    [1000, '4-wheel-revealed'],
    [1500, '5-site'],
  ]
  for (const [wait, name] of beats) {
    await page.waitForTimeout(wait)
    await page.screenshot({ path: `${dir}/${name}.png` })
  }
  return { ok: true }
}
