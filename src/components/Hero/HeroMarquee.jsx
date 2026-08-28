import styles from './Hero.module.css'

/*
  Tech-stack logo strip. Each entry maps a label to a Devicon CDN SVG.
  The track holds two identical copies and translates by exactly -50%,
  so the loop point is seamless regardless of how many logos there are.
*/

const TECH_STACK = [
  { label: 'C++',            icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg' },
  { label: 'C',              icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/c/c-original.svg' },
  { label: 'Python',         icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg' },
  { label: 'JavaScript',     icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg' },
  { label: 'HTML',           icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg' },
  { label: 'CSS',            icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg' },
  { label: 'React',          icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg' },
  { label: 'Tailwind CSS',   icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg' },
  { label: 'Vite',           icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vitejs/vitejs-original.svg' },
  { label: 'Node.js',        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg' },
  { label: 'Express',        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg' },
  { label: 'Firebase',       icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/firebase/firebase-original.svg' },
  { label: 'Supabase',       icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/supabase/supabase-original.svg' },
  { label: 'Git',            icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg' },
  { label: 'GitHub',         icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg' },
  { label: 'Android Studio', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/androidstudio/androidstudio-original.svg' },
  { label: 'Figma',          icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg' },
  { label: 'SQL',            icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/azuresqldatabase/azuresqldatabase-original.svg' },
  { label: 'Next.js',        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg' },
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
