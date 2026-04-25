import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView, StatusBar,
} from 'react-native';
import { Fingerprint } from 'lucide-react-native';
import PasswordInput from '../../components/PasswordInput';
import LoadingDots from '../../components/LoadingDots';
import { api } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { colors, font, radius, spacing } from '../../theme';
import {
  isBiometricAvailable, getBiometricLabel, promptBiometric,
  saveCredentials, getCredentials, hasSavedCredentials,
} from '../../utils/biometrics';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState<string | null>(null);
  const { setAuth } = useAuthStore();

  const doLogin = useCallback(async (loginEmail: string, loginPassword: string) => {
    const { data } = await api.auth.login(loginEmail, loginPassword);
    await setAuth(data.token);
  }, [setAuth]);

  useEffect(() => {
    (async () => {
      const available = await isBiometricAvailable();
      const hasCreds = await hasSavedCredentials();
      if (available && hasCreds) {
        const label = await getBiometricLabel();
        setBiometricLabel(label);
        try {
          const success = await promptBiometric(`Sign in to SkipQ with ${label}`);
          if (success) {
            const creds = await getCredentials();
            if (creds) {
              setLoading(true);
              await doLogin(creds.email, creds.password);
            }
          }
        } catch {
          // user cancelled — fall through to manual login
        } finally {
          setLoading(false);
        }
      }
    })();
  }, [doLogin]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password');
      return;
    }
    try {
      setLoading(true);
      await doLogin(email.trim(), password);

      const available = await isBiometricAvailable();
      if (available) {
        const hasCreds = await hasSavedCredentials();
        if (!hasCreds) {
          const label = await getBiometricLabel();
          Alert.alert(
            `Enable ${label} Login?`,
            `Sign in faster next time using ${label}.`,
            [
              { text: 'Not Now', style: 'cancel' },
              { text: 'Enable', onPress: async () => { await saveCredentials(email.trim(), password); } },
            ],
          );
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid email or password';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const label = biometricLabel ?? 'Biometrics';
      const success = await promptBiometric(`Sign in to SkipQ with ${label}`);
      if (!success) return;

      const creds = await getCredentials();
      if (!creds) {
        Alert.alert('Setup required', 'Please sign in with your password first.');
        setBiometricLabel(null);
        return;
      }

      setLoading(true);
      await doLogin(creds.email, creds.password);
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Could not sign in. Try your password.');
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
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue ordering</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
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
            <Text style={styles.label}>Password</Text>
            <PasswordInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? <LoadingDots /> : <Text style={styles.btnText}>Sign In</Text>}
          </TouchableOpacity>

          {biometricLabel && !loading && (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.biometricBtn}
                onPress={handleBiometricLogin}
                activeOpacity={0.85}>
                <Fingerprint size={20} color={colors.primary} />
                <Text style={styles.biometricText}>Sign in with {biometricLabel}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.switchText}>
            New to SkipQ? <Text style={styles.switchLink}>Create account</Text>
          </Text>
        </TouchableOpacity>
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
  subtitle: { fontFamily: font.regular, fontSize: 15, color: colors.textSecondary },
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
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.xs },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontFamily: font.regular, fontSize: 13, color: colors.textSecondary },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  biometricText: { fontFamily: font.semiBold, fontSize: 15, color: colors.primary },
  switchText: { fontFamily: font.regular, fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  switchLink: { fontFamily: font.semiBold, color: colors.primary },
});
