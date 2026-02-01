<div align="center">

<pre>
███████╗ ██╗ ██████╗     ██████╗  ██████╗  ██████╗███████╗
██╔════╝ ██║ ██╔══██╗    ██╔══██╗██╔═══██╗██╔════╝██╔════╝
███████╗ ██║ ██████╔╝    ██║  ██║██║   ██║██║     ███████╗
╚════██║ ██║ ██╔═══╝     ██║  ██║██║   ██║██║     ╚════██║
███████║ ██║ ██║         ██████╔╝╚██████╔╝╚██████╗███████║
╚══════╝ ╚═╝ ╚═╝         ╚═════╝  ╚═════╝  ╚═════╝╚══════╝
</pre>

# SIP Protocol Documentation

> **Privacy is not a feature. It's a right.**

**Official documentation for SIP Protocol — the privacy standard for Web3**

*Getting started • SDK reference • Concepts • Cookbook • Security • Specifications*

[![Built with Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)
[![Astro](https://img.shields.io/badge/Astro-5.0-BC52EE?logo=astro&logoColor=white)](https://astro.build/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeDoc](https://img.shields.io/badge/TypeDoc-API_Docs-blue)](https://typedoc.org/)
[![SDK](https://img.shields.io/badge/SDK-0.7.3-green)](https://www.npmjs.com/package/@sip-protocol/sdk)

**🏆 Winner — [Zypherpunk Hackathon](https://zypherpunk.xyz) ($6,500: NEAR $4,000 + Tachyon $500 + pumpfun $2,000) | #9 of 93 | 3 Tracks**

**Live:** [docs.sip-protocol.org](https://docs.sip-protocol.org)

</div>

---

## Table of Contents

- [What is SIP Docs?](#-what-is-sip-docs)
- [Documentation Sections](#-documentation-sections)
- [Quick Start](#-quick-start)
- [Architecture](#%EF%B8%8F-architecture)
- [Tech Stack](#%EF%B8%8F-tech-stack)
- [Features](#-features)
- [Development](#-development)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Related Projects](#-related-projects)
- [License](#-license)

---

## 📚 What is SIP Docs?

SIP Docs is the **official documentation** for SIP Protocol — the privacy standard for Web3. Built with Astro Starlight for a modern, searchable documentation experience.

```
docs.sip-protocol.org → "How to use SIP" (technical reference)
blog.sip-protocol.org → "Why privacy matters" (thought leadership)
```

**Complete coverage:** Getting started, SDK reference, concepts, cookbook, security, and specifications.

---

## 📖 Documentation Sections

### Getting Started

| Page | Description |
|------|-------------|
| [Introduction](https://docs.sip-protocol.org/introduction) | What is SIP Protocol? |
| [Getting Started](https://docs.sip-protocol.org/getting-started) | Quick installation & first steps |
| [Architecture](https://docs.sip-protocol.org/architecture) | System design overview |

### Core Concepts

| Concept | Description |
|---------|-------------|
| [Privacy Levels](https://docs.sip-protocol.org/concepts/privacy-levels) | Transparent, Shielded, Compliant |
| [Stealth Addresses](https://docs.sip-protocol.org/concepts/stealth-addresses) | DKSAP & EIP-5564 |
| [Viewing Keys](https://docs.sip-protocol.org/concepts/viewing-keys) | Selective disclosure |
| [Pedersen Commitments](https://docs.sip-protocol.org/concepts/commitments) | Amount hiding |

### SDK Cookbook

10 practical examples for common use cases:

| Recipe | Description |
|--------|-------------|
| Basic Swap | Simple private swap |
| Stealth Payment | Send to stealth address |
| Batch Transfers | Multiple recipients |
| Compliance Flow | Viewing key disclosure |
| Custom Privacy | Advanced configurations |

### Technical Specifications

| Spec | Description |
|------|-------------|
| [Funding Proof](https://docs.sip-protocol.org/specs/funding-proof) | Balance verification ZK circuit |
| [Validity Proof](https://docs.sip-protocol.org/specs/validity-proof) | Intent authorization ZK circuit |
| [Fulfillment Proof](https://docs.sip-protocol.org/specs/fulfillment-proof) | Swap execution ZK circuit |

### Integrations

| Integration | Description |
|-------------|-------------|
| [NEAR Intents](https://docs.sip-protocol.org/integrations/near) | Cross-chain settlement |
| [Zcash](https://docs.sip-protocol.org/integrations/zcash) | Shielded pool backend |
| [Solana](https://docs.sip-protocol.org/integrations/solana) | Same-chain privacy |

### Security

| Page | Description |
|------|-------------|
| [Threat Model](https://docs.sip-protocol.org/security/threat-model) | Security assumptions |
| [Security Properties](https://docs.sip-protocol.org/security/properties) | Guarantees provided |
| [Audit Preparation](https://docs.sip-protocol.org/security/audit-prep) | Audit readiness |

### Resources

| Resource | Description |
|----------|-------------|
| [Whitepaper](https://docs.sip-protocol.org/whitepaper) | Technical whitepaper |
| [Roadmap](https://docs.sip-protocol.org/roadmap) | Development milestones |
| [FAQ](https://docs.sip-protocol.org/faq) | Common questions |
| [Glossary](https://docs.sip-protocol.org/glossary) | Term definitions |
| [Changelog](https://docs.sip-protocol.org/changelog) | Version history |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/sip-protocol/docs-sip.git
cd docs-sip

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:4321
```

---

## 🏗️ Architecture

### Project Structure

```
docs-sip/
├── src/
│   ├── content/
│   │   └── docs/                 # Documentation pages (MDX)
│   │       ├── index.mdx         # Home page
│   │       ├── introduction.md   # What is SIP?
│   │       ├── getting-started.md
│   │       ├── architecture.md
│   │       │
│   │       ├── concepts/         # Core concepts
│   │       │   ├── privacy-levels.md
│   │       │   ├── stealth-addresses.md
│   │       │   └── viewing-keys.md
│   │       │
│   │       ├── cookbook/         # 10 practical examples
│   │       │   ├── basic-swap.md
│   │       │   ├── stealth-payment.md
│   │       │   └── ...
│   │       │
│   │       ├── sdk-api/          # SDK reference
│   │       ├── specs/            # ZK proof specifications
│   │       ├── guides/           # How-to guides
│   │       ├── integrations/     # NEAR, Zcash, Solana
│   │       ├── security/         # Security documentation
│   │       │
│   │       ├── whitepaper.md
│   │       ├── roadmap.md
│   │       ├── faq.md
│   │       ├── glossary.md
│   │       └── changelog.md
│   │
│   ├── assets/                   # Images, diagrams
│   ├── components/               # Custom Astro components
│   └── styles/                   # Custom CSS
│
├── scripts/
│   └── generate-api-docs.mjs     # TypeDoc API generation
│
├── public/                       # Static assets
├── astro.config.mjs              # Astro + Starlight config
└── typedoc.json                  # TypeDoc configuration
```

### Content Flow

```
MDX/MD Files → Starlight → Astro Build → Static HTML
      │            │            │
      │            ▼            │
      │    Auto-sidebar from    │
      │    file structure       │
      │            │            │
      └────────────┴────────────┘
```

---

## 🛠️ Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | Astro 5 | Static site generator |
| **Docs Theme** | Starlight | Documentation framework |
| **Content** | MDX | Markdown + components |
| **API Docs** | TypeDoc | Auto-generated from SDK |
| **Diagrams** | Mermaid | Architecture diagrams |
| **Images** | Sharp | Image optimization |
| **Search** | Pagefind | Built-in search |

---

## ✨ Features

### 📖 Documentation Features
- **Starlight theme** with dark/light mode
- **Auto-generated sidebar** from file structure
- **Built-in search** (Pagefind)
- **Mobile responsive** design
- **i18n ready** for translations

### 🔧 Developer Experience
- **API reference** auto-generated from SDK JSDoc
- **Code examples** with syntax highlighting
- **Copy to clipboard** for code blocks
- **Mermaid diagrams** for architecture

### 🎨 Design
- **Clean, readable** typography
- **Consistent navigation** structure
- **Breadcrumbs** for orientation
- **Table of contents** per page

---

## 💻 Development

### Commands

```bash
npm run dev           # Start dev server (localhost:4321)
npm run build         # Build for production
npm run preview       # Preview production build
npm run docs:api      # Generate API docs from SDK
npm run docs:api:clean # Clean and regenerate API docs
```

### Adding Documentation

1. Create MDX file in appropriate section:
```bash
touch src/content/docs/guides/my-guide.md
```

2. Add frontmatter:
```yaml
---
title: 'My Guide'
description: 'Guide description for SEO'
---
```

3. Write content with Markdown + components:
```mdx
# My Guide

Introduction text...

## Section 1

Content with code examples:

```typescript
import { SIP } from '@sip-protocol/sdk'

const sip = new SIP({ network: 'mainnet' })
```

:::note
This is a callout note.
:::
```

4. Preview locally:
```bash
npm run dev
```

---

## 📡 API Documentation

API reference is **auto-generated** from SDK source using TypeDoc:

```bash
# Generate API docs
npm run docs:api

# Clean and regenerate
npm run docs:api:clean
```

### Configuration

```json
// typedoc.json
{
  "entryPoints": ["node_modules/@sip-protocol/sdk/src/index.ts"],
  "out": "src/content/docs/reference",
  "plugin": ["typedoc-plugin-markdown"]
}
```

---

## 🚀 Deployment

### Docker (Production)

```bash
# Build Docker image
docker build -t docs-sip .

# Run locally
docker run -p 4321:80 docs-sip
```

### VPS Configuration

| Service | Port | Domain |
|---------|------|--------|
| docs-sip | 5003 | docs.sip-protocol.org |

```yaml
# docker-compose.yml (on VPS)
name: sip-docs

services:
  docs:
    image: ghcr.io/sip-protocol/docs-sip:latest
    container_name: sip-docs
    ports:
      - "5003:80"
    restart: unless-stopped
```

### CI/CD Pipeline

```
Push to main → GitHub Actions → Generate API Docs → Build Astro → Docker → GHCR → Deploy
```

---

## 🔗 Related Projects

| Project | Description | Link |
|---------|-------------|------|
| **sip-protocol** | Core SDK (source for API docs) | [GitHub](https://github.com/sip-protocol/sip-protocol) |
| **blog-sip** | Technical blog (complements docs) | [blog.sip-protocol.org](https://blog.sip-protocol.org) |
| **sip-app** | Privacy application | [app.sip-protocol.org](https://app.sip-protocol.org) |
| **sip-website** | Marketing website | [sip-protocol.org](https://sip-protocol.org) |

---

## 📄 License

[MIT License](LICENSE) — see LICENSE file for details.

---

<div align="center">

**🏆 Zypherpunk Hackathon Winner ($6,500) | #9 of 93 | 3 Tracks**

*Privacy is not a feature. It's a right.*

[Read the Docs](https://docs.sip-protocol.org) · [SDK Reference](https://docs.sip-protocol.org/sdk-api) · [Contribute](https://github.com/sip-protocol/docs-sip/issues)

Built with [Starlight](https://starlight.astro.build) by the SIP Protocol team.

*Part of the [SIP Protocol](https://github.com/sip-protocol) ecosystem*

</div>
