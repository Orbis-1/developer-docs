# Gas-Free Transfer

A complete React Native UI flow: select asset, enter recipient invoice, request quote, confirm transfer.

## Send screen

```typescript
// screens/SendScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { useSdk } from '../sdk/SdkContext';
import {
  QuoteExpiredError,
  GasFreeError,
  ServiceUnavailableError,
  type FeeQuote,
} from 'orbis1-sdk-rn';

type Stage =
  | 'idle'
  | 'requesting-quote'
  | 'showing-quote'
  | 'confirming'
  | 'done'
  | 'failed';

export function SendScreen() {
  const { sdk } = useSdk();

  const [assetId, setAssetId]                 = useState('');
  const [amount, setAmount]                   = useState('');
  const [recipientInvoice, setRecipientInvoice] = useState('');
  const [stage, setStage]                     = useState<Stage>('idle');
  const [quote, setQuote]                     = useState<FeeQuote | null>(null);
  const [txid,  setTxid]                      = useState<string | null>(null);

  const precision = 6;

  async function handleRequestQuote() {
    if (!sdk) return;
    setStage('requesting-quote');

    try {
      const gasFree = sdk.gasFree();
      const baseUnits = String(Math.round(Number(amount) * 10 ** precision));

      const q = await gasFree.requestFeeQuote({
        userId: 'device-user',
        assetId,
        amount: baseUnits,
        recipientInvoice,
      });

      setQuote(q);
      setStage('showing-quote');
    } catch (err: any) {
      Alert.alert('Quote failed', err.message);
      setStage('failed');
    }
  }

  async function handleConfirm() {
    if (!sdk || !quote) return;
    setStage('confirming');

    const gasFree = sdk.gasFree();
    const baseUnits = String(Math.round(Number(amount) * 10 ** precision));
    const request = { userId: 'device-user', assetId, amount: baseUnits, recipientInvoice };

    try {
      const result = await gasFree.confirmTransfer(request, quote);
      setTxid(result.txid);
      setStage('done');
    } catch (err) {
      if (err instanceof QuoteExpiredError) {
        Alert.alert('Quote expired', 'Requesting a new quote…');
        setQuote(null);
        setStage('idle');
        return;
      }
      if (err instanceof ServiceUnavailableError) {
        Alert.alert('Service unavailable', 'Try again later.');
      } else if (err instanceof GasFreeError) {
        Alert.alert('Transfer failed', (err as Error).message);
      } else {
        Alert.alert('Error', (err as Error).message);
      }
      setStage('failed');
    }
  }

  if (stage === 'done') {
    return (
      <View style={s.center}>
        <Text style={s.success}>Transfer sent!</Text>
        <Text selectable style={s.txid}>{txid}</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <TextInput placeholder="Asset ID"        value={assetId}          onChangeText={setAssetId}          style={s.input} />
      <TextInput placeholder="Amount (display)" value={amount}           onChangeText={setAmount}           style={s.input} keyboardType="numeric" />
      <TextInput placeholder="Recipient invoice" value={recipientInvoice} onChangeText={setRecipientInvoice} style={s.input} multiline />

      {stage === 'showing-quote' && quote && (
        <View style={s.quoteBox}>
          <Text>Mining fee: {quote.miningFeeSats} sats (paid by service)</Text>
          <Text>Service fee: {(Number(quote.serviceFeeAmount) / 10 ** precision).toFixed(precision)}</Text>
          <Text>Expires: {new Date(quote.expiresAt).toLocaleTimeString()}</Text>
        </View>
      )}

      {(stage === 'requesting-quote' || stage === 'confirming') && (
        <ActivityIndicator style={{ margin: 16 }} />
      )}

      {(stage === 'idle' || stage === 'failed') && (
        <TouchableOpacity style={s.button} onPress={handleRequestQuote}>
          <Text style={s.buttonText}>Request Quote</Text>
        </TouchableOpacity>
      )}

      {stage === 'showing-quote' && (
        <TouchableOpacity style={[s.button, s.confirmBtn]} onPress={handleConfirm}>
          <Text style={s.buttonText}>Confirm Transfer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  input:     { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12 },
  button:    { backgroundColor: '#1a6cff', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  confirmBtn:{ backgroundColor: '#16a34a' },
  buttonText:{ color: '#fff', fontWeight: '600' },
  quoteBox:  { backgroundColor: '#f0f4ff', padding: 12, borderRadius: 8, marginBottom: 12 },
  success:   { fontSize: 20, fontWeight: 'bold', color: '#16a34a', marginBottom: 12 },
  txid:      { fontFamily: 'monospace', fontSize: 12, color: '#555' },
});
```
