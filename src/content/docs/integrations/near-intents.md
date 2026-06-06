---
title: NEAR Intents
description: Integration with NEAR Intents settlement layer
---

# NEAR Intents Integration

SIP integrates with NEAR Intents for cross-chain settlement via the 1Click API.

:::caution[Mainnet Only]
NEAR Intents (1Click API) operates on **mainnet only**. There is no testnet deployment.
For testing, use `MockSolver` or small mainnet amounts ($5-10).
:::

:::danger[Demo mode is the default]
`new SIP({ network })` runs in **`mode: 'demo'`** by default — `getQuotes()` returns **mock quotes**, not real 1Click prices. For real cross-chain quotes, pass `mode: 'production'` + an `intentsAdapter` (mainnet only):

```typescript
const sip = new SIP({
  network: 'mainnet',
  mode: 'production',
  intentsAdapter: { jwtToken: process.env.NEAR_INTENTS_JWT }
})
```

Or use the `createProductionSIP({ network, jwtToken })` one-liner. Production mode also requires stealth keys for privacy modes — call `sip.generateStealthKeys(chain)` or pass `recipientMetaAddress` to `getQuotes()`, otherwise it throws.
:::

## Architecture

```
User Intent → SIP (privacy) → NEAR Intents → Multi-chain Settlement

┌─────────────────────────────────────────────────────────────┐
│  SIP SDK                                                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  NEARIntentsAdapter                                      ││
│  │  ├── OneClickClient (1Click API)                        ││
│  │  └── Solver Bus WebSocket                               ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  NEAR Intents Infrastructure                                 │
│  ├── Solver Network                                         │
│  ├── Chain Signatures                                       │
│  └── Settlement Contracts                                   │
└─────────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
      ┌────────┐      ┌────────┐      ┌────────┐
      │Ethereum│      │ Solana │      │  NEAR  │
      └────────┘      └────────┘      └────────┘
```

## OneClickClient

The 1Click API provides simplified cross-chain swaps:

```typescript
import { OneClickClient, OneClickSwapType } from '@sip-protocol/sdk'

const client = new OneClickClient({
  baseUrl: 'https://1click.chaindefuser.com',
  jwtToken: process.env.NEAR_INTENTS_JWT // optional bearer token
})

// Request a quote. The 1Click API uses Defuse asset IDs (NEP-141 format)
// and slippage in basis points (100 = 1%).
const quote = await client.quote({
  swapType: OneClickSwapType.EXACT_INPUT,
  originAsset: 'nep141:wrap.near',
  destinationAsset: 'nep141:sol.omft.near',
  amount: '1000000000000000000000000', // 1 NEAR (24 decimals)
  refundTo: 'user.near',
  recipient: '...solana-address...',
  depositType: 'ORIGIN_CHAIN',
  refundType: 'ORIGIN_CHAIN',
  recipientType: 'DESTINATION_CHAIN',
  slippageTolerance: 100, // basis points
  deadline: new Date(Date.now() + 3600_000).toISOString()
})

// `quote.depositAddress` is where the user deposits input tokens.
// OneClickClient does NOT execute swaps — the user deposits to depositAddress,
// then status is tracked via client.getStatus(quote.depositAddress).
const status = await client.getStatus(quote.depositAddress)
```

:::note
`OneClickClient` is a thin HTTP wrapper. It fetches quotes and tracks status — it
does **not** sign or broadcast deposits. Execution happens off-client (the user
deposits to `depositAddress`) or via the higher-level `NEARIntentsAdapter` /
`sip.execute()` flow.
:::

## NEARIntentsAdapter

Full adapter for NEAR Intents integration:

```typescript
import { NEARIntentsAdapter, createNEARIntentsAdapter, PrivacyLevel } from '@sip-protocol/sdk'

const adapter = createNEARIntentsAdapter({
  // NEAR Intents is mainnet-only; the adapter targets the 1Click API directly.
  baseUrl: 'https://1click.chaindefuser.com',
  jwtToken: process.env.NEAR_INTENTS_JWT // optional bearer token
})

// Build a swap request. Assets use the SIP `Asset` shape ({ chain, symbol,
// address, decimals }); amounts are bigint in smallest units.
const request = {
  requestId: crypto.randomUUID(),
  privacyLevel: PrivacyLevel.SHIELDED,
  inputAsset: { chain: 'ethereum', symbol: 'ETH', address: null, decimals: 18 },
  inputAmount: 1_000_000_000_000_000_000n, // 1 ETH
  outputAsset: { chain: 'solana', symbol: 'SOL', address: null, decimals: 9 }
}

// initiateSwap() prepares the swap (deriving a stealth recipient for privacy
// modes), fetches a quote, and returns deposit instructions.
const result = await adapter.initiateSwap(request, recipientMetaAddress, senderEthAddress)
console.log('Deposit to:', result.depositAddress)
console.log('Expected out:', result.amountOut)

// After the user deposits to result.depositAddress, notify + wait for settlement:
await adapter.notifyDeposit(result.depositAddress, depositTxHash)
const finalStatus = await adapter.waitForCompletion(result.depositAddress)
console.log('Final status:', finalStatus.status)
```

:::note
For finer control use the lower-level steps directly: `adapter.prepareSwap(request, recipientMetaAddress, senderAddress)` → `adapter.getQuote(prepared)` → deposit → `adapter.notifyDeposit(...)` → `adapter.waitForCompletion(...)`. There is no `executeSwap()` — the adapter never signs the deposit; the user (or wallet) sends funds to `depositAddress`.
:::

## Configuration

