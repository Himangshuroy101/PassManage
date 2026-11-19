import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '../../theme/colors';
import { verifyMasterPin } from '../../services/security';
import { useVault } from '../../context/VaultContext';

interface ChangePinModalProps {
  visible: boolean;
  onClose: () => void;
}

type ChangeStep = 'verify_old' | 'enter_new' | 'confirm_new' | 'success';

const PIN_LENGTH = 4;

export const ChangePinModal: React.FC<ChangePinModalProps> = ({
  visible,
  onClose,
}) => {
  const {
    setupMasterPin,
    biometricsAvailable,
    biometricsEnabled,
    unlockWithBiometrics,
  } = useVault();

  const [step, setStep] = useState<ChangeStep>('verify_old');
  const [currentInput, setCurrentInput] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const shakeX = useSharedValue(0);

  // Reset state whenever modal opens
  useEffect(() => {
    if (visible) {
      setStep('verify_old');
      setCurrentInput('');
      setNewPin('');
      setErrorMessage('');
      shakeX.value = 0;
    }
  }, [visible]);

  const triggerShake = () => {
    shakeX.value = withSequence(
      withTiming(-14, { duration: 55 }),
      withTiming(14, { duration: 55 }),
      withTiming(-10, { duration: 55 }),
      withTiming(10, { duration: 55 }),
      withTiming(-4, { duration: 55 }),
      withTiming(0, { duration: 55 })
    );
  };

  const animatedShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const handleKeyPress = (digit: string) => {
    if (currentInput.length >= PIN_LENGTH || step === 'success') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    const updated = currentInput + digit;
    setCurrentInput(updated);
    setErrorMessage('');

    if (updated.length === PIN_LENGTH) {
      handlePinComplete(updated);
    }
  };

  const handleDelete = () => {
    if (currentInput.length > 0 && step !== 'success') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setCurrentInput(prev => prev.slice(0, -1));
      setErrorMessage('');
    }
  };

  const handlePinComplete = async (enteredPin: string) => {
    if (step === 'verify_old') {
      const isValid = await verifyMasterPin(enteredPin);
      if (isValid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setStep('enter_new');
        setCurrentInput('');
        setErrorMessage('');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        triggerShake();
        setErrorMessage('Incorrect current PIN. Please try again.');
        setCurrentInput('');
      }
    } else if (step === 'enter_new') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setNewPin(enteredPin);
      setStep('confirm_new');
      setCurrentInput('');
      setErrorMessage('');
    } else if (step === 'confirm_new') {
      if (enteredPin === newPin) {
        const success = await setupMasterPin(enteredPin);
        if (success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          setStep('success');
          setCurrentInput('');
          setErrorMessage('');
          setTimeout(() => {
            onClose();
          }, 1400);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
          triggerShake();
          setErrorMessage('Failed to update PIN. Please try again.');
          setCurrentInput('');
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        triggerShake();
        setErrorMessage('PINs do not match. Re-enter your new PIN.');
        setStep('enter_new');
        setCurrentInput('');
        setNewPin('');
      }
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header Bar */}
          <View style={styles.headerRow}>
            <View style={styles.headerIconBox}>
              <Feather name="shield" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.modalHeaderTitle}>Change Master PIN</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Feather name="x" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Step Progress Indicators */}
          {step !== 'success' && (
            <View style={styles.stepTrackRow}>
              <View
                style={[
                  styles.stepPill,
                  step === 'verify_old' ? styles.stepPillActive : styles.stepPillDone,
                ]}
              >
                <Text
                  style={[
                    styles.stepPillText,
                    step === 'verify_old' ? styles.stepPillTextActive : styles.stepPillTextDone,
                  ]}
                >
                  1. Current
                </Text>
              </View>

              <View style={styles.stepConnector} />

              <View
                style={[
                  styles.stepPill,
                  step === 'enter_new'
                    ? styles.stepPillActive
                    : step === 'confirm_new'
                    ? styles.stepPillDone
                    : styles.stepPillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.stepPillText,
                    step === 'enter_new'
                      ? styles.stepPillTextActive
                      : step === 'confirm_new'
                      ? styles.stepPillTextDone
                      : styles.stepPillTextInactive,
                  ]}
                >
                  2. New PIN
                </Text>
              </View>

              <View style={styles.stepConnector} />

              <View
                style={[
                  styles.stepPill,
                  step === 'confirm_new' ? styles.stepPillActive : styles.stepPillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.stepPillText,
                    step === 'confirm_new' ? styles.stepPillTextActive : styles.stepPillTextInactive,
                  ]}
                >
                  3. Confirm
                </Text>
              </View>
            </View>
          )}

          {/* Dynamic Content */}
          {step === 'success' ? (
            <View style={styles.successContainer}>
              <View style={styles.successIconCircle}>
                <Feather name="check" size={36} color="#10B981" />
              </View>
              <Text style={styles.successTitle}>Master PIN Updated</Text>
              <Text style={styles.successSub}>
                Your vault encryption key and lock code have been successfully changed.
              </Text>
            </View>
          ) : (
            <>
              {/* Instructions Header */}
              <View style={styles.instructionBox}>
                <Text style={styles.instructionTitle}>
                  {step === 'verify_old' && 'Verify Current PIN'}
                  {step === 'enter_new' && 'Create New PIN'}
                  {step === 'confirm_new' && 'Confirm New PIN'}
                </Text>
                <Text style={styles.instructionDesc}>
                  {step === 'verify_old' && 'Enter your current 4-digit Master PIN to continue.'}
                  {step === 'enter_new' && 'Choose a secure 4-digit Master PIN for vault access.'}
                  {step === 'confirm_new' && 'Re-enter your new 4-digit PIN to confirm.'}
                </Text>
              </View>

              {/* 4 Digit Visual Dots */}
              <Animated.View style={[styles.dotsContainer, animatedShakeStyle]}>
                {[0, 1, 2, 3].map(i => {
                  const isFilled = i < currentInput.length;
                  return (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        isFilled && styles.dotFilled,
                        errorMessage ? styles.dotError : null,
                      ]}
                    />
                  );
                })}
              </Animated.View>

              {/* Error Message */}
              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <Feather name="alert-circle" size={13} color="#EF4444" style={{ marginRight: 4 }} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : (
                <View style={{ height: 16 }} />
              )}

              {/* 3x4 Numeric Keypad */}
              <View style={styles.keypad}>
                <View style={styles.keypadRow}>
                  {['1', '2', '3'].map(k => (
                    <TouchableOpacity
                      key={k}
                      style={styles.keyBtn}
                      onPress={() => handleKeyPress(k)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.keyText}>{k}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.keypadRow}>
                  {['4', '5', '6'].map(k => (
                    <TouchableOpacity
                      key={k}
                      style={styles.keyBtn}
                      onPress={() => handleKeyPress(k)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.keyText}>{k}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.keypadRow}>
                  {['7', '8', '9'].map(k => (
                    <TouchableOpacity
                      key={k}
                      style={styles.keyBtn}
                      onPress={() => handleKeyPress(k)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.keyText}>{k}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.keypadRow}>
                  <View style={styles.keyEmpty} />
                  <TouchableOpacity
                    style={styles.keyBtn}
                    onPress={() => handleKeyPress('0')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.keyText}>0</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.keyBtn, styles.deleteBtn]}
                    onPress={handleDelete}
                    activeOpacity={0.7}
                  >
                    <Feather name="delete" size={20} color={Colors.textDark} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Biometric Verification for Step 1 */}
              {step === 'verify_old' && biometricsAvailable && biometricsEnabled && (
                <View style={styles.verifyAlternativeCol}>
                  <TouchableOpacity
                    style={styles.bioVerifyBtn}
                    onPress={async () => {
                      const success = await unlockWithBiometrics();
                      if (success) {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                        setStep('enter_new');
                        setCurrentInput('');
                        setErrorMessage('');
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="finger-print" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.bioVerifyText}>Verify with Fingerprint</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 45, 30, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textDark,
  },
  closeBtn: {
    padding: 6,
  },
  stepTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stepPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  stepPillActive: {
    backgroundColor: Colors.primary,
  },
  stepPillDone: {
    backgroundColor: '#E8FDF3',
  },
  stepPillInactive: {
    backgroundColor: '#F1F5F9',
  },
  stepPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stepPillTextActive: {
    color: '#FFFFFF',
  },
  stepPillTextDone: {
    color: Colors.primary,
  },
  stepPillTextInactive: {
    color: Colors.textMuted,
  },
  stepConnector: {
    width: 14,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 3,
  },
  instructionBox: {
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textDark,
  },
  instructionDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginVertical: 14,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: Colors.accentMint,
    borderColor: Colors.accentMint,
    shadowColor: Colors.accentMint,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 2,
  },
  dotError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
    marginBottom: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  keypad: {
    marginTop: 6,
    alignItems: 'center',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 290,
    marginVertical: 6,
  },
  keyBtn: {
    width: 66,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  deleteBtn: {
    backgroundColor: '#F1F5F9',
  },
  keyEmpty: {
    width: 66,
    height: 52,
  },
  keyText: {
    fontSize: 21,
    fontWeight: '700',
    color: Colors.textDark,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8FDF3',
    borderWidth: 2,
    borderColor: '#34D399',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textDark,
    marginBottom: 6,
  },
  successSub: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  verifyAlternativeCol: {
    alignItems: 'center',
    marginTop: 14,
  },
  bioVerifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  bioVerifyText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
});
