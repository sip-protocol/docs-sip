# CLAUDE.md - SIP Documentation

> **Ecosystem Hub:** See [sip-protocol/CLAUDE.md](https://github.com/sip-protocol/sip-protocol/blob/main/CLAUDE.md) for full ecosystem context

**Repository:** https://github.com/sip-protocol/docs-sip
**Purpose:** Official documentation website for SIP Protocol

---

## Current Focus

**Status:** M17 Complete | M18 Active (Ethereum Same-Chain)
**Strategy:** Same-chain expansion - documentation for multi-chain same-chain privacy
**SDK Version:** 0.7.3 (ensure docs reference current version)

### Phase 4 Documentation Priorities

**M16 (Narrative Capture):**
- Cryptographic privacy vs pool mixing explainer
- PrivacyCash comparison article
- Compliance/viewing keys documentation
- Updated architecture diagrams for same-chain

**M17 (Solana Same-Chain):**
- Solana same-chain SDK guide
- Jupiter DEX integration guide
- Mobile SDK (React Native) documentation
- Same-chain transaction examples

---

## Quick Reference

**Tech Stack:** Astro 5, Starlight, MDX
**Deployment:** docs.sip-protocol.org (Docker + GHCR)

**Key Commands:**
```bash
npm install               # Install dependencies
npm run dev               # Dev server (localhost:4321)
npm run build             # Build for production
npm run preview           # Preview build
```

---

## Key Files

| Path | Description |
|------|-------------|
| `src/content/docs/` | Documentation pages (MDX) |
| `src/content/config.ts` | Content collections config |
| `astro.config.mjs` | Astro + Starlight configuration |
| `src/styles/` | Custom styles |
| `src/assets/` | Images and assets |
| `public/` | Static files |

---

## Content Structure

```
src/content/docs/
├── index.mdx           # Home page
├── getting-started/    # Quickstart guides
├── concepts/           # Core concepts (privacy, stealth, etc.)
├── sdk/                # SDK reference
├── api/                # API documentation
├── specs/              # ZK proof specifications
├── guides/             # How-to guides
├── comparisons/        # Privacy approach comparisons
└── apps/               # [NEW] sip-app documentation
    ├── payments/       # Private payments guide
    ├── wallet/         # Wallet interface guide
    └── dex/            # DEX integration guide
```

**Note:** Application documentation for `app.sip-protocol.org` lives here. The sip-app repo contains the code, this repo documents usage.

---

## Key Concepts to Document

| Concept | Description | Priority |
|---------|-------------|----------|
| Cryptographic vs Pool Privacy | Why Pedersen > pool mixing | High (M16) |
| Viewing Keys | Compliance layer for institutions | High (M16) |
| Same-Chain Privacy | Privacy without cross-chain settlement | High (M17) |
| Stealth Addresses | EIP-5564 on Solana | Medium |
| Proof Composition | Future multi-system proofs | Low (M19+) |

---

## Repo-Specific Guidelines

**DO:**
- Use MDX for interactive documentation
- Include code examples with syntax highlighting
- Keep navigation structure shallow
- Emphasize SIP's cryptographic advantages

**DON'T:**
- Duplicate content from SDK JSDoc
- Add custom components without need
- Make claims without technical backing

---

## Starlight Features

- Automatic sidebar from file structure
- Built-in search
- Dark/light mode
- i18n ready

---

## Competitive Documentation

When documenting SIP advantages:
- **vs Pool Mixing (PrivacyCash):** Fixed amounts, correlation attacks, no compliance
- **vs MPC (Arcium):** Setup assumptions, trust requirements, key management
- Focus on: Any amount hidden, mathematical guarantees, viewing keys for auditors

---

**Last Updated:** 2026-01-25
