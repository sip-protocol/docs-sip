---
title: Privacy Levels
description: Understanding SIP's three privacy levels
---

# Privacy Levels

SIP defines three privacy levels that users can select per-intent.

## Overview

| Level | Privacy | Compliance | Use Case |
|-------|---------|------------|----------|
| `TRANSPARENT` | None | Full | Maximum compatibility |
| `SHIELDED` | Full | None | Maximum privacy |
| `COMPLIANT` | Full + Disclosure | Selective | Institutional/regulatory |

## TRANSPARENT

Standard on-chain transaction with no privacy enhancements.

```typescript
const intent = await sip
  .intent()
  .input('near', 'NEAR', 100n)
  .output('ethereum', 'ETH')
  .privacy(PrivacyLevel.TRANSPARENT)
  .build()
```

### Visibility

| Information | Visible To |
|-------------|-----------|
| Sender address | Everyone |
| Input amount | Everyone |
| Output amount | Everyone |
| Recipient address | Everyone |

### Required Proofs

None - standard transaction signing only.

### Use Cases

- DEX integrations requiring transparency
- Public treasury operations
- Airdrops and distributions
- Testing and debugging

## SHIELDED

Full privacy with cryptographic hiding of sender, amounts, and recipient.

```typescript
const intent = await sip
  .intent()
  .input('ethereum', 'ETH', 1_000_000_000_000_000_000n)
  .output('zcash', 'ZEC')
  .privacy(PrivacyLevel.SHIELDED)
  .build()
```

### Visibility

| Information | Visible To | Hidden Via |
|-------------|-----------|------------|
| Sender address | Nobody | Sender commitment |
| Input amount | Nobody | Pedersen commitment |
| Output amount | Solver only (range) | Commitment |
| Recipient address | Nobody | Stealth address |
| Min output required | Everyone | Plaintext (for quoting) |

### Required Proofs

| Proof | Purpose |
|-------|---------|
| Funding Proof | Prove balance ≥ input |
| Validity Proof | Prove authorization |
| Fulfillment Proof | Prove correct delivery |

### What Solvers See

```
Solver view:
├── "Someone wants to swap"
├── "Input: ??? amount of SOL (committed)"
├── "Output: at least 100 ZEC"
├── "Recipient: stealth address 0x..."
└── "Proof that sender has sufficient funds: ✓"
```

### Guarantees

| Property | Guaranteed? | Mechanism |
|----------|-------------|-----------|
| Sender privacy | Yes | Pedersen commitment |
| Amount privacy | Yes | Amount commitments |
| Recipient privacy | Yes | Stealth address |
| Unlinkability | Yes | Fresh blinding + stealth per tx |

## COMPLIANT

Full privacy with selective disclosure for authorized auditors.

COMPLIANT mode requires a viewing key. The `IntentBuilder` covers input/output/privacy, but the viewing key is supplied through `createShieldedIntent` (the function the builder delegates to) via the `viewingKey` field of `CreateIntentParams`:

```typescript
import { createShieldedIntent, generateViewingKey, PrivacyLevel } from '@sip-protocol/sdk'

const viewingKey = generateViewingKey('m/0/audit')

const intent = await createShieldedIntent({
  input: {
    asset: { chain: 'solana', symbol: 'SOL', address: null, decimals: 9 },
    amount: 5_000_000_000n,
  },
  output: {
    asset: { chain: 'near', symbol: 'NEAR', address: null, decimals: 24 },
    minAmount: 0n,
    maxSlippage: 0.01,
  },
  privacy: PrivacyLevel.COMPLIANT,
  recipientMetaAddress,
  viewingKey: viewingKey.key,
})
```

### Visibility

| Information | Public | Auditor (with key) |
|-------------|--------|-------------------|
| Sender address | Hidden | Visible |
| Input amount | Hidden | Visible |
| Output amount | Hidden | Visible |
| Recipient address | Hidden | Visible |
| Audit trail | Hidden | Full history |

### Auditor Workflow

