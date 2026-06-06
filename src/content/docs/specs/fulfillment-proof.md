---
title: Fulfillment Proof
description: Zero-knowledge proof of correct swap execution
---

import { Badge, Card } from '@astrojs/starlight/components'

<div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
  <Badge text="Planned" variant="caution" />
  <Badge text="Noir" variant="note" />
  <Badge text="~80 constraints" variant="tip" />
</div>

<Card title="TL;DR">
Proves a solver correctly executed a swap **without revealing the exact amount or transaction path**. Verifies delivery to the correct stealth address and that output meets minimum requirements.
</Card>

# Fulfillment Proof Specification

The Fulfillment Proof demonstrates that a solver correctly executed a swap without revealing transaction details.

## Purpose

After fulfilling an intent, the solver must prove:

**"I delivered at least X tokens to the correct recipient"** without revealing **"exact amount or transaction path"**

## Public vs Private Inputs

| Input | Visibility | Description |
|-------|------------|-------------|
| `intent_id` | Public | Intent being fulfilled |
| `output_commitment` | Public | Commitment to output amount |
| `min_output` | Public | Minimum required output |
| `recipient_stealth` | Public | Stealth address for delivery |
| `output_amount` | Private | Actual delivered amount |
| `output_blinding` | Private | Commitment randomness |
| `tx_proof` | Private | Proof of on-chain execution |

## Circuit Specification

### Constraints

1. **Minimum Met**: `output_amount >= min_output`
2. **Commitment Valid**: `Pedersen(output_amount, blinding) = output_commitment`
3. **Delivery Verified**: Transaction sent to `recipient_stealth`

### Noir Implementation

```noir
use dep::std::hash::pedersen_hash;

fn main(
    // Public inputs
    intent_id: pub Field,
    output_commitment: pub Field,
    min_output: pub u64,
    recipient_stealth: pub Field,

    // Private inputs
    output_amount: u64,
    output_blinding: Field,
    tx_hash: Field,
    tx_recipient: Field,
) {
    // Constraint 1: Minimum output met
    assert(output_amount >= min_output);

    // Constraint 2: Commitment correctness
    let computed = pedersen_hash([
        output_amount as Field,
        output_blinding
    ]);
    assert(computed == output_commitment);

    // Constraint 3: Correct recipient
    assert(tx_recipient == recipient_stealth);

    // Binding: tx_hash commits to execution
    // (verified on-chain separately)
}
```

## Workflow

```mermaid
sequenceDiagram
    participant S as Solver
    participant Chain as Blockchain
    participant P as Protocol

    Note over S: Accepts intent<br/>min_output = 100 ZEC

    S->>Chain: Execute swap
    Chain-->>S: Delivered 105 ZEC

    S->>S: Create commitment<br/>C = Pedersen(105, blinding)
    S->>S: Generate fulfillment proof
    Note right of S: Public: intent_id, C, min=100<br/>Private: amount=105, blinding

    S->>P: Submit proof
    P->>P: Verify proof
    P-->>S: Confirmed: "Delivered >= 100 ZEC"
```

## Security Properties

| Property | Guarantee |
|----------|-----------|
| **Soundness** | Cannot claim false fulfillment |
| **Zero-knowledge** | Exact amount hidden |
| **Binding** | Cannot change claimed delivery |

## Solver Workflow

```mermaid
sequenceDiagram
    participant U as User Intent
    participant S as Solver
    participant P as Protocol

    U->>S: Submit intent
    S->>S: Execute swap
    S->>S: Generate proof
    S->>P: Fulfillment + Proof
    P->>P: Verify
    P-->>S: Verified
    S-->>U: Settlement complete
```

## Integration with SDK

```typescript
import { MockProofProvider, FulfillmentProofParams } from '@sip-protocol/sdk'

const proofProvider = new MockProofProvider()

const params: FulfillmentProofParams = {
  intentHash: '0x...',                  // public: hash of the original intent
  outputAmount: 105n,                   // private: actual amount delivered
  outputBlinding: new Uint8Array(32),   // private: output commitment blinding
  minOutputAmount: 100n,                // public: minimum required output
  recipientStealth: '0x...',            // public: recipient's stealth address
  solverId: 'solver-1',                 // public: solver identifier
  solverSecret: new Uint8Array(32),     // private: solver authorization secret
  oracleAttestation: {                  // private: oracle attestation of delivery
    recipient: '0x...',
    amount: 105n,
    txHash: '0x...',
    blockNumber: 19000000n,
    signature: new Uint8Array(64)
  },
  fulfillmentTime: Date.now(),          // public: time of fulfillment
  expiry: Date.now() + 3_600_000        // public: intent expiry
}

const result = await proofProvider.generateFulfillmentProof(params)
```

## Proof Format

```typescript
interface FulfillmentProof {
  proof: HexString
  publicInputs: {
    intentId: Field
    outputCommitment: Field
    minOutput: u64
    recipientStealth: Field
  }
  framework: 'noir' | 'mock'
  timestamp: number
}
```

## Oracle Attestation

For cross-chain verification, an oracle may attest to delivery:

```typescript
interface OracleAttestation {
  recipient: HexString    // who received the funds
  amount: bigint          // amount received
  txHash: HexString       // transaction hash on the destination chain
  blockNumber: bigint     // block containing the transaction
  signature: Uint8Array   // oracle signature (threshold sig for multi-oracle)
}
```

## Edge Cases

| Case | Handling |
|------|----------|
| Partial fill | Multiple proofs for partial |
| Overpayment | Valid (exceeds minimum) |
| Wrong recipient | Proof verification fails |
| Failed tx | No proof generated |

## Performance

| Metric | Mock | Noir (estimated) |
|--------|------|------------------|
| Proof generation | <1ms | 2-4s |
| Proof size | 64 bytes | ~200 bytes |
| Verification | <1ms | ~10ms |
