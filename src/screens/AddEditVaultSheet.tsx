import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { VaultItem, VaultCategory } from '../types/vault';
import { Colors } from '../theme/colors';
import {
  calculatePasswordStrength,
  generatePassword,
} from '../services/security';
import { useVault } from '../context/VaultContext';

interface AddEditVaultSheetProps {
  visible: boolean;
  itemToEdit: VaultItem | null;
  onClose: () => void;
}

const CATEGORY_OPTIONS: { id: VaultCategory; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { id: 'login', label: 'Login', icon: 'globe' },
  { id: 'mobile', label: 'Mobile App', icon: 'smartphone' },
  { id: 'payment', label: 'Payment', icon: 'credit-card' },
  { id: 'identity', label: 'Identity', icon: 'user' },
  { id: 'wifi', label: 'WiFi', icon: 'wifi' },
  { id: 'note', label: 'Note', icon: 'file-text' },
];

export const AddEditVaultSheet: React.FC<AddEditVaultSheetProps> = ({
  visible,
  itemToEdit,
  onClose,
}) => {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['88%'], []);
  const { addItem, updateItem } = useVault();

  const [appName, setAppName] = useState<string>('');
  const [siteUrl, setSiteUrl] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [category, setCategory] = useState<VaultCategory>('login');
  const [tagInput, setTagInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const isEditing = Boolean(itemToEdit && itemToEdit.id);

  // Sync state and open/close sheet
  useEffect(() => {
    if (visible) {
      if (itemToEdit && itemToEdit.id) {
        setAppName(itemToEdit.appName || '');
        setSiteUrl(itemToEdit.siteUrl || '');
        setUsername(itemToEdit.username || '');
        setPassword(itemToEdit.password || '');
        setCategory(itemToEdit.category || 'login');
        setTags(itemToEdit.tags || ['Login']);
      } else if (itemToEdit && !itemToEdit.id) {
        setAppName('');
        setSiteUrl('');
        setUsername('');
        setPassword(itemToEdit.password || '');
        setCategory('login');
        setTags(['Login']);
      } else {
        setAppName('');
        setSiteUrl('');
        setUsername('');
        setPassword('');
        setCategory('login');
        setTags(['Login']);
      }
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [itemToEdit, visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const strength = calculatePasswordStrength(password);

  const handleGeneratePassword = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newPass = generatePassword({
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
    });
    setPassword(newPass);
    setShowPassword(true);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = async () => {
    if (!appName.trim()) {
      Alert.alert('Validation Error', 'Please enter an App / Website Name');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Validation Error', 'Please enter or generate a password');
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (isEditing && itemToEdit) {
      await updateItem(itemToEdit.id, {
        appName: appName.trim(),
        siteUrl: siteUrl.trim(),
        username: username.trim(),
        password: password.trim(),
        category,
        tags,
      });
    } else {
      await addItem({
        appName: appName.trim(),
        siteUrl: siteUrl.trim(),
        username: username.trim(),
        password: password.trim(),
        category,
        tags,
        isFavorite: false,
      });
    }

    onClose();
  };

  if (!visible) return null;

  return (
    <BottomSheet
      ref={sheetRef}
      index={visible ? 0 : -1}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose={true}
      onClose={onClose}
      backdropComponent={renderBackdrop}
      containerStyle={styles.bottomSheetContainer}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBackground}
    >
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Feather name="arrow-left" size={22} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Vault Item' : 'Create New Vault'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Category Selection */}
        <Text style={styles.inputSectionLabel}>Select Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {CATEGORY_OPTIONS.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                category === cat.id && styles.categoryChipActive,
              ]}
              onPress={() => setCategory(cat.id)}
            >
              <Feather
                name={cat.icon}
                size={14}
                color={category === cat.id ? '#FFFFFF' : Colors.textSecondary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.categoryChipText,
                  category === cat.id && styles.categoryChipTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* App / Website Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>App / Website Name</Text>
          <View style={styles.inputBox}>
            <Feather name="shield" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <BottomSheetTextInput
              style={styles.textInput}
              placeholder="e.g. Netflix, Upwork, Google"
              placeholderTextColor={Colors.textMuted}
              value={appName}
              onChangeText={setAppName}
            />
          </View>
        </View>

        {/* Site Address */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Site Address / URL</Text>
          <View style={styles.inputBox}>
            <Feather name="link" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <BottomSheetTextInput
              style={styles.textInput}
              placeholder="https://example.com"
              placeholderTextColor={Colors.textMuted}
              value={siteUrl}
              onChangeText={setSiteUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        </View>

        {/* Username / User ID */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>User ID / Username / Email</Text>
          <View style={styles.inputBox}>
            <Feather name="user" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <BottomSheetTextInput
              style={styles.textInput}
              placeholder="john.doe@gmail.com"
              placeholderTextColor={Colors.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <View style={styles.labelWithAction}>
            <Text style={styles.inputLabel}>Password</Text>
            <TouchableOpacity
              style={styles.generateTextBtn}
              onPress={handleGeneratePassword}
            >
              <Ionicons name="sparkles" size={14} color={Colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.generateBtnText}>Auto Generate</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputBox}>
            <Feather name="lock" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <BottomSheetTextInput
              style={styles.textInput}
              placeholder="Enter strong password"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Feather
                name={showPassword ? 'eye-off' : 'eye'}
                size={18}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Password Strength Meter */}
          {password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBarBg}>
                <View
                  style={[
                    styles.strengthBarFill,
                    {
                      width: `${strength.score}%`,
                      backgroundColor: strength.color,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.strengthText, { color: strength.color }]}>
                Strength: {strength.label} ({strength.score}%)
              </Text>
            </View>
          )}
        </View>

        {/* Tags */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Tags</Text>
          <View style={styles.tagInputRow}>
            <BottomSheetTextInput
              style={styles.tagInput}
              placeholder="Add tag (e.g. Work, Social)"
              placeholderTextColor={Colors.textMuted}
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={handleAddTag}
            />
            <TouchableOpacity style={styles.addTagBtn} onPress={handleAddTag}>
              <Feather name="plus" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.tagChipsList}>
            {tags.map((tag, idx) => (
              <View key={idx} style={styles.tagBadge}>
                <Text style={styles.tagBadgeText}>{tag}</Text>
                <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                  <Feather name="x" size={12} color="#065F46" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#0D533A', '#137855']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveGradient}
          >
            <Text style={styles.saveBtnText}>
              {isEditing ? 'Save Changes' : 'Create the Vault'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  bottomSheetContainer: {
    zIndex: 9999,
  },
  handleIndicator: {
    backgroundColor: '#CBD5E1',
    width: 44,
    height: 4,
    borderRadius: 2,
  },
  sheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    elevation: 50,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  closeBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  inputSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 4,
  },
  categoryScroll: {
    marginBottom: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    gap: 6,
  },
  labelWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textDark,
  },
  generateTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  generateBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textDark,
  },
  eyeBtn: {
    padding: 6,
  },
  strengthContainer: {
    marginTop: 6,
  },
  strengthBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 14,
    color: Colors.textDark,
  },
  addTagBtn: {
    width: 44,
    height: 44,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagChipsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tagBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  saveBtn: {
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
