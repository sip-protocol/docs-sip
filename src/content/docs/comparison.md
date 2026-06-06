---
title: Comparison
description: How SIP Protocol compares to other privacy solutions
---

# SIP vs Alternatives

A detailed comparison of SIP Protocol with other blockchain privacy solutions.

## Quick Comparison

| Feature | SIP | Tornado Cash | Railgun | Zcash Direct | Secret Network |
|---------|-----|--------------|---------|--------------|----------------|
| Cross-chain | **Yes** | No | No | No | Limited |
| Compliance-ready | **Yes** | No | Partial | Partial | No |
| Viewing keys | **Yes** | No | Yes | Yes | No |
| No fixed amounts | **Yes** | No | Yes | Yes | Yes |
| Intent-based | **Yes** | No | No | No | No |
| SDK available | **Yes** | No | Yes | Limited | Yes |
| No pool dependency | **Yes** | No | No | Yes | N/A |
| Non-custodial | **Yes** | Yes | Yes | Yes | Yes |

---

## Detailed Comparisons

### SIP vs Tornado Cash

**Tornado Cash** was an Ethereum mixer that provided privacy by pooling funds from multiple users.

| Aspect | SIP | Tornado Cash |
|--------|-----|--------------|
| **Architecture** | Intent-based stealth addresses | Fixed-denomination pool |
| **Amounts** | Any amount | Fixed (0.1, 1, 10, 100 ETH) |
| **Compliance** | Viewing keys for auditors | None |
| **Cross-chain** | Yes, via NEAR Intents | No |
| **Anonymity model** | Per-transaction stealth | Shared pool |
| **Regulatory status** | Designed for compliance | Sanctioned (OFAC) |
| **Deposit/withdraw** | Direct swap | Requires deposit → wait → withdraw |

**Key differences:**

1. **No fixed denominations**: Tornado required specific amounts (0.1 ETH, 1 ETH, etc.). SIP works with any amount.

2. **No waiting period**: Tornado users needed to wait in the pool for anonymity. SIP provides instant privacy per transaction.

3. **Compliance path**: Tornado had no mechanism for regulatory compliance. SIP's viewing keys enable auditor access.

4. **Cross-chain**: Tornado was single-chain (Ethereum). SIP supports multiple chains via NEAR Intents.

**When Tornado might have been preferred:**
- Maximum anonymity set (shared pool with other users)
- Simple "fire and forget" privacy

**When to use SIP:**
- Need compliance/audit capability
- Cross-chain transactions
- Variable amounts
- No waiting period acceptable

---

### SIP vs Railgun

**Railgun** is an EVM privacy system using zero-knowledge proofs with a shielded balance system.

| Aspect | SIP | Railgun |
|--------|-----|---------|
| **Architecture** | Intent-based | UTXO-based shielded pool |
| **Chains** | Multi-chain (ETH, SOL, NEAR) | EVM only |
| **Privacy model** | Stealth addresses + commitments | zk-SNARKs shielded balance |
| **Viewing keys** | Hierarchical, scoped | Yes, per-wallet |
| **Integration** | SDK wraps existing swaps | Requires native integration |
| **Gas costs** | Standard (off-chain privacy) | Higher (on-chain proofs) |

**Key differences:**

1. **Chain support**: Railgun is EVM-only. SIP supports Solana, NEAR, and other chains.

2. **Integration model**: Railgun requires applications to integrate with its shielded pool. SIP wraps existing intent infrastructure.

3. **Privacy model**: Railgun maintains shielded balances on-chain. SIP applies privacy per-transaction without persistent shielded state.

4. **Gas costs**: Railgun's on-chain proofs cost more gas. SIP's privacy operations are primarily off-chain.

**When to use Railgun:**
- EVM-only use case
- Want persistent shielded balance
- Fine with higher gas costs for stronger guarantees

**When to use SIP:**
- Cross-chain transactions
- Lower gas costs preferred
- Intent-based UX desired
- Hierarchical viewing key needs

---

### SIP vs Zcash Direct

**Zcash** is a cryptocurrency with native shielded transactions using zk-SNARKs.

| Aspect | SIP | Zcash Direct |
|--------|-----|--------------|
| **Integration** | SDK for any app | Requires Zcash wallet/node |
| **Chains** | Multi-chain | Zcash only |
| **Swaps** | Native cross-chain | Requires bridges |
| **Privacy strength** | Strong (secp256k1 + commitments) | Very strong (Groth16 (Sapling) / Halo 2 (Orchard)) |
| **Viewing keys** | Hierarchical | Flat (per-address) |
| **Compliance** | Built-in | Manual key sharing |
| **Developer experience** | TypeScript SDK | C++/Rust libraries |

**Key differences:**

1. **Accessibility**: SIP provides a TypeScript SDK for web developers. Zcash requires deeper integration with its node software.

2. **Cross-chain**: Using Zcash for cross-chain requires bridges. SIP has native cross-chain via NEAR Intents.

3. **Privacy model**: Zcash's Sapling/Orchard pools provide stronger theoretical privacy. SIP's stealth addresses provide practical privacy without shared pools.

4. **Viewing keys**: Zcash viewing keys are per-address. SIP supports hierarchical keys for organizational use.

**When to use Zcash directly:**
- Maximum privacy guarantees needed
- Zcash-to-Zcash transactions
- Already in Zcash ecosystem

**When to use SIP:**
- Cross-chain privacy needed
- Web application integration
- Hierarchical viewing keys for enterprise
- Don't want to run Zcash infrastructure

---

### SIP vs Secret Network

**Secret Network** is a blockchain with encrypted state and private smart contracts.

