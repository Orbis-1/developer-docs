# Node.js SDK

`orbis1-sdk-node` is a complete TypeScript SDK for RGB asset operations in Node.js.

## Features

- Full RGB wallet (NIA, UDA, CFA, IFA): issue, receive, send, sync
- Gas-Free transfers — collaborative PSBT signing with the Orbis1 service
- Watch Tower — invoice monitoring and FCM notifications
- Modular opt-in feature activation via config
- Type-safe API with Zod runtime validation
- Explicit `Online` handle lifecycle for server/per-request patterns

## Requirements

- **Node.js** ≥ 18.0.0

## Installation

```bash
npm install orbis1-sdk-node
# or
yarn add orbis1-sdk-node
```

## Minimal example

```typescript
import { Orbis1SDK, generateKeys, BitcoinNetwork, Environment } from 'orbis1-sdk-node';

const keys = await generateKeys(BitcoinNetwork.TESTNET4);

const sdk = new Orbis1SDK({
  apiKey: 'pk_test_your_key',
  environment: Environment.TESTNET4,
  wallet: { enabled: true, keys },
});

await sdk.initialize();

const wallet = sdk.getWallet()!;
await wallet.goOnline(false, 'ssl://electrum.iriswallet.com:50053');
await wallet.sync();

const balance = await wallet.getBtcBalance();
console.log(balance);

await sdk.cleanup();
```

## Navigation

- [Installation & setup →](/node/installation)
- [Quick Start →](/node/quickstart)
- [Configuration reference →](/node/configuration)
- [Wallet guide →](/node/wallet)
- [Gas-Free guide →](/node/gas-free)
- [Watch Tower guide →](/node/watch-tower)
- [Examples →](/node/examples/basic-usage)
