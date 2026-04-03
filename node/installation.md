# Installation

## Prerequisites

- Node.js ≥ 18.0.0
- An API key from [Orbis1 services](https://orbis1.io)

## Install

::: code-group

```bash [npm]
npm install orbis1-sdk-node
```

```bash [yarn]
yarn add orbis1-sdk-node
```

```bash [pnpm]
pnpm add orbis1-sdk-node
```

:::

The package ships a prebuilt N-API native addon for the following targets. No Rust toolchain or build step is required in your application:

| Platform | Architecture |
|---|---|
| macOS | x64, arm64 |
| Linux | x64, arm64 |
| Windows | x64 |

## Verify installation

```typescript
import { generateKeys, BitcoinNetwork } from 'orbis1-sdk-node';

const keys = await generateKeys(BitcoinNetwork.TESTNET4);
console.log('Keys generated:', keys.masterFingerprint);
```

If this logs a fingerprint without error, the native binding loaded correctly.

## Troubleshooting native binding load failures

If you see `Error: Failed to load module` or a native binding error:

**Check Node.js version**

```bash
node --version  # must be >= 18.0.0
```

**Rebuild native addons** (required after switching Node versions)

```bash
npm rebuild
# or
npx node-pre-gyp rebuild
```

**Check architecture match**

On Apple Silicon Macs running Node.js via Rosetta 2, ensure you run a native arm64 build:

```bash
node --version --arch  # should show arm64 on M-series Macs
```

**Lock file stale**

If a previous process crashed, a stale `rgb_runtime.lock` file may block wallet initialization. The SDK removes stale locks automatically at startup; if you encounter persistent lock errors, delete `rgb-data/{masterFingerprint}/rgb_runtime.lock` manually.

## Data directory

The SDK stores wallet state in `./rgb-data/` relative to the installed package root. This directory is created automatically. For production deployments, ensure the directory is persisted across restarts (e.g. Docker volume, EBS mount).

You can verify the path the wallet uses:

```typescript
const wallet = sdk.getWallet()!;
const dir = await wallet.getWalletDir();
console.log('Wallet data at:', dir);
```
