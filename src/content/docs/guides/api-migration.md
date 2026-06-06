---
title: API Migration Guide
description: Migrate from deprecated APIs to their replacements
---

# API Migration Guide

This guide helps you migrate code that uses deprecated methods before they are removed.

The current SDK release is **`@sip-protocol/sdk` v0.9.0**. The methods below still ship in v0.9.0 for backward compatibility, but they emit a runtime deprecation warning and are scheduled for removal in a future major release (the original removal target was 2026-06-01). Migrate now to avoid a breaking change later.

## Overview

| Deprecated Method | Replacement | Status |
|-------------------|-------------|--------|
| `createCommitment()` | `commit()` | Deprecated — slated for removal |
| `verifyCommitment()` | `verifyOpening()` | Deprecated — slated for removal |
| `generateShieldedAddress()` | `createAccount()` + `getAddressForAccount()` | Deprecated — slated for removal |

## Pedersen Commitments

### `createCommitment()` → `commit()`

**Old API (Deprecated):**

```typescript
import { createCommitment } from '@sip-protocol/sdk'

const commitment = createCommitment(1000n)
// Returns: { value: HexString, blindingFactor: HexString }
```

**New API:**

```typescript
import { commit } from '@sip-protocol/sdk/commitment'

const { commitment, blinding } = commit(1000n)
// Returns: { commitment: HexString, blinding: HexString }
```

**Key Differences:**
- Property names: `value` → `commitment`, `blindingFactor` → `blinding`
- Import path: `@sip-protocol/sdk` → `@sip-protocol/sdk/commitment`

### `verifyCommitment()` → `verifyOpening()`

**Old API (Deprecated):**

```typescript
import { verifyCommitment } from '@sip-protocol/sdk'

const isValid = verifyCommitment(commitment, 1000n)
// commitment is { value: HexString, blindingFactor: HexString }
```

**New API:**

```typescript
import { verifyOpening } from '@sip-protocol/sdk/commitment'

const isValid = verifyOpening(commitment, 1000n, blinding)
// commitment is HexString, blinding is HexString
```

**Key Differences:**
- Separate parameters: `(commitment, value, blinding)`
- Import path changed
- First parameter is commitment value directly, not object

**Example Migration:**

```typescript
// Before
import { verifyCommitment } from '@sip-protocol/sdk'
const isValid = verifyCommitment(commitmentObj, 1000n)

// After
import { verifyOpening } from '@sip-protocol/sdk/commitment'
const isValid = verifyOpening(
  commitmentObj.value,
  1000n,
  commitmentObj.blindingFactor
)
```

## Zcash Shielded Addresses

### `generateShieldedAddress()` → `createAccount()` + `getAddressForAccount()`

**Old API (Deprecated):**

```typescript
import { ZcashRPCClient } from '@sip-protocol/sdk'

const client = new ZcashRPCClient(config)
const address = await client.generateShieldedAddress('sapling')
```

**New API:**

```typescript
import { ZcashRPCClient } from '@sip-protocol/sdk'

const client = new ZcashRPCClient(config)

// Step 1: Create HD account
const { account } = await client.createAccount()

// Step 2: Get address for account
const { address } = await client.getAddressForAccount(account)
```

**Why This Changed:**
- Modern Zcash uses HD accounts
- Better key management and organization
- Supports multiple addresses per account
- Unified addresses require account-based approach

**Advanced Usage:**

```typescript
// Unified address with specific receiver types
const { address } = await client.getAddressForAccount(
  account,
  ['sapling', 'p2pkh'],
  0 // Diversifier index
)
```

**Migration Example:**

```typescript
// Before
const address1 = await client.generateShieldedAddress('sapling')
const address2 = await client.generateShieldedAddress('sapling')

// After
const { account: account1 } = await client.createAccount()
const { address: address1 } = await client.getAddressForAccount(account1)

const { account: account2 } = await client.createAccount()
const { address: address2 } = await client.getAddressForAccount(account2)

// Or reuse same account for multiple addresses
const { account } = await client.createAccount()
const { address: addr1 } = await client.getAddressForAccount(account, undefined, 0)
const { address: addr2 } = await client.getAddressForAccount(account, undefined, 1)
```

## Testing Your Migration

```bash
# Run full test suite
pnpm test -- --run

# Run specific tests
pnpm test -- tests/integration --run

# Type check
pnpm typecheck
```

## Deprecation Timeline

### v0.9.0 (Current)
- Deprecated methods still work, but emit a one-time runtime deprecation warning
- New methods available
- Both APIs supported

### Future major release
- Deprecated methods removed (original removal target: 2026-06-01)
- Only new APIs supported
- **Breaking change**

**Action Required:** Migrate before the next major SDK release

## Need Help?

- **Documentation**: https://docs.sip-protocol.org
- **Issues**: https://github.com/sip-protocol/sip-protocol/issues
- **Discussions**: https://github.com/sip-protocol/sip-protocol/discussions
