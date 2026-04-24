import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import { api } from '../api';

export function usePushNotifications(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const register = async () => {
      const status = await messaging().requestPermission();
      const granted =
        status === messaging.AuthorizationStatus.AUTHORIZED ||
        status === messaging.AuthorizationStatus.PROVISIONAL;

      if (!granted) return;

      const token = await messaging().getToken();
      if (token) {
        api.student.registerDeviceToken(token).catch(() => {});
      }
    };

    register();

    const unsubscribe = messaging().onTokenRefresh(token => {
      api.student.registerDeviceToken(token).catch(() => {});
    });

    return unsubscribe;
  }, [enabled]);
}
