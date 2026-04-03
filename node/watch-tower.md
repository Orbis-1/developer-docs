# Watch Tower

Watch Tower registers RGB invoices with the Orbis1 Watch Tower service so that incoming transfers are monitored server-side. When a transfer arrives, the service can deliver push notifications (via FCM) or update transfer status.

## Enable in config

```typescript
const sdk = new Orbis1SDK({
  apiKey: process.env.ORBIS_API_KEY!,
  environment: Environment.TESTNET4,
  features: {
    watchTower: { enabled: true },
  },
});
await sdk.initialize();
```

Watch Tower does **not** require `wallet.enabled`.

## Register an invoice

```typescript
const watchTower = sdk.watchTower();

const response = await watchTower.addToWatchTower('rgb:~/~/…');
```

Call `addToWatchTower` after generating an invoice with `blindReceive` or `witnessReceive` to ensure the transfer is monitored even when the app is offline.

## Push notifications (FCM)

Set a Firebase Cloud Messaging token to receive push notifications when a monitored transfer lands:

```typescript
watchTower.setFcmToken(fcmToken);

// Now registering an invoice will include the FCM token in the payload
await watchTower.addToWatchTower(invoice);
```

Tokens are stored in memory and included in subsequent `addToWatchTower` calls.

## Error handling

The service returns non-2xx responses as enriched errors with `.status` and `.data` fields:

```typescript
try {
  await watchTower.addToWatchTower(invoice);
} catch (error) {
  const err = error as Error & { status?: number; data?: unknown };
  console.error(`Watch Tower error ${err.status}:`, err.message, err.data);
}
```

## Polling

::: warning No background polling
`pollingInterval` is accepted by Zod validation but **background polling is not currently implemented**. Call `addToWatchTower` explicitly after generating each invoice. Use your app's own background task mechanism if periodic re-registration is needed.
:::

## Complete example

```typescript
import { Orbis1SDK, Environment } from 'orbis1-sdk-node';

const sdk = new Orbis1SDK({
  apiKey: process.env.ORBIS_API_KEY!,
  environment: Environment.TESTNET4,
  wallet: { enabled: true, keys },
  features: {
    watchTower: { enabled: true },
    gasFree: { enabled: true },
  },
});
await sdk.initialize();

const wallet = sdk.getWallet()!;
await wallet.goOnline(false, 'ssl://electrum.iriswallet.com:50053');

const receiveData = await wallet.blindReceive(
  assetId,
  { type: 'FUNGIBLE', amount: 1_000_000 },
  null,
  ['rpcs://proxy.iriswallet.com/0.2/json-rpc'],
  1
);

// Register with Watch Tower immediately after generating the invoice
await sdk.watchTower().addToWatchTower(receiveData.invoice);

console.log('Invoice registered for monitoring:', receiveData.invoice);
```
