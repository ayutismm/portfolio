import { useEffect, useRef } from 'react'
import styles from './CaseStack.module.css'

/*
  One case-study panel.

  Cards are sticky and share `top: 0`, so each slides up and covers the previous
  one — the stacked-deck effect from the reference.

  coverage — reads the *next* section's live rect each frame. Once this section
             is stuck its own rect is constant, so the only honest measure of
             "how covered am I" is where the next card has got to. This drives
             the subtle scale-back as the next card climbs over this one.

  (There is deliberately no entrance fade/slide: the content is painted at rest.)
*/
export default function CaseCard({ project, index, isLast }) {
  const sectionRef = useRef(null)
  const frameRef = useRef(null)

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

  // Title styling: first word tinted with the case ink, remainder in black.
  // Single-word names (DHWANI, GitRate…) have no remainder and tint fully.
  const [lead, ...restWords] = project.name.split(' ')
  const rest = restWords.join(' ')

  // Device frame: 'phone' (portrait) for the Android app, 'laptop' (landscape)
  // for the web apps.
  const isPhone = project.type === 'phone'

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      aria-label={`Selected case ${index + 1}`}
      // z-index climbs so later cards paint over earlier ones.
      style={{ zIndex: 5 + index, '--case-ink': project.ink }}
    >
      <div className={styles.frame} ref={frameRef}>
        <span className={styles.number} aria-hidden="true">
          {project.number}
        </span>

        <div className={styles.cover}>
          <div className={styles.content}>
            <h2 className={styles.title}>
              <span className={styles.titleLead}>{lead}</span>
              {rest ? ` ${rest}` : ''}
            </h2>

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

          <div className={`${styles.mock} ${isPhone ? styles.mockPhone : styles.mockLaptop}`}>
            <img src={project.cover} alt={`${project.name} preview`} />
          </div>
        </div>
      </div>
    </section>
  )
}
