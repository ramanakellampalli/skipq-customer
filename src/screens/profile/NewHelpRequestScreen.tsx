import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../api';
import { useStudentStore } from '../../store/studentStore';
import { ServiceRequestType } from '../../types';
import { colors, font, radius, spacing } from '../../theme';

const TYPES: { value: ServiceRequestType; label: string }[] = [
  { value: 'PAYMENT_ISSUE',  label: 'Payment Issue' },
  { value: 'REFUND_ISSUE',   label: 'Refund Issue' },
  { value: 'ACCOUNT_ISSUE',  label: 'Account Issue' },
  { value: 'TECHNICAL',      label: 'Technical' },
  { value: 'OTHER',          label: 'Other' },
];

export default function NewHelpRequestScreen() {
  const navigation = useNavigation<any>();
  const addServiceRequest = useStudentStore(state => state.addServiceRequest);

  const [type, setType] = useState<ServiceRequestType>('PAYMENT_ISSUE');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const submit = useMutation({
    mutationFn: () => api.support.create({ type, subject: subject.trim(), description: description.trim() }),
    onSuccess: (res) => {
      addServiceRequest(res.data);
      navigation.goBack();
    },
    onError: () => Alert.alert('Error', 'Failed to submit request. Please try again.'),
  });

  const canSubmit = subject.trim().length > 0 && description.trim().length > 0 && !submit.isPending;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Request</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.typeGrid}>
            {TYPES.map(t => (
              <TouchableOpacity
                key={t.value}
                style={[styles.typeChip, type === t.value && styles.typeChipActive]}
                onPress={() => setType(t.value)}
                activeOpacity={0.7}>
                <Text style={[styles.typeChipText, type === t.value && styles.typeChipTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="Brief summary of your issue"
            placeholderTextColor={colors.textSecondary}
            maxLength={255}
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the issue in detail…"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={() => submit.mutate()}
          disabled={!canSubmit}
          activeOpacity={0.85}>
          <Text style={styles.submitText}>
            {submit.isPending ? 'Submitting…' : 'Submit Request'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: 56,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontFamily: font.bold, fontSize: 18, color: colors.white },
  backBtn: { width: 60 },
  backText: { fontFamily: font.semiBold, fontSize: 16, color: colors.primary },
  content: { padding: spacing.md, gap: spacing.lg },
  field: { gap: spacing.sm },
  label: {
    fontFamily: font.semiBold,
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  typeChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  typeChipText: { fontFamily: font.semiBold, fontSize: 13, color: colors.textSecondary },
  typeChipTextActive: { color: colors.primary },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.textPrimary,
  },
  textArea: { minHeight: 120, paddingTop: 12 },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: { fontFamily: font.bold, color: colors.white, fontSize: 15 },
});
