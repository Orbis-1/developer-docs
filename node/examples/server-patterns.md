# Server Patterns

Patterns for using `orbis1-sdk-node` in long-running Node.js servers (Express, Fastify, NestJS, etc.). The key difference from scripts is explicit `Online` lifecycle management to avoid connection leaks.

## Singleton SDK, per-request Online

The recommended pattern for web servers:

- Create the SDK and `Wallet` **once** at startup.
- Create and drop the `Online` handle **per request** inside a `try/finally`.

```typescript
import express from 'express';
import {
  Orbis1SDK,
  restoreKeys,
  BitcoinNetwork,
  Environment,
} from 'orbis1-sdk-node';

const INDEXER = 'ssl://electrum.iriswallet.com:50053';

// ── 1. One-time SDK initialisation ──────────────────────────────────────────
async function createSdk() {
  const keys = await restoreKeys(BitcoinNetwork.TESTNET4, process.env.MNEMONIC!);
  const sdk = new Orbis1SDK({
    apiKey: process.env.ORBIS_API_KEY!,
    environment: Environment.TESTNET4,
    wallet: { enabled: true, keys },
    features: { gasFree: { enabled: true } },
  });
  await sdk.initialize();
  return sdk;
}

// ── 2. Express app ──────────────────────────────────────────────────────────
const app = express();
app.use(express.json());

let sdk: Orbis1SDK;

app.get('/balance', async (req, res) => {
  const wallet = sdk.getWallet()!;

  // Create Online handle for this request only
  const online = await wallet.createOnline(false, INDEXER);
  try {
    await wallet.setOnline(online);
    await wallet.sync();
    const btc = await wallet.getBtcBalance(true);  // skipSync=true (already synced)
    res.json({ vanilla: btc.vanilla.spendable, colored: btc.colored.spendable });
  } finally {
    await wallet.dropOnline(online);  // always drop — even on error
  }
});

app.post('/transfer/gas-free', async (req, res) => {
  const { assetId, amount, recipientInvoice, userId } = req.body;
  const wallet = sdk.getWallet()!;
  const gasFree = sdk.gasFree();

  const online = await wallet.createOnline(false, INDEXER);
  try {
    await wallet.setOnline(online);
    await wallet.sync();

    const request = { userId, assetId, amount, recipientInvoice };
    const quote = await gasFree.requestFeeQuote(request);

    // Optionally return quote for client review before confirming
    // For auto-confirm: call confirmTransfer immediately
    const result = await gasFree.confirmTransfer(request, quote);

    res.json({ txid: result.txid, status: result.status });
  } finally {
    await wallet.dropOnline(online);
  }
});

// ── 3. Start ────────────────────────────────────────────────────────────────
createSdk().then((instance) => {
  sdk = instance;
  app.listen(3000, () => console.log('Orbis1 server listening on :3000'));
});
```

## Graceful shutdown

Always clean up wallet resources before the process exits to avoid corrupted state:

```typescript
async function shutdown() {
  console.log('Shutting down…');
  const wallet = sdk?.getWallet();
  if (wallet) {
    await wallet.dropOnline();
    await wallet.close();
  }
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT',  shutdown);
```

## Concurrent request safety

The `Wallet` class is **not thread-safe across concurrent `setOnline` calls**. For high-concurrency servers, use one of:

### Option A — Queue requests (simplest)

Use a request queue or semaphore so only one `Online` instance is active at a time:

```typescript
import { Mutex } from 'async-mutex';

const mutex = new Mutex();

app.get('/balance', async (req, res) => {
  const wallet = sdk.getWallet()!;
  await mutex.runExclusive(async () => {
    const online = await wallet.createOnline(false, INDEXER);
    try {
      await wallet.setOnline(online);
      const btc = await wallet.getBtcBalance(true);
      res.json(btc);
    } finally {
      await wallet.dropOnline(online);
    }
  });
});
```

### Option B — Per-user SDK instance

For multi-tenant systems where each user has their own mnemonic, create a separate `Orbis1SDK` instance per user and cache them:

```typescript
const sdkCache = new Map<string, Orbis1SDK>();

async function getSdkForUser(userId: string, mnemonic: string): Promise<Orbis1SDK> {
  if (sdkCache.has(userId)) return sdkCache.get(userId)!;

  const keys = await restoreKeys(BitcoinNetwork.TESTNET4, mnemonic);
  const userSdk = new Orbis1SDK({
    apiKey: process.env.ORBIS_API_KEY!,
    environment: Environment.TESTNET4,
    wallet: { enabled: true, keys },
    features: { gasFree: { enabled: true } },
  });
  await userSdk.initialize();

  sdkCache.set(userId, userSdk);
  return userSdk;
}
```

## Health check endpoint

```typescript
app.get('/health', async (_req, res) => {
  try {
    const wallet = sdk.getWallet()!;
    const online = await wallet.createOnline(false, INDEXER);
    await wallet.setOnline(online);
    await wallet.dropOnline(online);
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(503).json({ status: 'degraded', error: (err as Error).message });
  }
});
```
