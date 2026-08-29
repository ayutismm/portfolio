import { useState, useEffect } from 'react'
import { useLenis } from './hooks/useLenis'
import { useClickBurst } from './hooks/useClickBurst'
import IntroLoader from './components/IntroLoader/IntroLoader'
import Header from './components/Header/Header'
import Hero from './components/Hero/Hero'
import CaseStack from './components/CaseStack/CaseStack'
import About from './components/About/About'
import Footer from './components/Footer/Footer'
import './components/ui/ClickBurst.css'
import styles from './App.module.css'

export default function App() {
  const [revealed, setRevealed] = useState(false)

  // Dedicated page switching: 'design' vs 'about'
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#about') {
      return 'about'
    }
    return 'design'
  })

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    const handleHashChange = () => {
      if (window.location.hash === '#about') {
        setCurrentPage('about')
      } else {
        setCurrentPage('design')
      }
      window.scrollTo(0, 0)
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const handleNavigate = (targetPage) => {
    setCurrentPage(targetPage)
    if (targetPage === 'about') {
      window.location.hash = '#about'
    } else {
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname)
      }
    }
    window.scrollTo(0, 0)
  }

  useLenis()
  useClickBurst()

  return (
    <main className={styles.page}>
      <IntroLoader onReveal={() => setRevealed(true)} />
      <Header
        revealed={revealed}
        currentPage={currentPage}
        onNavigate={handleNavigate}
      />

      {currentPage === 'design' ? (
        <>
          <Hero revealed={revealed} />
          <CaseStack />
        </>
      ) : (
        <About />
      )}

      <Footer />
    </main>
  )
}
