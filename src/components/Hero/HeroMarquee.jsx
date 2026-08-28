import styles from './Hero.module.css'

/*
  Tech-stack logo strip. Each entry maps a label to a devicon SVG, self-hosted
  in public/icons/techstack so the marquee costs no runtime CDN round-trips.
  The track holds two identical copies and translates by exactly -50%,
  so the loop point is seamless regardless of how many logos there are.
*/

const TECH_STACK = [
  { label: 'C++',            icon: '/icons/techstack/cplusplus.svg' },
  { label: 'C',              icon: '/icons/techstack/c.svg' },
  { label: 'Python',         icon: '/icons/techstack/python.svg' },
  { label: 'JavaScript',     icon: '/icons/techstack/javascript.svg' },
  { label: 'HTML',           icon: '/icons/techstack/html5.svg' },
  { label: 'CSS',            icon: '/icons/techstack/css3.svg' },
  { label: 'React',          icon: '/icons/techstack/react.svg' },
  { label: 'Tailwind CSS',   icon: '/icons/techstack/tailwindcss.svg' },
  { label: 'Vite',           icon: '/icons/techstack/vitejs.svg' },
  { label: 'Node.js',        icon: '/icons/techstack/nodejs.svg' },
  { label: 'Express',        icon: '/icons/techstack/express.svg' },
  { label: 'Firebase',       icon: '/icons/techstack/firebase.svg' },
  { label: 'Supabase',       icon: '/icons/techstack/supabase.svg' },
  { label: 'Git',            icon: '/icons/techstack/git.svg' },
  { label: 'GitHub',         icon: '/icons/techstack/github.svg' },
  { label: 'Android Studio', icon: '/icons/techstack/androidstudio.svg' },
  { label: 'Figma',          icon: '/icons/techstack/figma.svg' },
  { label: 'SQL',            icon: '/icons/techstack/azuresqldatabase.svg' },
  { label: 'Next.js',        icon: '/icons/techstack/nextjs.svg' },
]

function LogoSet() {
  return TECH_STACK.map(({ label, icon }) => (
    <div className={styles.marqueeItem} key={label} title={label}>
      <img
        className={styles.marqueeIcon}
        src={icon}
        alt={label}
        loading="lazy"
        draggable="false"
      />
      <span className={styles.marqueeLabel}>{label}</span>
    </div>
  ))
}

export default function HeroMarquee() {
  return (
    <div className={styles.marquee} aria-hidden="true">
      <div className={styles.marqueeTrack}>
        <div className={styles.marqueeSet}><LogoSet /></div>
        <div className={styles.marqueeSet}><LogoSet /></div>
      </div>
    </div>
  )
}
