import type { ReactNode } from 'react'
import clsx from 'clsx'
import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import HomepageFeatures from '@site/src/components/HomepageFeatures'
import Heading from '@theme/Heading'

import styles from './index.module.css'

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext()
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        {/* "Weave together your future." is the vision-level hero tagline —
            reserved for homepage/pitch-deck use, distinct from the default
            tagline ("Your Money. Your Way.") shown in the navbar/footer.
            Deliberately not paired here with any claim about what's built —
            see documents/brand/wickermoney-brand-asset-report.md. */}
        <Heading as="h1" className="hero__title">
          Weave together your future.
        </Heading>
        <p className="hero__subtitle">
          {siteConfig.title} is a self-hostable personal finance app, built as
          a thin core plus installable plugins.
        </p>
        <div className={styles.buttons}>
          {/* button--primary here would render in the same blue as the hero
              background itself (both read --ifm-color-primary) and go nearly
              invisible -- found in review. button--secondary (solid) for the
              main CTA, button--secondary.button--outline for the lesser one,
              is the same pairing Docusaurus's own default hero uses for
              exactly this reason. */}
          <Link className="button button--secondary button--lg" to="/docs/self-hosting/quickstart">
            Get started self-hosting
          </Link>
          <Link
            className="button button--secondary button--outline button--lg"
            to="https://github.com/wickermoney/wicker-money"
          >
            View on GitHub
          </Link>
        </div>
      </div>
    </header>
  )
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="Docs: self-hosting, plugins and API"
      description="Documentation for Wicker Money, a self-hostable personal finance app: run it with Docker, build plugins with the SDK, and use the API."
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  )
}
