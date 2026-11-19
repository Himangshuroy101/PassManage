import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { VaultItem } from '../../types/vault';
import { Colors } from '../../theme/colors';
import { copyToClipboardSecurely } from '../../services/security';
import { useVault } from '../../context/VaultContext';

interface VaultItemCardProps {
  item: VaultItem;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

// Brand color and icon helper
function getBrandConfig(appName: string, category: string): {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  bgColor: string;
} {
  const name = appName.toLowerCase();
  if (name.includes('netflix')) {
    return { icon: 'netflix', color: '#E50914', bgColor: '#FDE8E8' };
  }
  if (name.includes('google') || name.includes('gmail')) {
    return { icon: 'google', color: '#EA4335', bgColor: '#FCE8E6' };
  }
  if (name.includes('instagram')) {
    return { icon: 'instagram', color: '#E1306C', bgColor: '#FCE4EC' };
  }
  if (name.includes('upwork')) {
    return { icon: 'briefcase-outline', color: '#14A800', bgColor: '#E8F5E9' };
  }
  if (name.includes('amazon')) {
    return { icon: 'cart-outline', color: '#FF9900', bgColor: '#FFF3E0' };
  }
  if (name.includes('wifi')) {
    return { icon: 'wifi', color: '#0284C7', bgColor: '#E0F2FE' };
  }
  if (name.includes('card') || name.includes('bank') || name.includes('mastercard') || category === 'payment') {
    return { icon: 'credit-card-outline', color: '#8B5CF6', bgColor: '#EDE9FE' };
  }
  if (category === 'mobile') {
    return { icon: 'cellphone', color: '#059669', bgColor: '#D1FAE5' };
  }
  return { icon: 'shield-key-outline', color: Colors.primary, bgColor: Colors.primarySurface };
}

export const VaultItemCard: React.FC<VaultItemCardProps> = ({
  item,
  onPress,
  onEdit,
  onDelete,
}) => {
  const { toggleFavorite, deleteItem, setItemToEdit, setIsAddEditModalVisible } = useVault();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<'user' | 'pass' | null>(null);

  const brand = getBrandConfig(item.appName, item.category);

  const handleCopy = async (text: string, type: 'user' | 'pass') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await copyToClipboardSecurely(text);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedType(null);
    }, 2000);
  };

  const handleToggleFavorite = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleFavorite(item.id);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Vault Item',
      `Are you sure you want to delete ${item.appName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deleteItem(item.id);
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    setItemToEdit(item);
    setIsAddEditModalVisible(true);
  };

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Top Main Row */}
      <View style={styles.topRow}>
        {/* Brand Icon */}
        <View style={[styles.brandAvatar, { backgroundColor: brand.bgColor }]}>
          <MaterialCommunityIcons name={brand.icon} size={24} color={brand.color} />
        </View>

        {/* Title & Username */}
        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text style={styles.appName} numberOfLines={1}>
              {item.appName}
            </Text>
            {item.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.usernameText} numberOfLines={1}>
            {item.username}
          </Text>
        </View>

        {/* Favorite Icon */}
        <TouchableOpacity
          onPress={handleToggleFavorite}
          style={styles.favBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={item.isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={item.isFavorite ? '#EF4444' : Colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Password & Action Bar */}
      <View style={styles.divider} />
      <View style={styles.bottomRow}>
        <View style={styles.passwordDisplay}>
          <Text style={styles.passwordDots}>
            {showPassword ? item.password : '••••••••••••'}
          </Text>
          <TouchableOpacity
            style={styles.inlineActionBtn}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather
              name={showPassword ? 'eye-off' : 'eye'}
              size={15}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Copy, Edit, Delete Actions */}
        <View style={styles.actionButtonsGroup}>
          <TouchableOpacity
            style={[styles.smallIconBtn, copiedType === 'pass' && styles.copiedBtn]}
            onPress={() => handleCopy(item.password, 'pass')}
          >
            <Feather
              name={copiedType === 'pass' ? 'check' : 'copy'}
              size={14}
              color={copiedType === 'pass' ? '#10B981' : Colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.smallIconBtn} onPress={handleEdit}>
            <Feather name="edit-2" size={14} color={Colors.accentBlue} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.smallIconBtn} onPress={handleDelete}>
            <Feather name="trash-2" size={14} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 6,
  },
  appName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
    flexShrink: 1,
  },
  categoryBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  usernameText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 3,
  },
  favBtn: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F8FAFC',
    marginVertical: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passwordDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  passwordDots: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: undefined,
    marginRight: 8,
    letterSpacing: 1,
  },
  inlineActionBtn: {
    padding: 2,
  },
  actionButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smallIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  copiedBtn: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
});
