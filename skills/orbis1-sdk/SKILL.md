---
name: orbis1-sdk
description: Guide for using Orbis1 SDK to build RGB asset wallets on Bitcoin. Use when user mentions RGB, Bitcoin assets, gas-free transfers, orbis1-sdk-node, orbis1-sdk-rn, NIA/UDA/CFA/IFA tokens, or building Bitcoin asset wallets. DO NOT use for general Bitcoin wallet operations without RGB.
---

# Orbis1 SDK — RGB Assets on Bitcoin

## What This Skill Does

Guides developers through using the Orbis1 SDK, a TypeScript library for building RGB asset wallets on Bitcoin. RGB is a client-side-validated smart contract protocol that enables fungible and non-fungible assets on Bitcoin with privacy and scalability.

**Two packages, identical API:**
- `orbis1-sdk-node` — Node.js ≥18, N-API native addon
- `orbis1-sdk-rn` — React Native (New Architecture), Turbo Module

## When to Use This Skill

✅ **Use when:**
- User mentions RGB protocol, RGB assets, or RGB wallets
- Building Bitcoin wallets with fungible/NFT token support
- Implementing gas-free transfers (user doesn't hold BTC for fees)
- Working with NIA, UDA, CFA, or IFA asset schemas
- User mentions `orbis1-sdk-node` or `orbis1-sdk-rn` packages
- Creating Bitcoin asset issuance or transfer flows

❌ **Do NOT use when:**
- Building standard Bitcoin-only wallets (no RGB layer)
- User asks about Lightning Network, sidechains, or Ethereum
- General Bitcoin questions without asset/token context

## Critical Architecture Facts

### 1. Amounts Are ALWAYS Integer Base Units

**NEVER pass floating-point values.** All RGB amounts are integers in the smallest unit.

```typescript
// ❌ WRONG
const amount = "100.25";  // floating-point string
const amount = 100.25;    // floating-point number

// ✅ CORRECT
const precision = 6;
const displayAmount = 100.25;
const baseUnits = Math.round(displayAmount * 10 ** precision);  // 100250000
```

Display conversion: `display = baseUnits / 10 ** precision`

### 2. SDK Lifecycle (Both Platforms)

```typescript
// 1. Construct
const sdk = new Orbis1SDK(config);

// 2. Initialize (REQUIRED before any operations)
await sdk.initialize();

// 3. Access features
const wallet = sdk.getWallet();
const gasFree = sdk.gasFree();
const watchTower = sdk.watchTower();

// 4. Cleanup
await wallet.close();  // ← Always close wallet to free native resources
```

### 3. Wallet Online Lifecycle — Platform Differences

**Node.js — Explicit handle management (for servers):**

```typescript
// Per-request pattern (prevents leaks)
const online = await wallet.createOnline(false, indexerUrl);
try {
  await wallet.setOnline(online);
  await wallet.sync();
  // ... operations ...
} finally {
  await wallet.dropOnline(online);  // CRITICAL: always release
}
```

**React Native — Simple pattern:**

```typescript
await wallet.goOnline(indexerUrl);
await wallet.sync();

useEffect(() => {
  return () => {
    wallet.close().catch(console.error);
  };
}, [wallet]);
```

### 4. UTXOs Required Before RGB Operations

RGB allocations live on dedicated Bitcoin UTXOs. Always create them first:

```typescript
try {
  await wallet.createUtxos(
    true,   // upTo: fill to target count
    5,      // target count
    1_000,  // sats per UTXO
    1.5     // feeRate (sat/vByte)
  );
  await wallet.sync();
} catch (err) {
  if (!err.message?.includes('AllocationsAlreadyAvailable')) throw err;
}
```

### 5. Error Handling — Use Specific Types

```typescript
import {
  OrbisError,
  ConfigurationError,
  FeatureNotEnabledError,
  GasFreeError,
  QuoteExpiredError,
  ServiceUnavailableError,
} from 'orbis1-sdk-node';  // or orbis1-sdk-rn

try {
  await gasFree.confirmTransfer(request, quote);
} catch (err) {
  if (err instanceof QuoteExpiredError) {
    // Recoverable — re-request quote
    const newQuote = await gasFree.requestFeeQuote(request);
    return gasFree.confirmTransfer(request, newQuote);
  }
  if (err instanceof GasFreeError) {
    console.error(`Gas-Free error [${err.gasFreeCode}]:`, err.message);
  }
  throw err;
}
```

**Key:** For `GasFreeError`, use `err.gasFreeCode` (not `err.code`).

## Common Patterns

### Full Initialization (Node.js)

```typescript
import {
  Orbis1SDK,
  generateKeys,
  BitcoinNetwork,
  Environment,
  AssetSchema,
  LogLevel,
} from 'orbis1-sdk-node';

const keys = await generateKeys(BitcoinNetwork.TESTNET4);
// or: await restoreKeys(BitcoinNetwork.TESTNET4, mnemonic);

const sdk = new Orbis1SDK({
  apiKey: process.env.ORBIS_API_KEY!,  // pk_test_... or sk_live_...
  environment: Environment.TESTNET4,    // TESTNET4 | MAINNET | REGTEST
  wallet: {
    enabled: true,
    keys,
    supportedSchemas: [AssetSchema.NIA, AssetSchema.CFA, AssetSchema.UDA],
  },
  features: {
    gasFree: { enabled: true },
    watchTower: { enabled: true },
  },
  logging: { level: LogLevel.INFO },
});

await sdk.initialize();
const wallet = sdk.getWallet()!;
await wallet.goOnline(false, 'ssl://electrum.iriswallet.com:50053');
await wallet.sync();
```

### Issue an Asset (NIA Example)

```typescript
const precision = 6;
const supply = 1_000_000 * 10 ** precision;  // 1M tokens

const asset = await wallet.issueAssetNia(
  'TUSDT',      // ticker
  'Test USDT',  // name
  precision,
  [supply]      // amounts array (each → separate allocation)
);
```

### Gas-Free Transfer (One-Call API)

```typescript
const gasFree = sdk.gasFree();

const quote = await gasFree.requestFeeQuote({
  userId: 'user-123',
  assetId: 'rgb:asset_id',
  amount: '100250000',  // base units (string)
  recipientInvoice: 'rgb:~/~/...',
});

const result = await gasFree.confirmTransfer(
  { userId: 'user-123', assetId, amount: '100250000', recipientInvoice },
  quote
);
```

### Generate Receive Invoice

```typescript
const receiveData = await wallet.blindReceive(
  assetId,  // null = accept any asset
  { type: 'FUNGIBLE', amount: 100_000_000 },
  null,     // expiry (null = default)
  ['rpcs://proxy.iriswallet.com/0.2/json-rpc'],
  1         // minConfirmations
);
console.log(receiveData.invoice);  // Share with sender
```

## Environment and API Keys

| Environment | Network | API Key Prefix | Gas-Free Available? |
|---|---|---|---|
| `TESTNET4` | Bitcoin Testnet4 | `pk_test_` | ✅ |
| `REGTEST` | Local regtest | `pk_test_` | ❌ |
| `MAINNET` | Bitcoin Mainnet | `sk_live_` | ✅ |

**Wrong key prefix for environment → `ConfigurationError`**

## Common Mistakes to Avoid

1. **Passing floating-point amounts** — Always use integer base units
2. **Not calling `sdk.initialize()`** — Must be called before accessing wallet
3. **Forgetting to create UTXOs** — RGB requires dedicated UTXOs before issuing/receiving
4. **Not closing wallet on Node.js servers** — Use `createOnline`/`dropOnline` in try/finally
5. **Using `error.code` for GasFreeError** — Use `error.gasFreeCode` instead
6. **Enabling Gas-Free without wallet** — Gas-Free requires `wallet.enabled: true`
7. **Using Gas-Free on REGTEST** — Not available; will throw at initialization

## Live Documentation (Always Fetch)

For the most current API reference, examples, and troubleshooting, fetch:

```
https://docs.orbis1.io
```

**Key pages:**
- Introduction: `/introduction`
- Core Concepts (RGB primer): `/concepts`
- Node.js SDK: `/node/` (installation, quickstart, configuration, wallet, gas-free, watch-tower, examples)
- React Native SDK: `/react-native/` (parallel structure to Node.js)
- Error Codes: `/reference/error-codes`
- Environments: `/reference/environments`
- Troubleshooting: `/troubleshooting`

When user needs fresh context, use `fetch_webpage` to pull the relevant docs page.

## Asset Schemas

| Schema | Type | Description |
|---|---|---|
| `NIA` | Non-Inflatable Asset | Fixed-supply fungible (e.g., USDT, tokenized shares) |
| `CFA` | Collectible Fungible Asset | Fungible with optional media attachment |
| `UDA` | Unique Digital Asset | NFT (non-fungible with media) |
| `IFA` | Inflatable Fungible Asset | Supports minting additional supply (not on mainnet) |

## Gas-Free Transfer Flow

Gas-Free lets users send RGB assets without holding BTC for mining fees:

1. **Request quote** → Service returns fee quote + expiry + service UTXOs
2. **Build PSBT** (client-side) → Include service's mining UTXO as external input
3. **Submit to service** → Service validates consignment, co-signs the mining input
4. **Broadcast** → Client signs RGB inputs, broadcasts Bitcoin transaction
5. **Verify** → Service confirms TXID landed in mempool

**Security:** Service signs with `SIGHASH_ALL`, committing to the OP_RETURN RGB allocation. Client cannot change fee after service signs.

## Node.js Server Pattern (Critical)

For Express/Fastify/etc., **always** manage `Online` lifecycle per request:

```typescript
app.get('/balance', async (req, res) => {
  const wallet = sdk.getWallet()!;
  const online = await wallet.createOnline(false, INDEXER);
  try {
    await wallet.setOnline(online);
    await wallet.sync();
    const btc = await wallet.getBtcBalance(true);  // skipSync
    res.json(btc);
  } finally {
    await wallet.dropOnline(online);  // Prevents handle leak
  }
});
```

Skipping `dropOnline` → memory leak.

## Installation

```bash
# Node.js
npm install orbis1-sdk-node

# React Native
yarn add orbis1-sdk-rn
cd ios && pod install && cd ..
```

React Native requires **New Architecture** (RN 0.73+).

## Next Steps for Users

1. Read [Core Concepts](https://docs.orbis1.io/concepts) to understand RGB, UTXOs, and gas-free model
2. Follow [Node.js Quickstart](https://docs.orbis1.io/node/quickstart) or [React Native Quickstart](https://docs.orbis1.io/react-native/quickstart)
3. Review [Gas-Free guide](https://docs.orbis1.io/node/gas-free) for zero-fee transfers
4. Check [Troubleshooting](https://docs.orbis1.io/troubleshooting) for common issues

---

**Remember:** When in doubt, fetch the live docs. The documentation at `https://docs.orbis1.io/` is the authoritative source.
