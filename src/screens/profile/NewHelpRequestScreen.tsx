import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
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
  const [showDropdown, setShowDropdown] = useState(false);
  const [description, setDescription] = useState('');

  const selectedLabel = TYPES.find(t => t.value === type)!.label;

  const submit = useMutation({
    mutationFn: () => api.support.create({ type, description: description.trim() }),
    onSuccess: (res) => {
      addServiceRequest(res.data);
      navigation.goBack();
    },
    onError: () => Alert.alert('Error', 'Failed to submit request. Please try again.'),
  });

  const canSubmit = description.trim().length > 0 && !submit.isPending;

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
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowDropdown(true)} activeOpacity={0.8}>
            <Text style={styles.dropdownText}>{selectedLabel}</Text>
            <Text style={styles.dropdownArrow}>▾</Text>
          </TouchableOpacity>
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

      <Modal visible={showDropdown} transparent animationType="fade" onRequestClose={() => setShowDropdown(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowDropdown(false)}>
          <View style={styles.dropdownList}>
            <FlatList
              data={TYPES}
              keyExtractor={item => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.dropdownItem, item.value === type && styles.dropdownItemActive]}
                  onPress={() => { setType(item.value); setShowDropdown(false); }}
                  activeOpacity={0.7}>
                  <Text style={[styles.dropdownItemText, item.value === type && styles.dropdownItemTextActive]}>
                    {item.label}
                  </Text>
                  {item.value === type && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
  },
  dropdownText: { fontFamily: font.regular, fontSize: 15, color: colors.textPrimary },
  dropdownArrow: { fontSize: 14, color: colors.textSecondary },
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
  textArea: { minHeight: 140, paddingTop: 12 },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: { fontFamily: font.bold, color: colors.white, fontSize: 15 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  dropdownList: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemActive: { backgroundColor: colors.primaryGlow },
  dropdownItemText: { fontFamily: font.regular, fontSize: 15, color: colors.textPrimary },
  dropdownItemTextActive: { fontFamily: font.semiBold, color: colors.primary },
  checkmark: { color: colors.primary, fontSize: 16, fontWeight: '700' },
});
