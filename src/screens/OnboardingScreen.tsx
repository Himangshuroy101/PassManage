import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { SyncAnimationGraphic } from '../components/common/SyncAnimationGraphic';
import { CreateAccountScreen } from './CreateAccountScreen';
import { Colors } from '../theme/colors';

const { width } = Dimensions.get('window');

export const OnboardingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState<'welcome' | 'create_account'>('welcome');

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setCurrentStep('create_account');
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setCurrentStep('create_account');
  };

  if (currentStep === 'create_account') {
    return (
      <CreateAccountScreen
        onBack={() => setCurrentStep('welcome')}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 8, 20), paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
      <StatusBar style="dark" />

      {/* Top Bar with "Skip" button */}
      <View style={styles.topBar}>
        <View style={styles.topPlaceholder} />
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Center Section: Local Vault Graphic & Privacy Copy */}
      <View style={styles.centerSection}>
        {/* Animated On-Device Security Graphic */}
        <SyncAnimationGraphic />

        {/* Headline & Description for Local Offline Vault */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>100% Local & Private</Text>
          <Text style={styles.subtitle}>
            Your credentials stay strictly on this device, encrypted with AES-256. Zero servers, zero tracking, complete privacy.
          </Text>
        </View>
      </View>

      {/* Bottom Section: Pagination Dots & Action Button */}
      <View style={styles.bottomSection}>
        {/* Pagination Indicator (Dot + Elongated Bar) */}
        <View style={styles.paginationRow}>
          <View style={styles.dotInactive} />
          <View style={styles.dotActive} />
        </View>

        {/* "Get Started" Button in Signature Emerald */}
        <TouchableOpacity
          style={styles.getStartedBtn}
          onPress={handleGetStarted}
          activeOpacity={0.88}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
  },
  topPlaceholder: {
    width: 40,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 36,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textDark,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  bottomSection: {
    alignItems: 'center',
    width: '100%',
    paddingBottom: 10,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  dotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  dotActive: {
    width: 28,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  getStartedBtn: {
    width: '100%',
    height: 56,
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
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
