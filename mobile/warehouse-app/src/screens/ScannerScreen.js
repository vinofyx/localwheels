import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import api from "../utils/api";

export default function ScannerScreen() {
  const [lastScan, setLastScan] = useState(null);
  const [result, setResult] = useState(null);

  const handleBarcode = useCallback(async (code) => {
    setLastScan(code);
    try {
      const data = await api.get(`/inventory?barcode=${encodeURIComponent(code)}`);
      setResult(data.data?.[0] || null);
    } catch (e) { Alert.alert("Lookup Failed", e.message); }
  }, []);

  return (
    <View style={s.c}>
      <Text style={s.h}>Barcode / QR Scanner</Text>
      <View style={s.area}>
        <Text style={s.ph}>Camera Preview{"\n"}(react-native-vision-camera)</Text>
        <TouchableOpacity style={s.sim} onPress={() => handleBarcode("TEST-SKU-001")}>
          <Text style={s.simTxt}>Simulate Scan</Text>
        </TouchableOpacity>
      </View>
      {lastScan && <Text style={s.scanned}>Scanned: {lastScan}</Text>}
      {result && (
        <View style={s.card}>
          <Text style={s.cTitle}>{result.item_name}</Text>
          <Text style={s.cSub}>SKU: {result.sku} • Qty: {result.quantity}</Text>
          <Text style={s.cSub}>Location: {result.rack} - {result.bin}</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: "#0f172a", padding: 16 },
  h: { fontSize: 22, fontWeight: "bold", color: "#f8fafc", marginBottom: 16 },
  area: { height: 240, backgroundColor: "#1e293b", borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  ph: { color: "#475569", textAlign: "center", fontSize: 14 },
  sim: { marginTop: 12, backgroundColor: "#38bdf8", borderRadius: 6, paddingHorizontal: 16, paddingVertical: 8 },
  simTxt: { color: "#0f172a", fontWeight: "600" },
  scanned: { color: "#94a3b8", marginBottom: 12 },
  card: { backgroundColor: "#1e293b", borderRadius: 10, padding: 16 },
  cTitle: { color: "#f8fafc", fontSize: 16, fontWeight: "600" },
  cSub: { color: "#94a3b8", marginTop: 4 },
});
