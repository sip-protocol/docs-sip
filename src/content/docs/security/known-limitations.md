---
title: Known Limitations
description: Current limitations and planned mitigations
---

# Known Limitations

This document describes the current limitations of SIP Protocol and planned mitigations.

## Privacy Limitations

### Timing Correlation

**Issue**: Transactions submitted close in time may be correlated by observers.

**Impact**: Medium - Reduces anonymity set size

**Current Mitigations** (shipped):
- Stealth addresses provide unlinkable one-time addresses
- View tags add scanning obfuscation (8-bit prefix)
- Commitments hide amounts regardless of timing

**Planned Mitigations**:
- Randomized submission delays
- Transaction batching across users
- Decoy transactions (research)

**Recommendation**: Don't submit multiple related transactions in rapid succession. Use shielded mode for sensitive transactions.

### Amount Inference from Output

**Issue**: When output amount is public (for quoting), the input amount may be inferable via market rates.

**Impact**: Low-Medium - Partial information leakage

**Mitigation**:
- Output range commitments (future)
- Decoy amounts (not implemented)

**Recommendation**: Use SHIELDED mode when exact amounts are sensitive.

### View Tag Information Leakage

**Issue**: The 8-bit view tag reveals some information about shared secret.

**Impact**: Low - Only 8 bits, insufficient for linkability

**Mitigation**: Accepted tradeoff for 256x scanning improvement.

**Recommendation**: None needed - acceptable privacy cost.

### Cross-Chain Timing Analysis

**Issue**: Source and destination chain transactions may be correlated by timing.

**Impact**: Medium - Especially for low-traffic chains

**Mitigation**:
- Random delays (not implemented)
- Batched settlement (future)

**Recommendation**: Avoid immediate swaps for high-value privacy needs.

## Implementation Limitations

### Proof Provider Selection

**Issue**: The SDK ships both a `MockProofProvider` (development/testing) and production-grade Noir providers. Selecting the mock provider in a production deployment provides no cryptographic soundness.

**Impact**: High if misconfigured - The mock provider is for tests only

**Status**: Real ZK proofs are shipped. `NoirProofProvider` (`@sip-protocol/sdk/proofs/noir`) and `BrowserNoirProvider` (`@sip-protocol/sdk/browser`) generate UltraHonk proofs via Barretenberg. Use these for production.

**Recommendation**: Use `NoirProofProvider` / `BrowserNoirProvider` in production; the mock provider is restricted to tests and local development.

### Memory Safety

**Issue**: JavaScript cannot guarantee secure memory clearing at the VM level.

**Impact**: Low - Mitigated by SDK implementation

**Current Implementation** (shipped):
- `secureWipe()` - Zeroizes Uint8Array buffers immediately after use
- `withSecureBuffer()` - Auto-cleanup wrapper with guaranteed cleanup
- `withSecureBufferSync()` - Synchronous version for non-async code
- All stealth key operations use secure memory patterns

**Remaining Limitations**:
- JavaScript strings cannot be securely wiped (use Uint8Array for secrets)
- Garbage collection timing is non-deterministic
- Memory may be swapped to disk by OS

**Recommendation**: Use hardware wallets for high-value operations. SDK handles memory cleanup for cryptographic operations.

### Hardware Wallet Support

**Issue**: High-value users need keys held in dedicated hardware.

**Impact**: Low - Hardware wallet signing is supported

**Status**: Shipped in M15 - Ledger and Trezor signing plus WalletConnect are supported.

**Recommendation**: Use a hardware wallet for high-value operations.

## Cryptographic Limitations

### Quantum Vulnerability

**Issue**: secp256k1 is vulnerable to Shor's algorithm.

**Impact**: Long-term - Not immediate threat (10-20+ years estimated)

**Current Status**:
- Actively monitoring NIST post-quantum standardization
- Evaluating lattice-based alternatives (CRYSTALS-Dilithium, Kyber)
- SDK architecture designed for curve agility

**Long-term Roadmap** (Post-v1.0):
- Support for post-quantum signature schemes when standardized
- Hybrid classical/post-quantum mode for transition period
- Migration tooling for existing stealth addresses

**Recommendation**: Monitor quantum computing developments. Current cryptographic assumptions remain secure for foreseeable future. Plan for migration post-NIST standardization.

