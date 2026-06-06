---
title: Roadmap
description: SIP Protocol development roadmap and milestones
---

# Development Roadmap

SIP Protocol is building the **privacy standard for Web3** — like HTTPS for the internet.

## External Validation

> **"Privacy creates network effects: privacy differentiates chains and creates chain lock-in."**
> — Andreessen Horowitz, [Big Ideas 2026](https://a16z.com/newsletter/big-ideas-2026-part-3/)

a16z's December 2025 thesis validates SIP's core positioning as privacy middleware.

## Current Status

- **Phase**: 3 of 5 Complete (Foundation → Standard → Ecosystem → Same-Chain → Moat)
- **Progress**: M17 Complete, M18 In Progress
- **SDK Version**: ![npm version](https://img.shields.io/npm/v/@sip-protocol/sdk)
- **Build Status**: ![CI](https://github.com/sip-protocol/sip-protocol/actions/workflows/ci.yml/badge.svg)
- **Test Coverage**: 7,624+ tests passing
- **Packages**: 7 (@sip-protocol/sdk, types, react, react-native, cli, api + website)
- **Chains**: 15+ supported
- **Live**: [sip-protocol.org](https://sip-protocol.org)

### Achievement

🏆 **Zypherpunk Hackathon Winner — 3 Tracks** ($6,500: NEAR $4,000 + Tachyon $500 + pumpfun $2,000) — December 2025

## Phases Overview

### Phase 1: Foundation (M1-M8) ✅ Complete

Building the foundational cryptographic primitives and production-ready SDK.

| Milestone | Focus | Status |
|-----------|-------|--------|
| M1 | Architecture & Specification | ✅ |
| M2 | Cryptographic Core | ✅ |
| M3 | SDK Production | ✅ |
| M4 | Network Integration | ✅ |
| M5 | Documentation & Launch | ✅ |
| M6 | npm Publish | ✅ |
| M7 | Demo Integration | ✅ |
| M8 | Production Hardening | ✅ |

### Phase 2: Standard (M9-M12) ✅ Complete

Multi-backend support, multi-chain expansion.

| Milestone | Focus | Status |
|-----------|-------|--------|
| M9 | Stable Core | ✅ |
| M10 | ZK Production (Noir/WASM) | ✅ |
| M11 | Multi-Settlement (3 backends) | ✅ |
| M12 | Multi-Chain (15+ chains) | ✅ |

### Phase 3: Ecosystem (M13-M15) ✅ Complete

Developer experience and application layer.

| Milestone | Focus | Status |
|-----------|-------|--------|
| M13 | Compliance Layer | ✅ |
| M14 | Developer Experience (React, CLI, API) | ✅ |
| M15 | Application Layer (Hardware Wallets) | ✅ |

### Phase 4: Same-Chain Expansion (M16-M18) 🎯 In Progress

Capture the same-chain privacy market — 10-20x bigger than cross-chain only.

| Milestone | Focus | Status |
|-----------|-------|--------|
| M16 | Narrative Capture & Positioning | ✅ |
| M17 | Solana Same-Chain Privacy (Anchor) | ✅ (mainnet live) |
| M18 | Ethereum Same-Chain Privacy (Solidity) | 🔄 In Progress |

**Strategic context**: PrivacyCash (pool-based mixer) is gaining traction on Solana. SIP's cryptographic approach (Pedersen commitments + stealth addresses) is architecturally superior with compliance-ready viewing keys.

### Phase 5: Technical Moat (M19-M22) 🔲 Future

Build defensible technical advantages and institutional adoption.

| Milestone | Focus | Status |
|-----------|-------|--------|
| M19 | Mina Integration & Proof Research | 🔲 Future |
| M20 | Technical Moat Building | 🔲 Future |
| M21 | Standard Proposal (SIP-EIP) | 🔲 Future |
| M22 | Institutional + Agent Custody | 🔲 Future |

**M22 highlights**: Viewing key APIs for institutional custodians (Fireblocks, Anchorage) and AI agent compliance per a16z's "Know Your Agent" thesis.

## Supported Chains

**Active (15+ chains):**
- **EVM**: Ethereum, Arbitrum, Base, Polygon, Optimism
- **Solana**: Native + SPL tokens
- **NEAR**: Native via NEAR Intents
- **Bitcoin**: Silent Payments (BIP-352)
- **Cosmos**: IBC stealth addresses
- **Move**: Aptos, Sui
- **Zcash**: Shielded pool

## Full Roadmap

For detailed milestone tracking with GitHub issues, see the [full roadmap on the website](https://sip-protocol.org/roadmap) or the [ROADMAP.md on GitHub](https://github.com/sip-protocol/sip-protocol/blob/main/ROADMAP.md).

## Contributing

We welcome contributions! Current focus areas:

- **M18**: Ethereum same-chain privacy (Solidity contracts, L2 support)
- **M19**: Proof composition research (Mina, Halo2)
- **Security**: External audit preparation
- **Adoption**: Community feedback and integration support

See [CONTRIBUTING.md](https://github.com/sip-protocol/sip-protocol/blob/main/CONTRIBUTING.md) for guidelines.
