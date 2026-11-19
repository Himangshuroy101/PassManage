import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutChangeEvent,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { ActiveTab } from '../../types/vault';

interface BottomTabBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onPressAdd: () => void;
}

interface TabLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

const TabButton: React.FC<{
  icon: keyof typeof Feather.glyphMap;
  label: string;
  isActive: boolean;
  onPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
}> = ({ icon, label, isActive, onPress, onLayout }) => {
  const pressScale = useSharedValue(1);
  const activeProgress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    activeProgress.value = withTiming(isActive ? 1 : 0, {
      duration: 200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: pressScale.value * (1 + 0.08 * activeProgress.value) },
    ],
  }));

  const handlePressIn = () => {
    pressScale.value = withSpring(0.92, { damping: 14, stiffness: 450 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 14, stiffness: 350 });
  };

  return (
    <Pressable
      onLayout={onLayout}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive }}
      style={styles.tabItem}
    >
      <Animated.View style={[styles.tabContentWrapper, animatedStyle]}>
        <Feather
          name={icon}
          size={18}
          color={isActive ? '#34D399' : '#8EAA9E'}
        />
        <Text
          style={[
            styles.tabLabel,
            isActive ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onSelectTab,
  onPressAdd,
}) => {
  const insets = useSafeAreaInsets();
  const fabScale = useSharedValue(1);
  const fabRotation = useSharedValue(0);

  // Layout registry & initialization guard
  const tabLayouts = useRef<Partial<Record<ActiveTab, TabLayout>>>({});
  const hasInitialized = useRef(false);
  const lastAnimatedTab = useRef<ActiveTab>(activeTab);

  // Liquid Flow Transforms (Running 100% on native RenderThread/GPU)
  const cursorX = useSharedValue(0);
  const cursorWidth = useSharedValue(62);
  const cursorOpacity = useSharedValue(0);
  const liquidStretch = useSharedValue(1);
  const liquidSquash = useSharedValue(1);

  // Continuous subtle cyber-pulse breathing halo for the Quantum Vault Core
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.35);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(1.28, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    pulseOpacity.value = withRepeat(
      withTiming(0.08, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  // Smooth liquid slide animation to destination tab with distance-based physics
  const animateToTab = (tab: ActiveTab) => {
    const layout = tabLayouts.current[tab];
    if (!layout || layout.width === 0) return;

    const targetWidth = Math.max(layout.width - 6, 52);
    const targetX = layout.x + (layout.width - targetWidth) / 2;

    // Calculate travel distance for adaptive squash-and-stretch
    const distance = Math.abs(targetX - cursorX.value);
    const stretchFactor = distance > 140 ? 1.28 : 1.16;
    const squashFactor = distance > 140 ? 0.82 : 0.88;

    // Fluid spring translation on UI thread
    cursorX.value = withSpring(targetX, {
      damping: 16,
      stiffness: 180,
      mass: 0.7,
    });

    // Update width to match current tab
    cursorWidth.value = targetWidth;

    // Organic liquid squash & stretch
    liquidStretch.value = withSequence(
      withTiming(stretchFactor, { duration: 120, easing: Easing.bezier(0.2, 0, 0, 1) }),
      withSpring(1, { damping: 12, stiffness: 220 })
    );

    liquidSquash.value = withSequence(
      withTiming(squashFactor, { duration: 120, easing: Easing.bezier(0.2, 0, 0, 1) }),
      withSpring(1, { damping: 12, stiffness: 220 })
    );

    lastAnimatedTab.current = tab;
  };

  // Sync cursor when activeTab changes
  useEffect(() => {
    if (hasInitialized.current && lastAnimatedTab.current !== activeTab) {
      animateToTab(activeTab);
    }
  }, [activeTab]);

  const handleTabLayout = (tab: ActiveTab, layout: TabLayout) => {
    // Guard against zero-dimension layout passes on Android
    if (layout.width === 0 || layout.height === 0) return;

    const previousLayout = tabLayouts.current[tab];
    tabLayouts.current[tab] = layout;

    if (tab === activeTab && !hasInitialized.current) {
      hasInitialized.current = true;
      const targetWidth = Math.max(layout.width - 6, 52);
      const targetX = layout.x + (layout.width - targetWidth) / 2;
      cursorX.value = targetX;
      cursorWidth.value = targetWidth;
      cursorOpacity.value = withTiming(1, { duration: 180 });
      lastAnimatedTab.current = tab;
    } else if (
      hasInitialized.current &&
      tab === activeTab &&
      (!previousLayout || Math.abs(previousLayout.x - layout.x) > 1)
    ) {
      // Reposition only if coordinates physically shifted
      const targetWidth = Math.max(layout.width - 6, 52);
      const targetX = layout.x + (layout.width - targetWidth) / 2;
      cursorX.value = targetX;
      cursorWidth.value = targetWidth;
    }
  };

  const handleTabPress = (tab: ActiveTab) => {
    // Non-blocking asynchronous haptic feedback (0ms JS-to-UI delay)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    if (tab === activeTab) {
      // Tactile liquid squish ripple on tapping active tab
      liquidSquash.value = withSequence(
        withTiming(0.92, { duration: 80 }),
        withSpring(1, { damping: 11, stiffness: 260 })
      );
      return;
    }

    animateToTab(tab);
    onSelectTab(tab);
  };

  const animatedCursorStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: cursorX.value },
      { scaleX: liquidStretch.value },
      { scaleY: liquidSquash.value },
    ],
    width: cursorWidth.value,
    opacity: cursorOpacity.value,
  }));

  const animatedFabStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: fabScale.value },
      { rotate: `${fabRotation.value}deg` },
    ],
  }));

  const animatedAuraStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const handleAddPressIn = () => {
    fabScale.value = withSpring(0.86, { damping: 12, stiffness: 380 });
    fabRotation.value = withSpring(45, { damping: 12, stiffness: 380 });
  };

  const handleAddPressOut = () => {
    fabScale.value = withSpring(1, { damping: 14, stiffness: 320 });
    fabRotation.value = withSpring(0, { damping: 14, stiffness: 320 });
    // Non-blocking haptic trigger (0ms modal open delay)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onPressAdd();
  };

  return (
    <View
      style={[
        styles.dockWrapper,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}
      pointerEvents="box-none"
    >
      {/* Ambient Neon Underglow Cushion */}
      <View style={styles.neonUnderglow} pointerEvents="none" />

      {/* Floating Obsidian Glass Island */}
      <View style={styles.dockIslandContainer}>
        <LinearGradient
          colors={['#092B1E', '#041B13', '#02100B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.dockIslandGradient}
        >
          {/* Top Glass Rim Reflection Highlight */}
          <View style={styles.glassTopRim} pointerEvents="none" />

          {/* Liquid Flowing Capsule Cursor (Runs on GPU, zero touch-blocking) */}
          <Animated.View
            pointerEvents="none"
            style={[styles.liquidCursor, animatedCursorStyle]}
          >
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(52, 211, 153, 0.28)', 'rgba(16, 185, 129, 0.12)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.liquidCursorGradient}
            >
              {/* Top Shimmer Streak */}
              <View style={styles.liquidGlowShimmer} pointerEvents="none" />
              {/* Luminous Glowing Cyber Jewel */}
              <View style={styles.liquidJewelDot} pointerEvents="none" />
            </LinearGradient>
          </Animated.View>

          {/* Wing Left: 1. Home Tab */}
          <TabButton
            icon="home"
            label="Home"
            isActive={activeTab === 'home'}
            onPress={() => handleTabPress('home')}
            onLayout={(e) => handleTabLayout('home', e.nativeEvent.layout)}
          />

          {/* Wing Left: 2. Vault Tab */}
          <TabButton
            icon="shield"
            label="Vault"
            isActive={activeTab === 'vault'}
            onPress={() => handleTabPress('vault')}
            onLayout={(e) => handleTabLayout('vault', e.nativeEvent.layout)}
          />

          {/* Cockpit Left Divider */}
          <View style={styles.cockpitDivider} pointerEvents="none" />

          {/* Center Action Core ("The Quantum Vault Key") */}
          <View style={styles.centerSlot}>
            <Pressable
              onPressIn={handleAddPressIn}
              onPressOut={handleAddPressOut}
              accessibilityRole="button"
              accessibilityLabel="Add new credential item"
              style={styles.fabPressable}
            >
              {/* Continuous Breathing Energy Halo */}
              <Animated.View style={[styles.breathingHalo, animatedAuraStyle]} pointerEvents="none" />

              {/* Luminous Squircle Core */}
              <Animated.View style={[styles.fabSquircle, animatedFabStyle]}>
                <LinearGradient
                  colors={['#34D399', '#10B981', '#065F46']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.fabGradient}
                >
                  {/* Gloss Specular Highlight */}
                  <View style={styles.fabGlossPill} pointerEvents="none" />
                  <Feather name="plus" size={23} color="#FFFFFF" />
                </LinearGradient>
              </Animated.View>
            </Pressable>
          </View>

          {/* Cockpit Right Divider */}
          <View style={styles.cockpitDivider} pointerEvents="none" />

          {/* Wing Right: 3. Generator Tab */}
          <TabButton
            icon="key"
            label="Keys"
            isActive={activeTab === 'generator'}
            onPress={() => handleTabPress('generator')}
            onLayout={(e) => handleTabLayout('generator', e.nativeEvent.layout)}
          />

          {/* Wing Right: 4. Account Tab */}
          <TabButton
            icon="user"
            label="Account"
            isActive={activeTab === 'settings'}
            onPress={() => handleTabPress('settings')}
            onLayout={(e) => handleTabLayout('settings', e.nativeEvent.layout)}
          />
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dockWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  neonUnderglow: {
    position: 'absolute',
    bottom: 16,
    width: '76%',
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.28)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 4,
  },
  dockIslandContainer: {
    width: '92%',
    maxWidth: 420,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.26)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.38,
    shadowRadius: 20,
    elevation: 10,
  },
  dockIslandGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    position: 'relative',
  },
  glassTopRim: {
    position: 'absolute',
    top: 0,
    left: '10%',
    right: '10%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    borderRadius: 1,
    zIndex: 4,
  },
  cockpitDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(52, 211, 153, 0.14)',
    borderRadius: 1,
    zIndex: 2,
  },
  liquidCursor: {
    position: 'absolute',
    top: 9,
    height: 52,
    borderRadius: 18,
    zIndex: 1,
    // Do not set elevation on cursor so Android renders tab content cleanly above it
  },
  liquidCursorGradient: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(52, 211, 153, 0.5)',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  liquidGlowShimmer: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 1,
  },
  liquidJewelDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#34D399',
    position: 'absolute',
    bottom: 3,
    alignSelf: 'center',
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 5,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    zIndex: 2,
    elevation: 3, // Guarantees tab text and icons sit physically above cursor on Android
  },
  tabContentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabLabelInactive: {
    fontWeight: '600',
    color: '#7E9F90',
  },
  centerSlot: {
    width: 58,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    elevation: 6, // Elevated above tabs and cursor
  },
  fabPressable: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  breathingHalo: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 22,
    backgroundColor: '#10B981',
  },
  fabSquircle: {
    width: 48,
    height: 48,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  fabGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  fabGlossPill: {
    position: 'absolute',
    top: 3,
    width: 28,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
});
