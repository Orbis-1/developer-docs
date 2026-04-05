# Core Concepts

This page explains the fundamental ideas behind RGB and the Orbis1 SDK. Understanding these will help you use the API correctly and debug issues faster.

## RGB Protocol

[RGB](https://rgb.tech) is a client-side-validated, off-chain smart contract system that runs on top of Bitcoin. RGB assets exist as **state transitions** committed to Bitcoin transactions via an `OP_RETURN` output. The Bitcoin blockchain provides ordering and double-spend protection; all other data lives off-chain.

Key properties:
- **Non-custodial** — asset ownership requires possession of the corresponding UTXO private key
- **Privacy-preserving** — recipients use blinded UTXOs so senders cannot derive who received what
- **Scalable** — only the parties involved in a transfer exchange consignment data off-chain

## Asset Schemas

RGB defines multiple asset schemas, each for a different token type:

| Schema | Name | Description |
|---|---|---|
| `NIA` | Non-Inflatable Asset | Fungible token with fixed supply (e.g. USDT, tokenized shares) |
| `UDA` | Unique Digital Asset | NFT — one-of-a-kind token with optional media |
| `CFA` | Collectible Fungible Asset | Fungible token with attached media (art, collectibles) |
| `IFA` | Inflatable Fungible Asset | Fungible token that supports minting additional supply |

## UTXOs and Allocations

RGB assets are **allocated to Bitcoin UTXOs**. A UTXO holding an RGB allocation is called a *colored UTXO*. When you send an asset, the allocation moves to a new UTXO; the old UTXO is consumed.

Before issuing or receiving RGB assets, you must create dedicated UTXOs:

```ts
await wallet.createUtxos(
  true,   // upTo: fill up to `num` if fewer exist
  5,      // num: target count
  1000,   // size: satoshis per UTXO
  2.0     // feeRate: sat/vByte
);
```

## Invoices

An RGB invoice is a URI that encodes how a recipient wants to receive an asset. There are two seal types:

| Type | URI prefix | Description |
|---|---|---|
| **Blinded UTXO** | `utxob:` | Recipient blinds an existing UTXO. Privacy-preserving; sender cannot link payment to on-chain output. |
| **Witness output** | `wvout:` | Recipient provides a fresh Bitcoin address. Requires a small BTC amount in the output. |

Generate a blinded-UTXO invoice:

```ts
const receiveData = await wallet.blindReceive(
  'rgb:asset_id',                             // assetId (null = any asset)
  { type: 'FUNGIBLE', amount: 100_000_000 },  // assignment (base units)
  null,                                       // durationSeconds (null = default)
  ['rpcs://proxy.iriswallet.com/0.2/json-rpc'],
  1                                           // minConfirmations
);
console.log(receiveData.invoice); // rgb:~/~/...
```

## Amounts and Precision

All amounts in the SDK are **integer base units**. Never pass floating-point values.

```ts
// Asset precision = 6 (like USDT)
const displayAmount = 100.25;
const baseUnits = Math.round(displayAmount * 10 ** 6); // 100_250_000
```

Always round to avoid floating-point drift. The `precision` field on every asset tells you the exponent.

## Consignments

A **consignment** is an off-chain data package that proves an RGB state transition. When you call `sendBegin()`, rgb-lib writes a consignment file to disk. After broadcast, this file is delivered to the recipient (via an RGB transport proxy) so they can validate the transfer.

In the gas-free flow, the consignment is also sent to the Orbis1 service so it can verify the RGB fee allocation before co-signing the Bitcoin PSBT.

## Gas-Free Transfers

Standard RGB transfers require the sender to pay Bitcoin mining fees. Gas-free transfers change this: the Orbis1 service contributes a Bitcoin UTXO to the transaction (covering fees) and receives a small RGB asset payment in return — all within the same transaction.

The flow uses **collaborative PSBT signing**:

1. Client calls `requestFeeQuote()` — service returns a fee quote with an RGB invoice for the service fee
2. Client builds an unsigned PSBT via `wallet.sendBegin()` with:
   - Recipient invoice (actual transfer recipient)
   - Service fee invoice (RGB payment back to service)
   - Service's mining UTXO as an external input
3. Service validates the consignment and co-signs the mining input (`SIGHASH_ALL`)
4. Client signs their RGB inputs via `wallet.signPsbt()` then broadcasts via `wallet.sendEnd()`

Because the service signs with `SIGHASH_ALL` first, it cryptographically commits to the OP_RETURN RGB allocation. The client cannot change the fee allocation after the service signs.

```
User UTXO (RGB + BTC)   ──┐              ┌── OP_RETURN (RGB commitment)
                          ├── Bitcoin ──►├── User BTC change (unchanged)
Service UTXO (BTC only) ──┘  transaction └── Service BTC change (after fee)

RGB allocations in OP_RETURN:
  → Recipient:  requested transfer amount
  → Service:    fee (dynamic, covers mining cost + service premium)
  → User:       RGB change
```

**Security properties:**
- User BTC balance is unchanged (input sats == output sats for user's UTXO)
- Service fee cannot be removed after service signs
- Non-custodial: user holds their private keys and signs their own inputs

## Transfer States

The `GasFreeModule` tracks progress through a state machine:

| State | Meaning |
|---|---|
| `idle` | No transfer in progress |
| `quote-requested` | Fee quote received, quote timer running |
| `psbt-built` | PSBT constructed with external mining inputs |
| `submitted` | PSBT + consignment sent to service, service signed |
| `broadcasted` | Transaction broadcast to Bitcoin network |
| `verified` | Service confirmed txid in mempool |
| `failed` | An error occurred; inspect `state.error` |

## Watch Tower

Watch Tower registers RGB invoices with a remote service. The service monitors the blockchain and notifies your app (via FCM) when an incoming transfer for that invoice is detected. This powers background notifications in mobile wallets without requiring the app to be running.
