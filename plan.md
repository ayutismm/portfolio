# Portfolio Optimization Plan — Mobile Performance

**Goal:** make the site light and smooth on mobile **without removing or weakening any animation or feature** (intro morph, WebGL carousel, pointer parallax, marquee, sticky case stack, click bursts, smooth scroll on desktop).

**Status:** plan only — nothing implemented yet.

---

## 1. Current state (measured from `dist/`)

| Asset | Size | Notes |
|---|---|---|
| `assets/index-*.js` (whole app) | **863 KB** (~280 KB gzip) | React + Three.js + GSAP + Lenis in one bundle |
| `characters/hero-character.svg` | **1.76 MB** | 2,164 paths, 984×2411 — used in Hero + IntroLoader |
| `characters/hero-charater.svg` | **1.15 MB** | 2,040 paths — **referenced nowhere, dead asset** |
| 6 carousel screenshots (.jpeg) | ~373 KB | loaded at full resolution into WebGL textures |
| CSS | 20 KB | fine |
| project covers / icons | ~12 KB | fine |
| Google Fonts (external) | ~14 files, several hundred KB | Anton + Montserrat(6) + Poppins(6) + Playfair var |

**~4.2 MB raw / ~1.2 MB gzip** on first load, plus ~14 font requests and 19 CDN logo requests at runtime.

---

## 2. Why it's laggy on mobile (root causes, in priority order)

1. **Two giant SVG illustrations** — a 1.76 MB vector with 2,164 paths that the browser must parse *and* rasterize at 984×2411 on a phone CPU, plus a 1.15 MB dead twin being downloaded for nothing. This is the single biggest cost.
2. **Monolithic 863 KB JS bundle** — Three.js alone is ~650 KB and loads/executes on the critical path before first paint and before the intro animation can start.
3. **Full-viewport WebGL rendering every frame, forever** — `HeroCarousel` renders 11 textured planes on `gsap.ticker` continuously, even after the user has scrolled past the hero. On mobile GPU this is constant battery/thermal drain and dropped frames.
4. **`backdrop-filter: blur(18px)` on two full-height divs** over a live WebGL canvas — the most expensive compositor operation on mobile GPUs.
5. **Per-frame DOM writes** — `useHeroParallax` writes two CSS custom properties to the hero every tick, forcing style recalc + repaint of the 3D-transformed layers on top of the WebGL work.
6. **Four font families × many weights** — ~14 font downloads, reflow, and two `document.fonts.ready` re-measures (Header, useArcSurface).
7. **19 remote CDN SVGs** in the tech marquee — 19 extra HTTP requests to jsDelivr at runtime.
8. **Lenis runs its RAF loop on touch devices** where it isn't smoothing (it only skips for `prefers-reduced-motion`).

---

## 3. Optimization plan

### Phase 0 — Dead-weight removal (zero visual risk)

| # | Action | Impact |
|---|---|---|
| 0.1 | Delete `public/characters/hero-charater.svg` (typo file, never referenced). | **−1.15 MB**, zero risk |
| 0.2 | Confirm `src/image.png` (343 KB), root `image.png`/`hero-shot.png`, and `scripts/*.png` are unreferenced and gitignored/deployed nowhere — leave as dev-only, do not add to `public/`. | avoids accidental re-deploy |

### Phase 1 — Assets (biggest wins, all animations preserved)

| # | Action | Impact |
|---|---|---|
| 1.1 | **Optimize `hero-character.svg` with SVGO** — reduce path precision to 2 decimals, remove editor metadata, merge redundant paths. Keep the same 984×2411 vector so the intro morph and hero crossfade are untouched. | expect **−40–70%** (~0.7–1.1 MB saved), visual loss imperceptible |
| 1.2 | **Fallback if SVG is still heavy: rasterize the character to WebP.** It renders at `height: clamp(340px,70vh,750px)` (`Hero.module.css:223`), so a 2× export (~1500 px tall) is visually identical and far cheaper to decode. Use WebP at ~1500 px (~80–150 KB). | **−1.5 MB+** vs SVG; lose only infinite zoom, which the site never uses |
| 1.3 | **Downscale the 6 carousel screenshots** to match the largest on-screen card (plane is ~37% of viewport height, `three-helpers.js:43`). ~800 px tall JPEG/WebP is plenty; the originals are several × that. | smaller download **and** smaller GPU texture upload/memory |
| 1.4 | **Preload the hero character** (`<link rel="preload" as="image">`) so the intro's logo→character morph never starts before the artwork is decoded. | removes any mobile decode hitch at the morph moment |

*Note on 1.2: this is the one genuine judgment call. Default recommendation: do 1.1 first, measure, and only rasterize if the SVG still costs too much. Rasterizing does not change any animation — it just swaps the `<img>` source.*

### Phase 2 — Rendering / runtime (keep every animation, spend less GPU)

