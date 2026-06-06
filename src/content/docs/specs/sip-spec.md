---
title: SIP Specification
description: Core protocol specification
---

# SIP Specification

Core protocol specification for the Shielded Intents Protocol.

## Protocol Overview

SIP provides privacy for cross-chain intents through:

1. **Pedersen Commitments** - Hide transaction amounts
2. **Stealth Addresses** - Unlinkable recipient addresses
3. **Viewing Keys** - Selective disclosure for compliance
4. **ZK Proofs** - Verify without revealing secrets

## Intent Format

### Shielded Intent Structure

```typescript
interface ShieldedIntent {
  // Identification
  intentId: string
  version: string
  privacyLevel: 'transparent' | 'shielded' | 'compliant'

  // Timing
  createdAt: number
  expiry: number

  // Output (public - needed for quoting)
  outputAsset: Asset
  minOutputAmount: bigint
  maxSlippage: number

  // Hidden fields (commitments)
  inputCommitment: Commitment
  senderCommitment: Commitment

  // Stealth addressing
  recipientStealth: StealthAddress
  ephemeralPublicKey: HexString

  // Proofs
  fundingProof: ZKProof
  validityProof: ZKProof

  // Compliance (optional)
  viewingKeyHash?: Hash
  encryptedMetadata?: Encrypted
}
```

The on-wire `version` field is populated from the SDK's exported `SIP_VERSION` constant,
whose current value is `'sip-v1'`.

### Commitment Format

```typescript
interface Commitment {
  value: HexString        // 33-byte compressed point
  blindingFactor: HexString  // 32-byte scalar
}
```

### Stealth Address Format

```typescript
interface StealthAddress {
  address: HexString      // 33-byte compressed public key
  ephemeralPublicKey: HexString
  viewTag: number         // 0-255
}
```

## Cryptographic Primitives

### Curve Parameters

| Parameter | Value |
|-----------|-------|
| Curve | secp256k1 |
| Generator G | Standard |
| Order n | 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141 |

### Hash Functions

| Purpose | Function |
|---------|----------|
| Shared secret | SHA-256 |
| Key derivation | HKDF-SHA256 |
| View tag | SHA-256[0] |

### Encryption

| Component | Algorithm |
|-----------|-----------|
| Symmetric | XChaCha20-Poly1305 |
| Key derivation | HKDF |
| Nonce size | 24 bytes |

## Commitment Scheme

### NUMS Generator

Independent generator H where log_G(H) is unknown:

```
GenerateH():
  domain ← "SIP-PEDERSEN-GENERATOR-H-v1"
  for counter = 0 to 255:
    candidate ← SHA256(domain || counter)
    if IsValidCurvePoint(candidate):
      H ← LiftX(candidate)
      if H ≠ G and H ≠ O:
        return H
```

### Commit

```
Commit(v, r):
  Input: value v ∈ [0, n), optional blinding r
  Output: commitment C, blinding r

  1. If r not provided: r ← RandomBytes(32) mod n
  2. If r = 0: r ← 1
  3. C ← v·G + r·H
  4. Return (C, r)
```

### Verify Opening

```
VerifyOpening(C, v, r):
  1. r' ← r mod n
  2. If r' = 0: r' ← 1
  3. C' ← v·G + r'·H
  4. Return C = C'
```

## Stealth Address Scheme

### Generate Meta-Address

```
GenerateMetaAddress(chain):
  1. p ← RandomBytes(32)  // Spending private
  2. q ← RandomBytes(32)  // Viewing private
  3. P ← p·G
  4. Q ← q·G
  5. Return {
       metaAddress: (P, Q, chain),
       spendingKey: p,
       viewingKey: q
     }
```

### Derive Stealth Address

```
DeriveStealthAddress(P, Q):
  1. r ← RandomBytes(32)
  2. R ← r·G
  3. S ← ECDH(r, P)
  4. s ← SHA256(S)
  5. A ← Q + s·G
  6. viewTag ← s[0]
  7. Return {
       address: A,
       ephemeralKey: R,
       viewTag: viewTag
     }
```

### Recover Stealth Key

```
RecoverStealthKey(A, R, p, q):
  1. S' ← ECDH(p, R)
  2. s' ← SHA256(S')
  3. a ← q + s' mod n
  4. Assert a·G = A
  5. Return a
```

## Meta-Address Encoding

```
sip:<chain>:<spendingKey>:<viewingKey>

Example:
sip:ethereum:0x02abc...def:0x03123...456

Where:
- chain ∈ {ethereum, solana, near, zcash, polygon, ...}
- spendingKey: 33-byte compressed public key (hex)
- viewingKey: 33-byte compressed public key (hex)
```

## Proof Types

### Funding Proof

Proves: User has balance ≥ committed amount

```
Public inputs:
  - commitment_hash
  - minimum_amount

Private inputs:
  - actual_balance
  - blinding_factor

Constraints:
  - actual_balance >= minimum_amount
  - commitment = Pedersen(actual_balance, blinding_factor)
```

### Validity Proof

Proves: Intent is authorized by sender

```
Public inputs:
  - intent_hash
  - sender_commitment

Private inputs:
  - sender_address
  - signature
  - blinding_factor

Constraints:
  - signature valid for intent_hash
  - sender_commitment = Pedersen(hash(sender_address), blinding)
```

### Fulfillment Proof

Proves: Solver correctly executed the swap

```
Public inputs:
  - intent_id
  - output_commitment
  - recipient_stealth

Private inputs:
  - output_amount
  - output_blinding
  - execution_proof

Constraints:
  - output_amount >= min_output_amount
  - output_commitment = Pedersen(output_amount, output_blinding)
  - funds sent to recipient_stealth
```

## Security Parameters

| Parameter | Value | Justification |
|-----------|-------|---------------|
| Curve | secp256k1 | 128-bit security |
| Hash | SHA-256 | 128-bit collision resistance |
| Key size | 256 bits | Standard security level |
| View tag | 8 bits | 256x scanning speedup |
| Nonce | 192 bits | XChaCha20 standard |

## Error Codes

| Code | Description |
|------|-------------|
| SIP_2000 | Validation failed |
| SIP_2002 | Invalid chain |
| SIP_2003 | Invalid privacy level |
| SIP_2004 | Invalid amount |
| SIP_3000 | Cryptographic operation failed |
| SIP_4000 | Proof failed |
| SIP_5000 | Intent failed |
| SIP_6000 | Network error |

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Nov 2025 | Initial specification |
