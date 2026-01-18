---
title: Proof Composition API
description: Complete API reference for SIP Protocol's ZK proof generation system
---

SIP Protocol provides a pluggable proof system for generating zero-knowledge proofs that hide transaction details while maintaining verifiability. This reference documents all proof providers, types, and configuration options.

## Overview

The proof system supports three proof types:

| Proof Type | Purpose | Constraints |
|------------|---------|-------------|
| **Funding Proof** | Proves balance >= minimum without revealing balance | ~2,000 |
| **Validity Proof** | Proves intent authorization without revealing sender | ~72,000 |
| **Fulfillment Proof** | Proves solver delivered output correctly | ~22,000 |

## Providers

### ProofProvider Interface

All proof providers implement this interface:

```typescript
interface ProofProvider {
  readonly framework: ProofFramework  // 'noir' | 'mock'
  readonly isReady: boolean

  initialize(): Promise<void>
  waitUntilReady(timeoutMs?: number): Promise<void>

  generateFundingProof(params: FundingProofParams): Promise<ProofResult>
  generateValidityProof(params: ValidityProofParams): Promise<ProofResult>
  generateFulfillmentProof(params: FulfillmentProofParams): Promise<ProofResult>

  verifyProof(proof: ZKProof): Promise<boolean>
}
```

### NoirProofProvider

Production provider using Noir circuits with Barretenberg backend.

```typescript
import { NoirProofProvider } from '@sip-protocol/sdk/proofs/noir'

const provider = new NoirProofProvider({
  verbose: true,
  oraclePublicKey: {
    x: [...], // 32-byte array
    y: [...], // 32-byte array
  },
  strictMode: true,
})

await provider.initialize()
```

#### Configuration

```typescript
interface NoirProviderConfig {
  /** Path to compiled circuit artifacts (optional) */
  artifactsPath?: string

  /** Enable verbose logging */
  verbose?: boolean

  /** Oracle public key for fulfillment proofs */
  oraclePublicKey?: PublicKeyCoordinates

  /** Enforce configuration requirements */
  strictMode?: boolean
}
```

#### Static Methods

```typescript
// Derive public key from private key
const pubKey = NoirProofProvider.derivePublicKey(privateKeyBytes)
// Returns: { x: number[], y: number[] }
```

### BrowserNoirProvider

Browser-compatible provider with WASM and Web Worker support.

```typescript
import { BrowserNoirProvider } from '@sip-protocol/sdk/browser'

const provider = new BrowserNoirProvider({
  useWorker: true,
  timeout: 60000,
  mobileMode: false,
})

await provider.initialize((progress) => {
  console.log(`${progress.stage}: ${progress.percent}%`)
})
```

#### Configuration

```typescript
interface BrowserNoirProviderConfig {
  /** Use Web Workers for non-blocking proof generation */
  useWorker?: boolean  // default: true

  /** Enable verbose logging */
  verbose?: boolean

  /** Oracle public key for fulfillment proofs */
  oraclePublicKey?: PublicKeyCoordinates

  /** Proof generation timeout in ms */
  timeout?: number  // default: 60000 (mobile: 120000)

  /** Enable mobile-optimized mode (auto-detected) */
  mobileMode?: boolean

  /** Allow initialization with poor compatibility */
  forceInitialize?: boolean
}
```

#### Static Methods

```typescript
// Check browser support
const { supported, missing } = BrowserNoirProvider.checkBrowserSupport()

// Get browser info
const info = BrowserNoirProvider.getBrowserInfo()

// Check mobile compatibility
const compat = BrowserNoirProvider.checkMobileCompatibility()
// Returns: { score: number, issues: string[], sharedArrayBuffer: boolean, ... }

// Get recommended config for device
const config = BrowserNoirProvider.getRecommendedConfig()
```

#### Progress Callback

```typescript
type ProofProgressCallback = (progress: {
  stage: 'initializing' | 'witness' | 'proving' | 'verifying' | 'complete'
  percent: number
  message: string
}) => void
```

### MockProofProvider

Testing provider that generates deterministic fake proofs.

```typescript
import { MockProofProvider } from '@sip-protocol/sdk'

const provider = new MockProofProvider({ silent: true })
await provider.initialize()

// Check if a proof is mock
const isMock = MockProofProvider.isMockProof(proof)
```

> **Warning**: Mock proofs provide NO cryptographic security. Use only for testing.

### ComplianceProofProvider

Generates ZK proofs for regulatory compliance without revealing sensitive data.

```typescript
import { ComplianceProofProvider } from '@sip-protocol/sdk'

const provider = new ComplianceProofProvider({
  defaultValidityPeriod: 86400, // 24 hours
  jurisdictions: ['US', 'EU', 'UK'],
})

await provider.initialize()
```

#### Compliance Proof Types

```typescript
type ComplianceProofType =
  | 'viewing_key_access'   // Prove viewing key can decrypt transaction
  | 'sanctions_clear'      // Prove no sanctions list matches
  | 'balance_attestation'  // Prove balance meets requirement
  | 'history_complete'     // Prove complete transaction history
```

#### Viewing Key Access Proof

```typescript
const result = await provider.generateViewingKeyAccessProof({
  viewingKey: myViewingKey,
  transactionHash: '0x...',
  encryptedData: new Uint8Array([...]),
  auditorPublicKey: '0x...',
  timestamp: Date.now(),
  chainId: 'solana',  // optional
})
```

#### Sanctions Clearance Proof

```typescript
const result = await provider.generateSanctionsClearProof({
  senderAddress: '0x...',
  recipientAddress: '0x...',
  senderBlinding: randomBytes(32),
  recipientBlinding: randomBytes(32),
  sanctionsListRoot: '0x...',
  checkTimestamp: Date.now(),
  jurisdiction: 'US',
})
```

