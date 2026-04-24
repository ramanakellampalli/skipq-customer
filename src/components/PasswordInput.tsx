import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors, font, radius, spacing } from '../theme';

interface Props extends Omit<TextInputProps, 'secureTextEntry'> {}

export default function PasswordInput({ style, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.container}>
      <TextInput
        {...props}
        style={[styles.input, style]}
        secureTextEntry={!visible}
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity style={styles.icon} onPress={() => setVisible(v => !v)} hitSlop={8}>
        {visible
          ? <EyeOff size={18} color={colors.textSecondary} />
          : <Eye size={18} color={colors.textSecondary} />
        }
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.textPrimary,
  },
  icon: {
    paddingHorizontal: spacing.md,
  },
});
