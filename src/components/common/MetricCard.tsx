import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '../../theme/colors';

export type MetricFilterType = 'all' | 'compromised' | 'weak' | 'reused';

interface MetricGridProps {
  total: number;
  compromised: number;
  weak: number;
  reused: number;
  activeFilter?: MetricFilterType;
  onSelectFilter?: (filter: MetricFilterType) => void;
}

interface SingleCardProps {
  type: MetricFilterType;
  title: string;
  count: number;
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  iconBg: string;
  statusText: string;
  statusColor: string;
  statusBg: string;
  isActive: boolean;
  onPress: () => void;
}

const SingleMetricCard: React.FC<SingleCardProps> = ({
  title,
  count,
  icon,
  iconColor,
  iconBg,
  statusText,
  statusColor,
  statusBg,
  isActive,
  onPress,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.94, { damping: 14, stiffness: 450 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 350 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.cardPressable}
    >
      <Animated.View
        style={[
          styles.card,
          isActive && {
            borderColor: iconColor,
            borderWidth: 1.8,
            backgroundColor: '#FCFDFF',
            shadowColor: iconColor,
            shadowOpacity: 0.16,
            shadowRadius: 10,
          },
          animatedStyle,
        ]}
      >
        {/* Top Row: Icon Badge & Status Chip */}
        <View style={styles.cardTopRow}>
          <View style={[styles.iconBadge, { backgroundColor: iconBg }]}>
            <Feather name={icon} size={17} color={iconColor} />
          </View>
          <View style={[styles.statusChip, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusChipText, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>
        </View>

        {/* Bottom Row: Number Count & Label */}
        <View style={styles.cardBottomRow}>
          <Text style={styles.countText}>{count}</Text>
          <Text style={styles.labelText}>{title}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};

export const MetricGrid: React.FC<MetricGridProps> = ({
  total,
  compromised,
  weak,
  reused,
  activeFilter = 'all',
  onSelectFilter,
}) => {
  const handleCardPress = (filterType: MetricFilterType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (onSelectFilter) {
      // Toggle off if already selected
      if (activeFilter === filterType) {
        onSelectFilter('all');
      } else {
        onSelectFilter(filterType);
      }
    }
  };

  return (
    <View style={styles.gridContainer}>
      {/* 1. Total Card */}
      <SingleMetricCard
        type="all"
        title="Total Vault"
        count={total}
        icon="shield"
        iconColor={Colors.metricTotal}
        iconBg={Colors.metricTotalBg}
        statusText="All Items"
        statusColor="#3B82F6"
        statusBg="#EFF6FF"
        isActive={activeFilter === 'all' && total > 0}
        onPress={() => handleCardPress('all')}
      />

      {/* 2. Compromised Card */}
      <SingleMetricCard
        type="compromised"
        title="Compromised"
        count={compromised}
        icon="alert-triangle"
        iconColor={Colors.metricCompromised}
        iconBg={Colors.metricCompromisedBg}
        statusText={compromised === 0 ? 'Safe ✓' : `${compromised} Critical`}
        statusColor={compromised === 0 ? '#10B981' : '#EF4444'}
        statusBg={compromised === 0 ? '#E8FDF3' : '#FEF2F2'}
        isActive={activeFilter === 'compromised'}
        onPress={() => handleCardPress('compromised')}
      />

      {/* 3. Weak Passwords Card */}
      <SingleMetricCard
        type="weak"
        title="Weak Pass"
        count={weak}
        icon="key"
        iconColor={Colors.metricWeak}
        iconBg={Colors.metricWeakBg}
        statusText={weak === 0 ? 'Optimal ✓' : `${weak} At Risk`}
        statusColor={weak === 0 ? '#10B981' : '#F59E0B'}
        statusBg={weak === 0 ? '#E8FDF3' : '#FFFBEB'}
        isActive={activeFilter === 'weak'}
        onPress={() => handleCardPress('weak')}
      />

      {/* 4. Reused Passwords Card */}
      <SingleMetricCard
        type="reused"
        title="Reused Pass"
        count={reused}
        icon="repeat"
        iconColor={Colors.metricReused}
        iconBg={Colors.metricReusedBg}
        statusText={reused === 0 ? 'Unique ✓' : `${reused} Reused`}
        statusColor={reused === 0 ? '#10B981' : '#A855F7'}
        statusBg={reused === 0 ? '#E8FDF3' : '#FAF5FF'}
        isActive={activeFilter === 'reused'}
        onPress={() => handleCardPress('reused')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: -22, // Floating card overlap on the curved header
    gap: 12,
  },
  cardPressable: {
    width: '48%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EBF1F6',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  cardBottomRow: {
    justifyContent: 'flex-start',
  },
  countText: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textDark,
    letterSpacing: -0.5,
  },
  labelText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
});
