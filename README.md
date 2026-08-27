# Portfolio — rebuild

A from-scratch portfolio site built to match the look and feel of the reference
in `D:/portfolio website ayutismm` (a minified production build of
`s0animation.com`, with no editable source). Nothing here is copied from it —
this is clean, editable source that reproduces the *structure and interactions*:
a WebGL hero carousel, smooth scroll, a stacked-card case deck, click-burst
cursor ripples and a revealing footer.

**All content is placeholder.** Every string, image and link is marked
`REPLACE ME` and is meant to be swapped for yours — see
[Making it yours](#making-it-yours).

---

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # → dist/
npm run preview  # serve the built output
```

Node 18+ required (Vite 8).

---

## Stack

| Purpose | Choice | Notes |
|---|---|---|
| Framework | React 19 | |
| Build | Vite 8 | |
| 3D hero | Three.js r185 | raw Three, no react-three-fiber — the scene is small and imperative, so a renderer wrapper would only add indirection |
| Smooth scroll | Lenis 1.3 | driven from `gsap.ticker`, not its own rAF loop, so scroll and tweens share a frame |
| Animation | GSAP 3 | intro loader + hero entrance |
| Styling | CSS Modules | plus one global custom-property design system |

Fonts come from Google Fonts (Anton for display, Montserrat, Playfair Display,
Poppins) and are linked in `index.html`.

---

## Layout

```
public/
  characters/hero-character.svg   placeholder figure in the hero
  icons/                          location, telegram, linkedin
  projects/                       3 case covers + 7 carousel screens
scripts/
  make-placeholders.mjs           regenerates every placeholder SVG above
src/
  components/
    Header/       fixed nav; condenses on scroll, collapses to a disclosure panel on mobile
    Hero/         WebGL carousel + kinetic title + marquee
    CaseStack/    sticky stacked-card case deck
    Footer/       contact, splaying logo, year
    IntroLoader/  first-load reveal
    ui/           ClickBurst.css (the ripple keyframes)
  hooks/
    useLenis.js      smooth scroll, wired to the GSAP ticker
    useClickBurst.js delegated pointerdown → ripple
    useScrolled.js   boolean "past N pixels", for the header
  utils/
    three-helpers.js carousel scene construction
  data/
    projects.js      ← all content lives here
  styles/
    index.css        design tokens (~50 custom properties)
    _reset.css
```

---

## Making it yours

Everything you need to change is in **three** places:

1. **`src/data/projects.js`** — your name, role, hero title, location, email,
   socials, and the three case studies (titles, tags, blurbs, cover paths).
2. **`public/`** — drop in real images over the placeholders. Keep the
   filenames and nothing else needs touching:
   - `characters/hero-character.svg` → your own transparent PNG/WEBP (then
     update the `src` in `Hero.jsx`)
   - `projects/project-{1,2,3}-cover.svg` → case cover art
   - `projects/screen-{1..7}.svg` → the screens on the hero carousel
3. **`src/styles/index.css`** — colours, type scale, spacing, durations and
   easings, all as custom properties. The three `--case-ink-*` values tint the
   case cards.

`node scripts/make-placeholders.mjs` regenerates the placeholder art if you
want more or differently-sized slots before you have real assets.

---

## How the tricky parts work

Three things here are non-obvious enough to be worth knowing before you edit
them:

**Lenis patches `window.scrollTo`.** Programmatic scrolls are swallowed by the
smooth-scroll loop. In-page anchors work because `anchors: true` hands them to
Lenis; if you need to scroll from code, call `lenis.scrollTo()`, and if you
write browser tests, dispatch real wheel events rather than setting `scrollY`.

**The case deck does not use ScrollTrigger.** Cards are `position: sticky` with
a shared `top: 0` and a climbing `z-index`, so each slides up over the last.
ScrollTrigger derives its start/end offsets from the trigger's layout position,
which stops moving once an element is stuck — that silently pinned every card
at opacity 0. Instead `CaseCard` uses a one-shot IntersectionObserver for the
entrance and, for the "how covered am I" scale/fade, measures the *next*
sibling's live rect each frame into a `--cover` custom property. Also: the
sticky sections are deliberately **transparent**; giving them a background
makes each card's top padding wipe up over the previous card as a blank bar.

**The header must stay transparent over the hero.** It only earns its frosted
white plate once `data-scrolled` is set (past 40px), because above that it sits
over the WebGL canvas where a background plate would read as a seam.

Every animation is guarded by `prefers-reduced-motion: reduce`.

---

## Known trade-offs

- **Bundle is ~856 kB (245 kB gzipped)**, almost entirely Three.js. Fine for a
  portfolio landing page; if you want it smaller, lazy-load `HeroCarousel` behind
  a dynamic `import()` so the 3D scene isn't in the critical path.
- **"Deep dive" buttons go nowhere.** They're placeholders for case-study routes;
  there is no router yet.
- The hero title is DOM text with CSS animation, not baked into the WebGL canvas
  as in the reference — same look, far easier to edit and accessible to
  screen readers.
