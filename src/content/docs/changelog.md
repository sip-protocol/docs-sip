---
title: Changelog
description: Release history for SIP Protocol SDK
---


All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- External security audit
- Proof composition research (M16)

## [0.6.0] - 2025-12-04

### Added - M15 Application Layer
- Universal wallet adapter with multi-wallet session management
- Hardware wallet support (Ledger, Trezor)
- WalletConnect v2 integration
- Social recovery system

### Added - M14 Developer Experience
- `@sip-protocol/react` package with hooks (useSIP, useStealthAddress, usePrivateSwap, useViewingKey)
- `@sip-protocol/cli` package with commands (generate, verify, quote, swap)
- `@sip-protocol/api` package with REST API and OpenAPI spec
- 157 new tests (React: 57, CLI: 33, API: 67)

### Added - M13 Compliance Layer
- Selective disclosure viewing keys
- Audit trail generation
- Compliance proof system
- Regulatory reporting helpers

## [0.5.0] - 2025-12-01

### Added - M12 Multi-Chain
- Bitcoin Silent Payments (BIP-352)
- Cosmos IBC stealth addresses
- Aptos address derivation
- Sui address derivation
- Support for 15+ chains

### Added - M11 Multi-Settlement
- SettlementBackend interface
- SmartRouter implementation
- 3 settlement backends (NEAR Intents, Zcash, Direct Chain)

### Added - M10 ZK Production
- Noir circuits wired to SDK
- WASM browser proving
- Web Worker proof generation
- BrowserNoirProvider implementation

### Added - M9 Stable Core
- 100% passing test suite
- CI/CD validation pipeline
- Zcash swap integration

## [0.1.0] - 2025-11-27

### Added
- Initial release of SIP Protocol SDK
- Stealth address generation (EIP-5564 style)
- Pedersen commitments with homomorphic properties
- Viewing keys for selective disclosure
- Privacy levels: transparent, shielded, compliant
- NEAR Intents adapter integration
- Zcash RPC client with shielded transaction support
- Wallet adapters (abstract interface + Solana/Ethereum)
- Comprehensive test suite
- ZK proof specifications and mock implementations

### Security
- Implemented cryptographic primitives using @noble/curves
- Added input validation at all system boundaries
- Secure random number generation for blinding factors

---

## Deprecation Policy

Methods marked as deprecated will:
1. Display console warnings when called
2. Continue to function normally in current version
3. Be removed in the next minor version (v0.2.0)
4. Have migration paths documented in `docs/API-MIGRATION.md`

**Removal Timeline:**
- **v0.1.x**: Deprecated methods work with warnings
- **v0.2.0**: Deprecated methods removed (breaking change)

For migration guidance, see [API Migration Guide](docs/API-MIGRATION.md).

---

## Links

- [GitHub Releases](https://github.com/sip-protocol/sip-protocol/releases)
- [npm Package](https://www.npmjs.com/package/@sip-protocol/sdk)
- [Roadmap](/roadmap/)
