import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../components/common/Header';
import { CategoryPills } from '../components/common/CategoryPills';
import { VaultItemCard } from '../components/common/VaultItemCard';
import { useVault } from '../context/VaultContext';
import { Colors } from '../theme/colors';
import { VaultCategory } from '../types/vault';

export const VaultListScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    items,
    activeCategory,
    setActiveCategory,
    setSelectedItemForDetail,
    setIsAddEditModalVisible,
    setItemToEdit,
    loadDemoData,
  } = useVault();

  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredItems = items.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (item.appName || '').toLowerCase().includes(q) ||
      (item.username || '').toLowerCase().includes(q) ||
      (item.siteUrl || '').toLowerCase().includes(q) ||
      (item.tags || []).some(t => (t || '').toLowerCase().includes(q));

    let matchesCategory = true;
    if (activeCategory === 'favourite') {
      matchesCategory = !!item.isFavorite;
    } else if (activeCategory !== 'all') {
      matchesCategory = item.category === activeCategory;
    }

    return matchesSearch && matchesCategory;
  });

  return (
    <View style={styles.container}>
      {/* Header without health gauge */}
      <Header showHealthGauge={false} />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your vaults..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Feather name="x-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Pills */}
      <CategoryPills
        activeCategory={activeCategory}
        onSelectCategory={(cat: VaultCategory) => setActiveCategory(cat)}
      />

      {/* Item count row */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
        </Text>
      </View>

      {/* Vault Items List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Feather name={items.length === 0 ? 'shield' : 'search'} size={30} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              {items.length === 0
                ? 'Your Vault is Clean & Empty'
                : 'No matching vaults'}
            </Text>
            <Text style={styles.emptySub}>
              {items.length === 0
                ? 'Ready to store your credentials encrypted with AES-256.'
                : searchQuery
                ? `No results for "${searchQuery}"`
                : 'No passwords stored in this category.'}
            </Text>

            {items.length === 0 && (
              <View style={styles.emptyButtonsCol}>
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => {
                    setItemToEdit(null);
                    setIsAddEditModalVisible(true);
                  }}
                >
                  <Feather name="plus-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.emptyAddBtnText}>Add First Credential</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.emptyDemoBtn}
                  onPress={async () => {
                    await loadDemoData();
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                  }}
                >
                  <Feather name="zap" size={15} color={Colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.emptyDemoBtnText}>Load Sample Data (6 Items)</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          filteredItems.map(item => (
            <VaultItemCard
              key={item.id}
              item={item}
              onPress={() => setSelectedItemForDetail(item)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: -16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textDark,
  },
  clearBtn: {
    padding: 4,
  },
  countRow: {
    paddingHorizontal: 22,
    marginBottom: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: 110,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButtonsCol: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  emptyAddBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyDemoBtn: {
    backgroundColor: '#E8FDF3',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDemoBtnText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
});
