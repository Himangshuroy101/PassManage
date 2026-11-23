import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VaultItem, VaultStats, VaultCategory, ActiveTab, UserProfile } from '../types/vault';
import {
  isMasterPinSet,
  setMasterPin,
  verifyMasterPin,
  checkBiometricsAvailable,
  isBiometricsPrefEnabled,
  setBiometricsPrefEnabled,
  authenticateWithBiometrics,
  encryptVaultData,
  decryptVaultData,
  computeVaultStats,
  clearAllSecureCredentials,
} from '../services/security';

const VAULT_STORAGE_KEY = 'pm_encrypted_vault_data';
const ONBOARDING_STORAGE_KEY = 'pm_onboarding_completed';
const PROFILE_STORAGE_KEY = 'pm_user_profile';

export function computeInitials(name: string): string {
  if (!name || !name.trim()) return 'VU';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Vault User',
  email: '',
  avatarInitials: 'VU',
  createdAt: Date.now(),
};

// Initial realistic seed items for demo or testing purposes
export const DEMO_SEED_ITEMS: VaultItem[] = [
  {
    id: '1',
    appName: 'Upwork Agency',
    username: 'martinezlisandro@gmail.com',
    password: 'Password123!Secure',
    siteUrl: 'https://upwork.com/ab/account-security',
    category: 'login',
    tags: ['Work', 'Login', 'Agency'],
    isFavorite: true,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: '2',
    appName: 'Netflix',
    username: 'lisandromartinez06@gmail.com',
    password: 'netflix2022',
    siteUrl: 'https://netflix.com/login',
    category: 'mobile',
    tags: ['Personal', 'Entertainment'],
    isFavorite: true,
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: '3',
    appName: 'Instagram',
    username: 'lisandromartinez06@gmail.com',
    password: 'insta_2026_pass',
    siteUrl: 'https://instagram.com',
    category: 'mobile',
    tags: ['Social', 'Mobile'],
    isFavorite: false,
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: '4',
    appName: 'Spotify Premium',
    username: 'lisandromartinez06@gmail.com',
    password: 'insta_2026_pass',
    siteUrl: 'https://spotify.com/account',
    category: 'mobile',
    tags: ['Music', 'Personal'],
    isFavorite: false,
    createdAt: Date.now() - 86400000 * 18,
    updatedAt: Date.now() - 86400000 * 4,
  },
  {
    id: '5',
    appName: 'Office WiFi',
    username: 'Headquarters-5G',
    password: 'OfficeWifiSecretKey!42',
    siteUrl: 'https://internal.network.local',
    category: 'wifi',
    tags: ['Office', 'WiFi'],
    isFavorite: false,
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 20,
  },
  {
    id: '6',
    appName: 'Mastercard Account',
    username: 'Card ending in 4345',
    password: 'CardPin#8849!v2',
    siteUrl: 'https://banking.mastercard.com',
    category: 'payment',
    tags: ['Bank', 'Finance'],
    isFavorite: false,
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 10,
  },
];

interface VaultContextType {
  isAuthLoading: boolean;
  isLocked: boolean;
  isPinSet: boolean;
  isOnboardingCompleted: boolean;
  userProfile: UserProfile;
  biometricsAvailable: boolean;
  biometricsEnabled: boolean;
  items: VaultItem[];
  stats: VaultStats;
  searchQuery: string;
  activeCategory: VaultCategory;
  activeTab: ActiveTab;
  selectedItemForDetail: VaultItem | null;
  isAddEditModalVisible: boolean;
  itemToEdit: VaultItem | null;
  isGeneratorModalVisible: boolean;
  
  // Navigation & selection
  setSearchQuery: (query: string) => void;
  setActiveCategory: (cat: VaultCategory) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setSelectedItemForDetail: (item: VaultItem | null) => void;
  setIsAddEditModalVisible: (visible: boolean) => void;
  setItemToEdit: (item: VaultItem | null) => void;
  setIsGeneratorModalVisible: (visible: boolean) => void;
  
  // Auth & Profile actions
  completeOnboarding: (info: { name: string; email: string }) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  unlockWithBiometrics: () => Promise<boolean>;
  setupMasterPin: (pin: string) => Promise<boolean>;
  toggleBiometricsEnabled: (enabled: boolean) => Promise<void>;
  lockVault: () => void;
  