```typescript
interface NEARIntentsAdapterConfig {
  client?: OneClickClient            // Provide a pre-built client (optional)
  baseUrl?: string                   // 1Click API URL
  jwtToken?: string                  // Optional bearer token
  defaultSlippage?: number           // Basis points (default: 100 = 1%)
  defaultDeadlineOffset?: number     // Seconds (default: 3600)
  assetMappings?: Record<string, string> // Override SIP→Defuse asset IDs
  enableFees?: boolean               // Collect protocol fees (default: true)
  feeConfig?: {                      // Custom fee configuration
    baseBps?: number
    disableViewingKeyDiscount?: boolean
    treasuryAccount?: string
  }
}
```

:::note
There is no `network` field — NEAR Intents is mainnet-only, so the adapter
always targets the production 1Click API. Authentication uses `jwtToken`
(a bearer token), not an `apiKey`. The underlying `OneClickClient` accepts
`{ baseUrl, jwtToken, timeout, fetch }`.
:::

### Network Endpoints

| Network | Endpoint | Status |
|---------|----------|--------|
| Mainnet | `https://1click.chaindefuser.com` | Active |

:::note
There is no testnet endpoint. NEAR Intents operates on mainnet only.
:::

## Supported Chains

| Chain | Chain ID | Native Token |
|-------|----------|--------------|
| NEAR | `near` | NEAR |
| Ethereum | `ethereum` | ETH |
| Solana | `solana` | SOL |
| Polygon | `polygon` | MATIC |
| Arbitrum | `arbitrum` | ETH |
| Optimism | `optimism` | ETH |
| Base | `base` | ETH |

## Privacy Integration

SIP adds privacy layer before NEAR Intents settlement:

```typescript
import { SIP, PrivacyLevel } from '@sip-protocol/sdk'

// Production mode is required for real NEAR Intents quotes (mainnet only).
const sip = new SIP({
  network: 'mainnet',
  mode: 'production',
  intentsAdapter: { jwtToken: process.env.NEAR_INTENTS_JWT }
})

// Create shielded intent
const intent = await sip
  .intent()
  .input('ethereum', 'ETH', amount)
  .output('solana', 'SOL')
  .privacy(PrivacyLevel.SHIELDED)  // Add privacy
  .build()

// SIP wraps NEAR Intents with:
// - Pedersen commitments for amounts
// - Stealth addresses for recipient
// - ZK proofs for verification
```

## Solver Bus

For real-time quote streaming:

```typescript
const ws = new WebSocket('wss://solver-relay-v2.chaindefuser.com/ws')

// Subscribe to quotes
ws.send(JSON.stringify({
  method: 'subscribe',
  params: ['quote']
}))

// Handle quote events
ws.on('message', (data) => {
  const event = JSON.parse(data)
  if (event.event === 'quote') {
    console.log('New quote:', event.data)
  }
})

// Request quote
ws.send(JSON.stringify({
  method: 'request_quote',
  params: {
    src_chain: 'ethereum',
    dst_chain: 'solana',
    amount: '1000000000000000000'
  }
}))
```

## Error Handling

```typescript
import { NetworkError, hasErrorCode, ErrorCode } from '@sip-protocol/sdk'

try {
  const quote = await client.quote(params)
} catch (error) {
  if (hasErrorCode(error, ErrorCode.NETWORK_FAILED)) {
    console.error('Network error:', (error as NetworkError).message)
    // Retry with backoff
  } else if (hasErrorCode(error, ErrorCode.RATE_LIMITED)) {
    console.error('Rate limited')
    // Wait and retry
  }
}
```

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Quote | 100/min |
| Execute | 10/min |
| Status | 200/min |

## Chain Signatures

NEAR Chain Signatures enable cross-chain execution:

```
1. User creates intent on SIP
2. SIP submits to NEAR Intents
3. Solver accepts and prepares fulfillment
4. Chain Signatures generates destination chain signature
5. Solver executes on destination chain
6. Settlement completes
```

## Example: Full Flow

```typescript
import {
  createProductionSIP,
  PrivacyLevel,
  createEthereumAdapter,
} from '@sip-protocol/sdk'

async function privateSwap() {
  // Production mode is required for real NEAR Intents quotes (mainnet only).
  // createProductionSIP wires up the intentsAdapter for you.
  const sip = createProductionSIP({
    network: 'mainnet',
    jwtToken: process.env.NEAR_INTENTS_JWT,
  })

  // Connect wallet
  const adapter = createEthereumAdapter(window.ethereum)
  await adapter.connect()
  sip.connect(adapter)

  // Privacy modes need a stealth meta-address for the recipient.
  const recipientMetaAddress = sip.generateStealthKeys('solana')

  // Production getQuotes() takes CreateIntentParams (raw input/output values).
  const params = {
    input: {
      asset: { chain: 'ethereum', symbol: 'ETH', address: null, decimals: 18 },
      amount: 1_000_000_000_000_000_000n, // 1 ETH
    },
    output: {
      asset: { chain: 'solana', symbol: 'SOL', address: null, decimals: 9 },
      minAmount: 0n,
      maxSlippage: 0.005, // 0.5%
    },
    privacy: PrivacyLevel.SHIELDED,
  }

  // Get real quotes via NEAR Intents (derives a stealth recipient internally).
  const quotes = await sip.getQuotes(params, recipientMetaAddress)

  // Materialize a tracked intent, then execute the best quote.
  const intent = await sip.createIntent(params)
  const result = await sip.execute(intent, quotes[0], {
    onDepositRequired: async (depositAddress, amount) => {
      // Send `amount` to depositAddress from the connected wallet and
      // return the deposit transaction hash.
      return await sendDeposit(depositAddress, amount)
    },
  })

  console.log('Swap complete:', result.txHash)
}
```
