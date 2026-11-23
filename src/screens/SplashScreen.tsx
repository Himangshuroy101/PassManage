import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Colors } from '../theme/colors';

const { width } = Dimensions.get('window');

export const SplashScreen: React.FC = () => {
  // Animation shared values
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const auraScale = useSharedValue(0.9);
  const auraOpacity = useSharedValue(0.3);
  const orbitRotation = useSharedValue(0);
  const textTranslateY = useSharedValue(18);
  const textOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);
  const statusOpacity = useSharedValue(0);
  const pulseDot = useSharedValue(1);

  // Dynamic cryptographic status step
  const [statusText, setStatusText] = useState('Initializing Android KeyStore...');

  useEffect(() => {
    // 1. Entrance animation for the emblem card
    logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    logoOpacity.value = withTiming(1, { duration: 600 });

    // 2. Ambient aura breathing loop
    auraScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 2200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    auraOpacity.value = withRepeat(
      withSequence(
        withTiming(0.65, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.25, { duration: 2200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // 3. Continuous slow orbit rotation for the dashed cipher ring
    orbitRotation.value = withRepeat(
      withTiming(360, { duration: 16000, easing: Easing.linear }),
      -1,
      false
    );

    // 4. Brand text entrance
    textTranslateY.value = withTiming(0, {
      duration: 750,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
    textOpacity.value = withTiming(1, { duration: 750 });

    // 5. Progress bar loading fill
    progressWidth.value = withTiming(100, {
      duration: 1700,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    // 6. Status text sequence
    statusOpacity.value = withTiming(1, { duration: 600 });
    const timer1 = setTimeout(() => {
      setStatusText('Deriving AES-256 GCM Key...');
    }, 700);
    const timer2 = setTimeout(() => {
      setStatusText('Offline Vault Ready');
    }, 1400);

    // 7. Pulsating status dot loop
    pulseDot.value = withRepeat(
      withSequence(
        withTiming(1.35, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const animatedAuraStyle = useAnimatedStyle(() => ({
    transform: [{ scale: auraScale.value }],
    opacity: auraOpacity.value,
  }));

  const animatedOrbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbitRotation.value}deg` }],
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: textTranslateY.value }],
    opacity: textOpacity.value,
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const animatedStatusStyle = useAnimatedStyle(() => ({
    opacity: statusOpacity.value,
  }));

  const animatedPulseDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseDot.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Layer 1: Ambient Multi-Stop Gradient Background */}
      <LinearGradient
        colors={['#F0FDF4', '#FFFFFF', '#ECFDF5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle Corner Registration Geometry */}
      <View style={styles.cornerTL}>
        <View style={styles.cornerLineH} />
        <View style={styles.cornerLineV} />
      </View>
      <View style={styles.cornerTR}>
        <View style={styles.cornerLineH} />
        <View style={styles.cornerLineV} />
      </View>
      <View style={styles.cornerBL}>
        <View style={styles.cornerLineH} />
        <View style={styles.cornerLineV} />
      </View>
      <View style={styles.cornerBR}>
        <View style={styles.cornerLineH} />
        <View style={styles.cornerLineV} />
      </View>

      {/* Center Section: Atmospheric Orbitals, Medallion & Brand Typography */}
      <View style={styles.centerContent}>
        {/* Emblem Layer with Concentric Orbitals & Breathing Aura */}
        <View style={styles.emblemWrapper}>
          {/* Breathing Luminous Ambient Aura */}
          <Animated.View style={[styles.ambientAura, animatedAuraStyle]} />

          {/* Concentric Dashed Cryptographic Orbit Ring */}
          <Animated.View style={[styles.orbitRing, animatedOrbitStyle]}>
            <View style={styles.orbitNodeTop} />
            <View style={styles.orbitNodeBottom} />
          </Animated.View>

          {/* Inner Geometric Glow Halo */}
          <View style={styles.innerHalo} />

          {/* Luxury 3D Glassmorphic Shield Medallion */}
          <Animated.View style={[styles.emblemCard, animatedLogoStyle]}>
            <LinearGradient
              colors={['#FFFFFF', '#F0FDF4', '#D1FAE5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              {/* Specular Glass Top Highlight */}
              <View style={styles.specularHighlight} />

              {/* Contoured Shield Emblem with Glowing Core */}
              <View style={styles.shieldWrapper}>
                <Feather name="shield" size={48} color={Colors.primary} />
                <View style={styles.shieldCore}>
                  <Ionicons name="key" size={17} color={Colors.accentMint} />
                </View>
              </View>

              {/* Corner Floating Security Lock Badge */}
              <View style={styles.lockBadge}>
                <LinearGradient
                  colors={['#0A3D2A', '#0D533A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.lockBadgeGradient}
                >
                  <Feather name="lock" size={15} color="#34D399" />
                </LinearGradient>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Brand Lockup & Cryptographic Badges */}
        <Animated.View style={[styles.brandBlock, animatedTextStyle]}>
          {/* Top Security Pill Badge */}
          <View style={styles.securityPill}>
            <View style={styles.securityPillDot} />
            <Text style={styles.securityPillText}>ZERO-KNOWLEDGE VAULT</Text>
          </View>

          {/* Main Brand Title with Dual Tone Typography */}
          <View style={styles.titleRow}>
            <Text style={styles.titlePass}>Pass</Text>
            <Text style={styles.titleManage}>Manage</Text>
          </View>

          {/* Subtitle / Value Proposition */}
          <Text style={styles.brandSubtitle}>Encrypted Offline Vault • Android KeyStore</Text>
        </Animated.View>
      </View>

      {/* Bottom Section: Progress Loading & Encryption Status */}
      <View style={styles.bottomSection}>
        {/* Dynamic Status Text */}
        <Animated.View style={[styles.statusRow, animatedStatusStyle]}>
          <Text style={styles.statusText}>{statusText}</Text>
        </Animated.View>

        {/* Sleek Gradient Animated Progress Bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, animatedProgressStyle]}>
            <LinearGradient
              colors={['#0D533A', '#10B981', '#34D399']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        {/* Security Assurance Badge with Live Pulsating Dot */}
        <Animated.View style={[styles.footerPill, animatedStatusStyle]}>
          <Animated.View style={[styles.pulsatingDot, animatedPulseDotStyle]} />
          <Text style={styles.footerPillText}>100% OFFLINE • ZERO SERVERS</Text>
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
  // Corner Registration Geometry Marks
  cornerTL: {
    position: 'absolute',
    top: 28,
    left: 28,
    width: 14,
    height: 14,
  },
  cornerTR: {
    position: 'absolute',
    top: 28,
    right: 28,
    width: 14,
    height: 14,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 28,
    left: 28,
    width: 14,
    height: 14,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 28,
    right: 28,
    width: 14,
    height: 14,
  },
  cornerLineH: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 14,
    height: 1.5,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  cornerLineV: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 1.5,
    height: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  // Center Section
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emblemWrapper: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  ambientAura: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(52, 211, 153, 0.28)',
    shadowColor: Colors.accentMint,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
  },
  orbitRing: {
    position: 'absolute',
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.22)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitNodeTop: {
    position: 'absolute',
    top: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accentMint,
  },
  orbitNodeBottom: {
    position: 'absolute',
    bottom: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  innerHalo: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  // Luxury 3D Glassmorphic Emblem Card
  emblemCard: {
    width: 112,
    height: 112,
    borderRadius: 32,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
    position: 'relative',
  },
  cardGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    position: 'relative',
    overflow: 'visible',
  },
  specularHighlight: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 1,
  },
  shieldWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  shieldCore: {
    position: 'absolute',
    top: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  lockBadgeGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Brand Typography Block
  brandBlock: {
    alignItems: 'center',
    marginTop: 4,
  },
  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EE',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 10,
  },
  securityPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accentMint,
    marginRight: 6,
  },
  securityPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1.5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titlePass: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.textDark,
    letterSpacing: -0.8,
  },
  titleManage: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -0.8,
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 6,
    letterSpacing: 0.2,
  },
  // Bottom Section
  bottomSection: {
    alignItems: 'center',
    width: '100%',
    paddingBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    height: 18,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryLight,
    letterSpacing: 0.3,
  },
  progressTrack: {
    width: 190,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  footerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  pulsatingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.accentMint,
    marginRight: 8,
  },
  footerPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1.2,
  },
});
