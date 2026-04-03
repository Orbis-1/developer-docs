# Wallet

The `Wallet` class is the primary interface for all RGB operations. It is accessible via `sdk.getWallet()` once the SDK is initialized.

## Access wallet from SDK

```typescript
await sdk.initialize();  // must come first

const wallet = sdk.getWallet();
if (!wallet) throw new Error('Wallet not enabled in config');
```

## Online lifecycle

### Simple pattern (`goOnline`)

For scripts and CLI tools, `goOnline()` is the most convenient approach:

```typescript
const INDEXER = 'ssl://electrum.iriswallet.com:50053';

await wallet.goOnline(false, INDEXER);
await wallet.sync();

// … all wallet operations …

await wallet.dropOnline();
await wallet.close();
```

`goOnline(skipConsistencyCheck, indexerUrl)` combines `createOnline` + `setOnline` internally.

### Explicit pattern (`createOnline` / `setOnline` / `dropOnline`)

Server applications should manage the connection lifecycle explicitly to avoid leaking `Online` handles across requests:

```typescript
// Per-request handler (Express / Fastify / etc.)
async function handleTransferRequest(req, res) {
  const online = await wallet.createOnline(false, INDEXER);
  try {
    await wallet.setOnline(online);
    await wallet.sync();
    // … handle request …
  } finally {
    await wallet.dropOnline(online);  // always release
  }
}
```

| Method | Purpose |
|---|---|
| `goOnline(skip, url)` | One-call connect (simple) |
| `createOnline(skip, url)` | Create an `Online` handle without storing it |
| `setOnline(online)` | Register handle with wallet; network methods now work |
| `dropOnline(online?)` | Release handle; omit arg to drop managed connection |
| `close()` | Shut down wallet and free native resources |

## Balance

```typescript
// BTC balance (vanilla = non-RGB side, colored = RGB side)
const btc = await wallet.getBtcBalance();
// {
//   vanilla: { settled, future, spendable },
//   colored: { settled, future, spendable }
// }

// RGB asset balances
const assets = await wallet.listAssets([]);  // [] = all schemas
                                              // [AssetSchema.NIA] = NIA only
```

`getBtcBalance(skipSync?)` accepts an optional boolean flag.

## Create UTXOs

RGB operations require UTXOs dedicated to RGB allocations. Create them before issuing or receiving assets:

```typescript
await wallet.createUtxos(
  true,   // upTo: fill to num rather than create exactly num
  5,      // num: target UTXO count
  1000,   // size: satoshis per UTXO
  1.5     // feeRate: sat/vByte
);
```

Use `createUtxosBegin` / `createUtxosEnd` for external signing.

## Issue assets

### NIA (Non-Inflatable Asset)

```typescript
const nia = await wallet.issueAssetNia(
  'TUSDT',         // ticker
  'Test USDT',     // name
  6,               // precision (decimal places)
  [1_000_000_000]  // amounts (base units); each entry → separate UTXO
);
```

### CFA (Collectible Fungible Asset)

```typescript
const cfa = await wallet.issueAssetCfa(
  'My Token',       // name
  'A test CFA',     // details (nullable)
  6,                // precision
  [1_000_000],      // amounts (base units)
  null              // mediaFilePath (nullable)
);
```

### UDA (Unique Digital Asset — NFT)

```typescript
const uda = await wallet.issueAssetUda(
  'MYNFT',                // ticker
  'My NFT',               // name
  null,                   // details (nullable)
  0,                      // precision (typically 0)
  '/path/to/image.png',   // mediaFilePath (nullable)
  []                      // attachmentsFilePaths
);
```

### IFA (Inflatable Fungible Asset)

IFA supports minting additional supply. Not available on mainnet.

```typescript
const ifa = await wallet.issueAssetIfa(
  'IFA',         // ticker
  'Inflatable',  // name
  6,             // precision
  [1_000_000],   // initial amounts (base units)
  [500_000],     // inflationAmounts (max mintable per inflate call)
  1,             // replaceRightsNum
  null           // rejectListUrl (nullable)
);

// Mint additional supply later:
const result = await wallet.inflate(ifa.assetId, [200_000], 1.5, 1);
```

## Receive assets

### Blind receive (privacy-preserving)

```typescript
const receiveData = await wallet.blindReceive(
  null,                                              // assetId (null accepts any)
  { type: 'FUNGIBLE', amount: 100_000_000 },         // assignment
  null,                                              // durationSeconds (null = default)
  ['rpcs://proxy.iriswallet.com/0.2/json-rpc'],      // transport endpoints
  1                                                  // minConfirmations
);
console.log(receiveData.invoice);  // rgb:~/~/...
```

### Witness receive (address-based)

```typescript
const receiveData = await wallet.witnessReceive(
  null,
  { type: 'FUNGIBLE', amount: 100_000_000 },
  null,
  ['rpcs://proxy.iriswallet.com/0.2/json-rpc'],
  1
);
```

## Send assets

```typescript
const decoded = await wallet.decodeInvoice(recipientInvoice);

const recipientMap = {
  [assetId]: [
    {
      recipientId: decoded.recipientId,
      assignment: { type: 'FUNGIBLE', amount: 100_000_000 },
      transportEndpoints: decoded.transportEndpoints,
    },
  ],
};

const result = await wallet.send(
  recipientMap,
  true,  // donation (skip change output for gas-free compat)
  5,     // feeRate (sat/vByte)
  1      // minConfirmations
);
console.log(result.txid, result.batchTransferIdx);
```

## Refresh transfers

After sending or receiving, call `refresh` to pick up transfer state changes:

```typescript
const refreshed = await wallet.refresh(
  null,                                                        // assetId (null = all)
  [{ status: 'WAITING_COUNTERPARTY', incoming: true }],        // filter
  false                                                        // skipSync
);
```

## Transfer management

```typescript
// Mark stuck transfers as failed
await wallet.failTransfers(null, false);   // null = all batches

// Delete failed transfers
await wallet.deleteTransfers(null, false);
```

## List methods

```typescript
const unspents     = await wallet.listUnspents(false);        // settledOnly, skipSync?
const transfers    = await wallet.listTransfers(null);        // null = all assets
const transactions = await wallet.listTransactions();
const metadata     = await wallet.getAssetMetadata(assetId);
```

## PSBT staged flow

For custom signing (hardware wallets, external signers):

```typescript
// 1. Build unsigned PSBT
const unsignedPsbt = await wallet.sendBegin(
  recipientMap,
  true,   // donation
  5,      // feeRate
  1,      // minConfirmations
  null,   // externalInputs (used internally by Gas-Free)
  null    // externalOutputs
);

// 2. Sign with wallet keys
const signedPsbt = await wallet.signPsbt(unsignedPsbt);

// 3. Broadcast
const result = await wallet.sendEnd(signedPsbt);
```

`finalizePsbt(signedPsbt)` is available to separate finalization from broadcast.

## Backup and restore

```typescript
// Create encrypted backup
await wallet.backup('/path/to/backup.rgbwallet', 'strongPassword');

// Check if backup exists
const hasBak = await wallet.backupInfo();

// Restore at initialization time (before wallet use)
await Rgb.restoreBackup('/path/to/backup.rgbwallet', 'strongPassword', dataDir);
```

## Closing the wallet

Always close the wallet before process exit to avoid data corruption:

```typescript
process.on('SIGTERM', async () => {
  await wallet.dropOnline();
  await wallet.close();
  process.exit(0);
});
```
