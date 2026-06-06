---
title: Solver Integration
description: Guide for implementing SIP-compatible solvers
---

# Solver Integration Guide

Guide for implementing SIP-compatible solvers that can fulfill shielded intents while preserving user privacy.

## Overview

SIP solvers are market makers that compete to fulfill cross-chain swap intents. Unlike traditional DEX aggregators, SIP solvers operate with privacy-preserving constraints:

- **Cannot see sender identity** (only cryptographic commitment)
- **Cannot see exact input amount** (only commitment)
- **Can see output requirements** (needed for quoting)
- **Receive one-time stealth addresses** (unlinkable to recipient)

## Privacy Guarantees

### What Solvers Can See

| Data | Visibility | Purpose |
|------|------------|---------|
| Output asset | **Visible** | Know what to deliver |
| Minimum output amount | **Visible** | Calculate quote |
| Maximum slippage | **Visible** | Price bounds |
| Expiry timestamp | **Visible** | Quote validity |
| Input commitment | **Hidden value** | Proves funds exist |
| Sender commitment | **Hidden value** | Proves valid sender |
| Recipient address | **Stealth** | One-time, unlinkable |

### What Solvers Cannot See

| Data | Protection |
|------|------------|
| Sender identity | Commitment |
| Input amount | Commitment |
| Recipient identity | Stealth address |
| Transaction history | Unlinkable |

## Implementing a Solver

### Interface

```typescript
interface SIPSolver {
  readonly info: Solver
  readonly capabilities: SolverCapabilities

  canHandle(intent: SolverVisibleIntent): Promise<boolean>
  generateQuote(intent: SolverVisibleIntent): Promise<SolverQuote | null>
  fulfill(intent: ShieldedIntent, quote: SolverQuote): Promise<FulfillmentResult>

  cancel?(intentId: string): Promise<boolean>
  getStatus?(intentId: string): Promise<FulfillmentStatus | null>
}
```

### Implementing `canHandle`

```typescript
async canHandle(intent: SolverVisibleIntent): Promise<boolean> {
  // Check chain support
  if (!this.capabilities.outputChains.includes(intent.outputAsset.chain)) {
    return false
  }

  // Check expiry
  if (intent.expiry < Date.now() / 1000) {
    return false
  }

  // Check minimum amount
  if (intent.minOutputAmount < this.info.minOrderSize) {
    return false
  }

  // Check liquidity
  const liquidity = await this.getLiquidity(intent.outputAsset)
  return liquidity >= intent.minOutputAmount
}
```

### Implementing `generateQuote`

```typescript
async generateQuote(intent: SolverVisibleIntent): Promise<SolverQuote | null> {
  if (!await this.canHandle(intent)) {
    return null
  }

  const price = await this.getPrice(intent.outputAsset)
  const baseOutput = intent.minOutputAmount
  const outputWithSpread = baseOutput + (baseOutput * BigInt(spread)) / 10000n
  const fee = (outputWithSpread * BigInt(feePercent)) / 10000n

  // Generate a unique quote ID (e.g. crypto.randomUUID())
  const quoteId = crypto.randomUUID()
  const validUntil = Math.floor(Date.now() / 1000) + 60

  return {
    quoteId,
    intentId: intent.intentId,
    solverId: this.info.id,
    outputAmount: outputWithSpread,
    estimatedTime: 30,
    expiry: validUntil,
    fee,
    validUntil, // Required by SolverQuote
    signature: await this.signQuote(quoteId, outputWithSpread),
  }
}
```

### Implementing `fulfill`

```typescript
async fulfill(
  intent: ShieldedIntent,
  quote: SolverQuote,
): Promise<FulfillmentResult> {
  try {
    // Verify quote validity
    if (quote.expiry < Date.now() / 1000) {
      throw new Error('Quote expired')
    }

    // Verify proofs
    await this.verifyProofs(intent)

    // Execute swap - send to stealth address
    const txHash = await this.executeSwap(
      intent.outputAsset,
      quote.outputAmount,
      intent.recipientStealth.address, // One-time address
    )

    // Generate fulfillment proof
    const proof = await this.generateFulfillmentProof(intent, quote, txHash)

    return {
      intentId: intent.intentId,
      status: IntentStatus.FULFILLED,
      outputAmount: quote.outputAmount,
      fulfillmentProof: proof,
      fulfilledAt: Date.now(),
    }
  } catch (error) {
    return {
      intentId: intent.intentId,
      status: IntentStatus.FAILED,
      error: error.message,
      fulfilledAt: Date.now(),
    }
  }
}
```

## Solver Capabilities

```typescript
const capabilities: SolverCapabilities = {
  inputChains: ['near', 'ethereum', 'solana'],
  outputChains: ['near', 'ethereum', 'solana', 'zcash'],
  supportedPairs: new Map([
    ['near', ['ethereum', 'solana']],
    ['ethereum', ['near', 'zcash']],
  ]),
  supportsShielded: true,
  supportsCompliant: true,
  supportsPartialFill: false, // Required: streaming / partial fills
  avgFulfillmentTime: 30,
}
```

## Privacy Best Practices

### Do's

1. **Verify proofs** - Always verify funding and validity proofs
2. **Use stealth addresses** - Send output to provided stealth address
3. **Respect privacy levels** - Don't log transaction data for shielded intents
4. **Time randomization** - Add slight delays to prevent timing analysis

### Don'ts

1. **Don't log sender info** - Even commitment values
2. **Don't correlate intents** - Treat each intent independently
3. **Don't share intent data** - With third parties
4. **Don't store stealth addresses** - They're one-time use

## Testing

```typescript
import { MockSolver, createMockSolver } from '@sip-protocol/sdk'

const solver = createMockSolver({
  name: 'Test Solver',
  supportedChains: ['near', 'ethereum'],
  feePercent: 0.005,
  executionDelay: 100,
  failureRate: 0,
})

const quote = await solver.generateQuote(visibleIntent)
expect(quote.outputAmount).toBeGreaterThan(visibleIntent.minOutputAmount)
```

## NEAR Intents Integration

Connect to the Solver Bus:

```typescript
const ws = new WebSocket('wss://solver-relay-v2.chaindefuser.com/ws')

ws.send(JSON.stringify({
  method: 'subscribe',
  params: ['quote'],
}))

ws.on('message', async (data) => {
  const event = JSON.parse(data)
  if (event.event === 'quote') {
    const quote = await solver.generateQuote(event.data)
    if (quote) {
      ws.send(JSON.stringify({
        method: 'quote_response',
        params: { quote_id: event.data.quote_id, ...quote },
      }))
    }
  }
})
```

## Security Considerations

1. **Collateral** - Lock collateral before fulfillment
2. **Timeout handling** - Handle expired intents gracefully
3. **Proof verification** - Verify all ZK proofs before executing
4. **Rate limiting** - Protect against spam quotes
5. **Quote signing** - Sign quotes to prevent tampering
