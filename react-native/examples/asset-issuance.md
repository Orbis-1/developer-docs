# Asset Issuance

Issuing NIA, CFA, UDA, and IFA assets from a React Native app.

## Prepare UTXOs first

RGB assets require dedicated UTXOs. Always ensure UTXOs exist before issuing:

```typescript
const wallet = sdk.getWallet()!;

try {
  await wallet.createUtxos(true, 5, 1_000, 1.5);
  await wallet.sync();
} catch (err: any) {
  if (!err.message?.includes('AllocationsAlreadyAvailable')) throw err;
  console.log('UTXOs already available');
}
```

## Issue NIA (fungible)

```typescript
const precision    = 6;
const displayUnits = 1_000;
const baseUnits    = Math.round(displayUnits * 10 ** precision);  // 1_000_000_000

const nia = await wallet.issueAssetNia(
  'TUSDT',         // ticker (max 8 chars)
  'Test USDT',     // name
  precision,       // decimal places
  [baseUnits]      // amounts array — each entry is a separate allocation
);

console.log('Asset ID:', nia.assetId);
console.log('Supply:  ', nia.issuedSupply / 10 ** precision, nia.ticker);
```

## Issue CFA (collectible fungible with media)

```typescript
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';  // react-native-fs or similar

const mediaPath = Platform.OS === 'ios'
  ? `${RNFS.DocumentDirectoryPath}/token.png`
  : `${RNFS.ExternalDirectoryPath}/token.png`;

const cfa = await wallet.issueAssetCfa(
  'My Token',                 // name
  'A collectible fungible',   // details (nullable)
  6,                          // precision
  [1_000_000],                // amounts (base units)
  mediaPath                   // pass null if no media
);
```

## Issue UDA (NFT)

```typescript
const uda = await wallet.issueAssetUda(
  'MYNFT',          // ticker
  'My Digital Art', // name
  null,             // details (nullable)
  0,                // precision is 0 for NFTs
  imagePath,        // media file path (nullable)
  []                // additional attachment paths
);
```

## Issue IFA (inflatable — non-mainnet)

```typescript
const ifa = await wallet.issueAssetIfa(
  'MYIFA',
  'Inflatable Token',
  6,
  [1_000_000],    // initial supply
  [500_000],      // inflation rights
  1,              // replaceRightsNum
  null            // optional rejectListUrl
);

// Mint additional supply later:
await wallet.inflate(ifa.assetId, [200_000], 1.5, 1);
```

## Read asset data

```typescript
// All assets
const all = await wallet.listAssets([]);
const nias = all.nia ?? [];

// Single asset metadata
const meta = await wallet.getAssetMetadata(assetId);
console.log('Precision:', meta.precision, 'Schema:', meta.schema);
```

## Issuance screen example

```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { AssetSchema } from 'orbis1-sdk-rn';
import { useSdk } from '../sdk/SdkContext';

export function IssueNIAScreen() {
  const { sdk } = useSdk();
  const [ticker, setTicker]   = useState('');
  const [name,   setName]     = useState('');
  const [supply, setSupply]   = useState('');
  const [assetId, setAssetId] = useState<string | null>(null);

  async function handleIssue() {
    if (!sdk) return;
    const wallet   = sdk.getWallet()!;
    const precision = 6;
    const baseUnits = Math.round(Number(supply) * 10 ** precision);

    try {
      // Ensure UTXOs
      try {
        await wallet.createUtxos(true, 5, 1_000, 1.5);
        await wallet.sync();
      } catch (e: any) {
        if (!e.message?.includes('AllocationsAlreadyAvailable')) throw e;
      }

      const asset = await wallet.issueAssetNia(ticker, name, precision, [baseUnits]);
      setAssetId(asset.assetId);
      Alert.alert('Asset issued', asset.assetId);
    } catch (err: any) {
      Alert.alert('Issuance failed', err.message);
    }
  }

  return (
    <View style={{ padding: 16 }}>
      <TextInput placeholder="Ticker" value={ticker} onChangeText={setTicker} />
      <TextInput placeholder="Name"   value={name}   onChangeText={setName} />
      <TextInput placeholder="Supply (display)" value={supply} onChangeText={setSupply} keyboardType="numeric" />
      <TouchableOpacity onPress={handleIssue}>
        <Text>Issue NIA</Text>
      </TouchableOpacity>
      {assetId && <Text selectable>{assetId}</Text>}
    </View>
  );
}
```
