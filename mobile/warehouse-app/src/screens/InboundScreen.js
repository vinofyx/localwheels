import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native";
import api from "../utils/api";

export default function InboundScreen() {
  const [lr, setLr] = useState("");
  const [packages, setPackages] = useState("");
  const [weight, setWeight] = useState("");
  const [remarks, setRemarks] = useState("");

  const handleReceive = async () => {
    if (!lr) return Alert.alert("Required", "Enter LR number");
    try {
      await api.post("/warehouse/inbound", { lr_number: lr, packages_received: Number(packages), actual_weight: Number(weight), remarks });
      Alert.alert("Success", "Inbound recorded");
      setLr(""); setPackages(""); setWeight(""); setRemarks("");
    } catch (e) { Alert.alert("Error", e.message); }
  };

  return (
    <ScrollView style={s.c}>
      <Text style={s.h}>Inbound Receiving</Text>
      {[["LR Number", lr, setLr, false], ["Packages", packages, setPackages, true], ["Weight (kg)", weight, setWeight, true]].map(([label, val, set, num]) => (
        <View key={label}>
          <Text style={s.label}>{label}</Text>
          <TextInput style={s.inp} value={val} onChangeText={set} keyboardType={num ? "numeric" : "default"} placeholderTextColor="#475569" placeholder={label} />
        </View>
      ))}
      <Text style={s.label}>Remarks</Text>
      <TextInput style={[s.inp, { height: 80, textAlignVertical: "top" }]} value={remarks} onChangeText={setRemarks} multiline placeholderTextColor="#475569" />
      <TouchableOpacity style={s.btn} onPress={handleReceive}>
        <Text style={s.btnTxt}>Record Inbound</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: "#0f172a", padding: 16 },
  h: { fontSize: 22, fontWeight: "bold", color: "#f8fafc", marginBottom: 20 },
  label: { color: "#94a3b8", marginBottom: 4 },
  inp: { backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: 8, padding: 12, marginBottom: 14 },
  btn: { backgroundColor: "#38bdf8", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 8 },
  btnTxt: { color: "#0f172a", fontWeight: "bold", fontSize: 15 },
});
