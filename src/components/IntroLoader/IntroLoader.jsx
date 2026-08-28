import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import Logo from '../Header/Logo'
import styles from './IntroLoader.module.css'

/*
  First-load intro. Reveals the composition in one move after the subject lands:

    1  the brand mark assembles in red on blank paper and holds, long enough to
       register as the brand before it turns into anything else
    2  it grows and sweeps down into the hero character, crossfading, so the mark
       *becomes* the subject
    3  the subject holds alone
    4  the opaque backdrop lifts — the 3D wheel appears (launching fast and
       easing down behind the figure, see startIntroSpin) AND the site chrome
       arrives together, all from behind the same fading sheet
    5  the sheet fades out, handing the figure over to the identical hero copy

  Nothing but the mark is on screen for step 1: the backdrop covers the wheel and
  Header/Hero hold their own chrome at opacity 0 until `onReveal`. Otherwise the
  intro reads as the finished site with a logo floating over it.

  `onReveal` fires as the backdrop fade *starts*, not after, so the wheel and the
  chrome underneath crossfade with the sheet on top instead of popping in behind
  a sheet that has already gone.

  The callback is read through a ref so a new callback identity never re-runs the
  timeline (App re-creates the prop on every render). Under reduced motion we
  skip straight to done.
*/
export default function IntroLoader({ onReveal }) {
  const rootRef = useRef(null)
  const backdropRef = useRef(null)
  const logoRef = useRef(null)
  const charRef = useRef(null)
  const [hidden, setHidden] = useState(false)

  const onRevealRef = useRef(onReveal)
  useEffect(() => {
    onRevealRef.current = onReveal
  }, [onReveal])

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setHidden(true)
      onRevealRef.current?.()
      return
    }

    const root = rootRef.current
    const backdrop = backdropRef.current
    const logo = logoRef.current
    const character = charRef.current
    const parts = logo?.querySelectorAll('[data-part]')
    if (!root || !backdrop || !logo || !character || !parts?.length) return

    /*
      Wipe any inline values a previous run left behind before measuring or
      building. StrictMode invokes this effect twice in dev: the first pass's
      `tl.kill()` abandons GSAP's inline styles mid-tween, which breaks the
      rebuild two ways — the rects below would be measured off a half-morphed
      logo, and a `from()` would read the leftover `opacity: 0` as its END value
      and tween 0 → 0, leaving the mark invisible for the whole intro.

      The tweens below use fromTo with explicit end states for the same reason;
      clearProps alone fixes the double-mount but not a mid-flight remount.
    */
    gsap.set([root, backdrop, logo, character, ...parts], { clearProps: 'all' })

    // Where the mark needs to land: the centre of the hero character. The
    // character copy here is bottom-anchored and centred exactly like the one
    // in the hero, so measuring it gives the precise hand-off point.
    const logoRect = logo.getBoundingClientRect()
    const charRect = character.getBoundingClientRect()
    const dx = charRect.left + charRect.width / 2 - (logoRect.left + logoRect.width / 2)
    const dy = charRect.top + charRect.height / 2 - (logoRect.top + logoRect.height / 2)
    const morphScale = charRect.height / logoRect.height

    const tl = gsap.timeline()

    // 1. The red mark assembles, piece by piece, then breathes once and sits.
    tl.fromTo(
      parts,
      { opacity: 0, y: 22, scale: 0.8 },
      { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'back.out(2)', stagger: 0.11 },
    )
      .to(logo, { scale: 1.06, duration: 0.35, ease: 'power2.inOut' }, '+=0.3')
      .to(logo, { scale: 1, duration: 0.28, ease: 'power2.inOut' })

      // 2. Morph. `morph` labels the start of the travel so the logo's fade and
      //    the character's rise key off the same moment and overlap into a
      //    crossfade, instead of one finishing before the other starts.
      .addLabel('morph', '+=0.35')
      .to(logo, { x: dx, y: dy, scale: morphScale, duration: 1.05, ease: 'power3.inOut' }, 'morph')
      .to(logo, { opacity: 0, duration: 0.38, ease: 'power1.in' }, 'morph+=0.58')
      // `immediateRender: false` keeps the from-state off until the tween runs:
      // the morph scale above is measured off the character's natural height, so
      // it must still be unscaled when the rects are read. Its CSS opacity: 0
      // keeps it hidden until then.
      .fromTo(
        character,
        { opacity: 0, scale: 0.72 },
        { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out', immediateRender: false },
        'morph+=0.4',
      )
      // Fire onReveal at the same moment the character lands, so the hero's
      // carousel and title begin their scale-up behind the backdrop — they're
      // already in motion by the time the sheet lifts, eliminating any gap.
      .add(() => onRevealRef.current?.(), 'morph+=0.4')

      // 3. Brief hold while the character settles, then lift the backdrop.
      .to(backdrop, { opacity: 0, duration: 0.75, ease: 'power2.inOut' }, '+=0.15')

      // 5. Let the wheel be seen slowing, then hand the figure off to the hero
      //    underneath as this sheet fades.
      .to({}, { duration: 0.55 })
      .to(root, {
        opacity: 0,
        duration: 0.6,
        ease: 'power2.inOut',
        onComplete: () => setHidden(true),
      })

    return () => tl.kill()
  }, [])

  if (hidden) return null

  return (
    <div className={styles.loader} ref={rootRef} aria-hidden="true">
      {/* Opaque until step 4 — this is what keeps the wheel out of the logo phase. */}
      <div className={styles.backdrop} ref={backdropRef} />
      <div className={styles.logoWrap} ref={logoRef}>
        <Logo className={styles.logo} partClassName={styles.part} />
      </div>
      <div className={styles.charWrap}>
        <img
          ref={charRef}
          className={styles.character}
          src="/characters/hero-character.webp"
          alt=""
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
