import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { profile } from '../../data/projects'
import { useHeroParallax } from '../../hooks/useHeroParallax'
import { useArcSurface } from '../../hooks/useArcSurface'
import HeroCarousel from './HeroCarousel'
import HeroMarquee from './HeroMarquee'
import styles from './Hero.module.css'

/*
  The display title is a 2D arch plus a per-glyph 3D depth. The arch — a
  quadratic vertical nudge — is index-based and lives here; it reads as the
  reference's kinetic distortion while staying plain DOM text (selectable,
  accessible, and far easier to retitle than baked WebGL type).

  The 3D depth (translateZ) is NOT computed here: it comes from the shared arc
  surface in utils/arc-surface.js, measured and written per glyph by
  useArcSurface. That is what puts the title, the taglines and the WebGL card
  row on one curved surface instead of three look-alikes. Only the z-depth is
  applied to the glyphs — the tangent yaw is left off so the letters stay
  upright.
*/
const ARC_DEPTH = 0.18 // convex arch depth

function ArcedTitle({ text }) {
  const chars = [...text]
  const last = Math.max(1, chars.length - 1)

  return (
    <span className={styles.titleInner}>
      {chars.map((ch, i) => {
        const c = (i / last) * 2 - 1 // -1 → +1 across the line
        // Convex arch (∩): center is high (dy≈0), edges drop down (positive dy)
        const dy = c * c * ARC_DEPTH
        const isSpace = ch === ' '
        return (
          <span
            key={`${ch}-${i}`}
            className={styles.titleChar}
            data-space={isSpace ? '' : undefined}
            style={{
              '--dy': `${dy}em`,
              // --dz is written by useArcSurface from the shared arc.
            }}
          >
            {ch === ' ' ? ' ' : ch}
          </span>
        )
      })}
    </span>
  )
}

export default function Hero({ revealed = true }) {
  const heroRef = useRef(null)
  const stageRef = useRef(null)
  const titleRef = useRef(null)
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

  // Measures the title glyphs and taglines onto the arc surface (--dz/--rotY).
  useArcSurface(heroRef, {
    titleRef,
    asideRef,
    glyphSelector: `.${styles.titleChar}`,
    asideLeftSelector: `.${styles.asideLeft}`,
    asideRightSelector: `.${styles.asideRight}`,
  })

  useEffect(() => {
    if (!revealed) return

    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const chars = titleRef.current?.querySelectorAll(`.${styles.titleChar}`)
    const stage = stageRef.current

    // Reduced motion: just reveal everything, no movement.
    if (calm) {
      gsap.set(
        [asideLeftRef.current, asideRightRef.current, charRef.current, cueRef.current],
        { opacity: 1 },
      )
      if (stage) gsap.set(stage, { opacity: 1 })
      if (chars) gsap.set(chars, { opacity: 1 })
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

    // Title chars scale + fade in from the centre outward with stagger.
    if (chars?.length) {
      const mid = (chars.length - 1) / 2
      tl.fromTo(
        chars,
        { opacity: 0, scale: 0.5 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          ease: 'power2.out',
          stagger: { each: 0.025, from: Math.round(mid) },
        },
        0,
      )
    }

    // Taglines arrive a beat behind. The cue waits until the loader's root
    // opacity tween has finished AND the loader DOM has unmounted, so it
    // never paints in front of the loader's character copy during the
    // crossfade. The intro timeline (IntroLoader.jsx) fires onReveal at the
    // start of the morph; the root opacity tween then runs from revealed +
    // 2.25s to revealed + 2.85s, with setHidden(true) unmounting the loader
    // DOM on the last frame. We start the cue at revealed + 3.0s (0.15s
    // buffer past unmount) and it finishes fading in at revealed + 3.5s.
    tl.to(
      [asideLeftRef.current, asideRightRef.current],
      { opacity: 1, duration: 0.5, ease: 'power2.out' },
      0.15,
    )
      .to(cueRef.current, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 3.0)

    return () => tl.kill()
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

    const stack = document.getElementById('selected-work')
    if (!stack) return

    const RISE_PX = 80

    const cue = cueRef.current
    if (!cue) return

    let raf = 0
    let lastOpacity = ''
    let lastRise = ''

    const measure = () => {
      raf = 0
      // Before the reveal tween fires, the cue is held at opacity 0 by its
      // own CSS. Don't touch it — the scroll effect is here only to hand
      // the cue off to the case stack once it's already on screen.
      if (!revealedRef.current) return

      const vh = window.innerHeight
      // p = 0 when the stack's top is at the hero's bottom (vh), p = 1 when
      // the stack's top has reached the viewport top (0).
      const stackTop = stack.getBoundingClientRect().top
      const p = Math.max(0, Math.min(1, (vh - stackTop) / vh))
      const opacity = (1 - p).toFixed(3)
      const rise = (p * RISE_PX).toFixed(1)
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
        {/* Real heading for assistive tech and SEO; the arced version is decorative. */}
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
              <ArcedTitle text={profile.heroTitle} />
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
