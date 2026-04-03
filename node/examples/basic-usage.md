# Basic Usage

A minimal end-to-end example: generate keys, initialize the SDK, go online, and query balances.

## Complete script

```typescript
import {
  Orbis1SDK,
  generateKeys,
  restoreKeys,
  BitcoinNetwork,
  Environment,
  AssetSchema,
  LogLevel,
} from 'orbis1-sdk-node';

const INDEXER = 'ssl://electrum.iriswallet.com:50053';
const PROXY   = 'rpcs://proxy.iriswallet.com/0.2/json-rpc';

async function main() {
  // ── 1. Keys ─────────────────────────────────────────────────────────────
  // New wallet:
  const keys = await generateKeys(BitcoinNetwork.TESTNET4);

  // Existing wallet (mnemonic from env):
  // const keys = await restoreKeys(BitcoinNetwork.TESTNET4, process.env.MNEMONIC!);

  console.log('Master fingerprint:', keys.masterFingerprint);

  // ── 2. SDK ───────────────────────────────────────────────────────────────
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

  // ── 3. Online ────────────────────────────────────────────────────────────
  const wallet = sdk.getWallet()!;

  await wallet.goOnline(false, INDEXER);
  await wallet.sync();

  // ── 4. Balances ──────────────────────────────────────────────────────────
  const btc = await wallet.getBtcBalance();
  console.log('BTC vanilla (spendable):', btc.vanilla.spendable, 'sats');
  console.log('BTC colored (spendable):', btc.colored.spendable, 'sats');

  const assets = await wallet.listAssets([]);
  console.log('NIA assets:', assets.nia?.length ?? 0);
  console.log('CFA assets:', assets.cfa?.length ?? 0);
  console.log('UDA assets:', assets.uda?.length ?? 0);

  // ── 5. Cleanup ───────────────────────────────────────────────────────────
  await wallet.dropOnline();
  await wallet.close();
}

main().catch(console.error);
```

## Run

```bash
ORBIS_API_KEY=pk_test_... MNEMONIC="word1 word2 ..." npx ts-node script.ts
```

## What's next

| Topic | Link |
|---|---|
| Issue your first asset | [Asset Operations](./asset-operations) |
| Gas-Free transfer | [Gas-Free Transfer](./gas-free-transfer) |
| Server integration | [Server Patterns](./server-patterns) |
