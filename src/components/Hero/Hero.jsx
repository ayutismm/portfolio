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

    // Taglines and explore cue arrive a beat behind.
    tl.to(
      [asideLeftRef.current, asideRightRef.current],
      { opacity: 1, duration: 0.5, ease: 'power2.out' },
      0.15,
    )
      .to(cueRef.current, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.3)

    return () => tl.kill()
  }, [revealed])

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
              src="/characters/hero-character.svg"
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
