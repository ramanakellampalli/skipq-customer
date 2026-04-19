import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, StatusBar,
} from 'react-native';
import { api } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { colors, font, radius, spacing } from '../../theme';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function OtpScreen({ route, navigation }: any) {
  const { email, name, password } = route.params as { email: string; name: string; password: string };
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const inputs = useRef<(TextInput | null)[]>([]);
  const { setAuth } = useAuthStore();

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
    if (next.every(d => d !== '') && next.join('').length === OTP_LENGTH) {
      verify(next.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const verify = async (code: string) => {
    try {
      setLoading(true);
      const { data } = await api.auth.verifyOtp(email, code);
      await setAuth(data.token, data.userId, data.name, data.email);
    } catch (err: any) {
      Alert.alert('Invalid OTP', err.response?.data?.message || 'Code is incorrect or expired');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    try {
      setResending(true);
      await api.auth.register(name, email, password);
      setCountdown(RESEND_COOLDOWN);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
      Alert.alert('Code sent', 'A new OTP has been sent to ' + email);
    } catch (err: any) {
      Alert.alert('Could not resend', err.response?.data?.message || 'Please go back and try again');
    } finally {
      setResending(false);
    }
  };

  const handleVerifyPress = () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      Alert.alert('Incomplete', 'Please enter the full 6-digit code');
      return;
    }
    verify(code);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.inner}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>
        </View>

        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={ref => { inputs.current[i] = ref; }}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
              value={digit}
              onChangeText={text => handleChange(text, i)}
              onKeyPress={e => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, (loading || otp.join('').length < OTP_LENGTH) && styles.btnDisabled]}
          onPress={handleVerifyPress}
          disabled={loading}
          activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.btnText}>Verify</Text>
          }
        </TouchableOpacity>

        <View style={styles.resendRow}>
          <Text style={styles.resendText}>{"Didn't receive it? "}</Text>
          {countdown > 0 ? (
            <Text style={styles.resendCountdown}>Resend in {countdown}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              {resending
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Text style={styles.resendLink}>Resend code</Text>
              }
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: 56, paddingBottom: spacing.xl },
  back: { marginBottom: spacing.xl },
  backText: { fontFamily: font.medium, fontSize: 15, color: colors.textSecondary },
  header: { marginBottom: 40 },
  title: { fontFamily: font.bold, fontSize: 28, color: colors.white, marginBottom: 10 },
  subtitle: { fontFamily: font.regular, fontSize: 15, color: colors.textSecondary, lineHeight: 24 },
  emailHighlight: { fontFamily: font.semiBold, color: colors.textPrimary },
  otpRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginBottom: 40,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingVertical: 0,
    fontSize: 22,
    fontFamily: font.bold,
    color: colors.white,
  },
  otpBoxFilled: { borderColor: colors.primary },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontFamily: font.bold, fontSize: 16, color: colors.white },
  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  resendText: { fontFamily: font.regular, fontSize: 14, color: colors.textSecondary },
  resendCountdown: { fontFamily: font.semiBold, fontSize: 14, color: colors.textSecondary },
  resendLink: { fontFamily: font.semiBold, fontSize: 14, color: colors.primary },
});
