---
title: NEAR Privacy API Reference
description: Complete API reference for NEAR privacy functions, classes, and types in SIP Protocol
---

This reference documents all NEAR-specific privacy APIs in the SIP Protocol SDK, including the NEARIntentsAdapter, stealth address functions, and commitment utilities.

## NEARIntentsAdapter

Adapter for privacy-preserving cross-chain swaps via NEAR Intents (1Click API).

### Constructor

```typescript
new NEARIntentsAdapter(config?: NEARIntentsAdapterConfig)
```

### Configuration

```typescript
interface NEARIntentsAdapterConfig {
  /** Pre-configured OneClickClient instance */
  client?: OneClickClient

  /** Base URL for 1Click API */
  baseUrl?: string

  /** JWT token for authentication */
  jwtToken?: string

  /** Default slippage in basis points (100 = 1%) */
  defaultSlippage?: number  // default: 100

  /** Default deadline offset in seconds */
  defaultDeadlineOffset?: number  // default: 3600

  /** Custom asset mappings (merged with defaults) */
  assetMappings?: Record<string, DefuseAssetId>
}
```

### Methods

#### prepareSwap()

Prepare a privacy-preserving swap request.

```typescript
prepareSwap(
  request: SwapRequest,
  recipientMetaAddress?: StealthMetaAddress | string,
  senderAddress?: string,
  transparentRecipient?: string,
): Promise<PreparedSwap>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `request` | `SwapRequest` | Swap parameters including assets and privacy level |
| `recipientMetaAddress` | `StealthMetaAddress \| string` | Recipient's meta-address (required for shielded/compliant) |
| `senderAddress` | `string` | Sender address for refunds |
| `transparentRecipient` | `string` | Direct recipient (transparent mode only) |

**Returns:** `Promise<PreparedSwap>`

```typescript
interface PreparedSwap {
  request: SwapRequest
  quoteRequest: OneClickQuoteRequest
  stealthAddress?: {
    address: HexString
    ephemeralPublicKey: HexString
    viewTag: number
  }
  sharedSecret?: HexString
  curve?: StealthCurve
  nativeRecipientAddress?: string
}
```

**Example:**

```typescript
const adapter = new NEARIntentsAdapter({ jwtToken })

const prepared = await adapter.prepareSwap(
  {
    requestId: crypto.randomUUID(),
    privacyLevel: PrivacyLevel.SHIELDED,
    inputAsset: { chain: 'near', symbol: 'NEAR', decimals: 24 },
    inputAmount: 1_000_000_000_000_000_000_000_000n,
    outputAsset: { chain: 'near', symbol: 'NEAR', decimals: 24 },
  },
  recipientMetaAddress,
  'alice.near',
)
```

#### getQuote()

Get a quote for a prepared swap.

```typescript
getQuote(prepared: PreparedSwap): Promise<SwapResult>
```

#### trackSwap()

Track the status of a swap.

```typescript
trackSwap(depositAddress: string): Promise<SwapResult>
```

#### getClient()

Get the underlying OneClickClient.

```typescript
getClient(): OneClickClient
```

### Types

```typescript
interface SwapRequest {
  requestId: string
  privacyLevel: PrivacyLevel
  inputAsset: Asset
  inputAmount: bigint
  outputAsset: Asset
  minOutputAmount?: bigint
}

interface SwapResult {
  requestId: string
  quoteId: string
  depositAddress: string
  amountIn: string
  amountOut: string
  status: OneClickSwapStatus
  depositTxHash?: string
  settlementTxHash?: string
  stealthRecipient?: string
  ephemeralPublicKey?: string
}
```

## NEAR Address Functions

### ed25519PublicKeyToNearAddress()

Convert an ed25519 public key to a NEAR implicit account address.

```typescript
ed25519PublicKeyToNearAddress(publicKey: HexString): string
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `publicKey` | `HexString` | 32-byte ed25519 public key (with 0x prefix) |

**Returns:** 64-character lowercase hex string (NEAR implicit account)

**Example:**

```typescript
import { ed25519PublicKeyToNearAddress } from '@sip-protocol/sdk'

const nearAddress = ed25519PublicKeyToNearAddress(
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
)
// Returns: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
```

### nearAddressToEd25519PublicKey()

Convert a NEAR implicit address back to an ed25519 public key.

```typescript
nearAddressToEd25519PublicKey(address: string): HexString
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `address` | `string` | 64-character NEAR implicit account address |

**Returns:** `HexString` - ed25519 public key with 0x prefix

**Throws:** `ValidationError` if address is invalid

### isValidNearImplicitAddress()

Validate a NEAR implicit account address.

```typescript
isValidNearImplicitAddress(address: string): boolean
```

NEAR implicit addresses are:
- Exactly 64 lowercase hex characters
- No prefix (no "0x")
- Represent a 32-byte ed25519 public key

**Example:**

```typescript
import { isValidNearImplicitAddress } from '@sip-protocol/sdk'

isValidNearImplicitAddress('abc123...') // 64 chars -> true
isValidNearImplicitAddress('0xabc...')  // has prefix -> false
isValidNearImplicitAddress('alice.near') // named account -> false
```

### isValidNearAccountId()

Check if a string is a valid NEAR account ID (named or implicit).

```typescript
isValidNearAccountId(accountId: string): boolean
```

Supports:
- Named accounts: `alice.near`, `bob.testnet`
- Implicit accounts: 64 hex characters

**Rules for named accounts:**
- 2-64 characters
- Lowercase alphanumeric with `.` `_` `-`
- Must start and end with alphanumeric
- No consecutive dots

## Stealth Address Functions

### generateEd25519StealthMetaAddress()

Generate a stealth meta-address for ed25519 chains (NEAR, Solana).

```typescript
generateEd25519StealthMetaAddress(
  chain?: ChainType
): {
  spendingPublicKey: HexString
  viewingPublicKey: HexString
  spendingPrivateKey: HexString
  viewingPrivateKey: HexString
  chain: ChainType
}
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `chain` | `ChainType` | Target chain (default: 'near') |

