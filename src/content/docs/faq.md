---
title: FAQ
description: Frequently asked questions about SIP Protocol
---

# Frequently Asked Questions

Common questions about SIP Protocol, organized by topic.

## General

### What is SIP Protocol?

**SIP (Shielded Intents Protocol)** is a privacy layer for cross-chain transactions. It integrates with NEAR Intents to provide configurable transaction privacy using stealth addresses, Pedersen commitments, and viewing keys.

Think of it as **HTTPS for blockchain transactions** — one toggle to shield sender, amount, and recipient.

### Who should use SIP?

SIP is designed for:

- **DAOs** needing private treasury management
- **DEXs** wanting to offer privacy-preserving swaps
- **Institutions** requiring compliant privacy with audit capability
- **Wallets** adding privacy features for users
- **Any application** where transaction privacy matters

### Is SIP a new blockchain?

No. SIP is an **application layer** that works on top of existing blockchains. It doesn't require any protocol changes to underlying chains like Ethereum, Solana, or NEAR.

### What chains does SIP support?

Currently supported through NEAR Intents:
- Ethereum (ETH, ERC-20 tokens)
- Solana (SOL, SPL tokens)
- NEAR (NEAR, NEP-141 tokens)
- Bitcoin (via bridges)

More chains are added as NEAR Intents expands support.

### Is SIP open source?

