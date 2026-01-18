---
title: NEAR Same-Chain Privacy Guide
description: Complete guide to privacy-preserving transactions on NEAR using SIP Protocol
---

This guide covers how to integrate NEAR same-chain privacy into your dApp using SIP Protocol. You'll learn to send private transfers, manage viewing keys for compliance, and scan for incoming payments.

## Prerequisites

Before starting, ensure you have:

- Node.js 18+ installed
- A NEAR account (mainnet or testnet)
- Basic understanding of NEAR transactions

## Installation

```bash
npm install @sip-protocol/sdk @sip-protocol/types
```

For React applications:

```bash
npm install @sip-protocol/sdk @sip-protocol/react
```

## Quick Start

### 1. Initialize the SDK

```typescript
import { SIP, NEARIntentsAdapter } from '@sip-protocol/sdk'
import { PrivacyLevel } from '@sip-protocol/types'

// Create adapter for NEAR Intents (cross-chain settlement)
const nearAdapter = new NEARIntentsAdapter({
  jwtToken: process.env.NEAR_INTENTS_JWT,
})

// Create SIP client
const sip = new SIP({
  network: 'mainnet',
})
```

### 2. Generate Stealth Meta-Address

Users need a stealth meta-address to receive private payments:

```typescript
import {
  generateEd25519StealthMetaAddress,
  encodeStealthMetaAddress,
} from '@sip-protocol/sdk'

// Generate meta-address for NEAR (uses ed25519)
const metaAddress = generateEd25519StealthMetaAddress('near')

// Encode for sharing
const encoded = encodeStealthMetaAddress(metaAddress)
console.log('Share this address:', encoded)
// Output: sip:near:0x...spendingKey...:0x...viewingKey...

// Store privately (for deriving stealth keys)
// metaAddress.spendingPrivateKey - NEVER share!
// metaAddress.viewingPrivateKey - Share only with auditors
```

### 3. Send a Private Transfer

```typescript
import { PrivacyLevel } from '@sip-protocol/types'

// Prepare private NEAR transfer
const prepared = await nearAdapter.prepareSwap(
  {
    requestId: crypto.randomUUID(),
    privacyLevel: PrivacyLevel.SHIELDED,
    inputAsset: { chain: 'near', symbol: 'NEAR', decimals: 24 },
    inputAmount: 1_000_000_000_000_000_000_000_000n, // 1 NEAR
    outputAsset: { chain: 'near', symbol: 'NEAR', decimals: 24 },
  },
  recipientMetaAddress, // Recipient's stealth meta-address
  senderWalletAddress,  // Your wallet for refunds
)

// Get quote and deposit address
const quote = await nearAdapter.getQuote(prepared)

console.log('Deposit to:', quote.depositAddress)
console.log('Amount:', quote.amountIn)
console.log('Expected output:', quote.amountOut)
```

## Privacy Levels

SIP Protocol supports three privacy levels:

| Level | Sender | Amount | Recipient | Compliance |
|-------|--------|--------|-----------|------------|
| `TRANSPARENT` | Visible | Visible | Visible | N/A |
| `SHIELDED` | Hidden | Hidden | Hidden | None |
| `COMPLIANT` | Hidden | Hidden | Hidden | Viewing key |

### Transparent Mode

Standard NEAR transfer with no privacy:

```typescript
const prepared = await nearAdapter.prepareSwap(
  {
    requestId: crypto.randomUUID(),
    privacyLevel: PrivacyLevel.TRANSPARENT,
    inputAsset: { chain: 'near', symbol: 'NEAR', decimals: 24 },
    inputAmount: 1_000_000_000_000_000_000_000_000n,
    outputAsset: { chain: 'near', symbol: 'NEAR', decimals: 24 },
  },
  undefined, // No meta-address needed
  senderAddress,
  recipientAddress, // Direct recipient
)
```

### Shielded Mode

Full privacy - amount, sender, and recipient are hidden:

