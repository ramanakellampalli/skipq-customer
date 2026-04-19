import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';

export const client = axios.create({
  baseURL: Config.API_URL,
  timeout: 10000,
});

client.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const AUTH_ENDPOINTS = ['/api/v1/auth/login', '/api/v1/auth/register'];

client.interceptors.response.use(
  r => r,
  async err => {
    const isAuthCall = AUTH_ENDPOINTS.some(e => err.config?.url?.includes(e));
    if (err.response?.status === 401 && !isAuthCall) {
      await AsyncStorage.multiRemove(['token', 'userId', 'name', 'email']);
      const { useAuthStore } = await import('../store/authStore');
      useAuthStore.setState({ token: null, userId: null, name: null, email: null });
    }
    return Promise.reject(err);
  },
);
