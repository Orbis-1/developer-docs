# Gas-Free Transfers

Gas-Free lets users send RGB assets without holding BTC for mining fees. The service provides BTC inputs; the user contributes only the RGB asset being transferred.

## How it works

```
User                    Service
 │                          │
 │── requestFeeQuote ──────>│
 │<─ FeeQuote (expiresAt) ──│
 │                          │
 │── buildPSBT (local) ─────┤ (user builds PSBT with service UTXOs from quote)
 │── submitPSBT ───────────>│
 │<─ serviceSigned PSBT ────│
 │                          │
 │── broadcastTransfer──────┤ (user signs their inputs, broadcasts)
 │── verifyTransfer ────────>│
 │<─ { status: "verified" }─│
```

## Enable in config

```typescript
const sdk = new Orbis1SDK({
  apiKey: process.env.ORBIS_API_KEY!,
  environment: Environment.TESTNET4,
  wallet: { enabled: true, keys },
  features: {
    gasFree: { enabled: true, timeout: 30_000 },
  },
});
await sdk.initialize();
```

## One-call API (recommended)

For most use cases, use `confirmTransfer` — it runs the full flow:

```typescript
const gasFree = sdk.gasFree();

// Step 1: Get a quote
const quote = await gasFree.requestFeeQuote({
  userId: 'user-123',
  assetId: 'rgb:2dkSob9…',
  amount: '100250000',       // base units (precision 6 → 100.25 tokens)
  recipientInvoice: 'rgb:~/~/…',
  numInputs: 1,              // optional
  numOutputs: 2,             // optional
});

console.log(`Fee: ${quote.miningFeeSats} sats (expires ${quote.expiresAt})`);
console.log(`Service fee: ${quote.serviceFeeAmount} base units`);

// Step 2: Confirm (builds PSBT → submits → signs → broadcasts → verifies)
const result = await gasFree.confirmTransfer(
  {
    userId: 'user-123',
    assetId: 'rgb:2dkSob9…',
    amount: '100250000',
    recipientInvoice: 'rgb:~/~/…',
  },
  quote
);

console.log(`Broadcast txid: ${result.txid}`);
console.log(`Status: ${result.status}`);       // 'verified' | 'pending_verification'
```

## `FeeQuote` structure

| Field | Type | Description |
|---|---|---|
| `quoteId` | `string` | Unique quote identifier |
| `expiresAt` | `string` (ISO 8601) | Quote expiry time |
| `miningFeeSats` | `number` | BTC mining fee covered by service |
| `feeRateSatPerVByte` | `number` | Fee rate used for PSBT construction |
| `serviceFeeAmount` | `string` | RGB fee charged to user (base units) |
| `serviceFeeInvoice` | `string` | RGB invoice for service fee |
| `serviceFeeRecipientId` | `string` | Recipient ID for service fee |
| `miningUTXO` | `object` | Service-provided BTC input UTXO |
| `miningChangeUTXO` | `object` | Service-provided BTC change output |
| `status` | `string` | `'pending' \| 'accepted' \| 'expired' \| 'completed' \| 'failed'` |

## Amount and `numInputs`/`numOutputs` note

`amount` and `recipientInvoice` are stored locally and used in `buildPSBT` — they are **not** forwarded to the service when generating the quote. The service prices based on `numInputs` and `numOutputs` only.

## Advanced staged API

Call individual stages for fine-grained control, retries, or UI progress updates:

```typescript
const gasFree = sdk.gasFree();

// Stage 1: Get quote (same as above)
const quote = await gasFree.requestFeeQuote({ userId, assetId, amount, recipientInvoice });

// Stage 2a: Build unsigned PSBT locally (includes service mining UTXOs from quote)
const psbtResult = await gasFree.buildPSBT(
  { userId, assetId, amount, recipientInvoice },
  quote
);
// psbtResult: { unsignedPsbt: string, miningFee: number, externalInputs: [...] }

// Stage 2b: Submit unsigned PSBT + consignment to service for co-signing
const submitResult = await gasFree.submitPSBT(
  quote.quoteId,
  psbtResult,
  quote.serviceFeeInvoice,
  assetId
);
// submitResult: { signedPsbtBase64, transactionId, consignmentBase64, ... }

// Stage 2c: Sign user RGB inputs and broadcast
const broadcastResult = await gasFree.broadcastTransfer(submitResult.signedPsbtBase64);
// broadcastResult: { txid, userSignedPsbt }

// Stage 2d: Notify service of successful broadcast
const verifyResult = await gasFree.verifyTransfer(
  quote.quoteId,
  broadcastResult.txid,
  broadcastResult.userSignedPsbt
);
// verifyResult: { status, inMempool, message, transactionId, verifiedAt, quoteId }
```

`verifyResult.status` values: `'verified' | 'pending_verification' | 'failed' | 'errored'`

## Transfer state

Poll `getState()` to display progress in UI or logs:

```typescript
const state = gasFree.getState();
```

| `state.status` | Meaning |
|---|---|
| `'idle'` | No transfer in progress |
| `'quote-requested'` | Quote obtained, waiting for confirmation |
| `'psbt-built'` | PSBT constructed locally |
| `'submitted'` | PSBT sent to service; awaiting co-signing |
| `'broadcasted'` | Transaction broadcast to network |
| `'verified'` | Service confirmed receipt |
| `'failed'` | Transfer failed; see `state.error` |

`state.quoteId` and `state.txid` are populated at the relevant stages.

## Error handling

```typescript
import {
  GasFreeError,
  GasFreeErrorCode,
  QuoteExpiredError,
  InvalidPSBTError,
  ConsignmentVerificationError,
  ServiceUnavailableError,
} from 'orbis1-sdk-node';

try {
  const result = await gasFree.confirmTransfer(request, quote);
} catch (error) {
  if (error instanceof QuoteExpiredError) {
    // Quote expired — re-request a fresh quote
    const newQuote = await gasFree.requestFeeQuote(request);
    return gasFree.confirmTransfer(request, newQuote);
  }
  if (error instanceof ServiceUnavailableError) {
    console.error('Service unreachable:', error.message);
  }
  if (error instanceof GasFreeError) {
    console.error(`Gas-Free error [${error.gasFreeCode}]:`, error.message);
  }
  throw error;
}
```

## Precision handling

All monetary values are in base units (integer strings):

| Value | Precision 6 display |
|---|---|
| `"100250000"` | 100.25 tokens |
| `"1000000"` | 1.00 token |

Convert for display: `Number(baseUnits) / 10 ** precision`

## Constraints

- Gas-Free requires `wallet.enabled: true`.
- Gas-Free is not available in `REGTEST`.
- Quotes expire — always check `quote.expiresAt` before calling `confirmTransfer`.