**Example:**

```typescript
import { generateEd25519StealthMetaAddress } from '@sip-protocol/sdk'

const metaAddress = generateEd25519StealthMetaAddress('near')

// Public (share these)
console.log('Spending key:', metaAddress.spendingPublicKey)
console.log('Viewing key:', metaAddress.viewingPublicKey)

// Private (keep secret!)
console.log('Spending private:', metaAddress.spendingPrivateKey)
console.log('Viewing private:', metaAddress.viewingPrivateKey)
```

### generateEd25519StealthAddress()

Generate a one-time stealth address from a meta-address.

```typescript
generateEd25519StealthAddress(
  metaAddress: StealthMetaAddress
): {
  stealthAddress: {
    address: HexString
    ephemeralPublicKey: HexString
    viewTag: number
  }
  sharedSecret: HexString
}
```

**Example:**

```typescript
import {
  generateEd25519StealthMetaAddress,
  generateEd25519StealthAddress,
  ed25519PublicKeyToNearAddress,
} from '@sip-protocol/sdk'

const recipientMeta = generateEd25519StealthMetaAddress('near')
const { stealthAddress, sharedSecret } = generateEd25519StealthAddress(recipientMeta)

// Convert to NEAR address for transaction
const nearAddress = ed25519PublicKeyToNearAddress(stealthAddress.address)
console.log('Send to:', nearAddress)
```

### deriveEd25519StealthPrivateKey()

Derive the private key for a received stealth payment.

```typescript
deriveEd25519StealthPrivateKey(
  spendingPrivateKey: HexString,
  viewingPrivateKey: HexString,
  ephemeralPublicKey: HexString,
): HexString
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `spendingPrivateKey` | `HexString` | Recipient's spending private key |
| `viewingPrivateKey` | `HexString` | Recipient's viewing private key |
| `ephemeralPublicKey` | `HexString` | Ephemeral key from the transaction |

**Returns:** Private key for the stealth address

## Encoding Functions

### encodeStealthMetaAddress()

Encode a stealth meta-address to a shareable string.

```typescript
encodeStealthMetaAddress(metaAddress: StealthMetaAddress): string
```

**Format:** `sip:<chain>:<spendingKey>:<viewingKey>`

**Example:**

```typescript
import {
  generateEd25519StealthMetaAddress,
  encodeStealthMetaAddress,
} from '@sip-protocol/sdk'

const meta = generateEd25519StealthMetaAddress('near')
const encoded = encodeStealthMetaAddress(meta)
// Output: "sip:near:0x...spending...:0x...viewing..."
```

### decodeStealthMetaAddress()

Decode a stealth meta-address string.

```typescript
decodeStealthMetaAddress(encoded: string): StealthMetaAddress
```

**Throws:** `ValidationError` if format is invalid

## Asset Mappings

Default asset mappings for NEAR Intents:

```typescript
const NEAR_ASSET_MAPPINGS = {
  // NEAR native
  'near:NEAR': 'nep141:wrap.near',
  'near:wNEAR': 'nep141:wrap.near',
  'near:USDC': 'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',

  // Cross-chain assets (via OMFT bridge)
  'ethereum:ETH': 'nep141:eth.omft.near',
  'solana:SOL': 'nep141:sol.omft.near',
  'bitcoin:BTC': 'nep141:btc.omft.near',
  // ... more in DEFAULT_ASSET_MAPPINGS
}
```

Custom mappings can be provided:

```typescript
const adapter = new NEARIntentsAdapter({
  assetMappings: {
    'near:myToken': 'nep141:mytoken.near',
  },
})
```

## OneClickClient

Low-level client for NEAR 1Click API.

### Constructor

```typescript
new OneClickClient(config?: OneClickClientConfig)
```

### Configuration

```typescript
interface OneClickClientConfig {
  /** API base URL */
  baseUrl?: string  // default: 'https://1click.chaindefuser.com'

  /** JWT authentication token */
  jwtToken?: string
}
```

### Methods

#### getQuote()

```typescript
getQuote(request: OneClickQuoteRequest): Promise<OneClickQuoteResponse>
```

#### getStatus()

```typescript
getStatus(depositAddress: string): Promise<OneClickStatusResponse>
```

#### getSupportedTokens()

```typescript
getSupportedTokens(): Promise<DefuseToken[]>
```

## Error Types

### ValidationError

Thrown when input validation fails.

```typescript
class ValidationError extends Error {
  field: string
  context?: Record<string, unknown>
}
```

Common validation errors:

| Error | Cause | Solution |
|-------|-------|----------|
| "Meta-address has wrong key size" | secp256k1 keys used for NEAR | Use `generateEd25519StealthMetaAddress()` |
| "Wallet address format doesn't match" | EVM address for NEAR chain | Connect NEAR wallet |
| "Cross-curve refunds not supported" | Different curves for input/output | Provide explicit `senderAddress` |

## Constants

```typescript
// Chains that use ed25519 keys
const ED25519_CHAINS = ['solana', 'near', 'aptos', 'sui'] as const

// Check if a chain uses ed25519
function isEd25519Chain(chain: ChainType): boolean

// Get the curve type for a chain
function getCurveForChain(chain: ChainType): 'secp256k1' | 'ed25519'
```

## See Also

- [NEAR Privacy Guide](/guides/near-privacy) - Getting started tutorial
- [Stealth Address Concepts](/concepts/stealth-address) - How stealth addresses work
- [Proof Providers API](/sdk-api/proof-providers) - ZK proof generation
