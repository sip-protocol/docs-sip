---
title: Ethereum Same-Chain Privacy Guide
description: Complete guide to EIP-5564 stealth addresses and privacy-preserving transactions on Ethereum and EVM chains
---

This guide covers implementing privacy-preserving transactions on Ethereum and EVM-compatible chains (Polygon, Arbitrum, Optimism, Base) using SIP Protocol's EIP-5564 compliant stealth address implementation.

## Prerequisites

- Node.js 18+
- An Ethereum wallet (MetaMask, WalletConnect, etc.)
- Basic understanding of EVM transactions

## Installation

```bash
npm install @sip-protocol/sdk @sip-protocol/types ethers
```

For React applications:

```bash
npm install @sip-protocol/sdk @sip-protocol/react ethers
```

## Quick Start

### 1. Initialize the SDK

```typescript
import { SIP, NEARIntentsAdapter } from '@sip-protocol/sdk'
import { PrivacyLevel } from '@sip-protocol/types'
import { ethers } from 'ethers'

// Connect to Ethereum
const provider = new ethers.BrowserProvider(window.ethereum)
const signer = await provider.getSigner()

// Create SIP client
const sip = new SIP({
  network: 'mainnet',
})

// For cross-chain, use NEAR Intents
const nearAdapter = new NEARIntentsAdapter({
  jwtToken: process.env.NEAR_INTENTS_JWT,
})
```

### 2. Generate Stealth Meta-Address

EVM chains use secp256k1 compressed public keys (33 bytes):

```typescript
import {
  generateStealthMetaAddress,
  encodeStealthMetaAddress,
} from '@sip-protocol/sdk'

// Generate for Ethereum (secp256k1)
const metaAddress = generateStealthMetaAddress('ethereum')

// Encode for sharing
const encoded = encodeStealthMetaAddress(metaAddress.metaAddress)
console.log('Share this:', encoded)
// Output: sip:ethereum:0x02...spending...:0x03...viewing...

// Store keys securely
// metaAddress.spendingPrivateKey - NEVER expose
// metaAddress.viewingPrivateKey - Share only with authorized auditors
```

### 3. Send a Private Transfer

```typescript
import { PrivacyLevel } from '@sip-protocol/types'

// Prepare private ETH transfer via NEAR Intents
const prepared = await nearAdapter.prepareSwap(
  {
    requestId: crypto.randomUUID(),
    privacyLevel: PrivacyLevel.SHIELDED,
    inputAsset: { chain: 'ethereum', symbol: 'ETH', decimals: 18 },
    inputAmount: ethers.parseEther('1.0'),
    outputAsset: { chain: 'ethereum', symbol: 'ETH', decimals: 18 },
  },
  recipientMetaAddress,
  await signer.getAddress(),
)

// Get quote
const quote = await nearAdapter.getQuote(prepared)

console.log('Deposit to:', quote.depositAddress)
console.log('Stealth recipient:', prepared.stealthAddress?.address)
```

## EIP-5564 Compliance

