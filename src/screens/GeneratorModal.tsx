import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import {
  generatePassword,
  calculatePasswordStrength,
  copyToClipboardSecurely,
} from '../services/security';
import { useVault } from '../context/VaultContext';

export const GeneratorModal: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { setItemToEdit, setIsAddEditModalVisible, setActiveTab } = useVault();

  const [length, setLength] = useState<number>(16);
  const [includeUppercase, setIncludeUppercase] = useState<boolean>(true);
  const [includeLowercase, setIncludeLowercase] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const regenerate = () => {
    const pass = generatePassword({
      length,
      includeUppercase,
      includeLowercase,
      includeNumbers,
      includeSymbols,
    });
    setGeneratedPassword(pass);
  };

  useEffect(() => {
    regenerate();
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);

  const strength = calculatePasswordStrength(generatedPassword);

  const handleToggleUpper = async (val: boolean) => {
    if (!val && !includeLowercase && !includeNumbers && !includeSymbols) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setIncludeUppercase(val);
  };

  const handleToggleLower = async (val: boolean) => {
    if (!val && !includeUppercase && !includeNumbers && !includeSymbols) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setIncludeLowercase(val);
  };

  const handleToggleNumbers = async (val: boolean) => {
    if (!val && !includeUppercase && !includeLowercase && !includeSymbols) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setIncludeNumbers(val);
  };

  const handleToggleSymbols = async (val: boolean) => {
    if (!val && !includeUppercase && !includeLowercase && !includeNumbers) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setIncludeSymbols(val);
  };

  const handleCopy = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await copyToClipboardSecurely(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUseInNewVault = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setItemToEdit({
      id: '',
      appName: '',
      username: '',
      password: generatedPassword,
      siteUrl: '',
      category: 'login',
      tags: ['Login'],
      isFavorite: false,
      createdAt: 0,
      updatedAt: 0,
    });
    setIsAddEditModalVisible(true);
  };

  const adjustLength = (delta: number) => {
    const newLen = Math.max(8, Math.min(32, length + delta));
    setLength(newLen);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <Text style={styles.screenTitle}>Password Generator</Text>
      <Text style={styles.screenSubtitle}>
        Generate cryptographically secure passwords
      </Text>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Output Password Card */}
        <View style={styles.passwordCard}>
          <Text style={styles.passwordText} selectable>
            {generatedPassword}
          </Text>

          <View style={styles.cardActionsRow}>
            {/* Strength Pill */}
            <View style={[styles.strengthBadge, { backgroundColor: strength.color + '20' }]}>
              <Text style={[styles.strengthBadgeText, { color: strength.color }]}>
                {strength.label} ({strength.score}%)
              </Text>
            </View>

            <View style={styles.buttonGroup}>
              {/* Regenerate Button */}
              <TouchableOpacity
                style={styles.actionRoundBtn}
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  regenerate();
                }}
              >
                <Feather name="refresh-cw" size={18} color={Colors.primary} />
              </TouchableOpacity>

              {/* Copy Button */}
              <TouchableOpacity
                style={[styles.actionRoundBtn, copied && styles.copiedBtn]}
                onPress={handleCopy}
              >
                <Feather
                  name={copied ? 'check' : 'copy'}
                  size={18}
                  color={copied ? '#10B981' : Colors.primary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Length Controls */}
        <View style={styles.sectionCard}>
          <View style={styles.lengthHeaderRow}>
            <Text style={styles.sectionLabel}>Password Length</Text>
            <Text style={styles.lengthNumberText}>{length} characters</Text>
          </View>

          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => adjustLength(-1)}
              disabled={length <= 8}
            >
              <Feather name="minus" size={20} color={length <= 8 ? Colors.textMuted : Colors.textDark} />
            </TouchableOpacity>

            <View style={styles.lengthBarContainer}>
              <View
                style={[
                  styles.lengthBarFill,
                  { width: `${((length - 8) / 24) * 100}%` },
                ]}
              />
            </View>

            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => adjustLength(1)}
              disabled={length >= 32}
            >
              <Feather name="plus" size={20} color={length >= 32 ? Colors.textMuted : Colors.textDark} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Character Toggles */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Character Settings</Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Uppercase Letters</Text>
              <Text style={styles.toggleSub}>A B C D E F G ...</Text>
            </View>
            <Switch
              value={includeUppercase}
              onValueChange={handleToggleUpper}
              trackColor={{ false: '#E2E8F0', true: Colors.accentMint }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Lowercase Letters</Text>
              <Text style={styles.toggleSub}>a b c d e f g ...</Text>
            </View>
            <Switch
              value={includeLowercase}
              onValueChange={handleToggleLower}
              trackColor={{ false: '#E2E8F0', true: Colors.accentMint }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Numbers</Text>
              <Text style={styles.toggleSub}>0 1 2 3 4 5 6 7 8 9</Text>
            </View>
            <Switch
              value={includeNumbers}
              onValueChange={handleToggleNumbers}
              trackColor={{ false: '#E2E8F0', true: Colors.accentMint }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Special Symbols</Text>
              <Text style={styles.toggleSub}>! @ # $ % ^ & * ...</Text>
            </View>
            <Switch
              value={includeSymbols}
              onValueChange={handleToggleSymbols}
              trackColor={{ false: '#E2E8F0', true: Colors.accentMint }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Use in Vault Action */}
        <TouchableOpacity
          style={styles.useBtn}
          onPress={handleUseInNewVault}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#0D533A', '#137855']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.useBtnGradient}
          >
            <Feather name="plus-circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.useBtnText}>Use in New Vault Item</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textDark,
    marginTop: 8,
  },
  screenSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  scrollContent: {
    gap: 16,
    paddingBottom: 110,
  },
  passwordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  passwordText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textDark,
    letterSpacing: 1,
    marginBottom: 16,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  strengthBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  strengthBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  actionRoundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copiedBtn: {
    backgroundColor: '#DCFCE7',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDark,
  },
  lengthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  lengthNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lengthBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  lengthBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
  },
  toggleSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F8FAFC',
  },
  useBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  useBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  useBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
