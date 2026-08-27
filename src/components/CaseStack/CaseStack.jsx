import { projects } from '../../data/projects'
import CaseCard from './CaseCard'
import styles from './CaseStack.module.css'

export default function CaseStack() {
  return (
    <div className={styles.stack} id="selected-work">
      <h2 className="sr-only">Selected work</h2>
      {projects.map((project, i) => (
        <CaseCard
          key={project.id}
          project={project}
          index={i}
          isLast={i === projects.length - 1}
        />
      ))}
    </div>
  )
}
