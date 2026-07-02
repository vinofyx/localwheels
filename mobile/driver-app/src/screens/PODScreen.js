import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView } from 'react-native';
import api from '../utils/api';
import { enqueue } from '../utils/offline';

export default function PODScreen({ route }) {
  const { tripId } = route.params;
  const [remarks, setRemarks] = useState('');
  const [signed, setSigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!signed) return Alert.alert('Required', 'Please capture signature before submitting POD');
    setSubmitting(true);
    try {
      await api.post(`/trips/${tripId}/pod`, { remarks, signature_captured: true, delivered_at: new Date() });
      Alert.alert('Success', 'POD submitted successfully');
    } catch (e) {
      await enqueue({ method: 'POST', url: `/trips/${tripId}/pod`, body: { remarks, signature_captured: true, delivered_at: new Date() } });
      Alert.alert('Offline', 'POD saved offline. Will sync when connected.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Proof of Delivery</Text>
      <Text style={styles.label}>Delivery Remarks</Text>
      <TextInput style={styles.input} placeholder="Any remarks…" placeholderTextColor="#64748b" value={remarks} onChangeText={setRemarks} multiline numberOfLines={3} />
      <TouchableOpacity style={[styles.btn, signed && styles.btnDone]} onPress={() => setSigned(true)}>
        <Text style={styles.btnText}>{signed ? '✓ Signature Captured' : 'Capture Signature'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.btnSubmit]} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.btnText}>{submitting ? 'Submitting…' : 'Submit POD'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#f8fafc', marginBottom: 20 },
  label: { color: '#94a3b8', marginBottom: 6 },
  input: { backgroundColor: '#1e293b', color: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 16, textAlignVertical: 'top' },
  btn: { backgroundColor: '#334155', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 10 },
  btnDone: { backgroundColor: '#16a34a' },
  btnSubmit: { backgroundColor: '#38bdf8' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
