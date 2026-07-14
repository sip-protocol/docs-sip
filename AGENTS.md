<!-- Satellite context file — extends the global hub (~/.claude/CLAUDE.md | ~/.pi/agent/AGENTS.md). Host-neutral; project-specific only. Do not duplicate hub standards here. -->

# SIP Documentation

> Official documentation website for SIP Protocol, built with Astro Starlight.

**Ecosystem hub:** See [sip-protocol/sip-protocol/AGENTS.md](https://github.com/sip-protocol/sip-protocol/blob/main/AGENTS.md) for full ecosystem context.

**Status:** M17 Complete | M18 Active (Ethereum Same-Chain). SDK version 0.11.1 — ensure docs reference current version.

## Quick Reference

**Tech Stack:** Astro 6, Starlight, MDX
**Deployment:** docs.sip-protocol.org (Vercel — Git auto-deploy; migrated off VPS 2026-05-31)

```bash
npm install
npm run dev        # Dev server (localhost:4321)
npm run build      # Build for production
npm run preview    # Preview build
```

## Key Files

| Path | Description |
|------|-------------|
| `src/content/docs/` | Documentation pages (MDX) |
| `src/content/config.ts` | Content collections config |
| `astro.config.mjs` | Astro + Starlight configuration |
| `src/styles/` | Custom styles |
| `src/assets/` | Images and assets |

## Content Structure

```
src/content/docs/
├── index.mdx           # Home page
├── getting-started/    # Quickstart guides
├── concepts/           # Core concepts (privacy, stealth, etc.)
├── sdk/                # SDK reference
├── api/                # API documentation
├── specs/              # ZK proof specifications
├── guides/             # How-to guides
├── comparisons/        # Privacy approach comparisons
└── apps/               # sip-app documentation (payments/, wallet/, dex/)
```

**Note:** Application documentation for `app.sip-protocol.org` lives here. The sip-app repo contains the code; this repo documents usage.

## Phase 4 Documentation Priorities

- **M16 (Narrative Capture):** cryptographic privacy vs pool mixing explainer, PrivacyCash comparison, compliance/viewing keys, same-chain architecture diagrams
- **M17 (Solana Same-Chain):** Solana same-chain SDK guide, Jupiter DEX integration, Mobile (React Native) SDK, same-chain examples

## SENTINEL Mirror

Source of truth: `sip-protocol/sipher` repo at `docs/sentinel/*.md`. Files in `src/content/docs/sipher/sentinel/*.mdx` are hand-synced mirrors.

**When the source changes, apply these six transforms:**
1. Prepend `--- title / description ---` frontmatter
2. Strip the source's leading `# H1` (NOT the `# …` lines inside ` ```bash ` code fences — those are shell comments)
3. GitHub admonitions → Starlight directives: `[!WARNING]`→`:::caution`, `[!NOTE]`→`:::note`, `[!IMPORTANT]`→`:::tip`, `[!CAUTION]`→`:::danger`
4. Internal cross-links: `./xxx.md` → `/sipher/sentinel/xxx/` (anchors carry over)
5. Source-code refs: `` `packages/agent/src/...` `` → absolute GitHub URL with `#LN` / `#L<N>-L<M>` suffix
6. Update banner's `Last synced: YYYY-MM-DD` to today

After sync, run `pnpm build` and verify Starlight compiles. Spec: `sipher/docs/superpowers/specs/2026-05-04-sentinel-docs-mirror-design.md`.

## Repo-Specific Guidelines

**DO:** use MDX for interactive docs; include code examples w/ syntax highlighting; keep nav shallow; emphasize SIP's cryptographic advantages.
**DON'T:** duplicate SDK JSDoc; add custom components without need; make claims without technical backing.

## Competitive Documentation

- **vs Pool Mixing (PrivacyCash):** fixed amounts, correlation attacks, no compliance
- **vs MPC (Arcium):** setup assumptions, trust requirements, key management
- Focus on: any amount hidden, mathematical guarantees, viewing keys for auditors