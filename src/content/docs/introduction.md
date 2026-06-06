---
title: Introduction
description: What is SIP Protocol and why it exists
---

# Introduction to SIP Protocol

**SIP (Shielded Intents Protocol)** is a privacy layer for cross-chain transactions that integrates with NEAR Intents to provide configurable transaction privacy.

## The Problem

Cross-chain transactions have become fundamental to decentralized finance, yet they consistently leak sensitive information:

- **Sender addresses** are publicly visible
- **Transaction amounts** can be traced
- **Recipient identities** are linkable across chains

Even when using privacy-preserving systems like Zcash, interacting with transparent blockchains through address reuse destroys privacy guarantees.

### The Transparency Vulnerability

Consider a user with shielded ZEC wanting to swap to SOL:

```
1. User has: shielded ZEC in z-address (private)
2. User initiates: ZEC → SOL swap via intent
3. Swap completes: SOL sent to user's Solana address
4. Refund: sent to t1ABC... (transparent, reused)

Problem: t1ABC is reused across transactions
Chain analysis: "t1ABC received refunds 50 times"
              → Links to user's shielded activity
              → Compromises entire privacy set
```

## The Solution

SIP addresses these challenges through three complementary cryptographic techniques:

### 1. Pedersen Commitments

Hide transaction amounts while enabling verification:

```typescript
const { commitment, blinding } = commit(1000n)
// Observer sees: 0x7a3f...9c2d (meaningless curve point)
// You know: the commitment hides 1000
```

### 2. Stealth Addresses

Generate unique, one-time recipient addresses:

```typescript
const { stealthAddress } = generateStealthAddress(recipientMetaAddress)
// Each transaction → fresh unlinkable address
// No address reuse → no linkability
```

### 3. Viewing Keys

Enable selective disclosure for compliance:

```typescript
const viewingKey = generateViewingKey('/audit/2024')
// Auditor can decrypt: sender, amount, recipient
// Public sees: cryptographic commitments only
```

## Why SIP?

| Feature | Without SIP | With SIP |
|---------|------------|----------|
| Sender | 0xABC...123 (known) | Commitment (hidden) |
| Amount | 1000 ETH | Commitment (hidden) |
| Recipient | 0xDEF...456 | Stealth address (unlinkable) |
| Compliance | Trivial analysis | Viewing key required |

## Application Layer Design

SIP operates as an **application layer** atop existing infrastructure:

- **No protocol changes required** to underlying blockchains
- **Integrates with NEAR Intents** settlement system
- **Cross-chain and same-chain** — same-chain privacy on Solana and NEAR is live (mainnet), with EVM same-chain in progress
- **Compatible with existing wallets** via wallet adapters
- **Sub-30ms overhead** for privacy operations

## Privacy Levels

Choose the right level for your use case:

- **TRANSPARENT**: Standard swap, no privacy, maximum compatibility
- **SHIELDED**: Full privacy, hidden sender/amount/recipient
- **COMPLIANT**: Full privacy + selective disclosure via viewing keys

## Getting Started

Ready to add privacy to your cross-chain transactions?

1. [Quick Start Guide](/getting-started/) - Install and use the SDK
2. [Architecture](/architecture/) - Understand the system design
3. [Privacy Levels](/concepts/privacy-levels/) - Choose the right privacy level
