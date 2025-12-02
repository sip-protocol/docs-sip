---
title: Cross-Chain Stealth Addresses
description: Understanding curve compatibility and refund addresses in cross-chain swaps
---

# Cross-Chain Stealth Addresses

When performing cross-chain swaps with stealth addresses, understanding **curve compatibility** is essential. Different blockchains use different elliptic curves, which affects how refund addresses are generated.

## Curve Compatibility by Chain

SIP supports two elliptic curves to enable stealth addresses across blockchain ecosystems:

| Curve | Chains | Address Format |
|-------|--------|----------------|
| **secp256k1** | Ethereum, Bitcoin, Zcash, Polygon, Arbitrum, Base | Keccak256/Hash160 derived |
| **ed25519** | Solana, NEAR | Raw 32-byte public key |

### Quick Reference Table

| From → To | Curves | Automatic Refund? |
|-----------|--------|-------------------|
| Ethereum → Polygon | secp256k1 → secp256k1 | Yes |
| Solana → NEAR | ed25519 → ed25519 | Yes |
| Ethereum → Solana | secp256k1 → ed25519 | **No** - requires `senderAddress` |
| Solana → Ethereum | ed25519 → secp256k1 | **No** - requires `senderAddress` |

## Same-Curve Swaps (Automatic Refunds)

When both chains use the same curve, SIP can automatically generate a stealth refund address from your meta-address.

### EVM → EVM Example

```typescript
import { createShieldedIntent } from '@sip-protocol/sdk'

// Ethereum to Polygon - both use secp256k1
const intent = await createShieldedIntent({
  inputChain: 'ethereum',
  outputChain: 'polygon',
  inputAsset: 'ETH',
  outputAsset: 'MATIC',
  amount: '1.0',
  recipient: recipientMetaAddress, // secp256k1 meta-address
  // senderAddress NOT required - automatically derived
})
```

### Solana → NEAR Example

```typescript
// Solana to NEAR - both use ed25519
const intent = await createShieldedIntent({
  inputChain: 'solana',
  outputChain: 'near',
  inputAsset: 'SOL',
  outputAsset: 'NEAR',
  amount: '10.0',
  recipient: recipientMetaAddress, // ed25519 meta-address
  // senderAddress NOT required - automatically derived
})
```

## Cross-Curve Swaps (Manual Refund Address)

When chains use different curves, you **must** provide a `senderAddress` for refunds because:

1. **secp256k1 keys cannot derive ed25519 addresses** (and vice versa)
2. **Mathematical incompatibility** - the curves have different properties
3. **No key derivation path** exists between the two curve types

### EVM → Solana Example

```typescript
// Cross-curve: secp256k1 → ed25519
// MUST provide senderAddress for refunds
const intent = await createShieldedIntent({
  inputChain: 'ethereum',
  outputChain: 'solana',
  inputAsset: 'ETH',
  outputAsset: 'SOL',
  amount: '1.0',
  recipient: recipientMetaAddress, // ed25519 meta-address for Solana
  senderAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD11', // Your Ethereum address for refunds
})
```

### Solana → EVM Example

```typescript
// Cross-curve: ed25519 → secp256k1
// MUST provide senderAddress for refunds
const intent = await createShieldedIntent({
  inputChain: 'solana',
  outputChain: 'ethereum',
  inputAsset: 'SOL',
  outputAsset: 'ETH',
  amount: '10.0',
  recipient: recipientMetaAddress, // secp256k1 meta-address for Ethereum
  senderAddress: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK', // Your Solana address for refunds
})
```

## Error Messages

If you attempt a cross-curve swap without providing `senderAddress`, you'll receive one of these errors:

### secp256k1 Meta-Address + ed25519 Input Chain

```
ValidationError: Cross-curve refunds not supported: input chain solana
requires ed25519 but meta-address uses secp256k1. Please provide a
senderAddress for refunds, or use matching curves for input/output chains.
```

### ed25519 Meta-Address + secp256k1 Input Chain

```
ValidationError: Cross-curve refunds not supported: input chain ethereum
requires secp256k1 but meta-address uses ed25519. Please provide a
senderAddress for refunds, or use matching curves for input/output chains.
```

## Why This Limitation Exists

### Cryptographic Incompatibility

The two curve types are mathematically incompatible:

| Property | secp256k1 | ed25519 |
|----------|-----------|---------|
| Curve type | Weierstrass | Twisted Edwards |
| Field prime | 2^256 - 2^32 - 977 | 2^255 - 19 |
| Group order | ~2^256 | ~2^252 |
| Signature scheme | ECDSA | EdDSA |

There is no mathematical transformation to convert a secp256k1 public key into a valid ed25519 public key (or vice versa). They operate in completely different mathematical spaces.

### Stealth Address Derivation

SIP stealth addresses are derived from the meta-address public keys:

```
Stealth Address = ViewingKey + hash(SharedSecret) × G
```

Where `G` is the generator point of the specific curve. Using a secp256k1 generator with ed25519 arithmetic (or vice versa) produces invalid addresses.

## Best Practices

### 1. Match Curves When Possible

For the best UX, prefer swaps between chains using the same curve:
- **EVM ecosystem**: Ethereum, Polygon, Arbitrum, Base, Optimism
- **Non-EVM ecosystem**: Solana, NEAR

### 2. Always Provide senderAddress for Cross-Curve

When building UIs, detect cross-curve scenarios and prompt users for their refund address:

```typescript
function needsSenderAddress(inputChain: string, outputChain: string): boolean {
  const secp256k1Chains = ['ethereum', 'polygon', 'arbitrum', 'base', 'bitcoin', 'zcash']
  const ed25519Chains = ['solana', 'near']

  const inputIsSecp = secp256k1Chains.includes(inputChain)
  const outputIsSecp = secp256k1Chains.includes(outputChain)

  return inputIsSecp !== outputIsSecp // Different curves
}
```

### 3. Validate Address Format

Ensure the `senderAddress` matches the input chain's expected format:

```typescript
import { validateAddress } from '@sip-protocol/sdk'

// Validates address format for the chain
const isValid = validateAddress(senderAddress, inputChain)
if (!isValid) {
  throw new Error(`Invalid ${inputChain} address format`)
}
```

## Summary

| Scenario | senderAddress Required? | Refund Address |
|----------|------------------------|----------------|
| EVM → EVM | No | Auto-generated stealth address |
| Solana → NEAR | No | Auto-generated stealth address |
| EVM → Solana | **Yes** | User-provided address |
| Solana → EVM | **Yes** | User-provided address |

Cross-curve swaps trade off some privacy (using a known refund address) for cross-ecosystem compatibility. Same-curve swaps maintain full privacy with automatically generated stealth refund addresses.
