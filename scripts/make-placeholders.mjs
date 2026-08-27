/*
  Generates greyscale placeholder app-screen SVGs into /public/projects/.
  Run with:  node scripts/make-placeholders.mjs

  These stand in for real product screenshots on the 3D hero carousel and the
  case-study covers. Delete this script (and the generated files) once you drop
  in your own imagery.
*/
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(here, '../public/projects')
mkdirSync(outDir, { recursive: true })

const W = 390
const H = 844
// Greyscale ramp. Kept reasonably contrasty so the screens still read as UI
// once they're scaled down and blurred on the 3D carousel.
const G = { bg: '#efefef', card: '#dbdbdb', line: '#c0c0c0', ink: '#989898', dark: '#6c6c6c' }

const wrap = (body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">
<rect width="${W}" height="${H}" rx="0" fill="${G.bg}"/>
<rect x="150" y="14" width="90" height="20" rx="10" fill="${G.line}"/>
${body}
</svg>`

const rect = (x, y, w, h, r, fill) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`
const circle = (cx, cy, r, fill) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`

// Header block shared by most screens.
const header = (h = 70) =>
  rect(24, 56, 200, 26, 6, G.dark) + rect(24, 92, 130, 14, 5, G.ink)

// 1 — list / order screen
const listRows = () =>
  Array.from({ length: 6 }, (_, i) => {
    const y = 140 + i * 96
    return (
      rect(20, y, 350, 80, 14, G.card) +
      rect(34, y + 14, 52, 52, 12, G.line) +
      rect(100, y + 22, 150, 14, 5, G.ink) +
      rect(100, y + 44, 90, 11, 5, G.line) +
      rect(316, y + 32, 40, 16, 8, G.line)
    )
  }).join('')

// 2 — chat / keyboard screen
const keyboard = () => {
  const keys = []
  const rows = [10, 9, 7]
  rows.forEach((count, r) => {
    const kw = 32
    const gap = 5
    const totalW = count * kw + (count - 1) * gap
    const startX = (W - totalW) / 2
    for (let i = 0; i < count; i++) {
      keys.push(rect(startX + i * (kw + gap), 600 + r * 52, kw, 42, 6, G.card))
    }
  })
  return (
    rect(20, 140, 260, 56, 16, G.card) +
    rect(110, 212, 260, 44, 16, G.line) +
    rect(20, 272, 220, 56, 16, G.card) +
    rect(20, 520, 350, 52, 14, G.card) +
    keys.join('') +
    rect(120, 760, 150, 40, 20, G.line)
  )
}

// 3 — dashboard / chart screen
const chart = () => {
  const bars = Array.from({ length: 7 }, (_, i) => {
    const h = 40 + ((i * 37) % 120)
    return rect(40 + i * 46, 420 - h, 28, h, 6, i === 3 ? G.dark : G.line)
  }).join('')
  return (
    rect(20, 140, 350, 120, 16, G.card) +
    rect(40, 160, 120, 20, 6, G.ink) +
    rect(40, 190, 200, 34, 8, G.dark) +
    rect(20, 300, 350, 160, 16, G.card) +
    bars +
    rect(20, 490, 168, 100, 16, G.card) +
    rect(202, 490, 168, 100, 16, G.card) +
    rect(20, 610, 350, 80, 16, G.card)
  )
}

// 4 — profile screen
const profile = () =>
  circle(195, 210, 62, G.line) +
  rect(125, 300, 140, 20, 6, G.dark) +
  rect(150, 332, 90, 14, 5, G.ink) +
  Array.from({ length: 5 }, (_, i) =>
    rect(20, 390 + i * 72, 350, 60, 14, G.card) +
    rect(40, 408, 0, 0, 0, G.line) +
    rect(40, 410 + i * 72, 24, 24, 6, G.line) +
    rect(78, 414 + i * 72, 160, 16, 5, G.ink),
  ).join('')

// 5 — feed / cards screen
const feed = () =>
  Array.from({ length: 3 }, (_, i) => {
    const y = 140 + i * 230
    return (
      rect(20, y, 350, 210, 18, G.card) +
      rect(20, y, 350, 130, 18, G.line) +
      rect(40, y + 148, 190, 18, 6, G.ink) +
      rect(40, y + 174, 120, 12, 5, G.line)
    )
  }).join('')

// 6 — detail / recipe screen
const detail = () =>
  rect(20, 130, 350, 200, 18, G.line) +
  rect(40, 350, 240, 24, 6, G.dark) +
  Array.from({ length: 7 }, (_, i) => rect(40, 392 + i * 26, i % 3 === 0 ? 310 : 270, 12, 5, G.ink)).join('') +
  rect(20, 600, 350, 60, 14, G.card) +
  rect(20, 676, 350, 60, 14, G.card) +
  rect(110, 760, 170, 44, 22, G.dark)

// 7 — onboarding / welcome screen
const welcome = () =>
  rect(0, 0, W, 520, 0, G.line) +
  rect(36, 300, 250, 42, 8, G.dark) +
  rect(36, 352, 190, 42, 8, G.dark) +
  rect(36, 404, 220, 42, 8, G.dark) +
  rect(36, 600, 318, 20, 6, G.ink) +
  rect(36, 632, 240, 20, 6, G.line) +
  rect(36, 720, 318, 56, 28, G.dark)

const screens = [listRows, keyboard, chart, profile, feed, detail, welcome]

screens.forEach((fn, i) => {
  const body = (i === 6 ? '' : header()) + fn()
  writeFileSync(resolve(outDir, `screen-${i + 1}.svg`), wrap(body))
})

// Case covers reuse three of the screen layouts at card proportions.
const covers = [chart, feed, detail]
covers.forEach((fn, i) => {
  writeFileSync(resolve(outDir, `project-${i + 1}-cover.svg`), wrap(header() + fn()))
})

console.log(`Wrote ${screens.length} screens + ${covers.length} covers to public/projects/`)
