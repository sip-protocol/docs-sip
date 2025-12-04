---
title: Whitepaper
description: SIP Protocol technical whitepaper
---

# SIP: Shielded Intents Protocol

**A Privacy Layer for Cross-Chain Transactions**

*Version 1.0 — November 2025*

## Abstract

Cross-chain transactions have become fundamental to decentralized finance, yet they consistently leak sensitive information about users. Current intent-based systems expose sender addresses, transaction amounts, and recipient identities to public blockchain analysis.

We present SIP (Shielded Intents Protocol), a privacy layer that integrates with existing intent-based settlement systems to provide configurable transaction privacy. SIP employs three complementary cryptographic techniques:

1. **Pedersen commitments** to hide transaction amounts while enabling verification
2. **Stealth addresses** following EIP-5564 to generate unlinkable one-time recipient addresses
3. **Viewing keys** to enable selective disclosure for compliance requirements

SIP operates as an application layer atop NEAR Intents, requiring no modifications to underlying blockchain infrastructure. Our implementation achieves sub-10ms overhead for privacy operations while maintaining full compatibility with existing multi-chain settlement flows.

## 1. Introduction

### 1.1 The Privacy Problem

Blockchain transparency creates significant privacy concerns:

- **Transaction graph analysis**: Linking sender and recipient wallets
- **Balance correlation**: Inferring holdings from transaction patterns
- **Behavioral profiling**: Tracking user activity across protocols

Intent-based systems like NEAR Intents simplify cross-chain operations but don't address privacy. Users still reveal addresses, amounts, and counterparties.

### 1.2 The Transparency Vulnerability

```
Current Flow:
1. User has: shielded ZEC in z-address (private)
2. User initiates: ZEC → SOL swap via intent
3. Swap completes: SOL sent to user's Solana address
4. Refund: sent to t1ABC... (transparent, reused)

Problem: t1ABC is reused across transactions
Chain analysis: Links to user's shielded activity
```

Even with private source assets, address reuse destroys privacy.

### 1.3 Our Contribution

SIP provides:

1. **Amount hiding** via Pedersen commitments
2. **Address unlinkability** via stealth addresses
3. **Compliance support** via viewing keys
4. **Seamless integration** with NEAR Intents

## 2. Protocol Design

### 2.1 System Model

```
┌─────────────────────────────────────────────────────────┐
│  Application Layer (DApps, Wallets, DAOs)               │
├─────────────────────────────────────────────────────────┤
│  Privacy Layer (SIP)                                    │
│  • Pedersen Commitments    • Stealth Addresses          │
│  • Viewing Keys            • Zero-Knowledge Proofs      │
├─────────────────────────────────────────────────────────┤
│  Settlement Layer (NEAR Intents + Chain Signatures)     │
├─────────────────────────────────────────────────────────┤
│  Blockchain Layer                                       │
│  NEAR  |  Ethereum  |  Solana  |  Zcash  |  Bitcoin    │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Threat Model

**Adversary can**:
- Observe all network traffic
- Read all blockchain data
- Front-run transactions
- Analyze transaction graphs

**Adversary cannot**:
- Break ECDLP or SHA-256
- Compromise user devices
- Perform quantum attacks

### 2.3 Privacy Levels

| Level | Amount | Sender | Recipient | Auditable |
|-------|--------|--------|-----------|-----------|
| TRANSPARENT | Visible | Visible | Visible | N/A |
| SHIELDED | Hidden | Hidden | Hidden | No |
| COMPLIANT | Hidden | Hidden | Hidden | Yes |

## 3. Construction

### 3.1 Pedersen Commitments

```
C = v·G + r·H
```

Where:
- v = value being committed
- r = random blinding factor
- G = standard generator
- H = NUMS generator

**Properties**:
- Perfectly hiding: No information about v leaked
- Computationally binding: Cannot open to different v
- Homomorphic: C₁ + C₂ = C(v₁+v₂)

### 3.2 Stealth Addresses

Recipient publishes meta-address (P, Q):
- P = p·G (spending public key)
- Q = q·G (viewing public key)

Sender generates stealth address:
1. r ← random
2. R = r·G (ephemeral key)
3. S = r·P (shared secret)
4. A = Q + H(S)·G (stealth address)

Recipient recovers:
1. S' = p·R
2. a = q + H(S') (private key)

### 3.3 Viewing Keys

```
Master Viewing Key (MVK)
    ├── Full Viewing Key
    ├── Auditor Key (time-limited)
    └── Transaction Key (per-tx)
