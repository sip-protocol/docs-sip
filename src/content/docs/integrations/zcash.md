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
  host: '127.0.0.1',
  port: 8232,
  username: process.env.ZCASH_RPC_USER,
  password: process.env.ZCASH_RPC_PASS
})

// Check connection
const info = await zcash.getBlockchainInfo()
console.log('Zcash network:', info.chain)
```

## Zcash RPC Client

The `ZcashRPCClient` provides full access to Zcash's shielded infrastructure.

### Configuration

```typescript
interface ZcashConfig {
  host?: string        // Node host (default from ZCASH_RPC_HOST)
  port?: number        // RPC port (default: 8232; testnet: 18232)
  username: string     // RPC authentication user
  password: string     // RPC authentication password
  testnet?: boolean    // Use testnet defaults (default: false)
  timeout?: number     // Request timeout (ms, default: 30000)
  retries?: number     // Retry attempts on network error (default: 3)
  retryDelay?: number  // Base retry delay in ms (default: 1000)
}
```

:::caution[Use HTTPS in production]
`ZcashRPCClient` uses HTTP Basic Auth, which transmits credentials in
base64-encoded cleartext. Always terminate the connection over TLS/HTTPS in
production and store credentials securely (e.g. environment variables).
:::

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

For high-level shielded operations, use `ZcashShieldedService` — it manages the
account, balances, sends, and incoming notes on top of the RPC client.

```typescript
import { createZcashShieldedService } from '@sip-protocol/sdk'

const service = createZcashShieldedService({
  rpcConfig: {
    host: '127.0.0.1',
    port: 8232,
    username: process.env.ZCASH_RPC_USER,
    password: process.env.ZCASH_RPC_PASS
  }
})
await service.initialize() // creates/loads the account + default address

// Get shielded balance (confirmed total + per-pool breakdown, in ZEC)
const balance = await service.getBalance()
console.log('Shielded balance:', balance.confirmed, 'ZEC')

// Send a shielded transaction (returns a txid once the operation completes)
const result = await service.sendShielded({
  to: recipientZAddress,
  amount: 1.5,             // Amount in ZEC
  memo: 'Private payment'  // Optional encrypted memo (max 512 bytes)
})
console.log('Transaction ID:', result.txid)

// List incoming shielded notes (received transactions)
const received = await service.getReceivedNotes()
```

:::note
On the lower-level `ZcashRPCClient`, the underlying methods are
`getAccountBalance(account)` / `listUnspent()` (there is no
`getShieldedBalance` or `listShieldedTransactions`). The service wraps these
into the friendlier API shown above.
:::

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
import { generateViewingKey } from '@sip-protocol/sdk'

// Generate a viewing key (optional BIP32-style derivation path, default 'm/0')
const vk = generateViewingKey('m/0')

// vk.key can be shared with auditors; vk.hash identifies the key
// (and is stored on-chain for verification).
console.log('Share with auditor:', vk.key)
console.log('On-chain hash:', vk.hash)
```

### Compliance Flow

In compliant mode you supply the viewing key — the SDK stores only its hash
on-chain (`viewingKeyHash`). Hold the key itself to encrypt disclosable details
for auditors, and share it so they can decrypt.

```typescript
import {
  SIP,
  PrivacyLevel,
  generateViewingKey,
  encryptForViewing,
  decryptWithViewing,
} from '@sip-protocol/sdk'

const sip = new SIP({ network: 'mainnet' })

// Generate the viewing key the auditor will receive.
const vk = generateViewingKey('m/0')

// Create a compliant intent, supplying the viewing key.
const intent = await sip.createIntent({
  input: {
    asset: { chain: 'ethereum', symbol: 'ETH', address: null, decimals: 18 },
    amount,
  },
  output: {
    asset: { chain: 'solana', symbol: 'SOL', address: null, decimals: 9 },
    minAmount: 0n,
    maxSlippage: 0.01,
  },
  privacy: PrivacyLevel.COMPLIANT,
  viewingKey: vk.key,
})
console.log('On-chain viewing key hash:', intent.viewingKeyHash)

// Encrypt the disclosable transaction details for the auditor.
const encrypted = encryptForViewing(
  { sender: '0x...', recipient: '...', amount: amount.toString(), timestamp: Date.now() },
  vk,
)

// The auditor (holding vk) decrypts and verifies the details.
const details = decryptWithViewing(encrypted, vk)
console.log('Disclosed amount:', details.amount)
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

You can route swaps to ZEC so the shielded pool itself provides privacy on the
destination side. Configure the Zcash RPC client separately — `SIPConfig` has no
`zcashConfig` field.

:::caution[No stealth output for Zcash]
The NEAR Intents adapter does **not** derive stealth addresses for `zcash`
output (stealth derivation is supported for EVM, Solana, and NEAR only). For a
ZEC destination, use a direct recipient z-address with
`PrivacyLevel.TRANSPARENT`; on-chain privacy then comes from Zcash's shielded
pool rather than a SIP stealth address. To use SIP stealth output, target an
EVM/Solana/NEAR chain instead.
:::

```typescript
import { SIP, PrivacyLevel, createZcashClient } from '@sip-protocol/sdk'

// Zcash RPC is configured separately from the SIP client.
const zcash = createZcashClient({
  host: '127.0.0.1',
  port: 8232,
  username: process.env.ZCASH_RPC_USER,
  password: process.env.ZCASH_RPC_PASS
})

// Production mode is required for real NEAR Intents swaps (mainnet only).
const sip = new SIP({
  network: 'mainnet',
  mode: 'production',
  intentsAdapter: { jwtToken: process.env.NEAR_INTENTS_JWT }
})

// Swap ETH → ZEC. Zcash output uses a transparent (direct) recipient z-address;
// pass it as the transparentRecipient argument to getQuotes().
const params = {
  input: {
    asset: { chain: 'ethereum', symbol: 'ETH', address: null, decimals: 18 },
    amount: ethAmount,
  },
  output: {
    asset: { chain: 'zcash', symbol: 'ZEC', address: null, decimals: 8 },
    minAmount: 0n,
    maxSlippage: 0.01,
  },
  privacy: PrivacyLevel.TRANSPARENT,
}

const quotes = await sip.getQuotes(params, undefined, senderEthAddress, zAddress)
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
import { ZcashRPCError } from '@sip-protocol/sdk'

try {
  const operationId = await zcash.sendShielded(params)
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
