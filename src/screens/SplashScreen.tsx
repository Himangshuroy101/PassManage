import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../theme/colors';

const { width } = Dimensions.get('window');

export const SplashScreen: React.FC = () => {
  const logoScale = useSharedValue(0.85);
  const logoOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(16);
  const textOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);
  const pillOpacity = useSharedValue(0);

  useEffect(() => {
    // 1. Entrance animation for the emblem card
    logoScale.value = withSpring(1, { damping: 14, stiffness: 120 });
    logoOpacity.value = withTiming(1, { duration: 500 });

    // 2. Text fade and slide up
    textTranslateY.value = withTiming(0, {
      duration: 650,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
    textOpacity.value = withTiming(1, { duration: 650 });

    // 3. Progress bar loading fill
    progressWidth.value = withTiming(100, {
      duration: 1300,
      easing: Easing.inOut(Easing.ease),
    });

    // 4. Security pill reveal
    pillOpacity.value = withTiming(1, { duration: 800 });
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: textTranslateY.value }],
    opacity: textOpacity.value,
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const animatedPillStyle = useAnimatedStyle(() => ({
    opacity: pillOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Center Section: Iconic Logo & Brand Typography */}
      <View style={styles.centerContent}>
        {/* Soft rounded emblem card in signature Emerald Mint surface */}
        <Animated.View style={[styles.emblemContainer, animatedLogoStyle]}>
          <View style={styles.cardBase}>
            {/* Contoured Shield Emblem */}
            <View style={styles.shieldWrapper}>
              <Feather name="shield" size={46} color={Colors.primary} />
              <View style={styles.shieldHeartCenter}>
                <Ionicons name="heart" size={16} color={Colors.accentMint} />
              </View>
            </View>

            {/* Corner floating lock badge */}
            <View style={styles.lockBadge}>
              <Feather name="lock" size={14} color="#FFFFFF" />
            </View>
          </View>
        </Animated.View>

        {/* Brand Typography */}
        <Animated.View style={[styles.textBlock, animatedTextStyle]}>
          <Text style={styles.brandTitle}>PassManage</Text>
          <Text style={styles.brandSubtitle}>Secure. Simple. Yours.</Text>
        </Animated.View>
      </View>

      {/* Bottom Section: Progress Bar & Encryption Pill */}
      <View style={styles.bottomSection}>
        {/* Sleek Animated Progress Bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, animatedProgressStyle]} />
        </View>

        {/* AES-256 Encrypted Pill Badge */}
        <Animated.View style={[styles.pillBadge, animatedPillStyle]}>
          <Feather name="shield" size={13} color={Colors.primary} style={styles.pillIcon} />
          <Text style={styles.pillText}>AES-256 ENCRYPTED</Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 56,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emblemContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  cardBase: {
    width: 104,
    height: 104,
    borderRadius: 28,
    backgroundColor: '#ECFDF5', // Palette A soft mint surface
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 4,
    position: 'relative',
  },
  shieldWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  shieldHeartCenter: {
    position: 'absolute',
    top: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  textBlock: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textDark,
    letterSpacing: -0.6,
  },
  brandSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textMuted,
    marginTop: 8,
    letterSpacing: -0.2,
  },
  bottomSection: {
    alignItems: 'center',
    width: '100%',
    paddingBottom: 24,
  },
  progressTrack: {
    width: 180,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.accentMint,
    borderRadius: 2,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  pillIcon: {
    marginRight: 6,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1.2,
  },
});
