import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Alert } from 'react-native';
import { LogOut, MapPin, Mail, User } from 'lucide-react-native';
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

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* Avatar card */}
      <View style={styles.avatarCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View>
          <Text style={styles.avatarName}>{profile?.name ?? '—'}</Text>
          {profile?.campusName && (
            <View style={styles.campusRow}>
              <MapPin size={12} color={colors.primary} />
              <Text style={styles.campusText}>{profile.campusName}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Info rows */}
      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <User size={16} color={colors.primary} />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Name</Text>
            <Text style={styles.rowValue}>{profile?.name ?? '—'}</Text>
          </View>
        </View>
        <View style={styles.divider} />
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

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <LogOut size={18} color={colors.error} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    paddingHorizontal: spacing.md,
    paddingTop: 56,
    paddingBottom: spacing.md,
  },
  title: { fontFamily: font.bold, fontSize: 22, color: colors.white },

  avatarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: font.bold, fontSize: 24, color: colors.white },
  avatarName: { fontFamily: font.bold, fontSize: 17, color: colors.white, marginBottom: 4 },
  campusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  campusText: { fontFamily: font.medium, fontSize: 12, color: colors.primary },

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
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
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
});
