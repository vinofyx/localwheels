import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import api from '../utils/api';

export default function TodaysTripsScreen({ navigation }) {
  const [trips, setTrips] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await api.get('/trips?status=assigned&today=1');
      setTrips(data.data || []);
    } catch (e) { console.warn(e.message); }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const renderTrip = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('TripDetail', { tripId: item._id })}>
      <Text style={styles.cardTitle}>{item.lr_number || item._id}</Text>
      <Text style={styles.cardSub}>{item.destination_city} • {item.vehicle_number}</Text>
      <View style={[styles.badge, { backgroundColor: item.status === 'in_transit' ? '#16a34a' : '#ca8a04' }]}>
        <Text style={styles.badgeText}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Today's Trips</Text>
      <FlatList data={trips} keyExtractor={i => i._id} renderItem={renderTrip}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
        ListEmptyComponent={<Text style={styles.empty}>No trips assigned today</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#f8fafc', marginBottom: 16 },
  card: { backgroundColor: '#1e293b', borderRadius: 10, padding: 16, marginBottom: 10 },
  cardTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '600' },
  cardSub: { color: '#94a3b8', marginTop: 4 },
  badge: { marginTop: 8, alignSelf: 'flex-start', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  empty: { color: '#64748b', textAlign: 'center', marginTop: 40 },
});
