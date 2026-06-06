---
title: Validity Proof
description: Zero-knowledge proof of intent authorization
---

import { Badge, Card } from '@astrojs/starlight/components'

<div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
  <Badge text="Planned" variant="caution" />
  <Badge text="Noir" variant="note" />
  <Badge text="1,113 ACIR opcodes" variant="tip" />
  <Badge text="6 tests" variant="tip" />
</div>

<Card title="TL;DR">
Proves an intent was authorized by a legitimate sender **without revealing their identity**. Uses ECDSA signature verification inside the circuit to prove "someone with spending authority signed this."
</Card>

:::note[Circuit metric: ACIR opcodes vs gate count]
The **1,113** figure is the **ACIR opcode** count reported by `nargo info` for the compiled circuit — not a Barretenberg gate count. After Noir lowers ACIR to the UltraHonk proving system (Barretenberg / `@aztec/bb.js`), the backend gate count is larger and backend-specific.
:::

# Validity Proof Specification

The Validity Proof demonstrates that an intent was authorized by a legitimate sender without revealing their identity.

## Purpose

In shielded mode, the sender is hidden behind a commitment. The Validity Proof proves:

**"This intent was authorized by someone with spending authority"** without revealing **"who specifically authorized it"**

## Public vs Private Inputs

| Input | Visibility | Description |
|-------|------------|-------------|
| `intent_hash` | Public | Hash of the intent being authorized |
| `sender_commitment` | Public | Commitment to sender identity |
| `sender_address` | Private | Actual sender address |
| `signature` | Private | Sender's signature on intent |
| `blinding_factor` | Private | Commitment randomness |

## Circuit Specification

### Constraints

1. **Signature Valid**: Signature verifies against sender_address
2. **Commitment Binding**: `Pedersen(hash(sender_address), blinding) = sender_commitment`
3. **Intent Binding**: Signature is over the correct intent_hash

### Noir Implementation

```noir
use dep::std::ecdsa::verify_signature;
use dep::std::hash::{pedersen_hash, poseidon::hash_1};

fn main(
    // Public inputs
    intent_hash: pub Field,
    sender_commitment: pub Field,

    // Private inputs
    sender_address: Field,
    signature_r: [u8; 32],
    signature_s: [u8; 32],
    public_key_x: [u8; 32],
    public_key_y: [u8; 32],
    blinding_factor: Field,
) {
    // Constraint 1: Verify ECDSA signature
    let message = intent_hash.to_be_bytes(32);
    let valid_sig = verify_signature(
        public_key_x,
        public_key_y,
        signature_r,
        signature_s,
        message
    );
    assert(valid_sig);

    // Constraint 2: Sender address matches public key
    let derived_address = hash_1([
        bytes_to_field(public_key_x),
        bytes_to_field(public_key_y)
    ]);
    assert(derived_address == sender_address);

    // Constraint 3: Commitment correctness
    let address_hash = hash_1([sender_address]);
    let computed_commitment = pedersen_hash([
        address_hash,
        blinding_factor
    ]);
    assert(computed_commitment == sender_commitment);
}
```

## Workflow

```mermaid
sequenceDiagram
    participant U as User (0xABC...)
    participant SDK as SIP SDK
    participant V as Verifier

    Note over U: Wants shielded intent

    U->>SDK: Create sender commitment<br/>C = Pedersen(hash(0xABC), blinding)
    U->>SDK: Sign intent_hash with private key
    SDK->>SDK: Generate validity proof
    Note right of SDK: Public: intent_hash, C<br/>Private: address, signature, blinding

    SDK->>V: Submit proof + public inputs
    V->>V: Verify proof
    V-->>U: Confirmed: "Someone authorized this"
```

## Security Properties

| Property | Guarantee |
|----------|-----------|
| **Soundness** | Only key holder can prove |
| **Zero-knowledge** | Sender address hidden |
| **Non-transferability** | Proof tied to specific intent |

## Relationship to Other Proofs

```mermaid
flowchart LR
    FP["Funding Proof<br/>'I have enough funds'"]
    VP["Validity Proof<br/>'I authorized this'"]
    CA["Complete Authorization<br/>'I can make this swap'"]

    FP --> CA
    VP --> CA

    style FP fill:#4c1d95,stroke:#a78bfa
    style VP fill:#4c1d95,stroke:#a78bfa
    style CA fill:#22c55e,stroke:#86efac,stroke-width:2px
```

## Integration with SDK

```typescript
import { MockProofProvider, ValidityProofParams } from '@sip-protocol/sdk'

const proofProvider = new MockProofProvider()

const params: ValidityProofParams = {
  intentHash: '0x...',                       // public: hash of the intent
  senderAddress: '0xABC...',                 // private: actual sender address
  senderBlinding: new Uint8Array(32),        // private: sender commitment blinding
  senderSecret: new Uint8Array(32),          // private: sender secret key
  authorizationSignature: new Uint8Array(64),// private: signature authorizing the intent
  nonce: new Uint8Array(32),                 // private: nonce for nullifier
  timestamp: Date.now(),                     // public: intent timestamp
  expiry: Date.now() + 3_600_000             // public: intent expiry
  // senderPublicKey is optional — derived from senderSecret when omitted
}

const result = await proofProvider.generateValidityProof(params)
```

## Proof Format

```typescript
interface ValidityProof {
  proof: HexString
  publicInputs: {
    intentHash: Field
    senderCommitment: Field
  }
  framework: 'noir' | 'mock'
  timestamp: number
}
```

## Edge Cases

| Case | Handling |
|------|----------|
| Invalid signature | Proof generation fails |
| Wrong intent hash | Proof won't verify |
| Replay attempt | Intent hash includes nonce |
| Multi-sig | Extended circuit needed |

## Performance

| Metric | Mock | Noir (estimated) |
|--------|------|------------------|
| Proof generation | <1ms | 3-5s |
| Proof size | placeholder bytes (not a real proof) | multi-KB (real UltraHonk proof) |
| Verification | <1ms | ~15ms |

:::caution[Proof size]
`MockProofProvider` returns placeholder bytes for testing — it is **not** a real cryptographic proof and has no fixed 64-byte size. Real proofs are produced by the UltraHonk backend (Barretenberg / `@aztec/bb.js`) and are several KB, not ~250 bytes.
:::
