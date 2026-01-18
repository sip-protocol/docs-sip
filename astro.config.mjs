// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import rehypeMermaid from 'rehype-mermaid';

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
            { label: 'NEAR Privacy', slug: 'guides/near-privacy' },
            { label: 'Ethereum Privacy', slug: 'guides/ethereum-privacy' },
            { label: 'Solver Integration', slug: 'guides/solver-integration' },
            { label: 'API Migration', slug: 'guides/api-migration' },
          ],
        },
        {
          label: 'SDK Cookbook',
          items: [
            { label: 'Basic Swap with Privacy', slug: 'cookbook/01-basic-swap' },
            { label: 'Custom Privacy Levels', slug: 'cookbook/02-privacy-levels' },
            { label: 'Viewing Key Management', slug: 'cookbook/03-viewing-keys' },
            { label: 'Multi-Party Disclosure', slug: 'cookbook/04-multi-party-disclosure' },
            { label: 'Stealth Address Scanning', slug: 'cookbook/05-stealth-scanning' },
            { label: 'Compliance Reporting', slug: 'cookbook/06-compliance-reporting' },
            { label: 'Batch Transactions', slug: 'cookbook/07-batch-transactions' },
            { label: 'Error Handling Patterns', slug: 'cookbook/08-error-handling' },
            { label: 'Wallet Integration', slug: 'cookbook/09-wallet-integration' },
            { label: 'Testing with Mocks', slug: 'cookbook/10-testing-mocks' },
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
            { label: 'EIP-5564 Implementation', slug: 'specs/eip-5564' },
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
            { label: 'FAQ', slug: 'faq' },
            { label: 'Glossary', slug: 'glossary' },
            { label: 'Comparison', slug: 'comparison' },
            { label: 'Changelog', slug: 'changelog' },
          ],
        },
        {
          label: 'API Reference',
          collapsed: true,
          autogenerate: { directory: 'reference' },
        },
        {
          label: 'SDK API',
          collapsed: true,
          items: [
            { label: 'Proof Providers', slug: 'sdk-api/proof-providers' },
            { label: 'NEAR Privacy', slug: 'sdk-api/near-privacy' },
          ],
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
        // Umami Analytics (self-hosted, privacy-first)
        {
          tag: 'script',
          attrs: {
            defer: true,
            src: 'https://analytics.sip-protocol.org/script.js',
            'data-website-id': '5a56a99e-502d-499e-a282-c46a20e556e0',
          },
        },
      ],
    }),
  ],
  markdown: {
    rehypePlugins: [
      [rehypeMermaid, { strategy: 'img-svg', dark: true }],
    ],
  },
});