| # | Action | Impact |
|---|---|---|
| 2.1 | **Pause the WebGL render loop when the hero is off-screen.** Wrap the `gsap.ticker.add(tick)` in `HeroCarousel` (`HeroCarousel.jsx:38-39`) with an `IntersectionObserver` on the canvas/stage: remove the ticker when not intersecting, re-add on return. Scroll position still feeds `setScroll` so there's no snap. | stops constant GPU work while reading the case stack |
| 2.2 | **Cap pixel ratio and disable antialias on mobile.** In `createCarousel` (`three-helpers.js:141-147`): `powerPreference: 'high-performance'`, `antialias: matchMedia('(pointer: fine)').matches`, and `renderer.setPixelRatio(Math.min(dpr, 1.5))` on coarse pointers. | halves fragment fill-rate on phones; cards still crisp at 1.5× |
| 2.3 | **Replace the `backdrop-filter: blur` lens divs with a static white gradient.** `.lensLeft`/`.lensRight` (`Hero.module.css:62-88`) only dissolve the wheel edge into the paper — a pure linear gradient (no `backdrop-filter`) reads the same. Keep the mask fade. | removes the worst mobile compositor cost |
| 2.4 | **Stop per-frame CSS-var writes when idle.** In `useHeroParallax` (`useHeroParallax.js:46-54`), skip `setProperty` unless the value changed by > 1e-4 (and already skip under reduced motion). | eliminates steady style-recalc churn |
| 2.5 | **Skip Lenis on touch-only devices.** In `useLenis` (`useLenis.js`), return early when `matchMedia('(pointer: coarse)').matches` — touch already scrolls natively and unsmoothed; this only removes a useless RAF loop on phones. | one less RAF + smoother-feeling native touch scroll |

### Phase 3 — JS bundle & fonts

| # | Action | Impact |
|---|---|---|
| 3.1 | **Code-split Three.js out of the initial bundle.** Three is only needed for the hero wheel, and the wheel is hidden behind the intro (~2 s). Load it via dynamic `import('three')` inside `createCarousel`, or `React.lazy` the carousel. GSAP stays eager (intro needs it immediately). | initial JS −~650 KB; intro starts faster |
| 3.2 | **Split vendor chunks in Vite** (`build.rollupOptions.output.manualChunks`): `three`, `gsap`, `react`. | long-term caching; three.js not re-downloaded on content edits |
| 3.3 | **Trim fonts.** Keep `Anton` (display title) + one sans (recommend **Montserrat**) at 2–3 weights, plus a single italic weight of Playfair **only if** the case-title italic is kept. Drop Poppins (its role — nav/meta/tags — is covered by Montserrat). Self-host subset woff2 (Latin) with `font-display: swap`. | ~10 fewer font requests, no layout-shift re-measures |
| 3.4 | **Self-host the 19 marquee logos** (copy the devicon SVGs into `public/icons/techstack/` and point `HeroMarquee` at them) instead of loading from jsDelivr at runtime. | removes 19 runtime CDN requests |

### Phase 4 — Fine-tuning & QA

| # | Action |
|---|---|
| 4.1 | Add `content-visibility: auto` to below-fold case-stack sections. |
| 4.2 | Scope the heavy `will-change` / `transform-style: preserve-3d` layers to desktop if a device-lab test shows layer-promotion churn on phones. |
| 4.3 | Run the existing QA scripts (`scripts/qa-arc.mjs`, `qa-intro.mjs`, `qa-hero.mjs`, `qa-parallax.mjs`) after each phase to confirm the arc alignment, intro, and parallax still behave identically. |

---

## 4. What we keep (hard constraints)

- Intro: logo piece-assemble → scale/morph into character → backdrop lift (`IntroLoader.jsx`).
- WebGL carousel: concave arc, scroll-linked slide, idle drift, intro spin-decay, hover grayscale→color + 8% scale-up, pointer parallax (`three-helpers.js`).
- DOM type on the shared arc surface (`useArcSurface` / `arc-surface.js`) — title arch + glyph `translateZ`.
- Pointer parallax of title/taglines/character (`useHeroParallax`).
- Marquee infinite scroll, sticky case-stack cover/scale/opacity, click bursts, footer/header reveals.
- `prefers-reduced-motion` handling everywhere.
- Desktop smooth scroll (Lenis) — only skipped on touch.

---

## 5. Verification / acceptance

- **Before/after transfer size:** target < **1.5 MB raw / < 700 KB gzip** total (from ~4.2 MB raw / ~1.2 MB gzip).
- **Lighthouse mobile:** Total Blocking Time and LCP should drop substantially; aim for no long main-thread tasks from Three.js parse/exec.
- **Device check:** mid-range Android + iOS Safari — scroll the hero, hover cards (or tap), run the intro, scroll the case stack. No dropped frames, no jank on the marquee.
- **Functional parity:** every animation in §4 still present and visually unchanged (verified by the QA scripts + manual pass).

---

## 6. Recommended sequencing

1. Phase 0 + 1.1 (delete dead SVG, SVGO the character) — a few minutes, −2 MB.
2. Phase 2.1–2.5 (render-loop pause, pixel ratio, drop backdrop blur, idle writes, Lenis guard) — the actual *smoothness* fix.
3. Phase 3.1 + 3.3 (code-split three, trim fonts) — the *startup* fix.
4. Phase 1.3 + 3.4 (downscale screenshots, self-host logos).
5. Phase 4 QA.

Each phase is independently shippable and leaves the site fully animated at every step.
