# Environments

The `environment` field in `SDKConfig` selects the target network and automatically configures all service endpoints.

## Environments at a glance

| Environment | Network | API Key Prefix | Gas-Free | Use Case |
|---|---|---|---|---|
| `TESTNET4` | Bitcoin Testnet4 | `pk_test_` | ✅ | Development and integration testing |
| `REGTEST` | Local regtest | `pk_test_` | ❌ | Local/CI unit testing |
| `MAINNET` | Bitcoin Mainnet | `sk_live_` | ✅ | Production |

## TESTNET4

```typescript
import { Orbis1SDK, Environment } from 'orbis1-sdk-node';

const sdk = new Orbis1SDK({
  apiKey: 'pk_test_your_key',
  environment: Environment.TESTNET4,
  // ...
});
```

- **Network:** Bitcoin Testnet4 (BIP-173 tbX addresses)
- **Indexer:** `ssl://electrum.iriswallet.com:50053`
- **RGB Proxy:** `rpcs://proxy.iriswallet.com/0.2/json-rpc`
- **Coins:** Testnet4 BTC (worthless; acquire from a faucet)
- **Gas-Free service:** Available

## MAINNET

```typescript
const sdk = new Orbis1SDK({
  apiKey: 'sk_live_your_key',
  environment: Environment.MAINNET,
  // ...
});
```

- **Network:** Bitcoin Mainnet (BIP-173 bcX addresses)
- **Gas-Free service:** Available
- **IFA schema:** Not available on mainnet
- Requires `sk_live_` API keys

## REGTEST

```typescript
const sdk = new Orbis1SDK({
  apiKey: 'pk_test_your_key',
  environment: Environment.REGTEST,
  wallet: {
    enabled: true,
    keys,
  },
  // Gas-Free NOT available here
});
```

- **Network:** Local Bitcoin regtest
- **Indexer URL:** Set by your local regtest environment (not a public URL)
- **Gas-Free service:** Not available (`OrbisError` thrown at initialization if enabled)
- Use for local integration testing with a private bitcoind + RGB node

## API key format

| Type | Format | Used with |
|---|---|---|
| Test key | `pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | `TESTNET4`, `REGTEST` |
| Live key | `sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | `MAINNET` |

Mismatching key type and environment causes a `ConfigurationError` at SDK construction time.

## Public service endpoints (read-only reference)

| Service | Testnet4 URL | Mainnet URL |
|---|---|---|
| Electrum indexer | `ssl://electrum.iriswallet.com:50053` | _(contact team)_ |
| RGB proxy | `rpcs://proxy.iriswallet.com/0.2/json-rpc` | _(contact team)_ |
| Gas-Free API | `https://gasfree-dev.orbis1.io` | `https://gasfree.orbis1.io` |

## Gas-Free API endpoints

The SDK calls these endpoints automatically. Listed for reference and debugging:

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/generate-fee-quote` | `POST` | Request a fee quote |
| `/api/v1/sign-psbt` | `POST` | Submit PSBT for co-signing |
| `/api/v1/verify-transfer` | `POST` | Confirm broadcast to service |
