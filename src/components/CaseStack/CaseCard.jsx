import { useEffect, useRef, useState } from 'react'
import styles from './CaseStack.module.css'

/*
  One case-study panel.

  Cards are sticky and share `top: 0`, so each slides up and covers the previous
  one — the stacked-deck effect from the reference.

  Both animations deliberately avoid ScrollTrigger's start/end position maths:
  it derives scroll offsets from the trigger's layout position, which is
  unreliable for `position: sticky` elements (their rect stops moving once
  stuck), and that silently left every card pinned at opacity 0.

    entrance — IntersectionObserver flips a class; CSS does the staggered reveal.
    coverage — reads the *next* section's live rect each frame. Once this section
               is stuck its own rect is constant, so the only honest measure of
               "how covered am I" is where the next card has got to.
*/
export default function CaseCard({ project, index, isLast }) {
  const sectionRef = useRef(null)
  const frameRef = useRef(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setRevealed(true)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRevealed(true)
          io.disconnect() // one-shot: cards don't un-reveal on the way back up
        }
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (isLast) return
    const el = sectionRef.current
    const frame = frameRef.current
    if (!el || !frame) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    let raf = 0
    const measure = () => {
      raf = 0
      const next = el.nextElementSibling
      if (!next) return
      const vh = window.innerHeight
      // 0 when the next card is just entering, 1 when it fully overlaps us.
      const p = Math.max(0, Math.min(1, 1 - next.getBoundingClientRect().top / vh))
      frame.style.setProperty('--cover', p.toFixed(3))
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
  }, [isLast])

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      aria-label={`Selected case ${index + 1}`}
      // z-index climbs so later cards paint over earlier ones.
      style={{ zIndex: 5 + index, '--case-ink': project.ink }}
    >
      <div
        className={`${styles.frame} ${revealed ? styles.revealed : ''}`}
        ref={frameRef}
      >
        <span className={styles.number} aria-hidden="true">
          {project.number}
        </span>

        <div className={styles.cover}>
          <div className={styles.content}>
            <span className={styles.crest} aria-hidden="true" />

            <h2 className={styles.title}>
              {project.titleLines.map((line, i) => (
                <span className={styles.titleLine} key={i}>
                  {line.italic ? <em className={styles.titleItalic}>{line.text}</em> : line.text}
                </span>
              ))}
            </h2>

            <p className={styles.blurb}>{project.blurb}</p>

            <div className={styles.tags}>
              {project.tags.map((tag) => (
                <span className={styles.tag} key={tag}>
                  {tag}
                </span>
              ))}
            </div>

            {/* Placeholder: wire this to a case-study route when you have one. */}
            <button type="button" className={styles.button} data-click-burst>
              Deep dive
            </button>
          </div>

          <div className={styles.mock}>
            <img
              src={project.cover}
              alt={`${project.titleLines.map((l) => l.text).join(' ')} preview`}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
