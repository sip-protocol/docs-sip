// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://docs.sip-protocol.org',
  integrations: [
    starlight({
      title: 'SIP Protocol',
      description: 'Privacy layer for cross-chain transactions via NEAR Intents + Zcash',
      logo: {
        light: './src/assets/logo-light.svg',
        dark: './src/assets/logo-dark.svg',
        replacesTitle: false,
      },
      components: {
        // Custom SiteTitle with SDK version badge
        SiteTitle: './src/components/SiteTitle.astro',
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/sip-protocol' },
        { icon: 'x.com', label: 'Twitter', href: 'https://x.com/rz1989sol' },
      ],
      editLink: {
        baseUrl: 'https://github.com/sip-protocol/docs-sip/edit/main/',
      },
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', slug: 'introduction' },
            { label: 'Quick Start', slug: 'getting-started' },
            { label: 'Architecture', slug: 'architecture' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Solver Integration', slug: 'guides/solver-integration' },
            { label: 'API Migration', slug: 'guides/api-migration' },
          ],
        },
        {
          label: 'Concepts',
          items: [
            { label: 'Privacy Levels', slug: 'concepts/privacy-levels' },
            { label: 'Stealth Addresses', slug: 'concepts/stealth-address' },
            { label: 'Viewing Keys', slug: 'concepts/viewing-key' },
          ],
        },
        {
          label: 'Specifications',
          collapsed: true,
          items: [
            { label: 'SIP Specification', slug: 'specs/sip-spec' },
            { label: 'ZK Architecture', slug: 'specs/zk-architecture' },
            { label: 'Funding Proof', slug: 'specs/funding-proof' },
            { label: 'Validity Proof', slug: 'specs/validity-proof' },
            { label: 'Fulfillment Proof', slug: 'specs/fulfillment-proof' },
            { label: 'Wallet Adapter', slug: 'specs/wallet-adapter-spec' },
          ],
        },
        {
          label: 'Integrations',
          collapsed: true,
          items: [
            { label: 'NEAR Intents', slug: 'integrations/near-intents' },
            { label: 'Zcash Integration', slug: 'integrations/zcash' },
            { label: 'Zcash Evaluation', slug: 'integrations/zcash-evaluation' },
          ],
        },
        {
          label: 'Security',
          collapsed: true,
          items: [
            { label: 'Threat Model', slug: 'security/threat-model' },
            { label: 'Security Properties', slug: 'security/security-properties' },
            { label: 'Known Limitations', slug: 'security/known-limitations' },
            { label: 'Audit Preparation', slug: 'security/audit-preparation' },
          ],
        },
        {
          label: 'Resources',
          items: [
            { label: 'Roadmap', slug: 'roadmap' },
            { label: 'Whitepaper', slug: 'whitepaper' },
          ],
        },
        {
          label: 'API Reference',
          collapsed: true,
          autogenerate: { directory: 'reference' },
        },
      ],
      head: [
        {
          tag: 'meta',
          attrs: {
            property: 'og:image',
            content: 'https://docs.sip-protocol.org/og-image.png',
          },
        },
      ],
    }),
  ],
});
