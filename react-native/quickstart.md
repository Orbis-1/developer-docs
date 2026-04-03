# Quick Start

A minimal 5-step flow from key generation to BTC balance query.

## Step 1 — Generate keys

```typescript
import { generateKeys, BitcoinNetwork } from 'orbis1-sdk-rn';

// New wallet
const keys = await generateKeys(BitcoinNetwork.TESTNET4);

// Restore existing wallet from mnemonic
// const keys = await restoreKeys(BitcoinNetwork.TESTNET4, 'word1 word2 ...');
```

Store `keys.mnemonic` securely (e.g., React Native Keychain). Never commit mnemonics.

## Step 2 — Initialize SDK

```typescript
import { Orbis1SDK, Environment, AssetSchema, LogLevel } from 'orbis1-sdk-rn';

const sdk = new Orbis1SDK({
  apiKey: 'pk_test_your_key',
  environment: Environment.TESTNET4,
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
```

## Step 3 — Go online and sync

```typescript
const wallet = sdk.getWallet()!;

await wallet.goOnline('ssl://electrum.iriswallet.com:50053');
await wallet.sync();
```

## Step 4 — Query balances

```typescript
const btc = await wallet.getBtcBalance();
console.log('Spendable BTC:', btc.vanilla.spendable, 'sats');

const assets = await wallet.listAssets([]);
console.log('NIA count:', assets.nia?.length ?? 0);
```

## Step 5 — Cleanup (on unmount)

```typescript
// In React Native: inside useEffect cleanup
useEffect(() => {
  let mounted = true;
  (async () => {
    if (!mounted) return;
    await wallet.goOnline('ssl://electrum.iriswallet.com:50053');
    await wallet.sync();
  })();

  return () => {
    mounted = false;
    wallet.close().catch(console.error);
  };
}, [wallet]);
```

## React hook pattern

```typescript
import { useEffect, useRef, useState } from 'react';
import { Orbis1SDK, generateKeys, BitcoinNetwork, Environment } from 'orbis1-sdk-rn';

export function useSdk() {
  const sdkRef = useRef<Orbis1SDK | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const keys = await generateKeys(BitcoinNetwork.TESTNET4);
      const sdk = new Orbis1SDK({
        apiKey: 'pk_test_your_key',
        environment: Environment.TESTNET4,
        wallet: { enabled: true, keys },
        features: { gasFree: { enabled: true } },
      });
      await sdk.initialize();
      const wallet = sdk.getWallet()!;
      await wallet.goOnline('ssl://electrum.iriswallet.com:50053');
      await wallet.sync();

      if (!active) { await wallet.close(); return; }
      sdkRef.current = sdk;
      setReady(true);
    })();

    return () => {
      active = false;
      sdkRef.current?.getWallet()?.close().catch(console.error);
    };
  }, []);

  return { sdk: sdkRef.current, ready };
}
```

## Key conventions

| Rule | Detail |
|---|---|
| `initialize()` first | Call before `getWallet()` / `gasFree()` / `watchTower()` |
| `goOnline()` before network ops | `sync`, `send`, `getBtcBalance`, etc. require an online connection |
| amounts in base units | Integers only; convert with `base / 10 ** precision` for display |
| cleanup on unmount | Call `wallet.close()` in your `useEffect` return / component unmount |
