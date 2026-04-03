# Wallet

The `Wallet` class is the primary interface for all RGB operations in React Native. Access it via `sdk.getWallet()` after `sdk.initialize()`.

## Access wallet

```typescript
await sdk.initialize();
const wallet = sdk.getWallet();
if (!wallet) throw new Error('Wallet not enabled in config');
```

## Online lifecycle

`goOnline` connects wallet to the indexer. Network-dependent operations (`sync`, `send`, `getBtcBalance`, `createUtxos`, etc.) require the wallet to be online.

```typescript
await wallet.goOnline('ssl://electrum.iriswallet.com:50053');
await wallet.sync();
```

### React Native pattern

Use `useEffect` to manage the lifecycle on component mount/unmount:

```typescript
useEffect(() => {
  let active = true;

  (async () => {
    await wallet.goOnline('ssl://electrum.iriswallet.com:50053');
    if (active) await wallet.sync();
  })();

  return () => {
    active = false;
    wallet.close().catch(console.error);
  };
}, [wallet]);
```

## Balance

```typescript
// BTC balance
const btc = await wallet.getBtcBalance();
// btc.vanilla.spendable, btc.vanilla.settled, btc.vanilla.future
// btc.colored.spendable, btc.colored.settled, btc.colored.future

// RGB assets
const assets = await wallet.listAssets([]);           // all schemas
const nias    = await wallet.listAssets([AssetSchema.NIA]);
```

`getBtcBalance(skipSync?)` takes an optional flag.

## Create UTXOs

RGB allocations live on dedicated UTXOs. Create them before issuing or receiving:

```typescript
await wallet.createUtxos(
  true,    // upTo (fill to target, not exact)
  5,       // target count
  1_000,   // sats per UTXO
  1.5      // feeRate (sat/vByte)
);
```

For external signing: `createUtxosBegin` / `createUtxosEnd`.

## Issue assets

### NIA

```typescript
const nia = await wallet.issueAssetNia(
  'TUSDT',           // ticker
  'Test USDT',       // name
  6,                 // precision
  [1_000_000_000]    // amounts (base units)
);
```

### CFA

```typescript
const cfa = await wallet.issueAssetCfa(
  'My Token', 'A CFA token', 6, [1_000_000], null
);
```

### UDA

```typescript
const uda = await wallet.issueAssetUda(
  'MYNFT', 'My NFT', null, 0, null, []
);
```

### IFA (non-mainnet)

```typescript
const ifa = await wallet.issueAssetIfa(
  'IFA', 'Inflatable', 6, [1_000_000], [500_000], 1, null
);
await wallet.inflate(ifa.assetId, [200_000], 1.5, 1);
```

## Receive

### Blind receive

```typescript
const receiveData = await wallet.blindReceive(
  assetId,                                                 // null = any
  { type: 'FUNGIBLE', amount: 100_000_000 },
  null,
  ['rpcs://proxy.iriswallet.com/0.2/json-rpc'],
  1
);
console.log(receiveData.invoice);   // share with sender
```

### Witness receive

```typescript
const receiveData = await wallet.witnessReceive(
  assetId,
  { type: 'FUNGIBLE', amount: 100_000_000 },
  null,
  ['rpcs://proxy.iriswallet.com/0.2/json-rpc'],
  1
);
```

## Send

```typescript
const decoded = await wallet.decodeInvoice(recipientInvoice);

const recipientMap = {
  [assetId]: [{
    recipientId: decoded.recipientId,
    assignment: { type: 'FUNGIBLE', amount: 100_000_000 },
    transportEndpoints: decoded.transportEndpoints,
  }],
};

const result = await wallet.send(recipientMap, true, 5, 1);
console.log(result.txid);
```

## Refresh and transfer management

```typescript
// Refresh to pick up incoming/outgoing status changes
await wallet.refresh(
  null,
  [{ status: 'WAITING_COUNTERPARTY', incoming: true }],
  false
);

// List transfers
const transfers = await wallet.listTransfers(assetId);

// Cleanup stuck transfers
await wallet.failTransfers(null, false);
await wallet.deleteTransfers(null, false);
```

## PSBT staged flow (external signers)

```typescript
const unsignedPsbt = await wallet.sendBegin(recipientMap, true, 5, 1, null, null);
const signedPsbt   = await wallet.signPsbt(unsignedPsbt);
const result       = await wallet.sendEnd(signedPsbt);
```

## Backup

```typescript
await wallet.backup('/path/to/backup.rgb', 'password');
const exists = await wallet.backupInfo();
```

## Closing

Call `close()` when the component unmounts or app goes to background:

```typescript
await wallet.close();
```
