import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { profile } from '../../data/projects'
import { useHeroParallax } from '../../hooks/useHeroParallax'
import HeroCarousel from './HeroCarousel'
import HeroMarquee from './HeroMarquee'
import styles from './Hero.module.css'

/*
  Arc constants for the display title. Each glyph gets a rotation fanned across
  the line plus a quadratic vertical nudge, which reads as the reference's
  kinetic distortion while staying plain DOM text (selectable, accessible, and
  far easier to retitle than baked WebGL type).

  On top of that 2D arch, every glyph is pushed along the Z axis by a depth
  curve that mirrors the carousel row in utils/three-helpers.js
  (z = DEPTH * |slot| ** DEPTH_POW). The carousel is CONCAVE — the centre card
  sits deepest while the cards sweep forward toward the camera at the edges —
  so the title conforms to the same surface: the middle glyphs stay at the
  title's layout plane and the outer glyphs travel toward the viewer. Depth is
  in em so it scales with the fluid type size.
*/
const FAN_DEGREES = 8 // outward fan at the extremes
const ARC_DEPTH = 0.18 // convex arch depth
const DEPTH_Z = 0.9 // max Z travel at the extremes, in em (toward the camera)
const DEPTH_POW = 1.3 // matches the carousel row's exponent
// Approx glyph advance (em) for the display face at --tracking-tight. Turns
// the depth slope below into a real tangent angle rather than an arbitrary fan.
const GLYPH_W = 0.6
// The carousel lies its cards on the curved surface (FAN_RATIO in
// three-helpers.js); the title glyphs get the same treatment so the title
// conforms to the carousel's geometry, not a separate flat fan.
const FAN_RATIO = 0.7

function ArcedTitle({ text }) {
  const chars = [...text]
  const last = Math.max(1, chars.length - 1)
  // Horizontal half-width of the line in em, so the tangent is a slope in the
  // same units as the depth instead of a dimensionless index.
  const halfWidth = (last * GLYPH_W) / 2

  return (
    <span className={styles.titleInner}>
      {chars.map((ch, i) => {
        const c = (i / last) * 2 - 1 // -1 → +1 across the line
        // Fan outwards: left chars lean left (-), right chars lean right (+)
        const rotate = c * FAN_DEGREES
        // Convex arch (∩): center is high (dy≈0), edges drop down (positive dy)
        const dy = c * c * ARC_DEPTH
        // Concave depth, matching the carousel: the centre sits deepest and the
        // outer glyphs come forward by DEPTH_Z * |c| ** DEPTH_POW.
        const dz = DEPTH_Z * Math.abs(c) ** DEPTH_POW
        // Tangent of the depth curve in the horizontal plane → per-glyph yaw.
        // The sign flips so each glyph's OUTER edge turns toward the camera,
        // exactly like the carousel's cards (rotation.y = -sign(s) * atan(slope)).
        const slope = (DEPTH_Z * DEPTH_POW * Math.abs(c) ** (DEPTH_POW - 1)) / halfWidth
        const rotY = -Math.sign(c) * Math.atan(slope) * FAN_RATIO
        const isSpace = ch === ' '
        return (
          <span
            key={`${ch}-${i}`}
            className={styles.titleChar}
            data-space={isSpace ? '' : undefined}
            style={{
              '--rot': `${rotate}deg`,
              '--dy': `${dy}em`,
              '--dz': `${dz}em`,
              '--rotY': `${rotY}rad`,
            }}
          >
            {ch === ' ' ? ' ' : ch}
          </span>
        )
      })}
    </span>
  )
}

export default function Hero({ sceneRevealed = true, introDone }) {
  const heroRef = useRef(null)
  const titleRef = useRef(null)
  const asideRef = useRef(null)
  const charRef = useRef(null)
  const cueRef = useRef(null)

  // Drives --hero-cursor-x/y on the section; every layer below parallaxes off it.
  useHeroParallax(heroRef)

  useEffect(() => {
    if (!introDone) return

    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const chars = titleRef.current?.querySelectorAll(`.${styles.titleChar}`)

    // Reduced motion: just reveal everything, no movement.
    if (calm) {
      gsap.set([asideRef.current, charRef.current, cueRef.current], { opacity: 1 })
      if (chars) gsap.set(chars, { opacity: 1 })
      return
    }

    const tl = gsap.timeline()

    // Character first: it crossfades in beneath the intro's own copy, which is
    // fading out over the same window, so the hand-off reads as one continuous
    // figure. The title glyphs then stagger on and the taglines and cue follow.
    tl.to(charRef.current, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0)
      .to(asideRef.current, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.15)
      .to(cueRef.current, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.3)
    if (chars) {
      tl.to(chars, { opacity: 1, duration: 0.45, ease: 'power2.out', stagger: 0.012 }, 0.1)
    }

    return () => tl.kill()
  }, [introDone])

  return (
    <>
      <section className={styles.hero} ref={heroRef} aria-label="Product design work">
        {/* Real heading for assistive tech and SEO; the arced version is decorative. */}
        <h1 className="sr-only">
          {profile.name} — {profile.role}
        </h1>

        <HeroCarousel sceneRevealed={sceneRevealed} />

        {/*
          Each layer is its own wrapper so the parallax transform stays off the
          elements GSAP animates — otherwise the entrance tweens and the
          pointer transform would overwrite each other. Depth reads back to
          front: the title sits deepest, the figure nearest, so the figure
          travels furthest.
        */}
        <div className={styles.overlay}>
          <div className={styles.layerTitle}>
            <p className={styles.title} ref={titleRef} aria-hidden="true">
              <ArcedTitle text={profile.heroTitle} />
            </p>
          </div>

          <div className={styles.layerAside}>
            <div className={styles.aside} ref={asideRef} aria-hidden="true">
              <span className={styles.asideLeft}>{profile.taglines[0]}</span>
              <span className={styles.asideRight}>{profile.taglines[1]}</span>
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
