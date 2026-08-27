import { useState } from 'react'
import { useLenis } from './hooks/useLenis'
import { useClickBurst } from './hooks/useClickBurst'
import IntroLoader from './components/IntroLoader/IntroLoader'
import Header from './components/Header/Header'
import Hero from './components/Hero/Hero'
import CaseStack from './components/CaseStack/CaseStack'
import Footer from './components/Footer/Footer'
import './components/ui/ClickBurst.css'
import styles from './App.module.css'

export default function App() {
  // Gate hero entrance animations on the intro loader finishing, so the title
  // and carousel animate *in* rather than being visible behind the loader.
  const [introDone, setIntroDone] = useState(false)

  useLenis()
  useClickBurst()

  return (
    <main className={styles.page}>
      <IntroLoader onDone={() => setIntroDone(true)} />
      <Header />
      <Hero introDone={introDone} />
      <CaseStack />
      <Footer />
    </main>
  )
}
