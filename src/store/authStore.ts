import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  userId: string | null;
  name: string | null;
  email: string | null;
  isLoading: boolean;
  setAuth: (token: string, userId: string, name: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>(set => ({
  token: null,
  userId: null,
  name: null,
  email: null,
  isLoading: true,

  setAuth: async (token, userId, name, email) => {
    await AsyncStorage.multiSet([
      ['token', token],
      ['userId', userId],
      ['name', name],
      ['email', email],
    ]);
    set({ token, userId, name, email });
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['token', 'userId', 'name', 'email']);
    set({ token: null, userId: null, name: null, email: null });
  },

  loadFromStorage: async () => {
    const [[, token], [, userId], [, name], [, email]] =
      await AsyncStorage.multiGet(['token', 'userId', 'name', 'email']);
    set({ token, userId, name, email, isLoading: false });
  },
}));