```typescript
const prepared = await nearAdapter.prepareSwap(
  {
    requestId: crypto.randomUUID(),
    privacyLevel: PrivacyLevel.SHIELDED,
    inputAsset: { chain: 'near', symbol: 'NEAR', decimals: 24 },
    inputAmount: 1_000_000_000_000_000_000_000_000n,
    outputAsset: { chain: 'near', symbol: 'NEAR', decimals: 24 },
  },
  recipientMetaAddress,
  senderAddress,
)

// Stealth address is generated automatically
console.log('Stealth recipient:', prepared.stealthAddress?.address)
console.log('Ephemeral key:', prepared.stealthAddress?.ephemeralPublicKey)
```

### Compliant Mode

Privacy with viewing key for authorized auditors:

```typescript
import { createViewingKey, encryptForViewing } from '@sip-protocol/sdk'

// Create viewing key pair
const viewingKey = createViewingKey()

const prepared = await nearAdapter.prepareSwap(
  {
    requestId: crypto.randomUUID(),
    privacyLevel: PrivacyLevel.COMPLIANT,
    inputAsset: { chain: 'near', symbol: 'NEAR', decimals: 24 },
    inputAmount: 1_000_000_000_000_000_000_000_000n,
    outputAsset: { chain: 'near', symbol: 'NEAR', decimals: 24 },
  },
  recipientMetaAddress,
  senderAddress,
)

// Encrypt transaction details for auditor
const encryptedDetails = encryptForViewing(
  {
    sender: senderAddress,
    recipient: recipientAddress,
    amount: '1000000000000000000000000',
    timestamp: Date.now(),
  },
  viewingKey.publicKey,
)

// Store encryptedDetails on-chain or in database
// Auditor can decrypt with viewingKey.privateKey
```

## Scanning for Payments

Recipients scan for incoming stealth payments:

```typescript
import {
  scanForStealthPayments,
  deriveStealthPrivateKey,
} from '@sip-protocol/sdk'

// Scan NEAR chain for payments to your meta-address
const payments = await scanForStealthPayments({
  chain: 'near',
  viewingPrivateKey: myMetaAddress.viewingPrivateKey,
  spendingPublicKey: myMetaAddress.spendingPublicKey,
  fromBlock: 100000000, // Start block
})

for (const payment of payments) {
  console.log('Found payment:', {
    amount: payment.amount,
    txHash: payment.txHash,
    ephemeralKey: payment.ephemeralPublicKey,
  })

  // Derive the private key to claim this payment
  const stealthPrivateKey = deriveStealthPrivateKey(
    myMetaAddress.spendingPrivateKey,
    myMetaAddress.viewingPrivateKey,
    payment.ephemeralPublicKey,
  )

  // Use stealthPrivateKey to sign transactions from this address
}
```

## Viewing Key Management

### Creating Viewing Keys

```typescript
import { createViewingKey } from '@sip-protocol/sdk'

const viewingKey = createViewingKey()

// Public key - share with auditors
console.log('Auditor key:', viewingKey.publicKey)

// Private key - keep secure, used for decryption
console.log('Private key:', viewingKey.privateKey)
```

### Selective Disclosure

Share viewing keys for specific transactions:

```typescript
import { encryptForViewing, decryptWithViewingKey } from '@sip-protocol/sdk'

// Sender encrypts transaction details
const encrypted = encryptForViewing(
  {
    txHash: '0x...',
    sender: 'alice.near',
    recipient: 'bob.near',
    amount: '1000000000000000000000000',
    memo: 'Payment for services',
  },
  auditorPublicKey,
)

// Auditor decrypts with their private key
const details = decryptWithViewingKey(encrypted, auditorPrivateKey)
console.log('Transaction details:', details)
```

### Time-Limited Access

Create viewing keys with expiry:

```typescript
import { createTimeLimitedViewingKey } from '@sip-protocol/sdk'

const tempKey = createTimeLimitedViewingKey({
  expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  scope: ['transaction:view'], // Limited permissions
})

// Key automatically expires after 24 hours
```

