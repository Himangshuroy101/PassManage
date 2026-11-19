import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useVault } from '../context/VaultContext';
import { Colors } from '../theme/colors';

interface CreateAccountScreenProps {
  onBack?: () => void;
}

const WEAK_PINS = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321'];

export const CreateAccountScreen: React.FC<CreateAccountScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const {
    completeOnboarding,
    setupMasterPin,
    biometricsAvailable,
    toggleBiometricsEnabled,
  } = useVault();

  const [fullName, setFullName] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [enableBio, setEnableBio] = useState<boolean>(true);
  const [showPin, setShowPin] = useState<boolean>(false);
  const [showConfirmPin, setShowConfirmPin] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Evaluate 4-digit PIN security
  const evaluatePin = (p: string) => {
    if (!p) return { score: 0, percent: '0%', label: 'ENTER 4 DIGITS', color: Colors.textMuted };
    if (p.length < 4) {
      return {
        score: p.length,
        percent: `${p.length * 25}%`,
        label: `${p.length}/4 DIGITS`,
        color: Colors.warning,
      };
    }
    if (WEAK_PINS.includes(p)) {
      return { score: 2, percent: '50%', label: 'EASY TO GUESS PIN', color: Colors.danger };
    }
    return { score: 4, percent: '100%', label: 'SECURE 4-DIGIT PIN', color: Colors.accentMint };
  };

  const strength = evaluatePin(pin);

  const handleInitializeVault = async () => {
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Please enter your name to personalize your vault');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setErrorMessage('Master PIN must be exactly 4 numeric digits');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }

    if (pin !== confirmPin) {
      setErrorMessage('Confirm PIN does not match Master PIN');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }

    try {
      setIsSubmitting(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      // 1. Setup 4-digit Master PIN in SecureStore
      await setupMasterPin(pin);

      // 2. Configure Biometric preference if available
      if (biometricsAvailable) {
        await toggleBiometricsEnabled(enableBio);
      }

      // 3. Complete onboarding and store local User Profile
      await completeOnboarding({
        name: fullName.trim(),
        email: '',
      });
    } catch (err) {
      setErrorMessage('Failed to initialize vault. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top + 10, 24), paddingBottom: Math.max(insets.bottom + 20, 32) },
        ]}
      >
        {/* Main Vault Setup Card */}
        <View style={styles.card}>
          {/* Top Brand Row */}
          <View style={styles.brandRow}>
            {onBack ? (
              <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Feather name="arrow-left" size={20} color={Colors.textDark} />
              </TouchableOpacity>
            ) : null}

            <View style={styles.brandBadge}>
              <Feather name="shield" size={17} color="#FFFFFF" />
            </View>
            <Text style={styles.brandTitle}>PassManage</Text>
          </View>

          {/* Headline & Description */}
          <Text style={styles.headline}>Set Up Your Vault</Text>
          <Text style={styles.subtitle}>
            Your credentials stay strictly on this device. Create your 4-digit master PIN to decrypt your offline vault.
          </Text>

          {/* Error Message Box */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={16} color={Colors.danger} style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Vault Owner Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Your Name</Text>
              <View style={styles.inputBox}>
                <Feather name="user" size={18} color={Colors.textMuted} style={styles.leadingIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. John Doe"
                  placeholderTextColor={Colors.textMuted}
                  value={fullName}
                  onChangeText={t => {
                    setFullName(t);
                    setErrorMessage('');
                  }}
                  autoCapitalize="words"
                />
              </View>
              <Text style={styles.inputHelper}>Personalizes your vault greeting and avatar initials</Text>
            </View>

            {/* 4-Digit Master PIN */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>4-Digit Master PIN</Text>
                <Text style={styles.pinHint}>Numbers only (0-9)</Text>
              </View>
              <View style={styles.inputBox}>
                <Feather name="lock" size={18} color={Colors.textMuted} style={styles.leadingIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="••••"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPin}
                  value={pin}
                  onChangeText={t => {
                    const clean = t.replace(/[^0-9]/g, '').slice(0, 4);
                    setPin(clean);
                    setErrorMessage('');
                  }}
                  keyboardType="number-pad"
                  maxLength={4}
                />
                <TouchableOpacity
                  onPress={() => setShowPin(p => !p)}
                  style={styles.trailingBtn}
                >
                  <Feather
                    name={showPin ? 'eye-off' : 'eye'}
                    size={18}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {/* Dynamic PIN Strength / Completion Indicator */}
              <View style={styles.strengthRow}>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>
                  {strength.label}
                </Text>
                <Text style={styles.strengthPercent}>{strength.percent}</Text>
              </View>

              {/* 4 Segmented Strength Pills */}
              <View style={styles.segmentedBar}>
                {[1, 2, 3, 4].map(seg => {
                  const isFilled = strength.score >= seg;
                  return (
                    <View
                      key={seg}
                      style={[
                        styles.segment,
                        isFilled && { backgroundColor: strength.color },
                      ]}
                    />
                  );
                })}
              </View>
            </View>

            {/* Confirm 4-Digit Master PIN */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm 4-Digit Master PIN</Text>
              <View style={styles.inputBox}>
                <Feather name="rotate-ccw" size={18} color={Colors.textMuted} style={styles.leadingIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="••••"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showConfirmPin}
                  value={confirmPin}
                  onChangeText={t => {
                    const clean = t.replace(/[^0-9]/g, '').slice(0, 4);
                    setConfirmPin(clean);
                    setErrorMessage('');
                  }}
                  keyboardType="number-pad"
                  maxLength={4}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPin(p => !p)}
                  style={styles.trailingBtn}
                >
                  <Feather
                    name={showConfirmPin ? 'eye-off' : 'eye'}
                    size={18}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Biometric Toggle (if hardware available) */}
            {biometricsAvailable && (
              <View style={styles.biometricRow}>
                <View style={styles.biometricLeft}>
                  <View style={styles.bioIconBox}>
                    <Ionicons name="finger-print" size={20} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.biometricTitle}>Enable Biometric Unlock</Text>
                    <Text style={styles.biometricSubtitle}>Unlock with fingerprint sensor</Text>
                  </View>
                </View>
                <Switch
                  value={enableBio}
                  onValueChange={setEnableBio}
                  trackColor={{ false: '#E2E8F0', true: Colors.accentMint }}
                  thumbColor="#FFFFFF"
                />
              </View>
            )}

            {/* Zero-Knowledge Security Notice Callout */}
            <View style={styles.securityCallout}>
              <Feather name="shield" size={18} color={Colors.primary} style={styles.calloutIcon} />
              <View style={styles.calloutTextContainer}>
                <Text style={styles.calloutTitle}>Zero-Knowledge Local PIN</Text>
                <Text style={styles.calloutDesc}>
                  Your 4-digit PIN will be used on the lock screen keypad to decrypt your vault. No server can recover it if lost.
                </Text>
              </View>
            </View>

            {/* Initialize Secure Vault Action Button */}
            <TouchableOpacity
              style={styles.createBtn}
              onPress={handleInitializeVault}
              activeOpacity={0.88}
              disabled={isSubmitting}
            >
              <Text style={styles.createBtnText}>
                {isSubmitting ? 'Encrypting & Initializing...' : 'Initialize Secure Vault'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  brandBadge: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 2,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textDark,
    marginLeft: 10,
    letterSpacing: -0.4,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textDark,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
    lineHeight: 20,
    marginBottom: 8,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '600',
  },
  formContainer: {
    width: '100%',
    marginTop: 10,
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  pinHint: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  inputBox: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  leadingIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    letterSpacing: 2,
    color: Colors.textDark,
    fontWeight: '600',
  },
  trailingBtn: {
    padding: 6,
  },
  inputHelper: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 6,
  },
  strengthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  strengthPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  segmentedBar: {
    flexDirection: 'row',
    gap: 6,
    height: 4,
    width: '100%',
  },
  segment: {
    flex: 1,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
  },
  biometricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    marginTop: 4,
  },
  biometricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bioIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  biometricTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textDark,
  },
  biometricSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  securityCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    marginTop: 4,
  },
  calloutIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  calloutTextContainer: {
    flex: 1,
  },
  calloutTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 2,
  },
  calloutDesc: {
    fontSize: 11.5,
    color: Colors.primaryLight,
    lineHeight: 16,
  },
  createBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 5,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
