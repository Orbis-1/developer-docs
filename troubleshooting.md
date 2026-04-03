# Troubleshooting

Common problems and fixes for both the Node.js and React Native SDK.

## SDK not initialized

**Error:** `SDK is not initialized. Call initialize() first.`

**Fix:** Call `sdk.initialize()` before accessing `getWallet()`, `gasFree()`, or `watchTower()`.

```typescript
await sdk.initialize();   // ← must come first
const wallet = sdk.getWallet();
```

---

## Feature not enabled

**Error:** `Feature 'gasFree' is not enabled` / `FeatureNotEnabledError`

**Fix:** Enable the feature in `SDKConfig.features`:

```typescript
features: {
  gasFree: { enabled: true }
}
```

Gas-Free also requires:
- `wallet.enabled: true`
- `environment !== REGTEST`

---

## API key mismatch

**Error:** `ConfigurationError: validation failed`

**Cause:** Using `sk_live_...` with `TESTNET4`, or `pk_test_...` with `MAINNET`.

| Environment | Correct prefix |
|---|---|
| `TESTNET4` / `REGTEST` | `pk_test_` |
| `MAINNET` | `sk_live_` |

---

## Wallet network errors

**Symptom:** `goOnline()` or `sync()` throws.

**Checks:**
1. Correct indexer URL: `ssl://electrum.iriswallet.com:50053`
2. Network connectivity (device/server can reach internet)
3. Correct call order: `goOnline()` **then** `sync()`
4. On Node.js: `createOnline` + `setOnline` used together before `sync()`

---

## No available UTXOs

**Error:** `NoAvailableUtxos` / `AllocationsAlreadyAvailable`

**Fix:** Create UTXOs before issuing or receiving RGB assets:

```typescript
try {
  await wallet.createUtxos(true, 5, 1_000, 1.5);
  await wallet.sync();
} catch (err: any) {
  if (!err.message?.includes('AllocationsAlreadyAvailable')) throw err;
}
```

`AllocationsAlreadyAvailable` means UTXOs already exist — safe to ignore.

---

## Gas-Free quote expired

**Symptom:** Transfer fails with `QuoteExpiredError`.

**Fix:** Re-request a fresh quote immediately before confirming:

```typescript
import { QuoteExpiredError } from 'orbis1-sdk-node';

try {
  await gasFree.confirmTransfer(request, quote);
} catch (err) {
  if (err instanceof QuoteExpiredError) {
    const newQuote = await gasFree.requestFeeQuote(request);
    await gasFree.confirmTransfer(request, newQuote);
  }
}
```

Quote TTL is typically ~5 minutes. Confirm quickly after requesting.

---

## Amount precision issues

**Symptom:** Values look too large or too small; floating-point errors.

**Rule:** Always pass **integer base units** to SDK APIs.

```typescript
const precision   = 6;
const displayAmt  = 100.25;
const baseUnits   = Math.round(displayAmt * 10 ** precision);  // 100250000

// For display:
const display     = baseUnits / 10 ** precision;               // 100.25
```

Never pass floating-point strings like `"100.25"` to `amount`.

---

## Stuck or pending transfers

**Symptom:** Transfers stay in `WAITING_COUNTERPARTY` for too long.

**Fix:**

```typescript
// Refresh to pick up status changes
await wallet.refresh(null, [{ status: 'WAITING_COUNTERPARTY', incoming: true }], false);

// If truly stuck, mark as failed and clean up
await wallet.failTransfers(null, false);
await wallet.deleteTransfers(null, false);
```

---

## Node.js: native addon fails to load

**Error:** `Error: Cannot find module 'orbis1-rgb-lib'`

**Fixes:**
1. Confirm Node.js version ≥ 18: `node --version`
2. Rebuild native addon: `npm rebuild orbis1-rgb-lib`
3. On Apple Silicon (M1/M2) running Rosetta, ensure Node.js is the native arm64 build
4. Delete lockfile and reinstall: `rm -rf node_modules package-lock.json && npm install`

---

## React Native: native module not found

**Symptom:** `NativeModules.Orbis1Sdk` is undefined / `TurboModuleRegistry` error.

**Fixes:**
1. iOS — reinstall pods:
   ```bash
   cd ios && pod deintegrate && pod install && cd ..
   ```
   Then do a full native rebuild (not just JS).
2. Android — clean and rebuild:
   ```bash
   cd android && ./gradlew clean && cd ..
   yarn android
   ```
3. Verify New Architecture is enabled (see [Installation](./react-native/installation)).

---

## React Native: iOS framework not found

**Error:** `framework not found rgb_libFFI`

**Fix:**

```bash
node scripts/download-rgb-lib-ios.js
cd ios && pod install && cd ..
```

Then clean and rebuild in Xcode (`Product → Clean Build Folder`).

---

## Data directory not found (Node.js)

The SDK writes RGB wallet data to `./rgb-data/` by default (relative to `process.cwd()`). If you get file system errors, ensure the process has write permissions to the working directory, or specify a custom path at initialization.

---

## Memory / resource leak (Node.js server)

**Symptom:** Memory grows over time in a long-running server.

**Fix:** Always call `dropOnline(online)` in a `try/finally` block, and `wallet.close()` before shutdown:

```typescript
const online = await wallet.createOnline(false, INDEXER);
try {
  await wallet.setOnline(online);
  // ... requests ...
} finally {
  await wallet.dropOnline(online);   // critical
}
```

See [Server Patterns](./node/examples/server-patterns) for the full pattern.

---

## Still stuck?

- Check [GitHub Issues](https://github.com/Orbis-1/orbis1-sdk-rn/issues)
- Open a new issue with: SDK version, Node/RN version, OS, error message + stack trace