## NEP-141 Token Privacy

Privacy works with any NEP-141 token on NEAR:

```typescript
// Private USDC transfer
const prepared = await nearAdapter.prepareSwap(
  {
    requestId: crypto.randomUUID(),
    privacyLevel: PrivacyLevel.SHIELDED,
    inputAsset: {
      chain: 'near',
      symbol: 'USDC',
      decimals: 6,
      address: '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
    },
    inputAmount: 100_000_000n, // 100 USDC
    outputAsset: {
      chain: 'near',
      symbol: 'USDC',
      decimals: 6,
      address: '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
    },
  },
  recipientMetaAddress,
  senderAddress,
)
```

## React Integration

Use the React hooks for seamless integration:

```tsx
import {
  useSIP,
  useStealthAddress,
  useViewingKey,
} from '@sip-protocol/react'

function PrivateTransfer() {
  const { sendPrivate, isLoading, error } = useSIP()
  const { generate, metaAddress } = useStealthAddress()
  const { createKey, viewingKey } = useViewingKey()

  const handleSend = async () => {
    const result = await sendPrivate({
      chain: 'near',
      recipient: recipientMetaAddress,
      amount: '1000000000000000000000000',
      token: 'NEAR',
      privacyLevel: 'shielded',
    })

    console.log('Transaction:', result.txHash)
  }

  return (
    <div>
      {!metaAddress && (
        <button onClick={generate}>Generate Address</button>
      )}
      <button onClick={handleSend} disabled={isLoading}>
        Send Private NEAR
      </button>
      {error && <p>Error: {error.message}</p>}
    </div>
  )
}
```

## Error Handling

```typescript
import { ValidationError, NetworkError, ProofError } from '@sip-protocol/sdk'

try {
  const result = await nearAdapter.prepareSwap(params, metaAddress, sender)
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid input:', error.field, error.message)
  } else if (error instanceof NetworkError) {
    console.error('Network issue:', error.message)
    // Retry logic
  } else if (error instanceof ProofError) {
    console.error('Proof generation failed:', error.code)
  }
}
```

## Troubleshooting

### Common Issues

**"Meta-address has wrong key size"**

NEAR uses ed25519 keys (32 bytes). Ensure you generate the correct type:

```typescript
// Correct for NEAR
const metaAddress = generateEd25519StealthMetaAddress('near')

// Wrong - secp256k1 is for EVM chains
// const metaAddress = generateStealthMetaAddress('near') // Don't use for NEAR!
```

**"Wallet address format doesn't match input chain"**

Your wallet must match the source chain:

```typescript
// For NEAR swaps, use a NEAR address
const senderAddress = 'yourname.near' // or implicit: 0x...64-hex-chars

// For EVM swaps, use an EVM address
const senderAddress = '0x...' // 40 hex chars
```

**"Cross-curve refunds not supported"**

When swapping between chains with different curves:

```typescript
// NEAR (ed25519) -> Ethereum (secp256k1)
// Must provide explicit senderAddress for refunds
const prepared = await nearAdapter.prepareSwap(
  params,
  evmMetaAddress,
  'yourname.near', // Required! Cannot auto-generate cross-curve refund
)
```

## Best Practices

1. **Store keys securely** - Never expose spending private keys. Use secure storage (Keychain, encrypted storage).

2. **Test on mainnet with small amounts** - NEAR Intents only works on mainnet. Start with $5-10 for testing.

3. **Implement proper scanning** - Scan regularly for incoming payments. Consider background jobs.

4. **Handle viewing keys carefully** - Only share with authorized parties. Use time-limited keys when possible.

5. **Validate addresses** - Always validate chain/address format matches before sending.

## See Also

- [NEAR Privacy API Reference](/sdk-api/near-privacy)
- [Viewing Key Concepts](/concepts/viewing-key)
- [Stealth Address Concepts](/concepts/stealth-address)
- [Error Handling Patterns](/cookbook/08-error-handling)
