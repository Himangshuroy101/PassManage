import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { VaultProvider, useVault } from './src/context/VaultContext';
import { LockScreen } from './src/screens/LockScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { VaultListScreen } from './src/screens/VaultListScreen';
import { GeneratorModal } from './src/screens/GeneratorModal';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { VaultDetailSheet } from './src/screens/VaultDetailSheet';
import { AddEditVaultSheet } from './src/screens/AddEditVaultSheet';
import { BottomTabBar } from './src/components/common/BottomTabBar';
import { SplashScreen } from './src/screens/SplashScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';

const MainAppContent: React.FC = () => {
  const {
    isAuthLoading,
    isOnboardingCompleted,
    isPinSet,
    isLocked,
    activeTab,
    setActiveTab,
    selectedItemForDetail,
    setSelectedItemForDetail,
    isAddEditModalVisible,
    setIsAddEditModalVisible,
    itemToEdit,
    setItemToEdit,
  } = useVault();

  // 1. Initial secure cinematic splash screen
  if (isAuthLoading) {
    return <SplashScreen />;
  }

  // 2. First-time install -> Onboarding Carousel & Profile Setup
  if (!isOnboardingCompleted) {
    return <OnboardingScreen />;
  }

  // 3. First-time Master PIN setup
  if (!isPinSet) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <LockScreen />
      </View>
    );
  }

  // 4. Returning user & locked vault -> Master PIN / Biometrics Keypad
  if (isLocked) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <LockScreen />
      </View>
    );
  }

  // Once unlocked, render Dashboard with Navigation
  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Screen based on active tab */}
      <View style={styles.screenContainer}>
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'vault' && <VaultListScreen />}
        {activeTab === 'generator' && <GeneratorModal />}
        {activeTab === 'settings' && <SettingsScreen />}
      </View>

      {/* Modern Bottom Navigation Bar */}
      <BottomTabBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onPressAdd={() => {
          setItemToEdit(null);
          setIsAddEditModalVisible(true);
        }}
      />

      {/* View Details Sheet (Matching Image 2 Screen 3) */}
      {Boolean(selectedItemForDetail) && (
        <VaultDetailSheet
          item={selectedItemForDetail}
          visible={!!selectedItemForDetail}
          onClose={() => setSelectedItemForDetail(null)}
          onEdit={item => {
            setSelectedItemForDetail(null);
            setTimeout(() => {
              setItemToEdit(item);
              setIsAddEditModalVisible(true);
            }, 150);
          }}
        />
      )}

      {/* Create / Edit Sheet (Matching Image 1 Screen 3) */}
      {isAddEditModalVisible && (
        <AddEditVaultSheet
          visible={isAddEditModalVisible}
          itemToEdit={itemToEdit}
          onClose={() => {
            setIsAddEditModalVisible(false);
            setItemToEdit(null);
          }}
        />
      )}
    </View>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <SafeAreaProvider>
        <VaultProvider>
          <MainAppContent />
        </VaultProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  root: {
    flex: 1,
    backgroundColor: '#0D533A',
  },
  splashCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  splashTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  splashSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 6,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
