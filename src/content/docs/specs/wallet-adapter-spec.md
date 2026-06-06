---
title: Wallet Adapter
description: Wallet adapter interface specification
---

# Wallet Adapter Specification

The wallet adapter provides a unified interface for interacting with different blockchain wallets.

## Interface

```typescript
interface WalletAdapter {
  // Identity
  readonly chain: ChainId
  readonly name: string
  readonly address: string | null
  readonly connected: boolean

  // Connection
  connect(): Promise<void>
  disconnect(): Promise<void>

  // Signing — returns a Signature object, not raw bytes
  signMessage(message: Uint8Array): Promise<Signature>
  signTransaction(transaction: unknown): Promise<unknown>

  // Events
  on(event: WalletEvent, handler: EventHandler): void
  off(event: WalletEvent, handler: EventHandler): void
}
```

`signMessage` resolves to a `Signature` object rather than raw bytes:

```typescript
interface Signature {
  signature: HexString    // signature bytes, hex encoded
  recoveryId?: number     // recovery id for secp256k1
  publicKey: HexString    // signing public key, hex encoded
}
```

:::note
The SDK ships two related adapter abstractions: the general-purpose `WalletAdapter`
(exported as `IWalletAdapter`) shown here, and `PrivateWalletAdapter`, which extends it with
SIP-specific shielded-send helpers. Both return `Signature` from `signMessage`.
:::

## Events

| Event | Description |
|-------|-------------|
| `connect` | Wallet connected |
| `disconnect` | Wallet disconnected |
| `accountChange` | Active account changed |
| `chainChange` | Active chain changed |
| `error` | Error occurred |

## Implementations

### EthereumWalletAdapter

For MetaMask, WalletConnect, and EIP-1193 providers:

```typescript
import { createEthereumAdapter, getEthereumProvider } from '@sip-protocol/sdk'

const provider = getEthereumProvider()
const adapter = createEthereumAdapter(provider)

await adapter.connect()
console.log('Connected:', adapter.address)

// Sign message
const signature = await adapter.signMessage(
  new TextEncoder().encode('Hello SIP')
)

// Sign transaction
const signedTx = await adapter.signTransaction({
  to: '0x...',
  value: '0x...',
  data: '0x...'
})
```

### SolanaWalletAdapter

For Phantom, Solflare, and Solana wallets:

```typescript
import { createSolanaAdapter, getSolanaProvider } from '@sip-protocol/sdk'

const provider = getSolanaProvider()
const adapter = createSolanaAdapter(provider)

await adapter.connect()
console.log('Connected:', adapter.address)

// Sign message
const signature = await adapter.signMessage(message)

// Sign all transactions (Solana-specific)
const signedTxs = await adapter.signAllTransactions(transactions)
```

### MockWalletAdapter

For testing:

```typescript
import { MockWalletAdapter } from '@sip-protocol/sdk'

const adapter = new MockWalletAdapter({
  chain: 'ethereum',
  address: '0xtest...',
  privateKey: '0x...'
})

await adapter.connect()
// Works like real adapter for testing
```

## Base Class

```typescript
abstract class BaseWalletAdapter implements WalletAdapter {
  // Subclasses must declare their chain and a human-readable name
  abstract readonly chain: ChainId
  abstract readonly name: string

  protected state: ConnectionState = 'disconnected'
  protected eventHandlers: Map<WalletEvent, EventHandler[]>

  abstract connect(): Promise<void>
  abstract disconnect(): Promise<void>
  abstract signMessage(message: Uint8Array): Promise<Signature>
  abstract signTransaction(tx: unknown): Promise<unknown>

  emit(event: WalletEvent, data?: unknown): void {
    this.eventHandlers.get(event)?.forEach(h => h(data))
  }

  on(event: WalletEvent, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event) || []
    handlers.push(handler)
    this.eventHandlers.set(event, handlers)
  }

  off(event: WalletEvent, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event) || []
    this.eventHandlers.set(event, handlers.filter(h => h !== handler))
  }
}
```

## Usage with SIP

```typescript
import { SIP, createEthereumAdapter, getEthereumProvider } from '@sip-protocol/sdk'

const sip = new SIP({ network: 'testnet' })

// Connect wallet
const provider = getEthereumProvider()
const adapter = createEthereumAdapter(provider)
await adapter.connect()

// Attach to SIP
sip.connect(adapter)

// Now SIP can sign intents
const intent = await sip
  .intent()
  .input('ethereum', 'ETH', 1_000_000_000_000_000_000n)
  .output('solana', 'SOL')
  .build()  // Will sign with connected wallet
```

## Error Handling

```typescript
try {
  await adapter.connect()
} catch (error) {
  if (error.code === 4001) {
    // User rejected
    console.log('User rejected connection')
  } else if (error.code === -32002) {
    // Already pending
    console.log('Connection already pending')
  } else {
    throw error
  }
}
```

## Chain-Specific Features

### Ethereum

```typescript
interface EthereumWalletAdapter extends WalletAdapter {
  switchChain(chainId: number): Promise<void>
  addToken(token: TokenInfo): Promise<void>
  getBalance(): Promise<bigint>
}
```

### Solana

```typescript
interface SolanaWalletAdapter extends WalletAdapter {
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]>
  sendTransaction(tx: Transaction): Promise<string>
}
```

## Provider Detection

```typescript
// Ethereum
function getEthereumProvider(): EIP1193Provider | null {
  if (typeof window !== 'undefined') {
    return window.ethereum || null
  }
  return null
}

// Solana
function getSolanaProvider(): SolanaProvider | null {
  if (typeof window !== 'undefined') {
    return window.solana || window.phantom?.solana || null
  }
  return null
}
```

## Security Considerations

1. **Never store private keys** - Only use for signing
2. **Validate addresses** - Check format before use
3. **Clear on disconnect** - Remove references to sensitive data
4. **Handle timeouts** - Set reasonable timeouts for signing
5. **Validate signatures** - Verify before submission
