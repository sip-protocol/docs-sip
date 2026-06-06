---
title: Zcash Evaluation
description: Zcash proving system evaluation for SIP
---

# Zcash Proving System Evaluation

Evaluation of Zcash's proving system and potential integration with SIP Protocol.

## Overview

Zcash pioneered shielded transactions using zero-knowledge proofs. SIP evaluates integration points while maintaining its application-layer approach.

## Zcash Privacy Features

### Shielded Pools

| Pool | Protocol | Status |
|------|----------|--------|
| Sprout | BCTV14 | Deprecated |
| Sapling | Groth16 | Active |
| Orchard | Halo 2 | Latest |

### Key Properties

| Property | Zcash | SIP |
|----------|-------|-----|
| Amount privacy | Yes | Yes (Pedersen) |
| Sender privacy | Yes | Yes (Stealth) |
| Recipient privacy | Yes | Yes (Stealth) |
| On-chain shielding | Yes | No (app layer) |
| Trusted setup | Yes (Sapling) / No (Orchard) | No (Noir) |

## Integration Options

### Option 1: Zcash as Destination

Use Zcash shielded pool as swap destination:

```
Ethereum → SIP → NEAR Intents → Zcash (shielded)
```

**Pros**:
- Leverage Zcash's proven privacy
- Full on-chain shielding

**Cons**:
- Requires Zcash RPC access
- Limited to ZEC as output

### Option 2: ZcashRPCClient

SIP includes Zcash RPC client for shielded operations:

```typescript
import { ZcashRPCClient } from '@sip-protocol/sdk'

const client = new ZcashRPCClient({
  host: '127.0.0.1',
  port: 8232,
  username: process.env.ZCASH_RPC_USER,
  password: process.env.ZCASH_RPC_PASS
})

// Create HD account
const { account } = await client.createAccount()

// Get unified address
const { address } = await client.getAddressForAccount(
  account,
  ['sapling', 'orchard']
)

// Send shielded transaction (returns an operation ID for tracking)
const operationId = await client.sendShielded({
  fromAddress: address,
  recipients: [{ address: recipientZAddress, amount: 1.5, memo: 'Private transfer' }]
})
const operation = await client.waitForOperation(operationId)
console.log('Transaction ID:', operation.result?.txid)
```

### Option 3: Proof Verification

Verify Zcash proofs within SIP:

```typescript
// Not implemented - future consideration
const isValid = await verifyZcashProof(proof, publicInputs)
```

## Halo 2 Analysis

Orchard uses Halo 2 for trustless proofs:

### Advantages

| Feature | Benefit |
|---------|---------|
| No trusted setup | Eliminates ceremony risk |
| Recursive proofs | Proof aggregation |
| IPA commitments | Smaller proof size |

### Considerations

| Aspect | Note |
|--------|------|
| Complexity | Steep learning curve |
| Performance | Slower than Groth16 |
| Ecosystem | Less tooling than SNARKs |

## Decision: Application Layer

SIP chose application-layer privacy over protocol integration:

### Rationale

1. **No blockchain changes** - Works with existing chains
2. **Flexibility** - Not tied to single privacy technology
3. **Speed** - Faster iteration than protocol changes
4. **Multi-chain** - Privacy across all supported chains

### Tradeoffs

| Approach | Protocol Level | Application Level |
|----------|---------------|-------------------|
| Privacy strength | Stronger | Good |
| Implementation | Harder | Easier |
| Blockchain changes | Required | None |
| Flexibility | Lower | Higher |

## Zcash RPC Methods

### Account Management

```typescript
// Create account (modern HD approach)
const { account } = await client.createAccount()

// Get address for account
const { address } = await client.getAddressForAccount(
  account,
  ['sapling'], // Receiver types
  0            // Diversifier index
)
```

### Deprecated Methods

| Deprecated | Replacement |
|------------|-------------|
| `generateShieldedAddress()` | `createAccount()` + `getAddressForAccount()` |
| `z_getnewaddress` | Account-based approach |

### Shielded Transactions

```typescript
// Get balance for an account (per-pool breakdown)
const balance = await client.getAccountBalance(account)

// List unspent shielded notes (incoming/received funds)
const notes = await client.listUnspent()

// Send shielded (returns an operation ID; resolve to a txid via waitForOperation)
const operationId = await client.sendShielded({
  fromAddress: sender,
  recipients: [{ address: recipient, amount: 10, memo: 'Optional memo' }]
})
const { result } = await client.waitForOperation(operationId)
console.log('txid:', result?.txid)
```

:::note
`ZcashRPCClient` has no `getShieldedBalance` or `listShieldedTransactions`
methods — use `getAccountBalance(account)` and `listUnspent()`. For a
higher-level API (`getBalance()`, `getReceivedNotes()`), see
`ZcashShieldedService`.
:::

## Unified Addresses

Zcash Unified Addresses (ZIP-316) combine multiple receiver types:

```
u1...
├── Orchard receiver (if available)
├── Sapling receiver
└── Transparent receiver (optional)
```

```typescript
// Generate unified address
const { address } = await client.getAddressForAccount(
  account,
  ['orchard', 'sapling', 'p2pkh'] // Include all receiver types
)
```

## Performance Comparison

| Metric | Zcash Sapling | Zcash Orchard | SIP (Noir) |
|--------|---------------|---------------|------------|
| Proof gen | ~40s | ~2s | ~3s |
| Proof size | ~1KB | ~5KB | ~200B |
| Verify | ~10ms | ~10ms | ~10ms |
| Trusted setup | Yes | No | No |

## Future Integration

### Potential Enhancements

1. **Zcash as privacy pool** - Route through shielded pool
2. **Proof interop** - Verify Zcash proofs in SIP
3. **Viewing key compat** - Share viewing keys across systems

### Not Planned

1. Direct Zcash protocol modification
2. Sprout pool support (deprecated)
3. Mining/consensus integration
