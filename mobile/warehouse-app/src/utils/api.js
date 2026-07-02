import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
const api = axios.create({ baseURL: "http://localhost:5000/api", timeout: 15000 });
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("lw_wh_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(r => r.data, err => Promise.reject(new Error(err.response?.data?.message || err.message)));
export default api;
