import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import { VaultItem } from '../types/vault';
import { Colors } from '../theme/colors';
import { copyToClipboardSecurely, calculatePasswordStrength, isItemReused } from '../services/security';
import { useVault } from '../context/VaultContext';

interface VaultDetailSheetProps {
  item: VaultItem | null;
  visible: boolean;
  onClose: () => void;
  onEdit: (item: VaultItem) => void;
}

export const VaultDetailSheet: React.FC<VaultDetailSheetProps> = ({
  item,
  visible,
  onClose,
  onEdit,
}) => {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['82%'], []);
  const { items, deleteItem } = useVault();

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (visible && item) {
      setShowPassword(false);
      setCopiedField(null);
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [visible, item]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  if (!item || !visible) return null;

  const strength = calculatePasswordStrength(item.password);

  const handleCopy = async (text: string, fieldName: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await copyToClipboardSecurely(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handleOpenUrl = async () => {
    if (!item.siteUrl) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const url = item.siteUrl.startsWith('http') ? item.siteUrl : `https://${item.siteUrl}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Unable to open link', item.siteUrl);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleShareWhatsApp = async () => {
    Alert.alert(
      'Share via WhatsApp',
      `Share credentials for "${item.appName}" via WhatsApp?\n\nBe mindful when sending sensitive passwords over messaging apps.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share on WhatsApp',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const message =
              `🔐 *PassManage Vault Credential*\n\n` +
              `*Account:* ${item.appName}\n` +
              `*Username / Email:* ${item.username || 'Not set'}\n` +
              `*Password:* ${item.password}\n` +
              (item.siteUrl ? `*Website:* ${item.siteUrl}\n` : '') +
              (item.tags?.length ? `*Category:* ${item.category.toUpperCase()} (${item.tags.join(', ')})\n` : '') +
              (item.notes ? `*Notes:* ${item.notes}\n` : '') +
              `\n_Shared securely via PassManage (AES-256 Offline Vault)_`;

            const encoded = encodeURIComponent(message);
            const whatsappUrl = `whatsapp://send?text=${encoded}`;

            try {
              const supported = await Linking.canOpenURL(whatsappUrl);
              if (supported) {
                await Linking.openURL(whatsappUrl);
              } else {
                await Share.share({
                  title: `${item.appName} Credential`,
                  message: message,
                });
              }
            } catch (err) {
              await Share.share({
                title: `${item.appName} Credential`,
                message: message,
              });
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Vault Item',
      `Are you sure you want to permanently delete "${item.appName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deleteItem(item.id);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={visible ? 0 : -1}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose={true}
      onClose={onClose}
      backdropComponent={renderBackdrop}
      containerStyle={styles.bottomSheetContainer}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBackground}
    >
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <View style={styles.brandIconContainer}>
            <Feather name="shield" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {item.appName}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="x" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Field: Username / Email */}
        <View style={styles.fieldCard}>
          <Text style={styles.fieldLabel}>Login / User ID</Text>
          <View style={styles.fieldValueRow}>
            <Text style={styles.fieldValueText} selectable>
              {item.username || 'Not set'}
            </Text>
            {item.username ? (
              <TouchableOpacity
                style={[styles.copyBtn, copiedField === 'username' && styles.copyBtnSuccess]}
                onPress={() => handleCopy(item.username, 'username')}
              >
                <Feather
                  name={copiedField === 'username' ? 'check' : 'copy'}
                  size={16}
                  color={copiedField === 'username' ? '#10B981' : Colors.textSecondary}
                />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Field: Password */}
        <View style={styles.fieldCard}>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.fieldValueRow}>
            <Text style={styles.fieldValueText}>
              {showPassword ? item.password : '••••••••••••••••'}
            </Text>
            <View style={styles.rowActions}>
              <TouchableOpacity
                style={styles.revealBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={16}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.copyBtn, copiedField === 'password' && styles.copyBtnSuccess]}
                onPress={() => handleCopy(item.password, 'password')}
              >
                <Feather
                  name={copiedField === 'password' ? 'check' : 'copy'}
                  size={16}
                  color={copiedField === 'password' ? '#10B981' : Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Field: Login URL */}
        {item.siteUrl ? (
          <View style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>Website Address / Link</Text>
            <View style={styles.fieldValueRow}>
              <Text style={[styles.fieldValueText, styles.urlText]} numberOfLines={1}>
                {item.siteUrl}
              </Text>
              <TouchableOpacity style={styles.openUrlBtn} onPress={handleOpenUrl}>
                <Feather name="external-link" size={16} color={Colors.accentBlue} />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Field: Category & Tags */}
        <View style={styles.fieldCard}>
          <Text style={styles.fieldLabel}>Tags & Category</Text>
          <View style={styles.tagChipRow}>
            <View style={[styles.tagChip, styles.categoryChip]}>
              <Text style={styles.categoryChipText}>
                {item.category.toUpperCase()}
              </Text>
            </View>
            {item.tags.map((tag, idx) => (
              <View key={idx} style={styles.tagChip}>
                <Text style={styles.tagChipText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Vulnerability & Reused Alert Card */}
        {(() => {
          const isReused = isItemReused(item, items);
          if (!strength.isWeak && !strength.isCompromised && !isReused) return null;

          let alertTitle = 'Weak Password Alert';
          let alertDesc = `This password strength is low (${strength.score}/100). Consider updating it.`;
          let alertColor = '#EA580C';

          if (strength.isCompromised) {
            alertTitle = '🚨 Critical Security Alert';
            alertDesc = 'This password matches known breaches or is dangerously weak. Update immediately.';
            alertColor = '#DC2626';
          } else if (isReused) {
            alertTitle = '🔄 Reused Password Alert';
            alertDesc = 'This password is used across multiple vault items, increasing credential stuffing risk.';
            alertColor = '#9333EA';
          }

          return (
            <TouchableOpacity
              style={[
                styles.vulnerabilityAlertCard,
                { borderColor: alertColor, backgroundColor: strength.isCompromised ? '#FEF2F2' : isReused ? '#FAF5FF' : '#FFF7ED' }
              ]}
              onPress={() => {
                onClose();
                setTimeout(() => onEdit(item), 150);
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.alertIconCircle, { backgroundColor: alertColor + '20' }]}>
                <Feather
                  name={strength.isCompromised ? 'alert-octagon' : isReused ? 'repeat' : 'alert-triangle'}
                  size={18}
                  color={alertColor}
                />
              </View>
              <View style={styles.alertTextCol}>
                <Text style={[styles.alertHeading, { color: alertColor }]}>{alertTitle}</Text>
                <Text style={styles.alertSubtitle}>{alertDesc}</Text>
              </View>
              <Feather name="chevron-right" size={20} color={alertColor} />
            </TouchableOpacity>
          );
        })()}

        {/* WhatsApp Share Button */}
        <TouchableOpacity
          style={styles.whatsAppShareBtn}
          onPress={handleShareWhatsApp}
          activeOpacity={0.88}
        >
          <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.whatsAppShareText}>Share Credential on WhatsApp</Text>
        </TouchableOpacity>

        {/* Action Buttons: Edit and Delete */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.primaryEditBtn}
            onPress={() => {
              onClose();
              setTimeout(() => onEdit(item), 150);
            }}
            activeOpacity={0.85}
          >
            <Feather name="edit-2" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryEditText}>Edit Vault Item</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
            activeOpacity={0.85}
          >
            <Feather name="trash-2" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  bottomSheetContainer: {
    zIndex: 9999,
  },
  handleIndicator: {
    backgroundColor: '#CBD5E1',
    width: 44,
    height: 4,
    borderRadius: 2,
  },
  sheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    elevation: 50,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
    flex: 1,
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: 22,
    gap: 14,
    paddingBottom: 40,
  },
  fieldCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldValueText: {
    fontSize: 15,
    color: Colors.textDark,
    fontWeight: '500',
    flex: 1,
  },
  urlText: {
    color: Colors.accentBlue,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  revealBtn: {
    padding: 6,
  },
  copyBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  copyBtnSuccess: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  openUrlBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tagChip: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  categoryChip: {
    backgroundColor: Colors.primarySurface,
  },
  categoryChipText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  tagChipText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '600',
  },
  vulnerabilityAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 16,
    padding: 14,
    marginVertical: 4,
  },
  alertIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertTextCol: {
    flex: 1,
  },
  alertHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C2410C',
  },
  alertSubtitle: {
    fontSize: 12,
    color: '#9A3412',
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  primaryEditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryEditText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  whatsAppShareBtn: {
    backgroundColor: '#25D366',
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 3,
  },
  whatsAppShareText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
