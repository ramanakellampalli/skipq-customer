import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Alert } from 'react-native';
import { LogOut, Mail } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useStudentStore } from '../../store/studentStore';
import { useCartStore } from '../../store/cartStore';
import { hasSavedCredentials } from '../../utils/biometrics';
import { colors, font, radius, spacing } from '../../theme';

export default function ProfileScreen() {
  const { logout } = useAuthStore();
  const { profile, reset } = useStudentStore();
  const { clear } = useCartStore();

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handleLogout = async () => {
    const hasBiometrics = await hasSavedCredentials();
    const message = hasBiometrics
      ? 'You will be logged out. Use your fingerprint to sign back in quickly.'
      : 'Are you sure you want to log out?';

    Alert.alert('Log out', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          clear();
          reset();
          await logout();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.userName}>{profile?.name ?? '—'}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Name</Text>
          <Text style={styles.rowValue}>{profile?.name ?? '—'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Mail size={18} color={colors.textSecondary} />
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowValue}>{profile?.email ?? '—'}</Text>
          </View>
        </View>
        {profile?.campusName && (
          <>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Campus</Text>
              <Text style={styles.rowValue}>{profile.campusName}</Text>
            </View>
          </>
        )}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <LogOut size={18} color={colors.error} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.md, paddingTop: 56, paddingBottom: spacing.md },
  title: { fontFamily: font.bold, fontSize: 22, color: colors.white },
  avatarSection: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: font.bold, fontSize: 28, color: colors.white },
  userName: { fontFamily: font.bold, fontSize: 20, color: colors.white },
  section: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, gap: spacing.md },
  rowInfo: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontFamily: font.regular, fontSize: 15, color: colors.textSecondary },
  rowValue: { fontFamily: font.semiBold, fontSize: 15, color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.border },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.md,
    justifyContent: 'center',
  },
  logoutText: { fontFamily: font.semiBold, fontSize: 15, color: colors.error },
});
