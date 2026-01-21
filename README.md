# SIP Protocol Documentation

[![Built with Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)
[![Astro](https://img.shields.io/badge/Astro-5.6.1-BC52EE?logo=astro&logoColor=white)](https://astro.build)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**🏆 Winner — [Zypherpunk Hackathon](https://zypherpunk.xyz) 3 Tracks ($6,500: NEAR $4,000 + Tachyon $500 + pumpfun $2,000)**

Official documentation for **SIP Protocol** - the privacy layer for cross-chain transactions via NEAR Intents + Zcash.

**Live Site:** [docs.sip-protocol.org](https://docs.sip-protocol.org)

## About SIP Protocol

SIP (Shielded Intents Protocol) is the privacy standard for Web3 - like HTTPS for the internet. One toggle to shield sender, amount, and recipient using stealth addresses, Pedersen commitments, and viewing keys for compliance.

## Tech Stack

- **[Astro](https://astro.build)** - Modern static site generator
- **[Starlight](https://starlight.astro.build)** - Documentation framework built on Astro
- **[TypeDoc](https://typedoc.org)** - API documentation generator
- **[Mermaid](https://mermaid.js.org)** - Diagram generation
- **TypeScript** - Type-safe development

## Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm or pnpm package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/sip-protocol/docs-sip.git
cd docs-sip

# Install dependencies
npm install
```

### Development

```bash
# Start local development server at http://localhost:4321
npm run dev
```

### Build

```bash
# Build production site to ./dist/
npm run build

# Preview production build locally
npm run preview
```

### API Documentation

```bash
# Generate API reference docs from SDK
npm run docs:api

# Clean and regenerate API docs
npm run docs:api:clean
```

## Project Structure

```
docs-sip/
├── public/                 # Static assets (favicons, images)
├── src/
│   ├── assets/            # Images and logos
│   ├── components/        # Custom Astro components
│   ├── content/
│   │   └── docs/          # Documentation content (MDX/MD)
│   │       ├── cookbook/  # SDK usage examples
│   │       ├── concepts/  # Core concepts
│   │       ├── guides/    # Integration guides
│   │       ├── integrations/  # Platform integrations
│   │       ├── reference/ # Auto-generated API docs
│   │       ├── security/  # Security documentation
│   │       └── specs/     # Technical specifications
│   ├── styles/            # Custom CSS
│   └── content.config.ts  # Content collections config
├── scripts/               # Build scripts
│   └── generate-api-docs.mjs  # TypeDoc generation
├── astro.config.mjs       # Astro configuration
├── typedoc.json           # TypeDoc configuration
└── package.json           # Dependencies and scripts
```

## Documentation Content

Our documentation is organized into several sections:

- **Getting Started** - Introduction, quick start, architecture
- **Guides** - Solver integration, API migration
- **SDK Cookbook** - 10 practical code examples
- **Concepts** - Privacy levels, stealth addresses, viewing keys
- **Specifications** - Technical specs and ZK proofs
- **Integrations** - NEAR Intents, Zcash
- **Security** - Threat model, security properties, audit prep
- **Resources** - Roadmap, whitepaper, FAQ, glossary, changelog
- **API Reference** - Auto-generated from SDK source code

## Deployment

The documentation site is automatically deployed via GitHub Actions:

1. Push to `main` branch
2. GitHub Actions builds Docker image
3. Image pushed to GitHub Container Registry (GHCR)
4. VPS pulls and deploys via Docker Compose
5. Live at [docs.sip-protocol.org](https://docs.sip-protocol.org)

### Docker Deployment

```bash
# Build Docker image
docker build -t sip-docs .

# Run container
docker run -p 5003:5003 sip-docs
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Related Repositories

- [sip-protocol/sip-protocol](https://github.com/sip-protocol/sip-protocol) - Core SDK
- [sip-protocol/sip-website](https://github.com/sip-protocol/sip-website) - Demo app & website
- [sip-protocol/circuits](https://github.com/sip-protocol/circuits) - Noir ZK circuits
- [sip-protocol/.github](https://github.com/sip-protocol/.github) - Org configs

## License

This project is licensed under the [MIT License](LICENSE).

## Links

- **Documentation:** [docs.sip-protocol.org](https://docs.sip-protocol.org)
- **Website:** [sip-protocol.org](https://sip-protocol.org)
- **GitHub:** [github.com/sip-protocol](https://github.com/sip-protocol)
- **Twitter:** [@rz1989sol](https://x.com/rz1989sol)

---

Built with [Starlight](https://starlight.astro.build) by the SIP Protocol team.
