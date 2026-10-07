import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'

// This runs in Node.js - don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Wicker Money',
  tagline: 'Your Money. Your Way.',
  favicon: 'img/favicon.ico',

  // Real 16/32px + apple-touch-icon PNGs, same pattern apps/web/index.html
  // uses for the main app (favicon.ico alone doesn't cover Apple/high-DPI).
  headTags: [
    { tagName: 'link', attributes: { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/img/favicon-16.png' } },
    { tagName: 'link', attributes: { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/img/favicon-32.png' } },
    { tagName: 'link', attributes: { rel: 'apple-touch-icon', href: '/img/apple-touch-icon.png' } },
    // Who publishes the docs, and the site itself, as schema.org JSON-LD.
    // Docusaurus already adds a BreadcrumbList to each docs page.
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': 'https://wicker.money/#organization',
            name: 'Wicker Money',
            url: 'https://wicker.money/',
            logo: 'https://wicker.money/img/wickermoney-logo-primary.png',
            email: 'support@wicker.money',
            sameAs: ['https://github.com/wickermoney', 'https://github.com/wickermoney/wicker-money'],
          },
          {
            '@type': 'WebSite',
            '@id': 'https://wickermoney.dev/#website',
            url: 'https://wickermoney.dev/',
            name: 'Wicker Money Docs',
            description: 'Self-hosting, plugin development and API documentation for Wicker Money.',
            inLanguage: 'en',
            publisher: { '@id': 'https://wicker.money/#organization' },
          },
        ],
      }),
    },
  ],

  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  url: 'https://wickermoney.dev',
  baseUrl: '/',

  // GitHub Pages deployment config. Deployed via .github/workflows/deploy.yml
  // (actions/deploy-pages), not the `docusaurus deploy` CLI, but Docusaurus
  // still needs these to build correct canonical/edit URLs either way.
  organizationName: 'wickermoney',
  projectName: 'wicker-money-dev',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/docs',
          editUrl: 'https://github.com/wickermoney/wicker-money-dev/tree/main/',
        },
        // No blog: this is the dev-docs site (self-hosting, contributing, API
        // reference). Product/company blogging, if it happens, belongs on the
        // marketing site (wicker-money-marketing), not here.
        blog: false,
        // Search engines ignore changefreq and priority; leaving them out keeps
        // the sitemap to plain URLs.
        sitemap: {
          changefreq: null,
          priority: null,
          // Docusaurus's auto-generated category index pages are thin link
          // lists, not content worth ranking.
          ignorePatterns: ['/docs/category/**'],
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // 1200x630, the size link previews crop to. Docusaurus emits og:image and
    // twitter:image (summary_large_image) from this.
    image: 'img/social-card.png',
    metadata: [
      { property: 'og:site_name', content: 'Wicker Money Docs' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: 'Wicker Money developer documentation: self-hosting, the plugin SDK and the API reference.' },
      { name: 'theme-color', content: '#0c301c' },
    ],
    colorMode: {
      // Defaults to the visitor's system preference; the navbar switch (below)
      // still lets them override and remembers the choice, same shape as the
      // app's own light/dark/system switcher, just per-browser like that one.
      respectPrefersColorScheme: true,
    },
    navbar: {
      // No separate title text: the logo image below is already a horizontal
      // wordmark reading "WickerMoney" -- adding navbar.title duplicated the
      // brand name next to itself (found in review).
      logo: {
        alt: 'Wicker Money',
        src: 'img/wordmark-light.png',
        srcDark: 'img/wordmark-dark.png',
        height: 28,
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://github.com/wickermoney/wicker-money',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Self-hosting quickstart', to: '/docs/self-hosting/quickstart' },
            { label: 'Contributing', to: '/docs/contributing/dev-environment' },
            { label: 'API reference', to: '/docs/api/overview' },
          ],
        },
        {
          title: 'Project',
          items: [
            { label: 'GitHub', href: 'https://github.com/wickermoney/wicker-money' },
            { label: 'Roadmap', href: 'https://github.com/wickermoney/wicker-money/blob/main/ROADMAP.md' },
            { label: 'License (AGPL-3.0)', href: 'https://github.com/wickermoney/wicker-money/blob/main/LICENSE' },
          ],
        },
        {
          title: 'Support',
          items: [{ label: 'support@wicker.money', href: 'mailto:support@wicker.money' }],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Jeremy Reed. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'sql', 'docker', 'yaml'],
    },
  } satisfies Preset.ThemeConfig,
}

export default config
