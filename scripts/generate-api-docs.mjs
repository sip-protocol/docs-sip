#!/usr/bin/env node

/**
 * Generate API documentation from @sip-protocol/sdk
 *
 * This script:
 * 1. Ensures the latest SDK is installed
 * 2. Runs TypeDoc to generate markdown docs
 * 3. Adds Astro frontmatter to all generated files
 * 4. Creates an index page for the reference section
 */

import { execSync } from 'child_process'
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs'
import { dirname, join, basename } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const referenceDir = join(rootDir, 'src/content/docs/reference')

console.log('📚 Generating API documentation...\n')

// Step 1: Update SDK to latest version
console.log('1️⃣  Updating @sip-protocol/sdk to latest...')
try {
  execSync('npm update @sip-protocol/sdk @sip-protocol/types', {
    cwd: rootDir,
    stdio: 'inherit'
  })
} catch (error) {
  console.warn('⚠️  Could not update SDK, using installed version')
}

// Step 2: Ensure reference directory exists
if (!existsSync(referenceDir)) {
  mkdirSync(referenceDir, { recursive: true })
}

// Step 3: Run TypeDoc
console.log('\n2️⃣  Running TypeDoc...')
try {
  execSync('npx typedoc', {
    cwd: rootDir,
    stdio: 'inherit'
  })
} catch (error) {
  console.error('❌ TypeDoc failed:', error.message)
  process.exit(1)
}

// Step 4: Add Astro frontmatter to all generated markdown files
console.log('\n3️⃣  Adding Astro frontmatter to generated files...')

function extractTitle(content, filename) {
  // Try to extract title from first heading
  const headingMatch = content.match(/^#\s+(?:Class:|Interface:|Type Alias:|Function:|Enumeration:|Variable:)?\s*(.+)$/m)
  let title
  if (headingMatch) {
    title = headingMatch[1].trim()
  } else {
    // Fallback: use filename
    title = basename(filename, '.md')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
  }

  // Sanitize for YAML frontmatter:
  // - Remove backslash escapes (e.g., \<T\> -> <T>)
  // - Escape quotes
  // - Remove problematic characters
  title = title
    .replace(/\\</g, '<')
    .replace(/\\>/g, '>')
    .replace(/"/g, '\\"')
    .replace(/`/g, '')

  return title
}

function addFrontmatter(filePath) {
  const content = readFileSync(filePath, 'utf-8')

  // Skip if already has frontmatter
  if (content.startsWith('---')) {
    return false
  }

  const title = extractTitle(content, filePath)
  const frontmatter = `---
title: "${title}"
description: "API reference for ${title}"
---

`

  writeFileSync(filePath, frontmatter + content)
  return true
}

function processDirectory(dir) {
  const entries = readdirSync(dir)
  let processed = 0

  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      processed += processDirectory(fullPath)
    } else if (entry.endsWith('.md') && entry !== 'index.md') {
      if (addFrontmatter(fullPath)) {
        processed++
      }
    }
  }

  return processed
}

// Delete the auto-generated README.md (we use our own index.md)
const readmePath = join(referenceDir, 'README.md')
if (existsSync(readmePath)) {
  unlinkSync(readmePath)
  console.log('   Removed auto-generated README.md')
}

const processedCount = processDirectory(referenceDir)
console.log(`   Added frontmatter to ${processedCount} files`)

// Step 5: Create index page for reference section
console.log('\n4️⃣  Creating reference index...')
const indexContent = `---
title: API Reference
description: Complete API reference for @sip-protocol/sdk
---

This section contains the complete API documentation for the SIP Protocol SDK.

## Installation

\`\`\`bash
npm install @sip-protocol/sdk
\`\`\`

## Quick Links

### Core Classes

- [SIP](/reference/classes/SIP) - Main entry point for the SDK
- [IntentBuilder](/reference/classes/IntentBuilder) - Build shielded intents

### Privacy Primitives

- [generateStealthAddress](/reference/functions/generateStealthAddress) - Generate stealth addresses
- [createCommitment](/reference/functions/createCommitment) - Create Pedersen commitments
- [deriveViewingKey](/reference/functions/deriveViewingKey) - Derive viewing keys

### Enums & Types

- [PrivacyLevel](/reference/enumerations/PrivacyLevel) - Privacy level options
- [IntentStatus](/reference/enumerations/IntentStatus) - Intent status states

## Modules Overview

| Module | Description |
|--------|-------------|
| \`SIP\` | Main SIP client class |
| \`IntentBuilder\` | Intent building and creation |
| \`stealth\` | Stealth address generation (EIP-5564) |
| \`crypto\` | Pedersen commitments, hashing |
| \`privacy\` | Viewing keys, encryption |
| \`proofs\` | ZK proof providers |
| \`adapters\` | NEAR Intents, wallet adapters |
| \`validation\` | Input validation utilities |

## Usage Example

\`\`\`typescript
import { SIP, IntentBuilder, PrivacyLevel } from '@sip-protocol/sdk'

// Initialize client
const sip = new SIP({
  nearNetwork: 'testnet',
  privacyLevel: PrivacyLevel.SHIELDED
})

// Create shielded intent
const intent = await new IntentBuilder()
  .setPrivacyLevel(PrivacyLevel.SHIELDED)
  .setInput({ token: 'USDC', amount: '100', chain: 'ethereum' })
  .setOutput({ token: 'SOL', chain: 'solana' })
  .build()
\`\`\`

---

*API docs auto-generated from @sip-protocol/sdk v0.1.9*
`

writeFileSync(join(referenceDir, 'index.md'), indexContent)

console.log('\n✅ API documentation generated successfully!')
console.log(`   Output: ${referenceDir}`)
