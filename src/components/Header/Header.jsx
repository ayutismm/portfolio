import { useEffect, useRef, useState } from 'react'
import { profile } from '../../data/projects'
import { useScrolled } from '../../hooks/useScrolled'
import { useAtFooter } from '../../hooks/useAtFooter'
import Logo from './Logo'
import styles from './Header.module.css'

const TABS = ['Design', 'About']

export default function Header() {
  const [activeTab, setActiveTab] = useState(0)
  const [copied, setCopied] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })
  const tabRefs = useRef([])
  const scrolled = useScrolled(40)
  const atFooter = useAtFooter(60)

  // Position the sliding pill behind the active tab. Measured from the DOM
  // (rather than hard-coded widths) so it stays correct when the font loads or
  // labels change length.
  useEffect(() => {
    const move = () => {
      const el = tabRefs.current[activeTab]
      if (!el) return
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth })
    }
    move()
    // Re-measure once webfonts settle, otherwise the pill is sized to fallback metrics.
    document.fonts?.ready.then(move)
    window.addEventListener('resize', move)
    return () => window.removeEventListener('resize', move)
  }, [activeTab])

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard can be blocked (insecure context / permissions) — fail quietly
      // rather than throwing an unhandled rejection.
    }
  }

  return (
    <>
      <header
        className={styles.header}
        data-scrolled={scrolled ? '' : undefined}
        data-inverted={atFooter ? '' : undefined}
        aria-label="Main navigation"
      >
        <div className={styles.brand}>
          <span className={styles.logoLink} data-click-burst>
            <Logo className={styles.logo} />
          </span>
          <span className={styles.location} data-click-burst>
            <img src="/icons/location.svg" alt="" aria-hidden="true" />
            {profile.location}
          </span>
        </div>

        <nav className={styles.tabs} aria-label="Portfolio sections">
          <span
            className={styles.indicator}
            style={{ transform: `translateX(${indicator.left}px)`, width: `${indicator.width}px` }}
            aria-hidden="true"
          />
          {TABS.map((tab, i) => (
            <button
              key={tab}
              ref={(el) => (tabRefs.current[i] = el)}
              type="button"
              className={i === activeTab ? styles.tabActive : styles.tab}
              aria-current={i === activeTab ? 'page' : undefined}
              onClick={() => setActiveTab(i)}
              data-click-burst
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className={styles.contact} aria-label="Contact links">
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

        {/* Mobile-only disclosure for the contact block. */}
        <button
          type="button"
          className={styles.infoToggle}
          aria-expanded={panelOpen}
          aria-label="Show contact info"
          onClick={() => setPanelOpen((v) => !v)}
        >
          <span className={styles.infoIcon} aria-hidden="true" />
        </button>

        <div className={panelOpen ? styles.panelOpen : styles.panel} aria-hidden={!panelOpen}>
          <button type="button" className={styles.email} onClick={copyEmail} data-click-burst>
            <span>{copied ? 'Copied!' : profile.email}</span>
          </button>
          <div className={styles.panelSocials}>
            {profile.socials.map((s) => (
              <a
                key={s.label}
                className={styles.social}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                tabIndex={panelOpen ? 0 : -1}
              >
                <img src={s.icon} alt="" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </header>

      {panelOpen && (
        <button
          type="button"
          className={styles.scrim}
          aria-hidden="true"
          tabIndex={-1}
          onClick={() => setPanelOpen(false)}
        />
      )}
    </>
  )
}
