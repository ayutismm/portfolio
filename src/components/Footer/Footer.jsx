import { useEffect, useRef, useState } from 'react'
import { profile } from '../../data/projects'
import Logo from '../Header/Logo'
import styles from './Footer.module.css'

export default function Footer() {
  const [copied, setCopied] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const revealRef = useRef(null)

  // Same one-shot IntersectionObserver idiom as CaseCard: JS only flips a class,
  // CSS owns the staggered rise. The last card sits over the footer for most of
  // its travel, so a low threshold would fire while it was still hidden.
  useEffect(() => {
    const el = revealRef.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealed(true)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRevealed(true)
          io.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard may be unavailable; ignore rather than crash.
    }
  }

  return (
    <div className={`${styles.reveal} ${revealed ? styles.revealed : ''}`} ref={revealRef}>
      <footer className={styles.footer} aria-label="Footer">
        <div className={styles.contact} aria-label="Footer contact links">
          <button type="button" className={styles.email} onClick={copyEmail} data-click-burst>
            <span>{copied ? 'Copied!' : profile.email}</span>
          </button>
          {profile.socials.map((s) => (
            <a
              key={s.label}
              className={styles.social}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              aria-label={s.label}
              data-click-burst
            >
              <img src={s.icon} alt="" aria-hidden="true" />
            </a>
          ))}
        </div>

        <div className={styles.logoWrap} data-click-burst>
          <Logo className={styles.logo} partClassName={styles.logoPart} />
        </div>

        <p className={styles.year}>{new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}
