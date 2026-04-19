import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView, StatusBar,
} from 'react-native';
import { api } from '../../api';
import { colors, font, radius, spacing } from '../../theme';

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields');
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
      await api.auth.register(name.trim(), email.trim(), password);
      navigation.navigate('Otp', { email: email.trim() });
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
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join SkipQ and order ahead at your campus</Text>
        </View>

        <View style={styles.form}>
          {[
            { label: 'Full Name', value: name, onChange: setName, placeholder: 'John Doe', secure: false, keyboard: 'default' as const, capitalize: 'words' as const },
            { label: 'College Email', value: email, onChange: setEmail, placeholder: 'you@college.edu', secure: false, keyboard: 'email-address' as const, capitalize: 'none' as const },
            { label: 'Password', value: password, onChange: setPassword, placeholder: 'Min 8 characters', secure: true, keyboard: 'default' as const, capitalize: 'none' as const },
            { label: 'Confirm Password', value: confirm, onChange: setConfirm, placeholder: 'Re-enter password', secure: true, keyboard: 'default' as const, capitalize: 'none' as const },
          ].map(f => (
            <View key={f.label} style={styles.field}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                style={styles.input}
                value={f.value}
                onChangeText={f.onChange}
                placeholder={f.placeholder}
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={f.secure}
                keyboardType={f.keyboard}
                autoCapitalize={f.capitalize}
                autoCorrect={false}
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color={colors.white} />
              : <Text style={styles.btnText}>Create Account</Text>
            }
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
  inner: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: 56, paddingBottom: spacing.xl },
  back: { marginBottom: spacing.xl },
  backText: { fontFamily: font.medium, fontSize: 15, color: colors.textSecondary },
  header: { marginBottom: spacing.xl },
  title: { fontFamily: font.bold, fontSize: 28, color: colors.white, marginBottom: 6 },
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
});
