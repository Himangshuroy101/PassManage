import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVault } from '../context/VaultContext';
import { Colors } from '../theme/colors';

const PIN_LENGTH = 4;

export const LockScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    isPinSet,
    biometricsAvailable,
    biometricsEnabled,
    unlockWithPin,
    unlockWithBiometrics,
    setupMasterPin,
    resetAllAppData,
  } = useVault();

  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [setupStep, setSetupStep] = useState<'create' | 'confirm'>('create');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Automatically prompt biometrics if returning user has pin set and biometrics enabled
  useEffect(() => {
    if (isPinSet && biometricsAvailable && biometricsEnabled) {
      triggerBiometrics();
    }
  }, [isPinSet, biometricsAvailable, biometricsEnabled]);

  const triggerBiometrics = async () => {
    const success = await unlockWithBiometrics();
    if (success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleKeyPress = async (digit: string) => {
    if (pin.length >= PIN_LENGTH) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newPin = pin + digit;
    setPin(newPin);
    setErrorMessage('');

    if (newPin.length === PIN_LENGTH) {
      handlePinComplete(newPin);
    }
  };

  const handleDelete = async () => {
    if (pin.length > 0) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPin(pin.slice(0, -1));
      setErrorMessage('');
    }
  };

  const handlePinComplete = async (enteredPin: string) => {
    if (!isPinSet) {
      // First-time setup flow
      if (setupStep === 'create') {
        setConfirmPin(enteredPin);
        setPin('');
        setSetupStep('confirm');
      } else {
        if (enteredPin === confirmPin) {
          const success = await setupMasterPin(enteredPin);
          if (success) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            setErrorMessage('Failed to save Master PIN');
            setPin('');
          }
        } else {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setErrorMessage('PINs do not match. Try again.');
          setPin('');
          setConfirmPin('');
          setSetupStep('create');
        }
      }
    } else {
      // Normal unlock flow
      const success = await unlockWithPin(enteredPin);
      if (success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setErrorMessage('Incorrect PIN. Please try again.');
        setPin('');
      }
    }
  };

  const handleResetVault = () => {
    Alert.alert(
      'Reset Vault Data?',
      'Since PassManage is a 100% offline, zero-knowledge vault, your PIN cannot be retrieved if forgotten.\n\nWould you like to reset the vault and start fresh with a new 4-digit Master PIN?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Vault',
          style: 'destructive',
          onPress: async () => {
            await resetAllAppData();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          },
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={['#072D1E', '#0D533A', '#0F172A']}
      style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
    >
      {/* Top Shield Icon & Branding */}
      <View style={styles.topSection}>
        <View style={styles.iconCircle}>
          <Feather name="shield" size={40} color="#34D399" />
        </View>
        <Text style={styles.titleText}>PassManage Vault</Text>
        <Text style={styles.subtitleText}>
          {!isPinSet
            ? setupStep === 'create'
              ? 'Create your 4-digit Master PIN'
              : 'Confirm your Master PIN'
            : 'Enter Master PIN to decrypt your vault'}
        </Text>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
      </View>

      {/* 4 Discrete PIN Dots */}
      <View style={styles.pinDotsRow}>
        {Array.from({ length: PIN_LENGTH }).map((_, index) => {
          const isFilled = index < pin.length;
          return (
            <View
              key={index}
              style={[
                styles.pinDot,
                isFilled && styles.pinDotFilled,
              ]}
            />
          );
        })}
      </View>

      {/* 3x4 Numeric Keypad */}
      <View style={styles.keypadContainer}>
        {/* Row 1 */}
        <View style={styles.keypadRow}>
          {['1', '2', '3'].map(num => (
            <TouchableOpacity
              key={num}
              style={styles.keyButton}
              onPress={() => handleKeyPress(num)}
              activeOpacity={0.7}
            >
              <Text style={styles.keyNumber}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Row 2 */}
        <View style={styles.keypadRow}>
          {['4', '5', '6'].map(num => (
            <TouchableOpacity
              key={num}
              style={styles.keyButton}
              onPress={() => handleKeyPress(num)}
              activeOpacity={0.7}
            >
              <Text style={styles.keyNumber}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Row 3 */}
        <View style={styles.keypadRow}>
          {['7', '8', '9'].map(num => (
            <TouchableOpacity
              key={num}
              style={styles.keyButton}
              onPress={() => handleKeyPress(num)}
              activeOpacity={0.7}
            >
              <Text style={styles.keyNumber}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Row 4: Biometric Sensor, 0, Backspace */}
        <View style={styles.keypadRow}>
          {/* Biometric Button */}
          {isPinSet && biometricsAvailable && biometricsEnabled ? (
            <TouchableOpacity
              style={styles.keyButton}
              onPress={triggerBiometrics}
              activeOpacity={0.7}
            >
              <Ionicons name="finger-print" size={32} color="#34D399" />
            </TouchableOpacity>
          ) : (
            <View style={styles.keyButtonEmpty} />
          )}

          {/* 0 */}
          <TouchableOpacity
            style={styles.keyButton}
            onPress={() => handleKeyPress('0')}
            activeOpacity={0.7}
          >
            <Text style={styles.keyNumber}>0</Text>
          </TouchableOpacity>

          {/* Delete / Backspace */}
          <TouchableOpacity
            style={styles.keyButton}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Feather name="delete" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Forgot PIN / Reset Vault Escape Hatch */}
      {isPinSet ? (
        <TouchableOpacity
          style={styles.resetVaultBtn}
          onPress={handleResetVault}
          activeOpacity={0.7}
        >
          <Text style={styles.resetVaultText}>Forgot PIN? Reset Vault</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ height: 28 }} />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 14,
    color: '#A7F3D0',
    marginTop: 8,
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  pinDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginVertical: 20,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: '#34D399',
    borderColor: '#34D399',
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  keypadContainer: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 10,
    gap: 16,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  keyButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  keyButtonEmpty: {
    width: 72,
    height: 72,
  },
  keyNumber: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resetVaultBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  resetVaultText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
