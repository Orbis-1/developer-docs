# Configuration

`Orbis1SDK` accepts a single `SDKConfig` object validated by Zod at construction time. Invalid config throws `ConfigurationError` immediately.

## Full reference

```typescript
import {
  Orbis1SDK,
  Environment,
  LogLevel,
  AssetSchema,
  BitcoinNetwork,
  generateKeys,
} from 'orbis1-sdk-rn';

const keys = await generateKeys(BitcoinNetwork.TESTNET4);

const sdk = new Orbis1SDK({
  // ── Required ──────────────────────────────────────────────────────────────
  apiKey: 'pk_test_your_key',            // pk_test_... or sk_live_...
  environment: Environment.TESTNET4,      // TESTNET4 | MAINNET | REGTEST

  // ── Wallet ────────────────────────────────────────────────────────────────
  wallet: {
    enabled: true,
    keys,
    supportedSchemas: [AssetSchema.NIA, AssetSchema.CFA, AssetSchema.UDA],
    maxAllocationsPerUtxo: 1,            // default: 1
    vanillaKeychain: 0,                  // default: 0
  },

  // ── Features ──────────────────────────────────────────────────────────────
  features: {
    gasFree: {
      enabled: true,
      timeout: 30_000,               // HTTP timeout ms (default: 30000)
      maxRetries: 3,                 // retries on transient failure (default: 3)
      retryBaseDelay: 1_000,         // backoff start ms (default: 1000)
      retryMaxDelay: 10_000,         // backoff cap ms (default: 10000)
      retryJitter: true,             // randomise backoff (default: true)
      quoteExpirationBuffer: 30_000, // reject quote if expiring within this window ms
    },
    watchTower: {
      enabled: true,
      // Note: pollingInterval is accepted by validation but background polling
      // is not currently implemented. Call addToWatchTower() explicitly.
    },
  },

  // ── Logging ───────────────────────────────────────────────────────────────
  logging: {
    level: LogLevel.INFO,
    logger: (level, message, ...args) => myAppLogger[level]?.(message, ...args),
  },

  // ── SDK behaviour ──────────────────────────────────────────────────────────
  options: {
    strictMode: false,                   // throw on warnings (default: false)
  },
});
```

## SDKConfig fields

### Top-level

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `apiKey` | `string` | ✅ | — | API key |
| `environment` | `Environment` | ✅ | — | Target network |
| `wallet` | `WalletConfig` | | — | Wallet configuration |
| `features` | `FeaturesConfig` | | `{}` | Feature toggles |
| `logging` | `LoggingConfig` | | `{ level: 'info' }` | Logging |
| `options` | `OptionsConfig` | | `{}` | Behaviour flags |

### `wallet`

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `enabled` | `boolean` | ✅ | — | Must be `true` to activate |
| `keys` | `Keys` | ✅ | — | Mnemonic, xpubs, fingerprint |
| `supportedSchemas` | `AssetSchema[]` | | `[CFA, NIA, UDA]` | Asset schemas to track |
| `maxAllocationsPerUtxo` | `number` | | `1` | RGB allocations per UTXO |
| `vanillaKeychain` | `number` | | `0` | Keychain index for BTC side |

### `features.gasFree`

| Field | Type | Default | Description |
|---|---|---|---|
| `enabled` | `boolean` | `false` | Activate Gas-Free |
| `timeout` | `number` (ms) | `30000` | HTTP timeout |
| `maxRetries` | `number` | `3` | Retry count on transient failures |
| `retryBaseDelay` | `number` (ms) | `1000` | Backoff base delay |
| `retryMaxDelay` | `number` (ms) | `10000` | Backoff cap |
| `retryJitter` | `boolean` | `true` | Randomise backoff |
| `quoteExpirationBuffer` | `number` (ms) | `30000` | Reject quotes expiring soon |

### `features.watchTower`

| Field | Type | Default | Description |
|---|---|---|---|
| `enabled` | `boolean` | `false` | Activate Watch Tower |

### `LogLevel` enum

| Value | Output |
|---|---|
| `NONE` | Silent |
| `ERROR` | Errors only |
| `WARN` | Warnings + errors |
| `INFO` | Normal operation |
| `DEBUG` | Verbose debug (recommended for development) |
| `VERBOSE` | All messages |

### `Environment` enum

| Value | Network | Required key prefix |
|---|---|---|
| `TESTNET4` | Bitcoin Testnet4 | `pk_test_` |
| `REGTEST` | Local regtest | `pk_test_` |
| `MAINNET` | Bitcoin Mainnet | `sk_live_` |

## Feature guard

Accessing a disabled feature accessor throws `FeatureNotEnabledError`:

```typescript
sdk.gasFree();      // throws if gasFree.enabled !== true
sdk.watchTower();   // throws if watchTower.enabled !== true
```

## Gas-Free dependencies

Gas-Free requires:
- `wallet.enabled: true` (throws `OrbisError` otherwise)
- `environment !== REGTEST` (throws `OrbisError` otherwise)
