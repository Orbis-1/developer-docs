# Configuration

`Orbis1SDK` accepts a single `SDKConfig` object. Configuration is validated with Zod at construction time; invalid config throws `ConfigurationError` immediately.

## Full reference

```typescript
import {
  Orbis1SDK,
  Environment,
  LogLevel,
  AssetSchema,
  BitcoinNetwork,
  restoreKeys,
} from 'orbis1-sdk-node';

const keys = await restoreKeys(BitcoinNetwork.TESTNET4, process.env.MNEMONIC!);

const sdk = new Orbis1SDK({
  // ── Required ────────────────────────────────────────────────────────────
  apiKey: process.env.ORBIS_API_KEY!,       // pk_test_... or sk_live_...
  environment: Environment.TESTNET4,         // TESTNET4 | MAINNET | REGTEST

  // ── Wallet (required for Gas-Free) ──────────────────────────────────────
  wallet: {
    enabled: true,
    keys,                                    // { mnemonic, xpub, accountXpubVanilla, accountXpubColored, masterFingerprint }
    dataDir: '/var/lib/myapp/wallet-data',  // optional: defaults to .orbis1-wallet-data at project root
    supportedSchemas: [                      // default: [CFA, NIA, UDA]
      AssetSchema.NIA,
      AssetSchema.UDA,
      AssetSchema.CFA,
    ],
    maxAllocationsPerUtxo: 1,               // default: 1
    vanillaKeychain: 0,                     // default: 0
  },

  // ── Features ────────────────────────────────────────────────────────────
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
    },
  },

  // ── Logging ─────────────────────────────────────────────────────────────
  logging: {
    level: LogLevel.INFO,                   // NONE | ERROR | WARN | INFO | DEBUG | VERBOSE
    logger: (level, message, ...args) => {  // custom logger (optional)
      myLogger[level]?.(message, ...args);
    },
  },

  // ── SDK behaviour ────────────────────────────────────────────────────────
  options: {
    strictMode: false,                      // throw on warnings (default: false)
  },
});
```

## SDKConfig fields

### Top-level

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `apiKey` | `string` | ✅ | — | API key from Orbis1 services |
| `environment` | `Environment` | ✅ | — | Target network and service endpoints |
| `wallet` | `WalletConfig` | | — | Wallet configuration; required for Gas-Free |
| `features` | `FeaturesConfig` | | `{}` | Enable and configure features |
| `logging` | `LoggingConfig` | | `{ level: 'info' }` | Log level and custom logger |
| `options` | `OptionsConfig` | | `{ strictMode: false }` | SDK behaviour flags |

### `wallet`

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `enabled` | `boolean` | ✅ | — | Must be `true` to activate wallet |
| `keys` | `Keys` | ✅ | — | Cryptographic keys (mnemonic, xpubs, fingerprint) |
| `dataDir` | `string` | | `.orbis1-wallet-data` at project root | Absolute path for wallet data storage. Defaults to hidden directory at project root (alongside `node_modules/`) which survives cleanup |
| `supportedSchemas` | `AssetSchema[]` | | `[CFA, NIA, UDA]` | Asset schemas tracked by the wallet |
| `maxAllocationsPerUtxo` | `number` | | `1` | Max RGB allocations per UTXO |
| `vanillaKeychain` | `number` | | `0` | Keychain index for vanilla BTC side |

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
| `enabled` | `boolean` | `false` | Activate Watch Tower module |

### `logging`

| Field | Type | Default | Description |
|---|---|---|---|
| `level` | `LogLevel` | `INFO` | Minimum log level. `NONE` disables all logs |
| `logger` | `function` | — | Replace SDK's console logger with your own |

### `LogLevel` enum

| Value | Output |
|---|---|
| `NONE` | Silent |
| `ERROR` | Errors only |
| `WARN` | Warnings + errors |
| `INFO` | Info + warnings + errors |
| `DEBUG` | Debug + all above |
| `VERBOSE` | All messages |

### `Environment` enum

| Value | Network | Service |
|---|---|---|
| `TESTNET4` | Bitcoin Testnet4 | `pk_test_...` API keys |
| `REGTEST` | Local regtest | `pk_test_...` API keys; Gas-Free unavailable |
| `MAINNET` | Bitcoin Mainnet | `sk_live_...` API keys |

## API key rules

| Environment | Key prefix |
|---|---|
| `TESTNET4`, `REGTEST` | `pk_test_` |
| `MAINNET` | `sk_live_` |

Passing the wrong key type for the environment will produce a configuration validation error.

## Wallet data storage

### Default location

If `wallet.dataDir` is not specified, wallet data is stored in `.orbis1-wallet-data/` at your **project root** (the directory containing `node_modules/`):

```
my-project/
  ├─ node_modules/
  │   └─ orbis1-sdk-node/
  ├─ .orbis1-wallet-data/    ← Wallet data (survives npm install)
  ├─ package.json
  └─ ...
```

This hidden directory:
- ✅ Survives `npm install`, `npm ci`, and `rm -rf node_modules`
- ✅ Persists across package updates
- ✅ Stays with your project

### Custom location

For production deployments, explicitly set `dataDir`:

```typescript
wallet: {
  enabled: true,
  keys,
  dataDir: process.env.WALLET_DATA_DIR || '/var/lib/myapp/wallet-data',
}
```

**Recommended paths:**
- Development: Use default (`.orbis1-wallet-data` at project root)
- Production server: `/var/lib/myapp/wallet-data` or similar
- User home: `path.join(os.homedir(), '.myapp', 'wallet-data')`
- Current directory: `path.join(process.cwd(), 'wallet-data')`

::: warning
Never store wallet data inside `node_modules/` as it will be deleted during package cleanup.
:::

## Feature guard

Accessing a feature that was not enabled in config throws `FeatureNotEnabledError`:

```typescript
// Config has gasFree.enabled = false (or omitted)
sdk.gasFree();  // throws FeatureNotEnabledError

// Fix: enable gas-free in SDKConfig.features
features: { gasFree: { enabled: true } }
```

## Gas-Free and Wallet dependency

Gas-Free requires a `Wallet` instance. If `wallet.enabled` is not `true`, SDK initialization will throw:

```
OrbisError: Gas-Free feature requires Wallet instance.
```

Gas-Free is also not available in `REGTEST`:

```
OrbisError: Gas-Free is not available in REGTEST yet.
```
