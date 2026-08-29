import { useState, useEffect } from 'react'
import { profile } from '../../data/projects'
import LanyardCanvas from './LanyardCanvas'
import styles from './About.module.css'

export default function About() {
  const [copied, setCopied] = useState(false)
  const [time, setTime] = useState('')

  // Live IST Clock update
  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      const timeStr = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
      setTime(timeStr)
    }

    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Insecure context fallback
    }
  }

  return (
    <section className={styles.aboutSection} id="about" aria-label="About Ayush Singh">
      <div className={styles.container}>
        {/* Section Header */}
        <div className={styles.headerBlock}>
          <span className={styles.subTag}>// ABOUT THE CREATOR</span>
          <h2 className={styles.mainHeading}>AYUSH SINGH</h2>
          <p className={styles.tagline}>
            Product Designer & Creative Developer crafting high-precision web applications,
            3D interactive interfaces, and mobile products.
          </p>
        </div>

        {/* Bento Grid Container */}
        <div className={styles.bentoGrid}>
          {/* Bento Tile 1: 3D Interactive Lanyard Pass */}
          <div className={`${styles.bentoCard} ${styles.cardLanyard}`}>
            <div className={styles.lanyardHeader}>
              <span className={styles.passBadge}>ACCESS PASS // #2026</span>
              <div className={styles.statusPulse}>
                <span className={styles.pulseDot} />
                <span>PHYSICS ACTIVE</span>
              </div>
            </div>

            <div className={styles.lanyardCanvasWrapper}>
              <LanyardCanvas frontImage="/profile-photo.png" lanyardImage="/lanyard.png" />
            </div>

            <div className={styles.lanyardFooter}>
              <div className={styles.dragHint}>
                <span>🖐️ GRAB & SWING 3D PASS</span>
              </div>
            </div>
          </div>

          {/* Bento Tile 2: Core Bio & Philosophy */}
          <div className={`${styles.bentoCard} ${styles.cardBio}`}>
            <div>
              <div className={bioTagStyle(styles)}>PHILOSOPHY & CRAFT</div>
              <h3 className={styles.bioHeading}>
                ENGINEERING AT THE INTERSECTION OF AESTHETIC PRECISION & REAL-TIME PHYSICS
              </h3>
              <p className={styles.bioText}>
                I blend modern front-end engineering with immersive 3D graphics, motion physics, and clean architecture.
                Whether constructing offline-first mobile mesh tools, AI evaluation platforms, or interactive web canvases,
                my goal is always zero latency and unforgettable user delight.
              </p>
            </div>
            <div className={styles.skillPills}>
              <span className={styles.pill}>Full-Stack Design</span>
              <span className={styles.pill}>Three.js & Shaders</span>
              <span className={styles.pill}>React / Vite</span>
              <span className={styles.pill}>Android & Capacitor</span>
              <span className={styles.pill}>GSAP Motion</span>
              <span className={styles.pill}>Python & AI Systems</span>
            </div>
          </div>

          {/* Bento Tile 3: Profile Photo Spotlight */}
          <div className={`${styles.bentoCard} ${styles.cardPhoto}`}>
            <div className={styles.photoFrame}>
              <img
                src="/profile-photo.png"
                alt="Ayush Singh"
                className={styles.photoImg}
              />
            </div>
            <div className={styles.photoMeta}>
              <div className={styles.photoName}>AYUSH SINGH</div>
              <div className={styles.photoRole}>DESIGN & CODE // 2026</div>
            </div>
          </div>

          {/* Bento Tile 4: Live Location & Time Radar */}
          <div className={`${styles.bentoCard} ${styles.cardLocation}`}>
            <div className={styles.locationTop}>
              <span className={styles.locationLabel}>LOCATION & RADAR</span>
              <span className={styles.tzLabel}>IST (UTC+5:30)</span>
            </div>
            <div>
              <div className={styles.clockValue}>{time || '12:00:00'}</div>
              <div className={styles.locationLabel}>KOTA, RAJASTHAN, INDIA</div>
            </div>
            <div className={styles.locationCoords}>
              <span>🌐</span>
              <span>25.2138° N, 75.8648° E</span>
            </div>
          </div>

          {/* Bento Tile 5: Tech Stack Cloud */}
          <div className={`${styles.bentoCard} ${styles.cardTech}`}>
            <div className={styles.techTitle}>TECH MATRIX</div>
            <div className={styles.techGrid}>
              <div className={styles.techCategory}>
                <span className={styles.catName}>Frontend & 3D</span>
                <div className={styles.catPills}>
                  <span className={styles.techChip}>React</span>
                  <span className={styles.techChip}>Vite</span>
                  <span className={styles.techChip}>Three.js</span>
                  <span className={styles.techChip}>GSAP</span>
                </div>
              </div>
              <div className={styles.techCategory}>
                <span className={styles.catName}>Systems & Mobile</span>
                <div className={styles.catPills}>
                  <span className={styles.techChip}>Capacitor</span>
                  <span className={styles.techChip}>BLE/WiFi</span>
                  <span className={styles.techChip}>CPFSK</span>
                  <span className={styles.techChip}>Python</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Tile 6: Metrics & Key Stats */}
          <div className={`${styles.bentoCard} ${styles.cardStats}`}>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statNum}>05+</span>
                <span className={styles.statLabel}>Shipped Cases</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNum}>60 FPS</span>
                <span className={styles.statLabel}>Physics Canvas</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNum}>100%</span>
                <span className={styles.statLabel}>Pixel Perfect</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNum}>&lt; 50ms</span>
                <span className={styles.statLabel}>UI Latency</span>
              </div>
            </div>
          </div>

          {/* Bento Tile 7: Contact & One-Click Copy */}
          <div className={`${styles.bentoCard} ${styles.cardContact}`}>
            <div>
              <div className={styles.contactTitle}>LET'S CREATE TOGETHER</div>
              <p className={styles.contactDesc}>
                Open for design engineering roles, technical collaboration, and freelance inquiries.
              </p>
            </div>
            <div className={styles.contactActions}>
              <button
                type="button"
                className={styles.emailBtn}
                onClick={copyEmail}
                data-click-burst
              >
                <span>{copied ? '✓ COPIED TO CLIPBOARD' : `✉ ${profile.email}`}</span>
              </button>
              <div className={styles.socialsRow}>
                {profile.socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.socialLink}
                    aria-label={s.label}
                    data-click-burst
                  >
                    <img src={s.icon} alt="" className={styles.socialIcon} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function bioTagStyle(styles) {
  return styles.bioTag
}