```

Encryption: XChaCha20-Poly1305 with HKDF derivation.

### 3.4 Shielded Intent Format

```typescript
interface ShieldedIntent {
  privacyLevel: PrivacyLevel

  // Commitments (hiding values)
  inputCommitment: Commitment
  senderCommitment: Commitment

  // Public requirements
  outputAsset: Asset
  minOutputAmount: bigint

  // Stealth addressing
  recipientStealth: StealthAddress
  ephemeralPublicKey: HexString

  // Proofs
  fundingProof: ZKProof
  validityProof: ZKProof

  // Compliance (optional)
  viewingKeyHash?: Hash
  encryptedMetadata?: Encrypted
}
```

## 4. Security Analysis

### 4.1 Commitment Security

**Theorem (Hiding)**: SIP commitments are perfectly hiding.

*Proof*: For any C and target v', there exists r' such that C = v'·G + r'·H. Since log_G(H) is unknown, r' cannot be computed.

**Theorem (Binding)**: SIP commitments are computationally binding under ECDLP.

### 4.2 Stealth Address Security

**Theorem (Unlinkability)**: Stealth addresses from the same meta-address are unlinkable without viewing key.

*Proof*: Each address uses fresh ephemeral key. Shared secret is ECDH output, indistinguishable from random.

### 4.3 Known Limitations

1. **Timing correlation**: Transactions close in time may be linkable
2. **Amount inference**: Public output amount may reveal input
3. **Quantum threat**: secp256k1 vulnerable to Shor's algorithm

## 5. Implementation

### 5.1 Performance

| Operation | Time |
|-----------|------|
| Generate meta-address | 0.9ms |
| Derive stealth address | 5.4ms |
| Create commitment | 7.2ms |
| Full shielded intent | ~25ms |

### 5.2 Dependencies

| Library | Purpose |
|---------|---------|
| @noble/curves | secp256k1 operations |
| @noble/hashes | SHA256, HKDF |
| @noble/ciphers | XChaCha20-Poly1305 |

All libraries are Trail of Bits audited with constant-time implementations.

## 6. Related Work

| System | Comparison |
|--------|------------|
| Zcash | On-chain privacy; SIP is application layer |
| Tornado Cash | Fixed denominations; SIP is flexible |
| Aztec | Requires L2; SIP works on existing chains |
| Railgun | Single chain; SIP is multi-chain native |

## 7. Conclusion

SIP demonstrates practical privacy for cross-chain transactions through established cryptographic primitives at the application layer.

**Current status**:
- ![CI](https://github.com/sip-protocol/sip-protocol/actions/workflows/ci.yml/badge.svg) All tests passing
- Production-ready SDK (![npm version](https://img.shields.io/npm/v/@sip-protocol/sdk))
- Audited dependencies

**Future work**:
- Noir ZK circuits (replace mock proofs)
- Post-quantum migration path
- Formal verification

## Protocol Parameters

| Parameter | Value |
|-----------|-------|
| Curve | secp256k1 |
| Hash | SHA-256 |
| Encryption | XChaCha20-Poly1305 |
| View tag | 8 bits |
| Key size | 32 bytes |

## Stealth Meta-Address Format

```
sip:<chain>:<spendingKey>:<viewingKey>

Example:
sip:ethereum:0x02abc...def:0x03123...456
```

---

*© 2025 SIP Protocol Contributors. CC BY 4.0*
