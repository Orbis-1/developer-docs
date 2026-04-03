# Quick Start

This guide walks through a complete minimal flow: generate keys, initialize the SDK, connect to a Bitcoin indexer, and query your balances.

## Step 1: Generate or restore keys

On first run, generate a new wallet:

```typescript
import { generateKeys, BitcoinNetwork } from 'orbis1-sdk-node';

const keys = await generateKeys(BitcoinNetwork.TESTNET4);

// Store keys.mnemonic securely — this is the only way to recover the wallet
console.log('Mnemonic:', keys.mnemonic);
console.log('Master fingerprint:', keys.masterFingerprint);
```

On subsequent runs, restore from mnemonic:

```typescript
import { restoreKeys, BitcoinNetwork } from 'orbis1-sdk-node';

const keys = await restoreKeys(BitcoinNetwork.TESTNET4, 'your twelve word mnemonic ...');
```

## Step 2: Initialize the SDK

```typescript
import { Orbis1SDK, Environment, LogLevel, AssetSchema } from 'orbis1-sdk-node';

const sdk = new Orbis1SDK({
  apiKey: process.env.ORBIS_API_KEY!,
  environment: Environment.TESTNET4,
  wallet: {
    enabled: true,
    keys,
    supportedSchemas: [AssetSchema.NIA, AssetSchema.UDA, AssetSchema.CFA],
  },
  features: {
    gasFree: { enabled: true },
    watchTower: { enabled: true },
  },
  logging: { level: LogLevel.INFO },
});

await sdk.initialize();
```

## Step 3: Connect and sync

```typescript
const wallet = sdk.getWallet()!;

// Connect to an Electrum indexer
await wallet.goOnline(false, 'ssl://electrum.iriswallet.com:50053');

// Sync UTXO and transfer state
await wallet.sync();
```

## Step 4: Query balances

```typescript
// Bitcoin balances (vanilla = BTC, colored = UTXOs with RGB allocations)
const btcBalance = await wallet.getBtcBalance();
console.log('BTC spendable:', btcBalance.vanilla.spendable, 'sats');

// RGB asset list
const assets = await wallet.listAssets([]);  // empty array = all schemas
console.log('RGB assets:', assets.nia.length, 'NIA,', assets.uda.length, 'UDA');
```

## Step 5: Cleanup

```typescript
await wallet.close();
await sdk.cleanup();
```

## Complete minimal script

```typescript
import {
  Orbis1SDK,
  generateKeys,
  BitcoinNetwork,
  Environment,
  LogLevel,
  AssetSchema,
} from 'orbis1-sdk-node';

async function main() {
  // Keys (in production: persist and restore via restoreKeys)
  const keys = await generateKeys(BitcoinNetwork.TESTNET4);

  const sdk = new Orbis1SDK({
    apiKey: process.env.ORBIS_API_KEY!,
    environment: Environment.TESTNET4,
    wallet: {
      enabled: true,
      keys,
      supportedSchemas: [AssetSchema.NIA, AssetSchema.CFA, AssetSchema.UDA],
    },
    logging: { level: LogLevel.INFO },
  });

  await sdk.initialize();

  const wallet = sdk.getWallet()!;

  try {
    await wallet.goOnline(false, 'ssl://electrum.iriswallet.com:50053');
    await wallet.sync();

    const btc = await wallet.getBtcBalance();
    const assets = await wallet.listAssets([]);

    console.log('BTC balance:', btc);
    console.log('Assets:', assets);
  } finally {
    await wallet.close();
    await sdk.cleanup();
  }
}

main().catch(console.error);
```

## Important conventions

| Convention | Detail |
|---|---|
| Call `await sdk.initialize()` first | Before accessing `getWallet()` or feature modules |
| Call `goOnline()` before network ops | `sync`, `send`, `createUtxos`, `getBtcBalance`, `refresh` all require the wallet to be online |
| Use integer base units for amounts | Never pass floating-point values; convert with `Math.round(display * 10 ** precision)` |
| Always `close()` the wallet | Releases the native Rust wallet handle; skipping this leaks resources |

## Next steps

- [Configuration reference](/node/configuration) — all `SDKConfig` options
- [Wallet guide](/node/wallet) — full wallet API including asset issuance, transfers, and backup
- [Gas-Free guide](/node/gas-free) — send RGB assets without holding BTC
