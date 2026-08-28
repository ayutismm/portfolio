# Portfolio Optimization — Round 2

**Goal:** keep every animation and feature, cut startup cost and total weight further.

**Status:** plan only — nothing implemented yet.

---

## 1. Current state (after round 1)

| Asset | Size | Notes |
|---|---|---|
| `assets/index-*.js` | **866 KB** (245 KB gzip) | Three.js still in the initial bundle |
| `characters/hero-character.svg` | **474 KB** (180 KB gzip) | optimized from 1.76 MB |
| 6 carousel screenshots | ~290 KB | already downscaled |
| CSS | 20 KB | fine |
| Google Fonts | ~14 requests | Anton + Montserrat(6) + Poppins(6) + Playfair var |
| Marquee icons | 19 CDN requests | jsDelivr at runtime |

**~1.67 MB raw / ~730 KB gzip**, plus ~14 font requests and 19 runtime CDN logo requests.

Round 1's wins are all in (dead SVG, preload, render-loop gate, pixel-ratio cap, lens gradient, idle CSS-var writes, Lenis touch skip). The remaining cost is dominated by **Three.js in the main bundle**, then fonts, then the character SVG.

---

## 2. Plan (priority order)

### Phase A — Code-split Three.js (biggest startup win)

Three.js (~650 KB of the 866 KB bundle) is only used by the hero wheel, which is hidden behind the ~4 s intro. It does not belong in the critical path.

| # | Action | Impact |
|---|---|---|
| A.1 | Make `createCarousel` load Three asynchronously: replace the top-level `import * as THREE from 'three'` in `three-helpers.js` with `const THREE = await import('three')` inside `createCarousel`, and `await` it in `HeroCarousel`'s mount effect. Vite emits a separate `three` chunk fetched during the intro. | initial JS **866 → ~200 KB** (245 → ~60 KB gzip); intro starts near-instantly |
| A.2 | Handle the reveal race: `startIntroSpin` currently fires on `revealed`, which may arrive before the chunk resolves. Store `revealed` in a ref and call `startIntroSpin()` right after the carousel is created if `revealed` is already true. | no visible pop-in if the network is slow |

*Alternative:* `React.lazy` the whole `HeroCarousel` with a `Suspense` fallback of `null`. Cleaner boundary, slightly more moving parts; A.1 is the smaller diff. Either keeps every animation intact — the wheel simply appears behind the opaque backdrop as before.

### Phase B — Vendor chunks for caching

| # | Action | Impact |
|---|---|---|
| B.1 | Add `build.rollupOptions.output.manualChunks` in `vite.config.js`: `react` (react, react-dom) and `gsap` (gsap). `three` is already split by A.1. | framework/vendor code doesn't re-download when only app code changes |

### Phase C — Trim fonts (~14 → ~6 requests)

CSS only uses weights **400 / 500 / 600 / 700** — the 800/900 of Montserrat and Poppins are never referenced. Playfair (`--font-serif`) is used in exactly one place (`CaseStack.module.css:134`).

| # | Action | Impact |
|---|---|---|
| C.1 | Update the Google Fonts URL in `index.html`: `Montserrat:wght@400;500;600;700`, `Poppins:wght@600;700`, and Playfair narrowed to the single weight/style that `CaseStack.module.css:134` actually uses. | drops ~8 font files, less reflow |
| C.2 | (Optional, design call) Consolidate Poppins → Montserrat. Poppins only styles nav/meta/tags/marquee — Montserrat covers the same niche. One less family. | one family fewer; tiny visual shift |
| C.3 | (Optional, deeper) Self-host subset woff2 (Latin) instead of the Google Fonts CSS. Removes the render-blocking external stylesheet + connection setup. | faster first text paint, fewer third-party requests |

*Recommendation:* do C.1 now (safe, zero visual change). C.2/C.3 only if you want to push further.

### Phase D — Rasterize the hero character (biggest asset win)

`hero-character.svg` renders at `height: clamp(340px, 70vh, 750px)` (`Hero.module.css:222`; `clamp(280px, 56vh, 520px)` on mobile). A 2× export (~1500 px tall WebP) is pixel-identical at render size and ~**60–120 KB** vs 474 KB. The site never zooms it, so the vector's only advantage is unused.

| # | Action | Impact |
|---|---|---|
| D.1 | Export the SVG to WebP at ~1500 px tall (keeps the 984×2411 aspect → ~612 px wide), q≈80. | **−~350 KB** raw (−~150 KB gzip) |
| D.2 | Swap `src` in both consumers (`Hero.jsx` and `IntroLoader.jsx`) to `/characters/hero-character.webp`. Keep the SVG in-repo as the source of truth. | zero animation change — the intro morph measures `charRect`, which is unchanged because the CSS height/aspect are identical |

*This is the one genuine judgment call.* It only swaps the `<img>` source; no animation, dimension, or morph math changes.

### Phase E — Self-host the 19 marquee icons

| # | Action | Impact |
|---|---|---|
| E.1 | Download the 19 devicon SVGs into `public/icons/techstack/` and repoint `TECH_STACK` in `HeroMarquee.jsx` to local paths. | removes 19 runtime CDN requests + a third-party dependency |

Note: `public/icons/techstack icons/` (space in the directory name) already holds one stray `c++.svg` — rename to `techstack/` as part of this.

### Phase F — Dead-weight cleanup (repo hygiene, not deployed)

| # | Action | Impact |
|---|---|---|
| F.1 | Delete `src/image.png` (343 KB) — verified unreferenced. | tidy |
| F.2 | Delete root `image.png` (289 KB), `hero-shot.png` (214 KB), and the `scripts/*.png` screenshots (~600 KB). | ~1.4 MB dead repo weight |

None of these are under `public/`, so none ship — this is just hygiene.

### Phase G — Rendering polish (lower priority)

| # | Action | Notes |
|---|---|---|
| G.1 | `content-visibility: auto` on below-fold sections. | **Risk:** the case stack is scroll-linked via ScrollTrigger; `content-visibility` can skew its trigger measurements. Apply only to non-animated below-fold content, or skip if it breaks the sticky stack. Test before keeping. |

---

## 3. Hard constraints (unchanged)

Intro morph, WebGL concave-arc carousel, scroll-linked slide, idle drift, hover grayscale→color + scale, pointer parallax, arced DOM title, marquee, sticky case stack, click bursts, `prefers-reduced-motion` handling, desktop Lenis smooth scroll. **None of the above changes any of these** — Phases A–E only move *when* code loads or swap an image source.

---

## 4. Verification / acceptance

- **Transfer size target:** < **600 KB raw / ~300 KB gzip** initial (Three chunk + images load after/below the fold).
- **Lighthouse mobile:** no long main-thread task from Three.js parse; LCP and TBT drop sharply.
- **Device check:** mid-range Android + iOS Safari — intro still morphs cleanly (no character pop-in at reveal), wheel spins/decays, hover still fills colour, marquee icons render, fonts swap with no layout shift.
- **Functional parity:** every animation in §3 still present — run the existing QA scripts (`scripts/qa-arc.mjs`, `qa-intro.mjs`, `qa-hero.mjs`, `qa-parallax.mjs`) plus the browser-automation smoke check after each phase.

---

## 5. Recommended sequencing

1. **A + B** — code-split Three, vendor chunks. The startup fix; everything else still animates identically.
2. **C.1** — trim font weights. One-line change.
3. **D** — rasterize the character to WebP. Biggest remaining asset win.
4. **E + F** — self-host icons, delete dead files.
5. **G** — only if it passes the sticky-stack test.

Each phase is independently shippable and leaves the site fully animated at every step.
