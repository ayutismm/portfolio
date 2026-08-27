import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import Logo from '../Header/Logo'
import styles from './IntroLoader.module.css'

/*
  First-load curtain. Staggers the logo parts in, holds briefly, then lifts the
  whole sheet away and reports completion so the hero can start its entrance.

  Calls `onDone` from an onComplete rather than a setTimeout so it stays in sync
  if the timeline is ever retimed. Under reduced-motion we skip straight to done.
*/
export default function IntroLoader({ onDone }) {
  const rootRef = useRef(null)
  const logoRef = useRef(null)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setHidden(true)
      onDone?.()
      return
    }

    const parts = logoRef.current?.querySelectorAll('[data-part]')
    const tl = gsap.timeline()

    tl.from(parts, {
      opacity: 0,
      y: 18,
      scale: 0.82,
      duration: 0.5,
      ease: 'back.out(2)',
      stagger: 0.09,
    })
      .to(logoRef.current, { scale: 1.06, duration: 0.34, ease: 'power2.inOut' }, '+=0.15')
      .to(
        rootRef.current,
        {
          yPercent: -100,
          duration: 0.78,
          ease: 'expo.inOut',
          onComplete: () => {
            setHidden(true)
            onDone?.()
          },
        },
        '-=0.1',
      )

    return () => tl.kill()
  }, [onDone])

  if (hidden) return null

  return (
    <div className={styles.loader} ref={rootRef} aria-hidden="true">
      <div className={styles.logoWrap} ref={logoRef}>
        <Logo className={styles.logo} partClassName={styles.part} />
      </div>
    </div>
  )
}
