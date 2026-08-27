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
*/
const FAN_DEGREES = 8 // rotation at the line's extremes
const ARC_DEPTH = 0.14 // em of vertical arc at the extremes

function ArcedTitle({ text }) {
  const chars = [...text]
  const last = Math.max(1, chars.length - 1)

  return (
    <span className={styles.titleInner}>
      {chars.map((ch, i) => {
        const c = (i / last) * 2 - 1 // -1 → +1 across the line
        // Fan outwards: left chars lean left (-), right chars lean right (+)
        const rotate = c * FAN_DEGREES
        // Convex arch (∩): center chars are high (dy=0), edge chars drop down
        // (positive dy), exactly matching the 'BRAND DESIGN' reference.
        const dy = c * c * ARC_DEPTH
        const isSpace = ch === ' '
        return (
          <span
            key={`${ch}-${i}`}
            className={styles.titleChar}
            data-space={isSpace ? '' : undefined}
            style={{ '--rot': `${rotate}deg`, '--dy': `${dy}em` }}
          >
            {ch === ' ' ? ' ' : ch}
          </span>
        )
      })}
    </span>
  )
}

export default function Hero({ introDone }) {
  const heroRef = useRef(null)
  const titleRef = useRef(null)
  const asideRef = useRef(null)
  const charRef = useRef(null)
  const cueRef = useRef(null)

  // Drives --hero-cursor-x/y on the section; every layer below parallaxes off it.
  useHeroParallax(heroRef)

  useEffect(() => {
    if (!introDone) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const chars = titleRef.current?.querySelectorAll(`.${styles.titleChar}`)

    if (prefersReduced) {
      gsap.set([titleRef.current, asideRef.current, charRef.current, cueRef.current], { opacity: 1 })
      if (chars) gsap.set(chars, { opacity: 1, y: 0 })
      return
    }

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })

    tl.to(titleRef.current, { opacity: 1, duration: 0.1 })
      .from(chars, { yPercent: 118, opacity: 0, duration: 1.05, stagger: 0.028 }, 0)
      .from(charRef.current, { yPercent: 8, opacity: 0, duration: 1.1 }, 0.18)
      .from(asideRef.current?.children ?? [], { y: 22, opacity: 0, duration: 0.8, stagger: 0.1 }, 0.5)
      .from(cueRef.current, { y: 26, opacity: 0, duration: 0.7 }, 0.66)

    return () => tl.kill()
  }, [introDone])

  return (
    <>
      <section className={styles.hero} ref={heroRef} aria-label="Product design work">
        {/* Real heading for assistive tech and SEO; the arced version is decorative. */}
        <h1 className="sr-only">
          {profile.name} — {profile.role}
        </h1>

        <HeroCarousel />

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
