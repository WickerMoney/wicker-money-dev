import type { ReactNode } from 'react'
import clsx from 'clsx'
import Heading from '@theme/Heading'
import styles from './styles.module.css'

type FeatureItem = {
  title: string
  description: ReactNode
}

const FeatureList: FeatureItem[] = [
  {
    title: 'Self-hosted, on purpose',
    description: (
      <>
        Run it on your own hardware via Docker. Your data lives on your server —
        there's no hosted account required to use it.
      </>
    ),
  },
  {
    title: 'A thin core, and plugins for the rest',
    description: (
      <>
        Core owns identity, money movement and the app shell. Budgets,
        importers, the "Until payday" widget and the balance forecast are
        plugins built against a published SDK.
      </>
    ),
  },
  {
    title: 'Isolation enforced by the database',
    description: (
      <>
        Row-level security, not application-layer trust: a plugin only sees the
        tables and rows it declared it needs, checked by PostgreSQL itself.
      </>
    ),
  },
]

function Feature({ title, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  )
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  )
}
