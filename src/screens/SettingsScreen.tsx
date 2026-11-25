import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { useVault } from '../context/VaultContext';
import { ChangePinModal } from '../components/common/ChangePinModal';

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    biometricsAvailable,
    biometricsEnabled,
    toggleBiometricsEnabled,
    lockVault,
    stats,
    setupMasterPin,
    userProfile,
    items,
    loadDemoData,
    clearVaultData,
    resetAllAppData,
    autofillStatus,
    enableAutofill,
    syncAutofill,
  } = useVault();

  const [autoLockTime, setAutoLockTime] = useState<'30s' | '1m' | '5m'>('30s');
  const [isChangePinVisible, setIsChangePinVisible] = useState<boolean>(false);
  const [isSyncingAutofill, setIsSyncingAutofill] = useState<boolean>(false);

  const handleEnableAutofill = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const res = await enableAutofill();
    if (!res) {
      Alert.alert(
        'Android Autofill Settings',
        'To choose PassManage as your default autofill service:\n\n1. Open your Android Settings > System > Languages & Input > Autofill service (or Settings > Passwords & Accounts).\n2. Select "PassManage".',
        [{ text: 'OK' }]
      );
    }
  };

  const handleManualSyncAutofill = async () => {
    setIsSyncingAutofill(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await syncAutofill();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Autofill Engine Synced',
        `${items.length} credential${items.length === 1 ? '' : 's'} synchronized with Android system autofill.\n\nReady for auto-fill and auto-save on Chrome, web browsers, and Android apps.`
      );
    } catch {
      Alert.alert('Sync Notice', 'Failed to synchronize with native autofill engine.');
    } finally {
      setIsSyncingAutofill(false);
    }
  };

  const handleShareVaultWhatsApp = async () => {
    if (items.length === 0) {
      Alert.alert('Vault is Empty', 'Your vault currently has no stored credentials to share.');
      return;
    }

    Alert.alert(
      'Share Vault via WhatsApp',
      `Share a formatted backup of all ${items.length} vault credentials via WhatsApp?\n\nOnly send this to trusted devices or your personal WhatsApp chat.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share on WhatsApp',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const header =
              `🛡️ *PassManage Vault Backup*\n` +
              `*Owner:* ${userProfile.name || 'Vault User'}\n` +
              `*Total Credentials:* ${items.length}\n` +
              `*Export Date:* ${new Date().toLocaleDateString()}\n\n` +
              `━━━━━━━━━━━━━━━━━━━━━\n`;

            const entries = items
              .map(
                (it, i) =>
                  `*${i + 1}. ${it.appName}*\n` +
                  `• *Username / ID:* ${it.username || 'N/A'}\n` +
                  `• *Password:* ${it.password}\n` +
                  (it.siteUrl ? `• *URL:* ${it.siteUrl}\n` : '') +
                  (it.notes ? `• *Notes:* ${it.notes}\n` : '')
              )
              .join('\n━━━━━━━━━━━━━━━━━━━━━\n');

            const footer = `\n━━━━━━━━━━━━━━━━━━━━━\n_Exported securely from PassManage (100% Offline Vault)_`;
            const fullMessage = header + entries + footer;

            const encoded = encodeURIComponent(fullMessage);
            const whatsappUrl = `whatsapp://send?text=${encoded}`;

            try {
              const canOpen = await Linking.canOpenURL(whatsappUrl);
              if (canOpen) {
                await Linking.openURL(whatsappUrl);
              } else {
                await Share.share({
                  title: 'PassManage Vault Backup',
                  message: fullMessage,
                });
              }
            } catch {
              await Share.share({
                title: 'PassManage Vault Backup',
                message: fullMessage,
              });
            }
          },
        },
      ]
    );
  };

  const handleToggleBiometrics = async (value: boolean) => {
    if (value && !biometricsAvailable) {
      Alert.alert(
        'Biometrics Not Enrolled',
        'Your Android device does not have any fingerprints or face data enrolled yet.\n\nPlease register a fingerprint in Android Settings > Security > Fingerprint, then return here to enable it.',
        [{ text: 'OK' }]
      );
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleBiometricsEnabled(value);
  };

  const handleChangePin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsChangePinVisible(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <Text style={styles.screenTitle}>Account & Security</Text>
      <Text style={styles.screenSubtitle}>Manage your vault encryption and biometrics</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userProfile.avatarInitials || 'VU'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userProfile.name || 'Vault User'}</Text>
            <Text style={styles.profileEmail}>
              {userProfile.email || 'Master Vault Key Holder'}
            </Text>
            <View style={styles.badgeRow}>
              <View style={styles.securityBadge}>
                <Feather name="shield" size={12} color={Colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.securityBadgeText}>AES-256 Vault</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Biometrics & Authentication Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Biometric Authentication</Text>

          {/* Biometric Toggle Row */}
          <View style={styles.settingRow}>
            <View style={styles.settingIconBox}>
              <Ionicons name="finger-print" size={24} color={Colors.primary} />
            </View>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingTitle}>Fingerprint / Face Unlock</Text>
              <Text style={styles.settingDesc}>
                {biometricsAvailable
                  ? 'Sensor active & enrolled'
                  : 'No biometrics enrolled on device'}
              </Text>
            </View>
            <Switch
              value={biometricsEnabled && biometricsAvailable}
              onValueChange={handleToggleBiometrics}
              trackColor={{ false: '#E2E8F0', true: Colors.accentMint }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Helper Callout Box */}
          <View style={styles.helpBox}>
            <Ionicons name="information-circle" size={18} color={Colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.helpText}>
              {biometricsAvailable
                ? 'When enabled, you can unlock PassManage with your fingerprint or face directly from the lock screen.'
                : 'To set up fingerprint on an Android phone, go to Android Settings > Security > Fingerprint. On an emulator, use Extended Controls (...) > Fingerprint.'}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Change Master PIN Row */}
          <TouchableOpacity style={styles.clickableRow} onPress={handleChangePin}>
            <View style={styles.settingIconBox}>
              <Feather name="key" size={20} color={Colors.primary} />
            </View>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingTitle}>Change Master PIN</Text>
              <Text style={styles.settingDesc}>Update your 4-digit master access code</Text>
            </View>
            <Feather name="chevron-right" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Android System Autofill & Auto-Save Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Android System Autofill</Text>
            <View
              style={[
                styles.statusPill,
                autofillStatus.isEnabled ? styles.statusPillActive : styles.statusPillInactive,
              ]}
            >
              <Ionicons
                name={autofillStatus.isEnabled ? 'checkmark-circle' : 'alert-circle'}
                size={12}
                color={autofillStatus.isEnabled ? '#059669' : '#D97706'}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.statusPillText,
                  autofillStatus.isEnabled ? styles.statusPillTextActive : styles.statusPillTextInactive,
                ]}
              >
                {autofillStatus.isEnabled ? 'Active Provider' : 'Not Configured'}
              </Text>
            </View>
          </View>

          {/* Service Info Row */}
          <View style={styles.settingRow}>
            <View style={[styles.settingIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="sparkles" size={20} color={Colors.primary} />
            </View>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingTitle}>Auto-Fill & Auto-Save</Text>
              <Text style={styles.settingDesc}>
                {autofillStatus.isEnabled
                  ? 'System service ready for input fields'
                  : 'Tap below to select PassManage as provider'}
              </Text>
            </View>
          </View>

          {/* Capabilities Banner */}
          <View style={styles.autofillFeatureBox}>
            <View style={styles.featureItemRow}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>
                <Text style={styles.featureBold}>Auto-Fill (onFillRequest):</Text> Instant dropdown suggestions in Chrome, Netflix, Instagram, etc.
              </Text>
            </View>
            <View style={styles.featureItemRow}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>
                <Text style={styles.featureBold}>Auto-Save (onSaveRequest):</Text> Prompts "Save password to PassManage?" when signing in or registering anywhere.
              </Text>
            </View>
            <View style={styles.featureItemRow}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>
                <Text style={styles.featureBold}>100% Zero-Knowledge:</Text> Completely offline on-device storage. No cloud tracking.
              </Text>
            </View>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.autofillActionRow}>
            <TouchableOpacity
              style={[
                styles.autofillBtnPrimary,
                autofillStatus.isEnabled && styles.autofillBtnConfigured,
              ]}
              onPress={handleEnableAutofill}
              activeOpacity={0.8}
            >
              <Ionicons
                name={autofillStatus.isEnabled ? 'settings-outline' : 'flash-outline'}
                size={16}
                color={autofillStatus.isEnabled ? Colors.primary : '#FFFFFF'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.autofillBtnPrimaryText,
                  autofillStatus.isEnabled && styles.autofillBtnConfiguredText,
                ]}
              >
                {autofillStatus.isEnabled ? 'Autofill Settings' : 'Enable Autofill Service'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.autofillBtnSecondary}
              onPress={handleManualSyncAutofill}
              disabled={isSyncingAutofill}
              activeOpacity={0.8}
            >
              <Feather
                name="refresh-cw"
                size={14}
                color={Colors.primary}
                style={{ marginRight: 5 }}
              />
              <Text style={styles.autofillBtnSecondaryText}>
                {isSyncingAutofill ? 'Syncing...' : `Sync (${items.length})`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Preferences */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Vault Security Policies</Text>

          {/* Auto Lock Timeout */}
          <View style={styles.settingRowNoBorder}>
            <View style={styles.settingIconBox}>
              <Feather name="clock" size={20} color={Colors.primary} />
            </View>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingTitle}>Auto-Lock Timeout</Text>
              <Text style={styles.settingDesc}>Lock when backgrounded</Text>
            </View>
            <View style={styles.timeoutPillsRow}>
              {(['30s', '1m', '5m'] as const).map(time => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeoutPill,
                    autoLockTime === time && styles.timeoutPillActive,
                  ]}
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setAutoLockTime(time);
                  }}
                >
                  <Text
                    style={[
                      styles.timeoutPillText,
                      autoLockTime === time && styles.timeoutPillTextActive,
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Auto Clear Clipboard */}
          <View style={styles.settingRowNoBorder}>
            <View style={styles.settingIconBox}>
              <Feather name="clipboard" size={20} color={Colors.primary} />
            </View>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingTitle}>Auto-Clear Clipboard</Text>
              <Text style={styles.settingDesc}>Clears copied passwords after 45s</Text>
            </View>
            <Feather name="check" size={18} color={Colors.accentMint} />
          </View>
        </View>

        {/* Vault Stats Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Vault Database Summary</Text>
          <View style={styles.statsSummaryRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{stats.total}</Text>
              <Text style={styles.statLabel}>Stored Items</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: stats.weak > 0 ? '#F59E0B' : Colors.accentMint }]}>
                {stats.weak}
              </Text>
              <Text style={styles.statLabel}>Weak Passwords</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: Colors.accentMint }]}>
                {stats.healthScore}%
              </Text>
              <Text style={styles.statLabel}>Health Score</Text>
            </View>
          </View>
        </View>

        {/* Demo & Vault Data Tools */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Vault Data & Testing</Text>

          {/* Share Entire Vault via WhatsApp */}
          <TouchableOpacity
            style={styles.clickableRow}
            onPress={handleShareVaultWhatsApp}
            activeOpacity={0.75}
          >
            <View style={[styles.settingIconBox, { backgroundColor: '#E8FDF3' }]}>
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            </View>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingTitle}>Share Vault via WhatsApp</Text>
              <Text style={styles.settingDesc}>Export a formatted digest of all passwords</Text>
            </View>
            <Feather name="chevron-right" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.clickableRow}
            onPress={() => {
              Alert.alert(
                'Load Sample Credentials',
                'This will load 6 realistic demo passwords so you can test all vulnerability analytics and filters. Continue?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Load Demo',
                    onPress: async () => {
                      await loadDemoData();
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                      Alert.alert('Demo Loaded', '6 realistic sample credentials loaded into your vault.');
                    },
                  },
                ]
              );
            }}
          >
            <View style={styles.settingIconBox}>
              <Feather name="download-cloud" size={20} color={Colors.primary} />
            </View>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingTitle}>Load Demo Credentials</Text>
              <Text style={styles.settingDesc}>Add 6 sample passwords to test features</Text>
            </View>
            <Feather name="chevron-right" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.clickableRow}
            onPress={() => {
              Alert.alert(
                'Clear Vault Data',
                'Are you sure you want to delete all stored passwords and reset to an empty vault?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: async () => {
                      await clearVaultData();
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
                      Alert.alert('Vault Cleared', 'All vault data has been removed.');
                    },
                  },
                ]
              );
            }}
          >
            <View style={[styles.settingIconBox, { backgroundColor: '#FEE2E2' }]}>
              <Feather name="trash-2" size={19} color="#EF4444" />
            </View>
            <View style={styles.settingTextCol}>
              <Text style={[styles.settingTitle, { color: '#EF4444' }]}>Clear All Credentials</Text>
              <Text style={styles.settingDesc}>Reset to a fresh empty vault</Text>
            </View>
            <Feather name="chevron-right" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.clickableRow}
            onPress={() => {
              Alert.alert(
                'Simulate Fresh Install',
                'This will erase your master PIN, onboarding state, profile, and vault data, returning the app to its brand new first-time install experience.\n\nAre you sure you want to proceed?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset App',
                    style: 'destructive',
                    onPress: async () => {
                      await resetAllAppData();
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
                    },
                  },
                ]
              );
            }}
          >
            <View style={[styles.settingIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Feather name="refresh-cw" size={18} color="#D97706" />
            </View>
            <View style={styles.settingTextCol}>
              <Text style={[styles.settingTitle, { color: '#D97706' }]}>Reset App (Simulate Fresh Install)</Text>
              <Text style={styles.settingDesc}>Re-test onboarding carousel & PIN setup</Text>
            </View>
            <Feather name="chevron-right" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Lock Vault Button */}
        <TouchableOpacity
          style={styles.lockBtn}
          onPress={lockVault}
          activeOpacity={0.88}
        >
          <Feather name="lock" size={18} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.lockBtnText}>Lock Vault Immediately</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Change Master PIN Modal */}
      {isChangePinVisible && (
        <ChangePinModal
          visible={isChangePinVisible}
          onClose={() => setIsChangePinVisible(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textDark,
    marginTop: 8,
  },
  screenSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  scrollContent: {
    gap: 16,
    paddingBottom: 110,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 20,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textDark,
  },
  profileEmail: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  securityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 14,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingRowNoBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  clickableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTextCol: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
  },
  settingDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  helpBox: {
    flexDirection: 'row',
    backgroundColor: Colors.primarySurface,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  helpText: {
    flex: 1,
    fontSize: 12,
    color: Colors.primary,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  timeoutPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  timeoutPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  timeoutPillActive: {
    backgroundColor: Colors.primary,
  },
  timeoutPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  timeoutPillTextActive: {
    color: '#FFFFFF',
  },
  statsSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 6,
  },
  statBox: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textDark,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
  },
  lockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 4,
  },
  lockBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 15,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusPillActive: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusPillInactive: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusPillTextActive: {
    color: '#065F46',
  },
  statusPillTextInactive: {
    color: '#B45309',
  },
  autofillFeatureBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  featureItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.accentMint,
    marginTop: 6,
    marginRight: 8,
  },
  featureText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  featureBold: {
    fontWeight: '700',
    color: Colors.textDark,
  },
  autofillActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  autofillBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  autofillBtnConfigured: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  autofillBtnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  autofillBtnConfiguredText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  autofillBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  autofillBtnSecondaryText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
});
