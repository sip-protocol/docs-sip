---
title: Glossary
description: Definitions of key terms used in SIP Protocol
---

# Glossary

Definitions of key terms used in SIP Protocol documentation, organized alphabetically.

---

## A

### Anonymity Set

The group of possible senders/recipients that a transaction could belong to. Larger anonymity sets provide stronger privacy. Unlike mixers, SIP uses per-transaction stealth addresses rather than shared pools.

### Authenticated Encryption

Encryption that provides both confidentiality and integrity. SIP uses XChaCha20-Poly1305, which ensures data cannot be read or tampered with without the correct key.

---

## B

### Blinding Factor

A random value used in Pedersen commitments to hide the actual amount. Without knowing the blinding factor, observers cannot determine the committed value.

```typescript
const { commitment, blinding } = commit(amount)
// blinding: random 256-bit scalar
```

### Bridge

Infrastructure that enables asset transfers between different blockchains. SIP relies on bridges integrated with NEAR Intents for cross-chain settlement.

---

## C

### Chain Analysis

Techniques used to trace and link blockchain transactions. SIP's stealth addresses and commitments are designed to resist chain analysis by preventing address linkage.

### Commitment

A cryptographic primitive that allows you to commit to a value without revealing it, then later prove the commitment matches the original value. See [Pedersen Commitment](#pedersen-commitment).

### Compliance

The ability to satisfy regulatory requirements. SIP enables compliance through [viewing keys](#viewing-key) that allow authorized parties to audit transactions.

### Cross-Chain

Transactions or operations that span multiple blockchains. SIP provides privacy for cross-chain swaps via NEAR Intents.

---

## D

### Discrete Log Problem (DLP)

The mathematical problem underlying elliptic curve cryptography. Given points `G` and `P = k·G`, finding `k` is computationally infeasible. SIP's security relies on DLP hardness on secp256k1.

### Diversified Address

Multiple addresses derived from the same keys using different diversifiers. Allows receiving to different addresses without additional key management.

---

## E

### EIP-5564

Ethereum Improvement Proposal for stealth addresses. SIP implements a similar scheme adapted for multi-chain use.

**Reference**: [EIP-5564: Stealth Addresses](https://eips.ethereum.org/EIPS/eip-5564)

### Elliptic Curve

A mathematical structure used in modern cryptography. SIP uses the secp256k1 curve, the same curve used by Bitcoin and Ethereum.

### Ephemeral Key

A temporary key generated for a single transaction. In stealth addresses, the sender generates an ephemeral keypair to derive the recipient's one-time address.

```typescript
const { stealthAddress, ephemeralPublicKey } = generateStealthAddress(metaAddress)
// ephemeralPublicKey: published for recipient to find the transaction
```

---

## F

### Funding Proof

A zero-knowledge proof demonstrating sufficient balance to fund a transaction without revealing the exact amount. Part of SIP's planned ZK proof system.

**Reference**: [Funding Proof Specification](/specs/funding-proof/)

### Fulfillment Proof

A zero-knowledge proof demonstrating that a solver correctly fulfilled an intent. Verifies output amounts match committed inputs.

**Reference**: [Fulfillment Proof Specification](/specs/fulfillment-proof/)

---

## G

### Generator Point

A fixed point on an elliptic curve used as a base for scalar multiplication. SIP uses two generators:
- `G`: Standard secp256k1 generator
- `H`: Hash-derived generator for Pedersen commitments

---

## H

### Hierarchical Keys

Key derivation structure where child keys can be derived from parent keys. SIP uses hierarchical viewing keys for scoped access control.

```typescript
const masterKey = generateViewingKey('m/treasury')
const auditKey = deriveViewingKey(masterKey, 'audit/2024')
```

### Hiding Property

A commitment scheme property where the commitment reveals nothing about the committed value. Pedersen commitments are perfectly hiding.

### Homomorphic

Mathematical property allowing operations on encrypted/committed data. Pedersen commitments are additively homomorphic:

```
C(a) + C(b) = C(a + b)
```

This enables verifying that inputs equal outputs without revealing values.

---

## I

### Intent

A user's desired transaction outcome, specifying input and output assets without prescribing execution method.

```typescript
const intent = {
  input: { chain: 'ethereum', token: 'ETH', amount: '1.0' },
  output: { chain: 'solana', token: 'SOL' },
}
```

### Intent-Based Architecture

A design pattern where users express desired outcomes (intents) rather than specific transactions. Solvers compete to fulfill intents optimally.

---

## K

### Key Derivation

The process of generating new keys from existing keys. SIP uses key derivation for:
- Viewing key hierarchy
- Stealth address generation
- Commitment blinding factors

---

## L

### Linkability

The ability to connect multiple transactions to the same entity. SIP prevents linkability through stealth addresses (each transaction uses unique address).

---

## M

### Meta-Address

A stealth meta-address contains the public keys needed to generate stealth addresses for a recipient.

```
Format: sip:<chain>:<spendingPubKey>:<viewingPubKey>
Example: sip:ethereum:0x02abc...123:0x03def...456
```

### Mixer

A privacy tool that pools funds from multiple users to break transaction linkage. Unlike mixers, SIP uses per-transaction stealth addresses without shared pools.

---

## N

### NEAR Intents

A cross-chain settlement system on NEAR Protocol. SIP integrates with NEAR Intents for transaction execution while adding privacy.

**Reference**: [NEAR Intents Integration](/integrations/near-intents/)

### Non-Custodial

A system where users maintain control of their funds. SIP is non-custodial — private keys never leave the user's wallet.

### Nullifier

A unique value derived from a note/UTXO that prevents double-spending. When spending, the nullifier is revealed to mark the note as spent without revealing which note.

---

## O

### One-Time Address

An address generated for a single transaction. See [Stealth Address](#stealth-address).

---

## P

### Pedersen Commitment

A cryptographic commitment scheme with homomorphic properties:

```
C = v·G + r·H

Where:
- v = value being committed
- r = random blinding factor
- G, H = generator points
```

**Properties**:
- **Perfectly hiding**: Statistically impossible to learn `v` from `C`
- **Computationally binding**: Cannot find `v' ≠ v` with same `C`
- **Additively homomorphic**: `C(a) + C(b) = C(a+b)`

### Privacy Level

SIP's transaction privacy configuration:

| Level | Description |
|-------|-------------|
| `TRANSPARENT` | No privacy, standard transaction |
| `SHIELDED` | Full privacy, hidden sender/amount/recipient |
| `COMPLIANT` | Full privacy + selective disclosure |

**Reference**: [Privacy Levels](/concepts/privacy-levels/)

### Proof

A cryptographic demonstration that a statement is true. SIP uses zero-knowledge proofs to verify transaction validity without revealing private data.

---

## Q

### Quote

A solver's offer to fulfill an intent at specified terms (exchange rate, fees, timing).

```typescript
const quotes = await sip.getQuotes(intent)
// quotes: array of solver offers
```

_In the SDK's default demo mode these are mock quotes; real solver quotes require `mode: 'production'`._

---

## R

### Range Proof

A zero-knowledge proof that a committed value lies within a valid range (e.g., non-negative). Prevents creating money from invalid values.

---

## S

### Scalar

A number used in elliptic curve operations. Private keys and blinding factors are scalars (256-bit integers modulo curve order).

### Scanning

The process of checking transactions to find those addressed to you. Recipients scan using their viewing key to detect incoming payments.

```typescript
const isForMe = checkStealthAddress(
  stealthAddress,
  spendingPrivateKey,
  viewingPrivateKey
)
```

### secp256k1

The elliptic curve used by Bitcoin, Ethereum, and SIP. Offers 128-bit security level.

### Selective Disclosure

Revealing transaction details only to authorized parties. SIP implements selective disclosure through viewing keys.

### Settlement

The final execution of a transaction on-chain. SIP uses NEAR Intents as its settlement layer.

### Shielded

A transaction with hidden sender, amount, and recipient. SIP's `SHIELDED` privacy level provides full shielding.

### Shielded Intent

An intent with privacy-preserving properties — committed amounts, stealth addresses, and encrypted metadata.

### Solver

An entity that fulfills intents by finding optimal execution paths. Solvers compete on the NEAR Intents network.

**Reference**: [Solver Integration](/guides/solver-integration/)

### Spending Key

The private key that authorizes spending from an address. In SIP stealth addresses, the spending key derives the ability to spend received funds.

### Stealth Address

A one-time address derived from a recipient's public keys. Each sender generates a unique stealth address, preventing address reuse and linkability.

```typescript
const { stealthAddress, ephemeralPublicKey } = generateStealthAddress(metaAddress)
```

**Reference**: [Stealth Addresses](/concepts/stealth-address/)

---

## T

### Threat Model

A systematic analysis of potential attacks and mitigations. SIP's threat model covers privacy, integrity, and availability threats.

**Reference**: [Threat Model](/security/threat-model/)

### Transparent

A transaction without privacy enhancements. SIP's `TRANSPARENT` privacy level provides no hiding.

---

## U

### Unified Address

An address format that encapsulates multiple address types (transparent, shielded). Used in Zcash to simplify user experience.

### UTXO

Unspent Transaction Output — a transaction model where outputs are discrete units that are fully spent. Bitcoin uses UTXO; Ethereum uses accounts.

---

## V

### Validity Proof

A zero-knowledge proof demonstrating that an intent is properly authorized without revealing the authorizing identity.

**Reference**: [Validity Proof Specification](/specs/validity-proof/)

### Viewing Key

A key enabling selective disclosure of transaction details. Derived hierarchically for scoped access.

```typescript
const viewingKey = deriveViewingKey(masterKey, 'auditor/2024/q1')
// Auditor can decrypt: sender, amount, recipient
// Cannot spend funds
```

**Reference**: [Viewing Keys](/concepts/viewing-key/)

---

## W

### Wallet Adapter

An interface layer between SIP SDK and wallet software. Enables SIP to work with various wallets.

```typescript
const adapter = createSolanaAdapter({ provider: window.solana })
```

**Reference**: [Wallet Adapter Spec](/specs/wallet-adapter-spec/)

---

## X

### XChaCha20-Poly1305

An authenticated encryption algorithm used by SIP for encrypting transaction payloads. Provides both confidentiality and integrity with a 256-bit key.

---

## Z

### Zcash

A cryptocurrency with native shielded transactions. SIP integrates Zcash's privacy model and can use zcashd for enhanced privacy operations.

**Reference**: [Zcash Integration](/integrations/zcash/)

### Zero-Knowledge Proof (ZKP)

A cryptographic proof that demonstrates knowledge of information without revealing the information itself. Example: proving you know a password without revealing it.

SIP uses ZKPs for:
- Funding proofs (balance verification)
- Validity proofs (authorization)
- Fulfillment proofs (correct execution)

### ZIP-317

Zcash Improvement Proposal for transaction fee structure. SIP's Zcash integration follows ZIP-317 fee calculation.

**Formula**: `fee = marginal_fee × max(grace_actions, logical_actions)`
