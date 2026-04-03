# Error Codes

Complete reference for all errors thrown by the Orbis1 SDK.

## Error hierarchy

```
Error
└── OrbisError                  (base for all SDK errors)
    ├── ConfigurationError      (bad config at construction time)
    ├── FeatureNotEnabledError  (accessor called for disabled feature)
    └── GasFreeError            (base for all gas-free errors)
        ├── QuoteExpiredError
        ├── InvalidPSBTError
        ├── ConsignmentVerificationError
        └── ServiceUnavailableError
```

## `OrbisError`

Base class for all SDK errors. All other SDK errors extend this.

```typescript
import { OrbisError, OrbisErrorCode } from 'orbis1-sdk-node'; // or orbis1-sdk-rn
```

### `OrbisErrorCode`

| Code | Description |
|---|---|
| `UNKNOWN` | Unclassified error |
| `CONFIGURATION` | Invalid SDK configuration |
| `INITIALIZATION` | SDK or feature failed to initialize |
| `FEATURE_NOT_ENABLED` | Accessor called for a disabled feature |
| `FEATURE_NOT_FOUND` | Feature was not registered |
| `INVALID_OPERATION` | Operation not permitted in current state |
| `PLATFORM` | Platform-level (native binding) error |
| `BINDING` | RGB native binding error |
| `NETWORK` | Network/connectivity error |
| `VALIDATION` | Input validation failed |

### OrbisError properties

| Property | Type | Description |
|---|---|---|
| `message` | `string` | Human-readable description |
| `code` | `OrbisErrorCode` | Structured error code |
| `originalError` | `Error \| undefined` | Underlying error if wrapping another |
| `context` | `Record<string, unknown> \| undefined` | Additional context data |
| `timestamp` | `number` | Unix ms timestamp when error occurred |

## `ConfigurationError`

Thrown when `SDKConfig` fails Zod validation or contains logically invalid values.

```typescript
import { ConfigurationError } from 'orbis1-sdk-node';

try {
  const sdk = new Orbis1SDK({ apiKey: 'bad-key', environment: Environment.MAINNET });
} catch (err) {
  if (err instanceof ConfigurationError) {
    console.error('Config errors:', err.validationErrors);
  }
}
```

**Common causes:**
- API key prefix mismatch (`pk_test_` with `MAINNET`, or `sk_live_` with `TESTNET4`)
- `wallet.enabled: true` but `keys` missing
- Unknown `environment` value

## `FeatureNotEnabledError`

Thrown when calling `sdk.gasFree()` or `sdk.watchTower()` if that feature was not enabled in config.

```typescript
import { FeatureNotEnabledError } from 'orbis1-sdk-node';

try {
  sdk.gasFree();
} catch (err) {
  if (err instanceof FeatureNotEnabledError) {
    console.error('Enable gasFree in SDKConfig.features');
  }
}
```

**Fix:** Add `features: { gasFree: { enabled: true } }` to `SDKConfig`.

## `GasFreeError`

Base class for all Gas-Free errors. Check `gasFreeCode` for specific failure reason.

```typescript
import { GasFreeError, GasFreeErrorCode } from 'orbis1-sdk-node';
```

### `GasFreeErrorCode`

| Code | Description | Resolution |
|---|---|---|
| `QUOTE_EXPIRED` | Quote TTL elapsed before `confirmTransfer` | Re-request a fresh quote |
| `INVALID_PSBT` | PSBT byte parsing or structure invalid | Check PSBT construction; report if unexpected |
| `PSBT_BUILD_FAILED` | Failed to build PSBT in `buildPSBT` | Check wallet has UTXOs and valid asset allocation |
| `CONSIGNMENT_VERIFICATION_FAILED` | Consignment TXID mismatch | Potential service issue; retry or report |
| `INVALID_REQUEST` | Request parameters missing or malformed | Check `userId`, `assetId`, `amount`, `recipientInvoice` |
| `SERVICE_UNAVAILABLE` | HTTP 5xx or connection refused | Retry after delay; check service status |
| `BACKEND_SIGNING_FAILED` | Service refused to co-sign PSBT | Service-side validation error; check quote validity |
| `BROADCAST_FAILED` | PSBT broadcast to network failed | Check wallet connectivity; retry |
| `TIMEOUT` | HTTP request exceeded configured timeout | Increase `features.gasFree.timeout`; check connectivity |
| `INSUFFICIENT_FUNDS` | Not enough RGB asset balance in allocation | Top up asset balance; check `listAssets` |
| `UNKNOWN` | Unclassified Gas-Free error | Inspect `originalError` and `context` |

## `QuoteExpiredError`

Subclass of `GasFreeError` with `gasFreeCode === 'QUOTE_EXPIRED'`. The most common recoverable error:

```typescript
import { QuoteExpiredError } from 'orbis1-sdk-node';

try {
  await gasFree.confirmTransfer(request, quote);
} catch (err) {
  if (err instanceof QuoteExpiredError) {
    const newQuote = await gasFree.requestFeeQuote(request);
    return gasFree.confirmTransfer(request, newQuote);
  }
  throw err;
}
```

## `ServiceUnavailableError`

Thrown when the Orbis1 service returns HTTP 5xx or is unreachable:

```typescript
import { ServiceUnavailableError } from 'orbis1-sdk-node';

if (err instanceof ServiceUnavailableError) {
  // err.status — HTTP status code (if available)
  // err.data   — response body (if available)
  console.error(`Service error ${err.status}:`, err.data);
}
```

## `InvalidPSBTError`

Thrown during PSBT parsing or verification when the structure is malformed:

```typescript
import { InvalidPSBTError } from 'orbis1-sdk-node';

if (err instanceof InvalidPSBTError) {
  console.error('PSBT error:', err.message);
}
```

## `ConsignmentVerificationError`

Thrown when the TXID computed from the consignment file does not match the expected TXID:

```typescript
import { ConsignmentVerificationError } from 'orbis1-sdk-node';

if (err instanceof ConsignmentVerificationError) {
  console.error('Consignment mismatch:', err.message);
}
```

## `RgbError`

Thrown by the native RGB binding layer for wallet-level errors. The message contains the `RgbLibError` variant name from the Rust library:

```typescript
import { RgbError } from 'orbis1-sdk-node';

if (err instanceof RgbError) {
  // err.rgbCode — the RgbLibError variant string
  // e.g. 'InsufficientBitcoins', 'NoAvailableUtxos', 'InvalidElectrum'
  console.error(`RGB error: ${err.rgbCode} — ${err.message}`);
}
```

## Pattern: typed error handling

```typescript
import {
  OrbisError,
  GasFreeError,
  GasFreeErrorCode,
  QuoteExpiredError,
  ServiceUnavailableError,
  FeatureNotEnabledError,
} from 'orbis1-sdk-node';

async function safeSend(request, quote) {
  try {
    return await sdk.gasFree().confirmTransfer(request, quote);
  } catch (err) {
    if (err instanceof QuoteExpiredError) {
      // Recoverable — re-quote
      const newQuote = await sdk.gasFree().requestFeeQuote(request);
      return sdk.gasFree().confirmTransfer(request, newQuote);
    }
    if (err instanceof ServiceUnavailableError) {
      throw new Error('Service temporarily offline. Please try again.');
    }
    if (err instanceof GasFreeError) {
      console.error(`[${err.gasFreeCode}]`, err.message, err.context);
    }
    if (err instanceof OrbisError) {
      console.error(`[${err.code}]`, err.message);
    }
    throw err;
  }
}
```
