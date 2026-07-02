import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native";
import axios from "axios";

export default function TrackingScreen() {
  const [lr, setLr] = useState("");
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(false);

  const track = async () => {
    if (!lr.trim()) return;
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/tracking/${lr.trim()}`);
      setShipment(res.data.data);
    } catch {
      Alert.alert("Not Found", `No shipment for LR: ${lr}`);
      setShipment(null);
    } finally { setLoading(false); }
  };

  const col = (s) => ({ booked: "#ca8a04", in_transit: "#2563eb", delivered: "#16a34a", cancelled: "#dc2626" }[s] || "#64748b");

  return (
    <ScrollView style={s.c}>
      <Text style={s.h}>Track Shipment</Text>
      <View style={s.row}>
        <TextInput style={s.inp} placeholder="LR Number" placeholderTextColor="#475569" value={lr} onChangeText={setLr} autoCapitalize="characters" />
        <TouchableOpacity style={s.btn} onPress={track} disabled={loading}>
          <Text style={s.btxt}>{loading ? "…" : "Track"}</Text>
        </TouchableOpacity>
      </View>
      {shipment && (
        <View style={s.card}>
          <Text style={s.lr}>{shipment.lr_number}</Text>
          <View style={[s.badge, { backgroundColor: col(shipment.status) }]}>
            <Text style={s.bTxt}>{shipment.status?.toUpperCase()}</Text>
          </View>
          <Text style={s.route}>{shipment.origin_city} → {shipment.destination_city}</Text>
          {shipment.estimated_delivery && <Text style={s.eta}>ETA: {new Date(shipment.estimated_delivery).toLocaleDateString()}</Text>}
          {shipment.consignee_name && <Text style={s.sub}>Consignee: {shipment.consignee_name}</Text>}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: "#0f172a", padding: 16 },
  h: { fontSize: 22, fontWeight: "bold", color: "#f8fafc", marginBottom: 20 },
  row: { flexDirection: "row", gap: 8, marginBottom: 16 },
  inp: { flex: 1, backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: 8, padding: 12 },
  btn: { backgroundColor: "#38bdf8", borderRadius: 8, paddingHorizontal: 18, justifyContent: "center" },
  btxt: { color: "#0f172a", fontWeight: "bold" },
  card: { backgroundColor: "#1e293b", borderRadius: 12, padding: 16 },
  lr: { color: "#f8fafc", fontSize: 18, fontWeight: "700", marginBottom: 8 },
  badge: { alignSelf: "flex-start", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 10 },
  bTxt: { color: "#fff", fontSize: 12, fontWeight: "700" },
  route: { color: "#38bdf8", fontSize: 15, marginBottom: 6 },
  eta: { color: "#a3e635", fontSize: 14, marginBottom: 4 },
  sub: { color: "#94a3b8", fontSize: 14 },
});
