import { profile } from '../../data/projects'
import styles from './Hero.module.css'

/*
  Infinite tagline strip. The track holds two identical copies and translates by
  exactly -50%, so the loop point is seamless regardless of copy length.
*/
export default function HeroMarquee() {
  const copy = `${profile.taglines.join(' · ')} · `

  return (
    <div className={styles.marquee} aria-hidden="true">
      <div className={styles.marqueeTrack}>
        <span className={styles.marqueeCopy}>{copy}</span>
        <span className={styles.marqueeCopy}>{copy}</span>
      </div>
    </div>
  )
}
