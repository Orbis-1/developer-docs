# Introduction

Orbis1 SDK is a family of open-source TypeScript packages that give wallet developers and application builders a production-ready interface to the [RGB protocol](https://rgb.tech) on Bitcoin.

## What is Orbis1 SDK?

Two standalone packages ship today:

| Package | Target platform | Install |
|---|---|---|
| `orbis1-sdk-node` | Node.js ≥ 18 | `npm install orbis1-sdk-node` |
| `orbis1-sdk-rn` | React Native (New Architecture) | `yarn add orbis1-sdk-rn` |

Both packages expose an **identical public API**. Only the native binding layer differs — N-API addon on Node.js and a Turbo Module on iOS/Android. All application code you write is fully portable between platforms.

## What can it do?

- **RGB wallet operations** — generate keys, create UTXOs, issue assets (NIA, UDA, CFA, IFA), send and receive via blinded or witness invoices, query balances and transfer history
- **Gas-Free transfers** — collaborative PSBT signing where the Orbis1 service covers Bitcoin mining fees in exchange for a small RGB asset payment; users never need to hold BTC
- **Watch Tower monitoring** — register invoices for server-side monitoring and optional FCM push notifications on incoming transfers

## Architecture overview

```
Your Application
      │
      ▼
 Orbis1SDK (config + lifecycle)
      ├── Wallet          ← RGB operations (send, receive, issue, sync …)
      ├── GasFreeModule   ← Quote → Build → Submit → Broadcast → Verify
      └── WatchTowerModule ← Invoice registration, FCM token

Wallet
  └── NativeRgb adapter
        ├── Node.js:  N-API → orbis1-rgb-lib (npm native addon)
        └── React Native: Turbo Module → iOS/Android rgb-lib binding
```

## SDK vs platform comparison

| Aspect | `orbis1-sdk-node` | `orbis1-sdk-rn` |
|---|---|---|
| **Runtime** | Node.js ≥ 18 | React Native (New Architecture) |
| **Binding** | N-API native addon (`orbis1-rgb-lib`) | Turbo Module |
| **Wallet data directory** | `./rgb-data/` (auto-created at package root) | App documents directory |
| **Online handle** | Explicit `createOnline` / `setOnline` / `dropOnline` available | Managed inside Turbo Module |
| **`decodeInvoice`** | Implemented in TypeScript (manual URI parsing) | Delegated to native |
| **File I/O for consignment** | `fs/promises` | `fetch('file://')` |
| **Use cases** | Servers, CLIs, desktop Electron apps | iOS and Android mobile apps |

## API key

All backend features (Gas-Free, Watch Tower) require an API key issued by Orbis1 services.

- `pk_test_...` — for `TESTNET4` and `REGTEST` environments
- `sk_live_...` — for `MAINNET`

Pass the key as `apiKey` in `SDKConfig`. It is held in memory only; the SDK never writes it to disk.

## Open source

Both SDKs are MIT-licensed and hosted on GitHub:

- [Orbis1/orbis1-sdk-node](https://github.com/Orbis-1/orbis1-sdk-node)
- [Orbis1/orbis1-sdk-rn](https://github.com/Orbis-1/orbis1-sdk-rn)

## Next steps

- Read [Core Concepts](/concepts) to understand RGB assets, UTXOs, and the gas-free model
- Jump to [Node.js Quick Start](/node/quickstart) or [React Native Quick Start](/react-native/quickstart) to run your first transfer
