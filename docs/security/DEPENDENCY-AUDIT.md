# Dependency Security Audit — docs-sip

| Field | Value |
|-------|-------|
| **Document** | DEP-AUDIT-001 (docs-sip) |
| **Version** | 1.0.0 |
| **Date** | 2026-06-12 |
| **Tool** | GitHub Dependabot · `npm audit` · lockfile chain analysis |
| **Manifest** | `package-lock.json` (root, npm) |
| **Status** | Active |

## Executive Summary

This document records the triage and resolution of the **7 open Dependabot alerts** on
`sip-protocol/docs-sip` as of 2026-06-12. All 7 were **development-scope, transitive**
dependencies in the root `package-lock.json`.

**Outcome: 5 fixed in-tree, 2 recommended for dismissal (both have no upstream patch).**

| Severity | Count | Outcome |
|----------|-------|---------|
| High | 2 | ✅ 1 fixed (`langsmith` #64) · 🔍 1 dismissal recommended (`bigint-buffer` #3 — no patch) |
| Medium | 4 | ✅ All fixed (`langsmith` #61–#63, `uuid` #58) |
| Low | 1 | 🔍 Dismissal recommended (`elliptic` #60 — no patch) |

### Why every alert is development-scope

`docs-sip` is a static documentation site (Astro 6 + Starlight). `@sip-protocol/sdk` is a
**devDependency** consumed exclusively by TypeDoc:

- `scripts/generate-api-docs.mjs` runs `npx typedoc`, whose only entry point is
  `./node_modules/@sip-protocol/sdk/dist/index.d.ts` (see `typedoc.json`).
- TypeDoc reads **type declarations only** — no SDK runtime code executes during the build,
  and none is bundled into the published site.
- Every vulnerable package below sits under the SDK's transitive tree (`@langchain/core`,
  `@solana/web3.js`, `@solana/spl-token`, `@magicblock-labs/ephemeral-rollups-sdk`). None of
  that code is ever invoked by the docs build or served to visitors.

The fixes in this audit therefore close *supply-chain hygiene* gaps (clean `npm audit`,
clean Dependabot dashboard), not live attack surface.

## 1. Disposition at a Glance

| Alert | GHSA | Package | Sev | Vulnerable range | Disposition |
|-------|------|---------|-----|------------------|-------------|
| [#64](https://github.com/sip-protocol/docs-sip/security/dependabot/64) | GHSA-3644-q5cj-c5c7 | langsmith | high | < 0.6.0 | ✅ Fixed — override → **0.6.3** |
| [#63](https://github.com/sip-protocol/docs-sip/security/dependabot/63) | GHSA-rr7j-v2q5-chgv | langsmith | med | <= 0.5.18 | ✅ Fixed — override → **0.6.3** |
| [#62](https://github.com/sip-protocol/docs-sip/security/dependabot/62) | GHSA-fw9q-39r9-c252 | langsmith | med | <= 0.5.17 | ✅ Fixed — override → **0.6.3** |
| [#61](https://github.com/sip-protocol/docs-sip/security/dependabot/61) | GHSA-v34v-rq6j-cj6p | langsmith | med | >= 0.3.41 < 0.4.6 | ✅ Fixed — override → **0.6.3** |
| [#58](https://github.com/sip-protocol/docs-sip/security/dependabot/58) | GHSA-w5hq-g745-h8pq | uuid | med | < 11.1.1 | ✅ Fixed — override → **14.0.0** |
| [#3](https://github.com/sip-protocol/docs-sip/security/dependabot/3) | GHSA-3gc7-fjrx-p6mg | bigint-buffer | high | <= 1.1.5 (no patch) | 🔍 **Recommend dismiss** (`not_used`) — see §4.1 |
| [#60](https://github.com/sip-protocol/docs-sip/security/dependabot/60) | GHSA-848j-6mx2-7j84 | elliptic | low | <= 6.6.1 (no patch) | 🔍 **Recommend dismiss** (`not_used`) — see §4.2 |

## 2. Consumer Chains (pre-fix lockfile)

All chains start at the `@sip-protocol/sdk` devDependency:

```
@sip-protocol/sdk@0.9.0 (devDependency)
├── @langchain/core@0.3.x (nested)
│   ├── langsmith@0.3.87        ← alerts #61 #62 #63 #64 (all 4)
│   └── uuid@10.0.0             ← alert #58
├── @solana/web3.js@1.98.x
│   └── jayson@4.x
│       └── uuid@8.3.2          ← alert #58
├── @solana/spl-token@0.4.x
│   └── @solana/buffer-layout-utils@0.2.x
│       └── bigint-buffer@1.1.5 ← alert #3 (high, no upstream patch)
└── @magicblock-labs/ephemeral-rollups-sdk
    └── @phala/dcap-qvl@0.3.9
        └── elliptic@6.6.1      ← alert #60 (low, no upstream patch)
```

Note: bumping the SDK alone could not clear the langsmith alerts — `@sip-protocol/sdk@0.11.1`
still declares `@langchain/core: ^0.3.30`, whose `langsmith: ^0.3.67` range is capped inside
the vulnerable window. Overrides were required regardless of SDK version.

## 3. Fixes Applied (PR: `fix/dependabot-security-sweep`)

### 3.1 `@sip-protocol/sdk` `^0.9.0` → `^0.11.1`

Routine refresh to the latest published SDK (canonical EIP-5564 release line). Safe here
because the docs build consumes only `dist/index.d.ts` via TypeDoc; the 0.10.x breaking
stealth-API changes do not affect type-doc generation. Side benefit: the generated API
reference (`src/content/docs/reference/`, gitignored, rebuilt on every deploy) now documents
the current SDK instead of 0.9.0 — the post-bump build emits 1,284 pages vs 1,277.

### 3.2 npm `overrides` added to `package.json`

```json
"overrides": {
  "langsmith": "^0.6.0",
  "uuid": "^14.0.0"
}
```

**`langsmith: ^0.6.0`** (clears #61, #62, #63, #64) — resolves to 0.6.3, the first
release line patched against all four advisories (worst fix floor: 0.6.0 for
GHSA-3644-q5cj-c5c7). Global override: the `@langchain/core@1.x` / `langchain@1.x`
consumers declare `>=0.5.0 <1.0.0` (0.6.3 in-range); the nested `@langchain/core@0.3.x`
consumer declares `^0.3.67` and is force-overridden — acceptable because that code path
never executes (TypeDoc reads types only). Matches the core repo's `langsmith: >=0.6.0`
override (sip-protocol DEP-AUDIT-001).

**`uuid: ^14.0.0`** (clears #58) — collapses all uuid instances onto a single patched
14.0.0 node (14.x is the fixed line for GHSA-w5hq-g745-h8pq). Chosen over `^11.1.1`
because the production consumer `mermaid` declares `^11.1.0 || ^12 || ^13 || ^14.0.0`
and already resolved 14.0.0 — this override changes **nothing** for production code.
The force-upgraded dev consumers (`jayson` `^8.3.2`, `@langchain/core` `^10.0.0`) never
execute during the docs build. The advisory itself only affects `v3()/v5()/v6()` calls
with a caller-provided `buf`; these consumers use `v4()` without buffers, so even the
pre-fix exposure was nil — fixed anyway since patched versions resolve cleanly.

### 3.3 Post-fix lockfile census

```
langsmith            → 0.6.3   (3 nodes, all patched)
uuid                 → 14.0.0  (1 node, production, unchanged version)
bigint-buffer        → 1.1.5   (intentionally retained — see §4.1)
elliptic             → 6.6.1   (intentionally retained — see §4.2)
@sip-protocol/sdk    → 0.11.1
@sip-protocol/types  → 0.2.2
```

## 4. Dismissal Recommendations

### 4.1 bigint-buffer (#3, high) — recommend `not_used`

- **Advisory:** GHSA-3gc7-fjrx-p6mg / CVE-2025-3194 — `toBigIntLE()` buffer overflow.
  Impact is **availability only** (application crash; CVSS `C:N/I:N/A:H`) — not memory
  disclosure or code execution.
- **No fix exists:** every released version (<= 1.1.5) is affected;
  `first_patched_version: null`.
- **Reachability:** consumed via `@solana/spl-token → @solana/buffer-layout-utils`,
  where it decodes u64 token amounts when **parsing Solana account data at runtime**.
  The docs build never executes any Solana code path — `@sip-protocol/sdk` is consumed
  exclusively by TypeDoc as type declarations (see Executive Summary). No input of any kind, let alone
  attacker-controlled input, ever reaches `toBigIntLE()` in this repository.
- **Fix path tested and rejected:** the community fork alias
  (`"bigint-buffer": "npm:bigint-buffer-fixed@^1.1.6"`, as used in the core repo's pnpm
  overrides) was applied and verified during this sweep, then **reverted**: the fork
  declares `node-gyp@^9.4.1` as a *runtime* dependency, which dragged
  `node-gyp@9.4.1`, `tar@6.2.1`, `cacache@16.1.3`, and `make-fetch-happen@10.2.1` into
  the lockfile — four packages currently carrying **high-severity advisories** of their
  own (including the node-tar hardlink/symlink path-traversal set affecting `<= 7.5.10`),
  and node-gyp *does* execute during every `npm ci` via the fork's install script.
  Trading one unreachable HIGH for four new HIGHs (one of which runs at install time)
  is net-negative; dismissal is the honest disposition.
- **Precedent:** `sip-protocol/sip-protocol` adopted the fork alias when its tar/node-gyp
  chain was still clean; with the newer node-tar advisories that trade-off no longer holds
  for a fresh lockfile.

### 4.2 elliptic (#60, low) — recommend `not_used`

- **Advisory:** GHSA-848j-6mx2-7j84 / CVE-2025-14505 — ECDSA **signature generation**
  produces faulty signatures when an interim RFC 6979 `k` value has leading zeros;
  paired faulty+correct signatures over the same input can leak the signing key.
- **No fix exists:** every released version (<= 6.6.1) is affected;
  `first_patched_version: null`. There is no upgrade or fork to move to.
- **Reachability:** sole consumer is `@phala/dcap-qvl` (Intel SGX/TDX DCAP quote
  verification, via `@magicblock-labs/ephemeral-rollups-sdk` — still present in the
  SDK 0.11.1 tree). Quote verification **verifies** ECDSA signatures over supplied
  quotes — it never **signs**, so the vulnerable signing path is unreachable and no
  private key exists in this process to leak. And as with §4.1, none of this code
  executes in the docs build at all.
- **Precedent:** `sip-protocol/sip-protocol` dismissed this same advisory as `not_used`
  in its 2026-06-06 audit (core DEP-AUDIT-001 §2.2) on identical verify-only reasoning.

Both dismissals are reversible at any time via the Dependabot UI or API if patched
releases ever appear.

## 5. Verification

| Gate | Before (SDK 0.9.0) | After (SDK 0.11.1 + overrides) |
|------|--------------------|--------------------------------|
| Fresh `npm ci` (npm 10) | ✅ pass | ✅ pass |
| `npm run build` (TypeDoc + Astro) | ✅ pass (1,277 pages) | ✅ pass (1,284 pages) |
| Vulnerable langsmith/uuid nodes | 3 (0.3.87, 8.3.2, 10.0.0) | **0** |
| Unpatchable nodes retained | bigint-buffer 1.1.5 · elliptic 6.6.1 | same (dismissal recommended) |

### Lockfile maintenance policy (important)

CI (`docs-validate.yml`, `deploy.yml`) runs `npm ci` on **Node 22 / npm 10**. npm 11
(bundled with Node 24) omits optional-dependency lockfile nodes that npm 10's `npm ci`
requires, producing `Missing X from lock file` failures. **Always regenerate
`package-lock.json` with `npx -y npm@10 install`** and avoid running lockfile-mutating
npm 11 commands afterwards.

---

*Maintained alongside Dependabot. Update this document whenever alerts are fixed,
dismissed, or newly triaged.*
