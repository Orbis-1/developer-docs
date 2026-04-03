# Gas-Free Transfer

A full end-to-end script: sender issues an asset and sends it to a recipient using Gas-Free, with no BTC mining fees paid by either party.

## Prerequisites

- Both sender and recipient have a funded Testnet4 wallet (for vanilla BTC needed for UTXOs — not for gas).
- Sender has RGB UTXOs available (`createUtxos`).
- Recipient has generated a `blindReceive` or `witnessReceive` invoice.

## Sender script

```typescript
import {
  Orbis1SDK,
  restoreKeys,
  BitcoinNetwork,
  Environment,
  AssetSchema,
  LogLevel,
} from 'orbis1-sdk-node';

const INDEXER = 'ssl://electrum.iriswallet.com:50053';
const PROXY   = 'rpcs://proxy.iriswallet.com/0.2/json-rpc';

async function senderMain(recipientInvoice: string, existingAssetId?: string) {
  const keys = await restoreKeys(BitcoinNetwork.TESTNET4, process.env.MNEMONIC!);

  const sdk = new Orbis1SDK({
    apiKey: process.env.ORBIS_API_KEY!,
    environment: Environment.TESTNET4,
    wallet: { enabled: true, keys },
    features: {
      gasFree: { enabled: true, timeout: 30_000 },
    },
    logging: { level: LogLevel.INFO },
  });

  await sdk.initialize();
  const wallet = sdk.getWallet()!;
  await wallet.goOnline(false, INDEXER);
  await wallet.sync();

  // ── Ensure UTXOs exist ───────────────────────────────────────────────────
  try {
    await wallet.createUtxos(true, 5, 1_000, 2);
    await wallet.sync();
  } catch (err: any) {
    if (!err.message?.includes('AllocationsAlreadyAvailable')) throw err;
    console.log('UTXOs already present');
  }

  // ── Issue or reuse asset ─────────────────────────────────────────────────
  let assetId = existingAssetId;
  if (!assetId) {
    const asset = await wallet.issueAssetNia('TUSDT', 'Test USDT', 6, [1_000_000_000]);
    assetId = asset.assetId;
    console.log('Issued asset:', assetId);
  }

  // ── Gas-Free transfer ────────────────────────────────────────────────────
  const gasFree = sdk.gasFree();
  const AMOUNT  = '100250000'; // 100.25 TUSDT (precision 6)

  const request = {
    userId: 'demo-sender',
    assetId,
    amount: AMOUNT,
    recipientInvoice,
  };

  console.log('Requesting fee quote…');
  const quote = await gasFree.requestFeeQuote(request);
  console.log(`Quote expires: ${quote.expiresAt}`);
  console.log(`Mining fee:    ${quote.miningFeeSats} sats (paid by service)`);
  console.log(`Service fee:   ${quote.serviceFeeAmount} base units`);

  console.log('Confirming transfer…');
  const result = await gasFree.confirmTransfer(request, quote);

  console.log('Transfer broadcasted!');
  console.log('TXID:   ', result.txid);
  console.log('Status: ', result.status);

  await wallet.dropOnline();
  await wallet.close();
}

const [invoice, assetId] = process.argv.slice(2);
if (!invoice) {
  console.error('Usage: ts-node sender.ts <recipientInvoice> [assetId]');
  process.exit(1);
}

senderMain(invoice, assetId).catch(console.error);
```

## Recipient script

```typescript
import {
  Orbis1SDK,
  restoreKeys,
  BitcoinNetwork,
  Environment,
} from 'orbis1-sdk-node';

const INDEXER = 'ssl://electrum.iriswallet.com:50053';
const PROXY   = 'rpcs://proxy.iriswallet.com/0.2/json-rpc';

async function recipientMain(assetId: string) {
  const keys = await restoreKeys(BitcoinNetwork.TESTNET4, process.env.MNEMONIC!);

  const sdk = new Orbis1SDK({
    apiKey: process.env.ORBIS_API_KEY!,
    environment: Environment.TESTNET4,
    wallet: { enabled: true, keys },
  });

  await sdk.initialize();
  const wallet = sdk.getWallet()!;
  await wallet.goOnline(false, INDEXER);
  await wallet.sync();

  // Generate receive invoice
  const receiveData = await wallet.blindReceive(
    assetId,
    { type: 'FUNGIBLE', amount: 100_250_000 },
    null,
    [PROXY],
    1
  );

  console.log('Invoice (give this to sender):');
  console.log(receiveData.invoice);
  console.log('Expires:', receiveData.expiration);

  await wallet.dropOnline();
  await wallet.close();
}

const [assetId] = process.argv.slice(2);
if (!assetId) {
  console.error('Usage: ts-node recipient.ts <assetId>');
  process.exit(1);
}

recipientMain(assetId).catch(console.error);
```

## Run order

```bash
# 1. Recipient generates invoice
MNEMONIC="..." ORBIS_API_KEY="pk_test_..." npx ts-node recipient.ts rgb:2dkSob9…

# 2. Sender sends to the printed invoice (optionally issue new asset)
MNEMONIC="..." ORBIS_API_KEY="pk_test_..." npx ts-node sender.ts "rgb:~/~/..." [assetId]
```

## Error handling

```typescript
import {
  QuoteExpiredError,
  GasFreeError,
  ServiceUnavailableError,
} from 'orbis1-sdk-node';

try {
  const result = await gasFree.confirmTransfer(request, quote);
} catch (error) {
  if (error instanceof QuoteExpiredError) {
    // Re-quote: quote lifespan on testnet is ~5 minutes
    const freshQuote = await gasFree.requestFeeQuote(request);
    return gasFree.confirmTransfer(request, freshQuote);
  }
  if (error instanceof ServiceUnavailableError) {
    console.error('Service offline. Retry later.');
  }
  throw error;
}
```
