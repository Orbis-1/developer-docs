# React Native SDK

`orbis1-sdk-rn` brings full RGB wallet functionality to React Native apps with zero manual native linking. It targets the New Architecture (Turbo Modules) and ships as a unified package — no separate binary downloads needed.

## Features

- RGB NIA/UDA/CFA/IFA asset issuance and transfer
- Gas-Free transfers via collaborative PSBT (no BTC required from user)
- Watch Tower invoice monitoring with FCM push support
- New Architecture (Turbo Modules) support
- iOS (arm64 / x86_64) + Android (arm64-v8a / x86_64 / armeabi-v7a / x86)
- TypeScript-first with full type definitions

## Install

```bash
yarn add orbis1-sdk-rn
```

### iOS

```bash
cd ios && pod install && cd ..
```

### Android

No additional manual setup required. For stale builds:

```bash
cd android && ./gradlew clean && cd ..
```

## Minimum requirements

| Platform | Minimum |
|---|---|
| React Native | 0.73+ (New Architecture) |
| iOS | 14.0+ |
| Android | API 24+ (Android 7.0) |
| Node.js (build host) | 18+ |

## Quick example

```typescript
import { Orbis1SDK, generateKeys, BitcoinNetwork, Environment } from 'orbis1-sdk-rn';

const keys = await generateKeys(BitcoinNetwork.TESTNET4);

const sdk = new Orbis1SDK({
  apiKey: 'pk_test_your_key',
  environment: Environment.TESTNET4,
  wallet: { enabled: true, keys },
  features: { gasFree: { enabled: true } },
});

await sdk.initialize();
const wallet = sdk.getWallet()!;
await wallet.goOnline('ssl://electrum.iriswallet.com:50053');
await wallet.sync();

const balance = await wallet.getBtcBalance();
console.log(balance.vanilla.spendable, 'sats');
```

## Navigation

| Guide | Description |
|---|---|
| [Installation](./installation) | Full platform setup details |
| [Quick Start](./quickstart) | 5-step minimal flow |
| [Configuration](./configuration) | All `SDKConfig` fields |
| [Wallet](./wallet) | Asset issuance, sending and receiving |
| [Gas-Free](./gas-free) | Gas-Free transfers |
| [Watch Tower](./watch-tower) | Invoice monitoring |
