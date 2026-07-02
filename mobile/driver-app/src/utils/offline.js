import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from './api';

const QUEUE_KEY = 'lw_offline_queue';

export async function enqueue(action) {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const queue = raw ? JSON.parse(raw) : [];
  queue.push({ ...action, timestamp: Date.now() });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function syncOfflineQueue() {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return;
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return;
  const queue = JSON.parse(raw);
  const failed = [];
  for (const action of queue) {
    try {
      await api.request({ method: action.method, url: action.url, data: action.body });
    } catch (e) {
      failed.push(action);
    }
  }
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
  return { synced: queue.length - failed.length, failed: failed.length };
}
