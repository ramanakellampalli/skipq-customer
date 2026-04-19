import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  isLoading: boolean;
  setAuth: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>(set => ({
  token: null,
  isLoading: true,

  setAuth: async (token) => {
    await AsyncStorage.setItem('token', token);
    set({ token });
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    set({ token: null });
  },

  loadFromStorage: async () => {
    const token = await AsyncStorage.getItem('token');
    set({ token, isLoading: false });
  },
}));
