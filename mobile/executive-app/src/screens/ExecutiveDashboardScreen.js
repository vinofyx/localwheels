import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import api from "../utils/api";

const KPI = ({ label, value, color = "#38bdf8" }) => (
  <View style={s.kpi}>
    <Text style={[s.kpiV, { color }]}>{value}</Text>
    <Text style={s.kpiL}>{label}</Text>
  </View>
);

export default function ExecutiveDashboardScreen() {
  const [kpis, setKpis] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await api.get("/analytics/overview");
      setKpis(data.data || {});
    } catch { setKpis({}); }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <ScrollView style={s.c} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}>
      <Text style={s.h}>Executive Dashboard</Text>
      <Text style={s.d}>{new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}</Text>
      {kpis ? (
        <View style={s.grid}>
          <KPI label="Total Shipments" value={kpis.total_shipments || 0} color="#38bdf8" />
          <KPI label="In Transit" value={kpis.in_transit || 0} color="#f59e0b" />
          <KPI label="Delivered Today" value={kpis.delivered_today || 0} color="#4ade80" />
          <KPI label="Active Vehicles" value={kpis.active_vehicles || 0} color="#c084fc" />
        </View>
      ) : <Text style={s.loading}>Loading…</Text>}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: "#0f172a", padding: 16 },
  h: { fontSize: 24, fontWeight: "bold", color: "#f8fafc" },
  d: { color: "#64748b", marginBottom: 20, marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  kpi: { backgroundColor: "#1e293b", borderRadius: 12, padding: 16, width: "47%" },
  kpiV: { fontSize: 28, fontWeight: "800" },
  kpiL: { color: "#94a3b8", fontSize: 12, marginTop: 4 },
  loading: { color: "#475569", textAlign: "center", marginTop: 40 },
});
