import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../../theme/colors';
import { useVault } from '../../context/VaultContext';

interface HealthScoreGaugeProps {
  score: number;
}

const TOTAL_TICKS = 26; // Precision radial ticks along the 180° semi-circle
const GAUGE_WIDTH = 220;
const GAUGE_HEIGHT = 125;
const RADIUS = 88;
const CENTER_X = GAUGE_WIDTH / 2;
const CENTER_Y = 105;

export const HealthScoreGauge: React.FC<HealthScoreGaugeProps> = ({ score }) => {
  const { stats } = useVault();
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);

  // Animated Beacon Tracking
  const animatedScore = useSharedValue(score);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    animatedScore.value = withSpring(score, {
      damping: 15,
      stiffness: 110,
    });
  }, [score]);

  // Gentle breathing glow on beacon
  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(1.3, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  // Determine security tier, color & status badge
  let tierColor = '#10B981'; // Emerald
  let tierLabel = 'Optimal Security';
  let tierIcon: keyof typeof Feather.glyphMap = 'shield';
  let tierBg = 'rgba(16, 185, 129, 0.22)';
  let tierBorder = 'rgba(52, 211, 153, 0.45)';

  if (score < 40) {
    tierColor = '#EF4444'; // Red
    tierLabel = 'Critical Risk';
    tierIcon = 'alert-octagon';
    tierBg = 'rgba(239, 68, 68, 0.22)';
    tierBorder = 'rgba(248, 113, 113, 0.5)';
  } else if (score < 60) {
    tierColor = '#F59E0B'; // Amber
    tierLabel = 'Needs Attention';
    tierIcon = 'alert-triangle';
    tierBg = 'rgba(245, 158, 11, 0.22)';
    tierBorder = 'rgba(251, 191, 36, 0.5)';
  } else if (score < 80) {
    tierColor = '#06B6D4'; // Cyan
    tierLabel = 'Good Protection';
    tierIcon = 'check-circle';
    tierBg = 'rgba(6, 182, 212, 0.22)';
    tierBorder = 'rgba(56, 189, 248, 0.5)';
  }

  // Calculate coordinates for the glowing beacon at the current score
  const fraction = Math.max(0, Math.min(100, score)) / 100;
  // Angle in radians: from -PI (left) to 0 (right)
  const angleRad = Math.PI + fraction * Math.PI;
  const beaconX = CENTER_X + RADIUS * Math.cos(angleRad) - 8;
  const beaconY = CENTER_Y + RADIUS * Math.sin(angleRad) - 8;

  const animatedBeaconStyle = useAnimatedStyle(() => {
    const frac = Math.max(0, Math.min(100, animatedScore.value)) / 100;
    const rad = Math.PI + frac * Math.PI;
    const x = CENTER_X + RADIUS * Math.cos(rad) - 8;
    const y = CENTER_Y + RADIUS * Math.sin(rad) - 8;
    return {
      transform: [
        { translateX: x },
        { translateY: y },
      ],
    };
  });

  const animatedHaloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleInfoPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setShowInfoModal(true);
  };

  return (
    <View style={styles.container}>
      {/* Semi-Circular Radial Arc Container */}
      <View style={styles.gaugeBox}>
        {/* Semi-circular track backdrop */}
        <View style={styles.trackCurve} />

        {/* 26 Precision Radial Ticks */}
        {Array.from({ length: TOTAL_TICKS }).map((_, index) => {
          const tickFraction = index / (TOTAL_TICKS - 1);
          const isLit = tickFraction <= fraction;

          // Radian angle from PI to 2*PI
          const rad = Math.PI + tickFraction * Math.PI;
          const x = CENTER_X + RADIUS * Math.cos(rad) - 1.5;
          const y = CENTER_Y + RADIUS * Math.sin(rad) - 6;
          // Rotation angle in degrees
          const deg = (tickFraction * 180 - 90);

          let tickColor = 'rgba(255, 255, 255, 0.16)';
          if (isLit) {
            if (tickFraction < 0.35) tickColor = '#EF4444';
            else if (tickFraction < 0.65) tickColor = '#F59E0B';
            else if (tickFraction < 0.85) tickColor = '#06B6D4';
            else tickColor = '#34D399';
          }

          return (
            <View
              key={index}
              style={[
                styles.radialTick,
                {
                  left: x,
                  top: y,
                  backgroundColor: tickColor,
                  transform: [{ rotate: `${deg}deg` }],
                  shadowColor: isLit ? tickColor : 'transparent',
                  shadowOpacity: isLit ? 0.7 : 0,
                  shadowRadius: 3,
                },
              ]}
            />
          );
        })}

        {/* Orbiting Luminous Beacon */}
        <Animated.View style={[styles.beaconContainer, animatedBeaconStyle]}>
          <Animated.View
            style={[
              styles.beaconHalo,
              { backgroundColor: tierColor },
              animatedHaloStyle,
            ]}
          />
          <View style={[styles.beaconCore, { backgroundColor: '#FFFFFF', borderColor: tierColor }]} />
        </Animated.View>

        {/* Center Display: Number & Label */}
        <View style={styles.centerContent}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreText}>{score}</Text>
            <Text style={styles.scorePercentSign}>%</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.statusPill,
              { backgroundColor: tierBg, borderColor: tierBorder },
            ]}
            onPress={handleInfoPress}
            activeOpacity={0.8}
          >
            <Feather name={tierIcon} size={11} color={tierColor} style={{ marginRight: 4 }} />
            <Text style={[styles.statusPillText, { color: tierColor }]}>
              {tierLabel}
            </Text>
            <Ionicons
              name="information-circle-outline"
              size={12}
              color={tierColor}
              style={{ marginLeft: 3, opacity: 0.8 }}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Vault Health Security Breakdown Modal */}
      {showInfoModal && (
        <Modal
          visible={showInfoModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowInfoModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowInfoModal(false)}
          >
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <View style={[styles.modalIconBox, { backgroundColor: tierBg }]}>
                  <Feather name="shield" size={20} color={tierColor} />
                </View>
                <View style={styles.modalHeaderInfo}>
                  <Text style={styles.modalTitle}>Vault Health Breakdown</Text>
                  <Text style={styles.modalScoreSub}>Overall Score: {score}/100</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowInfoModal(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name="x" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalDivider} />

              {/* Metric Breakdown Rows */}
              <View style={styles.factorRow}>
                <View style={styles.factorLabelCol}>
                  <Text style={styles.factorTitle}>Total Vault Items</Text>
                  <Text style={styles.factorDesc}>Stored credentials analyzed</Text>
                </View>
                <Text style={styles.factorValue}>{stats.total}</Text>
              </View>

              <View style={styles.factorRow}>
                <View style={styles.factorLabelCol}>
                  <Text style={[styles.factorTitle, stats.compromised > 0 && { color: '#EF4444' }]}>
                    Compromised / Pwned
                  </Text>
                  <Text style={styles.factorDesc}>Known breached dictionary passwords</Text>
                </View>
                <Text style={[styles.factorValue, { color: stats.compromised > 0 ? '#EF4444' : Colors.accentMint }]}>
                  {stats.compromised}
                </Text>
              </View>

              <View style={styles.factorRow}>
                <View style={styles.factorLabelCol}>
                  <Text style={[styles.factorTitle, stats.weak > 0 && { color: '#F59E0B' }]}>
                    Weak Passwords
                  </Text>
                  <Text style={styles.factorDesc}>Short length or low entropy</Text>
                </View>
                <Text style={[styles.factorValue, { color: stats.weak > 0 ? '#F59E0B' : Colors.accentMint }]}>
                  {stats.weak}
                </Text>
              </View>

              <View style={styles.factorRow}>
                <View style={styles.factorLabelCol}>
                  <Text style={[styles.factorTitle, stats.reused > 0 && { color: '#A855F7' }]}>
                    Reused Passwords
                  </Text>
                  <Text style={styles.factorDesc}>Vulnerable to credential stuffing</Text>
                </View>
                <Text style={[styles.factorValue, { color: stats.reused > 0 ? '#A855F7' : Colors.accentMint }]}>
                  {stats.reused}
                </Text>
              </View>

              {/* Recommendation Callout */}
              <View style={styles.recommendationBox}>
                <Feather name="info" size={16} color={Colors.primary} style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={styles.recommendationText}>
                  {stats.compromised > 0
                    ? `Update ${stats.compromised} compromised password to significantly boost your health score.`
                    : stats.weak > 0
                    ? `Strengthen ${stats.weak} weak password(s) using the built-in generator.`
                    : stats.reused > 0
                    ? `Generate unique passwords for your ${stats.reused} reused credentials.`
                    : 'Your vault has optimal security! All passwords are strong and unique.'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={() => setShowInfoModal(false)}
              >
                <Text style={styles.modalDoneBtnText}>Got it</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  gaugeBox: {
    width: GAUGE_WIDTH,
    height: GAUGE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  trackCurve: {
    position: 'absolute',
    top: 15,
    width: 178,
    height: 178,
    borderRadius: 89,
    borderWidth: 5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    transform: [{ rotate: '-45deg' }],
  },
  radialTick: {
    position: 'absolute',
    width: 3.5,
    height: 11,
    borderRadius: 2,
  },
  beaconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  beaconHalo: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    opacity: 0.5,
  },
  beaconCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  centerContent: {
    position: 'absolute',
    top: 32,
    alignItems: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreText: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  scorePercentSign: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.75)',
    marginLeft: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  // Modal Breakdown Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalHeaderInfo: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textDark,
  },
  modalScoreSub: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  factorLabelCol: {
    flex: 1,
  },
  factorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textDark,
  },
  factorDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  factorValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textDark,
    marginLeft: 12,
  },
  recommendationBox: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    marginBottom: 16,
  },
  recommendationText: {
    flex: 1,
    fontSize: 12,
    color: '#166534',
    lineHeight: 17,
    fontWeight: '500',
  },
  modalDoneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
