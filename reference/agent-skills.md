# Agent Skills

The Orbis1 SDK includes **AI agent skills** that help coding assistants (like GitHub Copilot, Cursor, Claude Code, and other AI-powered IDEs) understand SDK best practices and provide better code suggestions.

## What Are Agent Skills?

Agent skills follow the [open Agent Skills standard](https://agentskills.io) — a cross-platform format for teaching AI coding assistants domain-specific knowledge. Each skill is a `SKILL.md` file with:

- **YAML frontmatter** — Name and description for agent activation routing
- **Domain knowledge** — SDK architecture, RGB protocol specifics
- **Common pitfalls** — Issues to avoid (e.g., floating-point amounts)
- **Code patterns** — Correct implementation examples
- **Decision trees** — When to use specific features

These files are designed to be loaded by AI coding assistants to provide context-aware suggestions when you're building with the Orbis1 SDK.

## Installing the Orbis1 SDK Skill

The recommended way to install skills is using the `npx skills` CLI, which works across all major AI coding assistants:

### Global Installation (Recommended)

Install the skill globally to use across all your projects:

```bash
npx skills add Orbis-1/developer-docs --skill orbis1-sdk --global
```

This makes the skill available to your AI assistant whenever you're working with the Orbis1 SDK, regardless of which project you're in.

### Per-Project Installation

For project-specific installation:

```bash
cd your-project
npx skills add Orbis-1/developer-docs --skill orbis1-sdk
```

This creates a `.skills/` directory in your project with the skill file.

### Verify Installation

Check installed skills:

```bash
npx skills list
```

### Update the Skill

Get the latest version:

```bash
npx skills update orbis1-sdk
```

## How Skills Work

### Activation Routing

Agent skills use **progressive disclosure**: your AI assistant loads only the metadata (`name` + `description`) initially, then decides whether to activate the skill based on your code context.

The Orbis1 SDK skill activates when:
- You're working in a file that imports `orbis1-sdk-node` or `orbis1-sdk-rn`
- You mention RGB, Bitcoin assets, or gas-free transfers in prompts
- You reference NIA/UDA/CFA/IFA asset schemas
- The agent detects RGB-related code patterns

Once activated, the full skill instructions load to guide code generation.

### Cross-Platform Compatibility

The skill works with:
- **GitHub Copilot** (VS Code, CLI, IntelliJ)
- **Cursor IDE**
- **Claude Code** (Anthropic CLI)
- **Gemini Code Assist** (Google Cloud)
- **Windsurf** (Codeium)
- Any agent that supports the Agent Skills standard

## The SKILL.md File

The skill file is located at:
```
developer-docs/skills/orbis1-sdk/SKILL.md
```

### Frontmatter Format

```yaml
---
name: orbis1-sdk
description: Guide for using Orbis1 SDK to build RGB asset wallets on Bitcoin. Use when user mentions RGB, Bitcoin assets, gas-free transfers, orbis1-sdk-node, orbis1-sdk-rn, NIA/UDA/CFA/IFA tokens, or building Bitcoin asset wallets. DO NOT use for general Bitcoin wallet operations without RGB.
---
```

The **description is critical** — it tells the agent when to activate the skill. Notice it includes:
- What the skill does (guide for Orbis1 SDK)
- When to use it (RGB, gas-free, specific token types)
- When NOT to use it (general Bitcoin operations)

This ensures the agent activates the skill only when relevant, avoiding noise.

## What the Skill Teaches

### 1. Amount Handling (Most Common Issue)

The skill enforces **integer-only amounts** across all RGB operations:

```typescript
// ❌ Agent will catch this mistake
const amount = "100.25";  // floating-point

// ✅ Correct pattern from skill
const precision = 6;
const displayAmount = 100.25;
const baseUnits = Math.round(displayAmount * 10 ** precision);  // 100250000
```

### 2. Platform-Specific Patterns

The skill knows you're using different patterns based on your environment:

**Node.js** (server/CLI):
```typescript
// Explicit online handle management
const online = await wallet.createOnline(false, indexerUrl);
try {
  await wallet.setOnline(online);
  await wallet.sync();
} finally {
  await wallet.dropOnline(online);  // Always cleanup
}
```

**React Native** (mobile app):
```typescript
// Simplified lifecycle
await wallet.goOnline(indexerUrl);
await wallet.sync();
```

### 3. UTXO Creation Before RGB Operations

The skill enforces the correct order:

```typescript
// 1. Create UTXOs first
await wallet.createUtxos(
  false,             // online
  true,              // upTo
  2,                 // utxoNum
  0.0001,            // sizeValue
  5                  // feeRate
);

// 2. THEN do RGB operations
const invoice = await wallet.issueAssetRgb121(/* ... */);
```

### 4. Gas-Free Transfer Flow

Complete multi-step flows from the skill:

```typescript
// Initiator side
const recipientPsbt = await gasFree.initiateDonation(recipientInvoice);

// Recipient side  
const donation = await gasFree.donateGasFee(recipientPsbt, feeRate);

// Initiator completes
const invoiceData = await gasFree.completeTransfer(
  requestId,
  donation.psbt,
  donation.assetId
);
```

### 5. Error Handling Patterns

The skill includes proper error handling:

```typescript
import { Orbis1Error } from 'orbis1-sdk-node';

try {
  await wallet.issueAssetRgb121(/* ... */);
} catch (error) {
  if (error instanceof Orbis1Error) {
    console.error(`SDK Error [${error.code}]:`, error.message);
    // Handle known error codes
  } else {
    throw error;  // Unknown error
  }
}
```

## Benefits of Using Skills

### 🎯 Fewer Mistakes
AI assistants will catch common pitfalls before you run the code (e.g., float amounts, missing UTXO creation).

### ⚡ Faster Development
Get correct code patterns immediately instead of debugging runtime errors.

### 📚 Always Up-to-Date
Skills are maintained alongside the SDK, so AI suggestions reflect current best practices.

### 🔄 Context-Aware Suggestions
The assistant knows whether you're building for Node.js or React Native and provides the right pattern.

## Example: Building with Agent Assistance

**Your prompt to AI assistant:**
> "Create a function to issue a new RGB-121 NFT with name, description, and precision 0"

**Without skill file:**
```typescript
// ❌ AI might generate this (wrong)
async function issueNFT(name: string, description: string) {
  return await wallet.issueAssetRgb121({
    name,
    description,
    precision: 0.0,  // Wrong type!
    amounts: [1.0],  // Wrong type!
    // Missing ticker, missing dataDir...
  });
}
```

**With skill file loaded:**
```typescript
// ✅ AI generates this (correct)
async function issueNFT(
  wallet: Wallet,
  name: string,
  description: string,
  ticker: string
): Promise<IssuanceResult> {
  // Ensure UTXOs exist
  const utxos = await wallet.listUnspents(false);
  if (utxos.length < 1) {
    await wallet.createUtxos(false, true, 2, 0.0001, 5);
  }

  // Issue with integer amounts
  return await wallet.issueAssetRgb121({
    ticker,
    name,
    description,
    precision: 0,     // Integer
    amounts: [1],     // Integer array
  });
}
```

## Alternative: Manual Installation

If you prefer not to use `npx skills`, you can manually add the skill file:

### Option 1: Reference from Documentation Site

The Orbis1 SDK documentation serves the skill file at:
```
https://docs.orbis1.io/.well-known/skills/default/skill.md
```

Some AI assistants can discover this automatically when you're viewing the docs.

### Option 2: Copy to Project

```bash
# In your project root
mkdir -p .ai/skills
curl https://raw.githubusercontent.com/Orbis-1/developer-docs/main/skills/orbis1-sdk/SKILL.md \
  -o .ai/skills/orbis1-sdk.md
```

### Option 3: IDE-Specific Configuration

**GitHub Copilot** (VS Code):
```json
// .vscode/settings.json
{
  "github.copilot.advanced": {
    "additionalContext": [
      "${workspaceFolder}/.ai/skills/"
    ]
  }
}
```

**Cursor**:
Skills in `.ai/` or `.skills/` are automatically indexed.

## Skills vs. AGENTS.md

You may have seen `AGENTS.md` files in some repositories. Here's when to use each:

| Use Case | File | Why |
|---|---|---|
| **Always-on instructions** | `AGENTS.md` | Instructions that apply to every task (e.g., "always use TypeScript strict mode") |
| **Domain-specific workflows** | `SKILL.md` | Specialized knowledge activated only when relevant (e.g., RGB asset operations) |
| **Maximum reliability** | `AGENTS.md` | No activation decision — guaranteed to load |
| **Reusable across projects** | `SKILL.md` | Can be installed globally and shared across teams |
| **Discovery and search** | `SKILL.md` | Listed in skill registries, discoverable via `npx skills search` |

**For Orbis1 SDK**: The skill format is ideal because RGB development is specialized — you don't want the agent loading RGB-specific patterns when you're writing a Todo app. The skill activates only when you're actually working with the SDK.

## Keeping Skills Up-to-Date

### Automatic Updates (npx skills)

If you installed via `npx skills add`, update to the latest version:

```bash
npx skills update orbis1-sdk
```

Or update all installed skills:

```bash
npx skills update --all
```

### Manual Updates

If you manually copied the skill file, fetch the latest version:

```bash
curl https://raw.githubusercontent.com/Orbis-1/developer-docs/main/skills/orbis1-sdk/SKILL.md \
  -o .ai/skills/orbis1-sdk.md
```

Or if you cloned the docs repository:

```bash
cd path/to/orbis1-sdk
git pull origin main
```

## Discovery: The `.well-known` Convention

The Orbis1 SDK documentation site serves the skill at a standard location:

```
https://docs.orbis1.io/.well-known/skills/default/skill.md
```

This follows the [Agent Skills specification](https://agentskills.io) for documentation sites. AI assistants that support this convention can auto-discovery and load the skill when you're reading the documentation.

### Installing from the Docs URL

Some agents allow installing directly from the docs:

```bash
npx skills add https://docs.orbis1.io --skill default
```

This fetches the skill from `/.well-known/skills/default/skill.md` automatically.

## Progressive Disclosure & Live Documentation

One of the key advantages of the Agent Skills format is **progressive disclosure**: agents don't load everything at once.

### How It Works

1. **Metadata phase**: Agent loads `name` + `description` from YAML frontmatter
2. **Activation decision**: Agent checks if the skill is relevant to current task
3. **Full load**: If activated, agent loads the complete `SKILL.md` instructions
4. **Dynamic fetch**: The skill instructs the agent to fetch live documentation when needed

### Live Docs Pattern

The Orbis1 SDK skill includes instructions to fetch fresh content from `https://docs.orbis1.io`:

```markdown
## Live Documentation (Always Fetch)

For the most current API reference, examples, and troubleshooting, fetch:
https://docs.orbis1.io

When user needs fresh context, use `fetch_webpage` to pull the relevant docs page.
```

This ensures the agent always has access to:
- Latest API changes
- New features and examples  
- Current troubleshooting guides
- Updated error codes

This pattern (from Google's Gemini research) significantly improves agent accuracy because it avoids stale information.

## Creating Custom Skills for Your Team

If you're building internal tools on top of Orbis1 SDK, you can create your own skills:

### 1. Initialize a New Skill

```bash
npx skills init my-company-rgb-workflows
cd my-company-rgb-workflows
```

This creates:
```
my-company-rgb-workflows/
  SKILL.md          # Main instructions
  scripts/          # Optional: executable helpers
  references/       # Optional: detailed docs
  assets/           # Optional: templates, configs
```

### 2. Write the SKILL.md

Focus on:
- **Description**: When should this skill activate? Be specific.
- **Current patterns**: What APIs/patterns does your team use?
- **Common mistakes**: What issues do developers hit repeatedly?
- **Links to live docs**: Company wiki, internal docs, API references

Example frontmatter:
```yaml
---
name: acme-rgb-backend
description: Internal patterns for ACME Corp's RGB asset backend. Use when building services that integrate with Orbis1 SDK for multi-tenant wallet management. Includes database schema, auth patterns, and monitoring setup.
---
```

### 3. Publish to GitHub

```bash
git init
git add .
git commit -m "Initial skill for ACME RGB backend"
git remote add origin git@github.com:acme-corp/rgb-agent-skills.git
git push -u origin main
```

### 4. Install in Your Team

```bash
npx skills add acme-corp/rgb-agent-skills --skill acme-rgb-backend --global
```

Now all developers on your team get consistent AI suggestions for your internal patterns.

## Contributing to the Orbis1 SDK Skill

Found a pattern that should be in the official skill? [Open an issue](https://github.com/Orbis-1/developer-docs/issues) or submit a PR to the `skills/orbis1-sdk/SKILL.md` file.

Include:
- **Common mistake**: What error did you encounter? Include error messages.
- **Correct pattern**: Code snippet showing the right way (with comments).
- **When it applies**: What triggers this pattern? What are the prerequisites?
- **Related docs**: Link to the relevant documentation page.

### Contribution Example

**❌ Too vague:**
> "Add error handling for gas-free transfers"

**✅ Good contribution:**
> **Common mistake**: Developers use `error.code` instead of `error.gasFreeCode` for GasFreeError instances, causing undefined checks.
> 
> **Correct pattern**:
> ```typescript
> try {
>   await gasFree.confirmTransfer(request, quote);
> } catch (err) {
>   if (err instanceof GasFreeError) {
>     // Use gasFreeCode, not code!
>     console.error(`Gas-Free error [${err.gasFreeCode}]:`, err.message);
>   }
> }
> ```
> 
> **When it applies**: Any gas-free transfer error handling
> 
> **Related docs**: [Error Codes](./error-codes#gas-free-errors)

## Skill Discovery and Registry

### Searching for Skills

Find skills related to your stack:

```bash
npx skills search rgb
npx skills search bitcoin
npx skills search wallet
```

### Skill Registry

Installed skills appear on [skills.sh](https://skills.sh) via install telemetry. This helps other developers discover useful skills for their projects.

The Orbis1 SDK skill will be listed as:
```
orbis1-sdk — Guide for building RGB asset wallets on Bitcoin
```

## Research: Why Skills Work

The Agent Skills format is based on research from:
- **Vercel's Skills CLI team** — Demonstrated that targeted skills improve accuracy for specialized domains
- **Google's Gemini research** ([blog post](https://developers.googleblog.com/closing-the-knowledge-gap-with-agent-skills/)) — Showed that skills with live doc fetching reduce hallucination
- **Cloudflare's Agent Skills RFC** — Established the open standard for cross-platform compatibility

Key findings:
1. **Activation routing matters**: Skills work best when the description clearly defines when to activate (vs. always-on instructions)
2. **Live docs > static knowledge**: Skills that fetch fresh docs outperform those with baked-in information
3. **Progressive disclosure reduces noise**: Loading only relevant skills keeps the agent focused
4. **Cross-platform adoption**: A single SKILL.md works across Copilot, Cursor, Claude Code, and Gemini

For Orbis1 SDK, this means:
- The skill activates only when you're working with RGB assets (not every Bitcoin operation)
- Agents fetch latest docs from `docs.orbis1.io` instead of relying on stale patterns
- Integer amount handling, UTXO creation, and lifecycle patterns are enforced consistently

## Next Steps

### For Developers Building with Orbis1 SDK

1. **Install the skill**:
   ```bash
   npx skills add Orbis-1/developer-docs --skill orbis1-sdk --global
   ```

2. **Start building**:
   - Your AI assistant will now suggest correct patterns automatically
   - Try prompts like: "Create a gas-free RGB transfer function"
   - Notice the agent catches float amounts and missing UTXO creation

3. **Verify it's working**:
   - Ask your AI assistant: "What precision should I use for RGB amounts?"
   - It should answer: "Use integer base units, not floating-point" (from the skill)

### For SDK Maintainers and Contributors

1. **Review the skill**: Read [SKILL.md](https://github.com/Orbis-1/developer-docs/blob/main/skills/orbis1-sdk/SKILL.md)
2. **Test with your AI assistant**: Install it and see if suggestions improve
3. **Contribute improvements**: Found a missing pattern? Submit a PR
4. **Keep it updated**: As the SDK evolves, update the skill to match

### Learn More

- [Agent Skills Specification](https://agentskills.io) — Official standard
- [Skills CLI Documentation](https://github.com/skills-tools/skills-cli) — Installation and usage
- [Google Gemini Skills Research](https://developers.googleblog.com/closing-the-knowledge-gap-with-agent-skills/) — Why skills improve AI accuracy
- [Orbis1 SDK SKILL.md](https://github.com/Orbis-1/developer-docs/blob/main/skills/orbis1-sdk/SKILL.md) — Complete skill file

### Related Documentation

- [Error Codes](./error-codes) — Understanding SDK errors
- [Environments](./environments) — Network and API key configuration
- [Troubleshooting](../troubleshooting) — Common issues and fixes
- [Core Concepts](../concepts) — Understanding RGB protocol basics
