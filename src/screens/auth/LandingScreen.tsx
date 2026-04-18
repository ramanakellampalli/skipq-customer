import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Dimensions } from 'react-native';
import { colors, font, radius, spacing } from '../../theme';

const { height } = Dimensions.get('window');

export default function LandingScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.hero}>
        <View style={styles.logoRow}>
          <Text style={styles.logoSkip}>Skip</Text>
          <Text style={styles.logoQ}>Q</Text>
        </View>
        <Text style={styles.tagline}>Order ahead.{'\n'}Skip the queue.</Text>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.registerBtn}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.85}>
          <Text style={styles.registerText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.85}>
          <Text style={styles.loginText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: height * 0.08,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.lg,
  },
  logoSkip: {
    fontFamily: font.extraBold,
    fontSize: 56,
    color: colors.white,
    letterSpacing: -1,
  },
  logoQ: {
    fontFamily: font.extraBold,
    fontSize: 56,
    color: colors.primary,
    letterSpacing: -1,
  },
  tagline: {
    fontFamily: font.semiBold,
    fontSize: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 32,
  },
  bottom: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 16,
    gap: spacing.sm,
  },
  registerBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 18,
    alignItems: 'center',
  },
  registerText: {
    fontFamily: font.bold,
    fontSize: 16,
    color: colors.white,
  },
  loginBtn: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.lg,
    paddingVertical: 18,
    alignItems: 'center',
  },
  loginText: {
    fontFamily: font.semiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
});
