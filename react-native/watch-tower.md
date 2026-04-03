# Watch Tower

Watch Tower registers RGB invoices with the Orbis1 service so incoming transfers are monitored server-side — keeping your app aware of transfers even when it is in the background.

## Enable in config

```typescript
const sdk = new Orbis1SDK({
  apiKey: 'pk_test_your_key',
  environment: Environment.TESTNET4,
  features: {
    watchTower: { enabled: true },
  },
});
await sdk.initialize();
```

Watch Tower does **not** require `wallet.enabled`.

## Register an invoice

Call `addToWatchTower` immediately after generating a receive invoice:

```typescript
const receiveData = await wallet.blindReceive(
  assetId,
  { type: 'FUNGIBLE', amount: 1_000_000 },
  null,
  ['rpcs://proxy.iriswallet.com/0.2/json-rpc'],
  1
);

// Register with Watch Tower
await sdk.watchTower().addToWatchTower(receiveData.invoice);

console.log('Monitoring:', receiveData.invoice);
```

## FCM push notifications

Provide a Firebase Cloud Messaging token to receive push notifications when a monitored transfer arrives:

```typescript
import messaging from '@react-native-firebase/messaging';

const fcmToken = await messaging().getToken();
sdk.watchTower().setFcmToken(fcmToken);

// Token is included in subsequent addToWatchTower calls
await sdk.watchTower().addToWatchTower(receiveData.invoice);
```

## Full example with React Native lifecycle

```typescript
import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';

function ReceiveScreen({ sdk, assetId }) {
  const [invoice, setInvoice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      // Set FCM token
      const fcmToken = await messaging().getToken();
      sdk.watchTower().setFcmToken(fcmToken);

      const wallet = sdk.getWallet()!;
      const receiveData = await wallet.blindReceive(
        assetId,
        { type: 'FUNGIBLE', amount: 1_000_000 },
        null,
        ['rpcs://proxy.iriswallet.com/0.2/json-rpc'],
        1
      );

      if (!active) return;
      setInvoice(receiveData.invoice);

      // Monitor even if app goes to background
      await sdk.watchTower().addToWatchTower(receiveData.invoice);
    })();

    return () => { active = false; };
  }, [sdk, assetId]);

  return <QRCode value={invoice ?? ''} />;
}
```

## Error handling

```typescript
try {
  await sdk.watchTower().addToWatchTower(invoice);
} catch (error) {
  const err = error as Error & { status?: number; data?: unknown };
  console.error(`Watch Tower [${err.status}]:`, err.message, err.data);
}
```

## Polling note

::: warning No background polling
`pollingInterval` is accepted by Zod config validation but **background polling is not currently implemented**. Always call `addToWatchTower()` explicitly after generating each invoice instead of relying on automatic re-registration.
:::
