import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView, StatusBar,
} from 'react-native';
import PasswordInput from '../../components/PasswordInput';
import LoadingDots from '../../components/LoadingDots';
import { api } from '../../api';
import { colors, font, radius, spacing } from '../../theme';

export default function ResetPasswordScreen({ route, navigation }: any) {
  const { email } = route.params as { email: string };
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP sent to your email');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    try {
      setLoading(true);
      await api.auth.resetPassword(email, otp.trim(), password);
      Alert.alert('Success', 'Your password has been reset. Please log in.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter the OTP sent to {email} and choose a new password
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>OTP</Text>
            <TextInput
              style={styles.input}
              value={otp}
              onChangeText={setOtp}
              placeholder="6-digit code"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>New Password</Text>
            <PasswordInput
              value={password}
              onChangeText={setPassword}
              placeholder="Minimum 8 characters"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirm Password</Text>
            <PasswordInput
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Re-enter your password"
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleReset}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? <LoadingDots /> : <Text style={styles.btnText}>Reset Password</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: 56, paddingBottom: spacing.xl },
  back: { marginBottom: spacing.xl },
  backText: { fontFamily: font.medium, fontSize: 15, color: colors.textSecondary },
  header: { marginBottom: spacing.xl },
  title: { fontFamily: font.bold, fontSize: 28, color: colors.white, marginBottom: 6 },
  subtitle: { fontFamily: font.regular, fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  form: { gap: spacing.md },
  field: { gap: spacing.xs },
  label: { fontFamily: font.semiBold, fontSize: 13, color: colors.textSecondary },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.textPrimary,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { fontFamily: font.bold, fontSize: 16, color: colors.white },
});
