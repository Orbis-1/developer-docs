# Installation

## 1. Install the package

```bash
yarn add orbis1-sdk-rn
```

npm is also supported:

```bash
npm install orbis1-sdk-rn
```

## 2. iOS setup

From your app root:

```bash
cd ios && pod install && cd ..
```

The postinstall script downloads the prebuilt `rgb_lib.xcframework` automatically when running on macOS. If it fails:

```bash
node scripts/download-rgb-lib-ios.js
cd ios && pod install && cd ..
```

Then clean and rebuild from Xcode (`Product → Clean Build Folder`).

## 3. Android setup

No additional steps are required for typical React Native projects. The native `.so` libraries are bundled in the package.

If Gradle cache issues appear:

```bash
cd android && ./gradlew clean && cd ..
yarn android
```

## 4. New Architecture

`orbis1-sdk-rn` requires the **New Architecture** (Turbo Modules). Ensure it is enabled:

**React Native 0.73+** — New Architecture is on by default. Nothing to change.

**React Native 0.71–0.72** — add to `android/gradle.properties`:

```properties
newArchEnabled=true
```

and to `ios/Podfile` before `use_react_native!`:

```ruby
ENV['RCT_NEW_ARCH_ENABLED'] = '1'
```

## 5. Verify

```typescript
import { Orbis1SDK, Environment } from 'orbis1-sdk-rn';

const sdk = new Orbis1SDK({
  apiKey: 'pk_test_your_key',
  environment: Environment.TESTNET4,
});

console.log('Import OK');
```

## Common issues

### Native module not found

Run `pod install` again and do a full native rebuild (not just JS reload):

```bash
cd ios && pod deintegrate && pod install && cd ..
```

### API key mismatch

| Environment | Key prefix |
|---|---|
| `TESTNET4` / `REGTEST` | `pk_test_` |
| `MAINNET` | `sk_live_` |

### Crypto / Buffer polyfills

The SDK uses `crypto-js` for SHA-256 internally. No manual polyfill setup is needed. If you use `crypto` or `Buffer` elsewhere in your app, install the standard polyfill:

```bash
yarn add react-native-get-random-values @craftzdog/react-native-buffer
```

And import them at your app entry point before any other imports.