  // CRUD actions
  addItem: (item: Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<VaultItem>;
  updateItem: (id: string, updates: Partial<VaultItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  loadDemoData: () => Promise<void>;
  clearVaultData: () => Promise<void>;
  resetAllAppData: () => Promise<void>;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [isPinSet, setIsPinSet] = useState<boolean>(false);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [biometricsAvailable, setBiometricsAvailable] = useState<boolean>(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState<boolean>(true);
  const [items, setItems] = useState<VaultItem[]>([]);
  const backgroundTimestampRef = useRef<number | null>(null);
  const [stats, setStats] = useState<VaultStats>({
    total: 0,
    compromised: 0,
    weak: 0,
    reused: 0,
    healthScore: 100,
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<VaultCategory>('all');
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<VaultItem | null>(null);
  const [isAddEditModalVisible, setIsAddEditModalVisible] = useState<boolean>(false);
  const [itemToEdit, setItemToEdit] = useState<VaultItem | null>(null);
  const [isGeneratorModalVisible, setIsGeneratorModalVisible] = useState<boolean>(false);

  // Initialize auth state
  useEffect(() => {
    async function initAuth() {
      try {
        const onboarded = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        setIsOnboardingCompleted(onboarded === 'true');

        const savedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (savedProfile) {
          try {
            setUserProfile(JSON.parse(savedProfile));
          } catch {}
        }

        const pinExists = await isMasterPinSet();
        setIsPinSet(pinExists);

        const bio = await checkBiometricsAvailable();
        setBiometricsAvailable(bio.hasHardware && bio.isEnrolled);

        const bioPref = await isBiometricsPrefEnabled();
        setBiometricsEnabled(bioPref);

        // Lock if PIN exists, otherwise allow initial PIN setup
        if (pinExists) {
          setIsLocked(true);
        } else {
          setIsLocked(false);
        }

        // Brief delay so user experiences the cinematic splash reveal
        await new Promise(resolve => setTimeout(resolve, 1850));
      } finally {
        setIsAuthLoading(false);
      }
    }
    initAuth();
  }, []);

  // Background auto-lock (locks if backgrounded for more than 30s)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState.match(/inactive|background/)) {
        backgroundTimestampRef.current = Date.now();
      } else if (nextState === 'active') {
        if (
          backgroundTimestampRef.current &&
          Date.now() - backgroundTimestampRef.current > 30000 &&
          isPinSet
        ) {
          setIsLocked(true);
        }
        backgroundTimestampRef.current = null;
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isPinSet]);

  // Update stats whenever items change
  useEffect(() => {
    const updatedStats = computeVaultStats(items);
    setStats(updatedStats);
  }, [items]);

  // Load encrypted vault data from storage
  const loadVaultData = async () => {
    try {
      const encryptedData = await AsyncStorage.getItem(VAULT_STORAGE_KEY);
      if (encryptedData) {
        const decrypted = await decryptVaultData(encryptedData);
        if (decrypted) {
          setItems(decrypted);
          return;
        }
      }
      // If fresh install with no data, start with clean empty vault
      setItems([]);
    } catch (error) {
      console.error('Error loading vault data:', error);
      setItems([]);
    }
  };

  // Populate realistic sample demo items for testing
  const loadDemoData = async () => {
    try {
      setItems(DEMO_SEED_ITEMS);
      const encrypted = await encryptVaultData(DEMO_SEED_ITEMS);
      await AsyncStorage.setItem(VAULT_STORAGE_KEY, encrypted);
    } catch (error) {
      console.error('Error loading demo data:', error);
    }
  };

  // Clear all vault credentials
  const clearVaultData = async () => {
    try {
      setItems([]);
      const encrypted = await encryptVaultData([]);
      await AsyncStorage.setItem(VAULT_STORAGE_KEY, encrypted);
    } catch (error) {
      console.error('Error clearing vault data:', error);
    }
  };

  // Full reset for testing fresh install & onboarding flow
  const resetAllAppData = async () => {
    try {
      await clearAllSecureCredentials();
      await AsyncStorage.multiRemove([
        VAULT_STORAGE_KEY,
        ONBOARDING_STORAGE_KEY,
        PROFILE_STORAGE_KEY,
      ]);
      setItems([]);
      setUserProfile(DEFAULT_PROFILE);
      setIsPinSet(false);
      setIsOnboardingCompleted(false);
      setIsLocked(true);
      setActiveTab('home');
    } catch (error) {
      console.error('Error resetting all app data:', error);
    }
  };

  // Complete initial onboarding and store user profile
  const completeOnboarding = async (info: { name: string; email: string }) => {
    const trimmedName = info.name.trim() || 'Vault User';
    const initials = computeInitials(trimmedName);
    const newProfile: UserProfile = {
      name: trimmedName,
      email: info.email.trim(),
      avatarInitials: initials,
      createdAt: Date.now(),
    };
    setUserProfile(newProfile);
    setIsOnboardingCompleted(true);
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
  };

  // Update user profile information
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    const updated: UserProfile = {
      ...userProfile,
      ...updates,
      avatarInitials: updates.name ? computeInitials(updates.name) : userProfile.avatarInitials,
    };
    setUserProfile(updated);
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
  };

  // Save vault data encrypted to storage
  const saveVaultData = async (newItems: VaultItem[]) => {
    try {
      setItems(newItems);
      const encrypted = await encryptVaultData(newItems);
      await AsyncStorage.setItem(VAULT_STORAGE_KEY, encrypted);
    } catch (error) {
      console.error('Error saving vault data:', error);
    }
  };

  // Auth Handlers
  const unlockWithPin = async (pin: string): Promise<boolean> => {
    const valid = await verifyMasterPin(pin);
    if (valid) {
      setIsLocked(false);
      await loadVaultData();
      return true;
    }
    return false;
  };

  const unlockWithBiometrics = async (): Promise<boolean> => {
    const success = await authenticateWithBiometrics();
    if (success) {
      setIsLocked(false);
      await loadVaultData();
      return true;
    }
    return false;
  };

  const setupMasterPin = async (pin: string): Promise<boolean> => {
    const success = await setMasterPin(pin);
    if (success) {
      setIsPinSet(true);
      setIsLocked(false);
      await loadVaultData();
      return true;
    }
    return false;
  };

  const toggleBiometricsEnabled = async (enabled: boolean): Promise<void> => {
    setBiometricsEnabled(enabled);
    await setBiometricsPrefEnabled(enabled);
  };

  const lockVault = () => {
    setIsLocked(true);
    setSelectedItemForDetail(null);
    setIsAddEditModalVisible(false);
  };

  // CRUD Operations
  const addItem = async (
    itemData: Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<VaultItem> => {
    const newItem: VaultItem = {
      ...itemData,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const newItems = [newItem, ...items];
    await saveVaultData(newItems);
    return newItem;
  };

  const updateItem = async (id: string, updates: Partial<VaultItem>): Promise<void> => {
    const newItems = items.map(item =>
      item.id === id ? { ...item, ...updates, updatedAt: Date.now() } : item
    );
    await saveVaultData(newItems);
    if (selectedItemForDetail && selectedItemForDetail.id === id) {
      setSelectedItemForDetail({ ...selectedItemForDetail, ...updates, updatedAt: Date.now() });
    }
  };

  const deleteItem = async (id: string): Promise<void> => {
    const newItems = items.filter(item => item.id !== id);
    await saveVaultData(newItems);
    if (selectedItemForDetail && selectedItemForDetail.id === id) {
      setSelectedItemForDetail(null);
    }
  };

  const toggleFavorite = async (id: string): Promise<void> => {
    const item = items.find(i => i.id === id);
    if (item) {
      await updateItem(id, { isFavorite: !item.isFavorite });
    }
  };

  return (
    <VaultContext.Provider
      value={{
        isAuthLoading,
        isLocked,
        isPinSet,
        isOnboardingCompleted,
        userProfile,
        biometricsAvailable,
        biometricsEnabled,
        items,
        stats,
        searchQuery,
        activeCategory,
        activeTab,
        selectedItemForDetail,
        isAddEditModalVisible,
        itemToEdit,
        isGeneratorModalVisible,
        setSearchQuery,
        setActiveCategory,
        setActiveTab,
        setSelectedItemForDetail,
        setIsAddEditModalVisible,
        setItemToEdit,
        setIsGeneratorModalVisible,
        completeOnboarding,
        updateUserProfile,
        unlockWithPin,
        unlockWithBiometrics,
        setupMasterPin,
        toggleBiometricsEnabled,
        lockVault,
        addItem,
        updateItem,
        deleteItem,
        toggleFavorite,
        loadDemoData,
        clearVaultData,
        resetAllAppData,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};
