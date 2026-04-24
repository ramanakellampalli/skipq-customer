import { useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { api } from '../api';

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
  }

  const status = await messaging().requestPermission();
  const granted =
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL;

  if (!granted) return false;

  const token = await messaging().getToken();
  if (token) {
    await api.student.registerDeviceToken(token).catch(() => {});
  }
  return true;
}

export async function getNotificationStatus(): Promise<number> {
  return messaging().hasPermission();
}

export function usePushNotifications(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    requestNotificationPermission();

    const unsubscribe = messaging().onTokenRefresh(token => {
      api.student.registerDeviceToken(token).catch(() => {});
    });

    return unsubscribe;
  }, [enabled]);
}
