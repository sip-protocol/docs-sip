---
title: Funding Proof
description: Zero-knowledge proof of sufficient funds
---

import { Badge, Card } from '@astrojs/starlight/components'

<div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
  <Badge text="Planned" variant="caution" />
  <Badge text="Noir" variant="note" />
  <Badge text="972 ACIR opcodes" variant="tip" />
  <Badge text="5 tests" variant="tip" />
</div>

<Card title="TL;DR">
Proves user has sufficient balance to cover a transaction **without revealing the actual balance**. Uses Pedersen commitments to hide amounts while proving `balance >= minimum`.
</Card>

:::note[Circuit metric: ACIR opcodes vs gate count]
The **972** figure is the **ACIR opcode** count reported by `nargo info` for the compiled circuit — not a Barretenberg gate count. After Noir lowers ACIR to the UltraHonk proving system (Barretenberg / `@aztec/bb.js`), the backend gate count is larger and backend-specific. The SDK JSDoc carries a separate, higher gate-count *estimate*; treat the two as different metrics — ACIR opcodes describe the circuit, gate count describes the proving cost.
:::

# Funding Proof Specification

The Funding Proof demonstrates that a user has sufficient balance to cover a transaction without revealing the actual balance.

## Purpose

When creating a shielded intent, the user commits to an input amount but doesn't reveal it. The Funding Proof proves:

**"I have at least X tokens"** without revealing **"I have exactly Y tokens"**

## Public vs Private Inputs

| Input | Visibility | Description |
|-------|------------|-------------|
| `commitment_hash` | Public | Hash of the amount commitment |
| `minimum_amount` | Public | Required minimum balance |
| `actual_balance` | Private | User's true balance |
| `blinding_factor` | Private | Commitment randomness |

## Circuit Specification

### Constraints

1. **Balance Sufficiency**: `actual_balance >= minimum_amount`
2. **Commitment Correctness**: `Pedersen(actual_balance, blinding) = commitment`

### Noir Implementation

```noir
use dep::std::hash::pedersen_hash;

fn main(
    // Public inputs
    commitment_hash: pub Field,
    minimum_amount: pub u64,

    // Private inputs (witness)
    actual_balance: u64,
    blinding_factor: Field,
) {
    // Constraint 1: Sufficient balance
    assert(actual_balance >= minimum_amount);

    // Constraint 2: Commitment validity
    let computed_commitment = pedersen_hash([
        actual_balance as Field,
        blinding_factor
    ]);

    assert(computed_commitment == commitment_hash);
}
```

## Workflow

```mermaid
sequenceDiagram
    participant U as User
    participant SDK as SIP SDK
    participant V as Verifier

    Note over U: Has 1000 tokens, wants to send 500

    U->>SDK: Create commitment C = Pedersen(500, blinding)
    SDK->>SDK: Generate ZK proof
    Note right of SDK: Public: hash(C), min=500<br/>Private: balance=1000, blinding

    SDK->>V: Submit proof + public inputs
    V->>V: Verify proof
    V-->>U: Confirmed: "Has at least 500 tokens"
```

## Security Properties

| Property | Guarantee |
|----------|-----------|
| **Soundness** | Cannot prove false balance |
| **Zero-knowledge** | Actual balance not revealed |
| **Binding** | Cannot change committed amount |

## Integration with SDK

```typescript
import { MockProofProvider, FundingProofParams } from '@sip-protocol/sdk'

const proofProvider = new MockProofProvider()

const params: FundingProofParams = {
  balance: 1000n,                        // private: user's actual balance
  minimumRequired: 500n,                 // public: minimum the intent needs
  blindingFactor: new Uint8Array(32),    // private: commitment randomness
  assetId: '0xABCD',                     // public: asset identifier
  userAddress: '0x1234...',              // private: address for ownership proof
  ownershipSignature: new Uint8Array(64) // private: signature proving ownership
}

const result = await proofProvider.generateFundingProof(params)

// ProofResult = { proof, publicInputs, commitment? }
console.log('Proof:', result.proof)
console.log('Public inputs:', result.publicInputs)
```

## Proof Format

```typescript
interface FundingProof {
  proof: HexString       // ZK proof bytes
  publicInputs: {
    commitmentHash: Field
    minimumAmount: u64
  }
  framework: 'noir' | 'mock'
  timestamp: number
}
```

## Verification

Solvers verify the funding proof before accepting an intent:

```typescript
// verifyProof takes the proof only; public inputs travel inside the proof object
const isValid = await proofProvider.verifyProof(fundingProof)

if (!isValid) {
  throw new Error('Invalid funding proof')
}
```

## Edge Cases

| Case | Handling |
|------|----------|
| Balance = Minimum | Valid (equality allowed) |
| Balance < Minimum | Proof generation fails |
| Zero balance | Proof fails unless min=0 |
| Overflow | Constrained by field size |

## Performance

| Metric | Mock | Noir (estimated) |
|--------|------|------------------|
| Proof generation | <1ms | 2-3s |
| Proof size | placeholder bytes (not a real proof) | multi-KB (real UltraHonk proof) |
| Verification | <1ms | ~10ms |

:::caution[Proof size]
`MockProofProvider` returns placeholder bytes for testing — it is **not** a real cryptographic proof and has no fixed 64-byte size. Real proofs are produced by the UltraHonk backend (Barretenberg / `@aztec/bb.js`) and are several KB, not ~200 bytes.
:::
