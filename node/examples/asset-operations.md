# Asset Operations

Issuing, receiving, and transferring RGB assets: NIA, CFA, UDA, and IFA.

## Setup (common)

```typescript
import {
  Orbis1SDK,
  restoreKeys,
  BitcoinNetwork,
  Environment,
  AssetSchema,
} from 'orbis1-sdk-node';

const sdk = new Orbis1SDK({
  apiKey: process.env.ORBIS_API_KEY!,
  environment: Environment.TESTNET4,
  wallet: {
    enabled: true,
    keys: await restoreKeys(BitcoinNetwork.TESTNET4, process.env.MNEMONIC!),
    supportedSchemas: [AssetSchema.NIA, AssetSchema.CFA, AssetSchema.UDA],
  },
});
await sdk.initialize();

const wallet = sdk.getWallet()!;
await wallet.goOnline(false, 'ssl://electrum.iriswallet.com:50053');
await wallet.sync();
```

## Prepare: create RGB UTXOs

RGB allocations live on UTXOs. Run this before first issuance and after spending vanilla UTXOs:

```typescript
try {
  await wallet.createUtxos(
    true,   // upTo (fill to target, not exact)
    5,      // target count
    1_000,  // size per UTXO (sats)
    1.5     // feeRate (sat/vByte)
  );
  await wallet.sync();
  console.log('UTXOs ready');
} catch (err: any) {
  if (!err.message?.includes('AllocationsAlreadyAvailable')) throw err;
}
```

## Issue NIA (fungible)

```typescript
const precision = 6;
const displaySupply = 1_000;   // 1000.000000 TUSDT
const baseSupply = displaySupply * 10 ** precision;  // 1_000_000_000

const nia = await wallet.issueAssetNia(
  'TUSDT',           // ticker
  'Test USDT',       // name
  precision,
  [baseSupply]       // amounts array; each entry → separate allocation
);

console.log('Asset ID:', nia.assetId);
console.log('Supply:  ', nia.issuedSupply / 10 ** precision, nia.ticker);
```

## Issue CFA (fungible with media)

```typescript
const cfa = await wallet.issueAssetCfa(
  'My Token',
  'A collectible fungible token',
  6,
  [1_000_000],
  '/path/to/media.png'   // optional — null if no media
);
```

## Issue UDA (NFT)

```typescript
const uda = await wallet.issueAssetUda(
  'MYNFT',
  'My Non-Fungible Token',
  null,                         // details (nullable)
  0,                            // precision 0 for NFTs
  '/path/to/thumbnail.png',     // mediaFilePath (nullable)
  ['/path/to/attachment.pdf']   // attachmentsFilePaths
);
```

## Issue IFA (inflatable — non-mainnet only)

```typescript
const ifa = await wallet.issueAssetIfa(
  'MYIFA',
  'Inflatable Token',
  6,
  [1_000_000],    // initial amounts
  [500_000],      // inflation rights per inflate call
  1,              // replaceRightsNum
  null            // optional rejectListUrl
);

// Inflate later (mint additional allocations):
await wallet.inflate(ifa.assetId, [200_000], 1.5, 1);
```

## List assets and read balances

```typescript
// All schemas
const all = await wallet.listAssets([]);
console.log('NIA count:', all.nia?.length ?? 0);
console.log('CFA count:', all.cfa?.length ?? 0);
console.log('UDA count:', all.uda?.length ?? 0);

// Specific schema
const nias = await wallet.listAssets([AssetSchema.NIA]);

// Metadata for one asset
const meta = await wallet.getAssetMetadata(assetId);
console.log('Precision:', meta.precision);
console.log('Schema:   ', meta.schema);
```

## Receive an asset

```typescript
const PROXY = 'rpcs://proxy.iriswallet.com/0.2/json-rpc';

const receiveData = await wallet.blindReceive(
  assetId,                                                 // null to accept any
  { type: 'FUNGIBLE', amount: 100_000_000 },               // 100 tokens (prec=6)
  null,                                                    // expiry secs (null = default)
  [PROXY],
  1                                                        // minConfirmations
);

console.log('Invoice:', receiveData.invoice);
```

Share `receiveData.invoice` with the sender.

## Normal (non-Gas-Free) transfer

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
  true,   // donation (no change output — compatible with gas-free PSBTs)
  5,      // feeRate (sat/vByte)
  1       // minConfirmations
);

console.log('TXID:', result.txid);
```

## Refresh transfer status

```typescript
// After sending, poll to track the transfer to completion
const refreshed = await wallet.refresh(
  assetId,
  [{ status: 'WAITING_COUNTERPARTY', incoming: false }],
  false
);
console.log(refreshed);
```

## Transfer history

```typescript
const transfers = await wallet.listTransfers(assetId);   // null = all
for (const t of transfers) {
  console.log(t.status, t.batchTransferIdx, t.amount ?? '—');
}
```

## Cleanup stuck transfers

```typescript
// Mark stale as failed
await wallet.failTransfers(null, false);

// Delete failed
await wallet.deleteTransfers(null, false);
```

## Base unit conversion reference

```typescript
// To base units for SDK calls:
const baseUnits = Math.round(displayAmount * 10 ** precision);

// From base units for display:
const displayAmount = baseUnits / 10 ** precision;

// Example: 100.25 TUSDT (precision=6) → 100_250_000 base units
```
