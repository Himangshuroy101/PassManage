import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Colors } from '../../theme/colors';

const { width } = Dimensions.get('window');
const CARD_SIZE = Math.min(width - 70, 290);

export const SyncAnimationGraphic: React.FC = () => {
  // 1. Vault Shield breathing / floating
  const vaultTranslateY = useSharedValue(0);
  const vaultScale = useSharedValue(1);

  // 2. Cryptographic cipher ring continuous rotation
  const cipherRotation = useSharedValue(0);

  // 3. Floating device & key badges
  const deviceTranslateY = useSharedValue(0);
  const keyTranslateY = useSharedValue(0);
  const bioTranslateY = useSharedValue(0);

  // 4. Local encryption security pulses
  const pulsePhase = useSharedValue(0);

  useEffect(() => {
    // Continuous smooth rotation for cryptographic cipher ring
    cipherRotation.value = withRepeat(
      withTiming(360, {
        duration: 8000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Vault central emblem hover
    vaultTranslateY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(6, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Vault subtle breathing scale
    vaultScale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.97, { duration: 2400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Device badge hover
    deviceTranslateY.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 2100, easing: Easing.inOut(Easing.ease) }),
        withTiming(-5, { duration: 2100, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Key badge hover
    keyTranslateY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1900, easing: Easing.inOut(Easing.ease) }),
        withTiming(4, { duration: 1900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Biometrics badge hover
    bioTranslateY.value = withRepeat(
      withSequence(
        withTiming(4, { duration: 2300, easing: Easing.inOut(Easing.ease) }),
        withTiming(-4, { duration: 2300, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Encryption pulse phase
    pulsePhase.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const animatedCipherStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${cipherRotation.value}deg` }],
  }));

  const animatedVaultStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: vaultTranslateY.value },
      { scale: vaultScale.value },
    ],
  }));

  const animatedDeviceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: deviceTranslateY.value }],
  }));

  const animatedKeyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: keyTranslateY.value }],
  }));

  const animatedBioStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bioTranslateY.value }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => {
    const progress = pulsePhase.value;
    const scale = interpolate(progress, [0, 1], [0.8, 1.45]);
    const opacity = interpolate(progress, [0, 0.4, 1], [0.6, 0.3, 0]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <View style={styles.cardContainer}>
      {/* Background Soft Rounded Card (Emerald Mint Surface) */}
      <View style={styles.card}>
        {/* Subtle decorative grid/ambient halo */}
        <View style={styles.haloBg} />

        {/* Encrypted Shield Pulse Halo */}
        <Animated.View style={[styles.pulseRing, animatedPulseStyle]} />

        {/* Outer Cipher Ring */}
        <Animated.View style={[styles.cipherRing, animatedCipherStyle]}>
          <View style={styles.cipherNode1} />
          <View style={styles.cipherNode2} />
          <View style={styles.cipherNode3} />
          <View style={styles.cipherNode4} />
        </Animated.View>

        {/* Central Local Vault Shield */}
        <Animated.View style={[styles.vaultContainer, animatedVaultStyle]}>
          <View style={styles.vaultCircle}>
            <Feather name="shield" size={54} color={Colors.primary} />
            <View style={styles.shieldLockCenter}>
              <Feather name="lock" size={22} color={Colors.accentMint} />
            </View>
          </View>
        </Animated.View>

        {/* Top-Right: Floating On-Device Smartphone Badge */}
        <Animated.View style={[styles.deviceTopRight, animatedDeviceStyle]}>
          <View style={styles.badgeCard}>
            <Feather name="smartphone" size={20} color={Colors.primary} />
          </View>
        </Animated.View>

        {/* Bottom-Left: Floating AES-256 Key Badge */}
        <Animated.View style={[styles.keyBottomLeft, animatedKeyStyle]}>
          <View style={styles.badgeCard}>
            <Feather name="key" size={20} color={Colors.accentMint} />
          </View>
        </Animated.View>

        {/* Top-Left: Floating Native Biometrics Sensor Badge */}
        <Animated.View style={[styles.bioTopLeft, animatedBioStyle]}>
          <View style={styles.badgeCard}>
            <Ionicons name="finger-print" size={22} color={Colors.primaryLight} />
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 36,
    backgroundColor: '#ECFDF5', // Palette A soft mint
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    overflow: 'hidden',
  },
  haloBg: {
    position: 'absolute',
    width: CARD_SIZE * 0.78,
    height: CARD_SIZE * 0.78,
    borderRadius: (CARD_SIZE * 0.78) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: Colors.accentMint,
  },
  cipherRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cipherNode1: {
    position: 'absolute',
    top: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accentMint,
  },
  cipherNode2: {
    position: 'absolute',
    bottom: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  cipherNode3: {
    position: 'absolute',
    left: -5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accentNeon,
  },
  cipherNode4: {
    position: 'absolute',
    right: -5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accentMint,
  },
  vaultContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 5,
  },
  vaultCircle: {
    width: 96,
    height: 96,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D1FAE5',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
    position: 'relative',
  },
  shieldLockCenter: {
    position: 'absolute',
    top: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceTopRight: {
    position: 'absolute',
    top: 26,
    right: 28,
    zIndex: 6,
  },
  keyBottomLeft: {
    position: 'absolute',
    bottom: 28,
    left: 28,
    zIndex: 6,
  },
  bioTopLeft: {
    position: 'absolute',
    top: 30,
    left: 28,
    zIndex: 6,
  },
  badgeCard: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D1FAE5',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
});
