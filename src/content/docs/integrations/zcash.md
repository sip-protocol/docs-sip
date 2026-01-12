---
title: Zcash Integration
description: How SIP Protocol leverages Zcash technology for cross-chain privacy
---

# Zcash Integration Guide

SIP Protocol integrates Zcash technology for privacy-preserving cross-chain transactions. This guide covers setup, usage, and best practices.

## Overview

SIP leverages Zcash in three key ways:

| Feature | Description | Status |
|---------|-------------|--------|
| **Zcash RPC Client** | Full shielded transaction support | Implemented |
| **Viewing Keys** | Selective disclosure inspired by Zcash | Implemented |
| **Proof Composition** | Halo2 proofs + Mina verification | Planned |

:::tip[Why Zcash?]
Zcash pioneered shielded transactions with billions in private value transferred since 2016. SIP builds on this battle-tested foundation.
:::

## Quick Start

### Installation

```bash
npm install @sip-protocol/sdk
```

### Basic Usage

```typescript
import { ZcashRPCClient, createZcashClient } from '@sip-protocol/sdk'

// Create client
const zcash = createZcashClient({
  rpcUrl: 'http://localhost:8232',
  rpcUser: 'your-rpc-user',
  rpcPassword: 'your-rpc-password'
})

// Check connection
const info = await zcash.getBlockchainInfo()
console.log('Zcash network:', info.chain)
```

## Zcash RPC Client

The `ZcashRPCClient` provides full access to Zcash's shielded infrastructure.

### Configuration

```typescript
interface ZcashRPCConfig {
  rpcUrl: string       // Zcash node RPC endpoint
  rpcUser: string      // RPC authentication user
  rpcPassword: string  // RPC authentication password
  timeout?: number     // Request timeout (ms, default: 30000)
}
```

### Account Management

Zcash uses HD (Hierarchical Deterministic) accounts for address generation:

```typescript
// Create a new HD account
const { account } = await zcash.createAccount()
console.log('Account index:', account)

// Generate unified address for the account
const { address } = await zcash.getAddressForAccount(
  account,
  ['sapling', 'orchard']  // Receiver types
)
console.log('Unified address:', address)
```

### Shielded Transactions

```typescript
// Get shielded balance
const balance = await zcash.getShieldedBalance(zAddress)
console.log('Shielded balance:', balance, 'ZEC')

// Send shielded transaction
const txid = await zcash.sendShielded({
  from: senderZAddress,
  to: recipientZAddress,
  amount: 1.5,         // Amount in ZEC
  memo: 'Private payment'  // Optional encrypted memo
})
console.log('Transaction ID:', txid)

// List shielded transactions
const transactions = await zcash.listShieldedTransactions(zAddress)
```

### Unified Addresses (ZIP-316)

Zcash Unified Addresses combine multiple receiver types in a single address:

```typescript
// Generate address with all receiver types
const { address } = await zcash.getAddressForAccount(
  account,
  ['orchard', 'sapling', 'p2pkh']  // Shielded + transparent
)

// Address format: u1...
// Contains:
// - Orchard receiver (latest shielded pool)
// - Sapling receiver (widely supported)
// - Transparent receiver (for compatibility)
```

## Viewing Keys

SIP's viewing key system is inspired by Zcash's design, enabling selective disclosure for compliance.

### Zcash Viewing Key Types

| Type | See Incoming | See Outgoing | Spend |
|------|--------------|--------------|-------|
| Full Viewing Key | Yes | Yes | No |
| Incoming Viewing Key | Yes | No | No |
| Outgoing Viewing Key | No | Yes | No |

### SIP Viewing Keys

```typescript
import { generateViewingKey, deriveViewingKeyHash } from '@sip-protocol/sdk'

// Generate viewing key pair
const { viewingKey, viewingKeyHash } = generateViewingKey(spendingKey)

// Viewing key can be shared with auditors
// viewingKeyHash is stored on-chain for verification
console.log('Share with auditor:', viewingKey)
console.log('On-chain hash:', viewingKeyHash)
```

### Compliance Flow