1. User creates COMPLIANT intent
2. User designates auditor (provides viewing key hash)
3. Transaction data encrypted with auditor's key
4. Encrypted blob stored with intent
5. Auditor decrypts when needed
6. Auditor generates ViewingProof for reports

### Use Cases

- Institutional trading
- Tax compliance
- Regulatory requirements
- DAO treasury operations

## Comparison Matrix

### Privacy

| Aspect | TRANSPARENT | SHIELDED | COMPLIANT |
|--------|-------------|----------|-----------|
| Sender hidden | No | Yes | Yes (public) / No (auditor) |
| Amount hidden | No | Yes | Yes (public) / No (auditor) |
| Recipient hidden | No | Yes | Yes (public) / No (auditor) |
| Audit possible | Trivial | No | Yes (with key) |

### Performance

| Aspect | TRANSPARENT | SHIELDED | COMPLIANT |
|--------|-------------|----------|-----------|
| Proof generation | None | ~2-5s | ~2-5s + encryption |
| Verification | Fast | ~10ms | ~10ms |
| Data size | Small | Medium | Medium + encrypted blob |

### Use Case Fit

| Use Case | Recommended Level |
|----------|-------------------|
| Public DEX swap | TRANSPARENT |
| Personal privacy | SHIELDED |
| Institutional trading | COMPLIANT |
| Tax reporting needed | COMPLIANT |
| Anonymous donation | SHIELDED |
| Regulated exchange | COMPLIANT |

## Transition Rules

```
TRANSPARENT → SHIELDED ✓ (add proofs and commitments)
TRANSPARENT → COMPLIANT ✓ (add proofs + viewing key)
SHIELDED → COMPLIANT ✓ (add viewing key encryption)
SHIELDED → TRANSPARENT ✗ (cannot reveal hidden data)
COMPLIANT → SHIELDED ✗ (auditor key already shared)
COMPLIANT → TRANSPARENT ✗ (cannot reveal hidden data)
```

Once data is committed/hidden, it cannot be revealed without user cooperation.

## SDK Usage

`createShieldedIntent` accepts a `CreateIntentParams` object: `{ input, output, privacy, recipientMetaAddress?, viewingKey?, ttl? }`. `input`/`output` carry the asset and amount; the privacy level is set via `privacy`.

```typescript
import { createShieldedIntent, generateViewingKey, PrivacyLevel } from '@sip-protocol/sdk'

const input = {
  asset: { chain: 'near', symbol: 'NEAR', address: null, decimals: 24 },
  amount: 100n,
}
const output = {
  asset: { chain: 'ethereum', symbol: 'ETH', address: null, decimals: 18 },
  minAmount: 0n,
  maxSlippage: 0.01,
}

// Transparent
const transparent = await createShieldedIntent({
  input,
  output,
  privacy: PrivacyLevel.TRANSPARENT,
})

// Shielded - SDK generates commitments, stealth, proofs
const shielded = await createShieldedIntent({
  input,
  output,
  privacy: PrivacyLevel.SHIELDED,
  recipientMetaAddress,
})

// Compliant - SDK adds encrypted viewing data
const viewingKey = generateViewingKey('m/0/audit')
const compliant = await createShieldedIntent({
  input,
  output,
  privacy: PrivacyLevel.COMPLIANT,
  recipientMetaAddress,
  viewingKey: viewingKey.key,
})
```

## Security Considerations

### Privacy Level Selection

| Consideration | Guidance |
|---------------|----------|
| Default level | SHIELDED (privacy by default) |
| Downgrade requests | Reject - cannot downgrade |
| Level in metadata | Included in intent_hash |

### Commitment Binding

All commitments are bound to privacy level:

```
commitment_hash = Poseidon(
  commitment,
  privacy_level,
  intent_id
)
```

This prevents commitment reuse across different privacy contexts.

### Auditor Trust

For COMPLIANT mode:
- User chooses auditor (not protocol)
- Multiple auditors supported
- Revocation possible but doesn't hide past disclosures