Yes. SIP Protocol is fully open source under the MIT license:
- SDK: [github.com/sip-protocol/sip-protocol](https://github.com/sip-protocol/sip-protocol)
- Docs: [github.com/sip-protocol/docs-sip](https://github.com/sip-protocol/docs-sip)

---

## Technical

### What cryptographic primitives does SIP use?

| Primitive | Purpose | Implementation |
|-----------|---------|----------------|
| **Stealth Addresses** | Unlinkable one-time addresses | EIP-5564 style, secp256k1 |
| **Pedersen Commitments** | Hide amounts, enable verification | Homomorphic over secp256k1 |
| **Viewing Keys** | Selective disclosure | Hierarchical derivation |
| **Encryption** | Payload encryption | XChaCha20-Poly1305 |
| **Hashing** | Commitments, derivation | SHA-256, BLAKE2 |

### What is a stealth address?

A stealth address is a **one-time address** derived from a recipient's public keys. Each transaction generates a fresh address that:

- Cannot be linked to the recipient's identity
- Cannot be connected to other transactions
- Can only be spent by the intended recipient

```typescript
const { stealthAddress, ephemeralPublicKey } = generateStealthAddress(metaAddress)
// stealthAddress: unique per transaction
// ephemeralPublicKey: published for recipient to scan
```

Learn more: [Stealth Addresses](/concepts/stealth-address/)

### What is a Pedersen commitment?

A Pedersen commitment hides a value while allowing mathematical operations:

```
C = v·G + r·H

Where:
- v = value (hidden)
- r = blinding factor (random)
- G, H = generator points
```

Properties:
- **Hiding**: Cannot determine `v` from `C`
- **Binding**: Cannot find different `v'` that produces same `C`
- **Homomorphic**: `C(a) + C(b) = C(a+b)` (can verify sums without revealing values)

### What is a viewing key?

A viewing key enables **selective disclosure** — sharing transaction details with specific parties (auditors, regulators) while keeping them hidden from the public.

```typescript
// Generate scoped viewing key
const auditKey = deriveViewingKey(masterKey, 'audit/2024/q1')

// Auditor can decrypt transactions in scope
const details = decryptWithViewing(encryptedTx, auditKey)
```

Learn more: [Viewing Keys](/concepts/viewing-key/)

### What are privacy levels?

SIP supports three privacy levels:

| Level | Sender | Amount | Recipient | Compliance |
|-------|--------|--------|-----------|------------|
| `TRANSPARENT` | Visible | Visible | Visible | Full |
| `SHIELDED` | Hidden | Hidden | Hidden | None |
| `COMPLIANT` | Hidden | Hidden | Hidden | Via viewing key |

Learn more: [Privacy Levels](/concepts/privacy-levels/)

### How fast is SIP?

Privacy operations add minimal overhead:

| Operation | Time |
|-----------|------|
| Generate stealth address | ~2ms |
| Create commitment | ~1ms |
| Encrypt payload | ~0.5ms |
| Full shielded intent | ~15ms |

Total overhead is typically **under 30ms** per transaction.

### What's the SDK bundle size?

The `@sip-protocol/sdk` package:
- Full bundle: ~150KB (minified)
- Tree-shaken (typical): ~80KB
- Gzipped: ~25KB

No heavy dependencies — uses `@noble/curves` and `@noble/hashes` which are audited and lightweight.

---

## Privacy

### Is SIP fully anonymous?

SIP provides **strong privacy** but not absolute anonymity:

**What SIP hides:**
- Sender identity (via commitments)
- Transaction amounts (via Pedersen commitments)
- Recipient address (via stealth addresses)

**What SIP doesn't hide:**
- That a transaction occurred
- Approximate timing
- Chain-level metadata

For maximum privacy, combine SIP with operational security practices.

### Can transactions be traced?

By the public: **No** — they see only cryptographic commitments and one-time addresses.

By viewing key holders: **Yes** — authorized parties can decrypt transaction details within their scope.

By SIP team: **No** — SIP is non-custodial and has no special access.

### How does compliance work?

SIP supports compliance through **viewing keys**:

1. Organization generates master viewing key
2. Derives scoped keys for auditors (e.g., `audit/2024/q1`)
3. Auditors can only see transactions within their authorized scope
4. Public sees encrypted data

This enables regulatory compliance while maintaining privacy from the general public.

### Is SIP sanctioned like Tornado Cash?

No. SIP is designed differently:

| Aspect | Tornado Cash | SIP |
|--------|--------------|-----|
| Compliance | None | Viewing keys for auditors |
| Fixed amounts | Yes (0.1, 1, 10 ETH) | No — any amount |
| Architecture | Mixer pool | Intent-based |
| Anonymity set | Shared pool | Per-transaction |

SIP prioritizes **compliant privacy** — privacy from the public with transparency for authorized parties.

### What's the anonymity set?

Unlike mixers with shared anonymity sets, SIP uses **per-transaction privacy**:

- Each transaction has unique stealth address
- No shared pool to analyze
- Privacy doesn't depend on other users
- No "taint" from other transactions

---

## Integration

### How do I add SIP to my app?

Install the SDK and wrap your swap logic:

```bash
npm install @sip-protocol/sdk
```

```typescript
import { SIP, PrivacyLevel } from '@sip-protocol/sdk'

const sip = new SIP({ network: 'mainnet' })

// Create shielded swap
const intent = await sip.createIntent({
  input: { chain: 'ethereum', token: 'ETH', amount: '1.0' },
  output: { chain: 'solana', token: 'SOL' },
  privacy: PrivacyLevel.SHIELDED,
})

// Get quotes and execute
const quotes = await sip.getQuotes(intent)
await sip.execute(intent, quotes[0])
```

See [Quick Start](/getting-started/) for complete guide.

### Does SIP work with my wallet?

SIP provides wallet adapters for:

- **Solana**: Phantom, Solflare, Backpack
- **Ethereum**: MetaMask, WalletConnect, Coinbase Wallet
- **Hardware**: Ledger, Trezor (via adapters)

```typescript
import { createSolanaAdapter } from '@sip-protocol/sdk'

const wallet = createSolanaAdapter({ provider: window.solana })
await wallet.connect()
```

### Can I run my own solver?

Yes. SIP is designed to work with the NEAR Intents solver network. See [Solver Integration](/guides/solver-integration/) for details.

### Is there a testnet?

Yes. Use the SDK with testnet configuration:

```typescript
const sip = new SIP({
  network: 'testnet',
  nearNetwork: 'testnet',
})
```

Testnet uses:
- NEAR testnet
- Ethereum Sepolia
- Solana devnet

---

## Security

### Is SIP audited?

Not yet. We are actively preparing for audit:

- Internal review complete
- ![CI](https://github.com/sip-protocol/sip-protocol/actions/workflows/ci.yml/badge.svg) Comprehensive test coverage
- Threat model documented
- Seeking qualified auditors

See [Audit Preparation](/security/audit-preparation/) for details.

### What are the security assumptions?

SIP's security relies on:

1. **ECDLP hardness** — discrete log problem on secp256k1
2. **Hash function security** — SHA-256, BLAKE2 collision resistance
3. **Encryption security** — XChaCha20-Poly1305 (authenticated encryption)
4. **NEAR Intents security** — settlement layer integrity

See [Security Properties](/security/security-properties/) for formal analysis.

### Is there a bug bounty?

Not yet, but planned post-audit. Security issues can be reported to:
- Email: security@sip-protocol.org
- GitHub: Private vulnerability reporting

### What are the known limitations?

Current limitations:

1. **Metadata leakage** — timing and existence of transactions visible
2. **Wallet fingerprinting** — wallet software may leak information
3. **Bridge trust** — cross-chain relies on bridge security
4. **Not quantum-resistant** — uses classical cryptography

See [Known Limitations](/security/known-limitations/) for details.

---

## Project

### What's the roadmap?

| Phase | Focus | Status |
|-------|-------|--------|
| Phase 1 | Core SDK, NEAR integration | Complete |
| Phase 2 | Multi-foundation, partnerships | In progress |
| Phase 3 | Proof composition, standards | Planned |

See [Roadmap](/roadmap/) for details.

### How is SIP funded?

SIP is seeking grants from multiple foundations:
- NEAR Foundation (Intents privacy)
- Zcash Foundation (privacy expertise)
- Mina Foundation (succinct proofs)
- Ethereum Foundation (EVM privacy)

### How can I contribute?

- **Code**: PRs welcome at [github.com/sip-protocol](https://github.com/sip-protocol)
- **Docs**: Improve documentation
- **Testing**: Report bugs, edge cases
- **Ideas**: Open issues for features

### Where can I get help?

- **Documentation**: [docs.sip-protocol.org](https://docs.sip-protocol.org)
- **GitHub Issues**: [github.com/sip-protocol/sip-protocol/issues](https://github.com/sip-protocol/sip-protocol/issues)
- **Twitter/X**: [@rz1989sol](https://x.com/rz1989sol)