```typescript
import { SIP, PrivacyLevel } from '@sip-protocol/sdk'

const sip = new SIP({ network: 'mainnet' })

// Create compliant transaction (generates viewing key)
const intent = await sip
  .intent()
  .input('ethereum', 'ETH', amount)
  .output('solana', 'SOL')
  .privacy(PrivacyLevel.COMPLIANT)  // Includes viewing key
  .build()

// Extract viewing key for auditor
const viewingKey = intent.viewingKey
console.log('Auditor viewing key:', viewingKey)

// Auditor can verify transaction details
const details = await sip.decryptWithViewingKey(
  intent.encryptedData,
  viewingKey
)
```

## Privacy Levels

SIP privacy levels map to Zcash concepts:

| SIP Level | Zcash Equivalent | Description |
|-----------|-----------------|-------------|
| `TRANSPARENT` | t-address | Public, on-chain visible |
| `SHIELDED` | z-address | Full privacy, hidden amounts |
| `COMPLIANT` | z-address + viewing key | Privacy with audit capability |

### Usage

```typescript
import { PrivacyLevel } from '@sip-protocol/sdk'

// Transparent (public) - like Zcash t-address
await sip.intent()
  .privacy(PrivacyLevel.TRANSPARENT)
  .build()

// Shielded (private) - like Zcash z-address
await sip.intent()
  .privacy(PrivacyLevel.SHIELDED)
  .build()

// Compliant (private + auditable) - z-address with viewing key
await sip.intent()
  .privacy(PrivacyLevel.COMPLIANT)
  .build()
```

## Zcash as Destination

Route swaps through Zcash's shielded pool for maximum privacy:

```typescript
import { SIP, PrivacyLevel } from '@sip-protocol/sdk'

const sip = new SIP({
  network: 'mainnet',
  zcashConfig: {
    rpcUrl: 'http://localhost:8232',
    rpcUser: 'user',
    rpcPassword: 'pass'
  }
})

// Swap ETH → ZEC (shielded)
const intent = await sip
  .intent()
  .input('ethereum', 'ETH', ethAmount)
  .output('zcash', 'ZEC')
  .recipientAddress(zAddress)  // Shielded z-address
  .privacy(PrivacyLevel.SHIELDED)
  .build()
```

## Future: Proof Composition

SIP's roadmap includes composing proofs from multiple systems:

```
┌─────────────────────────────────────────────────────────────┐
│  PROOF COMPOSITION (Phase 3)                                │
├─────────────────────────────────────────────────────────────┤
│  Zcash (Halo2)  →  Privacy execution                        │
│  Mina (Kimchi)  →  Succinct verification                    │
│  Noir           →  Validity proofs                          │
│                                                             │
│  Combined: Maximum privacy + minimal verification cost      │
└─────────────────────────────────────────────────────────────┘
```

### Halo2 Advantages

| Feature | Benefit |
|---------|---------|
| No trusted setup | Eliminates ceremony risk |
| Recursive proofs | Proof aggregation |
| IPA commitments | Smaller proof sizes |

## Error Handling

```typescript
import { ZcashRPCError, hasErrorCode, ErrorCode } from '@sip-protocol/sdk'

try {
  const txid = await zcash.sendShielded(params)
} catch (error) {
  if (error instanceof ZcashRPCError) {
    console.error('Zcash RPC error:', error.code, error.message)

    // Common error codes
    if (error.code === -6) {
      console.error('Insufficient funds')
    } else if (error.code === -28) {
      console.error('Node is still syncing')
    }
  }
}
```

## Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Create account | <100ms | HD derivation |
| Generate address | <100ms | Address encoding |
| Send shielded | 2-40s | Proof generation |
| Verify proof | ~10ms | Fast verification |

## Resources

### Zcash Documentation

- [Zcash Protocol Specification](https://zips.z.cash/protocol/protocol.pdf)
- [ZIP-316: Unified Addresses](https://zips.z.cash/zip-0316)
- [Zcash RPC Reference](https://zcash.github.io/rpc/)
- [Halo 2 Book](https://zcash.github.io/halo2/)

### SIP Resources

- [SIP SDK Reference](/reference/classes/ZcashRPCClient)
- [ZcashShieldedService](/reference/classes/ZcashShieldedService)
- [Privacy Levels Guide](/concepts/privacy-levels)
- [Viewing Keys Concept](/concepts/viewing-key)

### Demo

Try the live app at [app.sip-protocol.org](https://app.sip-protocol.org) to see SIP privacy features in action.
