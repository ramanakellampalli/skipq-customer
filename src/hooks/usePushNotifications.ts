import { useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import {
  getMessaging,
  getToken,
  requestPermission,
  onTokenRefresh,
  hasPermission,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { api } from '../api';

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
  }

  const status = await requestPermission(getMessaging());
  const granted =
    status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL;

  if (!granted) return false;

  const token = await getToken(getMessaging());
  if (token) {
    await api.student.registerDeviceToken(token).catch(() => {});
  }
  return true;
}

export async function getNotificationStatus(): Promise<number> {
  return hasPermission(getMessaging());
}

export function usePushNotifications(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    requestNotificationPermission();

    const unsubscribe = onTokenRefresh(getMessaging(), token => {
      api.student.registerDeviceToken(token).catch(() => {});
    });

    return unsubscribe;
  }, [enabled]);
}
