import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HealthScoreGauge } from './HealthScoreGauge';
import { useVault } from '../../context/VaultContext';
import { Colors } from '../../theme/colors';

interface HeaderProps {
  title?: string;
  showHealthGauge?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  showHealthGauge = true,
}) => {
  const insets = useSafeAreaInsets();
  const { stats, lockVault, userProfile } = useVault();

  return (
    <LinearGradient
      colors={['#072D1E', '#0D533A', '#116548']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[
        styles.headerContainer,
        { paddingTop: Math.max(insets.top + 8, 20) },
        !showHealthGauge && { paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }
      ]}
    >
      {/* Top User Bar */}
      <View style={styles.topRow}>
        <View style={styles.userProfile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userProfile.avatarInitials || 'VU'}</Text>
          </View>
          <View style={styles.userGreetings}>
            <Text style={styles.greetingSub}>Welcome back,</Text>
            <Text style={styles.userName}>{userProfile.name || 'Vault User'}</Text>
          </View>
        </View>

        {/* Lock Vault Quick Action Button */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={lockVault}
          activeOpacity={0.8}
        >
          <Ionicons name="lock-closed-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Health Score Gauge */}
      {showHealthGauge && <HealthScoreGauge score={stats.healthScore} />}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E7E5A',
    borderWidth: 2,
    borderColor: '#34D399',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  userGreetings: {
    justifyContent: 'center',
  },
  greetingSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '400',
  },
  userName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 1,
  },
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