### No Trusted Setup

**Issue**: Some proving systems require a trusted setup ceremony, which adds a trust assumption.

**Impact**: None - SIP avoids this class of risk

**Status**: SIP's Noir circuits compile to UltraHonk (Barretenberg), which uses a universal/updatable setup and requires no circuit-specific trusted setup ceremony.

### Fixed Generator Construction

**Issue**: NUMS generator H is deterministically derived.

**Impact**: None - This is correct behavior

**Note**: Generator H derivation is verifiable and secure.

## Protocol Limitations

### No Partial Fills

**Issue**: Intents must be filled completely or not at all.

**Impact**: Low - May reduce quote availability

**Status**: Partial fill support planned

**Recommendation**: Use smaller amounts for better fill rates.

### Limited Chain Support

**Issue**: Not all chains are supported equally.

**Supported**: Ethereum, Solana, NEAR, Zcash
**Limited**: Polygon, Arbitrum (via NEAR Intents)
**Not supported**: Bitcoin (limited functionality)

**Status**: Chain support expanding

### Single Auditor per Compliant Intent

**Issue**: COMPLIANT mode supports one designated auditor per intent.

**Impact**: Low - Most use cases have single auditor

**Mitigation**: Multi-key encryption supports multiple viewers

### On-Chain Verification Coverage

**Issue**: On-chain verification currently covers the funding proof; other proof types are verified off-chain by solvers.

**Impact**: Low-Medium - Funding proofs are verified on-chain; remaining proof types rely on solver verification

**Status**: An on-chain `FundingVerifier` (UltraHonk `HonkVerifier`) is deployed on Sepolia and Arbitrum Sepolia testnets. On-chain verification for the remaining proof types is in progress.

## Operational Limitations

### No Key Recovery

**Issue**: Lost private keys cannot be recovered.

**Impact**: High - Permanent fund loss possible

**Mitigation**: User must backup keys

**Recommendation**: Implement proper key backup procedures.

### Irreversible Transactions

**Issue**: Shielded transactions cannot be reversed.

**Impact**: Standard for blockchain - Not SIP-specific

**Recommendation**: Verify all details before confirming.

### Viewing Key Revocation Doesn't Hide Past

**Issue**: Revoking viewing key doesn't un-reveal previously viewed data.

**Impact**: Medium - Permanent disclosure once shared

**Recommendation**: Use Transaction Viewing Keys for minimal exposure.

## Performance Limitations

### Browser Proof Generation Performance

**Issue**: Proof generation in the browser is computationally intensive and can take a few seconds.

**Status**: Shipped - `BrowserNoirProvider` (`@sip-protocol/sdk/browser`) generates UltraHonk proofs client-side.

**Expected**: ~2-5 seconds per proof depending on device

**Mitigation**:
- Web Workers for non-blocking
- Progress indicators
- Server-side option for performance-sensitive apps

### Scanning Efficiency

**Issue**: Scanning for stealth addresses scales linearly with transactions.

**Impact**: Medium for high-volume recipients

**Mitigation**:
- View tags reduce work by 256x
- Background scanning (async)
- Incremental scanning from last known block

## Summary Table

| Limitation | Severity | Status | Notes |
|------------|----------|--------|-------|
| Proof provider misconfiguration | High | Mitigated | Real Noir/UltraHonk providers shipped; mock is test-only |
| Timing correlation | Medium | Mitigated | Stealth + commitments shipped; batching/delays planned |
| Amount inference | Medium | Planned | Output range commitments future |
| Memory safety | Low | Implemented | `secureWipe()` / `withSecureBuffer()` shipped |
| Hardware wallets | Low | Implemented | Ledger / Trezor / WalletConnect (M15) |
| Quantum vulnerability | Low (long-term) | Monitoring | Post-NIST standardization |
| Partial fills | Low | Planned | — |
| On-chain verification | Low-Medium | Partial | FundingVerifier deployed (Sepolia, Arbitrum Sepolia); other proofs in progress |

## Reporting Issues

If you discover additional limitations or security issues:

1. **Security issues**: Email security@sip-protocol.org
2. **General issues**: GitHub Issues
3. **Discussions**: GitHub Discussions
