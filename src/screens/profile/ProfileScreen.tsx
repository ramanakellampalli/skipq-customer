import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Alert, Linking } from 'react-native';
import { LogOut, MapPin, Mail, Trash2, Bell, BellOff } from 'lucide-react-native';
import { AuthorizationStatus } from '@react-native-firebase/messaging';
import { useAuthStore } from '../../store/authStore';
import { useStudentStore } from '../../store/studentStore';
import { useCartStore } from '../../store/cartStore';
import { api } from '../../api';
import { hasSavedCredentials } from '../../utils/biometrics';
import { requestNotificationPermission, getNotificationStatus } from '../../hooks/usePushNotifications';
import { colors, font, radius, spacing } from '../../theme';

export default function ProfileScreen() {
  const { logout } = useAuthStore();
  const { profile, reset } = useStudentStore();
  const { clear } = useCartStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [notifStatus, setNotifStatus] = useState<number>(AuthorizationStatus.NOT_DETERMINED);

  useEffect(() => {
    getNotificationStatus().then(setNotifStatus);
  }, []);

  const handleEnableNotifications = async () => {
    if (notifStatus === AuthorizationStatus.AUTHORIZED) return;
    if (notifStatus === AuthorizationStatus.DENIED) {
      Linking.openSettings();
      return;
    }
    const granted = await requestNotificationPermission();
    const status = await getNotificationStatus();
    setNotifStatus(status);
    if (!granted) {
      Alert.alert('Notifications blocked', 'Please enable notifications in your device settings.');
    }
  };

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all order history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await api.student.deleteAccount();
              clear();
              reset();
              await logout();
            } catch {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  const handleLogout = async () => {
    const hasBiometrics = await hasSavedCredentials();
    Alert.alert(
      'Log out',
      hasBiometrics
        ? 'You will be logged out. Use your fingerprint to sign back in quickly.'
        : 'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => { clear(); reset(); await logout(); },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* Avatar + Name */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{profile?.name ?? '—'}</Text>
      </View>

      {/* Email + Campus */}
      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Mail size={16} color={colors.primary} />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowValue} numberOfLines={1}>{profile?.email ?? '—'}</Text>
          </View>
        </View>
        {profile?.campusName && (
          <>
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.iconWrap}>
                <MapPin size={16} color={colors.primary} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Campus</Text>
                <Text style={styles.rowValue}>{profile.campusName}</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Notifications */}
      <View style={[styles.section, { marginTop: spacing.md }]}>
        <TouchableOpacity style={styles.row} onPress={handleEnableNotifications} activeOpacity={0.7}>
          <View style={styles.iconWrap}>
            {notifStatus === AuthorizationStatus.AUTHORIZED
              ? <Bell size={16} color={colors.primary} />
              : <BellOff size={16} color={colors.textSecondary} />}
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Push Notifications</Text>
            <Text style={styles.rowValue}>
              {notifStatus === AuthorizationStatus.AUTHORIZED
                ? 'Enabled'
                : notifStatus === AuthorizationStatus.DENIED
                  ? 'Blocked — tap to open settings'
                  : 'Tap to enable'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <LogOut size={18} color={colors.error} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount} activeOpacity={0.8} disabled={isDeleting}>
        <Trash2 size={16} color={colors.textSecondary} />
        <Text style={styles.deleteText}>{isDeleting ? 'Deleting…' : 'Delete Account'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.md, paddingTop: 56, paddingBottom: spacing.md },
  title: { fontFamily: font.bold, fontSize: 22, color: colors.white },
  avatarSection: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: font.bold, fontSize: 28, color: colors.white },
  name: { fontFamily: font.bold, fontSize: 20, color: colors.white },
  section: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: spacing.md,
  },
  iconWrap: {
    width: 32, height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryGlow,
    alignItems: 'center', justifyContent: 'center',
  },
  rowContent: { flex: 1 },
  rowLabel: { fontFamily: font.regular, fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
  rowValue: { fontFamily: font.semiBold, fontSize: 15, color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: spacing.md + 32 + spacing.md },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.md,
    justifyContent: 'center',
  },
  logoutText: { fontFamily: font.semiBold, fontSize: 15, color: colors.error },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
    justifyContent: 'center',
  },
  deleteText: { fontFamily: font.regular, fontSize: 13, color: colors.textSecondary },
});
