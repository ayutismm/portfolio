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
    Two gates, because the intro reveals the composition in two steps: the wheel
    appears once the logo has morphed into the subject (`sceneRevealed`), and the
    site chrome — header, title, taglines, cue — only at the hand-off
    (`introDone`). Both start false so nothing shows behind the loader.
  */
  const [sceneRevealed, setSceneRevealed] = useState(false)
  const [introDone, setIntroDone] = useState(false)

  useLenis()
  useClickBurst()

  return (
    <main className={styles.page}>
      <IntroLoader
        onSceneReveal={() => setSceneRevealed(true)}
        onDone={() => setIntroDone(true)}
      />
      <Header introDone={introDone} />
      <Hero sceneRevealed={sceneRevealed} introDone={introDone} />
      <CaseStack />
      <Footer />
    </main>
  )
}
