# Basic Usage

A minimal React Native component that initialises the SDK, goes online, and displays the BTC balance.

## SDK context (singleton pattern)

The recommended pattern: create one SDK instance at app startup and provide it via React Context.

```typescript
// sdk/SdkContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  Orbis1SDK,
  generateKeys,
  BitcoinNetwork,
  Environment,
  AssetSchema,
  LogLevel,
} from 'orbis1-sdk-rn';

const INDEXER = 'ssl://electrum.iriswallet.com:50053';

interface SdkContextValue {
  sdk: Orbis1SDK | null;
  ready: boolean;
  error: string | null;
}

const SdkContext = createContext<SdkContextValue>({ sdk: null, ready: false, error: null });

export function SdkProvider({ children }: { children: React.ReactNode }) {
  const sdkRef = useRef<Orbis1SDK | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const keys = await generateKeys(BitcoinNetwork.TESTNET4);

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
        const wallet = sdk.getWallet()!;
        await wallet.goOnline(INDEXER);
        await wallet.sync();

        if (!active) { await wallet.close(); return; }
        sdkRef.current = sdk;
        setReady(true);
      } catch (err: any) {
        if (active) setError(err.message);
      }
    })();

    return () => {
      active = false;
      sdkRef.current?.getWallet()?.close().catch(console.error);
    };
  }, []);

  return (
    <SdkContext.Provider value={{ sdk: sdkRef.current, ready, error }}>
      {children}
    </SdkContext.Provider>
  );
}

export const useSdk = () => useContext(SdkContext);
```

## Balance screen

```typescript
// screens/BalanceScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useSdk } from '../sdk/SdkContext';

export function BalanceScreen() {
  const { sdk, ready } = useSdk();
  const [spendable, setSpendable] = useState<number | null>(null);

  useEffect(() => {
    if (!ready || !sdk) return;
    sdk.getWallet()!
      .getBtcBalance(true)  // skipSync=true (already synced in provider)
      .then((b) => setSpendable(b.vanilla.spendable))
      .catch(console.error);
  }, [ready, sdk]);

  if (!ready) return <ActivityIndicator />;

  return (
    <View>
      <Text>Spendable: {spendable ?? '…'} sats</Text>
    </View>
  );
}
```

## App entry

```typescript
// App.tsx
import React from 'react';
import { SdkProvider } from './sdk/SdkContext';
import { BalanceScreen } from './screens/BalanceScreen';

export default function App() {
  return (
    <SdkProvider>
      <BalanceScreen />
    </SdkProvider>
  );
}
```
