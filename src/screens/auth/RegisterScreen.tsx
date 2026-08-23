import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView, StatusBar,
} from 'react-native';
import { api } from '../../api';
import { colors, font, radius, spacing } from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PasswordInput from '../../components/PasswordInput';
import LoadingDots from '../../components/LoadingDots';

export default function RegisterScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields');
      return;
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      Alert.alert('Invalid phone', 'Please enter a 10-digit phone number');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Password mismatch', 'Passwords do not match');
      return;
    }
    try {
      setLoading(true);
      const fullPhone = `+91${phone.trim()}`;
      await api.auth.register(name.trim(), email.trim(), password, fullPhone);
      navigation.navigate('Otp', { email: email.trim(), name: name.trim(), password, phone: fullPhone });
    } catch (err: any) {
      Alert.alert('Registration Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={[styles.inner, { paddingTop: insets.top + spacing.lg }]}
        keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join SkipQ and order ahead at your campus</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="John Doe"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>College Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@college.edu"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneRow}>
              <View style={styles.phonePrefix}>
                <Text style={styles.phonePrefixText}>+91</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={t => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                maxLength={10}
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <PasswordInput
              value={password}
              onChangeText={setPassword}
              placeholder="Min 8 characters"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirm Password</Text>
            <PasswordInput
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Re-enter password"
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? <LoadingDots /> : <Text style={styles.btnText}>Create Account</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.switchText}>
            Already have an account? <Text style={styles.switchLink}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  back: { marginBottom: spacing.xl },
  backText: { fontFamily: font.medium, fontSize: 15, color: colors.textSecondary },
  header: { marginBottom: spacing.xl },
  title: { fontFamily: font.bold, fontSize: 28, color: colors.textPrimary, marginBottom: 6 },
  subtitle: { fontFamily: font.regular, fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  form: { gap: spacing.md, marginBottom: spacing.xl },
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
  switchText: { fontFamily: font.regular, fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  switchLink: { fontFamily: font.semiBold, color: colors.primary },
  phoneRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  phonePrefix: {
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: colors.surfaceHigh ?? colors.border,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  phonePrefixText: { fontFamily: font.semiBold, fontSize: 15, color: colors.textPrimary },
  phoneInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.textPrimary,
  },
});
