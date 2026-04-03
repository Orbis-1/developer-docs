# Gas-Free Transfers

Gas-Free lets React Native app users send RGB assets without holding BTC for mining fees.

## Enable in config

```typescript
const sdk = new Orbis1SDK({
  apiKey: 'pk_test_your_key',
  environment: Environment.TESTNET4,
  wallet: { enabled: true, keys },
  features: {
    gasFree: {
      enabled: true,
      timeout: 30_000,
      maxRetries: 3,
    },
  },
});
await sdk.initialize();
```

## One-call API (recommended)

```typescript
const gasFree = sdk.gasFree();

const request = {
  userId: user.id,
  assetId: 'rgb:2dkSob9…',
  amount: '100250000',    // 100.25 tokens with precision 6
  recipientInvoice: recipientInvoice,
};

// Step 1: Quote
const quote = await gasFree.requestFeeQuote(request);
console.log(`Mining fee: ${quote.miningFeeSats} sats (paid by service)`);
console.log(`Service fee: ${quote.serviceFeeAmount} base units`);
console.log(`Expires: ${quote.expiresAt}`);

// Step 2: Confirm (full pipeline in one call)
const result = await gasFree.confirmTransfer(request, quote);
console.log('TXID:', result.txid);
console.log('Status:', result.status);   // 'verified' | 'pending_verification'
```

## React Native state integration

```typescript
import { useState } from 'react';

function SendScreen() {
  const [status, setStatus] = useState<string>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setStatus('requesting-quote');
    setError(null);

    try {
      const gasFree = sdk.gasFree();
      const request = { userId, assetId, amount, recipientInvoice };

      const quote = await gasFree.requestFeeQuote(request);
      setStatus('confirming');

      const result = await gasFree.confirmTransfer(request, quote);
      setStatus(result.status);
    } catch (err: any) {
      setError(err.message);
      setStatus('failed');
    }
  }

  // ...
}
```

## Advanced staged API

For fine-grained progress tracking or custom error recovery:

```typescript
const gasFree = sdk.gasFree();

// Stage 1: Quote
const quote = await gasFree.requestFeeQuote(request);

// Stage 2a: Build PSBT locally
const psbtResult = await gasFree.buildPSBT(request, quote);

// Stage 2b: Submit to service for co-signing
const submitResult = await gasFree.submitPSBT(
  quote.quoteId,
  psbtResult,
  quote.serviceFeeInvoice,
  request.assetId
);

// Stage 2c: Sign and broadcast
const broadcastResult = await gasFree.broadcastTransfer(submitResult.signedPsbtBase64);

// Stage 2d: Verify with service
const verifyResult = await gasFree.verifyTransfer(
  quote.quoteId,
  broadcastResult.txid,
  broadcastResult.userSignedPsbt
);
```

## Transfer state

```typescript
const state = gasFree.getState();
```

| `state.status` | Description |
|---|---|
| `'idle'` | No active transfer |
| `'quote-requested'` | Quote obtained |
| `'psbt-built'` | PSBT built locally |
| `'submitted'` | Sent to service for signing |
| `'broadcasted'` | Transaction broadcast |
| `'verified'` | Service confirmed success |
| `'failed'` | Failed — see `state.error` |

## Error handling in React Native

```typescript
import {
  QuoteExpiredError,
  GasFreeError,
  ServiceUnavailableError,
} from 'orbis1-sdk-rn';

try {
  const result = await gasFree.confirmTransfer(request, quote);
} catch (error) {
  if (error instanceof QuoteExpiredError) {
    // Show "Quote expired — re-quoting…" in UI, then retry
    const newQuote = await gasFree.requestFeeQuote(request);
    return gasFree.confirmTransfer(request, newQuote);
  }
  if (error instanceof ServiceUnavailableError) {
    Alert.alert('Service unavailable', 'Please try again later.');
    return;
  }
  if (error instanceof GasFreeError) {
    Alert.alert('Transfer failed', error.message);
    return;
  }
  throw error;
}
```

## Precision

All amounts are base units (integers). Convert for display:

```typescript
const precision = 6;
// To base units:
const baseUnits = Math.round(displayAmount * 10 ** precision);
// To display:
const display = baseUnits / 10 ** precision;
```

## Constraints

- Requires `wallet.enabled: true`
- Not available on `REGTEST`
- Quote expiry is typically ~5 minutes on testnet; confirm quickly after requesting
