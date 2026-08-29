import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { profile } from '../../data/projects'
import { useHeroParallax } from '../../hooks/useHeroParallax'
import { useArcSurface } from '../../hooks/useArcSurface'
import HeroCarousel from './HeroCarousel'
import HeroMarquee from './HeroMarquee'
import styles from './Hero.module.css'

/*
  The hero heading is a fixed lead word ("I") followed by a word that cycles
  through profile.heroWords with a 3D kinetic fold. The cycling is driven by
  GSAP in an effect below; the markup is just the lead plus a slot holding two
  stacked word layers that hand off (one folds out as the next folds in).
*/

export default function Hero({ revealed = true }) {
  const heroRef = useRef(null)
  const stageRef = useRef(null)
  const titleRef = useRef(null)
  const headingRef = useRef(null)
  const slotRef = useRef(null)
  const wordRef = useRef(null)
  const asideRef = useRef(null)
  const asideLeftRef = useRef(null)
  const asideRightRef = useRef(null)
  const charRef = useRef(null)
  const cueRef = useRef(null)

  /*
    Mirror of the `revealed` prop, read by the scroll-driven cue effect. The
    same pattern HeroCarousel uses (HeroCarousel.jsx:27-31): a ref avoids
    restarting the scroll listener every time `revealed` flips, and lets the
    listener pick up the new value the frame it changes.
  */
  const revealedRef = useRef(revealed)
  useEffect(() => {
    revealedRef.current = revealed
  }, [revealed])

  // Drives --hero-cursor-x/y and the shared tilt amplitude on the section.
  useHeroParallax(heroRef)

  // Measures the taglines onto the arc surface (--dz/--rotY) and writes the
  // shared --hero-slide-x/y. The heading words are flat by design (clean-block
  // kinetic type), so no glyph selector is passed — only the taglines and the
  // WebGL card row ride the arc.
  useArcSurface(heroRef, {
    titleRef,
    asideRef,
    asideLeftSelector: `.${styles.asideLeft}`,
    asideRightSelector: `.${styles.asideRight}`,
  })

  useEffect(() => {
    if (!revealed) return

    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const heading = headingRef.current
    const stage = stageRef.current

    // Reduced motion: just reveal everything, no movement.
    if (calm) {
      gsap.set(
        [asideLeftRef.current, asideRightRef.current, charRef.current, cueRef.current],
        { opacity: 1 },
      )
      if (stage) gsap.set(stage, { opacity: 1 })
      if (heading) gsap.set(heading, { opacity: 1 })
      return
    }

    const tl = gsap.timeline()

    // The character crossfades in beneath the intro's own copy. At the same
    // moment the carousel stage and title expand outward from the centre,
    // giving the impression the whole composition radiates from the figure.
    // All three start at t=0 with matched 0.8s durations so they move as one.

    // Character fades in (hand-off from the intro's identical copy).
    tl.to(charRef.current, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 0)

    // Carousel stage scales up from the centre — starts close to full size
    // so the motion is subtle, not a dramatic zoom.
    if (stage) {
      tl.fromTo(
        stage,
        { opacity: 0, scale: 0.75 },
        { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' },
        0,
      )
    }

    // The heading reveals as one unit (a subtle rise + settle); the individual
    // words are then handed to the cycling effect below.
    if (heading) {
      tl.fromTo(
        heading,
        { opacity: 0, scale: 0.92, y: '0.12em' },
        { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: 'power2.out' },
        0,
      )
    }

    // Taglines and explore cue arrive together shortly after the main heading and character.
    tl.to(
      [asideLeftRef.current, asideRightRef.current, cueRef.current],
      { opacity: 1, duration: 0.5, ease: 'power2.out' },
      0.15,
    )

    return () => tl.kill()
  }, [revealed])

  /*
    Cycle the second word with a per-glyph outline→fill flash. The fixed "I"
    stays put; only the word swaps.

    Reveal sweeps from the END of the word to the FRONT (right → left): each
    glyph's stroked outline flashes in, then one step later its solid fill
    flashes in on top — so glyph k's fill lands together with glyph k+1's
    outline — leaving the word solid. Un-reveal is the mirror, sweeping FRONT →
    END: each glyph's fill flashes out (back to outline), then its outline
    flashes out (glyph gone). Everything is an opacity flash — no wipe/slide.

    Re-centring rides the reveal: the word sits on a width-independent centre
    axis (the slot is centred via left:50% inside .title's translateX(-50%)
    unit — see the CSS), so tweening the slot width to the incoming word moves
    ONLY the fixed "I". We run that tween across the reveal cascade, so the "I"
    glides into place in step with the arriving glyphs while the glyphs
    themselves flash onto a rock-steady axis.

    Each word's glyphs are built in the DOM here (buildWord): every glyph is a
    stroked outline copy (.charStroke, in flow, defining the box) with a solid
    fill copy (.charFill) laid exactly over it. Both carry --ink, so a lit fill
    hides the outline beneath it; drain the fill and the outline is what remains.
  */
  useEffect(() => {
    if (!revealed) return

    const words = profile.heroWords
    const slot = slotRef.current
    const layer = wordRef.current
    if (!words?.length || !slot || !layer) return

    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const widthOf = (el) => `${el.offsetWidth}px` // offsetWidth ignores transforms

    // Build per-glyph markup for `text` into the layer and return the glyph
    // handles [{ stroke, fill }]. `solid` seeds the opacities for the
    // reduced-motion path (glyph fully shown, no flash); otherwise glyphs start
    // hidden, ready for the reveal cascade to flash them in.
    const buildWord = (text, solid) => {
      layer.replaceChildren()
      const glyphs = []
      for (const ch of text) {
        const charEl = document.createElement('span')
        charEl.className = styles.char
        const stroke = document.createElement('span')
        stroke.className = styles.charStroke
        stroke.textContent = ch
        const fill = document.createElement('span')
        fill.className = styles.charFill
        fill.textContent = ch
        charEl.append(stroke, fill)
        layer.append(charEl)
        glyphs.push({ stroke, fill })
      }
      gsap.set(
        glyphs.flatMap((g) => [g.stroke, g.fill]),
        { opacity: solid ? 1 : 0 },
      )
      return glyphs
    }

    gsap.set(layer, { xPercent: -50 })

    // Reduced motion: no cascade — swap the solid word on an interval.
    if (calm) {
      let i = 0
      buildWord(words[0], true)
      slot.style.width = widthOf(layer)
      const id = window.setInterval(() => {
        i = (i + 1) % words.length
        buildWord(words[i], true)
        slot.style.width = widthOf(layer)
      }, 2600)
      return () => window.clearInterval(id)
    }

    const STEP = 0.09 // stagger between consecutive glyphs
    const FLASH = 0.13 // opacity flash per glyph (outline or fill)
    const HOLD = 1.6 // seconds the solid word rests before it drains
    const INTRO_DELAY = 0.85 // let the heading fade in before the first cascade

    let index = 0
    let glyphs = buildWord(words[0], false)
    // The first word grows from nothing: the "I" glides out from centre as the
    // word assembles, the same re-centre every later swap performs.
    slot.style.width = '0px'

    let call = null
    let tl = null

    // Reveal (END → FRONT): outline flashes, then fill one step behind. The
    // slot width tweens to the incoming word across the cascade, gliding the
    // "I" into place as the glyphs arrive (only the "I" moves — see above).
    const cascadeIn = (g, targetW) => {
      const t = gsap.timeline()
      const n = g.length
      const widthDur = Math.max((n - 1) * STEP + FLASH, FLASH)
      t.to(slot, { width: targetW, duration: widthDur, ease: 'power2.out' }, 0)
      for (let k = 0; k < n; k++) {
        const idx = n - 1 - k
        const at = k * STEP
        t.to(g[idx].stroke, { opacity: 1, duration: FLASH, ease: 'power1.out' }, at)
        t.to(g[idx].fill, { opacity: 1, duration: FLASH, ease: 'power1.out' }, at + STEP)
      }
      return t
    }

    // Un-reveal (FRONT → END): the mirror — fill flashes out, then outline one
    // step behind, until the word is gone. Width holds (re-centring belongs to
    // the reveal), so the "I" stays put while the current word drains away.
    const cascadeOut = (g) => {
      const t = gsap.timeline()
      const n = g.length
      for (let k = 0; k < n; k++) {
        const at = k * STEP
        t.to(g[k].fill, { opacity: 0, duration: FLASH, ease: 'power1.in' }, at)
        t.to(g[k].stroke, { opacity: 0, duration: FLASH, ease: 'power1.in' }, at + STEP)
      }
      return t
    }

    const holdThenCycle = () => {
      call = gsap.delayedCall(HOLD, () => {
        tl = cascadeOut(glyphs)
        tl.eventCallback('onComplete', () => {
          index = (index + 1) % words.length
          glyphs = buildWord(words[index], false)
          tl = cascadeIn(glyphs, widthOf(layer))
          tl.eventCallback('onComplete', holdThenCycle)
        })
      })
    }

    // First word: let the heading fade in, then flash-cascade it in.
    call = gsap.delayedCall(INTRO_DELAY, () => {
      tl = cascadeIn(glyphs, widthOf(layer))
      tl.eventCallback('onComplete', holdThenCycle)
    })

    // Keep the unit centred after viewport changes (the font is vw-based, so
    // the live word's pixel width shifts with the viewport).
    const onResize = () => {
      slot.style.width = widthOf(layer)
    }
    window.addEventListener('resize', onResize)

    return () => {
      if (call) call.kill()
      if (tl) tl.kill()
      window.removeEventListener('resize', onResize)
    }
  }, [revealed])

  /*
    Scroll-driven rise + fade for the explore cue.

    The hero is position: sticky; the cue's `bottom: 0` already rides the
    hero's bottom edge as the page scrolls. What this effect adds is the
    *visual* handoff to the case stack: as the stack rises and covers the
    hero, the cue rises with it and fades to 0 so it doesn't hover over the
    first case card.

    We avoid ScrollTrigger here for the same reason CaseCard does
    (CaseCard.jsx:10-13) — its start/end position maths are unreliable for
    `position: sticky` elements. Instead we read the case stack's live rect
    each frame, which is the only honest measure of "how covered is the
    hero right now".

    Progress p: 0 when the stack's top is at the hero's bottom edge
    (the moment coverage starts), 1 when the stack's top has reached the
    viewport top (the hero is fully covered). The cue's opacity is written
    directly (1 - p) and --cue-rise translates the cue up by 0 → 80px.

    Gated on revealedRef so the effect leaves the cue alone until the
    reveal tween has fired; before that the CSS `opacity: 0` keeps it
    hidden and the reveal tween's `opacity: 1` inline write is the only
    thing owning the property.

    Writes are throttled to rAF and skip when the value's string hasn't
    changed (useHeroParallax uses the same pattern for the same reason —
    no point invalidating the style tree for a no-op write).
  */
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const nextSection = hero.nextElementSibling || document.getElementById('selected-work')
    if (!nextSection) return

    const cue = cueRef.current
    if (!cue) return

    let raf = 0
    let lastOpacity = ''
    let lastRise = ''

    const measure = () => {
      raf = 0
      // Before the reveal tween fires, the cue is held at opacity 0 by its
      // own CSS. Don't touch it — the scroll effect is here only to hand
      // the cue off to the next section once it's already on screen.
      if (!revealedRef.current) return

      const vh = window.innerHeight
      // p = 0 when the rising section's top is at the hero's bottom (vh), p = 1 when
      // it reaches the viewport top (0).
      const sectionTop = nextSection.getBoundingClientRect().top
      const p = Math.max(0, Math.min(1, (vh - sectionTop) / vh))

      // Fade out completely by the time the next section reaches mid-viewport (p = 0.5).
      const fadeProgress = Math.min(1, p / 0.5)
      const opacity = (1 - fadeProgress).toFixed(3)

      // Translate up 1:1 with the top edge of the rising section so the cue's bottom edge stays locked to it.
      const rise = (p * vh).toFixed(1)
      if (opacity !== lastOpacity) {
        lastOpacity = opacity
        // Write opacity directly (the same property the reveal tween wrote
        // inline). Inline-style writes are intentionally racy with GSAP:
        // after the tween ends opacity is idle, so subsequent writes here
        // are uncontested.
        cue.style.opacity = opacity
      }
      if (rise !== lastRise) {
        lastRise = rise
        hero.style.setProperty('--cue-rise', `${rise}px`)
      }
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <>
      <section className={styles.hero} ref={heroRef} aria-label="Product design work">
        {/* Real heading for assistive tech and SEO; the kinetic version is decorative. */}
        <h1 className="sr-only">
          {profile.name} — {profile.role}
        </h1>

        <HeroCarousel revealed={revealed} stageRef={stageRef} />

        {/*
          The overlay holds the whole DOM scene — title, taglines and figure —
          and tilts it toward the pointer in 3D. Inside it, a single .layerScene
          carries the title and taglines together with one shared translate, so
          their depth-driven magnification gives each layer the right amount of
          apparent travel (see useArcSurface); the character sits in its own
          wrapper because it carries no translate of its own.
        */}
        <div className={styles.overlay}>
          <div className={styles.layerScene}>
            <p className={styles.title} ref={titleRef} aria-hidden="true">
              <span className={styles.heading} ref={headingRef}>
                <span className={styles.lead}>{profile.heroLead}</span>
                <span className={styles.wordSlot} ref={slotRef}>
                  {/*
                    The cycling word is built here in JS (see the effect above):
                    one glyph per letter, each a stroked outline copy with a
                    solid fill laid over it, flashed in/out per glyph.
                  */}
                  <span className={styles.word} ref={wordRef} />
                </span>
              </span>
            </p>

            <div className={styles.aside} ref={asideRef} aria-hidden="true">
              <span className={styles.asideLeft} ref={asideLeftRef}>
                {profile.taglines[0]}
              </span>
              <span className={styles.asideRight} ref={asideRightRef}>
                {profile.taglines[1]}
              </span>
            </div>
          </div>

          <div className={styles.layerCharacter}>
            <img
              className={styles.character}
              ref={charRef}
              src="/characters/hero-character.webp"
              alt=""
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Anchored UI, deliberately outside the parallax so it stays put. */}
        <a className={styles.cue} href="#selected-work" ref={cueRef} data-click-burst>
          <span>Explore</span>
          <span className={styles.cueArrow} aria-hidden="true" />
        </a>
      </section>

      <HeroMarquee />
    </>
  )
}