#### Balance Attestation Proof

```typescript
const result = await provider.generateBalanceAttestationProof({
  balance: 1000000n,
  blindingFactor: randomBytes(32),
  minimumRequired: 500000n,
  assetId: 'SOL',
  accountCommitment: '0x...',
  attestationTime: Date.now(),
})
```

#### History Completeness Proof

```typescript
const result = await provider.generateHistoryCompletenessProof({
  transactionCount: 42,
  historyMerkleRoot: '0x...',
  startTimestamp: startOfYear,
  endTimestamp: Date.now(),
  volumeCommitment: '0x...',
  viewingKey: myViewingKey,
})
```

## Proof Parameters

### FundingProofParams

```typescript
interface FundingProofParams {
  /** User's actual balance (private) */
  balance: bigint
  /** Minimum amount required (public) */
  minimumRequired: bigint
  /** Blinding factor for commitment (private) */
  blindingFactor: Uint8Array
  /** Asset identifier (public) */
  assetId: string
  /** User's address (private) */
  userAddress: string
  /** Signature proving ownership (private) */
  ownershipSignature: Uint8Array
}
```

### ValidityProofParams

```typescript
interface ValidityProofParams {
  /** Hash of the intent (public) */
  intentHash: HexString
  /** Sender's address (private) */
  senderAddress: string
  /** Blinding factor for sender commitment (private) */
  senderBlinding: Uint8Array
  /** Sender's secret key (private) */
  senderSecret: Uint8Array
  /** Signature authorizing the intent (private) */
  authorizationSignature: Uint8Array
  /** Nonce for nullifier generation (private) */
  nonce: Uint8Array
  /** Intent timestamp (public) */
  timestamp: number
  /** Intent expiry (public) */
  expiry: number
  /** Optional: Pre-computed sender public key */
  senderPublicKey?: PublicKeyXY
}
```

### FulfillmentProofParams

```typescript
interface FulfillmentProofParams {
  /** Hash of the original intent (public) */
  intentHash: HexString
  /** Actual output amount delivered (private) */
  outputAmount: bigint
  /** Blinding factor for output commitment (private) */
  outputBlinding: Uint8Array
  /** Minimum required output (public) */
  minOutputAmount: bigint
  /** Recipient's stealth address (public) */
  recipientStealth: HexString
  /** Solver's identifier (public) */
  solverId: string
  /** Solver's secret (private) */
  solverSecret: Uint8Array
  /** Oracle attestation of delivery (private) */
  oracleAttestation: OracleAttestation
  /** Time of fulfillment (public) */
  fulfillmentTime: number
  /** Intent expiry (public) */
  expiry: number
}

interface OracleAttestation {
  recipient: HexString
  amount: bigint
  txHash: HexString
  blockNumber: bigint
  signature: Uint8Array
}
```

## Proof Result

```typescript
interface ProofResult {
  /** The generated ZK proof */
  proof: ZKProof
  /** Public inputs used in the proof */
  publicInputs: HexString[]
  /** Commitment (if generated) */
  commitment?: Commitment
}

interface ZKProof {
  type: 'funding' | 'validity' | 'fulfillment'
  proof: HexString
  publicInputs: HexString[]
}
```

## Error Handling

```typescript
import { ProofGenerationError, ProofError, ErrorCode } from '@sip-protocol/sdk'

try {
  await provider.generateFundingProof(params)
} catch (error) {
  if (error instanceof ProofGenerationError) {
    console.log(error.proofType)  // 'funding' | 'validity' | 'fulfillment'
    console.log(error.cause)      // Original error
  }
  if (error instanceof ProofError) {
    console.log(error.code)       // ErrorCode enum
  }
}
```

### Error Codes

```typescript
enum ErrorCode {
  PROOF_PROVIDER_NOT_READY = 'PROOF_PROVIDER_NOT_READY',
  PROOF_NOT_IMPLEMENTED = 'PROOF_NOT_IMPLEMENTED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  // ... other codes
}
```

## Browser Utilities

```typescript
import {
  isBrowser,
  supportsWebWorkers,
  supportsSharedArrayBuffer,
  getBrowserInfo,
  hexToBytes,
  bytesToHex,
} from '@sip-protocol/sdk'
```

## Constants

```typescript
import {
  DEFAULT_VALIDITY_PERIOD_SECONDS,  // 86400 (24 hours)
  SUPPORTED_JURISDICTIONS,          // ['US', 'EU', 'UK', 'SG', 'CH', 'GLOBAL']
  COMPLIANCE_CIRCUIT_IDS,           // { viewing_key_access: '...', ... }
} from '@sip-protocol/sdk'
```

## Usage with SIP Client

```typescript
import { SIP } from '@sip-protocol/sdk'
import { NoirProofProvider } from '@sip-protocol/sdk/proofs/noir'

const proofProvider = new NoirProofProvider()
await proofProvider.initialize()

const sip = new SIP({
  network: 'mainnet',
  proofProvider,
})
```

## Server-Side Rendering (SSR)

For Next.js and other SSR frameworks, use MockProofProvider as a placeholder:

```typescript
// Server-side (no WASM)
const provider = new MockProofProvider({ silent: true })

// Client-side hydration
if (typeof window !== 'undefined') {
  const { BrowserNoirProvider } = await import('@sip-protocol/sdk/browser')
  const realProvider = new BrowserNoirProvider()
  await realProvider.initialize()
}
```

## See Also

- [ZK Architecture](/specs/zk-architecture) - Design decisions
- [Funding Proof Spec](/specs/funding-proof) - Detailed specification
- [Validity Proof Spec](/specs/validity-proof) - Detailed specification
- [Fulfillment Proof Spec](/specs/fulfillment-proof) - Detailed specification
