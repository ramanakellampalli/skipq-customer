import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const client = axios.create({
  baseURL: 'https://skipq-core-1014891107344.asia-south1.run.app',
  timeout: 10000,
});

client.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  r => r,
  async err => {
    if (err.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'userId', 'name', 'email']);
    }
    return Promise.reject(err);
  },
);
