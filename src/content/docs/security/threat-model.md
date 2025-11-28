---
title: Threat Model
description: Security threat model for SIP Protocol
---

# Threat Model

This document describes the threat model for SIP Protocol, defining adversary capabilities, trust assumptions, and security boundaries.

## Adversary Model

### Adversary Capabilities

We assume a computationally bounded adversary who can:

**Network Level**
- Observe all network traffic (global passive adversary)
- Perform timing analysis on transaction submission
- Correlate transactions across chains by timing
- Run malicious nodes on supported networks

**Blockchain Level**
- Read all public blockchain data
- Submit arbitrary transactions
- Front-run transactions (MEV)
- Analyze transaction graphs

**Application Level**
- Interact with SIP SDK as a legitimate user
- Attempt to link stealth addresses
- Try to determine hidden amounts
- Submit malformed proofs

### Adversary Limitations

The adversary CANNOT:

1. Break standard cryptographic assumptions (ECDLP, SHA-256)
2. Compromise user devices or extract private keys
3. Perform quantum attacks
4. Compromise majority of solver network
5. Control blockchain consensus (51% attacks)

## Trust Assumptions

### Trusted Components

| Component | Trust Level | Justification |
|-----------|-------------|---------------|
| @noble/curves | High | Audited, constant-time |
| secp256k1 curve | High | 20+ years analysis |
| User's device | Required | Local key storage |
| OS CSPRNG | High | Well-audited |

### Semi-Trusted Components

| Component | Trust Level | Notes |
|-----------|-------------|-------|
| Solvers | Semi-trusted | See metadata, cannot steal |
| NEAR chain | Semi-trusted | Liveness, not privacy |
| RPC providers | Low trust | Only see public data |

### Untrusted Components

| Component | Notes |
|-----------|-------|
| Other users | Adversarial by default |
| Public mempool | Fully observed |
| Block explorers | Correlate everything |

## Security Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                    User's Device                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                Private Key Storage                       ││
│  │  - Spending private key (MUST never leave)              ││
│  │  - Viewing private key (selective sharing)              ││
│  │  - Blinding factors (kept until reveal)                 ││
│  └─────────────────────────────────────────────────────────┘│
│                           │                                  │
│                     SDK Operations                           │
│  - Key generation         - Proof generation                │
│  - Commitment creation    - Stealth address derivation      │
│  - Intent building        - Address scanning                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (Only public data crosses)
┌─────────────────────────────────────────────────────────────┐
│                    Public Network                            │
│  - Commitments (hiding amounts)                             │
│  - Stealth addresses (unlinkable)                           │
│  - Ephemeral public keys (for scanning)                     │
│  - ZK proofs (reveal nothing beyond validity)               │
└─────────────────────────────────────────────────────────────┘
```

## Data Classification

| Data Type | Classification | Exposure |
|-----------|---------------|----------|
| Spending private key | SECRET | Never |
| Viewing private key | CONFIDENTIAL | Selective |
| Blinding factors | SECRET | Never (until opening) |
| Transaction amounts | CONFIDENTIAL | Hidden in commitments |
| Sender identity | CONFIDENTIAL | Hidden via stealth |
| Recipient identity | CONFIDENTIAL | Unlinkable stealth |
| Intent parameters | PUBLIC | Output requirements |
| ZK proofs | PUBLIC | Verifiable by anyone |
| Commitments | PUBLIC | Computationally hiding |

## Threat Categories

### Privacy Threats

| Threat | Mitigation | Residual Risk |
|--------|------------|---------------|
| Amount disclosure | Pedersen commitments | None |
| Sender linkability | Stealth addresses | Low (view tag) |
| Recipient linkability | One-time addresses | None |
| Transaction graph | Commitments + stealth | Medium (timing) |

### Integrity Threats

| Threat | Mitigation | Residual Risk |
|--------|------------|---------------|
| Forged proofs | ZK verification | None |
| Double spending | On-chain enforcement | None |
| Amount manipulation | Commitment binding | None |
| Key substitution | User verification | Low |

### Availability Threats

| Threat | Mitigation | Residual Risk |
|--------|------------|---------------|
| Solver unavailability | Multiple solvers | Medium |
| Network congestion | Timeout/retry | Low |
| DoS on proof gen | Resource limits | Medium |

### Implementation Threats

| Threat | Mitigation | Residual Risk |
|--------|------------|---------------|
| Side-channel attacks | Constant-time ops | Low |
| RNG failure | OS CSPRNG | Low |
| Memory disclosure | `secureWipe()` + `withSecureBuffer()` | Low |
| Integer overflow | BigInt arithmetic | None |

## Attack Scenarios

### Scenario 1: Passive Observer

**Goal**: Link sender to recipient
**Method**: Monitor transactions, analyze timing
**Defense**: Stealth addresses generate fresh one-time addresses
**Result**: Observer sees unrelated addresses

### Scenario 2: Malicious Solver

**Goal**: Steal funds or extract private data
**Method**: Accept intent but not fulfill
**Defense**: Proofs verify without revealing, escrow protects funds
**Result**: Can DoS but cannot steal or learn

### Scenario 3: Blockchain Analyst

**Goal**: Determine transaction amounts
**Method**: Analyze commitments, look for patterns
**Defense**: Random blinding factors
**Result**: All commitments look random

## Out of Scope

The following threats are explicitly OUT OF SCOPE:

1. **Endpoint Security** - Malware, keyloggers, screen capture
2. **Social Engineering** - Phishing, scams
3. **Economic Attacks** - Market manipulation, flash loans
4. **Network Attacks** - Sybil, eclipse, BGP hijacking
5. **Quantum Threats** - Shor's, Grover's algorithms

## Recommendations

### For Users

1. Generate keys on secure devices
2. Verify addresses out-of-band
3. Use fresh stealth addresses per transaction
4. Don't reuse blinding factors

### For Integrators

1. Never log private keys or blinding factors
2. Implement proper session management
3. Use secure random number generation
4. Clear sensitive data from memory

### For Auditors

1. Focus on key generation and handling
2. Verify constant-time operations
3. Check blinding factor generation
4. Audit proof verification logic
