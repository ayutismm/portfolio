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
  /*
    One gate: the intro holds everything — wheel and chrome — hidden until a
    single reveal moment, when the backdrop lifts and the whole composition
    (cards, title, taglines, cue) arrives together behind it. Starts false so
    nothing shows behind the loader.
  */
  const [revealed, setRevealed] = useState(false)

  useLenis()
  useClickBurst()

  return (
    <main className={styles.page}>
      <IntroLoader onReveal={() => setRevealed(true)} />
      <Header revealed={revealed} />
      <Hero revealed={revealed} />
      <CaseStack />
      <Footer />
    </main>
  )
}