SIP Protocol implements [EIP-5564](https://eips.ethereum.org/EIPS/eip-5564) stealth addresses for Ethereum. Key properties:

| Property | Value |
|----------|-------|
| Curve | secp256k1 |
| Key format | Compressed (33 bytes, prefix 02 or 03) |
| View tag | First byte of shared secret hash |
| Address derivation | Keccak256 of uncompressed public key |

### Stealth Address Generation

```typescript
import {
  generateStealthAddress,
  publicKeyToEthAddress,
} from '@sip-protocol/sdk'

// Generate one-time stealth address
const { stealthAddress, sharedSecret } = generateStealthAddress(recipientMetaAddress)

// Convert to Ethereum address (20 bytes, checksummed)
const ethAddress = publicKeyToEthAddress(stealthAddress.address)
console.log('Send to:', ethAddress) // 0x742d35Cc6634C0532925a3b844Bc454e4438f44e
```

### Scanning with View Tag

The view tag enables efficient scanning:

```typescript
import { scanForStealthPayments } from '@sip-protocol/sdk'

// Scan Ethereum for payments
const payments = await scanForStealthPayments({
  chain: 'ethereum',
  viewingPrivateKey: myMetaAddress.viewingPrivateKey,
  spendingPublicKey: myMetaAddress.metaAddress.spendingKey,
  fromBlock: 19000000,
  rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY',
})

for (const payment of payments) {
  // View tag allows quick rejection of non-matching payments
  if (payment.viewTag !== expectedViewTag) continue

  console.log('Payment found:', {
    amount: ethers.formatEther(payment.amount),
    txHash: payment.txHash,
    block: payment.blockNumber,
  })
}
```

## Privacy Levels

### Transparent Mode

Standard Ethereum transaction with no privacy:

```typescript
const prepared = await nearAdapter.prepareSwap(
  {
    requestId: crypto.randomUUID(),
    privacyLevel: PrivacyLevel.TRANSPARENT,
    inputAsset: { chain: 'ethereum', symbol: 'ETH', decimals: 18 },
    inputAmount: ethers.parseEther('1.0'),
    outputAsset: { chain: 'ethereum', symbol: 'ETH', decimals: 18 },
  },
  undefined,
  senderAddress,
  recipientAddress,
)
```

### Shielded Mode

Full privacy - sender, amount, and recipient are hidden:

```typescript
const prepared = await nearAdapter.prepareSwap(
  {
    requestId: crypto.randomUUID(),
    privacyLevel: PrivacyLevel.SHIELDED,
    inputAsset: { chain: 'ethereum', symbol: 'ETH', decimals: 18 },
    inputAmount: ethers.parseEther('1.0'),
    outputAsset: { chain: 'ethereum', symbol: 'ETH', decimals: 18 },
  },
  recipientMetaAddress,
  senderAddress,
)

// Stealth address is generated
console.log('Stealth public key:', prepared.stealthAddress?.address)
console.log('Ephemeral key:', prepared.stealthAddress?.ephemeralPublicKey)
console.log('View tag:', prepared.stealthAddress?.viewTag)
```

### Compliant Mode

Privacy with viewing key for regulatory compliance:

```typescript
import { createViewingKey, encryptForViewing } from '@sip-protocol/sdk'

const viewingKey = createViewingKey()

const prepared = await nearAdapter.prepareSwap(
  {
    requestId: crypto.randomUUID(),
    privacyLevel: PrivacyLevel.COMPLIANT,
    inputAsset: { chain: 'ethereum', symbol: 'ETH', decimals: 18 },
    inputAmount: ethers.parseEther('10.0'),
    outputAsset: { chain: 'ethereum', symbol: 'ETH', decimals: 18 },
  },
  recipientMetaAddress,
  senderAddress,
)

// Encrypt transaction details for auditor
const encryptedAuditData = encryptForViewing(
  {
    sender: senderAddress,
    recipient: recipientAddress,
    amount: '10.0',
    asset: 'ETH',
    timestamp: Date.now(),
    purpose: 'Payment for consulting services',
  },
  auditorPublicKey,
)
```

## Private Key Recovery

When receiving a stealth payment, derive the private key:

```typescript
import { deriveStealthPrivateKey } from '@sip-protocol/sdk'

// From a detected payment
const stealthPrivateKey = deriveStealthPrivateKey(
  payment.stealthAddress,
  myMetaAddress.spendingPrivateKey,
  myMetaAddress.viewingPrivateKey,
)

// Create wallet from derived key
const stealthWallet = new ethers.Wallet(stealthPrivateKey, provider)

// Now you can spend from this address
const tx = await stealthWallet.sendTransaction({
  to: myMainWallet,
  value: payment.amount - gasEstimate,
})
```

## ERC-20 Token Privacy

Privacy works with any ERC-20 token:

```typescript
// Private USDC transfer
const prepared = await nearAdapter.prepareSwap(
  {
    requestId: crypto.randomUUID(),
    privacyLevel: PrivacyLevel.SHIELDED,
    inputAsset: {
      chain: 'ethereum',
      symbol: 'USDC',
      decimals: 6,
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    },
    inputAmount: 100_000_000n, // 100 USDC
    outputAsset: {
      chain: 'ethereum',
      symbol: 'USDC',
      decimals: 6,
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    },
  },
  recipientMetaAddress,
  senderAddress,
)
```

## Multi-Chain Support

Same API works across all EVM chains:

```typescript
// Polygon
const polygonMeta = generateStealthMetaAddress('polygon')

// Arbitrum
const arbitrumMeta = generateStealthMetaAddress('arbitrum')

// Optimism
const optimismMeta = generateStealthMetaAddress('optimism')

// Base
const baseMeta = generateStealthMetaAddress('base')
```

### Cross-Chain Privacy Transfer

```typescript
// ETH on Ethereum → USDC on Polygon (private)
const crossChain = await nearAdapter.prepareSwap(
  {
    requestId: crypto.randomUUID(),
    privacyLevel: PrivacyLevel.SHIELDED,
    inputAsset: { chain: 'ethereum', symbol: 'ETH', decimals: 18 },
    inputAmount: ethers.parseEther('1.0'),
    outputAsset: {
      chain: 'polygon',
      symbol: 'USDC',
      decimals: 6,
      address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    },
  },
  recipientPolygonMetaAddress, // Must be secp256k1 for EVM
  ethSenderAddress,
)
```

## React Integration

```tsx
import {
  useSIP,
  useStealthAddress,
  useViewingKey,
} from '@sip-protocol/react'
import { useAccount, useSignMessage } from 'wagmi'

function PrivateTransfer() {
  const { address } = useAccount()
  const { sendPrivate, isLoading } = useSIP()
  const { generate, metaAddress } = useStealthAddress('ethereum')

  const handleSend = async () => {
    const result = await sendPrivate({
      chain: 'ethereum',
      recipient: recipientMetaAddress,
      amount: '1.0',
      token: 'ETH',
      privacyLevel: 'shielded',
    })

    console.log('Tx hash:', result.txHash)
  }

  return (
    <div>
      <p>Connected: {address}</p>
      {!metaAddress && (
        <button onClick={generate}>Generate Stealth Address</button>
      )}
      <button onClick={handleSend} disabled={isLoading}>
        Send Private ETH
      </button>
    </div>
  )
}
```

## Address Format Reference

| Chain | Format | Example |
|-------|--------|---------|
| Ethereum | Checksummed hex | `0x742d35Cc6634C0532925a3b844Bc454e4438f44e` |
| Polygon | Checksummed hex | `0x742d35Cc6634C0532925a3b844Bc454e4438f44e` |
| Arbitrum | Checksummed hex | `0x742d35Cc6634C0532925a3b844Bc454e4438f44e` |
| Optimism | Checksummed hex | `0x742d35Cc6634C0532925a3b844Bc454e4438f44e` |
| Base | Checksummed hex | `0x742d35Cc6634C0532925a3b844Bc454e4438f44e` |

### Key Formats

| Type | Length | Prefix | Example |
|------|--------|--------|---------|
| Compressed public | 33 bytes | 02 or 03 | `0x02abc123...` |
| Uncompressed public | 65 bytes | 04 | `0x04abc123...` |
| Private key | 32 bytes | - | `0xabc123...` |
| Ethereum address | 20 bytes | 0x | `0x742d35Cc...` |

## Error Handling

```typescript
import { ValidationError, NetworkError, ProofError } from '@sip-protocol/sdk'

try {
  const result = await nearAdapter.prepareSwap(params, metaAddress, sender)
} catch (error) {
  if (error instanceof ValidationError) {
    if (error.field === 'recipientMetaAddress') {
      // Wrong key format - likely using ed25519 keys for EVM chain
      console.error('Use secp256k1 meta-address for Ethereum')
    }
  }
}
```

## Security Considerations

### Key Management

1. **Spending private key** - Full control. Treat like a seed phrase. Never expose.
2. **Viewing private key** - Read-only access. Share only with authorized auditors.
3. **Meta-address** - Public. Safe to share for receiving payments.

### Stealth Address Properties

- Each payment uses a unique address (unlinkable)
- View tag enables efficient scanning without revealing amounts
- Ephemeral key must be published for recipient to claim

### Gas Considerations

Claiming from a stealth address requires gas. Options:

1. **Self-fund**: Send small ETH to stealth address before claiming
2. **Relayer**: Use a meta-transaction relayer (coming soon)
3. **Bundler**: Use account abstraction (ERC-4337)

## Troubleshooting

### "spendingKey must be valid secp256k1"

You're using ed25519 keys (for Solana/NEAR) on an EVM chain:

```typescript
// Wrong - ed25519 keys
const wrong = generateEd25519StealthMetaAddress('ethereum')

// Correct - secp256k1 keys
const correct = generateStealthMetaAddress('ethereum')
```

### "address must start with 02 or 03"

Compressed public keys must start with 02 or 03:

```typescript
// Valid compressed keys
'0x02abc...' // Y is even
'0x03abc...' // Y is odd

// Invalid (uncompressed - 04 prefix)
'0x04abc...'
```

### "cross-curve refunds not supported"

When bridging between different curve types:

```typescript
// Solana (ed25519) → Ethereum (secp256k1)
// Must provide explicit sender address for refunds
const prepared = await nearAdapter.prepareSwap(
  params,
  evmMetaAddress, // secp256k1
  solanaAddress,  // Required - can't auto-generate
)
```

## See Also

- [EIP-5564 Implementation](/specs/eip-5564)
- [Stealth Address Concepts](/concepts/stealth-address)
- [Viewing Key Management](/concepts/viewing-key)
- [NEAR Privacy Guide](/guides/near-privacy)