| Aspect | SIP | Secret Network |
|--------|-----|----------------|
| **Model** | Application layer | L1 blockchain |
| **Privacy scope** | Transaction privacy | Smart contract privacy |
| **Chains** | Works on existing chains | Own chain + IBC |
| **Integration** | SDK wrapper | Deploy on Secret |
| **Trust model** | Cryptographic | TEE (SGX enclaves) |
| **Compliance** | Viewing keys | No built-in mechanism |

**Key differences:**

1. **Architecture**: Secret is a full blockchain. SIP is an application layer on existing chains.

2. **Trust model**: Secret relies on Intel SGX enclaves (hardware). SIP uses pure cryptography.

3. **Scope**: Secret provides private smart contracts. SIP focuses on transaction privacy.

4. **Compliance**: Secret has no built-in viewing key system. SIP prioritizes compliant privacy.

**When to use Secret Network:**
- Need private smart contract execution
- Building natively on Secret
- IBC ecosystem integration

**When to use SIP:**
- Transaction privacy on existing chains
- No hardware trust assumptions
- Compliance/audit requirements
- Cross-chain beyond IBC

---

## Feature Deep Dives

### Cross-Chain Privacy

SIP's cross-chain support via NEAR Intents:

```
┌─────────────────────────────────────────────────────────────┐
│                    SIP Cross-Chain Flow                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Ethereum                    NEAR                  Solana    │
│  ┌─────────┐              ┌─────────┐           ┌─────────┐ │
│  │ Shielded│   Intent     │ NEAR    │  Fulfill  │ Stealth │ │
│  │ Intent  │ ──────────►  │ Intents │ ────────► │ Address │ │
│  └─────────┘              └─────────┘           └─────────┘ │
│       │                        │                     │       │
│       │ Hidden sender          │ Solver              │ One-time │
│       │ Hidden amount          │ execution           │ address  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

Other solutions require:
- **Tornado**: Single chain only
- **Railgun**: EVM-only, no native cross-chain
- **Zcash**: Requires bridges (trust assumptions)
- **Secret**: IBC chains only

### Compliance Architecture

SIP's hierarchical viewing keys:

```typescript
// Organization structure
const treasuryKey = generateViewingKey('m/treasury')

// Derive scoped keys
const auditorKey = deriveViewingKey(treasuryKey, 'auditor/2024')
const legalKey = deriveViewingKey(treasuryKey, 'legal/compliance')

// Auditor sees only their scope
const decrypted = decryptWithViewing(tx, auditorKey)
```

Comparison:
- **Tornado**: No compliance mechanism
- **Railgun**: Per-wallet viewing keys (flat)
- **Zcash**: Per-address viewing keys (flat)
- **SIP**: Hierarchical with path-based scoping

### Integration Complexity

| Solution | Integration Effort | Notes |
|----------|-------------------|-------|
| SIP | **Low** | npm install, wrap existing logic |
| Railgun | Medium | Shielded pool integration |
| Zcash | High | Node infrastructure required |
| Secret | High | Redeploy on new chain |
| Tornado | Low | But no longer available |

SIP integration example:

```typescript
// 5 lines to add privacy to existing swap
import { SIP, PrivacyLevel } from '@sip-protocol/sdk'

const sip = new SIP({ network: 'mainnet' })
const intent = await sip.createIntent({ ...swap, privacy: PrivacyLevel.SHIELDED })
await sip.execute(intent, quote)
```

---

## Decision Matrix

### Use SIP when:

- **Cross-chain privacy** — swapping between different blockchains with privacy
- **Compliance required** — need to provide auditor access via viewing keys
- **Web integration** — building web apps with TypeScript/JavaScript
- **Variable amounts** — don't want fixed denomination constraints
- **Quick integration** — want minimal code changes to add privacy
- **No infrastructure** — don't want to run nodes or specialized software

### Consider alternatives when:

- **Maximum anonymity set** — shared mixer pools may provide larger sets
- **Persistent shielded state** — Railgun's shielded balance model
- **Zcash-native** — already deep in Zcash ecosystem
- **Private computation** — need encrypted smart contract state (Secret)
- **Single chain only** — dedicated single-chain solution may be simpler

---

## Migration Guides

### From Tornado Cash patterns

If you previously used Tornado Cash-style privacy:

```typescript
// Old pattern (conceptual)
await deposit(amount, pool)
await wait(hours)
await withdraw(note, recipient)

// SIP pattern
const intent = await sip.createIntent({
  input: { amount },
  output: { recipient: stealthAddress },
  privacy: PrivacyLevel.SHIELDED,
})
await sip.execute(intent, quote)
// No deposit, no waiting
```

### From direct chain transactions

Adding privacy to existing swaps:

```typescript
// Before: transparent swap
await dex.swap(tokenIn, tokenOut, amount)

// After: shielded swap via SIP
const intent = await sip.createIntent({
  input: { chain: 'ethereum', token: tokenIn, amount },
  output: { chain: 'solana', token: tokenOut },
  privacy: PrivacyLevel.SHIELDED,
})
await sip.execute(intent, quote)
```

---

## Summary

| If you need... | Use |
|----------------|-----|
| Cross-chain + compliance | **SIP** |
| EVM-only shielded balance | Railgun |
| Maximum privacy (single chain) | Zcash |
| Private smart contracts | Secret Network |
| Simple EVM mixing | Retired (Tornado was sanctioned) |

SIP occupies a unique position: **compliant cross-chain privacy** with easy SDK integration. It's designed for the real-world needs of DAOs, institutions, and applications that need privacy *and* regulatory compliance.
